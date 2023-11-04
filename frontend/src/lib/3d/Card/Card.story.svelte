<script lang="ts">
  import type { Hst } from '@histoire/plugin-svelte';

  import TestCanvas from '../TestCanvas.svelte';
  import TestScene from '../TestScene.svelte';

  import Card from './Card.svelte';
  import { Rank, Suit } from 'blackjack-types';

  export let Hst: Hst;

  const suits = Object.values(Suit);
  let suit = suits[0];

  const ranks = Object.values(Rank);
  let rank = ranks[0];

  $: card = { hidden: false, suit, rank };
</script>

<Hst.Story>
  <svelte:fragment slot="controls">
    <Hst.Select title="suit" options={suits} bind:value={suit} />
    <Hst.Select title="rank" options={ranks} bind:value={rank} />
  </svelte:fragment>

  <Hst.Variant title="Card">
    <TestCanvas>
      <TestScene>
        <Card {card} />
      </TestScene>
    </TestCanvas>
  </Hst.Variant>
</Hst.Story>
