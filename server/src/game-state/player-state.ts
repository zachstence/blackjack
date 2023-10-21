import { GameState } from './game-state';
import { ToClientJSON } from './to-client-json';
import { IPlayer } from 'blackjack-types';

export class PlayerState implements ToClientJSON<IPlayer> {
  private _money = 1000;

  ready = false;

  constructor(
    readonly id: string,
    readonly name: string,
    private readonly root: GameState,
  ) {}

  get money(): number {
    return this._money;
  }

  giveMoney = (amount: number): void => {
    this._money += amount;
  };

  takeMoney = (amount: number): void => {
    // TODO handle no more money
    this._money -= amount;
  };

  // clearHands = (): void => {
  //     const hand = new PlayerHandState(true, this.id, this.root)
  //     this._hands = { [hand.id]: hand }
  // }

  // getHand = (handId: string): PlayerHandState => {
  //     const hand = this._hands[handId]
  //     if (!hand) throw new Error(`Hand ${handId} not found`)
  //     return hand
  // }

  // buyInsurance = (handId: string): IBoughtInsurance => {
  //     const hand = this.getHand(handId)
  //     if (!hand.canInsure) throw new Error(`Cannot insure hand ${handId}`)
  //     if (!hand.bet) throw new Error(`Cannot double hand ${handId}, it has no bet`)

  //     const insuranceBet = hand.bet / 2
  //     this.money -= insuranceBet

  //     return hand.buyInsurance(insuranceBet)
  // }

  // declineInsurance = (handId: string): IDeclinedInsurance => {
  //     const hand = this.getHand(handId)
  //     if (!hand.canInsure) throw new Error(`Cannot insure hand ${handId}`)

  //     return hand.declineInsurance()
  // }

  // settleInsurance = (): void => {
  //     const winnings = Object.values(this._hands).reduce<number>((acc, hand) => {
  //         const { winnings } = hand.settleInsurance()
  //         acc += winnings
  //         return acc
  //     }, 0)
  //     this.money += winnings
  // }

  // bet = (handId: string, bet: number): void => {
  //     // TODO should this be a function on PlayerHandState
  //     this.money -= bet // TODO handle 0 money
  //     this.getHand(handId).bet = bet
  // }

  // settleHands = (): void => {
  //     const winnings = Object.values(this._hands).reduce<number>((acc, hand) => {
  //         const { winnings } = hand.settleBet()
  //         acc += winnings
  //         return acc
  //     }, 0)
  //     this.money += winnings
  // }

  // hit = (handId: string): PlayerHandState => {
  //     const hand = this.getHand(handId)
  //     if (!hand.canHit) throw new Error(`Cannot hit hand ${handId}`)

  //     hand.dealCard()

  //     if (hand.bestValue > 21) hand.status = HandStatus.Busted
  //     else if (hand.bestValue === 21) hand.status = HandStatus.Standing
  //     else hand.status = HandStatus.Hitting

  //     return hand
  // }

  // double = (handId: string): PlayerHandState => {
  //     const hand = this.getHand(handId)
  //     if (!hand.canDouble) throw new Error(`Cannot double hand ${handId}`)
  //     if (!hand.bet) throw new Error(`Cannot double hand ${handId}, it has no bet`)

  //     // Double bet
  //     const originalBet = hand.bet
  //     hand.bet += originalBet
  //     this.money -= originalBet

  //     this.hit(handId)

  //     // Must stand after double
  //     if (hand.status === HandStatus.Hitting) {
  //         hand.status = HandStatus.Standing
  //     }

  //     return hand
  // }

  // split = (handId: string): [PlayerHandState, PlayerHandState] => {
  //     const hand = this.getHand(handId)
  //     if (!hand.canSplit) throw new Error(`Cannot split hand ${handId}`)
  //     if (!hand.bet) throw new Error(`Cannot double hand ${handId}, it has no bet`)

  //     // Original hand goes away
  //     delete this._hands[handId]

  //     // Player bets again
  //     const originalBet = hand.bet
  //     this.money -= originalBet

  //     // Cards get split into 2 hands
  //     const [card1, card2] = hand.cards

  //     const newHand1 = new PlayerHandState(false, this.id, this.root)
  //     newHand1.bet = originalBet
  //     newHand1.dealCard(card1)
  //     newHand1.dealCard()
  //     this._hands[newHand1.id] = newHand1

  //     const newHand2 = new PlayerHandState(false, this.id, this.root)
  //     newHand2.bet = originalBet
  //     newHand2.dealCard(card2)
  //     newHand2.dealCard()
  //     this._hands[newHand2.id] = newHand2

  //     return [newHand1, newHand2]
  // }

  // stand = (handId: string): PlayerHandState => {
  //     const hand = this.getHand(handId)
  //     if (!hand.canStand) throw new Error(`Cannot stand hand ${handId}`)

  //     hand.status = HandStatus.Standing

  //     return hand
  // }

  toClientJSON(): IPlayer {
    return {
      id: this.id,
      name: this.name,
      money: this.money,
      ready: this.ready,
    };
  }
}
