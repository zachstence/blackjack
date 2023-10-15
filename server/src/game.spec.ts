import { ClientEvent, ServerEvent, ServerEventArgs } from "blackjack-types"
import { Game, GameEventEmitters } from "./game"

describe('Game', () => {
  const emitEvent = jest.fn() as jest.MockedFn<GameEventEmitters['emitEvent']>
  const emitEventTo = jest.fn() as jest.MockedFn<GameEventEmitters['emitEventTo']>

  const game = new Game({ emitEvent, emitEventTo })

  const expectEmitEventToEmitEvent = <E extends ServerEvent>(expectedEvent: E): ServerEventArgs<E> => {
    expect(emitEvent).toHaveBeenCalledTimes(1)

    const [event, args] = emitEvent.mock.calls[0]
    expect(event).toEqual(expectedEvent)

    return args as ServerEventArgs<E>
  }

  const expectEmitEventToToEmitEvent = <E extends ServerEvent>(expectedPlayerId: string, expectedEvent: E): ServerEventArgs<E> => {
    expect(emitEventTo).toHaveBeenCalledTimes(1)

    const [playerId, event, args] = emitEventTo.mock.calls[0]
    expect(playerId).toEqual(expectedPlayerId)
    expect(event).toEqual(expectedEvent)

    return args as ServerEventArgs<E>
  }

  it('should allow player to join', () => {
    const playerId = 'playerId'
    const name = 'Zach'
    game.handleEvent(ClientEvent.PlayerJoin, { name }, playerId)

    const joinSuccessArgs = expectEmitEventToToEmitEvent(playerId, ServerEvent.JoinSuccess)
    expect(joinSuccessArgs.game.players[playerId].name).toEqual(name)

    const playerJoinedArgs = expectEmitEventToEmitEvent(ServerEvent.PlayerJoined)
    expect(playerJoinedArgs.player.name).toEqual(name)
  })
})
