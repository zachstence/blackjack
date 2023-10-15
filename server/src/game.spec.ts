import { ClientEvent, ServerEvent, ServerEventArgs } from "blackjack-types"
import { Game, GameEventEmitters } from "./game"

describe('Game', () => {
  const emitEvent = jest.fn() as jest.MockedFn<GameEventEmitters['emitEvent']>
  const emitEventTo = jest.fn() as jest.MockedFn<GameEventEmitters['emitEventTo']>

  const game = new Game({ emitEvent, emitEventTo })

  const expectEmitEventToEmitEvent = <E extends ServerEvent>(expectedEvent: E): ServerEventArgs<E> => {
    const [event, args] = emitEvent.mock.calls[emitEvent.mock.calls.length - 1]
    expect(event).toEqual(expectedEvent)

    return args as ServerEventArgs<E>
  }

  const expectEmitEventToToEmitEvent = <E extends ServerEvent>(expectedPlayerId: string, expectedEvent: E): ServerEventArgs<E> => {
    const [playerId, event, args] = emitEventTo.mock.calls[emitEventTo.mock.calls.length - 1]
    expect(playerId).toEqual(expectedPlayerId)
    expect(event).toEqual(expectedEvent)

    return args as ServerEventArgs<E>
  }

  it('should allow player to join', () => {
    const playerId = 'playerId'
    const name = 'name'
    game.handleEvent(ClientEvent.PlayerJoin, { name }, playerId)

    const joinSuccessArgs = expectEmitEventToToEmitEvent(playerId, ServerEvent.JoinSuccess)
    expect(joinSuccessArgs.game.players[playerId].name).toEqual(name)

    const playerJoinedArgs = expectEmitEventToEmitEvent(ServerEvent.PlayerJoined)
    expect(playerJoinedArgs.player.name).toEqual(name)
  })

  it('should allow player to leave', () => {
    const playerId1 = 'playerId1'
    const name1 = 'name1'
    game.handleEvent(ClientEvent.PlayerJoin, { name: name1 }, playerId1)
    const playerId2 = 'playerId2'
    const name2 = 'name2'
    game.handleEvent(ClientEvent.PlayerJoin, { name: name2 }, playerId2)

    game.handleEvent(ClientEvent.Leave, {}, playerId1)

    const leaveArgs = expectEmitEventToEmitEvent(ServerEvent.PlayerLeft)
    expect(leaveArgs.playerId).toEqual(playerId1)
  })
})
