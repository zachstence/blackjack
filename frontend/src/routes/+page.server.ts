import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

import { auth } from '$lib/server/lucia';

export const actions: Actions = {
  logout: async ({ locals }) => {
    const session = await locals.auth.validate();
    if (session) {
      await auth.invalidateSession(session.sessionId);
    }
    locals.auth.setSession(null);

    throw redirect(302, '/login');
  },
};
