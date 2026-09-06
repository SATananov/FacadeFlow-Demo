import { createFacadeFlowProductIntent, type FacadeFlowProductIntent } from './aiProductIntent'

export type FacadeFlowQuickScope = 'SINGLE_PRODUCT' | 'OFFER'
export type FacadeFlowQuickProductType =
  | 'WINDOW'
  | 'DOOR'
  | 'BALCONY_DOOR'
  | 'SLIDING_SYSTEM'
  | 'STOREFRONT'
  | 'FACADE_MODULE'
  | 'TECHNICAL_DETAIL'
  | 'CUSTOM'

export type FacadeFlowQuickConfiguration = 'ONE_FIELD' | 'TWO_FIELD' | 'THREE_FIELD' | 'FOUR_FIELD' | 'FIVE_FIELD' | 'CUSTOM'
export type FacadeFlowQuickFieldState =
  | 'FIXED'
  | 'TURN_LEFT'
  | 'TURN_RIGHT'
  | 'TILT_TURN_LEFT'
  | 'TILT_TURN_RIGHT'
  | 'SLIDING_LEFT'
  | 'SLIDING_RIGHT'
  | 'UNRESOLVED'

export interface FacadeFlowQuickVisualPreset {
  id: string
  labelBg: string
  fieldCount: number
  states: readonly FacadeFlowQuickFieldState[]
  supportedInOfferModuleRuntime: boolean
}

export interface FacadeFlowQuickProductDraft {
  scope: FacadeFlowQuickScope
  productType: FacadeFlowQuickProductType
  configuration: FacadeFlowQuickConfiguration
  presetId: string
  widthMm: number | null
  heightMm: number | null
  quantity: number | null
  system?: string
  finish?: string
  glazing?: string
  hardware?: string
  handle?: string
  frameProfile?: string
  sashProfile?: string
  mullionProfile?: string
}

export interface FacadeFlowQuickPromptBuildResult {
  prompt: string | null
  reason: string | null
  preset: FacadeFlowQuickVisualPreset | null
}


export interface FacadeFlowQuickStructuredSelection {
  description: string
  intent: FacadeFlowProductIntent
  preset: FacadeFlowQuickVisualPreset
  directStructuredBinding: true
  nlpReparseRequired: false
  humanReviewRequired: true
  rulesValidated: false
  automaticGeometryAllowed: false
  machineReady: false
  productionApproved: false
}

export interface FacadeFlowQuickStructuredSelectionResult {
  selection: FacadeFlowQuickStructuredSelection | null
  reason: string | null
}

export interface FacadeFlowQuickOfferModulePlanInput {
  existingModuleNumbers: readonly number[]
  productType: FacadeFlowQuickProductType
  configuration: FacadeFlowQuickConfiguration
  presetId: string
  widthMm: number | null
  heightMm: number | null
  quantity: number | null
}

export interface FacadeFlowQuickOfferModulePlan {
  moduleNumber: number | null
  commands: string[]
  reason: string | null
  preset: FacadeFlowQuickVisualPreset | null
  inheritsOfferDefaults: true
  humanReviewRequired: true
  rulesValidated: false
  automaticGeometryAllowed: false
  machineReady: false
  productionApproved: false
}

export const FACADEFLOW_QUICK_PRODUCT_LABELS: Record<FacadeFlowQuickProductType, string> = {
  WINDOW: 'Прозорец',
  DOOR: 'Врата',
  BALCONY_DOOR: 'Балконска врата',
  SLIDING_SYSTEM: 'Плъзгаща система',
  STOREFRONT: 'Витрина',
  FACADE_MODULE: 'Фасаден модул',
  TECHNICAL_DETAIL: 'Технически детайл',
  CUSTOM: 'Нестандартно изделие',
}

export const FACADEFLOW_QUICK_CONFIGURATION_LABELS: Record<FacadeFlowQuickConfiguration, string> = {
  ONE_FIELD: '1 поле',
  TWO_FIELD: '2 полета',
  THREE_FIELD: '3 полета',
  FOUR_FIELD: '4 полета',
  FIVE_FIELD: '5 полета',
  CUSTOM: 'Нестандартна конфигурация',
}

