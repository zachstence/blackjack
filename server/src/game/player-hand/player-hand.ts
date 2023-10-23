import {
  IPlayerHand,
  HandSettleStatus,
  IInsurance,
  HandAction,
  RoundState,
  HandStatus,
  IBoughtInsurance,
  InsuranceStatus,
  IOfferedInsurance,
  IDeclinedInsurance,
  InsuranceSettleStatus,
  ICard,
} from 'blackjack-types';
import { nanoid } from 'nanoid';
import { Game } from '../game';
import { Hand } from '../hand';
import { Player } from '../player';
import { ToClientJSON } from '../to-client-json';

export class PlayerHand extends Hand implements ToClientJSON<IPlayerHand> {
  readonly id = nanoid();

  private _bet?: number;

  settleStatus?: HandSettleStatus;

  winnings?: number;

  private _insurance?: IInsurance;

  constructor(
    readonly isRootHand: boolean,
    readonly playerId: string,
    protected readonly root: Game,
  ) {
    super(root);
  }

  get bet(): number | undefined {
    return this._bet;
  }

  get insurance(): IInsurance | undefined {
    return this._insurance;
  }

  get actions(): HandAction[] {
    if (!this.bet && this.root.roundState === RoundState.PlacingBets) return [HandAction.Bet];

    if (this.status !== HandStatus.Hitting) return [];

    if (this.isRootHand && this.root.roundState === RoundState.Insuring) {
      return [HandAction.Insure];
    }

    if (this.root.roundState === RoundState.PlayersPlaying) {
      const actions: HandAction[] = [HandAction.Stand, HandAction.Hit];
      if (this.cards.length === 2) {
        actions.push(HandAction.Double);

        const cardsAreSameRank = this.cards[0].rank === this.cards[1].rank;
        if (cardsAreSameRank) {
          actions.push(HandAction.Split);
        }
      }
      return actions;
    }

    return [];
  }

  get canBet(): boolean {
    return this.actions.includes(HandAction.Bet);
  }

  get canInsure(): boolean {
    return this.actions.includes(HandAction.Insure);
  }

  get canStand(): boolean {
    return this.actions.includes(HandAction.Stand);
  }

  get canHit(): boolean {
    return this.actions.includes(HandAction.Hit);
  }

  get canDouble(): boolean {
    return this.actions.includes(HandAction.Double);
  }

  get canSplit(): boolean {
    return this.actions.includes(HandAction.Split);
  }

  get blackjack(): boolean {
    return this.isRootHand && super.blackjack;
  }

  placeBet(amount: number): void {
    this.player.takeMoney(amount);
    this._bet = amount;
  }

  isInsured(): this is PlayerHand & { insurance: IBoughtInsurance } {
    return this.insurance?.status === InsuranceStatus.Bought;
  }

  offerInsurance(): IOfferedInsurance {
    const insurance: IOfferedInsurance = {
      status: InsuranceStatus.Offered,
    };
    this._insurance = insurance;
    return insurance;
  }

  buyInsurance(): IBoughtInsurance {
    if (!this.canInsure) throw new Error(`Cannot insure hand ${this.id}`);
    if (!this.bet) throw new Error(`Cannot insure hand ${this.id}, it has no bet`);

    // TODO customizable insurance bet
    const bet = this.bet / 2;
    this.player.takeMoney(bet);

    const insurance: IBoughtInsurance = {
      status: InsuranceStatus.Bought,
      bet,
    };
    this._insurance = insurance;

    return insurance;
  }

  declineInsurance(): IDeclinedInsurance {
    const insurance: IDeclinedInsurance = {
      status: InsuranceStatus.Declined,
    };
    this._insurance = insurance;
    return insurance;
  }

  hit(): ICard {
    if (!this.actions.includes(HandAction.Hit)) throw new Error(`Cannot hit hand ${this.id}`);
    return super.hit();
  }

  double(): void {
    if (!this.actions.includes(HandAction.Double)) throw new Error(`Cannot double hand ${this.id}`);
    if (!this._bet) throw new Error(`Cannot double hand ${this.id}, it has no bet`);
    this.player.takeMoney(this._bet);
    this._bet += this._bet;
    this.hit();

    // Must stand after doubling
    if (this.status === HandStatus.Hitting) {
      this.status = HandStatus.Standing;
    }
  }

