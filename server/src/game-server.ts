import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http'

import { ClientEvent, ClientEventArgs, GameState, IGame, IPlayer, ServerEvent, ServerEventArgs } from 'blackjack-types';
import { ClientEventHandlers, ClientEventHandler } from './types';

export class GameServer {
  private clientEventHandlers: ClientEventHandlers

  private readonly server: SocketServer

  private readonly game: IGame

  constructor(httpServer: HttpServer) {
    this.server = new SocketServer(httpServer, {
      cors: {
        origin: '*',
      },
    });

    this.server.on('connection', socket => {
      socket.onAny((event, args) => this.onClientEvent(event, args, socket))
    })

    this.clientEventHandlers = {
      [ClientEvent.PlayerJoin]: this.handlePlayerJoin
    }

    this.game = {
      state: GameState.PlacingBets,
      dealer: { hand: [] },
      players: {},
      shoe: [],
    }
  }

  private onClientEvent = <E extends ClientEvent>(event: E, args: ClientEventArgs<E>, socket: Socket): void => {
    console.debug(`Received client event ${event}`, { socketId: socket.id, args })

    const handler = this.clientEventHandlers[event]
    if (typeof handler !== 'undefined') {
      handler(args, socket)
    } else {
      console.error(`No handler registered for ${event}`)
    }
  }

  private emitServerEvent = <E extends ServerEvent>(event: E, args: ServerEventArgs<E>): void => {
    this.server.emit(event, args)
    console.debug(`Emitted server event: ${event}`, { args })
  }

  private emitServerEventTo = <E extends ServerEvent>(socket: Socket, event: E, args: ServerEventArgs<E>): void => {
    socket.emit(event, args)
    console.debug(`Emitted server event to ${socket.id}: ${event}`, { args })
  }

  // ====================
  // Event Handlers
  // ====================
  private handlePlayerJoin: ClientEventHandler<ClientEvent.PlayerJoin> = ({ name }, socket) => {
    const newPlayer: IPlayer = {
      id: socket.id,
      name,
      hand: [],
      money: 1000,
    }
    this.game.players[socket.id] = newPlayer

    this.emitServerEventTo(socket, ServerEvent.JoinSuccess, { game: this.game })
  };
}
