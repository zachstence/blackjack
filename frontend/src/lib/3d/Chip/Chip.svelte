<script lang="ts">
  import { T } from '@threlte/core';
  import { ChipGeometry } from './ChipGeometry';
  import { DoubleSide, Mesh, MeshStandardMaterial } from 'three';
  import { ChipTextureStore } from './ChipTexture.store';

  export let color: string = '#982C29';
  export let radialSegments: number = 64;
  export let pathSegments: number = 64;
  export let diameter: number = 39;
  export let thickness: number = 3.5;
  export let filletRadius: number = 0.5;

  $: radius = diameter / 2;

  $: chip = ChipGeometry(radius, thickness, filletRadius, pathSegments, radialSegments);

  const textureStore = new ChipTextureStore({
    color,
  });
  textureStore.setup();
  $: console.log($textureStore.texture);
  $: texturedMaterial = new MeshStandardMaterial({ map: $textureStore.texture, side: DoubleSide });
  $: texturedMesh = new Mesh(chip, texturedMaterial);
</script>

<T is={texturedMesh} />
