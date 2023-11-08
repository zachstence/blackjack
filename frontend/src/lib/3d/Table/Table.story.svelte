<script lang="ts">
  import type { Hst } from '@histoire/plugin-svelte';
  import { T } from '@threlte/core';

  import TestCanvas from '../TestCanvas.svelte';
  import TestScene from '../TestScene.svelte';

  import { Table, createFeltCanvas } from './Table.three';
  import { onMount } from 'svelte';

  export let Hst: Hst;

  let color = '#207100';
  let resolution = 2;

  const table = Table({ color, resolution });

  let canvasContainer: HTMLDivElement;
  onMount(() => {
    if (!canvasContainer) return;
    const canvas = createFeltCanvas({ color, resolution });
    canvas.style.width = '100%';
    canvasContainer.append(canvas);
  });
</script>

<Hst.Story>
  <svelte:fragment slot="controls" />

  <Hst.Variant title="Table">
    <TestCanvas>
      <TestScene>
        <T is={table} />
      </TestScene>
    </TestCanvas>
  </Hst.Variant>

  <Hst.Variant title="Felt Canvas">
    <div bind:this={canvasContainer} />
  </Hst.Variant>
</Hst.Story>
