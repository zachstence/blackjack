import { ICard } from "./card";
import { IBoughtInsurance, IInsurance, isBoughtInsurance } from "./insurance";
import { IValue } from "./value";

export enum HandState {
    Hitting = 'Hitting',
    Standing = 'Standing',
    Busted = 'Busted',
}

export enum HandAction {
    Bet = 'Bet',
    Insure = 'Insure',
    Stand = 'Stand',
    Hit = 'Hit',
    Double = 'Double',
    Split = 'Split',
}

export enum HandSettleStatus {
    Blackjack = 'Blackjack',
    Win = 'Win',
    Push = 'Push',
    Lose = 'Lose',
}

interface IPlayerHand {
    type: 'player'
    id: string
    isRootHand: boolean

    cards: ICard[]
    bet?: number
    insurance?: IInsurance

    value: IValue
    state: HandState
    actions: HandAction[]

    settleStatus?: HandSettleStatus
    winnings?: number
}

export type IInsuredPlayerHand = IPlayerHand & { insurance: IBoughtInsurance }

export const isHandInsured = (hand: IPlayerHand): hand is IInsuredPlayerHand => typeof hand.insurance !== 'undefined' && isBoughtInsurance(hand.insurance)

export class PlayerHand implements IPlayerHand {
    readonly type = 'player'

    cards: ICard[] = []
    
    bet?: number
    
    insurance?: IInsurance
    
    value: IValue = { hard: 0 }
    
    state: HandState = HandState.Hitting

    actions: HandAction[] = []

    settleStatus?: HandSettleStatus;

    winnings?: number;

    constructor(readonly id: string, readonly isRootHand: boolean) {}
}

export type MaybeHiddenCard = ICard | 'hidden'

export class DealerHand {
    readonly type = "dealer"

    state: HandState = HandState.Hitting;

    cards: MaybeHiddenCard[] = [];

    value: IValue = { hard: 0 };
}

export type IHand = PlayerHand | DealerHand
