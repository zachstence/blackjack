export enum ClientEvent {
    PlayerJoin = 'PlayerJoin',
    PlaceBet = 'PlaceBet',
    Hit = 'Hit',
    Stand = 'Stand',
}

type ArgsByClientEvent = {
    [ClientEvent.PlayerJoin]: { name: string }
    [ClientEvent.PlaceBet]: { amount: number }
    [ClientEvent.Hit]: {}
    [ClientEvent.Stand]: {}
}

export type ClientEventArgs<E extends ClientEvent> = ArgsByClientEvent[E]
