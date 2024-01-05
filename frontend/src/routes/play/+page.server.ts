import type { Actions, PageServerLoad } from './$types';
import { tableService } from '$lib/server';
import { zfd } from 'zod-form-data';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
  const tables = await tableService.list();
  return { tables };
};

const DeleteTableSchema = zfd.formData({
  tableId: zfd.text(),
});

export const actions: Actions = {
  createTable: async () => {
    const table = await tableService.create();
    throw redirect(303, `/play/${table.id}`);
  },
  deleteTable: async ({ request }) => {
    const formData = await request.formData();
    const { tableId } = DeleteTableSchema.parse(formData);
    await tableService.delete(tableId);
  },
};
