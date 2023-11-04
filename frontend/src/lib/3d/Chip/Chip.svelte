<script lang="ts">
  import { T } from '@threlte/core';

  import type { ChipProps } from './Chip.types';
  import { ChipMesh } from './ChipMesh';
  import { onMount } from 'svelte';
  import type { Mesh } from 'three';

  export let props: Partial<ChipProps> | undefined = undefined;

  let chip: Mesh | undefined;
  onMount(() => {
    chip = ChipMesh(props);
  });
</script>

{#if chip}
  <T is={chip} />
{/if}
