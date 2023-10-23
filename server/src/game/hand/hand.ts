import { HandStatus, ICard, IHand, IValue, Rank, RankValue } from 'blackjack-types';
import { Game } from '../game';
import { ToClientJSON } from '../to-client-json';
import { Card } from '../card';

export class Hand implements ToClientJSON<IHand> {
  protected _cards: Card[] = [];

  status = HandStatus.Hitting;

  constructor(protected readonly root: Game) {}

  get cards(): Card[] {
    return this._cards;
  }

  get blackjack(): boolean {
    return this._cards.length === 2 && this.getBestValue({ includeHiddenCards: true }) === 21;
  }

  get busted(): boolean {
    return this.status === HandStatus.Busted;
  }

  get standing(): boolean {
    return this.status === HandStatus.Standing;
  }

  getValue({ includeHiddenCards }: { includeHiddenCards?: boolean } = {}): IValue {
    const hasAce = this._cards.some(card => card.rank === Rank.Ace);

    const hard = this._cards.reduce<number>((acc, card) => {
      if (card.hidden && !includeHiddenCards) return acc;
      acc += RankValue[card.rank];
      return acc;
    }, 0);

    if (hasAce) {
      const soft = hard + 10;
      if (soft <= 21) return { hard, soft };
    }

    return { hard, soft: null };
  }

  getBestValue({ includeHiddenCards }: { includeHiddenCards?: boolean } = {}): number {
    const { hard, soft } = this.getValue({ includeHiddenCards });
    if (soft === null) return hard;
    return Math.max(hard, soft);
  }

  dealCard(card: Card): void {
    this._cards.push(card);
    this.autoStandOrBust();
  }

  hit(): ICard {
    const card = this.root.shoe.draw().reveal();
    this.dealCard(card);
    return card;
  }

  stand(): void {
    this.status = HandStatus.Standing;
  }

  clear(): void {
    this._cards = [];
    this.status = HandStatus.Hitting;
  }

  toClientJSON(): IHand {
    return {
      cards: this.cards.map(card => card.toClientJSON()),
      status: this.status,
      value: this.getValue(),
    };
  }

  private autoStandOrBust(): void {
    if (this.getBestValue() > 21) this.status = HandStatus.Busted;
    else if (this.getBestValue() === 21) this.status = HandStatus.Standing;
  }
}
