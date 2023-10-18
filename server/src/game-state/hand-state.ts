import { HandAction, HandSettleStatus, HandStatus, IBoughtInsurance, ICard, IDeclinedInsurance, IHand, IInsurance, IOfferedInsurance, IPlayerHand, IValue, InsuranceSettleStatus, InsuranceStatus, RankValue, RoundState } from "blackjack-types";
import { nanoid } from "nanoid";
import { GameState } from "./game-state";
import { ToClientJSON } from "./to-client-json";

export class HandState implements ToClientJSON<IHand> {
  protected _cards: ICard[] = []
  
  status = HandStatus.Hitting

  constructor(protected readonly root: GameState) {}
  
  get cards(): ICard[] {
    return this._cards
  }
  
  get value(): IValue {
    let soft = 0
    let hard = 0
    
    this._cards.forEach(card => {    
      const cardValue = RankValue[card.rank]
      if (cardValue.soft !== null) {
        soft += cardValue.soft
      } else {
        soft += cardValue.hard
      }
      
      hard += cardValue.hard
    })
    
    if (soft !== hard && soft <= 21) {
      return { soft, hard }
    }
    return { hard, soft: null }    
  }
  
  get blackjack(): boolean {
    return this._cards.length === 2 && this.bestValue === 21
  }
  
  get busted(): boolean {
    return this.status === HandStatus.Busted
  }
  
  get standing(): boolean {
    return this.status === HandStatus.Standing
  }
  
  dealCard = (card?: ICard): ICard => {
    const _card = card ?? this.root.draw()
    this._cards.push(_card)
    return _card
  }
  
  clear = (): void => {
    this._cards = []
    this.status = HandStatus.Hitting
  }
  
  toClientJSON(): IHand {
    return {
      cards: this.cards, // TODO optionally hide cards
      status: this.status, // TODO base off of partially hidden cards
      value: this.value, // TODO base off of partially hidden cards
    }
  }
  
  get bestValue(): number {
    const { hard, soft } = this.value
    if (soft === null) return hard
    if (soft <= 21) return soft
    return hard
  }
}

export class PlayerHandState extends HandState implements ToClientJSON<IPlayerHand> {
  readonly id = nanoid()

  bet?: number
  
  settleStatus?: HandSettleStatus
  
  winnings?: number
  
  private _insurance?: IInsurance
  
  constructor(readonly isRootHand: boolean, readonly playerId: string, protected readonly root: GameState) {
    super(root)
  }
  
  get insurance(): IInsurance | undefined {
    return this._insurance
  }
  
  get actions(): HandAction[] {
    if (!this.bet) return [HandAction.Bet]

    if (this.status !== HandStatus.Hitting) return []
    
    if (this.isRootHand && this.root.roundState === RoundState.Insuring) {
      return [HandAction.Insure]
    }
    
    if (this.root.roundState === RoundState.PlayersPlaying) {
      const actions: HandAction[] = [HandAction.Stand, HandAction.Hit]
      if (this.cards.length === 2) {
        actions.push(HandAction.Double)
        
        const cardsAreSameRank = this.cards[0].rank === this.cards[1].rank
        if (cardsAreSameRank) {
          actions.push(HandAction.Split)
        }
      }
      return actions
    }
    
    return []  
  }

  get canBet(): boolean {
    return this.actions.includes(HandAction.Bet)
  }
  
  get canInsure(): boolean {
    return this.actions.includes(HandAction.Insure)
  }
  
  get canStand(): boolean {
    return this.actions.includes(HandAction.Stand)
  }
  
  get canHit(): boolean {
    return this.actions.includes(HandAction.Hit)
  }
  
  get canDouble(): boolean {
    return this.actions.includes(HandAction.Double)
  }
  
  get canSplit(): boolean {
    return this.actions.includes(HandAction.Split)
  }
  
  get blackjack(): boolean {
    return this.isRootHand && super.blackjack
  }
  
  isInsured = (): this is PlayerHandState & { insurance: IBoughtInsurance } => {
    return this.insurance?.status === InsuranceStatus.Bought
  }
  
  offerInsurance = (): IOfferedInsurance => {
    const insurance: IOfferedInsurance = {
      status: InsuranceStatus.Offered
    }
    this._insurance = insurance
    return insurance
  }
  
