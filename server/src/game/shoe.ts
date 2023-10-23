import { IShoe, Rank, Suit } from 'blackjack-types';
import { ToClientJSON } from './to-client-json';
import { Card } from './card';

export class Shoe implements ToClientJSON<IShoe> {
  private _cards: Card[] = [];

  private readonly numDecks = 6; // TODO control by options in the client

  // Reset shoe when 30% of the original size is left
  private readonly resetShoeAtSize = 52 * this.numDecks * 0.3;

  constructor() {
    this.reset();
  }

  get cards(): Card[] {
    return this._cards;
  }

  get shouldReset(): boolean {
    return this._cards.length <= this.resetShoeAtSize;
  }

  reset = (): void => {
    const decks = Array.from({ length: this.numDecks }).flatMap(createDeck);
    durstenfeldShuffle(decks);
    this._cards = decks;
  };

  draw = (): Card => {
    return this._cards.pop()!;
  };

  toClientJSON(): IShoe {
    return {
      length: this._cards.length,
    };
  }
}

const createDeck = (): Card[] => {
  const cards: Card[] = [];

  for (const suit of Object.values(Suit)) {
    for (const rank of Object.values(Rank)) {
      cards.push(new Card(suit, rank));
    }
  }

  return cards;
};

/** https://stackoverflow.com/a/12646864 */
const durstenfeldShuffle = (array: unknown[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
};
