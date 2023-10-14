import { Socket, io } from "socket.io-client";
import { writable, type Readable } from "svelte/store";
import { env } from '$env/dynamic/public'

import { ServerEvent, type ServerEventArgs, ClientEvent, type ClientEventArgs, type IGame } from "blackjack-types";
import type { ServerEventHandler, ServerEventHandlers } from "./socket.types";

export class GameStore implements Readable<GameStore> {
  private _store = writable(this)

  private socket: Socket

  private serverEventHandlers: ServerEventHandlers

  private _game?: IGame

  constructor() {
    this.socket = io(env.PUBLIC_SOCKET_SERVER_URL, { autoConnect: false })
    this.socket.onAny((event, args) => this.onServerEvent(event, args))

    this.serverEventHandlers = {
      [ServerEvent.JoinSuccess]: this.handleJoinSuccess,
      
      [ServerEvent.GameStateChange]: this.handleGameStateChange,
      [ServerEvent.ReadyPlayers]: this.handleReadyPlayers,

      [ServerEvent.PlayerJoined]: this.handlePlayerJoined,
      [ServerEvent.PlayerLeft]: this.handlePlayerLeft,
      [ServerEvent.PlayerBet]: this.handlePlayerBet,
      [ServerEvent.PlayerHit]: this.handlePlayerHit,
      [ServerEvent.PlayerDoubled]: this.handlePlayerDoubled,
      [ServerEvent.PlayerSplit]: this.handlePlayerSplit,
      [ServerEvent.PlayerStand]: this.handlePlayerStand,
      
      [ServerEvent.UpdatePlayerInsurance]: this.handleUpdatePlayerInsurance,

      [ServerEvent.Dealt]: this.handleDealt,

      [ServerEvent.RevealDealerHand]: this.handleRevealDealerHand,
      [ServerEvent.DealerHit]: this.handleDealerHit,
      [ServerEvent.DealerStand]: this.handleDealerStand,
      [ServerEvent.DealerBust]: this.handleDealerBust,

      [ServerEvent.Settled]: this.handleSettled,
      [ServerEvent.ClearHands]: this.handleClearHands,

      [ServerEvent.Reset]: this.handleReset
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

  reset = (): void => {
    this.emitClientEvent(ClientEvent.Reset, {})
  }

  join = (name: string): void => {
    this.emitClientEvent(ClientEvent.PlayerJoin, { name })
  }

  ready = (): void => {
    this.emitClientEvent(ClientEvent.Ready, {})
  }

  bet = (handId: string, amount: number): void => {
    this.emitClientEvent(ClientEvent.PlaceBet, { handId, amount })
  }

  hit = (handId: string): void => {
    this.emitClientEvent(ClientEvent.Hit, { handId })
  }

  double = (handId: string): void => {
    this.emitClientEvent(ClientEvent.Double, { handId })
  }

  split = (handId: string): void => {
    this.emitClientEvent(ClientEvent.Split, { handId })
  }

  stand = (handId: string): void => {
    this.emitClientEvent(ClientEvent.Stand, { handId })
  }

  buyInsurance = (): void => {
    this.emitClientEvent(ClientEvent.BuyInsurance, {})
  }

  declineInsurance = (): void => {
    this.emitClientEvent(ClientEvent.DeclineInsurance, {})
  }

  // ====================
  // Event Handlers
  // ====================
  private handleReset: ServerEventHandler<ServerEvent.Reset> = () => {
    this._game = undefined
  }

  private handleJoinSuccess: ServerEventHandler<ServerEvent.JoinSuccess> = args => {
    this._game = args.game
  }

  private handleGameStateChange: ServerEventHandler<ServerEvent.GameStateChange> = args => {
    if (typeof this._game === 'undefined') return
    this._game.state = args.gameState
  }

  private handleReadyPlayers: ServerEventHandler<ServerEvent.ReadyPlayers> = ({ players }) => {
    Object.entries(players)
      .forEach(([playerId, { ready }]) => {
        if (typeof this._game === 'undefined') return
        const player = this._game.players[playerId]
        if (typeof player === 'undefined') return
        player.ready = ready
      })
  }

  private handlePlayerJoined: ServerEventHandler<ServerEvent.PlayerJoined> = args => {
    if (typeof this._game === 'undefined') return
    this._game.players[args.player.id] = args.player
  }

  private handlePlayerLeft: ServerEventHandler<ServerEvent.PlayerLeft> = args => {
    if (typeof this._game === 'undefined') return
    delete this._game.players[args.playerId]
  }

  private handlePlayerBet: ServerEventHandler<ServerEvent.PlayerBet> = ({ playerId, handId, money, bet }) => {
    if (typeof this._game === 'undefined') return
    const player = this._game.players[playerId]
    if (typeof player === 'undefined') return
    const hand = player.hands[handId]
    if (typeof hand === 'undefined') return

    player.money = money
    hand.bet = bet
  }

  private handlePlayerHit: ServerEventHandler<ServerEvent.PlayerHit> = ({ playerId, handId, hand }) => {
    if (typeof this._game === 'undefined') return
    const player = this._game.players[playerId]
    if (typeof player === 'undefined') return

    player.hands[handId] = hand
  }

  private handlePlayerDoubled: ServerEventHandler<ServerEvent.PlayerDoubled> = ({ playerId, money, handId, hand }) => {
    if (typeof this._game === 'undefined') return
    const player = this._game.players[playerId]
    if (typeof player === 'undefined') return
    
    player.money = money
    player.hands[handId] = hand
  }

  private handlePlayerSplit: ServerEventHandler<ServerEvent.PlayerSplit> = ({ playerId, money, hands }) => {
    if (typeof this._game === 'undefined') return
    const player = this._game.players[playerId]
    if (typeof player === 'undefined') return
    
    player.money = money
    player.hands = hands
  }

  private handlePlayerStand: ServerEventHandler<ServerEvent.PlayerStand> = ({ playerId, handId, hand }) => {
    if (typeof this._game === 'undefined') return
    const player = this._game.players[playerId]
    if (typeof player === 'undefined') return
    
    player.hands[handId] = hand
  }

  private handleDealt: ServerEventHandler<ServerEvent.Dealt> = ({ dealerHand, handsByPlayerId }) => {
    if (typeof this._game === 'undefined') return
    this._game.dealer.hand = dealerHand

    Object.entries(handsByPlayerId).forEach(([playerId, hand]) => {
      if (typeof this._game === 'undefined') return
      const player = this._game.players[playerId]
      player.hands[hand.id] = hand
    })
  }

  private handleRevealDealerHand: ServerEventHandler<ServerEvent.RevealDealerHand> = ({ hand }) => {
    if (typeof this._game === 'undefined') return
    this._game.dealer.hand = hand
  }

  private handleDealerHit: ServerEventHandler<ServerEvent.DealerHit> = ({ hand }) => {
    if (typeof this._game === 'undefined') return
    this._game.dealer.hand = hand
  }

  private handleDealerStand: ServerEventHandler<ServerEvent.DealerStand> = ({ handState }) => {
    if (typeof this._game === 'undefined') return
    this._game.dealer.hand.state = handState
  }

  private handleDealerBust: ServerEventHandler<ServerEvent.DealerBust> = ({ handState }) => {
    if (typeof this._game === 'undefined') return
    this._game.dealer.hand.state = handState
  }

  private handleSettled: ServerEventHandler<ServerEvent.Settled> = ({ settledHandsByPlayer }) => {
    Object.entries(settledHandsByPlayer).forEach(([playerId, { settledHands, money }]) => {
      if (typeof this._game === 'undefined') return
      const player = this._game.players[playerId]
      if (typeof player === 'undefined') return

      player.money = money

      Object.entries(settledHands).forEach(([handId, settledHand]) => {
        const hand = player.hands[handId]
        if (typeof hand === 'undefined') return

        hand.settleStatus = settledHand.settleStatus
        hand.winnings = settledHand.winnings
      })

    })
  }

  private handleClearHands: ServerEventHandler<ServerEvent.ClearHands> = ({ dealerHand, handsByPlayerId }) => {
    if (typeof this._game === 'undefined') return
    this._game.dealer.hand = dealerHand

    Object.entries(handsByPlayerId).forEach(([playerId, { hands }]) => {
      if (typeof this._game === 'undefined') return
      const player = this._game.players[playerId]
      if (typeof player === 'undefined') return

      player.hands = hands
    })
  }

  private handleUpdatePlayerInsurance: ServerEventHandler<ServerEvent.UpdatePlayerInsurance> = ({ playerId, insurance, playerMoney }) => {
    if (typeof this._game === 'undefined') return
    const player = this._game.players[playerId]
    if (typeof player === 'undefined') return

    player.insurance = insurance
    if (typeof playerMoney !== 'undefined') {
      player.money = playerMoney
    }
  }
}
