import { getContext, setContext } from "svelte"
import type { GameStore } from "./game.store"

const GAME_STORE_CONTEXT = 'GAME_STORE_CONTEXT'

export const setGameStoreContext = (game: GameStore): GameStore => setContext(GAME_STORE_CONTEXT, game)

export const getGameStoreContext = (): GameStore => getContext(GAME_STORE_CONTEXT)
