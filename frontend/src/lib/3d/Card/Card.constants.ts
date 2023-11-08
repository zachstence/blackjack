import { Rank, Suit } from 'blackjack-types';

export const CARD_WIDTH = 63.5;
export const CARD_HEIGHT = 88.9;
export const CARD_THICKNESS = 2;
export const CARD_CORNER_RADIUS = 2;

export const ColorBySuit: Record<Suit, string> = {
  [Suit.Clubs]: 'black',
  [Suit.Diamonds]: 'red',
  [Suit.Hearts]: 'red',
  [Suit.Spades]: 'black',
};

export const SuitToString: Record<Suit, string> = {
  [Suit.Clubs]: '♣',
  [Suit.Diamonds]: '♦',
  [Suit.Hearts]: '♥',
  [Suit.Spades]: '♠',
};

export const RankToString: Record<Rank, string> = {
  [Rank.Ace]: 'A',
  [Rank.Two]: '2',
  [Rank.Three]: '3',
  [Rank.Four]: '4',
  [Rank.Five]: '5',
  [Rank.Six]: '6',
  [Rank.Seven]: '7',
  [Rank.Eight]: '8',
  [Rank.Nine]: '9',
  [Rank.Ten]: '10',
  [Rank.Jack]: 'J',
  [Rank.Queen]: 'Q',
  [Rank.King]: 'K',
};
