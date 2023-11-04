export type Denomination = 1 | 5 | 25 | 100 | 500 | 1_000 | 5_000 | 25_000 | 100_000;

export interface ChipProps {
  // Texture appearance
  color: string;
  numStripes: number;
  stripeWidth: number;
  stripeHeight: number;

  // Physical shape
  slotInnerRadius: number;
  slotWidth: number;
  slotDepth: number;
  filletRadius: number;

  // Resolution
  radialResolution: number;
  pathResolution: number;
  canvasScale: number;
}
