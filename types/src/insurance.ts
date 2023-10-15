export enum InsuranceSettleStatus {
    Win = 'Win',
    Lose = 'Lose',
}

export type IBoughtInsurance = {
    boughtInsurance: true
    bet: number
    settleStatus?: InsuranceSettleStatus
    winnings?: number
}

export type IDeclinedInsurance = {
    boughtInsurance: false
    bet: null
}

export type IInsurance = IBoughtInsurance | IDeclinedInsurance

export const isBoughtInsurance = (insurance: IInsurance): insurance is IBoughtInsurance => insurance.boughtInsurance

export const isDeclinedInsurance = (insurance: IInsurance): insurance is IDeclinedInsurance => !insurance.boughtInsurance
