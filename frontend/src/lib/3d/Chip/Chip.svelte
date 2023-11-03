<script lang="ts">
  import { T } from '@threlte/core';
  import { ChipGeometry } from './ChipGeometry';

  const diameter = 39;
  const radius = diameter / 2;
  const height = 3.5;
  const edgeRadius = 0.5;

  const radialSegments = 64;
  const heightSegments = 2;
  const filletSegments = 8;
</script>

<T.Mesh>
  <T is={ChipGeometry(radius, height, edgeRadius, radialSegments, heightSegments, filletSegments)} />
  <T.MeshStandardMaterial color="white" />
</T.Mesh>
