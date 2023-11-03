<script lang="ts">
  import type { Hst } from '@histoire/plugin-svelte';
  import { onMount } from 'svelte';
  import { ChipTextureStore } from './ChipTexture.store';

  export let Hst: Hst;

  let color = '#982C29';

  let canvasContainer: HTMLDivElement;

  const textureStore = new ChipTextureStore({
    color,
  });

  textureStore.setup();

  onMount(() => {
    const canvas = $textureStore.canvas;
    if (!canvas || !canvasContainer) return;

    const ar = canvas.width / canvas.height;
    canvas.style.width = '100%';
    canvas.style.aspectRatio = `${ar}`;

    canvasContainer.append(canvas);
  });

  $: textureStore.setColor(color);
</script>

<Hst.Story>
  <svelte:fragment slot="controls">
    <Hst.ColorSelect title="color" bind:value={color} />
  </svelte:fragment>

  <div bind:this={canvasContainer} />
</Hst.Story>
