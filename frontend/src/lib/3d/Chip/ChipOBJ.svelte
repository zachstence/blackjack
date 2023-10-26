<script lang="ts">
  import { T } from '@threlte/core';
  import { Mesh, MeshStandardMaterial } from 'three';
  import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
  import { getMaterialsArray } from './getMaterialsArray';

  const base = new MeshStandardMaterial({
    color: '#3da5ff',
  });
  const stripes = new MeshStandardMaterial({
    color: '#d5dfe8',
  });

  const promise = new Promise((resolve) => {
    const objLoader = new OBJLoader();

    console.log({ objLoader });

    objLoader.load('static/3d/Poker Chip v9.obj', async (object) => {
      const materials = await getMaterialsArray('static/3d/Poker Chip v9.obj', {
        Red_Plastic: base,
        White_Plastic: stripes,
      });

      object.traverse((child) => {
        if (child instanceof Mesh) {
          child.material = materials;
        }
      });

      resolve(object);
    });
  });
</script>

{#await promise then object}
  <T is={object} />
{/await}
