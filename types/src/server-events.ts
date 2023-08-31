import { GameState, IGame } from "./game"
import { EMPTY_HAND, HandState, IHand } from "./hand"
import { IPlayer } from "./player"

export enum ServerEvent {
    // To a specific player
    Error = 'Error',
    JoinSuccess = 'JoinSuccess',
    
    // To all players
    GameStateChange = 'GameStateChange',
    ReadyPlayers = 'ReadyPlayers',

    PlayerJoined = 'PlayerJoined',
    PlayerLeft = 'PlayerLeft',
    PlayerBet = 'PlayerBet',
    PlayerHit = 'PlayerHit',
    PlayerStand = 'PlayerStand',

    Dealt = 'Dealt',

    RevealDealerHand = 'RevealDealerHand',
    DealerHit = 'DealerHit',
    DealerStand = 'DealerStand',
    DealerBust = 'DealerBust',

    Settled = 'Settled',
    ClearHands = 'ClearHands',
}

type ArgsByServerEvent = {
    // To a specific player
    [ServerEvent.Error]: { message?: string }
    [ServerEvent.JoinSuccess]: { game: IGame }
    
    // To all players
    [ServerEvent.GameStateChange]: { gameState: GameState }
    [ServerEvent.ReadyPlayers]: {
        players: Record<string, { ready: boolean }>
    }

    [ServerEvent.PlayerJoined]: { player: IPlayer }
    [ServerEvent.PlayerLeft]: { playerId: string }
    [ServerEvent.PlayerBet]: {
        playerId: string
        bet: number
        money: number
    }
    [ServerEvent.PlayerHit]: {
        playerId: string
        hand: IHand
    }
    [ServerEvent.PlayerStand]: {
        playerId: string
        handState: HandState.Standing
    }

    [ServerEvent.Dealt]: {
        dealerHand: IHand
        playerHands: Record<string, IHand>
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

    [ServerEvent.Settled]: {
        players: Record<string, {
            hand: IHand
            money: number
        }>
    }
    [ServerEvent.ClearHands]: {
        dealer: {
            hand: IHand
        }
        players: Record<string, {
            hand: IHand
        }>
    }
}

export type ServerEventArgs<E extends ServerEvent> = ArgsByServerEvent[E]
