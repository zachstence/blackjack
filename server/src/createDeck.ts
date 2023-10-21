import { Rank, Suit } from "blackjack-types";

import { CardState } from "./game-state/card-state";

export const createDeck = (): CardState[] => {
  const cards: CardState[] = []
  
  for (const suit of Object.values(Suit)) {
    for (const rank of Object.values(Rank)) {
      cards.push(new CardState(suit, rank))
    }
  }

  return cards
}
