import {
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  LOD,
  LatheGeometry,
  Mesh,
  MeshStandardMaterial,
  NearestFilter,
  Path,
} from 'three';

import type { ChipLODSpec, Denomination } from './Chip.types';
import {
  CHIP_LODS,
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
}

export const ChipMesh = (opts: ChipOpts): LOD => {
  const lod = new LOD();

  const path = createPath();

  for (const lodSpec of CHIP_LODS) {
    const geometry = createGeometry(path, lodSpec);
    const texture = createCanvasTexture(path, opts, lodSpec);

    const material = new MeshStandardMaterial({
      map: texture,
      side: DoubleSide,
    });

    const mesh = new Mesh(geometry, material);
    mesh.translateY(THICKNESS / 2);

    lod.addLevel(mesh, lodSpec.distance);
  }

  return lod;
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

const createGeometry = (path: Path, lodSpec: ChipLODSpec): BufferGeometry => {
  const points = path.getSpacedPoints(lodSpec.pathResolution);
  const geometry = new LatheGeometry(points, lodSpec.radialResolution);
  return geometry;
};

const createCanvasTexture = (path: Path, { denomination }: ChipOpts, lodSpec: ChipLODSpec): CanvasTexture => {
  const pathLength = path.getLength();

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx === null) throw new Error('Canvas 2d context is null');

  ctx.canvas.width = CIRCUMFERENCE * lodSpec.textureResolution;
  ctx.canvas.height = pathLength * lodSpec.textureResolution;
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
  texture.minFilter = NearestFilter;
  texture.generateMipmaps = false;

  return texture;
};
