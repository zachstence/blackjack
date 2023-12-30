import { lucia } from 'lucia';
import { sveltekit } from 'lucia/middleware';
import { prisma } from '@lucia-auth/adapter-prisma';
import { dev } from '$app/environment';

import { prisma as prismaClient } from './prisma';

// expect error (see next section)
export const auth = lucia({
  env: dev ? 'DEV' : 'PROD',
  middleware: sveltekit(),
  adapter: prisma(prismaClient),

  getUserAttributes: (data) => data,
});

export type Auth = typeof auth;
