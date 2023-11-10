import type { ChipLODSpec, Denomination } from './Chip.types';

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

export const CHIP_LODS: ChipLODSpec[] = [
  {
    distance: 0,
    pathResolution: 250,
    radialResolution: 60,
    textureResolution: 10,
  },
  {
    distance: 50,
    pathResolution: 200,
    radialResolution: 40,
    textureResolution: 5,
  },
  {
    distance: 100,
    pathResolution: 175,
    radialResolution: 35,
    textureResolution: 4,
  },
  {
    distance: 150,
    pathResolution: 150,
    radialResolution: 30,
    textureResolution: 4,
  },
  {
    distance: 200,
    pathResolution: 125,
    radialResolution: 25,
    textureResolution: 3,
  },
  {
    distance: 250,
    pathResolution: 100,
    radialResolution: 20,
    textureResolution: 2,
  },
  {
    distance: 300,
    pathResolution: 80,
    radialResolution: 20,
    textureResolution: 2,
  },
  {
    distance: 350,
    pathResolution: 80,
    radialResolution: 19,
    textureResolution: 2,
  },
  {
    distance: 400,
    pathResolution: 80,
    radialResolution: 18,
    textureResolution: 2,
  },
  {
    distance: 500,
    pathResolution: 60,
    radialResolution: 16,
    textureResolution: 1,
  },
];
