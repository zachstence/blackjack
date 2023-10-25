<script lang="ts">
  import { onMount } from 'svelte';

  import { T } from '@threlte/core';
  import { CanvasTexture } from 'three';

  const diameter = 39;
  const thickness = 3.5;

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

    const size = 1000;
    ctx.canvas.width = size;
    ctx.canvas.height = size;
    const { width, height } = ctx.canvas;

    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, size / 2, 0, 2 * Math.PI);
    ctx.fill();

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
  <T.CylinderGeometry args={[diameter / 2, diameter / 2, thickness, 64]} />

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
