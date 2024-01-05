import { prisma } from './prisma';
import { RedisService, SSEService, TableService, UserService } from './services';

const redisService = new RedisService();

export const sseService = new SSEService();

export const tableService = new TableService(redisService, sseService);

export const userService = new UserService(prisma);
