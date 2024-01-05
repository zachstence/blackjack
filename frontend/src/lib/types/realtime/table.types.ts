import { z } from 'zod';

import { PlayerSchema } from './player.types';
import { ChatMessageSchema } from './chat-message.types';
import { DealerSchema } from './dealer.types';
import { CardSchema } from './card.types';
import { PlayerHandSchema } from './player-hand.types';

export enum RoundState {
  PlayersReadying = 'PlayersReadying',
  PlacingBets = 'PlacingBets',
  Insuring = 'Insuring',
  PlayersPlaying = 'PlayersPlaying',
  DealerPlaying = 'DealerPlaying',
}

export const TableSchema = z.object({
  id: z.string().min(1),
  chatMessages: z.array(ChatMessageSchema),

  roundState: z.nativeEnum(RoundState),
  shoe: z.array(CardSchema),
  dealer: DealerSchema,
  players: z.record(z.string(), PlayerSchema),
  playerHands: z.record(z.string(), PlayerHandSchema),
});
export type Table = z.infer<typeof TableSchema>;

export const TableUpdateSchema = z.object({
  set: z.record(z.string(), z.unknown()).optional(),
  unset: z.array(z.string()).optional(),
});
export type TableUpdate = z.infer<typeof TableUpdateSchema>;
