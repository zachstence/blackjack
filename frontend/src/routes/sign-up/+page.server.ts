import { fail, redirect } from '@sveltejs/kit';

import { auth } from '$lib/server/lucia';
import type { Actions } from './$types';

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const formData = await request.formData();
    const username = formData.get('username');
    const password = formData.get('password');

    if (typeof username !== 'string' || typeof password !== 'string') {
      return fail(400);
    }

    try {
      const user = await auth.createUser({
        key: {
          providerId: 'username',
          providerUserId: username.toLowerCase(),
          password,
        },
        attributes: {
          username,
          is_guest: false,
        },
      });

      const session = await auth.createSession({
        userId: user.userId,
        attributes: {},
      });
      locals.auth.setSession(session);
    } catch (e) {
      console.error(e);
      return fail(500);
    }

    throw redirect(302, '/play');
  },
};
