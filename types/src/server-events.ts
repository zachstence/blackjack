import { GameState, IGame } from "./game"
import { IPlayer } from "./player"

export enum ServerEvent {
    // To a specific player
    Error = 'Error',
    JoinSuccess = 'JoinSuccess',
    
    // To all players
    GameStateChange = 'GameStateChange',
    PlayerJoined = 'PlayerJoined',
    PlayerBet = 'PlayerBet',
}

type ArgsByServerEvent = {
    // To a specific player
    [ServerEvent.Error]: { message?: string }
    [ServerEvent.JoinSuccess]: { game: IGame }
    
    // To all players
    [ServerEvent.GameStateChange]: { gameState: GameState }
    [ServerEvent.PlayerJoined]: { player: IPlayer }
    [ServerEvent.PlayerBet]: {
        playerId: string
        bet: number
        money: number
    }
}

export type ServerEventArgs<E extends ServerEvent> = ArgsByServerEvent[E]