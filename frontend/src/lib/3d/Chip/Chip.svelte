<script lang="ts">
  import { T, useLoader } from '@threlte/core';
  import { onMount } from 'svelte';
  import { CanvasTexture, TextureLoader } from 'three';

  const diameter = 39;
  const thickness = 3.5;

  const uvTexture = useLoader(TextureLoader).load('static/3d/uv.png');

  const faceCanvas = document.createElement('canvas');
  const faceTexture = new CanvasTexture(faceCanvas);
  const drawFace = (): void => {
    const ctx = faceCanvas.getContext('2d');
    if (!ctx) return;

    ctx.canvas.width = 1000;
    ctx.canvas.height = 1000;
    const { width, height } = ctx.canvas;

    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 100, 0, 2 * Math.PI);
    ctx.fill();
  };

  const edgeCanvas = document.createElement('canvas');
  const edgeTexture = new CanvasTexture(edgeCanvas);
  const drawEdge = (): void => {
    const ctx = edgeCanvas.getContext('2d');
    if (!ctx) return;

    const scale = 100;
    ctx.canvas.width = scale * Math.PI * diameter;
    ctx.canvas.height = scale * thickness;
    const { width, height } = ctx.canvas;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
  };

  [faceCanvas, edgeCanvas].forEach((canvas, i) => {
    const size = 200;

    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = `${i * size}px`;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    document.body.append(canvas);
  });

  onMount(() => {
    drawFace();
    drawEdge();
  });
</script>

<T.Mesh>
  <T.CylinderGeometry args={[diameter / 2, diameter / 2, thickness]} />

  <T.MeshStandardMaterial
    map={edgeTexture}
    attach={(parent, self) => {
      if (Array.isArray(parent.material)) parent.material = [...parent.material, self];
      else parent.material = [self];
    }}
  />
  <T.MeshStandardMaterial
    map={faceTexture}
    attach={(parent, self) => {
      if (Array.isArray(parent.material)) parent.material = [...parent.material, self];
      else parent.material = [self];
    }}
  />
  <T.MeshStandardMaterial
    map={faceTexture}
    attach={(parent, self) => {
      if (Array.isArray(parent.material)) parent.material = [...parent.material, self];
      else parent.material = [self];
    }}
  />
</T.Mesh>
