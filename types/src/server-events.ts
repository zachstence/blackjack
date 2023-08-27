import { IGame } from "./game"
import { IPlayer } from "./player"

export enum ServerEvent {
    // To a specific player
    JoinSuccess = 'JoinSuccess',
    
    // To all players
    PlayerJoined = 'PlayerJoined'
}

type ArgsByServerEvent = {
    // To a specific player
    [ServerEvent.JoinSuccess]: { game: IGame }

    // To all players
    [ServerEvent.PlayerJoined]: { player: IPlayer }
}

export type ServerEventArgs<E extends ServerEvent> = ArgsByServerEvent[E]
