<script lang="ts">
  import { onMount } from 'svelte';
  import { T } from '@threlte/core';

  import { ChipTextureStore } from './ChipTexture.store';

  export let color: string;

  const diameterMm = 39;
  const thicknessMm = 3.5;

  const textureStore = new ChipTextureStore({
    diameterMm,
    thicknessMm,
    stripeWidthMm: 7,
    stripeHeightMm: 5,
    numStripes: 6,
    pxPerMm: 20,
    color,
    denomination: 5,
  });

  onMount(() => {
    textureStore.setup();
  });

  $: textureStore.setColor(color);
</script>

<T.Mesh>
  <T.CylinderGeometry args={[diameterMm / 2, diameterMm / 2, thicknessMm, 64]} />

  {#each $textureStore.textures as texture}
    <T.MeshStandardMaterial
      map={texture}
      attach={(parent, self) => {
        if (Array.isArray(parent.material)) parent.material = [...parent.material, self];
        else parent.material = [self];
      }}
    />
  {/each}
</T.Mesh>
