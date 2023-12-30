import { auth } from '$lib/server/lucia';
import { faker } from '@faker-js/faker';
import type { Session } from 'lucia';
import { nanoid } from 'nanoid';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  let session = await locals.auth.validate();
  if (!session) {
    session = await createGuestUserAndSession();
    locals.auth.setSession(session);
  }

  return {
    user: session.user,
  };
};

const createGuestUserAndSession = async (): Promise<Session> => {
  const guestUser = await auth.createUser({
    key: {
      providerId: 'guest',
      providerUserId: nanoid(),
      password: null,
    },
    attributes: {
      username: generateGuestUsername(),
      is_guest: true,
    },
  });

  const session = await auth.createSession({
    userId: guestUser.userId,
    attributes: {},
  });

  return session;
};

const generateGuestUsername = (): string =>
  `${faker.word.adjective()}-${faker.word.noun()}-${faker.number.int({ min: 10, max: 99 })}`.toLowerCase();
