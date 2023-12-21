import { auth } from '$lib/server/lucia';
import * as sse from '$lib/server/sse';
import type { Handle } from '@sveltejs/kit';

sse.initialize();

export const handle: Handle = async ({ event, resolve }) => {
  // we can pass `event` because we used the SvelteKit middleware
  event.locals.auth = auth.handleRequest(event);
  return await resolve(event);
};
