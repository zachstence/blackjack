import { IHand } from './hand'

export interface IPlayer {
    id: string
    name: string
    hand?: IHand
    money: number
    // TODO move this into IHand for splitting
    bet?: number
    ready: boolean
}
