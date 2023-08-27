import { Hand } from './hand'

export interface IPlayer {
    id: string
    name: string
    hand: Hand
    money: number
    bet?: number
}
