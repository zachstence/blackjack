<script lang="ts">
  import { onMount } from 'svelte';
  import { T } from '@threlte/core';

  import { ChipTextureStore } from './ChipTexture.store';

  export let color: string;

  const diameter = 39;
  const thickness = 3.5;
  const numStripes = 6;

  const textureStore = new ChipTextureStore({ color, diameter, thickness, numStripes, denomination: 5 });

  onMount(() => {
    textureStore.setup();
  });

  $: textureStore.setColor(color);
</script>

<T.Mesh>
  <T.CylinderGeometry args={[diameter / 2, diameter / 2, thickness, 64]} />

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