const standardPresets: readonly FacadeFlowQuickVisualPreset[] = [
  { id: 'ONE_FIXED', labelBg: 'Едно фиксирано поле', fieldCount: 1, states: ['FIXED'], supportedInOfferModuleRuntime: true },
  { id: 'ONE_TURN_LEFT', labelBg: 'Едно отваряемо · ляво', fieldCount: 1, states: ['TURN_LEFT'], supportedInOfferModuleRuntime: true },
  { id: 'ONE_TILT_TURN_RIGHT', labelBg: 'Едно двуосно · дясно', fieldCount: 1, states: ['TILT_TURN_RIGHT'], supportedInOfferModuleRuntime: true },
  { id: 'TWO_FIXED', labelBg: 'FIX · FIX', fieldCount: 2, states: ['FIXED', 'FIXED'], supportedInOfferModuleRuntime: true },
  { id: 'TWO_FIXED_TTR', labelBg: 'FIX · двуосно дясно', fieldCount: 2, states: ['FIXED', 'TILT_TURN_RIGHT'], supportedInOfferModuleRuntime: true },
  { id: 'TWO_TTL_FIXED', labelBg: 'Двуосно ляво · FIX', fieldCount: 2, states: ['TILT_TURN_LEFT', 'FIXED'], supportedInOfferModuleRuntime: true },
  { id: 'TWO_TTL_TTR', labelBg: 'Двуосно ляво · двуосно дясно', fieldCount: 2, states: ['TILT_TURN_LEFT', 'TILT_TURN_RIGHT'], supportedInOfferModuleRuntime: true },
  { id: 'THREE_FIXED_TTR_FIXED', labelBg: 'FIX · двуосно дясно · FIX', fieldCount: 3, states: ['FIXED', 'TILT_TURN_RIGHT', 'FIXED'], supportedInOfferModuleRuntime: true },
  { id: 'THREE_TTL_FIXED_TTR', labelBg: 'Двуосно ляво · FIX · двуосно дясно', fieldCount: 3, states: ['TILT_TURN_LEFT', 'FIXED', 'TILT_TURN_RIGHT'], supportedInOfferModuleRuntime: true },
  { id: 'THREE_ALL_FIXED', labelBg: 'FIX · FIX · FIX', fieldCount: 3, states: ['FIXED', 'FIXED', 'FIXED'], supportedInOfferModuleRuntime: true },
  { id: 'FOUR_ALT', labelBg: 'FIX · двуосно дясно · FIX · двуосно дясно', fieldCount: 4, states: ['FIXED', 'TILT_TURN_RIGHT', 'FIXED', 'TILT_TURN_RIGHT'], supportedInOfferModuleRuntime: true },
  { id: 'FOUR_OUTER_OPEN', labelBg: 'Двуосно ляво · FIX · FIX · двуосно дясно', fieldCount: 4, states: ['TILT_TURN_LEFT', 'FIXED', 'FIXED', 'TILT_TURN_RIGHT'], supportedInOfferModuleRuntime: true },
  { id: 'FOUR_ALL_FIXED', labelBg: 'FIX · FIX · FIX · FIX', fieldCount: 4, states: ['FIXED', 'FIXED', 'FIXED', 'FIXED'], supportedInOfferModuleRuntime: true },
  { id: 'FIVE_CENTER_OPEN', labelBg: 'FIX · FIX · двуосно дясно · FIX · FIX', fieldCount: 5, states: ['FIXED', 'FIXED', 'TILT_TURN_RIGHT', 'FIXED', 'FIXED'], supportedInOfferModuleRuntime: true },
]

const slidingPresets: readonly FacadeFlowQuickVisualPreset[] = [
  { id: 'TWO_SLIDE_MEET', labelBg: 'Плъзгащо → · ← плъзгащо', fieldCount: 2, states: ['SLIDING_RIGHT', 'SLIDING_LEFT'], supportedInOfferModuleRuntime: false },
  { id: 'TWO_FIXED_SLIDE', labelBg: 'FIX · плъзгащо ←', fieldCount: 2, states: ['FIXED', 'SLIDING_LEFT'], supportedInOfferModuleRuntime: false },
  { id: 'THREE_FIXED_SLIDE_FIXED', labelBg: 'FIX · плъзгащо → · FIX', fieldCount: 3, states: ['FIXED', 'SLIDING_RIGHT', 'FIXED'], supportedInOfferModuleRuntime: false },
  { id: 'FOUR_SLIDING', labelBg: '4 плъзгащи полета', fieldCount: 4, states: ['SLIDING_RIGHT', 'SLIDING_RIGHT', 'SLIDING_LEFT', 'SLIDING_LEFT'], supportedInOfferModuleRuntime: false },
]

const configurationFieldCount: Record<FacadeFlowQuickConfiguration, number | null> = {
  ONE_FIELD: 1,
  TWO_FIELD: 2,
  THREE_FIELD: 3,
  FOUR_FIELD: 4,
  FIVE_FIELD: 5,
  CUSTOM: null,
}

