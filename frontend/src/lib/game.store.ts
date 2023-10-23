import { Socket, io } from 'socket.io-client';
import { writable, type Readable } from 'svelte/store';
import { env } from '$env/dynamic/public';

import {
  ServerEvent,
  type ServerEventArgs,
  ClientEvent,
  type ClientEventArgs,
  type IGame,
  type IPlayerHand,
} from 'blackjack-types';
import type { ServerEventHandler, ServerEventHandlers } from './socket.types';

export class GameStore implements Readable<GameStore> {
  private _store = writable(this);

  private socket: Socket;

  private serverEventHandlers: ServerEventHandlers;

  private _game?: IGame;

  constructor() {
    this.socket = io(env.PUBLIC_SOCKET_SERVER_URL, { autoConnect: false });
    this.socket.onAny((event, args) => this.onServerEvent(event, args));

    this.serverEventHandlers = {
      [ServerEvent.JoinSuccess]: this.handleJoinSuccess,

      [ServerEvent.GameStateChange]: this.handleGameStateChange,
      [ServerEvent.ReadyPlayers]: this.handleReadyPlayers,

      [ServerEvent.PlayerJoined]: this.handlePlayerJoined,
      [ServerEvent.PlayerLeft]: this.handlePlayerLeft,
      [ServerEvent.UpdatePlayerMoney]: this.handleUpdatePlayerMoney,

      [ServerEvent.AddHand]: this.handleAddHand,
      [ServerEvent.RemoveHand]: this.handleRemoveHand,
      [ServerEvent.UpdateHand]: this.handleUpdateHand,

      [ServerEvent.Dealt]: this.handleDealt,

      [ServerEvent.DealerHit]: this.handleDealerHit,
      [ServerEvent.DealerStand]: this.handleDealerStand,

      [ServerEvent.ClearHands]: this.handleClearHands,

      [ServerEvent.UpdateShoe]: this.handleUpdateShoe,

      [ServerEvent.Reset]: this.handleReset,
    };
  }

  subscribe: Readable<this>['subscribe'] = (run, invalidate) => {
    return this._store.subscribe(run, invalidate);
  };

  connect = (): void => {
    if (this.socket.connected) return;
    this.socket.connect();
  };

  private onServerEvent = <E extends ServerEvent>(event: E, args: ServerEventArgs<E>): void => {
    console.debug(`Received server event ${event}`, { args });

    const handler = this.serverEventHandlers[event];
    if (typeof handler === 'undefined') {
      console.error(`No handler registered for ${event}`);
      return;
    }

    try {
      handler(args);
    } catch (e) {
      console.error(`Handler for ${event} failed`, e);
    }

    this.tick();
  };

  private emitClientEvent = <E extends ClientEvent>(event: E, args: ClientEventArgs<E>): void => {
    // Make sure we're connected before emitting events
    if (!this.socket.connected) this.socket.connect();

    this.socket.emit(event, args);
    console.debug(`Emitted client event ${event}`, { args });
  };

  /** Notify store subscribers of new values */
  private tick = (): void => {
    this._store.set(this);
  };

  get debug(): boolean {
    if (typeof window === 'undefined') return false;
    return window.location.host.includes('localhost');
  }

  // ====================
  // Gameplay
  // ====================
  get game(): IGame | undefined {
    return this._game;
  }

  get myPlayerId(): string {
    return this.socket.id;
  }

  get myHands(): IPlayerHand[] {
    if (!this._game) return [];
    return Object.values(this._game.playerHands).filter((hand) => hand.playerId === this.myPlayerId);
  }

  get otherHands(): IPlayerHand[] {
    if (!this._game) return [];
    return Object.values(this._game.playerHands).filter((hand) => hand.playerId !== this.myPlayerId);
  }

  reset = (): void => {
    this.emitClientEvent(ClientEvent.Reset, {});
  };

  join = (name: string): void => {
    this.emitClientEvent(ClientEvent.PlayerJoin, { name });
  };

