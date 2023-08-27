import { IGame } from "./game"

export enum ServerEvent {
    JoinSuccess = 'JoinSuccess',
    RoundStart = 'RoundStart',
}

type ArgsByServerEvent = {
    [ServerEvent.JoinSuccess]: { game: IGame }
    [ServerEvent.RoundStart]: {}
}

export type ServerEventArgs<E extends ServerEvent> = ArgsByServerEvent[E]
