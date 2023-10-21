import { DealerHandAction, ICard, IDealer } from 'blackjack-types';
import { Hand } from '../hand';
import { ToClientJSON } from '../to-client-json';
import { Game } from '../game';

export class Dealer implements ToClientJSON<IDealer> {
  constructor(
    private readonly root: Game,
    readonly hand: Hand = new Hand(root),
  ) {}

  get revealed(): boolean {
    return this.hand.cards.every(card => !card.hidden);
  }

  play = (): DealerAction[] => {
    const actions: DealerAction[] = [];

    let action: DealerAction | undefined = undefined;
    while (action?.action !== DealerHandAction.Stand) {
      action = this.playAction();
      actions.push(action);
    }

    return actions;
  };

  playAction = (): DealerAction => {
    if (this.root.shouldDealerRevealAndPlay && !this.revealed) {
      this.reveal();
      return { action: DealerHandAction.Reveal };
    }

    if (!this.root.shouldDealerRevealAndPlay) {
      this.hand.stand();
      return { action: DealerHandAction.Stand };
    }

    const bestValue = this.hand.bestValue;
    const shouldStand = bestValue >= 17;
    if (shouldStand) {
      this.hand.stand();
      return { action: DealerHandAction.Stand };
    }

    const card = this.hand.hit();

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

  private reveal = (): void => {
    this.hand.cards.forEach(card => card.reveal());
  };
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
