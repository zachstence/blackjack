import { ICard } from "./card"
import { RoundState, IGame } from "./game"
import { IHand, IPlayerHand } from "./hand"
import { IPlayer } from "./player"

export enum ServerEvent {
    JoinSuccess = 'JoinSuccess',
    
    // To all players
    Reset = 'Reset',
    GameStateChange = 'GameStateChange',
    ReadyPlayers = 'ReadyPlayers',

    PlayerJoined = 'PlayerJoined',
    PlayerLeft = 'PlayerLeft',
    UpdatePlayerMoney = 'UpdatePlayerMoney',

    AddHand = 'AddHand',
    RemoveHand = 'RemoveHand',
    UpdateHand = 'UpdateHand',

    Dealt = 'Dealt',

    RevealDealerHand = 'RevealDealerHand',
    DealerHit = 'DealerHit',
    DealerStand = 'DealerStand',

    ClearHands = 'ClearHands',
}

type ArgsByServerEvent = {
    // To a specific player
    [ServerEvent.JoinSuccess]: { game: IGame }
    
    // To all players
    [ServerEvent.Reset]: {}
    [ServerEvent.GameStateChange]: { gameState: RoundState }
    [ServerEvent.ReadyPlayers]: {
        players: {
            [playerId: string]: {
                ready: boolean
            }
        }
    }

    [ServerEvent.PlayerJoined]: {
        player: IPlayer
        hand: IPlayerHand
    }
    [ServerEvent.PlayerLeft]: { playerId: string }

    [ServerEvent.UpdatePlayerMoney]: {
        playerId: string
        money: number
    }

    [ServerEvent.AddHand]: {
        handId: string
        hand: IPlayerHand
    }

    [ServerEvent.RemoveHand]: {
        handId: string
    }

    [ServerEvent.UpdateHand]: {
        handId: string
        hand: IPlayerHand
    }

    [ServerEvent.Dealt]: {
        dealerHand: IHand
        playerHands: { [handId: string]: IPlayerHand }
    }

    [ServerEvent.RevealDealerHand]: {
        hand: IHand
    }
    [ServerEvent.DealerHit]: {
        card: ICard
        hand: IHand
    }
    [ServerEvent.DealerStand]: {
        hand: IHand
    }
    
    [ServerEvent.ClearHands]: {
        dealerHand: IHand
        playerHands: {
            [handId: string]: IPlayerHand
        }
    }
}

export type ServerEventArgs<E extends ServerEvent> = ArgsByServerEvent[E]
