import { nanoid } from 'nanoid';

import {
  type Player,
  TableSchema,
  type Table,
  RoundState,
  HandStatus,
  type ChatMessage,
  type PlayerHand,
  type TableUpdate,
  type Hand,
} from '$lib/types/realtime';
import { applyTableUpdate } from '$lib/apply-table-update';

import type { RedisService } from './redis-service';
import type { SSEService } from './sse-service';
import type { PlayerHandService } from './player-hand-service';

export class TableService {
  constructor(
    private readonly redisService: RedisService,
    private readonly sseService: SSEService,
    private readonly playerHandService: PlayerHandService,
  ) {}

  private buildKey = (id: string) => `table-${id}`;

  private getByKey = (key: string): Promise<Table> => {
    return this.redisService.getJson(key, TableSchema);
  };

  create = async (): Promise<Table> => {
    const id = nanoid();
    const table: Table = {
      id,
      chatMessages: [],
      roundState: RoundState.PlayersReadying,
      shoe: [],
      dealer: {
        hand: {
          cards: [],
          status: HandStatus.Hitting,
          value: {
            hard: 0,
            soft: null,
          },
        },
      },
      players: {},
      playerHands: {},
    };
    const key = this.buildKey(id);

    await this.redisService.setJson(key, table, TableSchema);

    return table;
  };

  exists = async (tableId: string): Promise<boolean> => {
    const key = this.buildKey(tableId);
    return this.redisService.exists(key);
  };

  getById = async (id: string): Promise<Table> => {
    const key = this.buildKey(id);
    return this.getByKey(key);
  };

  set = async (table: Table): Promise<void> => {
    const key = this.buildKey(table.id);
    return this.redisService.setJson(key, table, TableSchema);
  };

  // TODO pagination
  list = async (): Promise<Table[]> => {
    const keyPattern = this.buildKey('*');
    const keys = await this.redisService.listKeys(keyPattern);
    const tables = await Promise.all(keys.map((key) => this.getByKey(key)));
    return tables;
  };

  private update = async (tableOrTableId: TableOrTableId, update: TableUpdate): Promise<void> => {
    const table = await this.useTableOrTableId(tableOrTableId);

    try {
      // Update table in Redis
      applyTableUpdate(table, update);
      await this.set(table);

      // Broadcast changes to users
      await Promise.all(Object.values(table.players).map((p) => this.sseService.send(p.sseClientId, update)));
    } catch (e) {
      // TODO handle errors better
      console.error(e);
      throw e;
    }
  };

  delete = async (tableId: string): Promise<void> => {
    const key = this.buildKey(tableId);
    await this.redisService.remove(key);
  };

  addPlayer = async (tableId: string, playerInfo: Pick<Player, 'id' | 'sseClientId' | 'name'>): Promise<void> => {
    const player: Player = {
      ...playerInfo,
      tableId,
      money: 1000,
      ready: false,
    };

    const hand = this.playerHandService.create(player.id, true);

    const update: TableUpdate = {
      set: {
        [`players.${player.id}`]: player,
        [`playerHands.${hand.id}`]: hand,
      },
    };

    await this.update(tableId, update);
  };

  removePlayer = async (tableId: string, playerId: string): Promise<void> => {
    const table = await this.getById(tableId);

    const playerHandIds = Object.values(table.playerHands)
      .filter((hand) => hand.playerId === playerId)
      .map((hand) => hand.id);

    const update: TableUpdate = {
      unset: [`players.${playerId}`, ...playerHandIds.map((handId) => `playerHands.${handId}`)],
    };
    await this.update(table, update);
  };

  addChatMessage = async (tableId: string, chatMessage: ChatMessage): Promise<void> => {
    const table = await this.getById(tableId);

    const update: TableUpdate = {
      set: {
        [`chatMessages.${table.chatMessages.length}`]: chatMessage,
      },
    };

    await this.update(table, update);
  };

  readyPlayer = async (tableId: string, playerId: string): Promise<void> => {
    const update: TableUpdate = {
      set: {
        [`players.${playerId}.ready`]: true,
      },
    };
    await this.update(tableId, update);
    await this.progressTableState(tableId);
  };

  clearHands = async (table: Table): Promise<void> => {
    // Remove all existing hands
    const existingHandIds = Object.values(table.playerHands).map((hand) => hand.id);
    const unset = existingHandIds.map((handId) => `playerHands.${handId}`);

    // Create a new hand for each player
    const newHands = Object.values(table.players).map((player) => this.playerHandService.create(player.id, true));
    const set = newHands.reduce<Record<string, PlayerHand>>((set, hand) => {
      set[`playerHands.${hand.id}`] = hand;
      return set;
    }, {});

    await this.update(table, { set, unset });
  };

  startPlacingBets = async (table: Table): Promise<void> => {
    await this.update(table, { set: { roundState: RoundState.PlacingBets } });

    const playerHands = Object.values(table.playerHands);
    const set = playerHands.reduce<Record<string, unknown>>((set, hand) => {
      set[`playerHands.${hand.id}.actions`] = this.playerHandService.getActions(hand, table);
      return set;
    }, {});
    await this.update(table, { set });

    await this.progressTableState(table);
  };

  progressTableState = async (tableOrTableId: TableOrTableId): Promise<void> => {
    const table = await this.useTableOrTableId(tableOrTableId);

    const numPlayers = Object.values(table.players).length;
    if (numPlayers === 0) return;

    const allPlayersReady = Object.values(table.players).every((player) => player.ready);
    if (table.roundState === RoundState.PlayersReadying && allPlayersReady) {
      await this.clearHands(table);
      await this.startPlacingBets(table);
    }
  };

  // Helpers
  useTableOrTableId = async (tableOrTableId: TableOrTableId): Promise<Table> => {
    if (typeof tableOrTableId === 'string') {
      return this.getById(tableOrTableId);
    }

    return tableOrTableId;
  };
}

type TableOrTableId = string | Table;
