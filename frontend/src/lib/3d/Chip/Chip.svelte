<script lang="ts">
  import { T } from '@threlte/core';
  import { ChipGeometry } from './ChipGeometry';
  import { DoubleSide, LineBasicMaterial, LineSegments, Mesh, MeshStandardMaterial } from 'three';

  const diameter = 39;
  const radius = diameter / 2;
  const height = 3.5;
  const edgeRadius = 0.5;

  const radialSegments = 64;
  const faceSegments = 10;
  const heightSegments = 3;
  const filletSegments = 8;

  const chip = ChipGeometry(radius, height, edgeRadius, radialSegments, faceSegments, heightSegments, filletSegments);

  const lineMaterial = new LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
  const meshMaterial = new MeshStandardMaterial({
    color: 0x156289,
    emissive: 0x072534,
    side: DoubleSide,
    flatShading: true,
  });

  const mesh = new Mesh(chip, meshMaterial);
  const edges = new LineSegments(chip, lineMaterial);
</script>

<T.Group>
  <T is={mesh} />
  <T is={edges} />
</T.Group>
