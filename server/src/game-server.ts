import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http'

import { ClientEvent, ClientEventArgs, GameState, IGame, IPlayer, RankValue, ServerEvent, ServerEventArgs } from 'blackjack-types';
import { ClientEventHandlers, ClientEventHandler } from './types';
import { createDeck } from './createDeck';
import { durstenfeldShuffle } from './durstenfeldShuffle';
import { HandState, IHand } from 'blackjack-types/src/hand';

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
      [ClientEvent.Hit]: this.handleHit,
      [ClientEvent.Stand]: this.handleStand,
    }

    this.game = {
      state: GameState.PlacingBets,
      dealer: {
        hand: {
          state: HandState.Hitting,
          cards: [],
          total: 0,
        },
      },
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
  private checkState = (): void => {
    if (this.game.state === GameState.PlacingBets) {
      const allPlayersHaveBet = Object.values(this.game.players)
        .every(p => typeof p.bet !== 'undefined')
      if (allPlayersHaveBet) {
        this.deal()
      }
    } else if (this.game.state === GameState.PlayersPlaying) {
      const allPlayerHandsStandOrBusted = Object.values(this.game.players)
        .every(p => p.hand.state === HandState.Standing || p.hand.state === HandState.Busted)
      if (allPlayerHandsStandOrBusted) {
        this.emitServerEvent(ServerEvent.RevealDealerHand, { hand: this.game.dealer.hand })

        this.game.state = GameState.DealerPlaying
        this.emitServerEvent(ServerEvent.GameStateChange, { gameState: this.game.state })
    
        this.playDealer()
      }
    } else if (this.game.state === GameState.DealerPlaying) {
      const dealerStandOrBust = this.game.dealer.hand.state === HandState.Standing || this.game.dealer.hand.state === HandState.Busted
      if (dealerStandOrBust) {
        this.settle()
      }
    } else if (this.game.state === GameState.Settling) {
      // Collect bets for next round after done settling
    }
  }

  private resetShoe = (): void => {
    const numDecks = 6 // TODO control by options in the client

    const decks = Array.from({ length: numDecks }).flatMap(createDeck)
    durstenfeldShuffle(decks)
    this.game.shoe = decks
  }

  private deal = (): void => {
    const dealerHand: IHand = {
      state: HandState.Hitting,
      cards: [],
      total: 0,
    }
    const playerHands = Object.keys(this.game.players)
      .reduce<Record<string, IHand>>((acc, val) => {
        acc[val] = {
          state: HandState.Hitting,
          cards: [],
          total: 0,
        }
        return acc
      }, {})

    for (let i = 0; i < 2; i++) {
      for (const player of Object.values(this.game.players)) {
        if (!this.game.shoe.length) {
          throw new Error('Shoe empty!')
          // TODO redeal before shoe is empty
        }
        const newCard = this.game.shoe.pop()!
        playerHands[player.id].cards.push(newCard)
        playerHands[player.id].total += RankValue[newCard.rank]
      }
      const newCard = this.game.shoe.pop()!
      dealerHand.cards.push(newCard)
      dealerHand.total += RankValue[newCard.rank]
    }

    this.game.dealer.hand = dealerHand
    Object.keys(this.game.players)
      .forEach(playerId => {
        this.game.players[playerId]!.hand = playerHands[playerId]
      })
    
    const dealerHandWithHiddenCard: IHand = {
      ...dealerHand,
      cards: [dealerHand.cards[0], 'hidden']
    }

    this.emitServerEvent(ServerEvent.Dealt, {
      dealerHand: dealerHandWithHiddenCard,
      playerHands
    })

    this.game.state = GameState.PlayersPlaying
    this.emitServerEvent(ServerEvent.GameStateChange, { gameState: this.game.state })
  }

  private playDealer = (): void => {
    const dealerHand = this.game.dealer.hand

    if (dealerHand.total > 21) {
      dealerHand.state = HandState.Busted
      this.checkState()
      return
    }

    if (dealerHand.total >= 17) {
      this.emitServerEvent(ServerEvent.DealerStand, { handState: HandState.Standing })
      this.checkState()
      return
    }

    const newCard = this.game.shoe.pop()!
    dealerHand.cards.push(newCard)
    dealerHand.total += RankValue[newCard.rank]
    this.playDealer()
  }

  private settle = (): void => {
    console.log('TODO settle bets')
  }

  // ====================
  // Event Handlers
  // ====================
  private handlePlayerJoin: ClientEventHandler<ClientEvent.PlayerJoin> = ({ name }, socket) => {
    const newPlayer: IPlayer = {
      id: socket.id,
      name,
      hand: {
        state: HandState.Hitting,
        cards: [],
        total: 0,
      },
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

    this.checkState()
  }

  private handleHit: ClientEventHandler<ClientEvent.Hit> = (_, socket) => {
    const player = this.game.players[socket.id]
    if (!player) return

    if (!this.game.shoe.length) throw new Error('Shoe empty!')

    const newCard = this.game.shoe.pop()!
    player.hand.cards.push(newCard)
    player.hand.total += RankValue[newCard.rank]

    if (player.hand.total > 21) {
      player.hand.state = HandState.Busted
    }

    this.emitServerEvent(ServerEvent.PlayerHit, {
      playerId: player.id,
      hand: player.hand,
    })

    this.checkState()
  }

  private handleStand: ClientEventHandler<ClientEvent.Stand> = (_, socket) => {
    const player = this.game.players[socket.id]
    if (!player) return

    player.hand.state = HandState.Standing
    this.emitServerEvent(ServerEvent.PlayerStand, {
      playerId: player.id,
      handState: player.hand.state,
    })

    this.checkState()
  }
}
