<script lang="ts">
  import { T } from '@threlte/core';

  import type { Denomination } from './Chip.types';
  import { ChipMesh } from './ChipMesh';

  export let denomination: Denomination;

  $: chip = ChipMesh({
    denomination,
  });
</script>

<T is={chip} />
