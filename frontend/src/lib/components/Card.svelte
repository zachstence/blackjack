<script lang="ts" context="module">
  import { Rank, Suit, type ICard } from 'blackjack-types';

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
  export let card: ICard | 'hidden';

  $: color = card === 'hidden' ? 'black' : SUIT_TO_COLOR[card.suit];
  $: suitChar = card === 'hidden' ? '?' : SUIT_TO_CHAR[card.suit];
  $: rankChar = card === 'hidden' ? '?' : RANK_TO_CHAR[card.rank];
</script>

<span class="font-bold border border-black p-1" class:text-red={color === 'red'}>
  <span class="font-mono text-lg leading-none inline-block">{suitChar}</span>
  <span class="font-mono text-lg leading-none inline-block">{rankChar}</span>
</span>
