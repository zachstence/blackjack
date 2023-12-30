import { z } from 'zod';

export enum InsuranceSettleStatus {
  Win = 'Win',
  Lose = 'Lose',
}

export enum InsuranceStatus {
  Offered = 'Offered',
  Bought = 'Bought',
  Declined = 'Declined',
  Settled = 'Settled',
}

const OfferedInsuranceSchema = z.object({
  status: z.literal(InsuranceStatus.Offered),
});

const BoughtInsuranceSchema = z.object({
  status: z.literal(InsuranceStatus.Bought),
  bet: z.number().int(),
});

const SettledInsuranceSchema = z.object({
  status: z.literal(InsuranceStatus.Settled),
  bet: z.number().int(),
  settleStatus: z.nativeEnum(InsuranceSettleStatus),
  winnings: z.number().int(),
});

export const InsuranceSchema = z.discriminatedUnion('status', [
  OfferedInsuranceSchema,
  BoughtInsuranceSchema,
  SettledInsuranceSchema,
]);
export type Insurance = z.infer<typeof InsuranceSchema>;
