import { ToClientJSON } from './to-client-json';
import { IPlayer } from 'blackjack-types';

export class Player implements ToClientJSON<IPlayer> {
  private _money = 1000;

  ready = false;

  constructor(
    readonly id: string,
    readonly name: string,
  ) {}

  get money(): number {
    return this._money;
  }

  giveMoney = (amount: number): void => {
    this._money += amount;
  };

  takeMoney = (amount: number): void => {
    // TODO handle no more money
    this._money -= amount;
  };

  toClientJSON(): IPlayer {
    return {
      id: this.id,
      name: this.name,
      money: this.money,
      ready: this.ready,
    };
  }
}