const ordinalBg = ['Първото', 'Второто', 'Третото', 'Четвъртото', 'Петото'] as const

function positive(value: number | null | undefined) {
  return Number.isFinite(value) && Number(value) > 0
}

function positiveInteger(value: number | null | undefined) {
  return Number.isInteger(value) && Number(value) > 0
}

function statePrompt(state: FacadeFlowQuickFieldState, index: number) {
  const prefix = `${ordinalBg[index] ?? `Поле ${index + 1}`} поле`
  if (state === 'FIXED') return `${prefix} е фиксирано.`
  if (state === 'TURN_LEFT') return `${prefix} е отваряемо ляво.`
  if (state === 'TURN_RIGHT') return `${prefix} е отваряемо дясно.`
  if (state === 'TILT_TURN_LEFT') return `${prefix} е осово-откидно ляво.`
  if (state === 'TILT_TURN_RIGHT') return `${prefix} е осово-откидно дясно.`
  if (state === 'SLIDING_LEFT') return `${prefix} е плъзгащо наляво.`
  if (state === 'SLIDING_RIGHT') return `${prefix} е плъзгащо надясно.`
  return `${prefix} остава неуточнено.`
}

function stateOfferCommand(state: FacadeFlowQuickFieldState, cellId: number) {
  if (state === 'FIXED') return `Клетка ${cellId} е фиксирана`
  if (state === 'TURN_LEFT') return `Постави крило в клетка ${cellId}, отваряемо, ляво`
  if (state === 'TURN_RIGHT') return `Постави крило в клетка ${cellId}, отваряемо, дясно`
  if (state === 'TILT_TURN_LEFT') return `Постави крило в клетка ${cellId}, отваряемо и падащо, ляво`
  if (state === 'TILT_TURN_RIGHT') return `Постави крило в клетка ${cellId}, отваряемо и падащо, дясно`
  return null
}

function promptProductName(productType: FacadeFlowQuickProductType) {
  if (productType === 'SLIDING_SYSTEM') return 'Плъзгаща система'
  if (productType === 'BALCONY_DOOR') return 'Балконска врата'
  if (productType === 'STOREFRONT') return 'Витрина'
  if (productType === 'FACADE_MODULE') return 'Фасаден модул'
  if (productType === 'TECHNICAL_DETAIL') return 'Технически детайл'
  if (productType === 'CUSTOM') return 'Нестандартно изделие'
  return FACADEFLOW_QUICK_PRODUCT_LABELS[productType]
}

export function facadeFlowQuickFieldCount(configuration: FacadeFlowQuickConfiguration) {
  return configurationFieldCount[configuration]
}

export function facadeFlowQuickVisualPresets(productType: FacadeFlowQuickProductType, configuration: FacadeFlowQuickConfiguration) {
  const fieldCount = configurationFieldCount[configuration]
  if (!fieldCount) return []
  if (!['WINDOW', 'DOOR', 'BALCONY_DOOR', 'SLIDING_SYSTEM'].includes(productType)) return []
  const source = productType === 'SLIDING_SYSTEM' ? slidingPresets : standardPresets
  return source.filter((preset) => preset.fieldCount === fieldCount)
}

export function facadeFlowQuickPresetById(productType: FacadeFlowQuickProductType, presetId: string) {
  return [...standardPresets, ...slidingPresets].find((preset) => preset.id === presetId && (productType === 'SLIDING_SYSTEM' ? slidingPresets.includes(preset) : standardPresets.includes(preset))) ?? null
}


function quickIntentCategory(productType: FacadeFlowQuickProductType): FacadeFlowProductIntent['category'] {
  if (productType === 'WINDOW') return 'WINDOW'
  if (productType === 'DOOR' || productType === 'BALCONY_DOOR') return 'DOOR'
  if (productType === 'SLIDING_SYSTEM') return 'COMBINED'
  return 'UNRESOLVED'
}

