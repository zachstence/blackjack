import { nanoid } from 'nanoid';
import { faker } from '@faker-js/faker';
import type { RequestHandler } from './$types';

import { sseService, tableService } from '$lib/server';
import type { Player } from '$lib/types/realtime';

export const GET: RequestHandler = async ({ params, locals }) => {
  const session = await locals.auth.validate();

  let player: Player;
  if (session) {
    const { user } = session;
    player = {
      id: nanoid(),
      playerType: 'user',
      userId: user.userId,
      sseClientId: nanoid(),
      tableId: params.tableId,
      name: user.username,
    };
  } else {
    player = {
      id: nanoid(),
      playerType: 'guest',
      sseClientId: nanoid(),
      tableId: params.tableId,
      name: generateGuestName(),
    };
  }

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
        const table = await tableService.removePlayer(params.tableId, player.id);

        if (table.players.length === 0) {
          // Delete table if no more players
          await tableService.remove(params.tableId);
        } else {
          // Otherwise update table state
          table.players.forEach((p) => {
            sseService.send(p.sseClientId, {
              path: 'players',
              value: table.players,
            });
          });
        }
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

const generateGuestName = (): string =>
  `${faker.word.adjective()}-${faker.word.noun()}-${faker.number.int({ min: 10, max: 99 })}`.toLowerCase();
