import { z } from 'zod';

const BasePlayerSchema = z.object({
  sseClientId: z.string(),
  tableId: z.string(),
  name: z.string(),
});

export const GuestPlayerSchema = BasePlayerSchema.extend({
  id: z.string(),
  playerType: z.literal('guest'),
});
export type GuestPlayer = z.infer<typeof GuestPlayerSchema>;

export const UserPlayerSchema = BasePlayerSchema.extend({
  id: z.string(),
  playerType: z.literal('user'),
  userId: z.string(),
});
export type UserPlayer = z.infer<typeof UserPlayerSchema>;

export const PlayerSchema = z.discriminatedUnion('playerType', [GuestPlayerSchema, UserPlayerSchema]);
export type Player = z.infer<typeof PlayerSchema>;
