import { ICard } from './card'

export interface IPlayer {
    id: string
    name: string
    hand: [] | [ICard, ICard]
    money: number
    bet?: number
}
