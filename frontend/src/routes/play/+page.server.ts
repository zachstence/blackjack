import type { PageServerLoad } from './$types';
import { auth } from '$lib/server/lucia';
import { nanoid } from 'nanoid';
import { faker } from '@faker-js/faker';
import type { Session } from 'lucia';

export const load: PageServerLoad = async ({ locals }) => {
  let session = await locals.auth.validate();
  if (!session) {
    session = await createGuestUserAndSession();
    locals.auth.setSession(session);
  }

  return {
    username: session.user.username,
    isGuest: session.user.isGuest,
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
