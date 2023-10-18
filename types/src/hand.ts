import { ICard } from "./card";
import { IInsurance } from "./insurance";
import { IValue } from "./value";

// TODO add insuring
export enum HandStatus {
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

export type IHand = {
    cards: ICard[]
    value: IValue
    status: HandStatus
}

export type IPlayerHand = IHand & {
    id: string
    bet?: number
    insurance: IInsurance | null
    actions: HandAction[]
    settleStatus: HandSettleStatus | null
    winnings: number | null
}

export type MaybeHiddenCard = ICard | 'hidden'
