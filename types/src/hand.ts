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
    state: HandState
    cards: MaybeHiddenCard[]
    total: IValue
    settleStatus?: HandSettleStatus
    winnings?: number
}

export const EMPTY_HAND = (): IHand => ({
    state: HandState.Hitting,
    cards: [],
    total: { hard: 0 },
    settleStatus: undefined,
    winnings: undefined,
})
