import { HandAction, HandStatus, ICard, IDealer } from "blackjack-types";
import { HandState } from "./hand-state";
import { ToClientJSON } from "./to-client-json";
import { GameState } from "./game-state";

export class DealerState implements ToClientJSON<IDealer> {
    readonly hand = new HandState(this.root)

    constructor(private readonly root: GameState) {}

    play = (): DealerAction[] => {
        const actions: DealerAction[] = []

        let action: DealerAction | undefined
        while (this.hand.status === HandStatus.Hitting) {
            action = this.playAction()
            actions.push(action)
        }

        return actions
    }

    private playAction = (): DealerAction => {
        // TODO config for soft/hard 17
        const bestValue = this.hand.bestValue
        const shouldStand = bestValue >= 17

        // Stand
        if (shouldStand) {
            this.hand.status = HandStatus.Standing
            return { action: HandAction.Stand }
        }

        // Hit
        const card = this.hand.dealCard()

        if (this.hand.bestValue > 21) this.hand.status = HandStatus.Busted
        else if (this.hand.bestValue === 21) this.hand.status = HandStatus.Standing
        else this.hand.status = HandStatus.Hitting

        return {
            action: HandAction.Hit,
            card,
        }
    }

    toClientJSON(): IDealer {
        return {
            hand: this.hand.toClientJSON(),
        }
    }
}

export interface DealerHitAction {
    action: HandAction.Hit
    card: ICard
}

export interface DealerStandAction {
    action: HandAction.Stand
}

export type DealerAction = DealerHitAction | DealerStandAction