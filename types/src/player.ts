import { IPlayerHand } from "./hand"

export type IPlayer = {
    id: string
    name: string
    hands: Record<string, IPlayerHand>
    money: number
    ready: boolean
}
