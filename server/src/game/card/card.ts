import { ICard, Rank, Suit } from 'blackjack-types';
import { ToClientJSON } from '../to-client-json';

export class Card implements ToClientJSON<ICard> {
  private _hidden = true;

  constructor(
    public readonly suit: Suit,
    public readonly rank: Rank,
  ) {}

  get hidden(): boolean {
    return this._hidden;
  }

  reveal = (): this => {
    this._hidden = false;
    return this;
  };

  toClientJSON(): ICard {
    if (this.hidden) return { hidden: true };
    return {
      hidden: false,
      suit: this.suit,
      rank: this.rank,
    };
  }
}
