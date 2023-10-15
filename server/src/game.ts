import { nanoid } from 'nanoid';

import { ClientEvent, GameState, HandAction, IBoughtInsurance, ICard, DealerHand, IDeclinedInsurance, IGame, IPlayer, IInsuredPlayerHand, IValue, MaybeHiddenCard, Rank, RankValue, ServerEvent, ServerEventArgs, isHandInsured, InsuranceSettleStatus, IDealerHand, ClientEventArgs } from 'blackjack-types';
import { ClientEventHandlers, ClientEventHandler } from './types';
import { createDeck } from './createDeck';
import { durstenfeldShuffle } from './durstenfeldShuffle';
import { HandSettleStatus, HandState, PlayerHand } from 'blackjack-types';

export interface GameEventEmitters {
  emitEvent: <E extends ServerEvent>(event: E, args: ServerEventArgs<E>) => void
  emitEventTo: <E extends ServerEvent>(playerId: string, event: E, args: ServerEventArgs<E>) => void
}

export class Game {
  private clientEventHandlers: ClientEventHandlers

  private game: IGame

  constructor(private readonly emitters: GameEventEmitters) {
    this.clientEventHandlers = {
      [ClientEvent.PlayerJoin]: this.handlePlayerJoin,
      [ClientEvent.Leave]: this.handleLeave,

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
      dealer: { hand: new DealerHand() },
      players: {},
      shoe: [],
    }

    this.resetShoe()
  }

  private reset = (): void => {
    this.game = {
      state: GameState.PlayersReadying,
      dealer: { hand: new DealerHand() },
      players: {},
      shoe: [],
    }

    this.resetShoe()

    this.emitters.emitEvent(ServerEvent.Reset, {})
  }