function quickIntentFieldState(state: FacadeFlowQuickFieldState, index: number, evidenceId: string): FacadeFlowProductIntent['fields'][number] {
  const base = {
    id: `quick-field-${index + 1}`,
    order: index,
    evidenceIds: [evidenceId],
    unresolved: [] as string[],
  }
  if (state === 'FIXED') return { ...base, role: 'FIXED', openingType: 'FIXED', openingDirection: 'UNRESOLVED' }
  if (state === 'TURN_LEFT') return { ...base, role: 'OPENING_SASH', openingType: 'TURN', openingDirection: 'LEFT' }
  if (state === 'TURN_RIGHT') return { ...base, role: 'OPENING_SASH', openingType: 'TURN', openingDirection: 'RIGHT' }
  if (state === 'TILT_TURN_LEFT') return { ...base, role: 'OPENING_SASH', openingType: 'TILT_TURN', openingDirection: 'LEFT' }
  if (state === 'TILT_TURN_RIGHT') return { ...base, role: 'OPENING_SASH', openingType: 'TILT_TURN', openingDirection: 'RIGHT' }
  if (state === 'SLIDING_LEFT') return { ...base, role: 'SLIDING_SASH', openingType: 'SLIDING', openingDirection: 'LEFT' }
  if (state === 'SLIDING_RIGHT') return { ...base, role: 'SLIDING_SASH', openingType: 'SLIDING', openingDirection: 'RIGHT' }
  return { ...base, role: 'UNRESOLVED', openingType: 'UNRESOLVED', openingDirection: 'UNRESOLVED', unresolved: [`Поле ${index + 1} остава неуточнено.`] }
}

export function buildFacadeFlowQuickStructuredSelection(
  draft: FacadeFlowQuickProductDraft,
  intentId = 'quick-select-product-intent',
): FacadeFlowQuickStructuredSelectionResult {
  const promptResult = buildFacadeFlowQuickProductPrompt(draft)
  if (!promptResult.prompt || !promptResult.preset) return { selection: null, reason: promptResult.reason }

  const evidenceId = `${intentId}-explicit-ui-selection`
  const intent = createFacadeFlowProductIntent({
    id: intentId,
    sourceKind: 'MANUAL',
    sourceText: promptResult.prompt,
    aiGenerated: false,
  })
  intent.category = quickIntentCategory(draft.productType)
  intent.name = promptProductName(draft.productType)
  intent.quantity = draft.quantity ?? undefined
  intent.dimensions = { widthMm: draft.widthMm ?? undefined, heightMm: draft.heightMm ?? undefined }
  intent.profiles = {
    system: draft.system?.trim() || undefined,
    frame: draft.frameProfile?.trim() || undefined,
    sash: draft.sashProfile?.trim() || undefined,
    mullion: draft.mullionProfile?.trim() || undefined,
  }
  intent.fields = promptResult.preset.states.map((state, index) => quickIntentFieldState(state, index, evidenceId))
  intent.dividers = []
  intent.glazing = { description: draft.glazing?.trim() || undefined }
  intent.finish = draft.finish?.trim() ? { exterior: draft.finish.trim(), interior: draft.finish.trim() } : {}
  intent.hardwareDefaults = {
    mechanism: draft.hardware?.trim() || undefined,
    handle: draft.handle?.trim() || undefined,
  }
  intent.evidence = [{
    id: evidenceId,
    sourceKind: 'MANUAL',
    sourceName: 'FacadeFlow Quick Select',
    excerpt: promptResult.prompt,
    location: 'AI → Бърз избор',
    strength: 'EXPLICIT',
  }]
  intent.unresolved = intent.fields.flatMap((field) => field.unresolved)
  intent.status = 'NEEDS_REVIEW'

  return {
    selection: {
      description: promptResult.prompt,
      intent,
      preset: promptResult.preset,
      directStructuredBinding: true,
      nlpReparseRequired: false,
      humanReviewRequired: true,
      rulesValidated: false,
      automaticGeometryAllowed: false,
      machineReady: false,
      productionApproved: false,
    },
    reason: null,
  }
}

