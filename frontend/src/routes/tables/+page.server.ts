import { tableService } from '$lib/server';
import type { PageServerLoad } from '../$types';

export const load: PageServerLoad = async () => {
  const tables = await tableService.list();
  return { tables };
};
