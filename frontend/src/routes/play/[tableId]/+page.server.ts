import { error } from '@sveltejs/kit';
import { zfd } from 'zod-form-data';

import type { Actions, PageServerLoad } from './$types';
import { sseService, tableService } from '$lib/server';
import type { ChatMessage } from '$lib/types/realtime/chat-message.types';

export const load: PageServerLoad = async ({ params }) => {
  const tableExists = await tableService.exists(params.tableId);
  if (!tableExists) throw error(404);

  const table = await tableService.getById(params.tableId);
  return { table };
};

const SendChatSchema = zfd.formData({
  content: zfd.text(),
});

export const actions: Actions = {
  sendChat: async ({ request, locals, params }) => {
    const session = await locals.auth.validate();
    if (!session) throw error(401);

    const table = await tableService.getById(params.tableId);

    const formData = await request.formData();
    const { content } = SendChatSchema.parse(formData);

    const path = `chatMessages.${table.chatMessages.length}`;
    const message: ChatMessage = {
      userId: session.user.userId,
      name: session.user.username,
      content,
      timestamp: new Date().toISOString(),
    };
    await tableService.addChatMessage(params.tableId, message);

    Object.values(table.players).forEach((player) => {
      sseService.send(player.sseClientId, {
        path,
        value: message,
      });
    });

    return { success: true };
  },
};
