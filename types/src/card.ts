import { IValue } from "./value"

export enum Suit {
    Diamonds = 'Diamonds',
    Clubs = 'Clubs',
    Hearts = 'Hearts',
    Spades = 'Spades',
}

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

export const RankValue: Record<Rank, IValue> = {
    [Rank.Ace]: { hard: 1, soft: 11 },
    [Rank.Two]: { hard: 2 },
    [Rank.Three]: { hard: 3 },
    [Rank.Four]: { hard: 4 },
    [Rank.Five]: { hard: 5 },
    [Rank.Six]: { hard: 6 },
    [Rank.Seven]: { hard: 7 },
    [Rank.Eight]: { hard: 8 },
    [Rank.Nine]: { hard: 9 },
    [Rank.Ten]: { hard: 10 },
    [Rank.Jack]: { hard: 10 },
    [Rank.Queen]: { hard: 10 },
    [Rank.King]: { hard: 10 },
}

export interface ICard {
    suit: Suit
    rank: Rank
}
