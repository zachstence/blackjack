export enum Suit {
    Diamonds = 'Diamonds',
    Clubs = 'Clubs',
    Hearts = 'Hearts',
    Spades = 'Spades',
}
export const SUITS: Suit[] = [Suit.Diamonds, Suit.Clubs, Suit.Hearts, Suit.Spades]

export enum Rank {
    Ace = 'Ace',
    Two = 'Two',
    Three = 'Three',
    Four = 'Four',
    Five = 'Five',
    Six = 'Six',
    Seven = 'Seven',
    Eight = 'Eight',
    Nine = 'Nine',
    Ten = 'Ten',
    Jack = 'Jack',
    Queen = 'Queen',
    King = 'King',
}

export interface ICard {
    suit: Suit
    rank: Rank
}