  handleEvent = <E extends ClientEvent>(event: E, args: ClientEventArgs<E>, playerId: string, ): void => {
    console.debug(`Received client event ${event}`, { playerId, args })
    
    const handler = this.clientEventHandlers[event]
    if (typeof handler !== 'undefined') {
      handler(args, playerId)
    } else {
      console.error(`No handler registered for ${event}`)
    }
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

  get insuredHandsByPlayer(): { [playerId: string]: IInsuredPlayerHand[] } {
    return this.playersInRound.reduce<{ [playerId: string]: IInsuredPlayerHand[] }>((acc, player) => {
      const playerHands = Object.values(player.hands)
      const insuredHands = playerHands.map(hand => hand.serialize()).filter(isHandInsured)
      acc[player.id] = insuredHands
      return acc
    }, {})
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
    console.log('shouldOfferInsurance', { dealerCards })
    if (dealerCards.length !== 2) {
      return false
    }

    const dealerUpCard = this.game.dealer.hand.cards[0]
    return dealerUpCard.rank === Rank.Ace
  }

  get handsHaveBoughtOrDeclinedInsurance(): boolean {
    const allHands = this.playersInRound.flatMap(player => Object.values(player.hands))
    return allHands.every(hand => typeof hand.insurance !== 'undefined')
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
    }
    
    if (this.game.state === GameState.PlacingBets && this.playersInRoundHaveFinishedBetting) {
      this.deal()
      if (this.shouldOfferInsurance) {
        this.offerInsurance()
      } else {
        this.playPlayers()
      }
    }

    if (this.game.state === GameState.Insuring && this.handsHaveBoughtOrDeclinedInsurance) {
      this.settleInsurance()
      this.playPlayers()
    }
    
    if (this.game.state === GameState.PlayersPlaying && this.playersInRoundHaveFinishedHitting) {
      this.playDealer()
    }
    
    if (this.game.state === GameState.DealerPlaying && this.dealerIsDonePlaying) {
      this.settle()
      this.unReadyPlayers()
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
    this.emitters.emitEvent(ServerEvent.GameStateChange, { gameState: this.game.state })
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
    
    const dealerHandWithHiddenCard: IDealerHand = this.game.dealer.hand.serialize({ revealed: false })

    const handsByPlayerId = this.playersInRound.reduce<Record<string, PlayerHand>>((acc, player) => {
      const playerHand = Object.values(player.hands)[0]!
      acc[player.id] = playerHand
      return acc
    }, {})

    this.emitters.emitEvent(ServerEvent.Dealt, {
      dealerHand: dealerHandWithHiddenCard,
      handsByPlayerId,
    })
  }

  private offerInsurance = (): void => {
    this.game.state = GameState.Insuring
    this.emitters.emitEvent(ServerEvent.GameStateChange, { gameState: this.game.state })

    // All root hands can insure
    this.playersInRound.forEach(player => {
      Object.values(player.hands).filter(hand => hand.isRootHand).forEach(hand => {
        hand.actions = this.getHandActionsByRootHandAndStateAndCards(hand.isRootHand, hand.state, hand.cards)

        this.emitters.emitEvent(ServerEvent.UpdateHand, {
          playerId: player.id,
          handId: hand.id,
          hand,
        })
      })
    })
  }

  private settleInsurance = (): void => {
    console.log('settleInsurance')
    const dealerValue = this.getBestValue(this.game.dealer.hand.value)
    const dealerBlackjack = dealerValue === 21

    if (dealerBlackjack) {
      // If dealer has blackjack, players that insured hands win their insurance bets 2:1
      for (const [playerId, hands] of Object.entries(this.insuredHandsByPlayer)) {
        const player = this.game.players[playerId]
        
        for (const hand of hands) {
          const winnings = hand.insurance.bet * 3
          player.money += winnings
          hand.insurance.settleStatus = InsuranceSettleStatus.Win
          hand.insurance.winnings = winnings
        }
      }

      // Players immediately stand
      for (const player of this.playersInRound) {
        const handId = Object.keys(player.hands)[0]
        const hand = player.hands[handId]
        hand.state = HandState.Standing
        this.emitters.emitEvent(ServerEvent.PlayerStand, {
          playerId: player.id,
          handId,
          hand,
        })
      }
    } else {
      // If dealer doesn't have blackjack, players that insured lose their money
      // and we keep playing
      for (const hands of Object.values(this.insuredHandsByPlayer)) {
        for (const hand of hands) {
          hand.insurance.settleStatus = InsuranceSettleStatus.Lose
        }
      }
    }

    Object.entries(this.insuredHandsByPlayer).forEach(([playerId, hands]) => {
      hands.forEach(hand => {
        this.emitters.emitEvent(ServerEvent.UpdateHandInsurance, {
          playerId,
          handId: hand.id,
          insurance: hand.insurance,
        })
      })
    })
  }

  private playPlayers = (): void => {
    this.game.state = GameState.PlayersPlaying

    this.playersInRound.forEach(player => {
      Object.values(player.hands).forEach(hand => {
        hand.actions = this.getHandActionsByRootHandAndStateAndCards(hand.isRootHand, hand.state, hand.cards)

        this.emitters.emitEvent(ServerEvent.UpdateHand, {
          playerId: player.id,
          handId: hand.id,
          hand,
        })
      })
    })

    this.emitters.emitEvent(ServerEvent.GameStateChange, { gameState: this.game.state })
  }

  private playDealer = (): void => {
    if (this.game.state !== GameState.DealerPlaying) {
      this.game.state = GameState.DealerPlaying
      this.emitters.emitEvent(ServerEvent.GameStateChange, { gameState: this.game.state })
      this.emitters.emitEvent(ServerEvent.RevealDealerHand, { hand: this.game.dealer.hand.serialize({ revealed: true }) })
    }

    const dealerHand = this.game.dealer.hand
    const dealerHandValue = this.getBestValue(dealerHand.value)

    if (dealerHandValue > 21) {
      console.debug('dealer busted at', dealerHandValue)
      dealerHand.state = HandState.Busted
      this.emitters.emitEvent(ServerEvent.DealerBust, { handState: HandState.Busted})
      this.checkGameState()
      return
    }

    if (dealerHandValue >= 17) {
      console.debug('dealer standing at', dealerHandValue)
      dealerHand.state = HandState.Standing
      this.emitters.emitEvent(ServerEvent.DealerStand, { handState: HandState.Standing })
      this.checkGameState()
      return
    }

    console.debug('dealer hitting at', dealerHandValue)
    this.dealCardToHand(dealerHand)
    this.emitters.emitEvent(ServerEvent.DealerHit, { hand: dealerHand })

    // Recursively play dealer until done
    this.playDealer()
  }

  private getBestValue = ({ hard, soft }: IValue): number => {
    if (soft === null) return hard
    if (soft <= 21) return soft
    return hard
  }

  /**
   * Deals a card to a hand. If no card specified, one is pulled from the deck.
   */
  private dealCardToHand = (hand: PlayerHand | DealerHand, card?: ICard): void => {
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
      hand.actions = this.getHandActionsByRootHandAndStateAndCards(hand.isRootHand, hand.state, hand.cards)
    }
    
    console.groupEnd()
  }

