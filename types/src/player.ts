import { PlayerHand } from './hand'

export interface IPlayer {
    id: string
    name: string
    hands: Record<string, PlayerHand>
    money: number
    ready: boolean
}
