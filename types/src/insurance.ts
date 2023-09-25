export interface IBoughtInsurance {
    boughtInsurance: true
    bet: number
    won?: boolean
}

export interface IDeclinedInsurance {
    boughtInsurance: false
    bet: undefined
}

export type IInsurance = IBoughtInsurance | IDeclinedInsurance

export const isBoughtInsurance = (insurance: IInsurance): insurance is IBoughtInsurance => insurance.boughtInsurance

export const isDeclinedInsurance = (insurance: IInsurance): insurance is IDeclinedInsurance => !insurance.boughtInsurance
