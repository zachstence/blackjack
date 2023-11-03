<script lang="ts">
  import { T, useLoader } from '@threlte/core';
  import { ChipGeometry } from './ChipGeometry';
  import { DoubleSide, LineBasicMaterial, LineSegments, Mesh, MeshStandardMaterial, TextureLoader } from 'three';

  export let radialSegments: number = 64;
  export let pathSegments: number = 64;
  export let diameter: number = 39;
  export let height: number = 3.5;
  export let filletRadius: number = 0.5;

  $: radius = diameter / 2;

  $: chip = ChipGeometry(radius, height, filletRadius, pathSegments, radialSegments);

  const uv = useLoader(TextureLoader).load('/static/3d/uv.jpg');
  $: meshMaterial = new MeshStandardMaterial({ map: $uv, side: DoubleSide });
  $: mesh = new Mesh(chip, meshMaterial);

  const lineMaterial = new LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 });
  $: edges = new LineSegments(chip, lineMaterial);
</script>

<T.Group>
  <T is={mesh} />
  <T is={edges} />
</T.Group>
