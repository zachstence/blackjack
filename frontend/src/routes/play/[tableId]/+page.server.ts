import { error } from '@sveltejs/kit';
import { zfd } from 'zod-form-data';

import type { Actions, PageServerLoad } from './$types';
import { tableService } from '$lib/server';

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

    const formData = await request.formData();
    const { content } = SendChatSchema.parse(formData);

    await tableService.addChatMessage(params.tableId, {
      content,
      name: session.user.username,
      userId: session.user.userId,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  },
};
