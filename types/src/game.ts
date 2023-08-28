import { ICard } from "./card";
import { IDealer } from "./dealer";
import { IPlayer } from "./player";

export enum GameState {
    PlacingBets = 'PlacingBets',
    PlayersPlaying = 'PlayersPlaying',
    DealerPlaying = 'DealerPlaying',
    Settling = 'Setting',
}

export interface IGame {
    state: GameState

    dealer: IDealer

    players: Record<string, IPlayer>

    shoe: ICard[]
}