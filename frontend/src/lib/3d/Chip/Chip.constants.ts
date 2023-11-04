import type { ChipProps } from './Chip.types';

export const DIAMETER = 39;
export const CIRCUMFERENCE = Math.PI * DIAMETER;
export const RADIUS = DIAMETER / 2;
export const THICKNESS = 3.5;

export const DEFAULT_PROPS: ChipProps = {
  // Texture appearance
  color: '#982C29',
  numStripes: 6,
  stripeWidth: 8,
  stripeHeight: 10,

  // Physical shape
  slotInnerRadius: 13,
  slotWidth: 2,
  slotDepth: 0.2,
  filletRadius: 0.5,

  // Resolution
  radialResolution: 128,
  pathResolution: 256,
  canvasScale: 4,
};
