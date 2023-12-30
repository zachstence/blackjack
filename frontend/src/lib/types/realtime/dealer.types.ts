import { z } from 'zod';
import { HandSchema } from './hand.types';

export const DealerSchema = z.object({
  hand: HandSchema,
});
