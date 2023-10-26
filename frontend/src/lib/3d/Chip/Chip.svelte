<script lang="ts">
  import { T } from '@threlte/core';
  import { MeshStandardMaterial } from 'three';
  import { OBJLoaderStore } from '../obj-loader.store';

  export let color: string;

  const obj = new OBJLoaderStore('/static/3d/Poker Chip v9.obj', {
    Red_Plastic: new MeshStandardMaterial({ color }),
    White_Plastic: new MeshStandardMaterial({ color: '#d5dfe8' }),
  });
  obj.load();

  // Update material when prop changes
  $: obj.setMaterial('Red_Plastic', new MeshStandardMaterial({ color }));
</script>

{#if $obj}
  <T is={$obj} />
{/if}
