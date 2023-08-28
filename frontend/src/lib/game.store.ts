import { Socket, io } from "socket.io-client";
import { writable, type Readable } from "svelte/store";
import { PUBLIC_SOCKET_SERVER_URL } from '$env/static/public'

import { ServerEvent, type ServerEventArgs, ClientEvent, type ClientEventArgs, type IGame } from "blackjack-types";
import type { ServerEventHandler, ServerEventHandlers } from "./socket.types";

export class GameStore implements Readable<GameStore> {
  private _store = writable(this)

  private socket: Socket

  private serverEventHandlers: ServerEventHandlers

  private _game?: IGame

  constructor() {
    this.socket = io(PUBLIC_SOCKET_SERVER_URL, { autoConnect: false })
    this.socket.onAny((event, args) => this.onServerEvent(event, args))

    this.serverEventHandlers = {
      [ServerEvent.JoinSuccess]: this.handleJoinSuccess,
      [ServerEvent.PlayerJoined]: this.handlePlayerJoin,
      [ServerEvent.PlayerBet]: this.handlePlayerBet,
      [ServerEvent.GameStateChange]: this.handleGameStateChange,
      [ServerEvent.Dealt]: this.handleDealt,
      [ServerEvent.PlayerHit]: this.handlePlayerHit,
      [ServerEvent.PlayerStand]: this.handlePlayerStand,
      [ServerEvent.RevealDealerHand]: this.handleRevealDealerHand,
      [ServerEvent.DealerHit]: this.handleDealerHit,
      [ServerEvent.DealerStand]: this.handleDealerStand,
      [ServerEvent.DealerBust]: this.handleDealerBust,
      [ServerEvent.Settled]: this.handleSettled,
      [ServerEvent.ReadyPlayers]: this.handleReadyPlayers,
      [ServerEvent.ClearHandsAndBets]: this.handleClearHandsAndBets,
    }
  }

  subscribe: Readable<this>['subscribe'] = (run, invalidate) => {
    return this._store.subscribe(run, invalidate);
  };

  connect = (): void => {
    if (this.socket.connected) return
    this.socket.connect()
  }

  private onServerEvent = <E extends ServerEvent>(event: E, args: ServerEventArgs<E>): void => {
    console.debug(`Received server event ${event}`, { args })

    const handler = this.serverEventHandlers[event]
    if (typeof handler === 'undefined') {
      console.error(`No handler registered for ${event}`)
      return
    }
    
    try {
      handler(args)
    } catch (e) {
      console.error(`Handler for ${event} failed`, e)
    }

    this.tick()
  }

  private emitClientEvent = <E extends ClientEvent>(event: E, args: ClientEventArgs<E>): void => {
    // Make sure we're connected before emitting events
    if (!this.socket.connected) this.socket.connect()

    this.socket.emit(event, args)
    console.debug(`Emitted client event ${event}`, { args })
  }

  /** Notify store subscribers of new values */
  private tick = (): void => {
    this._store.set(this);
  };  

  // ====================
  // Gameplay
  // ====================
  get playerId(): string {
    return this.socket.id
  }

  get game(): IGame | undefined {
    return this._game
  }

  join = (name: string): void => {
    this.emitClientEvent(ClientEvent.PlayerJoin, { name })
  }

  bet = (amount: number): void => {
    this.emitClientEvent(ClientEvent.PlaceBet, { amount })
  }

  hit = (): void => {
    this.emitClientEvent(ClientEvent.Hit, {})
  }

  stand = (): void => {
    this.emitClientEvent(ClientEvent.Stand, {})
  }

  ready = (): void => {
    this.emitClientEvent(ClientEvent.Ready, {})
  }

  // ====================
  // Event Handlers
  // ====================
  private handleJoinSuccess: ServerEventHandler<ServerEvent.JoinSuccess> = args => {
    this._game = args.game
  }

  private handlePlayerJoin: ServerEventHandler<ServerEvent.PlayerJoined> = args => {
    if (!this._game) return
    this._game.players[args.player.id] = args.player
  }

  private handlePlayerBet: ServerEventHandler<ServerEvent.PlayerBet> = args => {
    if (!this._game) return
    const player = this._game.players[args.playerId]
    if (typeof player === 'undefined') throw new Error(`Player ${args.playerId} not found`)

    player.money = args.money
    player.bet = args.bet
  }

  private handleGameStateChange: ServerEventHandler<ServerEvent.GameStateChange> = args => {
    if (!this._game) return
    this._game.state = args.gameState
  }

  private handleDealt: ServerEventHandler<ServerEvent.Dealt> = args => {
    if (!this._game) return
    this._game.dealer.hand = args.dealerHand

    Object.keys(args.playerHands).forEach(playerId => {
      if (!this._game) return
      const player = this._game.players[playerId]
      player.hand = args.playerHands[playerId]
    })
  }

  private handlePlayerHit: ServerEventHandler<ServerEvent.PlayerHit> = ({ playerId, hand }) => {
    if (!this._game) return
    this._game.players[playerId].hand = hand
  }

  private handlePlayerStand: ServerEventHandler<ServerEvent.PlayerStand> = ({ playerId, handState }) => {
    if (!this._game) return
    const playerHand = this._game.players[playerId].hand
    if (typeof playerHand === 'undefined') return
    playerHand.state = handState
  }

  private handleRevealDealerHand: ServerEventHandler<ServerEvent.RevealDealerHand> = ({ hand }) => {
    if (!this._game) return
    this._game.dealer.hand = hand
  }

  private handleDealerHit: ServerEventHandler<ServerEvent.DealerHit> = ({ hand }) => {
    if (!this._game) return
    this._game.dealer.hand = hand
  }

  private handleDealerStand: ServerEventHandler<ServerEvent.DealerStand> = ({ handState }) => {
    if (!this._game) return
    this._game.dealer.hand.state = handState
  }

  private handleDealerBust: ServerEventHandler<ServerEvent.DealerBust> = ({ handState }) => {
    if (!this._game) return
    this._game.dealer.hand.state = handState
  }

  private handleSettled: ServerEventHandler<ServerEvent.Settled> = ({ players }) => {
    Object.entries(players)
      .forEach(([playerId, { hand, money }]) => {
        if (!this._game) return
        const player = this._game.players[playerId]
        if (!player) return
        player.hand = hand
        player.money = money
      })
  }

  private handleReadyPlayers: ServerEventHandler<ServerEvent.ReadyPlayers> = ({ players }) => {
    Object.entries(players)
      .forEach(([playerId, { ready }]) => {
        if (!this._game) return
        const player = this._game.players[playerId]
        if (!player) return
        player.ready = ready
      })
  }

  private handleClearHandsAndBets: ServerEventHandler<ServerEvent.ClearHandsAndBets> = ({ dealer, players }) => {
    if (!this._game) return
    this._game.dealer.hand = dealer.hand

    Object.entries(players)
      .forEach(([playerId, { hand, bet }]) => {
        if (!this._game) return
        const player = this._game.players[playerId]
        if (!player) return
        player.hand = hand
        player.bet = bet
      })
  }
}
