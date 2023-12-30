import IORedis from 'ioredis';
import type { ZodSchema, z } from 'zod';

export class RedisService {
  private client: IORedis;

  constructor() {
    this.client = new IORedis({
      host: 'redis',
      port: 6379,
    });
  }

  setJson = async <S extends ZodSchema>(key: string, value: z.infer<S>, schema: S): Promise<void> => {
    schema.parse(value);
    await this.client.call('json.set', key, '$', JSON.stringify(value));
  };

  setJsonField = async <S extends ZodSchema>(
    key: string,
    path: string,
    value: z.infer<S>,
    schema: S,
  ): Promise<void> => {
    schema.parse(value);
    await this.client.call('json.set', key, path, JSON.stringify(value));
  };

  getJson = async <S extends ZodSchema>(key: string, schema: S): Promise<z.infer<S>> => {
    const raw = (await this.client.call('json.get', key)) as string;
    const value = JSON.parse(raw);
    return schema.parse(value);
  };

  listKeys = async (pattern: string): Promise<string[]> => {
    return this.client.keys(pattern);
  };

  remove = async (key: string): Promise<void> => {
    await this.client.del(key);
  };

  exists = async (key: string): Promise<boolean> => {
    return Boolean(await this.client.exists(key));
  };
}
