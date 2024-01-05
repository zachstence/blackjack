import { HandStatus, RoundState, type PlayerHand, HandAction, type Table } from '$lib/types/realtime';
import { nanoid } from 'nanoid';

export class PlayerHandService {
  create = (playerId: string, isRootHand: boolean): PlayerHand => ({
    cards: [],
    value: {
      hard: 0,
      soft: null,
    },
    status: HandStatus.Hitting,
    id: nanoid(),
    isRootHand,
    playerId,
    bet: undefined,
    insurance: null,
    actions: [],
    settleStatus: null,
    winnings: null,
  });

  getActions = (hand: PlayerHand, table: Table): HandAction[] => {
    if (!hand.bet && table.roundState === RoundState.PlacingBets) {
      return [HandAction.Bet];
    }

    return [];
  };
}
