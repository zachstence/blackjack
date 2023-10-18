import { ClientEvent, RoundState, HandAction, Rank, ServerEvent, ServerEventArgs, ClientEventArgs, InsuranceStatus, IPlayerHand } from 'blackjack-types';
import { ClientEventHandlers, ClientEventHandler } from './types';
import { HandStatus } from 'blackjack-types';
import { GameState } from './game-state/game-state';
import { PlayerState } from './game-state/player-state';
import { PlayerHandState } from './game-state/hand-state';
import pick from 'lodash/pick';

export interface GameEventEmitters {
  emitEvent: <E extends ServerEvent>(event: E, args: ServerEventArgs<E>) => void
  emitEventTo: <E extends ServerEvent>(playerId: string, event: E, args: ServerEventArgs<E>) => void
}

export class Game {
  private clientEventHandlers: ClientEventHandlers

  private game: GameState

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

    this.game = new GameState()
    this.game.resetShoe()
  }

  private reset = (): void => {
    this.game = new GameState()
    this.game.resetShoe()

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
  get allPlayers(): PlayerState[] {
    return Object.values(this.game.players)
  }

  get playersInRound(): PlayerState[] {
    return this.allPlayers.filter(player => {
      const playerHasHand = Object.values(player.hands).length > 0
      return playerHasHand
    })
  }

  get insuredHandsByPlayer(): { [playerId: string]: PlayerHandState[] } {
    return this.playersInRound.reduce<{ [playerId: string]: PlayerHandState[] }>((acc, player) => {
      const playerHands = Object.values(player.hands)
      const insuredHands = playerHands.filter(hand => hand.insurance?.status === InsuranceStatus.Bought)
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
        const hasFinishedHitting = hand.status === HandStatus.Standing || hand.status === HandStatus.Busted
        return hasFinishedHitting
      })
    })
  }

  get dealerIsDonePlaying(): boolean {
    const dealerHandState = this.game.dealer.hand.status
    const dealerIsDonePlaying = dealerHandState === HandStatus.Standing || dealerHandState === HandStatus.Busted
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
    return allHands.every(hand => hand.insurance?.status !== InsuranceStatus.Offered)
  }

  private checkGameState = (): void => {
    console.debug('checkGameState', {
      gameState: this.game.roundState,
      allPlayersReady: this.allPlayersReady,
      playersInRoundHaveFinishedBetting: this.playersInRoundHaveFinishedBetting,
      shouldOfferInsurance: this.shouldOfferInsurance,
      playersInRoundHaveFinishedHitting: this.playersInRoundHaveFinishedHitting,
      dealerIsDonePlaying: this.dealerIsDonePlaying,
    })

    if (this.game.roundState === RoundState.PlayersReadying && this.allPlayersReady) {
      this.clearHands()
      this.collectBets()
    }
    
    if (this.game.roundState === RoundState.PlacingBets && this.playersInRoundHaveFinishedBetting) {
      this.deal()
      if (this.shouldOfferInsurance) {
        this.offerInsurance()
      } else {
        this.playPlayers()
      }
    }

    if (this.game.roundState === RoundState.Insuring && this.handsHaveBoughtOrDeclinedInsurance) {
      this.settleInsurance()
      this.playPlayers()
    }
    
    if (this.game.roundState === RoundState.PlayersPlaying && this.playersInRoundHaveFinishedHitting) {
      this.playDealer()
    }
    
    if (this.game.roundState === RoundState.DealerPlaying && this.dealerIsDonePlaying) {
      this.settle()
      this.unReadyPlayers()
    }
  }

  private collectBets = (): void => {
    this.game.roundState = RoundState.PlacingBets
    this.emitters.emitEvent(ServerEvent.GameStateChange, { gameState: this.game.roundState })
  }

  private deal = (): void => {
    this.game.deal()

    const handsByPlayerId = this.playersInRound.reduce<Record<string, IPlayerHand>>((acc, player) => {
      const playerHand = Object.values(player.hands)[0]!
      acc[player.id] = playerHand.toClientJSON()
      return acc
    }, {})

    this.emitters.emitEvent(ServerEvent.Dealt, {
      dealerHand: this.game.dealer.hand.toClientJSON(),
      handsByPlayerId,
    })
  }

  private offerInsurance = (): void => {
    this.game.roundState = RoundState.Insuring
    this.emitters.emitEvent(ServerEvent.GameStateChange, { gameState: this.game.roundState })

    // All root hands can insure
    this.playersInRound.forEach(player => {
      Object.values(player.hands).filter(hand => hand.isRootHand).forEach(hand => {
        hand.offerInsurance()

        this.emitters.emitEvent(ServerEvent.UpdateHand, {
          playerId: player.id,
          handId: hand.id,
          hand: hand.toClientJSON(),
        })
      })
    })
  }

  private settleInsurance = (): void => {
    this.game.settleInsurance()

    Object.values(this.game.playersWithHands).forEach(player => {
      Object.values(player.hands).forEach(hand => {
        this.emitters.emitEvent(ServerEvent.UpdateHandInsurance, {
          playerId: player.id,
          handId: hand.id,
          insurance: hand.toClientJSON().insurance,
          playerMoney: player.money,
        })

        this.emitters.emitEvent(ServerEvent.UpdateHand, {
          playerId: player.id,
          handId: hand.id,
          hand: hand.toClientJSON(),
        })
      })
    })
  }

  private playPlayers = (): void => {
    this.game.roundState = RoundState.PlayersPlaying

    this.playersInRound.forEach(player => {
      Object.values(player.hands).forEach(hand => {
        this.emitters.emitEvent(ServerEvent.UpdateHand, {
          playerId: player.id,
          handId: hand.id,
          hand: hand.toClientJSON(),
        })
      })
    })

    this.emitters.emitEvent(ServerEvent.GameStateChange, { gameState: this.game.roundState })
  }

  private playDealer = (): void => {
    const actions = this.game.playDealer()
    this.emitters.emitEvent(ServerEvent.GameStateChange, { gameState: this.game.roundState })
    actions.forEach(action => {
      if (action.action === HandAction.Hit) {
        this.emitters.emitEvent(ServerEvent.DealerHit, {
          card: action.card,
          hand: this.game.dealer.hand.toClientJSON()
        })
      } else {
        this.emitters.emitEvent(ServerEvent.DealerStand, {
          hand: this.game.dealer.hand.toClientJSON()
        })
      }
    })
  }

  private settle = (): void => {
    this.game.settleBets()

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
    this.game.dealer.hand.clear()

    type HandsByPlayerId = ServerEventArgs<ServerEvent.ClearHands>['handsByPlayerId']
    const handsByPlayerId = this.allPlayers.reduce<HandsByPlayerId>((acc, player) => {
      player.clearHands()
      acc[player.id] = pick(player.toClientJSON(), 'hands')
      return acc
    }, {})

    this.emitters.emitEvent(ServerEvent.ClearHands, {
      dealerHand: this.game.dealer.hand.toClientJSON(),
      handsByPlayerId,
    })
  }

  private unReadyPlayers = (): void => {
    Object.values(this.game.players).forEach(player => player.ready = false)
    this.emitReadyPlayers()

    this.game.roundState = RoundState.PlayersReadying
    this.emitters.emitEvent(ServerEvent.GameStateChange, { gameState: this.game.roundState })
  }

  // ====================
  // Event Handlers
  // ====================
  private handlePlayerJoin: ClientEventHandler<ClientEvent.PlayerJoin> = ({ name }, playerId) => {
    const player = this.game.addPlayer(playerId, name)

    this.emitters.emitEventTo(playerId, ServerEvent.JoinSuccess, { game: this.game.toClientJSON() })
    this.emitters.emitEvent(ServerEvent.PlayerJoined, { player: player.toClientJSON() })
    this.checkGameState()
  };

  private handleLeave: ClientEventHandler<ClientEvent.Leave> = (_, playerId) => {
    this.game.removePlayer(playerId)
    
    this.emitters.emitEvent(ServerEvent.PlayerLeft, { playerId })
    this.checkGameState()
  }

  private handlePlaceBet: ClientEventHandler<ClientEvent.PlaceBet> = ({ handId, amount }, playerId) => {
    const player = this.game.players[playerId]
    if (typeof player === 'undefined') {
      this.emitters.emitEventTo(playerId, ServerEvent.Error, { message: 'You have not joined the game' })
      return
    }

    player.bet(handId, amount)

    this.emitters.emitEvent(ServerEvent.PlayerBet, {
      playerId: player.id,
      money: player.money,
      handId,
      bet: amount,
    })

    this.checkGameState()
  }

  private handleHit: ClientEventHandler<ClientEvent.Hit> = ({ handId }, playerId) => {
    const hand = this.game.getPlayer(playerId).hit(handId).toClientJSON()

    this.emitters.emitEvent(ServerEvent.PlayerHit, {
      playerId: playerId,
      handId: handId,
      hand,
    })

    this.checkGameState()
  }

  private handleDouble: ClientEventHandler<ClientEvent.Double> = ({ handId }, playerId) => {
    const player = this.game.getPlayer(playerId)
    const hand = player.double(handId)

    this.emitters.emitEvent(ServerEvent.PlayerDoubled, {
      playerId,
      money: player.money,
      handId,
      hand: hand.toClientJSON(),
    })

    this.checkGameState()
  }

  private handleSplit: ClientEventHandler<ClientEvent.Split> = ({ handId }, playerId) => {
    const player = this.game.getPlayer(playerId)
    const [hand1, hand2] = player.split(handId)

    this.emitters.emitEvent(ServerEvent.PlayerSplit, {
      playerId,
      money: player.money,
      hands: player.toClientJSON().hands,
    })

    this.emitters.emitEvent(ServerEvent.PlayerHit, {
      playerId,
      handId: hand1.id,
      hand: hand1.toClientJSON(),
    })

    this.emitters.emitEvent(ServerEvent.PlayerHit, {
      playerId,
      handId: hand2.id,
      hand: hand2.toClientJSON(),
    })
  }

  private handleStand: ClientEventHandler<ClientEvent.Stand> = ({ handId }, playerId) => {
    const hand = this.game.getPlayer(playerId).stand(handId)

    this.emitters.emitEvent(ServerEvent.PlayerStand, {
      playerId,
      handId,
      hand: hand.toClientJSON(),
    })

    this.checkGameState()
  }

  private handleBuyInsurance: ClientEventHandler<ClientEvent.BuyInsurance> = ({ handId }, playerId) => {
    const player = this.game.getPlayer(playerId)
    const insurance = player.buyInsurance(handId)

    this.emitters.emitEvent(ServerEvent.UpdateHandInsurance, {
      playerId,
      playerMoney: player.money,
      handId,
      insurance,
    })
    
    this.checkGameState()
  }

  private handleDeclineInsurance: ClientEventHandler<ClientEvent.DeclineInsurance> = ({ handId }, playerId) => {
    const player = this.game.getPlayer(playerId)
    const insurance = player.declineInsurance(handId)

    this.emitters.emitEvent(ServerEvent.UpdateHandInsurance, {
      playerId,
      playerMoney: player.money,
      handId,
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