  buyInsurance = (bet: number): IBoughtInsurance => {
    if (!this.canInsure) throw new Error(`Cannot insure hand ${this.id}`)
    if (!this.bet) throw new Error(`Cannot insure hand ${this.id}, it has no bet`)

    const insurance: IBoughtInsurance = {
      status: InsuranceStatus.Bought,
      bet,
    }
    this._insurance = insurance

    return insurance
  }

  declineInsurance = (): IDeclinedInsurance => {
    const insurance: IDeclinedInsurance = {
      status: InsuranceStatus.Declined
    }
    this._insurance = insurance
    return insurance
  }
  
  settleInsurance = (): { winnings: number } => {
    if (!this._insurance) throw new Error(`Cannot settle insurance for hand ${this.id}, hand insurance is undefined`)

    console.log('settleInsurance', { dealerBlackjack: this.root.dealer.hand.blackjack })

    if (this.root.dealer.hand.blackjack) {
      this.status = HandStatus.Standing

      if (this._insurance.status === InsuranceStatus.Bought) {
        const winnings = this._insurance.bet * 3
        this._insurance = {
          ...this._insurance,
          status: InsuranceStatus.Settled,
          settleStatus: InsuranceSettleStatus.Win,
          winnings,
        }
        return { winnings }
      }
    } else if (this._insurance.status === InsuranceStatus.Bought) {
      const winnings = 0
      this._insurance = {
        ...this._insurance,
        status: InsuranceStatus.Settled,
        settleStatus: InsuranceSettleStatus.Lose,
        winnings,
      }
      return { winnings }
    }
    
    return { winnings: 0 }
  }
  
  settleBet = (): { winnings: number } => {
    if (this.status === HandStatus.Hitting) throw new Error(`Cannot settle hand ${this.id}, still hitting`)
    if (this.root.dealer.hand.status === HandStatus.Hitting) throw new Error(`Cannot settle hand ${this.id}, dealer is still hitting`)
    if (!this.bet) throw new Error(`Cannot settle hand ${this.id}, it has no bet`)
    
    const {
      bestValue: dealerValue,
      busted: dealerBusted,
      standing: dealerStanding,
      blackjack: dealerBlackjack,
    } = this.root.dealer.hand
    
    const {
      bestValue: handValue,
      busted: handBusted,
      standing: handStanding,
      blackjack: handBlackjack,
    } = this
    
    const blackjack = handBlackjack && !dealerBlackjack                     // Player wins blackjack if they get blackjack and dealer doesn't

    const win =
      (handStanding && dealerBusted)                                        // Player wins if they stand and dealer busts
      || (handValue > dealerValue && handStanding)                          // Player wins if they beat dealer without busting
      || (handValue === dealerValue && handBlackjack && !dealerBlackjack)   // Player wins if they tie with dealer but got a blackjack

    const lose =
      handBusted                                                            // Player automatically loses if they bust
      || (handValue < dealerValue && dealerStanding)                        // Player loses if dealer beats them without busting
      || (handValue === dealerValue && dealerBlackjack && !handBlackjack)   // Player loses if they get 21 but dealer gets blackjack
    
    // Player pushes when both stand, their values match, and neither got a blackjack or both got blackjack
    const push =
      handStanding && dealerStanding
      && handValue === dealerValue
      && ((!handBlackjack && !dealerBlackjack) || (handBlackjack && dealerBlackjack))

    let winnings: number
    if (blackjack) {
      this.settleStatus = HandSettleStatus.Blackjack
      winnings = this.bet + (3/2 * this.bet) // 3:2
    } else if (win) {
      this.settleStatus = HandSettleStatus.Win
      winnings = this.bet + (1/1 * this.bet) // 1:1
    } else if (push) {
      this.settleStatus = HandSettleStatus.Push
      winnings = this.bet + (0/1 * this.bet) // 0:1
    } else if (lose) {
      this.settleStatus = HandSettleStatus.Lose
      winnings = 0 // No win
    } else {
      throw new Error(`Failed to determine round outcome. dealerCards: ${this.root.dealer.hand.cards}, handCards: ${this.cards}`)
    }
    this.winnings = winnings

    return { winnings }
  }

  clear = (): void => {
    this._cards = []
    this.status = HandStatus.Hitting
    this.bet = undefined
    this._insurance = undefined
    this.settleStatus = undefined
    this.winnings = undefined
  }

  toClientJSON(): IPlayerHand {
    return {
      ...super.toClientJSON(),
      id: this.id,
      bet: this.bet,
      insurance: this.insurance ?? null,
      actions: this.actions,
      settleStatus: this.settleStatus ?? null,
      winnings: this.winnings ?? null,
    }
  }
}