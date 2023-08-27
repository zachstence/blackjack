export enum ClientEvent {
    PlayerJoin = 'PlayerJoin',
    PlaceBet = 'PlaceBet',
}

type ArgsByClientEvent = {
    [ClientEvent.PlayerJoin]: { name: string }
    [ClientEvent.PlaceBet]: { amount: number }
}

export type ClientEventArgs<E extends ClientEvent> = ArgsByClientEvent[E]
