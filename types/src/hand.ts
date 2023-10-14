import { ICard } from "./card";
import { IValue } from "./value";

export enum HandState {
    Hitting = 'Hitting',
    Standing = 'Standing',
    Busted = 'Busted',
}

export enum HandSettleStatus {
    Blackjack = 'Blackjack',
    Win = 'Win',
    Push = 'Push',
    Lose = 'Lose',
}

export interface IPlayerHand {
    type: 'player'
    id: string
    state: HandState
    cards: ICard[]
    value: IValue
    bet?: number
    hasDoubled?: boolean
    settleStatus?: HandSettleStatus
    winnings?: number
}

export const EMPTY_PLAYER_HAND = (id: string, bet?: number): IPlayerHand => ({
    type: 'player',
    id,
    state: HandState.Hitting,
    cards: [],
    value: { hard: 0 },
    bet,
})

export type MaybeHiddenCard = ICard | 'hidden'

export interface IDealerHand {
    type: 'dealer'
    state: HandState
    cards: MaybeHiddenCard[]
    value: IValue
}

export const EMPTY_DEALER_HAND = (): IDealerHand => ({
    type: 'dealer',
    state: HandState.Hitting,
    cards: [],
    value: { hard: 0 },
})

export type IHand = IPlayerHand | IDealerHand
