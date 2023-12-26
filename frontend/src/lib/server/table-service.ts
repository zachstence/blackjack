import { nanoid } from 'nanoid';

import { redisService } from '$lib/server';
import { type Player, TableSchema, type Table } from '$lib/types/realtime';
import type { ChatMessage } from '$lib/types/realtime/chat-message.types';

const buildKey = (id: string) => `table-${id}`;

export const create = async (): Promise<Table> => {
  const id = nanoid();
  const table: Table = {
    id,
    chatMessages: [],
    players: [],
  };
  const key = buildKey(id);

  await redisService.setJson(key, table, TableSchema);

  return table;
};

export const remove = async (tableId: string): Promise<void> => {
  const key = buildKey(tableId);
  await redisService.remove(key);
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
  const keys = await redisService.listKeys(buildKey('*'));
  console.log('tableService.list', keys);
  const tables = await Promise.all(keys.map((key) => getByKey(key)));
  return tables;
};

export const addPlayer = async (tableId: string, player: Player): Promise<Table> => {
  const key = buildKey(tableId);
  const table = await getByKey(key);
  table.players.push(player);
  await redisService.setJson(key, table, TableSchema);

  return table;
};

export const removePlayer = async (tableId: string, playerId: string): Promise<void> => {
  const key = buildKey(tableId);
  const table = await getByKey(key);
  table.players = table.players.filter((p) => p.id !== playerId);
  await redisService.setJson(key, table, TableSchema);
};

export const addChatMessage = async (tableId: string, chatMessage: ChatMessage): Promise<Table> => {
  const key = buildKey(tableId);
  const table = await getByKey(key);
  table.chatMessages.push(chatMessage);
  await redisService.setJson(key, table, TableSchema);

  return table;
};
