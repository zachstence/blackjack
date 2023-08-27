import { ClientEvent, ClientEventArgs, ServerEvent, ServerEventArgs } from 'blackjack-types';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { ClientEventHandlers, ClientEventHandler } from './types';

import { Server as HttpServer } from 'http'

export class SocketServer {
  private clientEventHandlers: ClientEventHandlers

  private readonly server: SocketIOServer

  constructor(httpServer: HttpServer) {
    this.server = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
      },
    });

    this.server.on('connection', socket => {
      socket.onAny((event, args) => this.onClientEvent(event, args, socket))
    })

    this.clientEventHandlers = {
      [ClientEvent.TestEvent]: this.handleTestEvent
    }
  }

  onClientEvent = <E extends ClientEvent>(event: E, args: ClientEventArgs<E>, socket: Socket): void => {
    console.debug(`Received client event ${event}`, { socketId: socket.id, args })
    this.clientEventHandlers[event](args, socket)
  }

  emitServerEvent = <E extends ServerEvent>(event: E, args: ServerEventArgs<E>): void => {
    this.server.emit(event, args)
    console.debug(`Emitted server event ${event}`, { args })
  }

  // ====================
  // Event Handlers
  // ====================
  private handleTestEvent: ClientEventHandler<ClientEvent.TestEvent> = () => {
    this.emitServerEvent(ServerEvent.TestEvent, { data: 'server data' })
  };
}
