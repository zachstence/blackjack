import { GameState, IGame } from "./game"
import { HandSettleStatus, HandState, DealerHand, PlayerHand } from "./hand"
import { IInsurance } from "./insurance"
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

    UpdateHand = 'UpdateHand',
    UpdateHandInsurance = 'UpdateHandInsurance',
    HandLostInsurance = 'HandLostInsurance',

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
        hand: PlayerHand
    }
    [ServerEvent.PlayerDoubled]: {
        playerId: string
        money: number
        handId: string
        hand: PlayerHand
    }
    [ServerEvent.PlayerSplit]: {
        playerId: string
        money: number
        hands: {
            [handId: string]: PlayerHand
        }
    }
    [ServerEvent.PlayerStand]: {
        playerId: string
        handId: string
        hand: PlayerHand
    }

    [ServerEvent.UpdateHand]: {
        playerId: string
        handId: string
        hand: PlayerHand
    }
    [ServerEvent.UpdateHandInsurance]: {
        playerId: string
        handId: string
        insurance: IInsurance
        playerMoney?: number
    }
    [ServerEvent.HandLostInsurance]: {
        playerId: string
        handId: string
        insurance: undefined
    }

    [ServerEvent.Dealt]: {
        dealerHand: DealerHand
        handsByPlayerId: Record<string, PlayerHand>
    }

    [ServerEvent.RevealDealerHand]: {
        hand: DealerHand
    }
    [ServerEvent.DealerHit]: {
        hand: DealerHand
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
        dealerHand: DealerHand
        handsByPlayerId: {
            [playerId: string]: {
                hands: {
                    [handId: string]: PlayerHand
                }
            }
        }
    }
}

export type ServerEventArgs<E extends ServerEvent> = ArgsByServerEvent[E]
