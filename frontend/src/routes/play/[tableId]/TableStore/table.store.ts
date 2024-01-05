import { writable, type Readable, type Writable } from 'svelte/store';
import ReconnectingEventSource from 'reconnecting-eventsource';

import { TableUpdateSchema, type Table, type TableUpdate } from '$lib/types/realtime';
import { applyTableUpdate } from '$lib/apply-table-update';

export class TableStore implements Readable<Table> {
  private eventSource?: ReconnectingEventSource;

  private _store: Writable<Table>;

  constructor(readonly initialState: Table) {
    this._store = writable(initialState);
  }

  private handleTableUpdate = (update: TableUpdate): void => {
    this._store.update((value) => {
      applyTableUpdate(value, update);
      return value;
    });
  };

  connect = (): void => {
    this.eventSource = new ReconnectingEventSource(window.location.pathname);
    this.eventSource.onmessage = (message) => {
      const update = TableUpdateSchema.safeParse(JSON.parse(message.data));
      if (update.success) {
        this.handleTableUpdate(JSON.parse(message.data));
      } else {
        console.debug(`Ignoring invalid server event`, message);
      }
    };
    this.eventSource.onerror = (e) => {
      console.error(e);
    };
  };

  disconnect = (): void => {
    this.eventSource?.close();
    this.eventSource = undefined;
  };

  subscribe: Readable<Table>['subscribe'] = (...args) => {
    return this._store.subscribe(...args);
  };
}
