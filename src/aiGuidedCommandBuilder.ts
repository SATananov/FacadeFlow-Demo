export type FacadeFlowGuidedAction =
  | 'CREATE_MODULE'
  | 'SWITCH_MODULE'
  | 'COPY_MODULE'
  | 'SET_QUANTITY'
  | 'SET_FRAME'
  | 'SPLIT_CELL'
  | 'SET_FIXED'
  | 'ADD_SASH'
  | 'CHANGE_SASH'
  | 'MOVE_DIVIDER'
  | 'DELETE_DIVIDER'
  | 'SET_OFFER_SETTING'
  | 'SET_MODULE_SETTING'
  | 'UNDO'
  | 'SUMMARY'

export type FacadeFlowGuidedOpening = 'TURN' | 'TILT_TURN'
export type FacadeFlowGuidedDirection = 'LEFT' | 'RIGHT'
export type FacadeFlowGuidedOrientation = 'VERTICAL' | 'HORIZONTAL'
export type FacadeFlowGuidedSettingField = 'system' | 'finish' | 'glazing' | 'hardware' | 'handle' | 'hinges'

export interface FacadeFlowGuidedCellContext {
  id: number
  hasSash: boolean
}

export interface FacadeFlowGuidedCommandContext {
  activeModuleNumber: number | null
  moduleNumbers: number[]
  cells: FacadeFlowGuidedCellContext[]
  dividerIds: number[]
  unresolvedCellIds?: number[]
}

export interface FacadeFlowGuidedCommandInput {
  action: FacadeFlowGuidedAction
  moduleNumber?: number | null
  sourceModuleNumber?: number | null
  targetModuleNumber?: number | null
  widthMm?: number | null
  heightMm?: number | null
  quantity?: number | null
  cellId?: number | null
  orientation?: FacadeFlowGuidedOrientation | null
  parts?: number | null
  opening?: FacadeFlowGuidedOpening | null
  direction?: FacadeFlowGuidedDirection | null
  dividerId?: number | null
  positionMm?: number | null
  settingField?: FacadeFlowGuidedSettingField | null
  settingValue?: string | null
}

export interface FacadeFlowGuidedCommandBuildResult {
  command: string | null
  reason: string | null
}

export interface FacadeFlowGuidedActionAvailability {
  action: FacadeFlowGuidedAction
  enabled: boolean
  reason: string | null
}

const positiveInteger = (value: number | null | undefined) => Number.isInteger(value) && Number(value) > 0
const positiveNumber = (value: number | null | undefined) => Number.isFinite(value) && Number(value) > 0

const settingLabels: Record<FacadeFlowGuidedSettingField, string> = {
  system: 'Система',
  finish: 'Цвят',
  glazing: 'Стъклопакет',
  hardware: 'Обков',
  handle: 'Дръжка',
  hinges: 'Панти',
}

const openingLabels: Record<FacadeFlowGuidedOpening, string> = {
  TURN: 'отваряемо',
  TILT_TURN: 'отваряемо и падащо',
}

const directionLabels: Record<FacadeFlowGuidedDirection, string> = {
  LEFT: 'ляво',
  RIGHT: 'дясно',
}

export function guidedFacadeFlowCellOptions(context: FacadeFlowGuidedCommandContext) {
  const active = [...context.cells].sort((left, right) => left.id - right.id)
  return {
    all: active,
    withoutSash: active.filter((cell) => !cell.hasSash),
    withSash: active.filter((cell) => cell.hasSash),
  }
}

export function guidedFacadeFlowActionAvailability(context: FacadeFlowGuidedCommandContext): FacadeFlowGuidedActionAvailability[] {
  const hasModule = context.activeModuleNumber !== null
  const cells = guidedFacadeFlowCellOptions(context)
  const hasGeometry = context.cells.length > 0
  return [
    { action: 'CREATE_MODULE', enabled: true, reason: null },
    { action: 'SWITCH_MODULE', enabled: context.moduleNumbers.length > 0, reason: context.moduleNumbers.length ? null : 'Няма създадени модули.' },
    { action: 'COPY_MODULE', enabled: context.moduleNumbers.length > 0, reason: context.moduleNumbers.length ? null : 'Няма модул за копиране.' },
    { action: 'SET_QUANTITY', enabled: hasModule, reason: hasModule ? null : 'Избери или създай модул.' },
    { action: 'SET_FRAME', enabled: hasModule, reason: hasModule ? null : 'Избери или създай модул.' },
    { action: 'SPLIT_CELL', enabled: hasGeometry, reason: hasGeometry ? null : 'Първо задай каса.' },
    { action: 'SET_FIXED', enabled: cells.all.length > 0, reason: cells.all.length ? null : 'Няма активна клетка.' },
    { action: 'ADD_SASH', enabled: cells.withoutSash.length > 0, reason: cells.withoutSash.length ? null : 'Няма активна клетка без крило.' },
    { action: 'CHANGE_SASH', enabled: cells.withSash.length > 0, reason: cells.withSash.length ? null : 'Няма клетка с крило.' },
    { action: 'MOVE_DIVIDER', enabled: context.dividerIds.length > 0, reason: context.dividerIds.length ? null : 'Няма делител за преместване.' },
    { action: 'DELETE_DIVIDER', enabled: context.dividerIds.length > 0, reason: context.dividerIds.length ? null : 'Няма делител за изтриване.' },
    { action: 'SET_OFFER_SETTING', enabled: true, reason: null },
    { action: 'SET_MODULE_SETTING', enabled: hasModule, reason: hasModule ? null : 'Избери или създай модул.' },
    { action: 'UNDO', enabled: hasModule, reason: hasModule ? null : 'Няма активен модул.' },
    { action: 'SUMMARY', enabled: context.moduleNumbers.length > 0, reason: context.moduleNumbers.length ? null : 'Няма модули за обобщение.' },
  ]
}

