import { userService } from '$lib/server';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const user = await userService.findByUsername(params.username);
  if (!user) throw error(404);
  return { user };
};
