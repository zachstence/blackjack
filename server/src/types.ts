import { ClientEvent, ClientEventArgs } from "blackjack-types"
import { Socket } from "socket.io"

export type ClientEventHandler<E extends ClientEvent> = (args: ClientEventArgs<E>, socket: Socket) => void

export type ClientEventHandlers = {
    [E in ClientEvent]: ClientEventHandler<E>
}