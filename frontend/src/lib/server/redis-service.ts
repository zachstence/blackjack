import IORedis from 'ioredis';
import type { ZodSchema, z } from 'zod';

const ioredis = new IORedis({
  host: 'redis',
  port: 6379,
});

export const setJson = async <S extends ZodSchema>(key: string, value: z.infer<S>, schema: S): Promise<void> => {
  schema.parse(value);
  await ioredis.call('json.set', key, '$', JSON.stringify(value));
};

export const setJsonField = async <S extends ZodSchema>(
  key: string,
  path: string,
  value: z.infer<S>,
  schema: S,
): Promise<void> => {
  schema.parse(value);
  await ioredis.call('json.set', key, path, JSON.stringify(value));
};

export const getJson = async <S extends ZodSchema>(key: string, schema: S): Promise<z.infer<S>> => {
  const raw = (await ioredis.call('json.get', key)) as string;
  const value = JSON.parse(raw);
  return schema.parse(value);
};

export const listKeys = async (pattern: string): Promise<string[]> => {
  return ioredis.keys(pattern);
};

export const remove = async (key: string): Promise<void> => {
  await ioredis.del(key);
};
