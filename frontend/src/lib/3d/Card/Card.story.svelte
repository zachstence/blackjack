<script lang="ts">
  import type { Hst } from '@histoire/plugin-svelte';
  import { T } from '@threlte/core';

  import TestCanvas from '../TestCanvas.svelte';
  import TestScene from '../TestScene.svelte';

  import { Rank, Suit } from 'blackjack-types';
  import { CardMesh, createFrontCanvas } from './Card.three';

  export let Hst: Hst;

  const suits = Object.values(Suit);
  let suit = suits[0];

  const ranks = Object.values(Rank);
  let rank = ranks[0];

  $: opts = {
    card: { hidden: false, suit, rank },
    pxPerMm: 100,
  };

  $: card = CardMesh(opts);

  let canvasContainer: HTMLDivElement;
  $: {
    if (canvasContainer) {
      const canvas = createFrontCanvas(opts);
      canvas.style.width = '100%';
      canvasContainer.replaceChildren(canvas);
    }
  }
</script>

<Hst.Story>
  <svelte:fragment slot="controls">
    <Hst.Select title="suit" options={suits} bind:value={suit} />
    <Hst.Select title="rank" options={ranks} bind:value={rank} />
  </svelte:fragment>

  <Hst.Variant title="Card">
    <TestCanvas>
      <TestScene>
        <T is={card} />
      </TestScene>
    </TestCanvas>
  </Hst.Variant>

  <Hst.Variant title="Front Canvas">
    <div bind:this={canvasContainer} />
  </Hst.Variant>
</Hst.Story>
