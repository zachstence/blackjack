import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http'
import { ClientEvent } from 'blackjack-types';
import { Game } from './game';

export class GameServer {
  private readonly server: SocketServer

  private readonly game: Game

  constructor(httpServer: HttpServer) {
    this.server = new SocketServer(httpServer, {
      cors: {
        origin: '*',
      },
    });
    
    this.server.on('connection', socket => {
      // TODO decouple playerId from socket ID
      const playerId = socket.id

      socket.onAny((event, args) => {
        this.game.handleEvent(event, args, playerId)    
      })
      
      socket.on('disconnect', () => {
        this.game.handleEvent(ClientEvent.Leave, {}, playerId)
      })
    })

    this.game = new Game({
      emitEvent: (event, args) => {
        this.server.emit(event, args)
        console.debug(`Emitted server event: ${event}`, { args })
      },
      emitEventTo: (playerId, event, args) => {
        // TODO decouple playerId from socket ID
        const socketId = playerId
        const socket = this.server.sockets.sockets.get(socketId)
        if (!socket) throw new Error(`Failed to find socket for playerId ${playerId}`)
        socket.emit(event, args)
      }
    })
  }
}