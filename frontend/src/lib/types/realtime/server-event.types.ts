import { z } from 'zod';

export const ServerEventSchema = z.object({
  path: z.string(),
  value: z.unknown(),
});

export type ServerEvent = z.infer<typeof ServerEventSchema>;
