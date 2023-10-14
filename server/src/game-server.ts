import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http'
import { nanoid } from 'nanoid';

import { ClientEvent, ClientEventArgs, EMPTY_DEALER_HAND, GameState, HandAction, IBoughtInsurance, ICard, IDealerHand, IDeclinedInsurance, IGame, IPlayer, IPlayerBoughtInsurance, IValue, MaybeHiddenCard, Rank, RankValue, ServerEvent, ServerEventArgs, isPlayerInsured } from 'blackjack-types';
import { ClientEventHandlers, ClientEventHandler } from './types';
import { createDeck } from './createDeck';
import { durstenfeldShuffle } from './durstenfeldShuffle';
import { EMPTY_PLAYER_HAND, HandSettleStatus, HandState, IPlayerHand } from 'blackjack-types';

export class GameServer {
  private clientEventHandlers: ClientEventHandlers

  private readonly server: SocketServer

  private game: IGame

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
      [ClientEvent.Split]: this.handleSplit,
      [ClientEvent.Stand]: this.handleStand,

      [ClientEvent.BuyInsurance]: this.handleBuyInsurance,
      [ClientEvent.DeclineInsurance]: this.handleDeclineInsurance,

      [ClientEvent.Reset]: this.handleReset,
    }

    this.game = {
      state: GameState.PlayersReadying,
      dealer: { hand: EMPTY_DEALER_HAND() },
      players: {},
      shoe: [],
    }

    this.resetShoe()
  }

  private reset = (): void => {
    this.game = {
      state: GameState.PlayersReadying,
      dealer: { hand: EMPTY_DEALER_HAND() },
      players: {},
      shoe: [],
    }

    this.resetShoe()

    this.emitServerEvent(ServerEvent.Reset, {})
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

  get playersWithInsurance(): IPlayerBoughtInsurance[] {
    return this.playersInRound.filter(isPlayerInsured)
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

  get shouldOfferInsurance(): boolean {
    const dealerCards = this.game.dealer.hand.cards
    if (dealerCards.length !== 2) {
      return false
    }

    const dealerUpCard = this.game.dealer.hand.cards[0]
    if (dealerUpCard === 'hidden') {
      throw new Error('Dealer up card is hidden when determining if insurance should be offered')
    }

    return dealerUpCard.rank === Rank.Ace
  }

  get playersInRoundHaveBoughtOrDeclinedInsurance(): boolean {
    return this.playersInRound.every(player => typeof player.insurance !== 'undefined')
  }

  private checkGameState = (): void => {
    console.debug('checkGameState', {
      gameState: this.game.state,
      allPlayersReady: this.allPlayersReady,
      playersInRoundHaveFinishedBetting: this.playersInRoundHaveFinishedBetting,
      shouldOfferInsurance: this.shouldOfferInsurance,
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

    if (this.game.state === GameState.Insuring && this.playersInRoundHaveBoughtOrDeclinedInsurance) {
      this.settleInsurance()
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

    /** Insurance testing cards */
    // decks.push({
    //   rank: Rank.Ten,
    //   suit: Suit.Clubs,
    // })

    // decks.push({
    //   rank: Rank.Two,
    //   suit: Suit.Spades,
    // })

    // decks.push({
    //   rank: Rank.Ace,
    //   suit: Suit.Hearts,
    // })
    
    // decks.push({
    //   rank: Rank.Two,
    //   suit: Suit.Diamonds,
    // })
    /** ======================= */

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
    
    const dealerHandWithHiddenCard: IDealerHand = {
      ...dealerHand,
      cards: [dealerHand.cards[0], 'hidden'],
      value: RankValue[(dealerHand.cards[0] as ICard).rank],
    }

    const handsByPlayerId = this.playersInRound.reduce<Record<string, IPlayerHand>>((acc, player) => {
      const playerHand = Object.values(player.hands)[0]!
      acc[player.id] = playerHand
      return acc
    }, {})

    this.emitServerEvent(ServerEvent.Dealt, {
      dealerHand: dealerHandWithHiddenCard,
      handsByPlayerId,
    })

    if (this.shouldOfferInsurance) {
      this.game.state = GameState.Insuring
    } else {
      this.game.state = GameState.PlayersPlaying
    }
    this.emitServerEvent(ServerEvent.GameStateChange, { gameState: this.game.state })

    this.checkGameState()
  }

  private settleInsurance = (): void => {
    console.log('settleInsurance')
    const dealerValue = this.getBestValue(this.game.dealer.hand.value)
    const dealerBlackjack = dealerValue === 21

    if (dealerBlackjack) {
      // If dealer has blackjack, players that insured win their insurance bet 2:1
      for (const player of this.playersWithInsurance) {
        player.insurance.won = true
        player.money += player.insurance.bet * 3
      }

      // Players immediately stand
      for (const player of this.playersInRound) {
        const handId = Object.keys(player.hands)[0]
        const hand = player.hands[handId]
        hand.state = HandState.Standing
        this.emitServerEvent(ServerEvent.PlayerStand, {
          playerId: player.id,
          handId,
          hand,
        })
      }
    } else {
      // If dealer doesn't have blackjack, players that insured lose their money
      // and we keep playing
      for (const player of this.playersWithInsurance) {
        player.insurance.won = false
      }
    }

    this.playersWithInsurance.forEach(player => {
      this.emitServerEvent(ServerEvent.UpdatePlayerInsurance, {
        playerId: player.id,
        insurance: player.insurance,
      })
    })

    this.game.state = GameState.PlayersPlaying
    this.emitServerEvent(ServerEvent.GameStateChange, { gameState: this.game.state })

    this.checkGameState()
  }

  private playDealer = (): void => {
    if (this.game.state !== GameState.DealerPlaying) {
      this.game.state = GameState.DealerPlaying
      this.emitServerEvent(ServerEvent.GameStateChange, { gameState: this.game.state })
      this.emitServerEvent(ServerEvent.RevealDealerHand, { hand: this.game.dealer.hand })
    }

    const dealerHand = this.game.dealer.hand
    const dealerHandValue = this.getBestValue(dealerHand.value)

    console.debug('playDealer', {
      cards: dealerHand.cards.map(card => card === 'hidden' ? card : card.rank),
      dealerHandValue,
    })

    if (dealerHandValue > 21) {
      console.debug('dealer busted at', dealerHandValue)
      dealerHand.state = HandState.Busted
      this.emitServerEvent(ServerEvent.DealerBust, { handState: HandState.Busted})
      this.checkGameState()
      return
    }

    if (dealerHandValue >= 17) {
      console.debug('dealer standing at', dealerHandValue)
      dealerHand.state = HandState.Standing
      this.emitServerEvent(ServerEvent.DealerStand, { handState: HandState.Standing })
      this.checkGameState()
      return
    }

    console.debug('dealer hitting at', dealerHandValue)
    this.dealCardToHand(dealerHand)
    this.emitServerEvent(ServerEvent.DealerHit, { hand: dealerHand })

    // Recursively play dealer until done
    this.playDealer()
  }

  private getBestValue = ({ hard, soft }: IValue): number => {
    if (typeof soft === 'undefined') return hard
    if (soft <= 21) return soft
    return hard
  }

  /**
   * Deals a card to a hand. If no card specified, one is pulled from the deck.
   */
  private dealCardToHand = (hand: IPlayerHand | IDealerHand, card?: ICard): void => {
    let _card: ICard
    if (card) {
      _card = card
    } else {
      if (this.game.shoe.length === 0) {
        throw new Error('Shoe empty!')
      }
      _card = this.game.shoe.pop()!
    }

    hand.cards.push(_card)
    hand.value = this.getCardsTotalValue(hand.cards)
    hand.state = this.getHandStateByValue(hand.value)
    
    if (hand.type === 'player') {
      hand.actions = this.getHandActionsByStateAndCards(hand.state, hand.cards)
    }

    console.groupEnd()
  }

  private getCardsTotalValue = (cards: MaybeHiddenCard[]): IValue => {
    let soft = 0
    let hard = 0

    cards.forEach(card => {
      if (card === 'hidden') return

      const cardValue = RankValue[card.rank]
      if (typeof cardValue.soft !== 'undefined') {
        soft += cardValue.soft
      } else {
        soft += cardValue.hard
      }

      hard += cardValue.hard
    })

    if (soft !== hard && soft <= 21) {
      return { soft, hard }
    }
    return { hard }
  }

  private getHandStateByValue = (value: IValue): HandState => {
    const bestValue = this.getBestValue(value)
    if (bestValue === 21) return HandState.Standing
    if (bestValue > 21) return HandState.Busted
    return HandState.Hitting
  }
  
  private getHandActionsByStateAndCards = (state: HandState, cards: ICard[]): HandAction[] => {
    if (state !== HandState.Hitting) return []
    
    const actions: HandAction[] = [HandAction.Stand, HandAction.Hit]
    if (cards.length === 2) {
      actions.push(HandAction.Double)

      const cardsAreSameRank = cards[0].rank === cards[1].rank
      if (cardsAreSameRank) {
        actions.push(HandAction.Split)
      }
    }

    return actions
  }

  private settle = (): void => {
    const { dealer } = this.game
    const dealerValue = this.getBestValue(dealer.hand.value)
    const dealerBusted = dealer.hand.state === HandState.Busted
    const dealerStanding = dealer.hand.state === HandState.Standing
    const dealerBlackjack = dealerValue === 21 && dealer.hand.cards.length === 2

    type HandsWithPlayerId = { hand: IPlayerHand; playerId: string }[]
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
      const handValue = this.getBestValue(hand.value)
      const handBusted = hand.state === HandState.Busted
      const handStanding = hand.state === HandState.Standing
      const handBlackjack = handValue === 21 && hand.cards.length === 2

      const lose =
        handBusted                                                            // Player automatically loses if they bust
        || (handValue < dealerValue && dealerStanding)                        // Player loses if dealer beats them without busting
        || (handValue === dealerValue && dealerBlackjack && !handBlackjack) // Player loses if they get 21 but dealer gets blackjack

      const win =
        (handStanding && dealerBusted)                                        // Player wins if they stand and dealer busts
        || (handValue > dealerValue && handStanding)                        // Player wins if they beat dealer without busting
        || (handValue === dealerValue && handBlackjack && !dealerBlackjack) // Player wins if they tie with dealer but got a blackjack

      // Player pushes when both stand, their values match, and neither got a blackjack
      const push =
        handStanding && dealerStanding
        && handValue === dealerValue
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
    this.game.dealer.hand = EMPTY_DEALER_HAND()

    type HandsByPlayerId = ServerEventArgs<ServerEvent.ClearHands>['handsByPlayerId']
    const handsByPlayerId = this.allPlayers.reduce<HandsByPlayerId>((acc, player) => {
      // Give each player 1 empty hand
      const handId = nanoid()
      const hand = {
        ...EMPTY_PLAYER_HAND(handId),
        actions: [HandAction.Bet],
      }
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

    const canHit = hand.actions.includes(HandAction.Hit)
    if (!canHit) {
      throw new Error(`Player ${player.id} cannot hit hand ${hand.id}`)
    }

    this.dealCardToHand(hand)

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

    const canDouble = hand.actions.includes(HandAction.Double)
    if (!canDouble) {
      throw new Error(`Player ${player.id} cannot double hand ${hand.id}`)
    }

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

    this.dealCardToHand(hand)

    // Hand cannot hit any more after doubling
    if (hand.state === HandState.Hitting) {
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

  private handleSplit: ClientEventHandler<ClientEvent.Split> = ({ handId }, socket) => {
    const player = this.game.players[socket.id]
    if (!player) return
    const hand = player.hands[handId]
    if (!hand) return

    const canSplit = hand.actions.includes(HandAction.Split)
    if (!canSplit) {
      throw new Error(`Player ${player.id} cannot split hand ${hand.id}`)
    }

    if (typeof hand.bet === 'undefined') {
      throw new Error(`Player ${player.id} is splitting without a bet`)
    }

    if (hand.cards.length !== 2) {
      throw new Error(`Player ${player.id} cannot split hand ${handId} because it does not contain exactly 2 cards`)
    }

    if (hand.state !== HandState.Hitting) {
      throw new Error(`Player ${player.id} cannot split hand ${hand}`)
    }

    const originalBet = hand.bet
    const originalCards = [...hand.cards]
    delete player.hands[handId]

    const [card1, card2] = originalCards as [ICard, ICard]

    const newHand1 = EMPTY_PLAYER_HAND(nanoid(), originalBet)
    this.dealCardToHand(newHand1, card1)
    this.dealCardToHand(newHand1)

    const newHand2 = EMPTY_PLAYER_HAND(nanoid(), originalBet)
    this.dealCardToHand(newHand2, card2)
    this.dealCardToHand(newHand2)

    player.hands[newHand1.id] = newHand1
    player.hands[newHand2.id] = newHand2
    
    player.money -= originalBet

    this.emitServerEvent(ServerEvent.PlayerSplit, {
      playerId: player.id,
      money: player.money,
      hands: player.hands,
    })

    this.emitServerEvent(ServerEvent.PlayerHit, {
      playerId: player.id,
      handId: newHand1.id,
      hand: newHand1,
    })

    this.emitServerEvent(ServerEvent.PlayerHit, {
      playerId: player.id,
      handId: newHand2.id,
      hand: newHand2,
    })
  }

  private handleStand: ClientEventHandler<ClientEvent.Stand> = ({ handId }, socket) => {
    const player = this.game.players[socket.id]
    if (!player) return
    const hand = player.hands[handId]
    if (!hand) return

    const canStand = hand.actions.includes(HandAction.Stand)
    if (!canStand) {
      throw new Error(`Player ${player.id} cannot stand hand ${hand.id}`)
    }

    hand.state = HandState.Standing
    this.emitServerEvent(ServerEvent.PlayerStand, {
      playerId: player.id,
      handId,
      hand,
    })

    this.checkGameState()
  }

  private handleBuyInsurance: ClientEventHandler<ClientEvent.BuyInsurance> = (_, socket) => {
    const player = this.game.players[socket.id]
    if (!player) return
    const hand = Object.values(player.hands)[0]
    if (!hand) return
    if (typeof hand.bet === 'undefined') return

    if (this.game.state !== GameState.Insuring) {
      throw new Error(`Player ${player.id} tried to buy insurance when its not allowed`)
    }

    const insurance: IBoughtInsurance = {
      boughtInsurance: true,
      bet: hand.bet / 2,
    }

    player.insurance = insurance
    player.money -= insurance.bet

    this.emitServerEvent(ServerEvent.UpdatePlayerInsurance, {
      playerId: player.id,
      insurance,
      playerMoney: player.money,
    })
    
    this.checkGameState()
  }

  private handleDeclineInsurance: ClientEventHandler<ClientEvent.DeclineInsurance> = (_, socket) => {
    const player = this.game.players[socket.id]
    if (!player) return

    if (this.game.state !== GameState.Insuring) {
      throw new Error(`Player ${player.id} tried to decline insurance when its not allowed`)
    }

    const insurance: IDeclinedInsurance = {
      boughtInsurance: false,
      bet: undefined,
    }

    player.insurance = insurance

    this.emitServerEvent(ServerEvent.UpdatePlayerInsurance, {
      playerId: player.id,
      insurance,
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

  private handleReset: ClientEventHandler<ClientEvent.Reset> = () => {
    console.log('\n\n==============================\n')
    console.log('RESET')
    console.log('\n==============================\n\n')
    this.reset()
  }
}
