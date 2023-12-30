import { prisma } from './prisma';
import { RedisService, SSEService, TableService, UserService } from './services';

const redisService = new RedisService();

export const sseService = new SSEService();

export const tableService = new TableService(redisService);

export const userService = new UserService(prisma);
