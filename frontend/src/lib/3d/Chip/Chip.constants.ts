import type { ChipProps } from './Chip.types';

export const DIAMETER = 39;
export const RADIUS = DIAMETER / 2;
export const THICKNESS = 3.5;

export const DEFAULT_PROPS: ChipProps = {
  // Texture appearance
  color: '#982C29',
  numStripes: 6,
  stripeWidth: 500,
  stripeHeight: 2000,

  // Physical shape
  slotInnerRadius: 13,
  slotWidth: 1,
  slotDepth: 0.2,
  filletRadius: 0.5,

  // Resolution
  radialSegments: 128,
  pathSegments: 512,
};
