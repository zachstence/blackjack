import { ICard } from "./card";
import { IValue } from "./value";

export enum HandState {
    Hitting = 'Hitting',
    Standing = 'Standing',
    Busted = 'Busted',
}

export type MaybeHiddenCard = ICard | 'hidden'

export enum HandSettleStatus {
    Blackjack = 'Blackjack',
    Win = 'Win',
    Push = 'Push',
    Lose = 'Lose',
}

export interface IHand {
    id: string
    state: HandState
    cards: MaybeHiddenCard[]
    total: IValue
    bet?: number
    hasDoubled?: boolean
    settleStatus?: HandSettleStatus
    winnings?: number
}

export const EMPTY_HAND = (id: string, bet?: number): IHand => ({
    id,
    state: HandState.Hitting,
    cards: [],
    total: { hard: 0 },
    bet,
})
