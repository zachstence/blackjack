import type { ServerEvent, ServerEventArgs } from "blackjack-types"

export type ServerEventHandler<E extends ServerEvent> = (args: ServerEventArgs<E>) => void

export type ServerEventHandlers = {
    [E in ServerEvent]?: ServerEventHandler<E>
}