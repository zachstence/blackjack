import { z } from 'zod';
import { HandSchema } from './hand.types';
import { InsuranceSchema } from './insurance.types';

export enum HandAction {
  Bet = 'Bet',
  Insure = 'Insure',
  Stand = 'Stand',
  Hit = 'Hit',
  Double = 'Double',
  Split = 'Split',
}

export enum HandSettleStatus {
  Blackjack = 'Blackjack',
  Win = 'Win',
  Push = 'Push',
  Lose = 'Lose',
}

export const PlayerHandSchema = HandSchema.extend({
  id: z.string(),
  isRootHand: z.boolean(),
  playerId: z.string(),
  bet: z.number().optional(),
  insurance: InsuranceSchema.nullable(),
  actions: z.array(z.nativeEnum(HandAction)),
  settleStatus: z.nativeEnum(HandSettleStatus).nullable(),
  winnings: z.number().int().nullable(),
});
export type PlayerHand = z.infer<typeof PlayerHandSchema>;
