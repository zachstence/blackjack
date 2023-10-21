import { ClientEvent, ClientEventArgs } from 'blackjack-types';

export type ClientEventHandler<E extends ClientEvent> = (args: ClientEventArgs<E>, playerId: string) => void;

export type ClientEventHandlers = {
  [E in ClientEvent]?: ClientEventHandler<E>;
};
