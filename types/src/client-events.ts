export enum ClientEvent {
  PlayerJoin = 'PlayerJoin',
  Leave = 'Leave',

  Ready = 'Ready',
  PlaceBet = 'PlaceBet',
  Hit = 'Hit',
  Double = 'Double',
  Split = 'Split',
  Stand = 'Stand',

  BuyInsurance = 'BuyInsurance',
  DeclineInsurance = 'DeclineInsurance',

  // Admin
  Reset = 'Reset',
}

type ArgsByClientEvent = {
  [ClientEvent.PlayerJoin]: { name: string };
  [ClientEvent.Leave]: {};

  [ClientEvent.Ready]: {};
  [ClientEvent.PlaceBet]: { handId: string; amount: number };
  [ClientEvent.Hit]: { handId: string };
  [ClientEvent.Double]: { handId: string };
  [ClientEvent.Split]: { handId: string };
  [ClientEvent.Stand]: { handId: string };

  [ClientEvent.BuyInsurance]: { handId: string };
  [ClientEvent.DeclineInsurance]: { handId: string };

  [ClientEvent.Reset]: {};
};

export type ClientEventArgs<E extends ClientEvent> = ArgsByClientEvent[E];
