import { HandStatus, ICard, IGame, InsuranceStatus, Rank, RoundState, Suit } from "blackjack-types";
import { DealerAction, DealerState } from "./dealer-state";
import { PlayerState } from "./player-state";
import { createDeck } from "../createDeck";
import { durstenfeldShuffle } from "../durstenfeldShuffle";
import { ToClientJSON } from "./to-client-json";
import { PlayerHandState } from "./hand-state";

export class GameState implements ToClientJSON<IGame> {
    roundState: RoundState
    
    readonly dealer = new DealerState(this)
    
    private readonly _players: { [playerId: string]: PlayerState } = {}
    
    // TODO refactor into class to handle resetting shoe at cut card
    private _shoe: ICard[] = []
    
    constructor() {
        this.roundState = RoundState.PlayersReadying
    }
    
    get shoe(): ICard[] {
        return this._shoe
    }
    
    get players(): PlayerState[] {
        return Object.values(this._players)
    }

    get allPlayersReady(): boolean {
        return this.players.every(player => player.ready)
    }
    
    get allPlayerHands(): PlayerHandState[] {
        return this.players.flatMap(player => Object.values(player.hands))
    }

    get allPlayerHandsHaveBet(): boolean {
        return this.allPlayerHands.every(hand => hand.bet)
    }

    get shouldOfferInsurance(): boolean {
        const dealerCards = this.dealer.hand.cards
        if (dealerCards.length !== 2) return false
        const dealerUpCard = dealerCards[0]
        return dealerUpCard.rank === Rank.Ace
    }

    get allPlayerHandsHaveBoughtOrDeclinedInsurance(): boolean {
        return this.allPlayerHands.every(hand => 
            hand.insurance?.status === InsuranceStatus.Bought ||
            hand.insurance?.status === InsuranceStatus.Declined
        )
    }

    get insuredPlayerHands(): PlayerHandState[] {
        return this.allPlayerHands.filter(hand => hand.isInsured())
    }

    get allPlayerRootHands(): PlayerHandState[] {
        return this.allPlayerHands.filter(hand => hand.isRootHand)
    }
    
    get playersWithHands(): PlayerState[] {
        return this.players.filter(player => player.hasHand)
    }

    get allPlayerHandsHaveFinishedHitting(): boolean {
        return this.allPlayerHands.every(hand => hand.status !== HandStatus.Hitting)
    }

    get dealerIsDonePlaying(): boolean {
        return this.dealer.hand.status !== HandStatus.Hitting
    }
    
    resetShoe = (): void => {
        const numDecks = 6 // TODO control by options in the client
        
        const decks = Array.from({ length: numDecks }).flatMap(createDeck)
        durstenfeldShuffle(decks)
        
        this._shoe = decks

        this._shoe.push({
            suit: Suit.Spades,
            rank: Rank.Ten,
        })

        this._shoe.push({
            suit: Suit.Spades,
            rank: Rank.Eight
        })
        
        this._shoe.push({
            suit: Suit.Spades,
            rank: Rank.Ace,
        })
        
        this._shoe.push({
            suit: Suit.Spades,
            rank: Rank.Nine,
        })
    }

    getPlayer = (playerId: string): PlayerState => {
        const player = this._players[playerId]
        if (!player) throw new Error(`Player ${playerId} not found`)
        return player
    }

    addPlayer = (id: string, name: string): PlayerState => {
        const player = new PlayerState(id, name, this)
        this._players[player.id] = player
        return player
    }

    removePlayer = (playerId: string): void => {
        delete this._players[playerId]
    }
    
    draw = (): ICard => {
        const card = this._shoe.pop()
        if (!card) {
            console.warn('Shoe empty when drawing! Resetting and drawing again...')
            this.resetShoe()
            return this.draw()
        }
        return card
    }
    
    clearHands = (): void => {
        this.dealer.hand.clear()
        this.players.forEach(player => player.clearHands())
    }
    
    deal = (): void => {
        for (let i = 0; i < 2; i++) {
            for (const hand of this.allPlayerHands) {
                hand.dealCard()
            }
            this.dealer.hand.dealCard()
        }
    }
    
    playPlayers = (): void => {
        this.roundState = RoundState.PlayersPlaying
    }
    
    offerInsurance = (): PlayerHandState[] => {
        this.roundState = RoundState.Insuring
        this.allPlayerRootHands.forEach(hand => hand.offerInsurance())
        return this.allPlayerRootHands
    }
    
    settleInsurance = (): void => {
        this.playersWithHands.forEach(player => player.settleInsurance())
    }
    
    playDealer = (): DealerAction[] => {
        this.roundState = RoundState.DealerPlaying
        return this.dealer.play()
    }

    settleBets = (): void => {
        this.playersWithHands.forEach(player => player.settleHands())
    }
    
    toClientJSON(): IGame {
        const players = Object.fromEntries(Object.entries(this.players).map(([playerId, player]) => [playerId, player.toClientJSON()]))
        
        return {
            roundState: this.roundState,
            dealer: this.dealer.toClientJSON(),
            players,
            shoe: this.shoe, // TODO hide cards
        }
    }
}
