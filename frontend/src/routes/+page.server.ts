import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import { auth } from '$lib/server/lucia';
import { tableService } from '$lib/server';

export const load: PageServerLoad = async () => {
  const tables = await tableService.list();

  return {
    tables,
  };
};

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
