import { getContext, setContext } from 'svelte';

import type { TableStore } from './table.store';

const TABLE_STORE_CONTEXT = 'TABLE_STORE_CONTEXT';

export const setTableStoreContext = (tableStore: TableStore) => setContext(TABLE_STORE_CONTEXT, tableStore);

export const getTableStoreContext = (): TableStore => {
  const store = getContext<TableStore | undefined>(TABLE_STORE_CONTEXT);
  if (!store) throw new Error(`${TABLE_STORE_CONTEXT} not set!`);
  return store;
};
