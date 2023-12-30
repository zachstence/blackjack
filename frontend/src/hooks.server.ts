import type { Handle } from '@sveltejs/kit';
import { faker } from '@faker-js/faker';
import type { Session } from 'lucia';
import { nanoid } from 'nanoid';

import { auth } from '$lib/server/lucia';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.auth = auth.handleRequest(event);

  // A session is required to play, so create a guest session if user isn't logged in
  if (event.url.pathname.startsWith('/play')) {
    let session = await event.locals.auth.validate();
    if (!session) {
      session = await createGuestUserAndSession();
      event.locals.auth.setSession(session);
    }
  }

  return await resolve(event);
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
