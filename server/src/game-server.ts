import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http'

import { ClientEvent, RoundState, HandAction, ServerEvent, ServerEventArgs, ClientEventArgs, IPlayerHand } from 'blackjack-types';
import { ClientEventHandlers, ClientEventHandler } from './types';
import { GameState } from './game-state/game-state';

export class GameServer {
  private readonly server: SocketServer

  private clientEventHandlers: ClientEventHandlers

  private game: GameState

  constructor(httpServer: HttpServer) {
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

    this.server = new SocketServer(httpServer, {
      cors: {
        origin: '*',
      },
    });
    
    this.server.on('connection', socket => {
      // TODO decouple playerId from socket ID
      const playerId = socket.id

      socket.onAny((event, args) => {
        this.handleClientEvent(event, args, playerId)    
      })
      
      socket.on('disconnect', () => {
        this.handleClientEvent(ClientEvent.Leave, {}, playerId)
      })
    })

    this.game = new GameState()
    this.game.resetShoe()
  }

  private reset = (): void => {
    this.game = new GameState()
    this.game.resetShoe()

    this.emitServerEvent(ServerEvent.Reset, {})
  }

  emitServerEvent = <E extends ServerEvent>(event: E, args: ServerEventArgs<E>): void => {
    this.server.emit(event, args)
  }

  emitServerEventTo = <E extends ServerEvent>(playerId: string, event: E, args: ServerEventArgs<E>): void => {
    // TODO decouple playerId from socket ID
    const socketId = playerId
    const socket = this.server.sockets.sockets.get(socketId)
    if (!socket) throw new Error(`Failed to find socket for playerId ${playerId}`)
    socket.emit(event, args)
  }

