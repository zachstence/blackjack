import type { User } from '@prisma/client';
import { prisma } from './prisma';

export const findByUsername = async (username: string): Promise<User | null> => {
  return prisma.user.findFirst({ where: { username } });
};
