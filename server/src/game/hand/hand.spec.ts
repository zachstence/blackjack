import { Rank } from 'blackjack-types';
import { Card } from '../card';
import { randomRank, randomSuit } from '../card/card.spec';
import { Game } from '../game';
import { Hand } from './hand';

describe('Hand', () => {
  describe('value', () => {
    it('should set soft to null when cards have no aces', () => {
      const hand = new Hand({} as unknown as Game);

      hand.dealCard(new Card(randomSuit(), Rank.Two).reveal());
      hand.dealCard(new Card(randomSuit(), Rank.Nine).reveal());
      hand.dealCard(new Card(randomSuit(), Rank.Jack).reveal());

      expect(hand.getValue()).toEqual({ soft: null, hard: 21 });
    });

    it('should include soft value when cards have an ace', () => {
      const hand = new Hand({} as unknown as Game);

      hand.dealCard(new Card(randomSuit(), Rank.Two).reveal());
      hand.dealCard(new Card(randomSuit(), Rank.Ace).reveal());

      expect(hand.getValue()).toEqual({ soft: 13, hard: 3 });
    });

    it('should set soft to null when soft would be over 21', () => {
      const hand = new Hand({} as unknown as Game);

      hand.dealCard(new Card(randomSuit(), Rank.Five).reveal());
      hand.dealCard(new Card(randomSuit(), Rank.Jack).reveal());
      hand.dealCard(new Card(randomSuit(), Rank.Ace).reveal());

      expect(hand.getValue()).toEqual({ soft: null, hard: 16 });
    });

    it('should not count hidden cards', () => {
      const hand = new Hand({} as unknown as Game);

      hand.dealCard(new Card(randomSuit(), Rank.Five).reveal());
      hand.dealCard(new Card(randomSuit(), Rank.Jack));
      hand.dealCard(new Card(randomSuit(), Rank.Jack));
      hand.dealCard(new Card(randomSuit(), Rank.Jack));
      hand.dealCard(new Card(randomSuit(), Rank.Jack));
      hand.dealCard(new Card(randomSuit(), Rank.Seven).reveal());
      hand.dealCard(new Card(randomSuit(), Rank.Jack));

      expect(hand.getValue()).toEqual({ soft: null, hard: 12 });
    });
  });

  describe('bestValue', () => {
    it('should return soft value when under 21', () => {
      const hand = new Hand({} as unknown as Game);

      hand.dealCard(new Card(randomSuit(), Rank.Two).reveal());
      hand.dealCard(new Card(randomSuit(), Rank.Ace).reveal());

      expect(hand.getBestValue()).toEqual(13);
    });

    it('should return hard value when soft is over 21', () => {
      const hand = new Hand({} as unknown as Game);

      hand.dealCard(new Card(randomSuit(), Rank.Five).reveal());
      hand.dealCard(new Card(randomSuit(), Rank.Ace).reveal());
      hand.dealCard(new Card(randomSuit(), Rank.Ace).reveal());
      hand.dealCard(new Card(randomSuit(), Rank.Seven).reveal());

      expect(hand.getBestValue()).toEqual(14);
    });
  });

  describe('hit', () => {
    it('should draw and reveal a card from shoe', () => {
      const card = new Card(randomSuit(), randomRank());
      const mockGame = {
        shoe: {
          draw: jest.fn().mockReturnValue(card),
        },
      };

      const hand = new Hand(mockGame as unknown as Game);

      const actualCard = hand.hit();

      expect(actualCard).toEqual(card);
      expect(actualCard.hidden).toEqual(false);
      expect(hand.cards[hand.cards.length - 1]).toEqual(card);
    });
  });
});
