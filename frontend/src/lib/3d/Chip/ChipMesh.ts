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
import merge from 'lodash/merge';

import type { ChipProps } from './Chip.types';
import { CIRCUMFERENCE, DEFAULT_PROPS, RADIUS, THICKNESS } from './Chip.constants';

export const ChipMesh = (props: Partial<ChipProps> = {}): Mesh | undefined => {
  const _props = merge({}, DEFAULT_PROPS, props);

  const path = createPath(_props);
  const geometry = createGeometry(path, _props);
  const texture = createCanvasTexture(path, _props);

  const material = new MeshStandardMaterial({
    map: texture,
    side: DoubleSide,
  });

  const mesh = new Mesh(geometry, material);

  return mesh;
};

const createPath = ({ slotInnerRadius, slotWidth, slotDepth, filletRadius }: ChipProps): Path => {
  const faceRadius = RADIUS - filletRadius;
  const sideHeight = THICKNESS - 2 * filletRadius;

  const path = new Path();
  path.moveTo(0, THICKNESS / 2);
  path.lineTo(slotInnerRadius, THICKNESS / 2);
  path.lineTo(slotInnerRadius, THICKNESS / 2 - slotDepth);
  path.lineTo(slotInnerRadius + slotWidth, THICKNESS / 2 - slotDepth);
  path.lineTo(slotInnerRadius + slotWidth, THICKNESS / 2);
  path.lineTo(faceRadius, THICKNESS / 2);
  path.arc(0, -filletRadius, filletRadius, Math.PI / 2, 0, true);
  path.lineTo(RADIUS, -sideHeight / 2);
  path.arc(-filletRadius, 0, filletRadius, 0, -Math.PI / 2, true);
  path.lineTo(slotInnerRadius + slotWidth, -THICKNESS / 2);
  path.lineTo(slotInnerRadius + slotWidth, -THICKNESS / 2 + slotDepth);
  path.lineTo(slotInnerRadius, -THICKNESS / 2 + slotDepth);
  path.lineTo(slotInnerRadius, -THICKNESS / 2);
  path.lineTo(0, -THICKNESS / 2);

  return path;
};

const createGeometry = (path: Path, { pathResolution, radialResolution }: ChipProps): BufferGeometry => {
  const points = path.getSpacedPoints(pathResolution);
  const geometry = new LatheGeometry(points, radialResolution);
  return geometry;
};

const createCanvasTexture = (path: Path, props: ChipProps): CanvasTexture => {
  const pathLength = path.getLength();
  const { color, numStripes, stripeWidth, stripeHeight, radialResolution, pathResolution, canvasScale } = props;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx === null) throw new Error(`Canvas 2d context is null`);

  ctx.canvas.width = radialResolution * canvasScale;
  ctx.canvas.height = pathResolution * canvasScale;
  const { width, height } = ctx.canvas;

  const stripeWidthPx = (stripeWidth / CIRCUMFERENCE) * width;
  const stripeHeightPx = (stripeHeight / pathLength) * height;

  // Fill canvas with base color
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);

  // Draw stripes
  const intervalWidthPx = width / numStripes;
  for (let i = 0.5; i < numStripes; i++) {
    ctx.fillStyle = 'white';
    const x = i * intervalWidthPx - stripeWidthPx / 2;
    const y = height / 2 - stripeHeightPx / 2;
    ctx.fillRect(x, y, stripeWidthPx, stripeHeightPx);
  }

  const texture = new CanvasTexture(canvas);
  texture.minFilter = LinearFilter;

  return texture;
};