  ready = (): void => {
    this.emitClientEvent(ClientEvent.Ready, {});
  };

  bet = (handId: string, amount: number): void => {
    this.emitClientEvent(ClientEvent.PlaceBet, { handId, amount });
  };

  hit = (handId: string): void => {
    this.emitClientEvent(ClientEvent.Hit, { handId });
  };

  double = (handId: string): void => {
    this.emitClientEvent(ClientEvent.Double, { handId });
  };

  split = (handId: string): void => {
    this.emitClientEvent(ClientEvent.Split, { handId });
  };

  stand = (handId: string): void => {
    this.emitClientEvent(ClientEvent.Stand, { handId });
  };

  buyInsurance = (handId: string): void => {
    this.emitClientEvent(ClientEvent.BuyInsurance, { handId });
  };

  declineInsurance = (handId: string): void => {
    this.emitClientEvent(ClientEvent.DeclineInsurance, { handId });
  };

  // ====================
  // Event Handlers
  // ====================
  private handleReset: ServerEventHandler<ServerEvent.Reset> = () => {
    this._game = undefined;
  };

  private handleJoinSuccess: ServerEventHandler<ServerEvent.JoinSuccess> = (args) => {
    this._game = args.game;
  };

  private handleGameStateChange: ServerEventHandler<ServerEvent.GameStateChange> = (args) => {
    if (!this._game) return;
    this._game.roundState = args.gameState;
  };

  private handleReadyPlayers: ServerEventHandler<ServerEvent.ReadyPlayers> = ({ players }) => {
    Object.entries(players).forEach(([playerId, { ready }]) => {
      if (!this._game) return;
      const player = this._game.players[playerId];
      if (typeof player === 'undefined') return;
      player.ready = ready;
    });
  };

  private handlePlayerJoined: ServerEventHandler<ServerEvent.PlayerJoined> = ({ player, hand }) => {
    if (!this._game) return;
    this._game.players[player.id] = player;
    this._game.playerHands[hand.id] = hand;
  };

  private handlePlayerLeft: ServerEventHandler<ServerEvent.PlayerLeft> = (args) => {
    if (!this._game) return;
    delete this._game.players[args.playerId];
  };

  private handleUpdatePlayerMoney: ServerEventHandler<ServerEvent.UpdatePlayerMoney> = ({ playerId, money }) => {
    if (!this._game) return;
    this._game.players[playerId].money = money;
  };

  private handleDealt: ServerEventHandler<ServerEvent.Dealt> = ({ dealerHand, playerHands }) => {
    if (!this._game) return;
    this._game.dealer.hand = dealerHand;
    this._game.playerHands = playerHands;
  };

  private handleDealerHit: ServerEventHandler<ServerEvent.DealerHit> = ({ hand }) => {
    if (!this._game) return;
    this._game.dealer.hand = hand;
  };

  private handleDealerStand: ServerEventHandler<ServerEvent.DealerStand> = ({ hand }) => {
    if (!this._game) return;
    this._game.dealer.hand = hand;
  };

  private handleClearHands: ServerEventHandler<ServerEvent.ClearHands> = ({ dealerHand, playerHands }) => {
    if (!this._game) return;
    this._game.dealer.hand = dealerHand;
    this._game.playerHands = playerHands;
  };

  private handleAddHand: ServerEventHandler<ServerEvent.AddHand> = ({ handId, hand }) => {
    if (!this._game) return;
    this._game.playerHands[handId] = hand;
  };

  private handleRemoveHand: ServerEventHandler<ServerEvent.RemoveHand> = ({ handId }) => {
    if (!this._game) return;
    delete this._game.playerHands[handId];
  };

  private handleUpdateHand: ServerEventHandler<ServerEvent.UpdateHand> = ({ handId, hand }) => {
    if (!this._game) return;
    this._game.playerHands[handId] = hand;
  };

  private handleUpdateShoe: ServerEventHandler<ServerEvent.UpdateShoe> = ({ shoe }) => {
    if (!this._game) return;
    this._game.shoe = shoe;
  };
}
