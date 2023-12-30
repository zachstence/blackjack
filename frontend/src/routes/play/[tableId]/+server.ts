import { error } from '@sveltejs/kit';
import { nanoid } from 'nanoid';
import type { RequestHandler } from './$types';

import { sseService, tableService } from '$lib/server';
import type { Player } from '$lib/types/realtime';

export const GET: RequestHandler = async ({ params, locals }) => {
  const session = await locals.auth.validate();
  if (!session) throw error(400);

  const player: Player = {
    id: nanoid(),
    userId: session.user.userId,
    sseClientId: nanoid(),
    tableId: params.tableId,
    name: session.user.username,
  };

  return createEventStreamResponse(params.tableId, player);
};

const createEventStreamResponse = (tableId: string, player: Player): Response => {
  const body = new ReadableStream({
    start: async (controller) => {
      sseService.addClient(player.sseClientId, controller);

      const table = await tableService.addPlayer(tableId, player);

      Object.values(table.players).forEach((p) => {
        sseService.send(p.sseClientId, {
          path: 'players',
          value: table.players,
        });
      });
    },
    cancel: async () => {
      sseService.removeClient(player.sseClientId);
      const table = await tableService.removePlayer(tableId, player.id);

      if (Object.values(table.players).length === 0) {
        // Delete table if no more players
        await tableService.remove(tableId);
      } else {
        // Otherwise update table state
        Object.values(table.players).forEach((p) => {
          sseService.send(p.sseClientId, {
            path: 'players',
            value: table.players,
          });
        });
      }
    },
  });

  const headers = {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
  };

  return new Response(body, { headers });
};
