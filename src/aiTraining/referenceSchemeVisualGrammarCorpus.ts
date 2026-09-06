export const AI_REFERENCE_SCHEME_VISUAL_GRAMMAR_VERSION = 'AI-DRAWING-REF-01' as const

export type ReferenceVisualRole = 'FIXED' | 'OPENABLE' | 'SLIDING'
export type ReferenceVisualDirection = 'LEFT' | 'RIGHT' | 'UNRESOLVED'

export interface ReferenceSchemeVisualField {
  role: ReferenceVisualRole
  direction: ReferenceVisualDirection
}

export interface ReferenceSchemeVisualGrammarCase {
  sourceRef: `REF-${string}`
  category: 'WINDOW' | 'DOOR' | 'COMBINED'
  fields: ReferenceSchemeVisualField[]
  verticalDividerCount: number
  horizontalDividerCount: number
  lowerPanelZones: number
  notes: string
  safety: {
    runtimeTemplateDependency: false
    demoDirectionIsProductionTruth: false
    humanDirectionOverridesDemo: true
  }
}

const safety = {
  runtimeTemplateDependency: false,
  demoDirectionIsProductionTruth: false,
  humanDirectionOverridesDemo: true,
} as const

const F = (direction: ReferenceVisualDirection = 'UNRESOLVED'): ReferenceSchemeVisualField => ({ role: 'FIXED', direction })
const O = (direction: ReferenceVisualDirection = 'UNRESOLVED'): ReferenceSchemeVisualField => ({ role: 'OPENABLE', direction })
const S = (direction: ReferenceVisualDirection = 'UNRESOLVED'): ReferenceSchemeVisualField => ({ role: 'SLIDING', direction })

export const FACADEFLOW_REFERENCE_SCHEME_VISUAL_GRAMMAR_CASES: ReferenceSchemeVisualGrammarCase[] = [
  { sourceRef: 'REF-01', category: 'WINDOW', fields: [F()], verticalDividerCount: 0, horizontalDividerCount: 0, lowerPanelZones: 0, notes: 'Едно фиксирано поле.', safety },
  { sourceRef: 'REF-02', category: 'WINDOW', fields: [O('RIGHT')], verticalDividerCount: 0, horizontalDividerCount: 0, lowerPanelZones: 0, notes: 'Потвърдено дясно отваряне; каноничният AI символ е <.', safety },
  { sourceRef: 'REF-03', category: 'WINDOW', fields: [O('LEFT'), F()], verticalDividerCount: 1, horizontalDividerCount: 0, lowerPanelZones: 0, notes: 'Потвърдено ляво отваряне на лявото поле; AI използва семантиката, не legacy нотацията.', safety },
  { sourceRef: 'REF-04', category: 'WINDOW', fields: [O(), O()], verticalDividerCount: 1, horizontalDividerCount: 0, lowerPanelZones: 0, notes: 'Две отваряеми полета; демонстрационните посоки не се приемат като човешки факт.', safety },
  { sourceRef: 'REF-05', category: 'WINDOW', fields: [F(), O(), F()], verticalDividerCount: 2, horizontalDividerCount: 0, lowerPanelZones: 0, notes: 'Фиксирано + отваряемо + фиксирано.', safety },
  { sourceRef: 'REF-06', category: 'WINDOW', fields: [O(), F(), O()], verticalDividerCount: 2, horizontalDividerCount: 0, lowerPanelZones: 0, notes: 'Отваряемо + фиксирано + отваряемо.', safety },
  { sourceRef: 'REF-07', category: 'WINDOW', fields: [O('RIGHT'), O('LEFT'), O('LEFT')], verticalDividerCount: 2, horizontalDividerCount: 0, lowerPanelZones: 0, notes: 'Три отваряеми полета с изрично потвърдени посоки.', safety },
  { sourceRef: 'REF-08', category: 'WINDOW', fields: [F(), O(), O(), F()], verticalDividerCount: 3, horizontalDividerCount: 0, lowerPanelZones: 0, notes: 'Фиксирано + две отваряеми + фиксирано.', safety },
  { sourceRef: 'REF-09', category: 'WINDOW', fields: [O(), O(), O(), O()], verticalDividerCount: 3, horizontalDividerCount: 0, lowerPanelZones: 0, notes: 'Четири отваряеми полета; посоките са само демонстрационни.', safety },
  { sourceRef: 'REF-10', category: 'DOOR', fields: [O()], verticalDividerCount: 0, horizontalDividerCount: 0, lowerPanelZones: 0, notes: 'Балконска врата с едно високо отваряемо поле.', safety },
  { sourceRef: 'REF-11', category: 'DOOR', fields: [O()], verticalDividerCount: 0, horizontalDividerCount: 1, lowerPanelZones: 1, notes: 'Еднокрила врата с долен хоризонтален делител / панелна зона.', safety },
  { sourceRef: 'REF-12', category: 'COMBINED', fields: [S(), S(), S(), S()], verticalDividerCount: 3, horizontalDividerCount: 0, lowerPanelZones: 0, notes: 'Четири плъзгащи панела.', safety },
  { sourceRef: 'REF-13', category: 'COMBINED', fields: [S(), S()], verticalDividerCount: 1, horizontalDividerCount: 0, lowerPanelZones: 0, notes: 'Два плъзгащи панела с централна среща.', safety },
  { sourceRef: 'REF-14', category: 'DOOR', fields: [O()], verticalDividerCount: 0, horizontalDividerCount: 0, lowerPanelZones: 0, notes: 'Еднокрила входна/вътрешна врата.', safety },
  { sourceRef: 'REF-15', category: 'DOOR', fields: [O()], verticalDividerCount: 0, horizontalDividerCount: 1, lowerPanelZones: 1, notes: 'Еднокрила врата с долен делител.', safety },
  { sourceRef: 'REF-16', category: 'DOOR', fields: [O(), O()], verticalDividerCount: 1, horizontalDividerCount: 0, lowerPanelZones: 0, notes: 'Двукрила врата; демонстрационните посоки не са production truth.', safety },
  { sourceRef: 'REF-17', category: 'DOOR', fields: [O(), O()], verticalDividerCount: 1, horizontalDividerCount: 2, lowerPanelZones: 2, notes: 'Двукрила врата с по един долен делител във всяко крило.', safety },
]

export const FACADEFLOW_VISUAL_GRAMMAR_GENERALIZATION_CASES = [
  {
    id: 'five-field-unseen-pattern',
    description: 'Няма готов REF: пет вертикални полета FIXED | OPEN LEFT | FIXED | OPEN RIGHT | FIXED.',
    fieldTokens: ['FIXED', 'TURN:LEFT', 'FIXED', 'TURN:RIGHT', 'FIXED'],
  },
  {
    id: 'tilt-turn-unresolved-direction',
    description: 'Осово-откидно поле без ляво/дясно не получава измислена посока.',
    fieldTokens: ['TILT_TURN:UNRESOLVED'],
  },
  {
    id: 'sliding-unresolved-direction',
    description: 'Плъзгащо поле без зададена посока се визуализира като неуточнено, не като произволно ляво/дясно.',
    fieldTokens: ['SLIDING:UNRESOLVED'],
  },
] as const
