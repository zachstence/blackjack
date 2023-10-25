<script lang="ts">
  import { T, useLoader } from '@threlte/core';
  import { onMount } from 'svelte';
  import { CanvasTexture, TextureLoader } from 'three';

  const diameter = 39;
  const thickness = 3.5;

  const uvTexture = useLoader(TextureLoader).load('static/3d/uv.png');

  let faceCanvas: HTMLCanvasElement | undefined;
  let faceTexture: CanvasTexture | undefined;

  let edgeCanvas: HTMLCanvasElement | undefined;
  let edgeTexture: CanvasTexture | undefined;

  onMount(() => {
    faceCanvas = document.createElement('canvas');
    faceTexture = new CanvasTexture(faceCanvas);
    drawFace();

    edgeCanvas = document.createElement('canvas');
    edgeTexture = new CanvasTexture(edgeCanvas);
    drawEdge();

    [faceCanvas, edgeCanvas].forEach((canvas, i) => {
      if (!canvas) return;

      const canvasAspectRatio = canvas.width / canvas.height;
      const width = 200;
      const height = width / canvasAspectRatio;

      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = `${i * width}px`;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      document.body.append(canvas);
    });
  });

  const drawFace = (): void => {
    const ctx = faceCanvas?.getContext('2d');
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

  const drawEdge = (): void => {
    const ctx = edgeCanvas?.getContext('2d');
    if (!ctx) return;

    const scale = 100;
    ctx.canvas.width = scale * Math.PI * diameter;
    ctx.canvas.height = scale * thickness;
    const { width, height } = ctx.canvas;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
  };
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
