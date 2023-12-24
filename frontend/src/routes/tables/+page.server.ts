import { tableService } from '$lib/server';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const tables = await tableService.list();
  return { tables };
};

export const actions: Actions = {
  createTable: async () => {
    const table = await tableService.create();
    return { table };
  },
};
