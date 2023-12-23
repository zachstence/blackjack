import { nanoid } from 'nanoid';

import { redisService } from '$lib/server';
import { type Player, TableSchema, type Table } from '$lib/types/realtime';

const buildKey = (id: string) => `table-${id}`;

export const create = async (): Promise<Table> => {
  const id = nanoid();
  const table = {
    id,
    players: [],
  };
  const key = buildKey(id);

  await redisService.setJson(key, table, TableSchema);

  return table;
};

export const getById = async (id: string): Promise<Table> => {
  const key = buildKey(id);
  return redisService.getJson(key, TableSchema);
};

export const addPlayer = async (tableId: string, player: Player): Promise<Table> => {
  const key = buildKey(tableId);
  const table = await redisService.getJson(key, TableSchema);
  table.players.push(player);
  await redisService.setJson(key, table, TableSchema);

  return table;
};

export const removePlayer = async (tableId: string, playerId: string): Promise<void> => {
  const key = buildKey(tableId);
  const table = await redisService.getJson(key, TableSchema);
  table.players = table.players.filter((p) => p.id !== playerId);
  await redisService.setJson(key, table, TableSchema);
};