export function buildFacadeFlowQuickProductPrompt(draft: FacadeFlowQuickProductDraft): FacadeFlowQuickPromptBuildResult {
  if (!['WINDOW', 'DOOR', 'BALCONY_DOOR', 'SLIDING_SYSTEM'].includes(draft.productType)) {
    return { prompt: null, reason: 'Този тип изделие остава за „Опиши с AI“ / технически детайл, защото текущият quick parser няма достатъчно структуриран модел за него.', preset: null }
  }
  if (!positive(draft.widthMm) || !positive(draft.heightMm) || !positiveInteger(draft.quantity)) {
    return { prompt: null, reason: 'Бързият избор изисква ширина, височина и количество.', preset: null }
  }
  const fieldCount = configurationFieldCount[draft.configuration]
  if (!fieldCount) {
    return { prompt: null, reason: 'За нестандартна конфигурация използвай „Опиши с AI“, за да не измисляме геометрия.', preset: null }
  }
  const preset = facadeFlowQuickPresetById(draft.productType, draft.presetId)
  if (!preset || preset.fieldCount !== fieldCount) {
    return { prompt: null, reason: 'Избери визуална конфигурация за зададения брой полета.', preset: null }
  }

  const parts: string[] = []
  if (draft.scope === 'OFFER') parts.push('Оферта.')
  parts.push(`${promptProductName(draft.productType)} ${draft.widthMm} x ${draft.heightMm} mm.`)
  parts.push(`Количество: ${draft.quantity}.`)
  parts.push(`${fieldCount} ${fieldCount === 1 ? 'поле' : 'полета'}.`)
  parts.push(...preset.states.map(statePrompt))
  const technical: string[] = []
  if (draft.system?.trim()) technical.push(`Система ${draft.system.trim()}`)
  if (draft.finish?.trim()) technical.push(`Цвят ${draft.finish.trim()}`)
  if (draft.glazing?.trim()) technical.push(`Стъклопакет ${draft.glazing.trim()}`)
  if (draft.hardware?.trim()) technical.push(`Обков ${draft.hardware.trim()}`)
  if (draft.handle?.trim()) technical.push(`Дръжка ${draft.handle.trim()}`)
  if (draft.frameProfile?.trim()) technical.push(`Каса ${draft.frameProfile.trim()}`)
  if (draft.sashProfile?.trim()) technical.push(`Крило ${draft.sashProfile.trim()}`)
  if (draft.mullionProfile?.trim()) technical.push(`Делител ${draft.mullionProfile.trim()}`)
  if (technical.length) parts.push(`${technical.join(', ')}.`)

  return { prompt: parts.join(' '), reason: null, preset }
}

export function nextFacadeFlowQuickModuleNumber(existingModuleNumbers: readonly number[]) {
  const used = new Set(existingModuleNumbers.filter((value) => Number.isInteger(value) && value > 0))
  let candidate = 1
  while (used.has(candidate)) candidate += 1
  return candidate
}

export function buildFacadeFlowQuickOfferModulePlan(input: FacadeFlowQuickOfferModulePlanInput): FacadeFlowQuickOfferModulePlan {
  const base: Omit<FacadeFlowQuickOfferModulePlan, 'moduleNumber' | 'commands' | 'reason' | 'preset'> = {
    inheritsOfferDefaults: true,
    humanReviewRequired: true,
    rulesValidated: false,
    automaticGeometryAllowed: false,
    machineReady: false,
    productionApproved: false,
  }
  if (!positive(input.widthMm) || !positive(input.heightMm) || !positiveInteger(input.quantity)) {
    return { ...base, moduleNumber: null, commands: [], reason: 'Задай ширина, височина и количество.', preset: null }
  }
  const fieldCount = configurationFieldCount[input.configuration]
  if (!fieldCount) {
    return { ...base, moduleNumber: null, commands: [], reason: 'Нестандартната конфигурация остава за AI описание / водена ръчна редакция.', preset: null }
  }
  const preset = facadeFlowQuickPresetById(input.productType, input.presetId)
  if (!preset || preset.fieldCount !== fieldCount) {
    return { ...base, moduleNumber: null, commands: [], reason: 'Избери визуална схема.', preset: null }
  }
  if (!preset.supportedInOfferModuleRuntime) {
    return { ...base, moduleNumber: null, commands: [], reason: 'Тази схема се разпознава от AI описанието, но текущият офертен модулен runtime още не прилага плъзгаща геометрия автоматично.', preset }
  }

  const moduleNumber = nextFacadeFlowQuickModuleNumber(input.existingModuleNumbers)
  const commands = [`Модул ${moduleNumber}, ${input.quantity} броя, каса ${input.widthMm} х ${input.heightMm} mm`]
  if (fieldCount > 1) commands.push(`Раздели клетка 1 вертикално на ${fieldCount} равни части`)
  preset.states.forEach((state, index) => {
    const cellId = fieldCount === 1 ? 1 : index + 2
    const command = stateOfferCommand(state, cellId)
    if (command) commands.push(command)
  })
  return { ...base, moduleNumber, commands, reason: null, preset }
}

export function facadeFlowQuickStateShortLabel(state: FacadeFlowQuickFieldState) {
  if (state === 'FIXED') return 'FIX'
  if (state === 'TURN_LEFT') return '↙'
  if (state === 'TURN_RIGHT') return '↘'
  if (state === 'TILT_TURN_LEFT') return '↖'
  if (state === 'TILT_TURN_RIGHT') return '↗'
  if (state === 'SLIDING_LEFT') return '←'
  if (state === 'SLIDING_RIGHT') return '→'
  return '?'
}
