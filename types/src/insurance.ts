export enum InsuranceSettleStatus {
    Win = 'Win',
    Lose = 'Lose',
}

export enum InsuranceStatus {
    Offered = 'Offered',
    Bought = 'Bought',
    Declined = 'Declined',
    Settled = 'Settled',
}

export type IOfferedInsurance = {
    status: InsuranceStatus.Offered
}

export type IBoughtInsurance = {
    status: InsuranceStatus.Bought
    bet: number
}

export type ISettledInsurance = {
    status: InsuranceStatus.Settled
    bet: number
    settleStatus: InsuranceSettleStatus
    winnings: number
}

export type IDeclinedInsurance = {
    status: InsuranceStatus.Declined
}

export type IInsurance = IOfferedInsurance | IBoughtInsurance | ISettledInsurance | IDeclinedInsurance
