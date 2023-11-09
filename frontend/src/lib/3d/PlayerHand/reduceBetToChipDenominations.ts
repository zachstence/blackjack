import { DENOMINATIONS, type Denomination } from '../Chip/Chip.types';

export const reduceBetToChipDenominations = (bet: number): Denomination[] => {
  let total = 0;
  const denominations: Denomination[] = [];

  while (total < bet) {
    const betRemaining = bet - total;
    const maxDenomination = DENOMINATIONS.findLast((d) => d <= betRemaining);
    if (typeof maxDenomination === 'undefined') break; // TODO how to handle bet that doesn't divide into chips?
    denominations.push(maxDenomination);
    total += maxDenomination;
  }

  return denominations;
};
