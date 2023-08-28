import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http'

import { ClientEvent, ClientEventArgs, GameState, ICard, IGame, IPlayer, ServerEvent, ServerEventArgs } from 'blackjack-types';
import { ClientEventHandlers, ClientEventHandler } from './types';
import { createDeck } from './createDeck';
import { durstenfeldShuffle } from './durstenfeldShuffle';

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
      [ClientEvent.PlayerJoin]: this.handlePlayerJoin,
      [ClientEvent.PlaceBet]: this.handlePlaceBet,
    }

    this.game = {
      state: GameState.PlacingBets,
      dealer: { hand: [] },
      players: {},
      shoe: [],
    }

    this.resetShoe()
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
  // Gameplay
  // ====================
  resetShoe = (): void => {
    const numDecks = 6 // TODO control by options in the client

    const decks = Array.from({ length: numDecks }).flatMap(createDeck)
    durstenfeldShuffle(decks)
    this.game.shoe = decks
  }

  deal = (): ServerEventArgs<ServerEvent.Dealt> => {
    const dealerHand = []
    const playerHands = Object.keys(this.game.players)
      .reduce<Record<string, ICard[]>>((acc, val) => {
        acc[val] = []
        return acc
      }, {})

    for (let i = 0; i < 2; i++) {
      for (const player of Object.values(this.game.players)) {
        if (!this.game.shoe.length) {
          throw new Error('Shoe empty!')
          // TODO redeal before shoe is empty
        }
        playerHands[player.id].push(this.game.shoe.pop()!)
      }
      dealerHand.push(this.game.shoe.pop()!)
    }

    this.game.dealer.hand = dealerHand as [ICard, ICard]
    Object.keys(this.game.players)
      .forEach(playerId => this.game.players[playerId]!.hand = playerHands[playerId] as [ICard, ICard])

    return {
      dealerHand: [dealerHand[0], 'hidden'],
      playerHands: playerHands as Record<string, [ICard, ICard]>,
    }
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
    this.emitServerEvent(ServerEvent.PlayerJoined, { player: newPlayer })
  };

  private handlePlaceBet: ClientEventHandler<ClientEvent.PlaceBet> = ({ amount }, socket) => {
    const player = this.game.players[socket.id]
    if (typeof player === 'undefined') {
      this.emitServerEventTo(socket, ServerEvent.Error, { message: 'You have not joined the game' })
      return
    }
    if (typeof player.bet !== 'undefined') {
      this.emitServerEventTo(socket,ServerEvent.Error, { message: 'You have already bet'})
      return
    }

    player.money -= amount
    player.bet = amount

    this.emitServerEvent(ServerEvent.PlayerBet, {
      playerId: player.id,
      bet: player.bet,
      money: player.money,
    })

    const allPlayersHaveBet = Object.values(this.game.players).every(p => typeof p.bet !== 'undefined')
    if (allPlayersHaveBet) {
      this.game.state = GameState.PlayersPlaying
      this.emitServerEvent(ServerEvent.GameStateChange, { gameState: this.game.state })
      const hands = this.deal()
      this.emitServerEvent(ServerEvent.Dealt, hands)
    }
  }
}
