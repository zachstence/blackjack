import { ICard } from "./card";

export interface IDealer {
    hand: [] | [ICard, 'hidden'] | [ICard, ICard]
}
