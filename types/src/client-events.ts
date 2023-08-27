export enum ClientEvent {
    TestEvent = 'TestEvent',
}

type ArgsByClientEvent = {
    [ClientEvent.TestEvent]: { data: string }
}

export type ClientEventArgs<E extends ClientEvent> = ArgsByClientEvent[E]
