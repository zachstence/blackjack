import { faker } from '@faker-js/faker';
import { Player } from '../player';
import { PlayerHand } from './player-hand';
import { Game } from '../game';
import { HandStatus, IBoughtInsurance, Rank, RoundState } from 'blackjack-types';
import { Card } from '../card';
import { randomSuit, randomRank } from '../card/card.spec';

describe('PlayerHand', () => {
  describe('placeBet', () => {
    const playerId = faker.string.sample();

    let player: Player;
    let mockGame: Game;
    let playerHand: PlayerHand;

    beforeEach(() => {
      player = new Player(playerId, 'name');
      mockGame = {
        players: [player],
      } as unknown as Game;
      playerHand = new PlayerHand(true, playerId, mockGame as unknown as Game);
    });

    it('should set bet', () => {
      const bet = faker.number.int();

      playerHand.placeBet(bet);

      expect(playerHand.bet).toEqual(bet);
    });

    it('should take money from player', () => {
      const bet = faker.number.int();

      const playerMoneyBefore = player.money;
      playerHand.placeBet(bet);
      const playerMoneyAfter = player.money;

      expect(playerMoneyBefore - playerMoneyAfter).toEqual(bet);
    });
  });

  describe('double', () => {
    const playerId = faker.string.sample();
    const originalBet = faker.number.int({ min: 0, max: 100 });

    let player: Player;
    let mockGame: Game;
    let playerHand: PlayerHand;

    beforeEach(() => {
      player = new Player(playerId, 'name');
      mockGame = {
        roundState: RoundState.PlayersPlaying,
        players: [player],
        shoe: {
          draw: jest.fn().mockImplementation(() => new Card(randomSuit(), randomRank())),
        },
      } as unknown as Game;
      playerHand = new PlayerHand(true, playerId, mockGame as unknown as Game);

      playerHand.placeBet(originalBet);

      playerHand.dealCard(new Card(randomSuit(), Rank.Two).reveal());
      playerHand.dealCard(new Card(randomSuit(), Rank.Two).reveal());
    });

    it('should force stand', () => {
      playerHand.double();
      expect(playerHand.status).toEqual(HandStatus.Standing);
    });

    it('should hit', () => {
      const numCardsBefore = playerHand.cards.length;

      playerHand.double();

      const numCardsAfter = playerHand.cards.length;
      expect(numCardsAfter).toEqual(numCardsBefore + 1);
    });

    it('should take money from player equal to bet', () => {
      const playerMoneyBefore = player.money;
      playerHand.double();
      const playerMoneyAfter = player.money;

      expect(playerMoneyBefore - playerMoneyAfter).toEqual(originalBet);
    });
  });

  describe('settleInsurance', () => {
    const playerId = faker.string.sample();
    const originalBet = faker.number.int({ min: 0, max: 100 });

    let player: Player;
    let mockGame: Game;
    let playerHand: PlayerHand;
    let insurance: IBoughtInsurance;

    beforeEach(() => {
      player = new Player(playerId, 'name');
      mockGame = {
        roundState: RoundState.Insuring,
        dealer: { hand: { blackjack: true } },
        players: [player],
      } as unknown as Game;
      playerHand = new PlayerHand(true, playerId, mockGame as unknown as Game);

      playerHand.placeBet(originalBet);
      insurance = playerHand.buyInsurance();
    });

    it('should pay player 2:1 if they bought insurance and dealer has blackjack', () => {
      const insuranceBet = insurance.bet;

      const playerMoneyBefore = player.money;
      playerHand.settleInsurance();
      const playerMoneyAfter = player.money;

      expect(playerMoneyAfter - playerMoneyBefore).toEqual(insuranceBet * 3);
    });
  });

  describe('settleBet', () => {
    const playerId = faker.string.sample();
    let player: Player;

    beforeEach(() => {
      player = new Player(playerId, faker.string.sample());
    });

    describe('blackjack scenarios (3:2 payout)', () => {
      test('player has blackjack and dealer doesnt', () => {
        const mockGame = {
          roundState: RoundState.PlayersPlaying,
          dealer: {
            hand: {
              bestValue: 20,
              busted: false,
              standing: true,
              blackjack: false,
            },
          },
          players: [player],
        } as unknown as Game;

        const bet = faker.number.int({ min: 0, max: player.money });

        const playerHand = new PlayerHand(true, playerId, mockGame);
        playerHand.placeBet(bet);
        playerHand.dealCard(new Card(randomSuit(), Rank.Ten).reveal());
        playerHand.dealCard(new Card(randomSuit(), Rank.Ace).reveal());

        const expectedWinnings = bet + (3 / 2) * bet;

        const playerMoneyBefore = player.money;
        playerHand.settleBet();
        const playerMoneyAfter = player.money;
        const actualWinnings = playerMoneyAfter - playerMoneyBefore;

        expect(actualWinnings).toEqual(expectedWinnings);
      });
    });

    describe('win scenarios (1:1 payout)', () => {
      test('player stand and dealer bust', () => {
        const mockGame = {
          roundState: RoundState.PlayersPlaying,
          dealer: {
            hand: {
              bestValue: 25,
              busted: true,
              standing: false,
              blackjack: false,
            },
          },
          players: [player],
        } as unknown as Game;

        const bet = faker.number.int({ min: 0, max: player.money });

        const playerHand = new PlayerHand(true, playerId, mockGame);
        playerHand.placeBet(bet);
        playerHand.dealCard(new Card(randomSuit(), Rank.Two).reveal());
        playerHand.dealCard(new Card(randomSuit(), Rank.Two).reveal());
        playerHand.stand();

        const expectedWinnings = bet + (1 / 1) * bet;

        const playerMoneyBefore = player.money;
        playerHand.settleBet();
        const playerMoneyAfter = player.money;
        const actualWinnings = playerMoneyAfter - playerMoneyBefore;

        expect(actualWinnings).toEqual(expectedWinnings);
      });

      test('player and dealer stand, player has higher total', () => {
        const mockGame = {
          roundState: RoundState.PlayersPlaying,
          dealer: {
            hand: {
              bestValue: 19,
              busted: false,
              standing: true,
              blackjack: false,
            },
          },
          players: [player],
        } as unknown as Game;

        const bet = faker.number.int({ min: 0, max: player.money });

        const playerHand = new PlayerHand(true, playerId, mockGame);
        playerHand.placeBet(bet);
        playerHand.dealCard(new Card(randomSuit(), Rank.Ten).reveal());
        playerHand.dealCard(new Card(randomSuit(), Rank.King).reveal());
        playerHand.stand();

        const expectedWinnings = bet + (1 / 1) * bet;

        const playerMoneyBefore = player.money;
        playerHand.settleBet();
        const playerMoneyAfter = player.money;
        const actualWinnings = playerMoneyAfter - playerMoneyBefore;

        expect(actualWinnings).toEqual(expectedWinnings);
      });
    });

    describe('push scenarios (get bet back)', () => {
      test('player and dealer standing with same total and neither got blackjack', () => {
        const mockGame = {
          roundState: RoundState.PlayersPlaying,
          dealer: {
            hand: {
              bestValue: 18,
              busted: false,
              standing: true,
              blackjack: false,
            },
          },
          players: [player],
        } as unknown as Game;

        const bet = faker.number.int({ min: 0, max: player.money });

        const playerHand = new PlayerHand(true, playerId, mockGame);
        playerHand.placeBet(bet);
        playerHand.dealCard(new Card(randomSuit(), Rank.Ten).reveal());
        playerHand.dealCard(new Card(randomSuit(), Rank.Eight).reveal());
        playerHand.stand();

        const expectedWinnings = bet + (0 / 1) * bet;

        const playerMoneyBefore = player.money;
        playerHand.settleBet();
        const playerMoneyAfter = player.money;
        const actualWinnings = playerMoneyAfter - playerMoneyBefore;

        expect(actualWinnings).toEqual(expectedWinnings);
      });
    });

    describe('lose scenarios (lose bet)', () => {
      test('player busted', () => {
        const mockGame = {
          roundState: RoundState.PlayersPlaying,
          dealer: {
            hand: {
              bestValue: 20,
              busted: false,
              standing: true,
              blackjack: false,
            },
          },
          players: [player],
        } as unknown as Game;

        const bet = faker.number.int({ min: 0, max: player.money });

        const playerHand = new PlayerHand(true, playerId, mockGame);
        playerHand.placeBet(bet);
        playerHand.dealCard(new Card(randomSuit(), Rank.Ten).reveal());
        playerHand.dealCard(new Card(randomSuit(), Rank.Ten).reveal());
        playerHand.dealCard(new Card(randomSuit(), Rank.Two).reveal());

        const expectedWinnings = 0;

        const playerMoneyBefore = player.money;
        playerHand.settleBet();
        const playerMoneyAfter = player.money;
        const actualWinnings = playerMoneyAfter - playerMoneyBefore;

        expect(actualWinnings).toEqual(expectedWinnings);
      });

      test('player and dealer stand, dealer has higher total', () => {
        const mockGame = {
          roundState: RoundState.PlayersPlaying,
          dealer: {
            hand: {
              bestValue: 20,
              busted: false,
              standing: true,
              blackjack: false,
            },
          },
          players: [player],
        } as unknown as Game;

        const bet = faker.number.int({ min: 0, max: player.money });

        const playerHand = new PlayerHand(true, playerId, mockGame);
        playerHand.placeBet(bet);
        playerHand.dealCard(new Card(randomSuit(), Rank.Ten).reveal());
        playerHand.dealCard(new Card(randomSuit(), Rank.Six).reveal());
        playerHand.stand();

        const expectedWinnings = 0;

        const playerMoneyBefore = player.money;
        playerHand.settleBet();
        const playerMoneyAfter = player.money;
        const actualWinnings = playerMoneyAfter - playerMoneyBefore;

        expect(actualWinnings).toEqual(expectedWinnings);
      });

      test('player and dealer both get 21, but dealer has blackjack', () => {
        const mockGame = {
          roundState: RoundState.PlayersPlaying,
          dealer: {
            hand: {
              bestValue: 21,
              busted: false,
              standing: true,
              blackjack: true,
            },
          },
          players: [player],
        } as unknown as Game;

        const bet = faker.number.int({ min: 0, max: player.money });

        const playerHand = new PlayerHand(true, playerId, mockGame);
        playerHand.placeBet(bet);
        playerHand.dealCard(new Card(randomSuit(), Rank.Ten).reveal());
        playerHand.dealCard(new Card(randomSuit(), Rank.Ten).reveal());
        playerHand.dealCard(new Card(randomSuit(), Rank.Ace).reveal());

        const expectedWinnings = 0;

        const playerMoneyBefore = player.money;
        playerHand.settleBet();
        const playerMoneyAfter = player.money;
        const actualWinnings = playerMoneyAfter - playerMoneyBefore;

        expect(actualWinnings).toEqual(expectedWinnings);
      });
    });
  });
});
