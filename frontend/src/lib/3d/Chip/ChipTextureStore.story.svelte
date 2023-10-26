<script lang="ts">
  import type { Hst } from '@histoire/plugin-svelte';
  import { onMount } from 'svelte';
  import { ChipTextureStore } from './ChipTexture.store';

  export let Hst: Hst;

  const canvasWidth = 700;

  let color = 'red';

  const store = new ChipTextureStore({
    diameterMm: 39,
    thicknessMm: 3.5,
    stripeWidthMm: 7,
    stripeHeightMm: 5,
    numStripes: 6,
    pxPerMm: 20,
    color,
    denomination: 5,
  });

  let container: HTMLDivElement;

  onMount(() => {
    store.setup();
    const canvases = [$store.faceCanvas, $store.edgeCanvas];

    for (const canvas of canvases) {
      if (!canvas) continue;

      const ar = canvas.width / canvas.height;
      const canvasHeight = canvasWidth / ar;
      canvas.style.width = `${canvasWidth}px`;
      canvas.style.height = `${canvasHeight}px`;
      canvas.style.border = '2px dashed black';

      container.append(canvas);
    }
  });
</script>

<Hst.Story>
  <svelte:fragment slot="controls">
    <Hst.ColorSelect bind:value={color} title="color" />
  </svelte:fragment>

  <div bind:this={container} class="flex gap-4 flex-wrap" />
</Hst.Story>
