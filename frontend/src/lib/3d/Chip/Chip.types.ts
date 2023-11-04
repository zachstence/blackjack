export const DENOMINATIONS = [1, 5, 25, 100, 500, 1_000, 5_000, 25_000, 100_000] as const;

export type Denomination = (typeof DENOMINATIONS)[number];
