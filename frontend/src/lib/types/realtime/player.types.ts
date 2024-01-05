import { z } from 'zod';

export const PlayerSchema = z.object({
  id: z.string(),
  sseClientId: z.string(),
  tableId: z.string(),
  name: z.string(),
  money: z.number(),
  ready: z.boolean(),
});
export type Player = z.infer<typeof PlayerSchema>;
