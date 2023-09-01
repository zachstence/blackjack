import { IHand } from './hand'

export interface IPlayer {
    id: string
    name: string
    hands: Record<string, IHand>
    money: number
    ready: boolean
}
