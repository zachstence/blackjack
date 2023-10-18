import { ICard } from "./card";
import { IDealer } from "./dealer";
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
    players: Record<string, IPlayer>
    shoe: ICard[]
}
