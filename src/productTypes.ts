export type ProductType = 'fixed' | 'single' | 'double' | 'mixed' | 'triple' | 'four-field'
export type OpeningDirection = 'left' | 'right'
export type ConfirmedOpeningNotation = 'LEFT_OPENING' | 'RIGHT_OPENING'
export type ProductFieldState = 'fixed' | 'opening' | 'sliding'
export type OpeningNotation = 'FIXED' | 'SIDE_TRIANGLE_LEFT' | 'SIDE_TRIANGLE_RIGHT' | 'TILT_PLACEHOLDER' | 'TILT_TURN_PLACEHOLDER' | 'SLIDING_LEFT' | 'SLIDING_RIGHT' | 'SLIDING_BIDIRECTIONAL' | 'JUNCTION_BIDIRECTIONAL' | 'JUNCTION_OPPOSED_STACKED'
export type TemplateCategory = 'WINDOWS' | 'BALCONY_DOORS' | 'SLIDING' | 'SINGLE_DOORS' | 'DOUBLE_DOORS'
export type ProductCategory = 'WINDOW' | 'DOOR' | 'COMBINED'
export type ProductDimensionSource = 'EMPTY' | 'USER_ENTERED' | 'WINDOW_DEMO_PRESET' | 'DOOR_DEMO_PRESET' | 'COMBINED_DEMO_PRESET'

export interface NormalizedRect { x: number; y: number; width: number; height: number }

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
  directionConfirmed?: boolean
  confirmedOpeningNotation?: ConfirmedOpeningNotation
  symbolBounds?: NormalizedRect
}

export interface TemplateDivider {
  id: string
  orientation: 'horizontal' | 'vertical'
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface TemplateSlidingSymbol {
  id: string
  x: number
  y: number
  notation: 'JUNCTION_BIDIRECTIONAL' | 'JUNCTION_OPPOSED_STACKED'
}

export interface ProductTemplate {
  id: string
  displayNumber: string
  name: string
  description: string
  category: ProductType
  libraryCategory: TemplateCategory
  productCategory: ProductCategory
  fields: TemplateField[]
  dividers: TemplateDivider[]
  slidingSymbols: TemplateSlidingSymbol[]
  recommendedWidth: number
  recommendedHeight: number
  referenceDerived: true
  simulationOnly: true
}

export interface ProductParameters {
  templateId: string
  productCategory: ProductCategory
  productName: string
  dimensionSource: ProductDimensionSource
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
  sourceTemplateId: string
  label: string
  openingDirection?: OpeningDirection
  openingNotation?: OpeningNotation
  directionConfirmed?: boolean
  confirmedOpeningNotation?: ConfirmedOpeningNotation
}
