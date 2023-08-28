import { IHand } from './hand'

export interface IPlayer {
    id: string
    name: string
    hand: IHand
    money: number
    bet?: number
}
