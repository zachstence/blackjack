<script lang="ts">
  import { T } from '@threlte/core';

  import type { Denomination } from './Chip.types';
  import { ChipMesh } from './ChipMesh';

  export let denomination: Denomination;
  export let radialResolution: number = 128;
  export let pathResolution: number = 256;
  export let canvasScale: number = 4;

  $: chip = ChipMesh({
    denomination,
    radialResolution,
    pathResolution,
    canvasScale,
  });
</script>

<T is={chip} />
