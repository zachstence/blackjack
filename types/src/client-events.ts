export enum ClientEvent {
    PlayerJoin = 'PlayerJoin',
    Ready = 'Ready',
    PlaceBet = 'PlaceBet',
    Hit = 'Hit',
    Double = 'Double',
    Split = 'Split',
    Stand = 'Stand',

    // Admin
    Reset = 'Reset',
}

type ArgsByClientEvent = {
    [ClientEvent.PlayerJoin]: { name: string }
    [ClientEvent.Ready]: {}
    [ClientEvent.PlaceBet]: { handId: string; amount: number }
    [ClientEvent.Hit]: { handId: string }
    [ClientEvent.Double]: { handId: string }
    [ClientEvent.Split]: { handId: string }
    [ClientEvent.Stand]: { handId: string }

    [ClientEvent.Reset]: {}
}

export type ClientEventArgs<E extends ClientEvent> = ArgsByClientEvent[E]