  private getCardsTotalValue = (cards: MaybeHiddenCard[]): IValue => {
    let soft = 0
    let hard = 0

    cards.forEach(card => {
      if (card === 'hidden') return

      const cardValue = RankValue[card.rank]
      if (cardValue.soft !== null) {
        soft += cardValue.soft
      } else {
        soft += cardValue.hard
      }

      hard += cardValue.hard
    })

    if (soft !== hard && soft <= 21) {
      return { soft, hard }
    }
    return { hard, soft: null }
  }

  private getHandStateByValue = (value: IValue): HandState => {
    const bestValue = this.getBestValue(value)
    if (bestValue === 21) return HandState.Standing
    if (bestValue > 21) return HandState.Busted
    return HandState.Hitting
  }
  
  /** TODO these arguments are kinda gross */
  private getHandActionsByRootHandAndStateAndCards = (isRootHand: boolean, state: HandState, cards: ICard[]): HandAction[] => {
    if (state !== HandState.Hitting) return []
    
    if (isRootHand && this.game.state === GameState.Insuring) {
      return [HandAction.Insure]
    }

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

    type HandsWithPlayerId = { hand: PlayerHand; playerId: string }[]
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
    this.emitters.emitEvent(ServerEvent.Settled, { settledHandsByPlayer })
  }

  private clearHands = (): void => {
    this.game.dealer.hand = new DealerHand()

    type HandsByPlayerId = ServerEventArgs<ServerEvent.ClearHands>['handsByPlayerId']
    const handsByPlayerId = this.allPlayers.reduce<HandsByPlayerId>((acc, player) => {
      // Give each player 1 empty hand
      const handId = nanoid()
      const hand = new PlayerHand(handId, true)
      hand.actions = [HandAction.Bet]
      const hands = { [hand.id]: hand }
      
      // Set game state
      player.hands = hands

      // Set payload to send to client
      acc[player.id] = { hands }
      return acc
    }, {})

    this.emitters.emitEvent(ServerEvent.ClearHands, {
      dealerHand: this.game.dealer.hand,
      handsByPlayerId,
    })
  }

  private unReadyPlayers = (): void => {
    Object.values(this.game.players).forEach(player => player.ready = false)
    this.emitReadyPlayers()

    this.game.state = GameState.PlayersReadying
    this.emitters.emitEvent(ServerEvent.GameStateChange, { gameState: this.game.state })
  }

  // ====================
  // Event Handlers
  // ====================
  private handlePlayerJoin: ClientEventHandler<ClientEvent.PlayerJoin> = ({ name }, playerId) => {
    const newPlayer: IPlayer = {
      id: playerId,
      name,
      hands: {},
      money: 1000,
      ready: false,
    }
    this.game.players[playerId] = newPlayer

    this.emitters.emitEventTo(playerId, ServerEvent.JoinSuccess, { game: this.game })
    this.emitters.emitEvent(ServerEvent.PlayerJoined, { player: newPlayer })
    this.checkGameState()
  };

  private handleLeave: ClientEventHandler<ClientEvent.Leave> = (_, playerId) => {
    delete this.game.players[playerId]
    this.emitters.emitEvent(ServerEvent.PlayerLeft, { playerId })
    this.checkGameState()
  }

  private handlePlaceBet: ClientEventHandler<ClientEvent.PlaceBet> = ({ handId, amount }, playerId) => {
    const player = this.game.players[playerId]
    if (typeof player === 'undefined') {
      this.emitters.emitEventTo(playerId, ServerEvent.Error, { message: 'You have not joined the game' })
      return
    }
    const hand = player.hands[handId]
    if (typeof hand === 'undefined') {
      this.emitters.emitEventTo(playerId, ServerEvent.Error, { message: 'You aren\'t playing' })
      return
    }
    if (typeof hand.bet !== 'undefined') {
      this.emitters.emitEventTo(playerId,ServerEvent.Error, { message: 'You have already bet'})
      return
    }

    player.money -= amount
    hand.bet = amount

    this.emitters.emitEvent(ServerEvent.PlayerBet, {
      playerId: player.id,
      money: player.money,
      handId,
      bet: hand.bet,
    })

    this.checkGameState()
  }

  private handleHit: ClientEventHandler<ClientEvent.Hit> = ({ handId }, playerId) => {
    const player = this.game.players[playerId]
    if (!player) return
    const hand = player.hands[handId]
    if (!hand) return

    const canHit = hand.actions.includes(HandAction.Hit)
    if (!canHit) {
      throw new Error(`Player ${player.id} cannot hit hand ${hand.id}`)
    }

    this.dealCardToHand(hand)

    this.emitters.emitEvent(ServerEvent.PlayerHit, {
      playerId: player.id,
      handId: hand.id,
      hand,
    })

    this.checkGameState()
  }

