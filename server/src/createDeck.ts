import { ICard, Rank, Suit } from "blackjack-types";

export const createDeck = (): ICard[] => {
  const cards: ICard[] = []
  
  for (const suit of Object.values(Suit)) {
    for (const rank of Object.values(Rank)) {
      cards.push({ suit, rank })
    }
  }

  return cards
}
