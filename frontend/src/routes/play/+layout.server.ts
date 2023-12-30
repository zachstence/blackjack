import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  const session = await locals.auth.validate();
  if (!session) {
    console.error('No session when running server load for /play');
    throw error(500);
  }

  return {
    user: session.user,
  };
};