  private handleDouble: ClientEventHandler<ClientEvent.Double> = ({ handId }, playerId) => {
    const player = this.game.players[playerId]
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

    this.emitters.emitEvent(ServerEvent.PlayerDoubled, {
      playerId: player.id,
      money: player.money,
      handId,
      hand,
    })

    this.checkGameState()
  }

  private handleSplit: ClientEventHandler<ClientEvent.Split> = ({ handId }, playerId) => {
    const player = this.game.players[playerId]
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

    const newHand1 = new PlayerHand(nanoid(), false)
    newHand1.bet = originalBet
    this.dealCardToHand(newHand1, card1)
    this.dealCardToHand(newHand1)

    const newHand2 = new PlayerHand(nanoid(), false)
    newHand2.bet = originalBet
    this.dealCardToHand(newHand2, card2)
    this.dealCardToHand(newHand2)

    player.hands[newHand1.id] = newHand1
    player.hands[newHand2.id] = newHand2
    
    player.money -= originalBet

    this.emitters.emitEvent(ServerEvent.PlayerSplit, {
      playerId: player.id,
      money: player.money,
      hands: player.hands,
    })

    this.emitters.emitEvent(ServerEvent.PlayerHit, {
      playerId: player.id,
      handId: newHand1.id,
      hand: newHand1,
    })

    this.emitters.emitEvent(ServerEvent.PlayerHit, {
      playerId: player.id,
      handId: newHand2.id,
      hand: newHand2,
    })
  }

  private handleStand: ClientEventHandler<ClientEvent.Stand> = ({ handId }, playerId) => {
    const player = this.game.players[playerId]
    if (!player) return
    const hand = player.hands[handId]
    if (!hand) return

    const canStand = hand.actions.includes(HandAction.Stand)
    if (!canStand) {
      throw new Error(`Player ${player.id} cannot stand hand ${hand.id}`)
    }

    hand.state = HandState.Standing
    this.emitters.emitEvent(ServerEvent.PlayerStand, {
      playerId: player.id,
      handId,
      hand,
    })

    this.checkGameState()
  }

  private handleBuyInsurance: ClientEventHandler<ClientEvent.BuyInsurance> = ({ handId }, playerId) => {
    const player = this.game.players[playerId]
    if (!player) return
    const hand = player.hands[handId]
    if (!hand) return
    if (typeof hand.bet === 'undefined') return

    const canInsure = hand.actions.includes(HandAction.Insure)
    if (!canInsure) {
      throw new Error(`Player ${player.id} cannot insure hand ${hand.id}`)
    }

    if (this.game.state !== GameState.Insuring) {
      throw new Error(`Player ${player.id} tried to buy insurance when its not allowed`)
    }

    const insurance: IBoughtInsurance = {
      boughtInsurance: true,
      bet: hand.bet / 2,
    }

    hand.insurance = insurance
    player.money -= insurance.bet

    this.emitters.emitEvent(ServerEvent.UpdateHandInsurance, {
      playerId: player.id,
      playerMoney: player.money,
      handId: hand.id,
      insurance,
    })
    
    this.checkGameState()
  }

  private handleDeclineInsurance: ClientEventHandler<ClientEvent.DeclineInsurance> = ({ handId }, playerId) => {
    const player = this.game.players[playerId]
    if (!player) return
    const hand = player.hands[handId]
    if (!hand) return

    const canInsure = hand.actions.includes(HandAction.Insure)
    if (!canInsure) {
      throw new Error(`Player ${player.id} cannot insure hand ${hand.id}`)
    }

    if (this.game.state !== GameState.Insuring) {
      throw new Error(`Player ${player.id} tried to decline insurance when its not allowed`)
    }

    const insurance: IDeclinedInsurance = {
      boughtInsurance: false,
      bet: null,
    }

    hand.insurance = insurance

    this.emitters.emitEvent(ServerEvent.UpdateHandInsurance, {
      playerId: player.id,
      handId: hand.id,
      insurance,
    })
    
    this.checkGameState()
  }

  private emitReadyPlayers = (): void => {
    const players = Object.values(this.game.players)
    .reduce<ServerEventArgs<ServerEvent.ReadyPlayers>['players']>((acc, player) => {
      acc[player.id] = { ready: player.ready }
      return acc
    }, {})
    this.emitters.emitEvent(ServerEvent.ReadyPlayers, { players })
  }

  private handleReady: ClientEventHandler<ClientEvent.Ready> = (_, playerId) => {
    const player = this.game.players[playerId]
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
