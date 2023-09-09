import { GameState, IGame } from "./game"
import { HandSettleStatus, HandState, IHand } from "./hand"
import { IPlayer } from "./player"

export enum ServerEvent {
    // To a specific player
    Error = 'Error',
    JoinSuccess = 'JoinSuccess',
    
    // To all players
    Reset = 'Reset',
    GameStateChange = 'GameStateChange',
    ReadyPlayers = 'ReadyPlayers',

    PlayerJoined = 'PlayerJoined',
    PlayerLeft = 'PlayerLeft',
    PlayerBet = 'PlayerBet',
    PlayerHit = 'PlayerHit',
    PlayerDoubled = 'PlayerDoubled',
    PlayerSplit = 'PlayerSplit',
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
    [ServerEvent.Reset]: {}
    [ServerEvent.GameStateChange]: { gameState: GameState }
    [ServerEvent.ReadyPlayers]: {
        players: {
            [playerId: string]: {
                ready: boolean
            }
        }
    }

    [ServerEvent.PlayerJoined]: { player: IPlayer }
    [ServerEvent.PlayerLeft]: { playerId: string }
    [ServerEvent.PlayerBet]: {
        playerId: string
        money: number
        handId: string
        bet: number
    }
    [ServerEvent.PlayerHit]: {
        playerId: string
        handId: string
        hand: IHand
    }
    [ServerEvent.PlayerDoubled]: {
        playerId: string
        money: number
        handId: string
        hand: IHand
    }
    [ServerEvent.PlayerSplit]: {
        playerId: string
        money: number
        hands: {
            [handId: string]: IHand
        }
    }
    [ServerEvent.PlayerStand]: {
        playerId: string
        handId: string
        handState: HandState.Standing
    }

    [ServerEvent.Dealt]: {
        dealerHand: IHand
        handsByPlayerId: Record<string, IHand>
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
        settledHandsByPlayer: {
            [playerId: string]: {
                settledHands: {
                    [handId: string]: {
                        settleStatus: HandSettleStatus
                        winnings: number
                    }
                }
                money: number
            }
        }
    }
    [ServerEvent.ClearHands]: {
        dealerHand: IHand
        handsByPlayerId: {
            [playerId: string]: {
                hands: {
                    [handId: string]: IHand
                }
            }
        }
    }
}

export type ServerEventArgs<E extends ServerEvent> = ArgsByServerEvent[E]
