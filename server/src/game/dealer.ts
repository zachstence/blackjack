import { DealerHandAction, HandStatus, ICard, IDealer } from 'blackjack-types';
import { Hand } from './hand';
import { ToClientJSON } from './to-client-json';
import { Game } from './game';

export class Dealer implements ToClientJSON<IDealer> {
  readonly hand = new Hand(this.root);

  constructor(private readonly root: Game) {}

  get revealed(): boolean {
    return this.hand.cards.every(card => !card.hidden);
  }

  reveal = (): void => {
    this.hand.cards.forEach(card => card.reveal());
  };

  play = (): DealerAction[] => {
    const actions: DealerAction[] = [];

    let action: DealerAction | undefined;
    while (this.hand.status === HandStatus.Hitting) {
      action = this.playAction();
      actions.push(action);
    }

    return actions;
  };

  private playAction = (): DealerAction => {
    if (this.root.shouldDealerRevealAndPlay && !this.revealed) {
      this.reveal();
      return { action: DealerHandAction.Reveal };
    }

    if (!this.root.shouldDealerRevealAndPlay) {
      this.hand.stand();
      return { action: DealerHandAction.Stand };
    }

    // TODO config for soft/hard 17
    const bestValue = this.hand.bestValue;
    const shouldStand = bestValue >= 17;
    if (shouldStand) {
      this.hand.stand();
      return { action: DealerHandAction.Stand };
    }

    const card = this.hand.hit();

    if (this.hand.bestValue > 21) this.hand.status = HandStatus.Busted;
    else if (this.hand.bestValue === 21) this.hand.status = HandStatus.Standing;
    else this.hand.status = HandStatus.Hitting;

    return {
      action: DealerHandAction.Hit,
      card,
    };
  };

  toClientJSON(): IDealer {
    return {
      hand: this.hand.toClientJSON(),
    };
  }
}

export interface DealerRevealAction {
  action: DealerHandAction.Reveal;
}

export interface DealerHitAction {
  action: DealerHandAction.Hit;
  card: ICard;
}

export interface DealerStandAction {
  action: DealerHandAction.Stand;
}

export type DealerAction = DealerRevealAction | DealerHitAction | DealerStandAction;
