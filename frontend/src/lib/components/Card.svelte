<script lang="ts" context="module">
  import { Rank, Suit } from 'blackjack-types';

  const SUIT_TO_COLOR: Record<Suit, 'black' | 'red'> = {
    [Suit.Diamonds]: 'red',
    [Suit.Clubs]: 'black',
    [Suit.Hearts]: 'red',
    [Suit.Spades]: 'black',
  };

  const SUIT_TO_CHAR: Record<Suit, string> = {
    [Suit.Diamonds]: '♦',
    [Suit.Clubs]: '♣',
    [Suit.Hearts]: '♥',
    [Suit.Spades]: '♠',
  };

  const RANK_TO_CHAR: Record<Rank, string> = {
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
</script>

<script lang="ts">
  export let suit: Suit;
  export let rank: Rank;

  const color = SUIT_TO_COLOR[suit];
  const suitChar = SUIT_TO_CHAR[suit];
  const rankChar = RANK_TO_CHAR[rank];
</script>

<span class="font-bold tracking-wider border border-black p-1" class:text-red={color === 'red'}
  >{suitChar}{rankChar}</span
>
