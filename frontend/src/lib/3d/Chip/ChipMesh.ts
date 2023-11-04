import {
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  LatheGeometry,
  LinearFilter,
  Mesh,
  MeshStandardMaterial,
  Path,
} from 'three';

import type { Denomination } from './Chip.types';
import {
  CIRCUMFERENCE,
  ColorByDenomination,
  FILLET_RADIUS,
  NUM_STRIPES,
  RADIUS,
  SLOT_DEPTH,
  SLOT_INNER_RADIUS,
  SLOT_WIDTH,
  STRIPE_HEIGHT,
  STRIPE_WIDTH,
  THICKNESS,
} from './Chip.constants';

export interface ChipOpts {
  denomination: Denomination;
  radialResolution: number;
  pathResolution: number;
  canvasScale: number;
}

export const ChipMesh = (opts: ChipOpts): Mesh | undefined => {
  const path = createPath();
  const geometry = createGeometry(path, opts);
  const texture = createCanvasTexture(path, opts);

  const material = new MeshStandardMaterial({
    map: texture,
    side: DoubleSide,
  });

  const mesh = new Mesh(geometry, material);

  return mesh;
};

const createPath = (): Path => {
  const faceRadius = RADIUS - FILLET_RADIUS;
  const sideHeight = THICKNESS - 2 * FILLET_RADIUS;

  const path = new Path();
  path.moveTo(0, THICKNESS / 2);
  path.lineTo(SLOT_INNER_RADIUS, THICKNESS / 2);
  path.lineTo(SLOT_INNER_RADIUS, THICKNESS / 2 - SLOT_DEPTH);
  path.lineTo(SLOT_INNER_RADIUS + SLOT_WIDTH, THICKNESS / 2 - SLOT_DEPTH);
  path.lineTo(SLOT_INNER_RADIUS + SLOT_WIDTH, THICKNESS / 2);
  path.lineTo(faceRadius, THICKNESS / 2);
  path.arc(0, -FILLET_RADIUS, FILLET_RADIUS, Math.PI / 2, 0, true);
  path.lineTo(RADIUS, -sideHeight / 2);
  path.arc(-FILLET_RADIUS, 0, FILLET_RADIUS, 0, -Math.PI / 2, true);
  path.lineTo(SLOT_INNER_RADIUS + SLOT_WIDTH, -THICKNESS / 2);
  path.lineTo(SLOT_INNER_RADIUS + SLOT_WIDTH, -THICKNESS / 2 + SLOT_DEPTH);
  path.lineTo(SLOT_INNER_RADIUS, -THICKNESS / 2 + SLOT_DEPTH);
  path.lineTo(SLOT_INNER_RADIUS, -THICKNESS / 2);
  path.lineTo(0, -THICKNESS / 2);

  return path;
};

const createGeometry = (path: Path, { pathResolution, radialResolution }: ChipOpts): BufferGeometry => {
  const points = path.getSpacedPoints(pathResolution);
  const geometry = new LatheGeometry(points, radialResolution);
  return geometry;
};

const createCanvasTexture = (
  path: Path,
  { denomination, radialResolution, pathResolution, canvasScale }: ChipOpts,
): CanvasTexture => {
  const pathLength = path.getLength();

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx === null) throw new Error(`Canvas 2d context is null`);

  ctx.canvas.width = radialResolution * canvasScale;
  ctx.canvas.height = pathResolution * canvasScale;
  const { width, height } = ctx.canvas;

  const stripeWidthPx = (STRIPE_WIDTH / CIRCUMFERENCE) * width;
  const stripeHeightPx = (STRIPE_HEIGHT / pathLength) * height;

  // Fill canvas with base color
  const color = ColorByDenomination[denomination];
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);

  // Draw stripes
  const intervalWidthPx = width / NUM_STRIPES;
  for (let i = 0.5; i < NUM_STRIPES; i++) {
    ctx.fillStyle = 'white';
    const x = i * intervalWidthPx - stripeWidthPx / 2;
    const y = height / 2 - stripeHeightPx / 2;
    ctx.fillRect(x, y, stripeWidthPx, stripeHeightPx);
  }

  const texture = new CanvasTexture(canvas);
  texture.minFilter = LinearFilter;

  return texture;
};
