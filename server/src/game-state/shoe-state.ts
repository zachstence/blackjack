import { IShoe, Rank, Suit } from "blackjack-types";
import { ToClientJSON } from "./to-client-json"
import { CardState } from "./card-state";

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

const createDeck = (): CardState[] => {
    const cards: CardState[] = []
    
    for (const suit of Object.values(Suit)) {
        for (const rank of Object.values(Rank)) {
            cards.push(new CardState(suit, rank))
        }
    }
    
    return cards
}  

/** https://stackoverflow.com/a/12646864 */
const durstenfeldShuffle = (array: unknown[]) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
