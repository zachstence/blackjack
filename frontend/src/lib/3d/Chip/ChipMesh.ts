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
import { DEFAULT_PROPS, RADIUS, THICKNESS } from './Chip.constants';

export const ChipMesh = (props: Partial<ChipProps> = {}): Mesh | undefined => {
  const _props = merge({}, DEFAULT_PROPS, props);

  const geometry = createGeometry(_props);
  const texture = createCanvasTexture(_props);

  const material = new MeshStandardMaterial({
    map: texture,
    side: DoubleSide,
  });

  const mesh = new Mesh(geometry, material);

  return mesh;
};

const createGeometry = ({
  radialSegments,
  pathSegments,
  slotInnerRadius,
  slotWidth,
  slotDepth,
  filletRadius,
}: ChipProps): BufferGeometry => {
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

  const points = path.getSpacedPoints(pathSegments);

  const geometry = new LatheGeometry(points, radialSegments);

  return geometry;
};

const createCanvasTexture = ({ color, numStripes, stripeWidth, stripeHeight }: ChipProps): CanvasTexture => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx === null) throw new Error(`Canvas 2d context is null`);

  // TODO use props for texture resolution
  ctx.canvas.width = 8192;
  ctx.canvas.height = 8192;

  // Fill canvas with base color
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Draw stripes
  const nonStripeWidth = ctx.canvas.width / numStripes - stripeWidth;
  const intervalWidth = stripeWidth + nonStripeWidth;
  for (let i = 0; i < numStripes; i++) {
    ctx.fillStyle = 'white';
    const x = i * intervalWidth;
    ctx.fillRect(x, ctx.canvas.height / 2 - stripeHeight / 2, stripeWidth, stripeHeight);
  }

  const texture = new CanvasTexture(canvas);
  texture.minFilter = LinearFilter;

  return texture;
};
