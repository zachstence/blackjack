import { error, redirect } from '@sveltejs/kit';
import { zfd } from 'zod-form-data';

import type { Actions } from './$types';
import { sseService, tableService } from '$lib/server';
import type { ChatMessage } from '$lib/types/realtime/chat-message.types';

const SendChatSchema = zfd.formData({
  content: zfd.text(),
});

export const actions: Actions = {
  sendChat: async ({ request, locals, params }) => {
    const session = await locals.auth.validate();
    if (!session) throw redirect(302, '/login');
    const userId = session.user.userId;

    const table = await tableService.getById(params.tableId);
    const player = table.players.find((player) => player.userId === userId);
    if (!player) throw error(403, { message: 'Player is not in table' });

    const formData = await request.formData();
    const { content } = SendChatSchema.parse(formData);

    const path = `chatMessages.${table.chatMessages.length}`;
    const message: ChatMessage = {
      name: player.name,
      content,
      timestamp: new Date().toISOString(),
    };
    await tableService.addChatMessage(params.tableId, message);

    table.players.forEach((player) => {
      sseService.send(player.sseClientId, {
        path,
        value: message,
      });
    });

    return { success: true };
  },
};
