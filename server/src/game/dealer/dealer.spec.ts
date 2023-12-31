import { Dealer, DealerAction } from './dealer';
import { Game } from '../game';
import { Hand } from '../hand';
import { DealerHandAction } from 'blackjack-types';
import { Card } from '../card';
import { randomRank, randomSuit } from '../card/card.spec';

describe('Dealer', () => {
  describe('playAction', () => {
    it('should stand if dealer doesnt need to play', () => {
      const mockGame = {
        shouldDealerRevealAndPlay: false,
      };

      const mockHand = {
        cards: [],
        getBestValue: jest.fn().mockReturnValue(10),
        stand: jest.fn(),
      };

      const dealer = new Dealer(mockGame as unknown as Game, mockHand as unknown as Hand);

      const action = dealer.playAction();

      const expectedAction: DealerAction = { action: DealerHandAction.Stand };
      expect(action).toEqual(expectedAction);
      expect(mockHand.stand).toHaveBeenCalledTimes(1);
    });

    it('should reveal if not revealed yet', () => {
      const mockGame = {
        shouldDealerRevealAndPlay: true,
      };

      const mockHand = {
        cards: [new Card(randomSuit(), randomRank())],
        getBestValue: jest.fn().mockReturnValue(16),
        hit: jest.fn(),
      };

      const dealer = new Dealer(mockGame as unknown as Game, mockHand as unknown as Hand);

      const action = dealer.playAction();

      const expectedAction: DealerAction = { action: DealerHandAction.Reveal };
      expect(action).toEqual(expectedAction);
    });

    it('should hit below 17', () => {
      const mockGame = {
        shouldDealerRevealAndPlay: true,
      };

      const card = new Card(randomSuit(), randomRank());
      const mockHand = {
        cards: [],
        getBestValue: jest.fn().mockReturnValue(16),
        hit: jest.fn().mockReturnValueOnce(card),
      };

      const dealer = new Dealer(mockGame as unknown as Game, mockHand as unknown as Hand);

      const action = dealer.playAction();

      const expectedAction: DealerAction = { action: DealerHandAction.Hit, card };
      expect(action).toEqual(expectedAction);
      expect(mockHand.hit).toHaveBeenCalledTimes(1);
    });

    it('should stand on 17', () => {
      const mockGame = {
        shouldDealerRevealAndPlay: true,
      };

      const mockHand = {
        cards: [],
        getBestValue: jest.fn().mockReturnValue(17),
        stand: jest.fn(),
      };

      const dealer = new Dealer(mockGame as unknown as Game, mockHand as unknown as Hand);

      const action = dealer.playAction();

      const expectedAction: DealerAction = { action: DealerHandAction.Stand };
      expect(action).toEqual(expectedAction);
      expect(mockHand.stand).toHaveBeenCalledTimes(1);
    });
  });

  describe('toClientJSON', () => {
    it('should call toClientJSON on hand', () => {
      const handJSON = {};
      const mockHand = {
        toClientJSON: jest.fn().mockReturnValue(handJSON),
      };

      const dealer = new Dealer({} as unknown as Game, mockHand as unknown as Hand);

      const expected = {
        hand: handJSON,
      };

      const actual = dealer.toClientJSON();

      expect(actual).toEqual(expected);
      expect(mockHand.toClientJSON).toHaveBeenCalledTimes(1);
    });
  });
});
