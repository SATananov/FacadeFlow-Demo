export type ProductType = 'fixed' | 'single' | 'double'
export type OpeningDirection = 'left' | 'right'

export interface ProductParameters {
  type: ProductType
  width: number
  height: number
  frameFaceWidth: number
  mullionWidth: number
  openingDirection: OpeningDirection
}

export interface ProductValidationResult {
  valid: boolean
  errors: string[]
}

export interface ProductComponent {
  number: number
  role: string
  profileCode: string
  nominalLength: number
  quantity: number
  suggestedAngles: string
}
