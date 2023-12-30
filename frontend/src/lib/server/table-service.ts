import { nanoid } from 'nanoid';

import { redisService } from '$lib/server';
import { type Player, TableSchema, type Table, RoundState, HandStatus, type ChatMessage } from '$lib/types/realtime';

const buildKey = (id: string) => `table-${id}`;

export const create = async (): Promise<Table> => {
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
  const key = buildKey(id);

  await redisService.setJson(key, table, TableSchema);

  return table;
};

export const remove = async (tableId: string): Promise<void> => {
  const key = buildKey(tableId);
  await redisService.remove(key);
};

export const exists = async (tableId: string): Promise<boolean> => {
  const key = buildKey(tableId);
  return redisService.exists(key);
};

const getByKey = (key: string): Promise<Table> => {
  return redisService.getJson(key, TableSchema);
};

export const getById = async (id: string): Promise<Table> => {
  const key = buildKey(id);
  return getByKey(key);
};

// TODO pagination
export const list = async (): Promise<Table[]> => {
  const keyPattern = buildKey('*');
  const keys = await redisService.listKeys(keyPattern);
  const tables = await Promise.all(keys.map((key) => getByKey(key)));
  return tables;
};

export const addPlayer = async (tableId: string, player: Player): Promise<Table> => {
  const key = buildKey(tableId);
  const table = await getByKey(key);
  table.players[player.id] = player;
  await redisService.setJson(key, table, TableSchema);

  return table;
};

export const removePlayer = async (tableId: string, playerId: string): Promise<Table> => {
  const key = buildKey(tableId);
  const table = await getByKey(key);
  delete table.players[playerId];
  await redisService.setJson(key, table, TableSchema);
  return table;
};

export const addChatMessage = async (tableId: string, chatMessage: ChatMessage): Promise<Table> => {
  const key = buildKey(tableId);
  const table = await getByKey(key);
  table.chatMessages.push(chatMessage);
  await redisService.setJson(key, table, TableSchema);

  return table;
};
