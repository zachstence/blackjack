import { nanoid } from 'nanoid';

import {
  type Player,
  TableSchema,
  type Table,
  RoundState,
  HandStatus,
  type ChatMessage,
  type PlayerHand,
} from '$lib/types/realtime';
import type { RedisService } from './redis-service';

export class TableService {
  constructor(private readonly redisService: RedisService) {}

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

  remove = async (tableId: string): Promise<void> => {
    const key = this.buildKey(tableId);
    await this.redisService.remove(key);
  };

  exists = async (tableId: string): Promise<boolean> => {
    const key = this.buildKey(tableId);
    return this.redisService.exists(key);
  };

  getById = async (id: string): Promise<Table> => {
    const key = this.buildKey(id);
    return this.getByKey(key);
  };

  // TODO pagination
  list = async (): Promise<Table[]> => {
    const keyPattern = this.buildKey('*');
    const keys = await this.redisService.listKeys(keyPattern);
    const tables = await Promise.all(keys.map((key) => this.getByKey(key)));
    return tables;
  };

  addPlayer = async (tableId: string, player: Player): Promise<Table> => {
    const key = this.buildKey(tableId);
    const table = await this.getByKey(key);

    table.players[player.id] = player;

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
    table.playerHands[hand.id] = hand;

    await this.redisService.setJson(key, table, TableSchema);

    return table;
  };

  removePlayer = async (tableId: string, playerId: string): Promise<Table> => {
    const key = this.buildKey(tableId);
    const table = await this.getByKey(key);

    // Remove player
    delete table.players[playerId];

    // Remove player hands
    Object.values(table.playerHands)
      .filter((hand) => hand.playerId === playerId)
      .forEach((hand) => {
        delete table.playerHands[hand.id];
      });

    await this.redisService.setJson(key, table, TableSchema);
    return table;
  };

  addChatMessage = async (tableId: string, chatMessage: ChatMessage): Promise<Table> => {
    const key = this.buildKey(tableId);
    const table = await this.getByKey(key);
    table.chatMessages.push(chatMessage);
    await this.redisService.setJson(key, table, TableSchema);

    return table;
  };
}
