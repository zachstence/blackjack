import { ICard } from "./card";

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
    total: number
    settleStatus?: HandSettleStatus
    winnings?: number
}

export const EMPTY_HAND: IHand = {
    state: HandState.Hitting,
    cards: [],
    total: 0,
    settleStatus: undefined,
    winnings: undefined,
}
