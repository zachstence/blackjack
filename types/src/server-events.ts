export enum ServerEvent {
    TestEvent = 'TestEvent',
}

type ArgsByServerEvent = {
    [ServerEvent.TestEvent]: { data: string }
}

export type ServerEventArgs<E extends ServerEvent> = ArgsByServerEvent[E]
