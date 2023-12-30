import { z } from 'zod';
import { CardSchema } from './card.types';

export enum HandStatus {
  Hitting = 'Hitting',
  Standing = 'Standing',
  Busted = 'Busted',
}

const HandValueSchema = z.object({
  hard: z.number().int(),
  soft: z.number().int().nullable(),
});

export const HandSchema = z.object({
  cards: z.array(CardSchema),
  // TODO we probably don't need to save this, and can compute it when needed instead
  value: HandValueSchema,
  status: z.nativeEnum(HandStatus),
});
export type Hand = z.infer<typeof HandSchema>;
