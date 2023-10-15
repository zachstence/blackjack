import { IPlayerHand } from './hand'

export interface IPlayer {
    id: string
    name: string
    hands: Record<string, IPlayerHand>
    money: number
    ready: boolean
}
