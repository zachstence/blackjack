import { IShoe } from "blackjack-types";
import { ToClientJSON } from "./to-client-json"
import { CardState } from "./card-state";

import { createDeck } from "../createDeck";
import { durstenfeldShuffle } from "../durstenfeldShuffle";

export class ShoeState implements ToClientJSON<IShoe> {
    private _cards: CardState[] = []

    private readonly numDecks = 6 // TODO control by options in the client

    constructor() {
        this.reset()
    }

    get cards(): CardState[] {
        return this._cards
    }

    reset = (): void => {        
        const decks = Array.from({ length: this.numDecks }).flatMap(createDeck)
        durstenfeldShuffle(decks)
        this._cards = decks
    }

    draw = (): CardState => {
        const card = this._cards.pop()
        if (!card) {
            console.warn('Shoe empty when drawing! Resetting and drawing again...')
            this.reset()
            return this.draw()
        }
        return card
    }

    toClientJSON(): IShoe {
        return {
            length: this._cards.length,
        }
    }
}
