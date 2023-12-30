import type { PrismaClient } from '@prisma/client';
import type { User } from '$lib/types/db';

export class UserService {
  constructor(private readonly prisma: PrismaClient) {}

  findByUsername = async (username: string): Promise<User | null> => {
    return this.prisma.user.findFirst({ where: { username } });
  };
}
