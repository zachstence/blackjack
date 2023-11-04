<script lang="ts">
  import { T } from '@threlte/core';
  import { DoubleSide, Mesh, MeshStandardMaterial } from 'three';

  import { ChipGeometry } from './ChipGeometry';
  import { ChipTextureStore } from './ChipTexture.store';
  import { DEFAULT_PROPS } from './Chip.constants';

  export let color: string = DEFAULT_PROPS.color;
  export let radialSegments: number = DEFAULT_PROPS.radialSegments;
  export let pathSegments: number = DEFAULT_PROPS.pathSegments;
  export let slotInnerRadius: number = DEFAULT_PROPS.slotInnerRadius;
  export let slotWidth: number = DEFAULT_PROPS.slotWidth;
  export let slotDepth: number = DEFAULT_PROPS.slotDepth;
  export let filletRadius: number = DEFAULT_PROPS.filletRadius;

  const diameter: number = 39;
  const thickness: number = 3.5;
  const radius = diameter / 2;

  $: chip = ChipGeometry(
    radius,
    thickness,
    slotInnerRadius,
    slotWidth,
    slotDepth,
    filletRadius,
    pathSegments,
    radialSegments,
  );

  const textureStore = new ChipTextureStore({
    color,
  });
  textureStore.setup();
  $: console.log($textureStore.texture);
  $: texturedMaterial = new MeshStandardMaterial({ map: $textureStore.texture, side: DoubleSide });
  $: texturedMesh = new Mesh(chip, texturedMaterial);
</script>

<T is={texturedMesh} />
