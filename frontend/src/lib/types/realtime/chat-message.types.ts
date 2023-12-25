import { z } from 'zod';

export const ChatMessageSchema = z.object({
  name: z.string(),
  content: z.string(),
  timestamp: z.string().datetime(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
