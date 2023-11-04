import type { Denomination } from './Chip.types';

export const DIAMETER = 39;
export const CIRCUMFERENCE = Math.PI * DIAMETER;
export const RADIUS = DIAMETER / 2;
export const THICKNESS = 3.5;

// Texture appearance
export const NUM_STRIPES = 6;
export const STRIPE_WIDTH = 8;
export const STRIPE_HEIGHT = 10;

// Physical shape
export const SLOT_INNER_RADIUS = 13;
export const SLOT_WIDTH = 2;
export const SLOT_DEPTH = 0.2;
export const FILLET_RADIUS = 0.5;

export const ColorByDenomination: Record<Denomination, string> = {
  [1]: 'red',
  [5]: 'orange',
  [25]: 'yellow',
  [100]: 'green',
  [500]: 'blue',
  [1_000]: 'purple',
  [5_000]: 'pink',
  [25_000]: 'gray',
  [100_000]: 'black',
};
