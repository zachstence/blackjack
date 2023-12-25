import { z } from 'zod';

import { PlayerSchema } from './player.types';
import { ChatMessageSchema } from './chat-message.types';

export const TableSchema = z.object({
  id: z.string().min(1),

  chatMessages: z.array(ChatMessageSchema),

  players: z.array(PlayerSchema),
});

export type Table = z.infer<typeof TableSchema>;
