import { HandStatus, IGame, InsuranceStatus, Rank, RoundState } from "blackjack-types";
import { DealerAction, DealerState } from "./dealer-state";
import { PlayerState } from "./player-state";
import { ToClientJSON } from "./to-client-json";
import { PlayerHandState } from "./hand-state";
import { ShoeState } from "./shoe-state";

export class GameState implements ToClientJSON<IGame> {
    roundState: RoundState
    
    private _shoe: ShoeState

    readonly dealer: DealerState

    private readonly _players: { [playerId: string]: PlayerState }

    private readonly _playerHands: { [handId: string]: PlayerHandState }
    
    constructor() {
        this.roundState = RoundState.PlayersReadying
        this._shoe = new ShoeState()
        this.dealer = new DealerState(this)
        this._players = {}
        this._playerHands = {}
    }

    get shoe(): ShoeState {
        return this._shoe
    }
    
    get players(): PlayerState[] {
        return Object.values(this._players)
    }

    get playerHands(): PlayerHandState[] {
        return Object.values(this._playerHands)
    }

    get allPlayersReady(): boolean {
        return this.players.every(player => player.ready)
    }
    
    get allPlayerHandsHaveBet(): boolean {
        return this.playerHands.every(hand => hand.bet)
    }

    get shouldOfferInsurance(): boolean {
        const dealerCards = this.dealer.hand.cards
        if (dealerCards.length !== 2) return false
        const dealerUpCard = dealerCards[0]
        return dealerUpCard.rank === Rank.Ace
    }

    get allPlayerHandsHaveBoughtOrDeclinedInsurance(): boolean {
        return this.playerHands.every(hand => 
            hand.insurance?.status === InsuranceStatus.Bought ||
            hand.insurance?.status === InsuranceStatus.Declined
        )
    }

    get insuredPlayerHands(): PlayerHandState[] {
        return this.playerHands.filter(hand => hand.isInsured())
    }

    get allPlayerRootHands(): PlayerHandState[] {
        return this.playerHands.filter(hand => hand.isRootHand)
    }
    
    get allPlayerHandsHaveFinishedHitting(): boolean {
        return this.playerHands.every(hand => hand.status !== HandStatus.Hitting)
    }

    get dealerIsDonePlaying(): boolean {
        return this.dealer.hand.status !== HandStatus.Hitting
    }
    
    getPlayer = (playerId: string): PlayerState => {
        const player = this._players[playerId]
        if (!player) throw new Error(`Player ${playerId} not found`)
        return player
    }

    getPlayerHand = (playerId: string, handId: string): PlayerHandState => {
        const hand = this._playerHands[handId]
        if (!hand) throw new Error(`Hand ${handId} not found`)
        if (hand.playerId !== playerId) throw new Error(`Player ${playerId} does not own hand ${handId}`)

        return hand
    }

    addPlayer = (id: string, name: string): PlayerState => {
        const player = new PlayerState(id, name, this)
        this._players[player.id] = player

        this.addHand(true, player.id)

        return player
    }

    addHand = (isRootHand: boolean, playerId: string): PlayerHandState => {
        const hand = new PlayerHandState(isRootHand, playerId, this)
        this._playerHands[hand.id] = hand
        return hand
    }

    removePlayer = (playerId: string): void => {
        delete this._players[playerId]
        const playerHandIds = this.playerHands.filter(hand => hand.playerId === playerId).map(hand => hand.id)
        playerHandIds.forEach(handId => this.removeHand(handId))
    }
    
    removeHand = (handId: string): void => {
        delete this._playerHands[handId]
    }
    
    clearHands = (): void => {
        this.dealer.hand.clear()
        
        // Remove all player hands and re-create one for each player
        this.playerHands.forEach(hand => this.removeHand(hand.id))
        this.players.forEach(player => this.addHand(true, player.id))
    }

    bet = (playerId: string, handId: string, bet: number): void => {
        const hand = this.getPlayerHand(playerId, handId)
        hand.placeBet(bet)
    }
    
    deal = (): void => {
        for (let i = 0; i < 2; i++) {
            for (const hand of this.playerHands) {
                const card = this._shoe.draw().reveal()
                hand.dealCard(card)
            }
            const card = this._shoe.draw()
            if (i === 0) card.reveal()
            this.dealer.hand.dealCard(card)
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

    buyInsurance = (playerId: string, handId: string): void => {
        this.getPlayerHand(playerId, handId).buyInsurance()
    }

    declineInsurance = (playerId: string, handId: string): void => {
        this.getPlayerHand(playerId, handId).declineInsurance()
    }
    
    settleInsurance = (): void => {
        this.playerHands.forEach(hand => hand.settleInsurance())
    }

    hit = (playerId: string, handId: string): void => {
        this.getPlayerHand(playerId, handId).hit()
    }

    double = (playerId: string, handId: string): void => {
        this.getPlayerHand(playerId, handId).double()
    }

    split = (playerId: string, handId: string): [PlayerHandState, PlayerHandState] => {
        const player = this.getPlayer(playerId)
        const originalHand = this.getPlayerHand(playerId, handId)
        if (!originalHand.bet) throw new Error(`Cannot split hand ${handId}, it has no bet`)

        // Refund original bet and remove original hand
        player.giveMoney(originalHand.bet)
        this.removeHand(handId)

        // Split original hand into two hands, re-bet for each of them
        const [card1, card2] = originalHand.cards

        const newHand1 = this.addHand(false, playerId)
        newHand1.placeBet(originalHand.bet)
        newHand1.dealCard(card1)
        newHand1.hit()

        const newHand2 = this.addHand(false, playerId)
        newHand2.placeBet(originalHand.bet)
        newHand2.dealCard(card2)
        newHand2.hit()

        return [newHand1, newHand2]
    }

    stand = (playerId: string, handId: string): void => {
        this.getPlayerHand(playerId, handId).stand()
    }
    
    playDealer = (): DealerAction[] => {
        this.roundState = RoundState.DealerPlaying
        return this.dealer.play()
    }

    settleBets = (): void => {
        this.playerHands.forEach(hand => hand.settleBet())
    }
    
    toClientJSON(): IGame {
        const players = Object.fromEntries(Object.entries(this._players).map(([playerId, player]) => [playerId, player.toClientJSON()]))
        console.log('GameState.toClientJSON players', players)
        const playerHands = Object.fromEntries(Object.entries(this._playerHands).map(([handId, hand]) => [handId, hand.toClientJSON()]))
        
        return {
            roundState: this.roundState,
            shoe: this._shoe.toClientJSON(),
            dealer: this.dealer.toClientJSON(),
            players,
            playerHands,
        }
    }
}
