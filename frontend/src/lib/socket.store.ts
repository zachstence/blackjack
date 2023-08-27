import { ServerEvent, type ServerEventArgs, type ClientEvent, type ClientEventArgs } from "blackjack-types";
import { Socket, io } from "socket.io-client";
import { writable, type Readable } from "svelte/store";
import type { ServerEventHandler, ServerEventHandlers } from "./socket.types";

export class SocketStore implements Readable<SocketStore> {
  private _store = writable(this)

  private socket: Socket

  private serverEventHandlers: ServerEventHandlers

  constructor() {
    this.serverEventHandlers = {
      [ServerEvent.TestEvent]: this.handleTestEvent
    }

    this.socket = io('http://localhost:3000', { autoConnect: false })
    this.socket.onAny((event, args) => this.onServerEvent(event, args))
  }

  subscribe: Readable<this>['subscribe'] = (run, invalidate) => {
    return this._store.subscribe(run, invalidate);
  };

  connect = (): void => {
    if (this.socket.connected) return
    this.socket.connect()
  }

  onServerEvent = <E extends ServerEvent>(event: E, args: ServerEventArgs<E>): void => {
    console.debug(`Received server event ${event}`, { args })
    this.serverEventHandlers[event](args)
  }

  emitClientEvent = <E extends ClientEvent>(event: E, args: ClientEventArgs<E>): void => {
    // Make sure we're connected before emitting events
    if (!this.socket.connected) this.socket.connect()

    this.socket.emit(event, args)
    console.debug(`Emitted client event ${event}`, { args })
  }

  // ====================
  // Event Handlers
  // ====================
  private handleTestEvent: ServerEventHandler<ServerEvent.TestEvent> = () => {
    //
  }

}
