<script lang="ts">
  import type { Hst } from '@histoire/plugin-svelte';
  import { HandStatus, RoundState, type IGame, Suit, Rank } from 'blackjack-types';

  import TestCanvas from '../TestCanvas.svelte';
  import TestScene from '../TestScene.svelte';
  import Game from './Game.svelte';

  export let Hst: Hst;

  let bet = 123;

  const mockPlayerHand = (id: string) => ({
    id,
    playerId: 'playerId',
    bet,
    insurance: null,
    actions: [],
    settleStatus: null,
    winnings: null,

    cards: [
      { hidden: false, suit: Suit.Diamonds, rank: Rank.Ace },
      { hidden: false, suit: Suit.Clubs, rank: Rank.Two },
      { hidden: false, suit: Suit.Hearts, rank: Rank.Three },
      { hidden: false, suit: Suit.Spades, rank: Rank.Four },
    ],
    status: HandStatus.Hitting,
    value: { soft: null, hard: 20 },
  });

  let game: IGame;
  $: game = {
    roundState: RoundState.PlacingBets,
    shoe: [],
    dealer: {
      hand: {
        cards: [],
        status: HandStatus.Hitting,
        value: { soft: null, hard: 0 },
      },
    },
    playerHands: {
      playerHand1: mockPlayerHand('playerHand1'),
      playerHand2: mockPlayerHand('playerHand2'),
      playerHand3: mockPlayerHand('playerHand3'),
      playerHand4: mockPlayerHand('playerHand4'),
      playerHand5: mockPlayerHand('playerHand5'),
      playerHand6: mockPlayerHand('playerHand6'),
      playerHand7: mockPlayerHand('playerHand7'),
    },
    players: {},
  };
</script>

<Hst.Story>
  <svelte:fragment slot="controls">
    <Hst.Number title="bet" bind:value={bet} />
  </svelte:fragment>

  <Hst.Variant title="PlayerHand">
    <TestCanvas>
      <TestScene>
        <Game {game} />
      </TestScene>
    </TestCanvas>
  </Hst.Variant>
</Hst.Story>
