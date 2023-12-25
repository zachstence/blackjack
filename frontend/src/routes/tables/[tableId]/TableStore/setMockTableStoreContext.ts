import { readable } from 'svelte/store';

import type { Table } from '$lib/types/realtime';

import type { TableStore } from './table.store';
import { setTableStoreContext } from '.';

export const setMockTableStoreContext = (value: Partial<Table>): TableStore =>
  setTableStoreContext(readable(value) as TableStore);
