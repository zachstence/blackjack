import { IHand } from './hand';

export type IDealer = {
  hand: IHand;
};

export enum DealerHandAction {
  Reveal = 'Reveal',
  Hit = 'Hit',
  Stand = 'Stand',
}
