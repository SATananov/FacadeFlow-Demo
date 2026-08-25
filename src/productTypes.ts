export type ProductType = 'fixed' | 'single' | 'double' | 'mixed' | 'triple' | 'four-field'
export type OpeningDirection = 'left' | 'right'
export type ProductFieldState = 'fixed' | 'opening'
export type OpeningNotation = 'FIXED' | 'SIDE_TRIANGLE_LEFT' | 'SIDE_TRIANGLE_RIGHT' | 'TILT_PLACEHOLDER' | 'TILT_TURN_PLACEHOLDER'

export interface TemplateField {
  id: string
  componentKey: string
  x: number
  y: number
  width: number
  height: number
  state: ProductFieldState
  openingNotation: OpeningNotation
  openingDirection?: OpeningDirection
}

export interface TemplateDivider {
  id: string
  orientation: 'horizontal' | 'vertical'
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface ProductTemplate {
  id: string
  displayNumber: string
  name: string
  description: string
  category: ProductType
  fields: TemplateField[]
  dividers: TemplateDivider[]
  simulationOnly: true
}

export interface ProductParameters {
  templateId: string
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
  id: string
  number: number
  role: string
  profileCode: string
  nominalLength: number
  quantity: number
  suggestedLeftAngle: number
  suggestedRightAngle: number
  orientation: 'horizontal' | 'vertical'
  sourceProductType: ProductType
  label: string
}
