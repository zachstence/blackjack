export enum ClientEvent {
    PlayerJoin = 'PlayerJoin',
    PlaceBet = 'PlaceBet',
    Hit = 'Hit',
    Stand = 'Stand',
    Ready = 'Ready',
}

type ArgsByClientEvent = {
    [ClientEvent.PlayerJoin]: { name: string }
    [ClientEvent.PlaceBet]: { amount: number }
    [ClientEvent.Hit]: {}
    [ClientEvent.Stand]: {}
    [ClientEvent.Ready]: {}
}

export type ClientEventArgs<E extends ClientEvent> = ArgsByClientEvent[E]
