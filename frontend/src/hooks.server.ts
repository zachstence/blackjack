import { building } from '$app/environment';
import { auth } from '$lib/server/lucia';
import { startupWebsocketServer, type ExtendedGlobal, GlobalThisWSS } from '$lib/server/ws';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  startupWebsocketServer();

  // Skip WebSocket server when pre-rendering pages
  if (!building) {
    const wss = (globalThis as ExtendedGlobal)[GlobalThisWSS];
    if (wss !== undefined) {
      event.locals.wss = wss;
    }
  }

  // we can pass `event` because we used the SvelteKit middleware
  event.locals.auth = auth.handleRequest(event);
  return await resolve(event);
};
