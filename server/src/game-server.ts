import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http'
import { nanoid } from 'nanoid';

import { ClientEvent, ClientEventArgs, GameState, ICard, IGame, IPlayer, IValue, RankValue, ServerEvent, ServerEventArgs } from 'blackjack-types';
import { ClientEventHandlers, ClientEventHandler } from './types';
import { createDeck } from './createDeck';
import { durstenfeldShuffle } from './durstenfeldShuffle';
import { EMPTY_HAND, HandSettleStatus, HandState, IHand } from 'blackjack-types';
import { DEALER_HAND_ID } from './constants';

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
      [ClientEvent.Ready]: this.handleReady,
      [ClientEvent.PlaceBet]: this.handlePlaceBet,
      [ClientEvent.Hit]: this.handleHit,
      [ClientEvent.Double]: this.handleDouble,
      [ClientEvent.Stand]: this.handleStand,
    }

    this.game = {
      state: GameState.PlayersReadying,
      dealer: { hand: EMPTY_HAND(DEALER_HAND_ID) },
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
    this.checkGameState()
  }

  // ====================
  // Gameplay
  // ====================
  get allPlayers(): IPlayer[] {
    return Object.values(this.game.players)
  }

  get playersInRound(): IPlayer[] {
    return this.allPlayers.filter(player => {
      const playerHasHand = Object.values(player.hands).length > 0
      return playerHasHand
    })
  }

  get allPlayersReady(): boolean {
    return this.allPlayers.every(player => player.ready)
  }

  get playersInRoundHaveFinishedBetting(): boolean {
    return this.playersInRound.every(player => {
      return Object.values(player.hands).every(hand => {
        const handHasBet = typeof hand.bet !== 'undefined'
        return handHasBet
      })
    })
  }

  get playersInRoundHaveFinishedHitting(): boolean {
    // return this.playersInRound.every(p => p.hand!.state === HandState.Standing || p.hand!.state === HandState.Busted)
    return this.playersInRound.every(player => {
      return Object.values(player.hands).every(hand => {
        const hasFinishedHitting = hand.state === HandState.Standing || hand.state === HandState.Busted
        return hasFinishedHitting
      })
    })
  }

  get dealerIsDonePlaying(): boolean {
    const dealerHandState = this.game.dealer.hand.state
    const dealerIsDonePlaying = dealerHandState === HandState.Standing || dealerHandState === HandState.Busted
    return dealerIsDonePlaying
  }

  private checkGameState = (): void => {
    console.debug('checkGameState', {
      gameState: this.game.state,
      allPlayersReady: this.allPlayersReady,
      playersInRoundHaveFinishedBetting: this.playersInRoundHaveFinishedBetting,
      playersInRoundHaveFinishedHitting: this.playersInRoundHaveFinishedHitting,
      dealerIsDonePlaying: this.dealerIsDonePlaying,
    })

    if (this.game.state === GameState.PlayersReadying && this.allPlayersReady) {
      this.clearHands()
      this.collectBets()
      return
    }
    
    if (this.game.state === GameState.PlacingBets && this.playersInRoundHaveFinishedBetting) {
      this.deal()
      return
    }
    
    if (this.game.state === GameState.PlayersPlaying && this.playersInRoundHaveFinishedHitting) {
      this.playDealer()
      return
    }
    
    if (this.game.state === GameState.DealerPlaying && this.dealerIsDonePlaying) {
      this.settle()
      this.unReadyPlayers()
      return
    }
  }

  private resetShoe = (): void => {
    const numDecks = 6 // TODO control by options in the client

    const decks = Array.from({ length: numDecks }).flatMap(createDeck)
    durstenfeldShuffle(decks)
    this.game.shoe = decks
  }

  private collectBets = (): void => {
    this.game.state = GameState.PlacingBets
    this.emitServerEvent(ServerEvent.GameStateChange, { gameState: this.game.state })
  }

  private deal = (): void => {
    const dealerHand = this.game.dealer.hand

    for (let i = 0; i < 2; i++) {
      for (const player of this.playersInRound) {
        const playerHand = Object.values(player.hands)[0]
        if (typeof playerHand === 'undefined') throw new Error(`Cannot deal to player ${player.id}, they don't have a hand`)

        console.log('\n===\nDealing to', player.id)
        this.dealCardToHand(playerHand)
      }
      console.log('\n===\nDealing to dealer')
      this.dealCardToHand(dealerHand)
    }
    
    const dealerHandWithHiddenCard: IHand = {
      ...dealerHand,
      cards: [dealerHand.cards[0], 'hidden'],
      total: RankValue[(dealerHand.cards[0] as ICard).rank],
    }

    const handsByPlayerId = this.playersInRound.reduce<Record<string, IHand>>((acc, player) => {
      const playerHand = Object.values(player.hands)[0]!
      acc[player.id] = playerHand
      return acc
    }, {})

    this.emitServerEvent(ServerEvent.Dealt, {
      dealerHand: dealerHandWithHiddenCard,
      handsByPlayerId,
    })

    this.game.state = GameState.PlayersPlaying
    this.emitServerEvent(ServerEvent.GameStateChange, { gameState: this.game.state })
  }

  private playDealer = (): void => {
    if (this.game.state !== GameState.DealerPlaying) {
      this.game.state = GameState.DealerPlaying
      this.emitServerEvent(ServerEvent.GameStateChange, { gameState: this.game.state })
      this.emitServerEvent(ServerEvent.RevealDealerHand, { hand: this.game.dealer.hand })
    }

    const dealerHand = this.game.dealer.hand
    const dealerHandTotal = this.getBestHandTotal(dealerHand)

    console.debug('playDealer', {
      cards: dealerHand.cards.map(card => card === 'hidden' ? card : card.rank),
      dealerHandTotal,
    })

    if (dealerHandTotal > 21) {
      console.debug('dealer busted at', dealerHandTotal)
      dealerHand.state = HandState.Busted
      this.emitServerEvent(ServerEvent.DealerBust, { handState: HandState.Busted})
      this.checkGameState()
      return
    }

    if (dealerHandTotal >= 17) {
      console.debug('dealer standing at', dealerHandTotal)
      dealerHand.state = HandState.Standing
      this.emitServerEvent(ServerEvent.DealerStand, { handState: HandState.Standing })
      this.checkGameState()
      return
    }

    console.debug('dealer hitting at', dealerHandTotal)
    this.dealCardToHand(dealerHand)
    this.emitServerEvent(ServerEvent.DealerHit, { hand: dealerHand })

    // Recursively play dealer until done
    this.playDealer()
  }

  private getBestHandTotal = (hand: IHand): number => {
    const { total: { hard, soft } } = hand
    if (typeof soft === 'undefined') return hard
    if (soft <= 21) return soft
    return hard
  }

  private dealCardToHand = (hand: IHand): void => {
    console.group('dealCardToHand')
    const handTotals = [hand.total.hard, hand.total.soft].filter(x => typeof x !== 'undefined') as number[]
    console.log('handTotals', handTotals)

    if (this.game.shoe.length === 0) {
      throw new Error('Shoe empty!')
    }
    const card = this.game.shoe.pop()!
    console.log('card', card)
    const cardValue = RankValue[card.rank]
    const cardValues = [cardValue.hard, cardValue.soft].filter(x => typeof x !== 'undefined') as number[]
    console.log('cardValues', cardValues)
    
    const allPossibleHandValues = handTotals.reduce<number[]>((acc, handTotal) => {
        cardValues.forEach(cardVal => {
            acc.push(handTotal + cardVal)
        })
        return acc
    }, [])
    console.log('allPossibleHandValues', allPossibleHandValues)

    // Sort in order of best hand totals
    allPossibleHandValues.sort((a, b) => {
      if (a > 21 && b <= 21) return 1
      if (b > 21 && a <= 21) return -1
      if (a > 21 && b > 21) return a - b
      return a - b
    })

    let handTotal: IValue
    if (allPossibleHandValues.length === 0) {
      // Should not be possible
      throw new Error(`Failed to deal ${card} to hand ${hand.cards}, no possible values found`)
    } else if (allPossibleHandValues.length === 1) {
      handTotal = {
        hard: allPossibleHandValues[0]!,
      }
    } else {
      let soft: number | undefined = allPossibleHandValues[1]!
      if (soft > 21) soft = undefined
      handTotal = {
        soft,
        hard: allPossibleHandValues[0],
      }
    }
    console.log('new handTotal', handTotal)

    hand.cards.push(card)
    hand.total = handTotal

    console.groupEnd()
  }

  private settle = (): void => {
    const { dealer } = this.game
    const dealerTotal = this.getBestHandTotal(dealer.hand)
    const dealerBusted = dealer.hand.state === HandState.Busted
    const dealerStanding = dealer.hand.state === HandState.Standing
    const dealerBlackjack = dealerTotal === 21 && dealer.hand.cards.length === 2

    type HandsWithPlayerId = { hand: IHand; playerId: string }[]
    const handsWithPlayerId: HandsWithPlayerId = this.playersInRound
      .flatMap(player => 
        Object.values(player.hands)
          .map(hand => ({ hand, playerId: player.id })
        )
      )

    for (const { hand, playerId } of handsWithPlayerId) {
      if (hand.state === HandState.Hitting) {
        throw new Error(`Cannot settle hand ${hand.id}, it is still hitting`)
      }

      if (typeof hand.bet === 'undefined') {
        throw new Error(`Cannot settle hand ${hand.id}, it has no bet`)
      }

      const handBet = hand.bet
      const handTotal = this.getBestHandTotal(hand)
      const handBusted = hand.state === HandState.Busted
      const handStanding = hand.state === HandState.Standing
      const handBlackjack = handTotal === 21 && hand.cards.length === 2

      const lose =
        handBusted                                                            // Player automatically loses if they bust
        || (handTotal < dealerTotal && dealerStanding)                        // Player loses if dealer beats them without busting
        || (handTotal === dealerTotal && dealerBlackjack && !handBlackjack) // Player loses if they get 21 but dealer gets blackjack

      const win =
        (handStanding && dealerBusted)                                        // Player wins if they stand and dealer busts
        || (handTotal > dealerTotal && handStanding)                        // Player wins if they beat dealer without busting
        || (handTotal === dealerTotal && handBlackjack && !dealerBlackjack) // Player wins if they tie with dealer but got a blackjack

      // Player pushes when both stand, their totals match, and neither got a blackjack
      const push =
        handStanding && dealerStanding
        && handTotal === dealerTotal
        && !handBlackjack && !dealerBlackjack

      if (win && handBlackjack) {
        hand.settleStatus = HandSettleStatus.Blackjack
        hand.winnings = 2.5 * handBet
      } else if (win) {
        hand.settleStatus = HandSettleStatus.Win
        hand.winnings = 2 * handBet
      } else if (push) {
        hand.settleStatus = HandSettleStatus.Push
        hand.winnings = handBet
      } else if (lose) {
        hand.settleStatus = HandSettleStatus.Lose
        hand.winnings = 0
      } else {
        throw new Error(`Failed to determine round outcome. dealerCards: ${dealer.hand.cards}, handCards: ${hand.cards}`)
      }

      // Add hand winnings to players money
      const player = this.game.players[playerId]
      player.money += hand.winnings
    }

    type SettledHandsByPlayer = ServerEventArgs<ServerEvent.Settled>['settledHandsByPlayer']
    type SettledHands = SettledHandsByPlayer[string]['settledHands']
    const settledHandsByPlayer = this.playersInRound.reduce<SettledHandsByPlayer>((acc, player) => {
        const settledHands = Object.values(player.hands).reduce<SettledHands>((acc, hand) => {
          acc[hand.id] = {
            settleStatus: hand.settleStatus!,
            winnings: hand.winnings!,
          }
          return acc
        }, {})

        acc[player.id] = {
          settledHands,
          money: player.money,
        }
        return acc
      }, {})
    this.emitServerEvent(ServerEvent.Settled, { settledHandsByPlayer })
  }

  private clearHands = (): void => {
    this.game.dealer.hand = EMPTY_HAND(DEALER_HAND_ID)

    type HandsByPlayerId = ServerEventArgs<ServerEvent.ClearHands>['handsByPlayerId']
    const handsByPlayerId = this.allPlayers.reduce<HandsByPlayerId>((acc, player) => {
      // Give each player 1 empty hand
      const handId = nanoid()
      const hand = EMPTY_HAND(handId)
      const hands = { [hand.id]: hand }
      
      // Set game state
      player.hands = hands

      // Set payload to send to client
      acc[player.id] = { hands }
      return acc
    }, {})

    this.emitServerEvent(ServerEvent.ClearHands, {
      dealerHand: this.game.dealer.hand,
      handsByPlayerId,
    })
  }

  private unReadyPlayers = (): void => {
    Object.values(this.game.players).forEach(player => player.ready = false)
    this.emitReadyPlayers()

    this.game.state = GameState.PlayersReadying
    this.emitServerEvent(ServerEvent.GameStateChange, { gameState: this.game.state })

    this.checkGameState()
  }

  // ====================
  // Event Handlers
  // ====================
  private handlePlayerJoin: ClientEventHandler<ClientEvent.PlayerJoin> = ({ name }, socket) => {
    const newPlayer: IPlayer = {
      id: socket.id,
      name,
      hands: {},
      money: 1000,
      ready: false,
    }
    this.game.players[socket.id] = newPlayer

    this.emitServerEventTo(socket, ServerEvent.JoinSuccess, { game: this.game })
    this.emitServerEvent(ServerEvent.PlayerJoined, { player: newPlayer })
    this.checkGameState()
  };

  private handlePlaceBet: ClientEventHandler<ClientEvent.PlaceBet> = ({ handId, amount }, socket) => {
    const player = this.game.players[socket.id]
    if (typeof player === 'undefined') {
      this.emitServerEventTo(socket, ServerEvent.Error, { message: 'You have not joined the game' })
      return
    }
    const hand = player.hands[handId]
    if (typeof hand === 'undefined') {
      this.emitServerEventTo(socket, ServerEvent.Error, { message: 'You aren\'t playing' })
      return
    }
    if (typeof hand.bet !== 'undefined') {
      this.emitServerEventTo(socket,ServerEvent.Error, { message: 'You have already bet'})
      return
    }

    player.money -= amount
    hand.bet = amount

    this.emitServerEvent(ServerEvent.PlayerBet, {
      playerId: player.id,
      money: player.money,
      handId,
      bet: hand.bet,
    })

    this.checkGameState()
  }

  private handleHit: ClientEventHandler<ClientEvent.Hit> = ({ handId }, socket) => {
    const player = this.game.players[socket.id]
    if (!player) return
    const hand = player.hands[handId]
    if (!hand) return
    if (hand.hasDoubled) {
      throw new Error(`Player ${player.id} has already doubled and cannot hit again`)
    }

    this.dealCardToHand(hand)
    const playerHandTotal = this.getBestHandTotal(hand)

    if (playerHandTotal > 21) {
      hand.state = HandState.Busted
    }

    this.emitServerEvent(ServerEvent.PlayerHit, {
      playerId: player.id,
      handId: hand.id,
      hand,
    })

    this.checkGameState()
  }

  private handleDouble: ClientEventHandler<ClientEvent.Double> = ({ handId }, socket) => {
    const player = this.game.players[socket.id]
    if (!player) return
    const hand = player.hands[handId]
    if (!hand) return

    if (typeof hand.bet === 'undefined') {
      throw new Error(`Player ${player.id} is doubling without a bet`)
    }

    if (hand.cards.length !== 2) {
      throw new Error(`Player ${player.id} is doubling with ${hand.cards.length} cards`)
    }
    
    // Double current bet
    const currentBet = hand.bet!
    player.money -= currentBet
    hand.bet += currentBet
    hand.hasDoubled = true

    this.dealCardToHand(hand)
    const playerHandTotal = this.getBestHandTotal(hand)

    if (playerHandTotal > 21) {
      hand.state = HandState.Busted
    } else {
      // Player must stand after doubling
      hand.state = HandState.Standing
    }

    this.emitServerEvent(ServerEvent.PlayerDoubled, {
      playerId: player.id,
      money: player.money,
      handId,
      hand,
    })

    this.checkGameState()
  }

  private handleStand: ClientEventHandler<ClientEvent.Stand> = ({ handId }, socket) => {
    const player = this.game.players[socket.id]
    if (!player) return
    const hand = player.hands[handId]
    if (!hand) return

    hand.state = HandState.Standing
    this.emitServerEvent(ServerEvent.PlayerStand, {
      playerId: player.id,
      handId,
      handState: hand.state,
    })

    this.checkGameState()
  }

  private handleReady: ClientEventHandler<ClientEvent.Ready> = (_, socket) => {
    const player = this.game.players[socket.id]
    if (!player) return

    player.ready = true
    this.emitReadyPlayers()
    this.checkGameState()
  }
}
