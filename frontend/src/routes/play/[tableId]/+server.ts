import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { sseService, tableService } from '$lib/server';
import type { Player } from '$lib/types/realtime';

export const GET: RequestHandler = async ({ params, locals }) => {
  const session = await locals.auth.validate();
  if (!session) throw error(400);

  const { user } = session;
  const { tableId } = params;

  const onConnect = async (clientId: string): Promise<void> => {
    const player: Player = {
      sseClientId: clientId,
      tableId: tableId,
      id: user.userId,
      name: user.username,
    };

    await tableService.addPlayer(tableId, player);
  };

  const onDisconnect = async (): Promise<void> => {
    const table = await tableService.removePlayer(tableId, user.userId);
    if (Object.values(table.players).length === 0) {
      // Delete table if no more players
      await tableService.delete(tableId);
    }
  };

  const { response } = sseService.addClient({ onConnect, onDisconnect });
  return response;
};
