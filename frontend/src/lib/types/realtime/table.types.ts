import { z } from 'zod';
import { PlayerSchema } from './player.types';

export const TableSchema = z.object({
  id: z.string().min(1),

  players: z.array(PlayerSchema),
});

export type Table = z.infer<typeof TableSchema>;
