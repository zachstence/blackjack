<script lang="ts">
  import { T } from '@threlte/core';
  import { MeshStandardMaterial } from 'three';
  import { OBJLoaderStore } from '../obj-loader.store';

  export let color: string;

  const obj = new OBJLoaderStore('/static/3d/chip/chip.obj', {
    Base: new MeshStandardMaterial({ color }),
    Accent: new MeshStandardMaterial({ color: '#d5dfe8' }),
  });
  obj.load();

  // Update material when prop changes
  $: obj.setMaterial('Base', new MeshStandardMaterial({ color }));
</script>

{#if $obj}
  <T is={$obj} />
{/if}
