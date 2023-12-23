import { z } from 'zod';

export const ServerEventSchema = z.object({
  path: z.string().optional(),
  value: z.unknown(),
});

export type ServerEvent = z.infer<typeof ServerEventSchema>;