  handleClientEvent = <E extends ClientEvent>(event: E, args: ClientEventArgs<E>, playerId: string): void => {
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
  private checkGameState = (): void => {
    if (this.game.roundState === RoundState.PlayersReadying && this.game.allPlayersReady) {
      this.clearHands()
      this.collectBets()
    }
    
    if (this.game.roundState === RoundState.PlacingBets && this.game.allPlayerHandsHaveBet) {
      this.deal()
      if (this.game.shouldOfferInsurance) {
        this.offerInsurance()
      } else {
        this.playPlayers()
      }
    }

    if (this.game.roundState === RoundState.Insuring && this.game.allPlayerHandsHaveBoughtOrDeclinedInsurance) {
      this.settleInsurance()
      this.playPlayers()
    }
    
    if (this.game.roundState === RoundState.PlayersPlaying && this.game.allPlayerHandsHaveFinishedHitting) {
      this.playDealer()
    }
    
    if (this.game.roundState === RoundState.DealerPlaying && this.game.dealerIsDonePlaying) {
      this.settle()
      this.unReadyPlayers()
    }
  }

  private collectBets = (): void => {
    this.game.roundState = RoundState.PlacingBets
    this.emitServerEvent(ServerEvent.GameStateChange, { gameState: this.game.roundState })
  }

  private deal = (): void => {
    this.game.deal()

    const handsByPlayerId = this.game.allPlayerHands.reduce<Record<string, IPlayerHand>>((acc, hand) => {
      acc[hand.playerId] = hand.toClientJSON()
      return acc
    }, {})

    this.emitServerEvent(ServerEvent.Dealt, {
      dealerHand: this.game.dealer.hand.toClientJSON(),
      handsByPlayerId,
    })
  }

  private offerInsurance = (): void => {
    this.game.roundState = RoundState.Insuring
    this.emitServerEvent(ServerEvent.GameStateChange, { gameState: this.game.roundState })

    // All root hands can insure
    this.game.allPlayerRootHands.forEach(hand => {
      hand.offerInsurance()

      this.emitServerEvent(ServerEvent.UpdateHand, {
        playerId: hand.playerId,
        handId: hand.id,
        hand: hand.toClientJSON(),
      })
    })
  }

  private settleInsurance = (): void => {
    this.game.settleInsurance()

    Object.values(this.game.playersWithHands).forEach(player => {
      Object.values(player.hands).forEach(hand => {
        this.emitServerEvent(ServerEvent.UpdateHandInsurance, {
          playerId: player.id,
          handId: hand.id,
          insurance: hand.toClientJSON().insurance,
          playerMoney: player.money,
        })

        this.emitServerEvent(ServerEvent.UpdateHand, {
          playerId: player.id,
          handId: hand.id,
          hand: hand.toClientJSON(),
        })
      })
    })
  }

  private playPlayers = (): void => {
    this.game.roundState = RoundState.PlayersPlaying

    this.game.allPlayerHands.forEach(hand => {
      this.emitServerEvent(ServerEvent.UpdateHand, {
        playerId: hand.playerId,
        handId: hand.id,
        hand: hand.toClientJSON(),
      })
    })

    this.emitServerEvent(ServerEvent.GameStateChange, { gameState: this.game.roundState })
  }

  private playDealer = (): void => {
    const actions = this.game.playDealer()
    this.emitServerEvent(ServerEvent.GameStateChange, { gameState: this.game.roundState })
    actions.forEach(action => {
      if (action.action === HandAction.Hit) {
        this.emitServerEvent(ServerEvent.DealerHit, {
          card: action.card,
          hand: this.game.dealer.hand.toClientJSON()
        })
      } else {
        this.emitServerEvent(ServerEvent.DealerStand, {
          hand: this.game.dealer.hand.toClientJSON()
        })
      }
    })
  }

  private settle = (): void => {
    this.game.settleBets()

    type SettledHands = ServerEventArgs<ServerEvent.Settled>['settledHands']
    type PlayerMoney = ServerEventArgs<ServerEvent.Settled>['playerMoney']
    
    const settledHands = this.game.allPlayerHands.reduce<SettledHands>((acc, hand) => {
        acc[hand.id] = hand.toClientJSON()
        return acc
      }, {})
    
    const playerMoney = this.game.players.reduce<PlayerMoney>((acc, player) => {
      acc[player.id] = player.money
      return acc
    }, {})

    this.emitServerEvent(ServerEvent.Settled, { settledHands, playerMoney })
  }

  private clearHands = (): void => {
    this.game.dealer.hand.clear()

    type HandsByPlayerId = ServerEventArgs<ServerEvent.ClearHands>['handsByPlayerId']
    const handsByPlayerId = this.game.players.reduce<HandsByPlayerId>((acc, player) => {
      player.clearHands()
      acc[player.id] = Object.fromEntries(Object.entries(player.hands).map(([handId, hand]) => [handId, hand.toClientJSON()]))
      return acc
    }, {})

    this.emitServerEvent(ServerEvent.ClearHands, {
      dealerHand: this.game.dealer.hand.toClientJSON(),
      handsByPlayerId,
    })
  }

  private unReadyPlayers = (): void => {
    Object.values(this.game.players).forEach(player => player.ready = false)
    this.emitReadyPlayers()

    this.game.roundState = RoundState.PlayersReadying
    this.emitServerEvent(ServerEvent.GameStateChange, { gameState: this.game.roundState })
  }

  // ====================
  // Event Handlers
  // ====================
  private handlePlayerJoin: ClientEventHandler<ClientEvent.PlayerJoin> = ({ name }, playerId) => {
    const player = this.game.addPlayer(playerId, name)

    this.emitServerEventTo(playerId, ServerEvent.JoinSuccess, { game: this.game.toClientJSON() })
    this.emitServerEvent(ServerEvent.PlayerJoined, { player: player.toClientJSON() })
    this.checkGameState()
  };

  private handleLeave: ClientEventHandler<ClientEvent.Leave> = (_, playerId) => {
    this.game.removePlayer(playerId)
    
    this.emitServerEvent(ServerEvent.PlayerLeft, { playerId })
    this.checkGameState()
  }

  private handlePlaceBet: ClientEventHandler<ClientEvent.PlaceBet> = ({ handId, amount }, playerId) => {
    const player = this.game.getPlayer(playerId)
    player.bet(handId, amount)

    this.emitServerEvent(ServerEvent.PlayerBet, {
      playerId: player.id,
      money: player.money,
      handId,
      bet: amount,
    })

    this.checkGameState()
  }

  private handleHit: ClientEventHandler<ClientEvent.Hit> = ({ handId }, playerId) => {
    const hand = this.game.getPlayer(playerId).hit(handId).toClientJSON()

    this.emitServerEvent(ServerEvent.PlayerHit, {
      playerId: playerId,
      handId: handId,
      hand,
    })

    this.checkGameState()
  }

  private handleDouble: ClientEventHandler<ClientEvent.Double> = ({ handId }, playerId) => {
    const player = this.game.getPlayer(playerId)
    const hand = player.double(handId)

    this.emitServerEvent(ServerEvent.PlayerDoubled, {
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

    this.emitServerEvent(ServerEvent.PlayerSplit, {
      playerId,
      money: player.money,
      hands: player.toClientJSON().hands,
    })

    this.emitServerEvent(ServerEvent.PlayerHit, {
      playerId,
      handId: hand1.id,
      hand: hand1.toClientJSON(),
    })

    this.emitServerEvent(ServerEvent.PlayerHit, {
      playerId,
      handId: hand2.id,
      hand: hand2.toClientJSON(),
    })
  }

  private handleStand: ClientEventHandler<ClientEvent.Stand> = ({ handId }, playerId) => {
    const hand = this.game.getPlayer(playerId).stand(handId)

    this.emitServerEvent(ServerEvent.PlayerStand, {
      playerId,
      handId,
      hand: hand.toClientJSON(),
    })

    this.checkGameState()
  }

  private handleBuyInsurance: ClientEventHandler<ClientEvent.BuyInsurance> = ({ handId }, playerId) => {
    const player = this.game.getPlayer(playerId)
    const insurance = player.buyInsurance(handId)

    this.emitServerEvent(ServerEvent.UpdateHandInsurance, {
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

    this.emitServerEvent(ServerEvent.UpdateHandInsurance, {
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
    this.emitServerEvent(ServerEvent.ReadyPlayers, { players })
  }

  private handleReady: ClientEventHandler<ClientEvent.Ready> = (_, playerId) => {
    const player = this.game.getPlayer(playerId)

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
