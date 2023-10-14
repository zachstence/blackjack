import { IPlayerHand } from './hand'
import { IBoughtInsurance, IDeclinedInsurance, IInsurance, isBoughtInsurance, isDeclinedInsurance } from './insurance'

export interface IPlayer {
    id: string
    name: string
    hands: Record<string, IPlayerHand>
    money: number
    ready: boolean
    insurance?: IInsurance
}

export type IPlayerBoughtInsurance = IPlayer & { insurance: IBoughtInsurance }

export type IPlayerDeclinedInsurance = IPlayer & { insurance: IDeclinedInsurance }

export const isPlayerInsured = (player: IPlayer): player is IPlayerBoughtInsurance => typeof player.insurance !== 'undefined' && isBoughtInsurance(player.insurance)

export const didPlayerDeclineInsurance = (player: IPlayer): player is IPlayerDeclinedInsurance => typeof player.insurance !== 'undefined' && isDeclinedInsurance(player.insurance)
