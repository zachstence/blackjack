import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http'

import { ClientEvent, ClientEventArgs, GameState, ICard, IGame, IPlayer, RankValue, ServerEvent, ServerEventArgs } from 'blackjack-types';
import { ClientEventHandlers, ClientEventHandler } from './types';
import { createDeck } from './createDeck';
import { durstenfeldShuffle } from './durstenfeldShuffle';
import { EMPTY_HAND, HandSettleStatus, HandState, IHand } from 'blackjack-types';

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

      socket.on('disconnect', () => this.onSocketDisconnect(socket))
    })

    this.clientEventHandlers = {
      [ClientEvent.PlayerJoin]: this.handlePlayerJoin,
      [ClientEvent.PlaceBet]: this.handlePlaceBet,
      [ClientEvent.Hit]: this.handleHit,
      [ClientEvent.Stand]: this.handleStand,
      [ClientEvent.Ready]: this.handleReady,
    }

    this.game = {
      state: GameState.PlayersReadying,
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

  private emitReadyPlayers = (): void => {
    const players = Object.values(this.game.players)
      .reduce<ServerEventArgs<ServerEvent.ReadyPlayers>['players']>((acc, player) => {
        acc[player.id] = { ready: player.ready }
        return acc
      }, {})
    this.emitServerEvent(ServerEvent.ReadyPlayers, { players })
  }

  private onSocketDisconnect = (socket: Socket): void => {
    const playerId = socket.id
    delete this.game.players[playerId]
    this.emitServerEvent(ServerEvent.PlayerLeft, { playerId })
  }

  // ====================
  // Gameplay
  // ====================
  get playersInRound(): IPlayer[] {
    return Object.values(this.game.players).filter(player => player.hand)
  }

  private checkState = (): void => {
    if (this.game.state === GameState.PlayersReadying) {
      const allPlayersReady = Object.values(this.game.players).every(player => player.ready)
      if (allPlayersReady) {
        this.collectBets()
      }
    } else if (this.game.state === GameState.PlacingBets) {
      const allPlayersHaveBet = this.playersInRound.every(p => typeof p.bet !== 'undefined')
      if (allPlayersHaveBet) {
        this.deal()
      }
    } else if (this.game.state === GameState.PlayersPlaying) {
      const allPlayerHandsStandOrBusted = this.playersInRound.every(p => p.hand!.state === HandState.Standing || p.hand!.state === HandState.Busted)
      if (allPlayerHandsStandOrBusted) {
        this.emitServerEvent(ServerEvent.RevealDealerHand, { hand: this.game.dealer.hand })

        this.game.state = GameState.DealerPlaying
        this.emitServerEvent(ServerEvent.GameStateChange, { gameState: this.game.state })
    
        this.playDealer()
      }
    } else if (this.game.state === GameState.DealerPlaying) {
      const dealerStandOrBust = this.game.dealer.hand.state === HandState.Standing || this.game.dealer.hand.state === HandState.Busted
      if (dealerStandOrBust) {
        this.unReadyPlayers()

        this.game.state = GameState.PlayersReadying
        this.emitServerEvent(ServerEvent.GameStateChange, { gameState: this.game.state })

        this.settle()
      }
    }
  }

  private resetShoe = (): void => {
    const numDecks = 6 // TODO control by options in the client

    const decks = Array.from({ length: numDecks }).flatMap(createDeck)
    durstenfeldShuffle(decks)
    this.game.shoe = decks
  }

  private collectBets = (): void => {
    Object.values(this.game.players).forEach(player => { player.hand = EMPTY_HAND })
    const players = Object.values(this.game.players)
      .reduce<ServerEventArgs<ServerEvent.ClearHandsAndBets>['players']>((acc, player) => {
        acc[player.id] = {
          hand: EMPTY_HAND,
          bet: undefined,
        }
        return acc
      }, {})
    this.emitServerEvent(ServerEvent.ClearHandsAndBets, {
      dealer: { hand: EMPTY_HAND },
      players,
    })

    this.game.state = GameState.PlacingBets
    this.emitServerEvent(ServerEvent.GameStateChange, { gameState: this.game.state })
  }

  private deal = (): void => {
    const dealerHand: IHand = {
      state: HandState.Hitting,
      cards: [],
      total: 0,
    }
    const playerHands = this.playersInRound
      .reduce<Record<string, IHand>>((acc, player) => {
        acc[player.id] = {
          state: HandState.Hitting,
          cards: [],
          total: 0,
        }
        return acc
      }, {})

    for (let i = 0; i < 2; i++) {
      for (const player of this.playersInRound) {
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
    this.playersInRound.forEach(player => { player.hand = playerHands[player.id] })
    
    const dealerHandWithHiddenCard: IHand = {
      ...dealerHand,
      cards: [dealerHand.cards[0], 'hidden'],
      total: RankValue[(dealerHand.cards[0] as ICard).rank],
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
      this.emitServerEvent(ServerEvent.DealerBust, { handState: HandState.Busted})
      this.checkState()
      return
    }

    if (dealerHand.total >= 17) {
      dealerHand.state = HandState.Standing
      this.emitServerEvent(ServerEvent.DealerStand, { handState: HandState.Standing })
      this.checkState()
      return
    }

    const newCard = this.game.shoe.pop()!
    dealerHand.cards.push(newCard)
    dealerHand.total += RankValue[newCard.rank]
    this.emitServerEvent(ServerEvent.DealerHit, { hand: dealerHand })
    this.playDealer()
  }

  private settle = (): void => {
    const { dealer } = this.game
    const dealerTotal = dealer.hand.total
    const dealerBusted = dealer.hand.state === HandState.Busted
    const dealerStanding = dealer.hand.state === HandState.Standing
    const dealerBlackjack = dealerTotal === 21 && dealer.hand.cards.length === 2

    for (const player of this.playersInRound) {
      if (typeof player.hand === 'undefined') continue
      if (player.hand.state === HandState.Hitting) continue
      if (typeof player.bet === 'undefined') continue

      const playerTotal = player.hand.total
      const playerBusted = player.hand.state === HandState.Busted
      const playerStanding = player.hand.state === HandState.Standing
      const playerBlackjack = playerTotal === 21 && player.hand.cards.length === 2

      const lose =
        playerBusted                                        // Player automatically loses if they bust
        || (playerTotal < dealerTotal && dealerStanding)    // Player loses if dealer beats them without busting

      const win =
        (playerStanding && dealerBusted)                    // Player wins if they stand and dealer busts
        || (playerTotal > dealerTotal && playerStanding)    // Player wins if they beat dealer without busting
        || (playerTotal === dealerTotal && playerBlackjack) // Player wins if they tie with dealer but got a blackjack

      // Player pushes when both stand, their totals match, and neither got a blackjack
      const push =
        playerStanding && dealerStanding
        && playerTotal === dealerTotal
        && !playerBlackjack && !dealerBlackjack

      if (win && playerBlackjack) {
        player.hand.settleStatus = HandSettleStatus.Blackjack
        player.hand.winnings = 2.5 * player.bet
      } else if (win) {
        player.hand.settleStatus = HandSettleStatus.Win
        player.hand.winnings = 2 * player.bet
      } else if (push) {
        player.hand.settleStatus = HandSettleStatus.Push
        player.hand.winnings = player.bet
      } else if (lose) {
        player.hand.settleStatus = HandSettleStatus.Lose
        player.hand.winnings = 0
      } else {
        throw new Error(`Failed to determine round outcome. dealerCards: ${dealer.hand.cards}, playerCards: ${player.hand.cards}`)
      }

      player.money += player.hand.winnings
      player.bet = undefined
    }

    type SettledPlayers = Record<string, {
      hand: IHand
      money: number
      bet: undefined
    }>
    const players = this.playersInRound
      .reduce<SettledPlayers>((acc, player) => {
        acc[player.id] = {
          hand: player.hand!,
          money: player.money,
          bet: undefined,
        }
        return acc
      }, {})
    this.emitServerEvent(ServerEvent.Settled, { players })

    this.checkState()
  }

  private unReadyPlayers = (): void => {
    Object.values(this.game.players).forEach(player => player.ready = false)
    this.emitReadyPlayers()
  }

  // ====================
  // Event Handlers
  // ====================
  private handlePlayerJoin: ClientEventHandler<ClientEvent.PlayerJoin> = ({ name }, socket) => {
    const newPlayer: IPlayer = {
      id: socket.id,
      name,
      hand: undefined,
      money: 1000,
      ready: false,
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
    if (!player.hand) return

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
    if (!player.hand) return

    player.hand.state = HandState.Standing
    this.emitServerEvent(ServerEvent.PlayerStand, {
      playerId: player.id,
      handState: player.hand.state,
    })

    this.checkState()
  }

  private handleReady: ClientEventHandler<ClientEvent.Ready> = (_, socket) => {
    const player = this.game.players[socket.id]
    if (!player) return

    player.ready = true
    this.emitReadyPlayers()
    this.checkState()
  }
}
