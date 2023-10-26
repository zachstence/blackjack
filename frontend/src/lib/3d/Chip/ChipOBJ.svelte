<script lang="ts">
  import { T, useLoader } from '@threlte/core';
  import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

  // const mtlLoader = new MTLLoader();
  // mtlLoader.load('static/3d/Poker Chip v2.mtl', materials => {
  //   materials.preload()

  //   const objLoader = new OBJLoader()
  //   objLoader.setMaterials(materials)
  //   objLoader.load('static/3d/Poker Chip v2.obj', object => {

  //   })
  // });

  const object = useLoader(OBJLoader).load('static/3d/Poker Chip v2.obj');
</script>

{#if $object}
  <T is={$object} />
{/if}
