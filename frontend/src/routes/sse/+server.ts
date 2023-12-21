import { nanoid } from 'nanoid';
import type { RequestHandler } from './$types';

import { addClient, removeClient } from '$lib/server/sse';

export const GET: RequestHandler = async () => {
  const id = nanoid();

  const body = new ReadableStream({
    start: (controller) => addClient(id, controller),
    cancel: () => removeClient(id),
  });

  const headers = {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
  };

  return new Response(body, { headers });
};
