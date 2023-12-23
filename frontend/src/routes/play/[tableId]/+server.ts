import { nanoid } from 'nanoid';
import type { RequestHandler } from './$types';

import { sseService, tableService } from '$lib/server';
import type { Player } from '$lib/types/realtime';

export const GET: RequestHandler = async ({ params }) => {
  const player: Player = {
    id: nanoid(),
    sseClientId: nanoid(),
    tableId: params.tableId,
  };

  const response = new Response(
    new ReadableStream({
      start: async (controller) => {
        sseService.addClient(player.sseClientId, controller);

        const table = await tableService.addPlayer(params.tableId, player);

        table.players.forEach((p) => {
          if (p.id === player.id) {
            sseService.send(p.sseClientId, {
              value: table,
            });
          } else {
            sseService.send(p.sseClientId, {
              path: 'players',
              value: table.players,
            });
          }
        });
      },
      cancel: async () => {
        sseService.removeClient(player.sseClientId);
        await tableService.removePlayer(params.tableId, player.id);

        const table = await tableService.getById(params.tableId);
        table.players.forEach((p) => {
          sseService.send(p.sseClientId, {
            path: 'players',
            value: table.players,
          });
        });
      },
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache',
      },
    },
  );

  return response;
};
