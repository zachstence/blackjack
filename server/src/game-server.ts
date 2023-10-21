import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';

import {
  ClientEvent,
  RoundState,
  ServerEvent,
  ServerEventArgs,
  ClientEventArgs,
  IPlayerHand,
  DealerHandAction,
} from 'blackjack-types';
import { ClientEventHandlers, ClientEventHandler } from './types';
import { Game } from './game/game';

export class GameServer {
  private readonly server: SocketServer;

  private clientEventHandlers: ClientEventHandlers;

  private game: Game;

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
    };

    this.server = new SocketServer(httpServer, {
      cors: {
        origin: '*',
      },
    });

    this.server.on('connection', socket => {
      // TODO decouple playerId from socket ID
      const playerId = socket.id;

      socket.onAny((event, args) => {
        this.handleClientEvent(event, args, playerId);
      });

      socket.on('disconnect', () => {
        this.handleClientEvent(ClientEvent.Leave, {}, playerId);
      });
    });

    this.game = new Game();
  }

  private reset = (): void => {
    this.game = new Game();

    this.emitServerEvent(ServerEvent.Reset, {});
  };

  emitServerEvent = <E extends ServerEvent>(event: E, args: ServerEventArgs<E>): void => {
    this.server.emit(event, args);
    console.debug(`Emitted server event ${event}`, { args });
  };

  emitServerEventTo = <E extends ServerEvent>(playerId: string, event: E, args: ServerEventArgs<E>): void => {
    // TODO decouple playerId from socket ID
    const socketId = playerId;
    const socket = this.server.sockets.sockets.get(socketId);
    if (!socket) throw new Error(`Failed to find socket for playerId ${playerId}`);
    socket.emit(event, args);
    console.debug(`Emitted server event ${event} to ${playerId}`, { args });
  };

  handleClientEvent = <E extends ClientEvent>(event: E, args: ClientEventArgs<E>, playerId: string): void => {
    console.debug(`Received client event ${event}`, { playerId, args });

    const handler = this.clientEventHandlers[event];
    if (typeof handler !== 'undefined') {
      handler(args, playerId);
    } else {
      console.error(`No handler registered for ${event}`);
    }
  };

  // ====================
  // Gameplay
  // ====================
  // TODO this should live in GameState
  private checkGameState = (): void => {
    if (this.game.roundState === RoundState.PlayersReadying && this.game.allPlayersReady) {
      this.clearHands();
      this.collectBets();
    }

    if (this.game.roundState === RoundState.PlacingBets && this.game.allPlayerHandsHaveBet) {
      this.deal();
      if (this.game.shouldOfferInsurance) {
        this.offerInsurance();
      } else {
        this.playPlayers();
      }
    }

    if (this.game.roundState === RoundState.Insuring && this.game.allPlayerHandsHaveBoughtOrDeclinedInsurance) {
      this.settleInsurance();
      this.playPlayers();
    }

    if (this.game.roundState === RoundState.PlayersPlaying && this.game.allPlayerHandsHaveFinishedHitting) {
      this.playDealer();
    }

    if (this.game.roundState === RoundState.DealerPlaying && this.game.dealerIsDonePlaying) {
      this.settle();
      this.unReadyPlayers();
    }
  };

  private collectBets = (): void => {
    this.game.roundState = RoundState.PlacingBets;
    this.emitServerEvent(ServerEvent.GameStateChange, { gameState: this.game.roundState });
    this.game.playerHands.forEach(hand => {
      this.emitServerEvent(ServerEvent.UpdateHand, {
        handId: hand.id,
        hand: hand.toClientJSON(),
      });
    });
  };

  private deal = (): void => {
    this.game.deal();

    // TODO this object exists in GameState, but we have to access it via the array getter. Is there a better way?
    const playerHands = this.game.playerHands.reduce<Record<string, IPlayerHand>>((acc, hand) => {
      acc[hand.id] = hand.toClientJSON();
      return acc;
    }, {});

    this.emitServerEvent(ServerEvent.Dealt, {
      dealerHand: this.game.dealer.hand.toClientJSON(),
      playerHands,
    });
  };

  private offerInsurance = (): void => {
    this.game.roundState = RoundState.Insuring;
    this.emitServerEvent(ServerEvent.GameStateChange, { gameState: this.game.roundState });

    // All root hands can insure
    this.game.allPlayerRootHands.forEach(hand => {
      hand.offerInsurance();

      this.emitServerEvent(ServerEvent.UpdateHand, {
        handId: hand.id,
        hand: hand.toClientJSON(),
      });
    });
  };

  private settleInsurance = (): void => {
    this.game.settleInsurance();

    this.game.playerHands.forEach(hand => {
      this.emitServerEvent(ServerEvent.UpdateHand, {
        handId: hand.id,
        hand: hand.toClientJSON(),
      });
    });

    this.game.players.forEach(player => {
      this.emitServerEvent(ServerEvent.UpdatePlayerMoney, {
        playerId: player.id,
        money: player.money,
      });
    });
  };

  private playPlayers = (): void => {
    this.game.roundState = RoundState.PlayersPlaying;

    this.game.playerHands.forEach(hand => {
      this.emitServerEvent(ServerEvent.UpdateHand, {
        handId: hand.id,
        hand: hand.toClientJSON(),
      });
    });

    this.emitServerEvent(ServerEvent.GameStateChange, { gameState: this.game.roundState });
  };

  private playDealer = (): void => {
    const actions = this.game.playDealer();

    this.emitServerEvent(ServerEvent.GameStateChange, { gameState: this.game.roundState });

    actions.forEach(action => {
      if (action.action === DealerHandAction.Reveal) {
        this.emitServerEvent(ServerEvent.RevealDealerHand, { hand: this.game.dealer.hand.toClientJSON() });
      } else if (action.action === DealerHandAction.Hit) {
        this.emitServerEvent(ServerEvent.DealerHit, {
          card: action.card,
          hand: this.game.dealer.hand.toClientJSON(),
        });
      } else {
        this.emitServerEvent(ServerEvent.DealerStand, {
          hand: this.game.dealer.hand.toClientJSON(),
        });
      }
    });
  };

  private settle = (): void => {
    this.game.settleBets();

    this.game.playerHands.forEach(hand => {
      this.emitServerEvent(ServerEvent.UpdateHand, {
        handId: hand.id,
        hand: hand.toClientJSON(),
      });
    });

    this.game.players.forEach(player => {
      this.emitServerEvent(ServerEvent.UpdatePlayerMoney, {
        playerId: player.id,
        money: player.money,
      });
    });
  };

  private clearHands = (): void => {
    this.game.clearHands();

    // TODO this object exists in GameState, but we have to access it via the array getter. Is there a better way?
    type PlayerHands = { [handId: string]: IPlayerHand };
    const playerHands = this.game.playerHands.reduce<PlayerHands>((acc, hand) => {
      acc[hand.id] = hand.toClientJSON();
      return acc;
    }, {});

    this.emitServerEvent(ServerEvent.ClearHands, {
      dealerHand: this.game.dealer.hand.toClientJSON(),
      playerHands,
    });
  };

  private unReadyPlayers = (): void => {
    Object.values(this.game.players).forEach(player => (player.ready = false));
    this.emitReadyPlayers();

    this.game.roundState = RoundState.PlayersReadying;
    this.emitServerEvent(ServerEvent.GameStateChange, { gameState: this.game.roundState });
  };

  // ====================
  // Event Handlers
  // ====================
  private handlePlayerJoin: ClientEventHandler<ClientEvent.PlayerJoin> = ({ name }, playerId) => {
    const player = this.game.addPlayer(playerId, name);
    const hand = this.game.playerHands.find(hand => hand.playerId === player.id);
    if (!hand) throw new Error(`Can't find hand for new player ${player.id}`);

    this.emitServerEventTo(playerId, ServerEvent.JoinSuccess, { game: this.game.toClientJSON() });
    this.emitServerEvent(ServerEvent.PlayerJoined, {
      player: player.toClientJSON(),
      hand: hand.toClientJSON(),
    });
    this.checkGameState();
  };

  private handleLeave: ClientEventHandler<ClientEvent.Leave> = (_, playerId) => {
    this.game.removePlayer(playerId);

    this.emitServerEvent(ServerEvent.PlayerLeft, { playerId });
    this.checkGameState();
  };

  private handlePlaceBet: ClientEventHandler<ClientEvent.PlaceBet> = ({ handId, amount }, playerId) => {
    this.game.bet(playerId, handId, amount);

    const player = this.game.getPlayer(playerId);
    const hand = this.game.getPlayerHand(playerId, handId);

    this.emitServerEvent(ServerEvent.UpdateHand, {
      handId,
      hand: hand.toClientJSON(),
    });

    this.emitServerEvent(ServerEvent.UpdatePlayerMoney, {
      playerId,
      money: player.money,
    });

    this.checkGameState();
  };

  private handleHit: ClientEventHandler<ClientEvent.Hit> = ({ handId }, playerId) => {
    this.game.hit(playerId, handId);

    const hand = this.game.getPlayerHand(playerId, handId);

    this.emitServerEvent(ServerEvent.UpdateHand, {
      handId,
      hand: hand.toClientJSON(),
    });

    this.checkGameState();
  };

  private handleDouble: ClientEventHandler<ClientEvent.Double> = ({ handId }, playerId) => {
    this.game.double(playerId, handId);

    const player = this.game.getPlayer(playerId);
    const hand = this.game.getPlayerHand(playerId, handId);

    this.emitServerEvent(ServerEvent.UpdateHand, {
      handId,
      hand: hand.toClientJSON(),
    });

    this.emitServerEvent(ServerEvent.UpdatePlayerMoney, {
      playerId,
      money: player.money,
    });

    this.checkGameState();
  };

  private handleSplit: ClientEventHandler<ClientEvent.Split> = ({ handId }, playerId) => {
    const hands = this.game.split(playerId, handId);
    const player = this.game.getPlayer(playerId);

    this.emitServerEvent(ServerEvent.UpdatePlayerMoney, {
      playerId,
      money: player.money,
    });

    this.emitServerEvent(ServerEvent.RemoveHand, { handId });

    hands.forEach(hand => {
      this.emitServerEvent(ServerEvent.AddHand, {
        handId: hand.id,
        hand: hand.toClientJSON(),
      });
    });
  };

  private handleStand: ClientEventHandler<ClientEvent.Stand> = ({ handId }, playerId) => {
    this.game.stand(playerId, handId);

    const hand = this.game.getPlayerHand(playerId, handId);

    this.emitServerEvent(ServerEvent.UpdateHand, {
      handId,
      hand: hand.toClientJSON(),
    });

    this.checkGameState();
  };

  private handleBuyInsurance: ClientEventHandler<ClientEvent.BuyInsurance> = ({ handId }, playerId) => {
    this.game.buyInsurance(playerId, handId);

    const player = this.game.getPlayer(playerId);
    const hand = this.game.getPlayerHand(playerId, handId);

    this.emitServerEvent(ServerEvent.UpdatePlayerMoney, {
      playerId,
      money: player.money,
    });

    this.emitServerEvent(ServerEvent.UpdateHand, {
      handId,
      hand: hand.toClientJSON(),
    });

    this.checkGameState();
  };

  private handleDeclineInsurance: ClientEventHandler<ClientEvent.DeclineInsurance> = ({ handId }, playerId) => {
    this.game.declineInsurance(playerId, handId);

    const hand = this.game.getPlayerHand(playerId, handId);

    this.emitServerEvent(ServerEvent.UpdateHand, {
      handId,
      hand: hand.toClientJSON(),
    });

    this.checkGameState();
  };

  private emitReadyPlayers = (): void => {
    const players = Object.values(this.game.players).reduce<ServerEventArgs<ServerEvent.ReadyPlayers>['players']>(
      (acc, player) => {
        acc[player.id] = { ready: player.ready };
        return acc;
      },
      {},
    );
    this.emitServerEvent(ServerEvent.ReadyPlayers, { players });
  };

  private handleReady: ClientEventHandler<ClientEvent.Ready> = (_, playerId) => {
    const player = this.game.getPlayer(playerId);

    player.ready = true;
    this.emitReadyPlayers();
    this.checkGameState();
  };

  private handleReset: ClientEventHandler<ClientEvent.Reset> = () => {
    console.log('\n\n==============================\n');
    console.log('RESET');
    console.log('\n==============================\n\n');
    this.reset();
  };
}
