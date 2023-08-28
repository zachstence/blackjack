import { ICard } from "./card";

export type MaybeHiddenCard = ICard | 'hidden'

export enum HandState {
    Hitting = 'Hitting',
    Standing = 'Standing',
    Busted = 'Busted',
}

export interface IHand {
    state: HandState
    cards: MaybeHiddenCard[]
    total: number
}
