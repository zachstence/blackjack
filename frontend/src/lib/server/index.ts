import { prisma } from './prisma';
import { RedisService, SSEService, TableService, UserService } from './services';
import { PlayerHandService } from './services/player-hand-service';

const redisService = new RedisService();

export const sseService = new SSEService();

const playerHandService = new PlayerHandService();
export const tableService = new TableService(redisService, sseService, playerHandService);

export const userService = new UserService(prisma);
