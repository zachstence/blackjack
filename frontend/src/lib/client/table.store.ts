import ReconnectingEventSource from 'reconnecting-eventsource';
import { writable, type Readable } from 'svelte/store';
import { set } from 'lodash';
import { ServerEventSchema, type ServerEvent, type Table } from '$lib/types/realtime';

export class TableStore implements Readable<Table> {
  private eventSource?: ReconnectingEventSource;

  private _store = writable<Table>();

  constructor(readonly id: string) {}

  private handleServerEvent = (event: ServerEvent): void => {
    console.debug('handleServerEvent', event);
    const { path, value } = ServerEventSchema.parse(event);
    this._store.update((store) => {
      if (!path) return value as Table;
      return set(store, path, value);
    });
  };

  connect = (): void => {
    this.eventSource = new ReconnectingEventSource(`/play/${this.id}`);
    this.eventSource.onmessage = (message) => {
      const event = ServerEventSchema.parse(JSON.parse(message.data));
      this.handleServerEvent(event);
    };
  };

  subscribe: Readable<Table>['subscribe'] = (...args) => {
    return this._store.subscribe(...args);
  };
}
