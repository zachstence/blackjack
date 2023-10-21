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
    [Rank.Two]: { hard: 2, soft: null },
    [Rank.Three]: { hard: 3, soft: null},
    [Rank.Four]: { hard: 4, soft: null},
    [Rank.Five]: { hard: 5, soft: null},
    [Rank.Six]: { hard: 6, soft: null},
    [Rank.Seven]: { hard: 7, soft: null},
    [Rank.Eight]: { hard: 8, soft: null},
    [Rank.Nine]: { hard: 9, soft: null},
    [Rank.Ten]: { hard: 10, soft: null },
    [Rank.Jack]: { hard: 10, soft: null },
    [Rank.Queen]: { hard: 10, soft: null },
    [Rank.King]: { hard: 10, soft: null },
}

export type IHiddenCard = {
    hidden: true
}

export type IVisibleCard = {
    hidden: false
    suit: Suit
    rank: Rank
}

export type ICard = IHiddenCard | IVisibleCard