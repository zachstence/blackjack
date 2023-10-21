import { faker } from '@faker-js/faker';

import { Card } from './card';
import { Rank, Suit } from 'blackjack-types';

describe('Card', () => {
  describe('toClientJSON', () => {
    it('shouldnt expose suit/rank until card is revealed', () => {
      const suit = randomSuit();
      const rank = randomRank();

      const card = new Card(suit, rank);

      expect(card.toClientJSON()).toEqual({ hidden: true });

      card.reveal();

      expect(card.toClientJSON()).toEqual({ hidden: false, suit, rank });
    });
  });
});

export const randomSuit = (): Suit => faker.helpers.arrayElement(Object.values(Suit));

export const randomRank = (): Rank => faker.helpers.arrayElement(Object.values(Rank));
