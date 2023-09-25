import { ICard } from "./card";
import { IDealer } from "./dealer";
import { IPlayer } from "./player";

export enum GameState {
    PlayersReadying = 'PlayersReadying',
    PlacingBets = 'PlacingBets',
    Dealt = 'Dealt',
    Insuring = 'Insuring',
    PlayersPlaying = 'PlayersPlaying',
    DealerPlaying = 'DealerPlaying',
}

export interface IGame {
    state: GameState

    dealer: IDealer

    players: Record<string, IPlayer>

    shoe: ICard[]
}