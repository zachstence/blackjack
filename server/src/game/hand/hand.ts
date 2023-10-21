import { HandStatus, ICard, IHand, IValue, RankValue } from 'blackjack-types';
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

  get value(): IValue {
    let soft = 0;
    let hard = 0;

    this.cards
      .map(card => card.toClientJSON())
      .forEach(card => {
        if (card.hidden) return;

        const cardValue = RankValue[card.rank];
        if (cardValue.soft !== null) {
          soft += cardValue.soft;
        } else {
          soft += cardValue.hard;
        }

        hard += cardValue.hard;
      });

    if (soft !== hard && soft <= 21) {
      return { soft, hard };
    }
    return { hard, soft: null };
  }

  get bestValue(): number {
    const { hard, soft } = this.value;
    if (soft === null) return hard;
    return Math.max(hard, soft);
  }

  get blackjack(): boolean {
    return this._cards.length === 2 && this.bestValue === 21;
  }

  get busted(): boolean {
    return this.status === HandStatus.Busted;
  }

  get standing(): boolean {
    return this.status === HandStatus.Standing;
  }

  dealCard = (card: Card): void => {
    this._cards.push(card);
    this.autoStandOrBust();
  };

  hit = (): ICard => {
    const card = this.root.shoe.draw().reveal();
    this.dealCard(card);
    return card;
  };

  stand = (): void => {
    this.status = HandStatus.Standing;
  };

  clear = (): void => {
    this._cards = [];
    this.status = HandStatus.Hitting;
  };

  toClientJSON(): IHand {
    return {
      cards: this.cards.map(card => card.toClientJSON()),
      status: this.status, // TODO base off of partially hidden cards
      value: this.value, // TODO base off of partially hidden cards
    };
  }

  private autoStandOrBust = (): void => {
    if (this.bestValue > 21) this.status = HandStatus.Busted;
    else if (this.bestValue === 21) this.status = HandStatus.Standing;
  };
}
