import { ICard } from "./card"
import { GameState, IGame } from "./game"
import { HandSettleStatus, HandState, IHand } from "./hand"
import { IPlayer } from "./player"

export enum ServerEvent {
    // To a specific player
    Error = 'Error',
    JoinSuccess = 'JoinSuccess',
    
    // To all players
    GameStateChange = 'GameStateChange',
    PlayerJoined = 'PlayerJoined',
    PlayerBet = 'PlayerBet',
    Dealt = 'Dealt',
    PlayerHit = 'PlayerHit',
    PlayerStand = 'PlayerStand',
    RevealDealerHand = 'RevealDealerHand',
    DealerHit = 'DealerHit',
    DealerStand = 'DealerStand',
    DealerBust = 'DealerBust',
    Settle = 'Settle',
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
    [ServerEvent.Dealt]: {
        dealerHand: IHand
        playerHands: Record<string, IHand>
    }
    [ServerEvent.PlayerHit]: {
        playerId: string
        hand: IHand
    }
    [ServerEvent.PlayerStand]: {
        playerId: string
        handState: HandState.Standing
    }
    [ServerEvent.RevealDealerHand]: {
        hand: IHand
    }
    [ServerEvent.DealerHit]: {
        hand: IHand
    }
    [ServerEvent.DealerStand]: {
        handState: HandState.Standing
    }
    [ServerEvent.DealerBust]: {
        handState: HandState.Busted
    }
    [ServerEvent.Settle]: {
        players: Record<string, {
            hand: IHand
            money: number
            bet: undefined
        }>
    }
}

export type ServerEventArgs<E extends ServerEvent> = ArgsByServerEvent[E]
