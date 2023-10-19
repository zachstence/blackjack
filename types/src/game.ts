import { ICard } from "./card";
import { IDealer } from "./dealer";
import { IPlayerHand } from "./hand";
import { IPlayer } from "./player";

export enum RoundState {
    PlayersReadying = 'PlayersReadying',
    PlacingBets = 'PlacingBets',
    Insuring = 'Insuring',
    PlayersPlaying = 'PlayersPlaying',
    DealerPlaying = 'DealerPlaying',
}

export type IGame = {
    roundState: RoundState
    dealer: IDealer
    shoe: ICard[]
    players: { [playerId: string]: IPlayer }
    playerHands: { [handId: string]: IPlayerHand }
}