  stand(): void {
    if (this.status === HandStatus.Standing) return;
    if (!this.actions.includes(HandAction.Stand)) throw new Error(`Cannot stand hand ${this.id}`);
    super.stand();
  }

  settleInsurance(): void {
    if (!this._insurance) throw new Error(`Cannot settle insurance for hand ${this.id}, hand insurance is undefined`);

    if (this.root.dealer.hand.blackjack) {
      this.status = HandStatus.Standing;

      if (this._insurance.status === InsuranceStatus.Bought) {
        const winnings = this._insurance.bet * 3;
        this._insurance = {
          ...this._insurance,
          status: InsuranceStatus.Settled,
          settleStatus: InsuranceSettleStatus.Win,
          winnings,
        };
        this.player.giveMoney(winnings);
      }
    } else if (this._insurance.status === InsuranceStatus.Bought) {
      this._insurance = {
        ...this._insurance,
        status: InsuranceStatus.Settled,
        settleStatus: InsuranceSettleStatus.Lose,
        winnings: 0,
      };
    }
  }

  settleBet(): void {
    if (this.status === HandStatus.Hitting) throw new Error(`Cannot settle hand ${this.id}, still hitting`);
    if (this.root.dealer.hand.status === HandStatus.Hitting)
      throw new Error(`Cannot settle hand ${this.id}, dealer is still hitting`);
    if (!this.bet) throw new Error(`Cannot settle hand ${this.id}, it has no bet`);

    const dealerValue = this.root.dealer.hand.getBestValue();
    const { busted: dealerBusted, standing: dealerStanding, blackjack: dealerBlackjack } = this.root.dealer.hand;

    const { busted: handBusted, standing: handStanding, blackjack: handBlackjack } = this;
    const handValue = this.getBestValue();

    const blackjack = handBlackjack && !dealerBlackjack; // Player wins blackjack if they get blackjack and dealer doesn't

    const win =
      (handStanding && dealerBusted) || // Player wins if they stand and dealer busts
      (handValue > dealerValue && handStanding); // Player wins if they beat dealer without busting

    const lose =
      handBusted || // Player automatically loses if they bust
      (handValue < dealerValue && dealerStanding) || // Player loses if dealer beats them without busting
      (handValue === dealerValue && dealerBlackjack && !handBlackjack); // Player loses if they get 21 but dealer gets blackjack

    // Player pushes when both stand, their values match, and neither got a blackjack or both got blackjack
    const push =
      handStanding &&
      dealerStanding &&
      handValue === dealerValue &&
      ((!handBlackjack && !dealerBlackjack) || (handBlackjack && dealerBlackjack));

    let winnings: number;
    if (blackjack) {
      this.settleStatus = HandSettleStatus.Blackjack;
      winnings = this.bet + (3 / 2) * this.bet; // 3:2
    } else if (win) {
      this.settleStatus = HandSettleStatus.Win;
      winnings = this.bet + (1 / 1) * this.bet; // 1:1
    } else if (push) {
      this.settleStatus = HandSettleStatus.Push;
      winnings = this.bet + (0 / 1) * this.bet; // 0:1
    } else if (lose) {
      this.settleStatus = HandSettleStatus.Lose;
      winnings = 0; // No win
    } else {
      throw new Error(
        `Failed to determine round outcome. dealerCards: ${this.root.dealer.hand.cards}, handCards: ${this.cards}`,
      );
    }
    this.winnings = winnings;

    this.player.giveMoney(winnings);
  }

  clear(): void {
    this._cards = [];
    this.status = HandStatus.Hitting;
    this._bet = undefined;
    this._insurance = undefined;
    this.settleStatus = undefined;
    this.winnings = undefined;
  }

  toClientJSON(): IPlayerHand {
    return {
      ...super.toClientJSON(),
      id: this.id,
      playerId: this.playerId,
      bet: this.bet,
      insurance: this.insurance ?? null,
      actions: this.actions,
      settleStatus: this.settleStatus ?? null,
      winnings: this.winnings ?? null,
    };
  }

  private get player(): Player {
    const player = this.root.players.find(player => player.id === this.playerId);
    if (!player) throw new Error(`Cannot find player for hand ${{ handId: this.id, playerId: this.playerId }}`);
    return player;
  }
}
