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
} from '$lib/types/realtime';
import { applyTableUpdate } from '$lib/apply-table-update';

import type { RedisService } from './redis-service';
import type { SSEService } from './sse-service';

export class TableService {
  constructor(private readonly redisService: RedisService, private readonly sseService: SSEService) {}

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

  setById = async (id: string, value: Table): Promise<void> => {
    const key = this.buildKey(id);
    return this.redisService.setJson(key, value, TableSchema);
  };

  // TODO pagination
  list = async (): Promise<Table[]> => {
    const keyPattern = this.buildKey('*');
    const keys = await this.redisService.listKeys(keyPattern);
    const tables = await Promise.all(keys.map((key) => this.getByKey(key)));
    return tables;
  };

  private update = async (tableOrTableId: string | Table, update: TableUpdate): Promise<Table> => {
    const table = typeof tableOrTableId === 'string' ? await this.getById(tableOrTableId) : tableOrTableId;
    const tableId = table.id;

    try {
      // Update table in Redis
      applyTableUpdate(table, update);
      await this.setById(tableId, table);

      // Broadcast changes to users
      await Promise.all(Object.values(table.players).map((p) => this.sseService.send(p.sseClientId, update)));

      return table;
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

  addPlayer = async (tableId: string, playerInfo: Pick<Player, 'id' | 'sseClientId' | 'name'>): Promise<Table> => {
    const player: Player = {
      ...playerInfo,
      tableId,
      money: 1000,
      ready: false,
    };

    const hand: PlayerHand = {
      cards: [],
      value: {
        hard: 0,
        soft: null,
      },
      status: HandStatus.Hitting,
      id: nanoid(),
      isRootHand: true,
      playerId: player.id,
      bet: undefined,
      insurance: null,
      actions: [],
      settleStatus: null,
      winnings: null,
    };

    const update: TableUpdate = {
      set: {
        [`players.${player.id}`]: player,
        [`playerHands.${hand.id}`]: hand,
      },
    };

    return this.update(tableId, update);
  };

  removePlayer = async (tableId: string, playerId: string): Promise<Table> => {
    const table = await this.getById(tableId);

    const playerHandIds = Object.values(table.playerHands)
      .filter((hand) => hand.playerId === playerId)
      .map((hand) => hand.id);

    const update: TableUpdate = {
      unset: [`players.${playerId}`, ...playerHandIds.map((handId) => `playerHands.${handId}`)],
    };
    return this.update(table, update);
  };

  addChatMessage = async (tableId: string, chatMessage: ChatMessage): Promise<Table> => {
    const table = await this.getById(tableId);

    const update: TableUpdate = {
      set: {
        [`chatMessages.${table.chatMessages.length}`]: chatMessage,
      },
    };

    return this.update(table, update);
  };

  readyPlayer = async (tableId: string, playerId: string): Promise<Table> => {
    const update: TableUpdate = {
      set: {
        [`players.${playerId}.ready`]: true,
      },
    };
    return this.update(tableId, update);
  };
}