export function buildFacadeFlowGuidedCommand(input: FacadeFlowGuidedCommandInput): FacadeFlowGuidedCommandBuildResult {
  const moduleNumber = input.moduleNumber ?? null
  if (input.action === 'CREATE_MODULE') {
    if (!positiveInteger(moduleNumber) || !positiveNumber(input.widthMm) || !positiveNumber(input.heightMm) || !positiveInteger(input.quantity)) {
      return { command: null, reason: 'Нов модул изисква номер, ширина, височина и количество.' }
    }
    return { command: `Модул ${moduleNumber}, ${input.quantity} броя, каса ${input.widthMm} х ${input.heightMm} mm`, reason: null }
  }
  if (input.action === 'SWITCH_MODULE') {
    if (!positiveInteger(moduleNumber)) return { command: null, reason: 'Избери модул.' }
    return { command: `Отвори Модул ${moduleNumber}`, reason: null }
  }
  if (input.action === 'COPY_MODULE') {
    if (!positiveInteger(input.sourceModuleNumber) || !positiveInteger(input.targetModuleNumber)) return { command: null, reason: 'Избери изходен и нов номер на модул.' }
    const quantity = positiveInteger(input.quantity) ? `, ${input.quantity} броя` : ''
    return { command: `Копирай Модул ${input.sourceModuleNumber} като Модул ${input.targetModuleNumber}${quantity}`, reason: null }
  }
  if (input.action === 'SET_QUANTITY') {
    if (!positiveInteger(moduleNumber) || !positiveInteger(input.quantity)) return { command: null, reason: 'Избери модул и положително количество.' }
    return { command: `Количество за Модул ${moduleNumber}: ${input.quantity}`, reason: null }
  }
  if (input.action === 'SET_FRAME') {
    if (!positiveInteger(moduleNumber) || !positiveNumber(input.widthMm) || !positiveNumber(input.heightMm)) return { command: null, reason: 'Избери модул, ширина и височина.' }
    return { command: `Модул ${moduleNumber}, каса ${input.widthMm} х ${input.heightMm} mm`, reason: null }
  }
  if (input.action === 'SPLIT_CELL') {
    if (!positiveInteger(input.cellId) || !input.orientation || !positiveInteger(input.parts) || Number(input.parts) < 2) return { command: null, reason: 'Избери клетка, посока и поне 2 равни части.' }
    const orientation = input.orientation === 'VERTICAL' ? 'вертикално' : 'хоризонтално'
    return { command: `Раздели клетка ${input.cellId} ${orientation} на ${input.parts} равни части`, reason: null }
  }
  if (input.action === 'SET_FIXED') {
    if (!positiveInteger(input.cellId)) return { command: null, reason: 'Избери активна клетка.' }
    return { command: `Клетка ${input.cellId} е фиксирана`, reason: null }
  }
  if (input.action === 'ADD_SASH') {
    if (!positiveInteger(input.cellId) || !input.opening || !input.direction) return { command: null, reason: 'Избери клетка, тип отваряне и посока.' }
    return { command: `Постави крило в клетка ${input.cellId}, ${openingLabels[input.opening]}, ${directionLabels[input.direction]}`, reason: null }
  }
  if (input.action === 'CHANGE_SASH') {
    if (!positiveInteger(input.cellId) || !input.opening || !input.direction) return { command: null, reason: 'Избери клетка с крило, тип отваряне и посока.' }
    return { command: `Промени крилото в клетка ${input.cellId} на ${openingLabels[input.opening]}, ${directionLabels[input.direction]}`, reason: null }
  }
  if (input.action === 'MOVE_DIVIDER') {
    if (!positiveInteger(input.dividerId) || !positiveNumber(input.positionMm)) return { command: null, reason: 'Избери делител и нова позиция.' }
    return { command: `Премести делител ${input.dividerId} на ${input.positionMm} mm`, reason: null }
  }
  if (input.action === 'DELETE_DIVIDER') {
    if (!positiveInteger(input.dividerId)) return { command: null, reason: 'Избери делител.' }
    return { command: `Изтрий делител ${input.dividerId}`, reason: null }
  }
  if (input.action === 'SET_OFFER_SETTING' || input.action === 'SET_MODULE_SETTING') {
    const value = input.settingValue?.trim()
    if (!input.settingField || !value) return { command: null, reason: 'Избери параметър и стойност.' }
    const label = settingLabels[input.settingField]
    if (input.action === 'SET_OFFER_SETTING') return { command: `За цялата оферта ${label} ${value}`, reason: null }
    if (!positiveInteger(moduleNumber)) return { command: null, reason: 'Избери конкретен модул.' }
    return { command: `Модул ${moduleNumber}, ${label} ${value}`, reason: null }
  }
  if (input.action === 'UNDO') return { command: 'Undo', reason: null }
  if (input.action === 'SUMMARY') return { command: 'Колко изделия има общо в офертата?', reason: null }
  return { command: null, reason: 'Няма безопасна команда за избраното действие.' }
}
