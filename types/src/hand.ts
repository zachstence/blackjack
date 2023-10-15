import { ICard, RankValue } from "./card";
import { IBoughtInsurance, IInsurance, isBoughtInsurance } from "./insurance";
import { Serializable } from "./serializable";
import { IValue } from "./value";

export enum HandState {
    Hitting = 'Hitting',
    Standing = 'Standing',
    Busted = 'Busted',
}

export enum HandAction {
    Bet = 'Bet',
    Insure = 'Insure',
    Stand = 'Stand',
    Hit = 'Hit',
    Double = 'Double',
    Split = 'Split',
}

export enum HandSettleStatus {
    Blackjack = 'Blackjack',
    Win = 'Win',
    Push = 'Push',
    Lose = 'Lose',
}

export type IPlayerHand = {
    type: 'player'
    id: string
    isRootHand: boolean

    cards: ICard[]
    bet?: number
    insurance?: IInsurance

    value: IValue
    state: HandState
    actions: HandAction[]

    settleStatus?: HandSettleStatus
    winnings?: number
}

export type IInsuredPlayerHand = IPlayerHand & { insurance: IBoughtInsurance }

export const isHandInsured = (hand: IPlayerHand): hand is IInsuredPlayerHand => typeof hand.insurance !== 'undefined' && isBoughtInsurance(hand.insurance)

export class PlayerHand implements Serializable<IPlayerHand> {
    readonly type = 'player'

    cards: ICard[] = []
    
    bet?: number
    
    insurance?: IInsurance
    
    value: IValue = { hard: 0, soft: null }
    
    state: HandState = HandState.Hitting

    actions: HandAction[] = []

    settleStatus?: HandSettleStatus;

    winnings?: number;

    constructor(readonly id: string, readonly isRootHand: boolean) {}

    serialize(): IPlayerHand {
        return {
            type: this.type,
            id: this.id,
            isRootHand: this.isRootHand,
            cards: this.cards,
            bet: this.bet,
            insurance: this.insurance,
            value: this.value,
            state: this.state,
            actions: this.actions,
            settleStatus: this.settleStatus,
            winnings: this.winnings,
        }
    }
}

export type MaybeHiddenCard = ICard | 'hidden'

export type IDealerHand = {
    type: 'dealer'
    state: HandState
    cards: MaybeHiddenCard[]
    value: IValue
}

type DealerHandSerializeOpts = {
    revealed?: boolean
}

export class DealerHand implements Serializable<IDealerHand> {
    readonly type = "dealer"

    state: HandState = HandState.Hitting;

    cards: ICard[] = [];

    value: IValue = { hard: 0, soft: null };

    serialize(opts: DealerHandSerializeOpts = {}): IDealerHand {
        let cards: MaybeHiddenCard[]
        let value: IValue

        if (!opts.revealed && this.cards.length) {
            const [firstCard, ...rest] = this.cards
            cards = [firstCard, ...rest.map(() => 'hidden' as const)]
            value = RankValue[firstCard.rank]
        } else {
            cards = this.cards
            value = this.value
        }

        return {
            type: this.type,
            state: this.state,
            cards,
            value,
        }
    }
}

export type IHand = PlayerHand | DealerHand
