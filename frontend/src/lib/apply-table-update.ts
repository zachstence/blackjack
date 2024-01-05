import set from 'lodash/set';
import unset from 'lodash/unset';

import { TableSchema, type Table, type TableUpdate } from '$lib/types/realtime';

export const applyTableUpdate = (table: Table, update: TableUpdate): void => {
  Object.entries(update.set ?? {}).forEach(([path, value]) => set(table, path, value));
  (update.unset ?? []).forEach((path) => unset(table, path));

  // Make sure table still passes schema
  try {
    TableSchema.parse(table);
  } catch (e) {
    throw new Error(
      `Table doesn't pass schema validation after applying update\n${JSON.stringify({ table, update })}`,
      { cause: e },
    );
  }
};
