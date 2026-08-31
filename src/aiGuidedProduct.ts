import type { CatalogueProfile, ProfileRole } from './profileCatalogueTypes'
import type {
  FacadeFlowGuidedColorMode,
  FacadeFlowGuidedFillType,
  FacadeFlowGuidedHandleType,
  FacadeFlowGuidedHardwareType,
  FacadeFlowGuidedInwardOutward,
  FacadeFlowGuidedOpeningDirection,
  FacadeFlowGuidedOpeningType,
  FacadeFlowGuidedProductDraft,
  FacadeFlowGuidedProductType,
  FacadeFlowProductSpecification,
} from './aiWorkspaceTypes'

export const GUIDED_PRODUCT_TYPE_LABELS: Record<Exclude<FacadeFlowGuidedProductType, ''>, string> = {
  WINDOW: 'Прозорец',
  DOOR: 'Врата',
}

export const GUIDED_OPENING_LABELS: Record<Exclude<FacadeFlowGuidedOpeningType, ''>, string> = {
  FIXED: 'Фикс',
  TURN: 'Отваряемо',
  TILT: 'Падащо',
  TILT_TURN: 'Отваряемо + падащо',
  DOUBLE_LEAF: 'Двукрило',
  SLIDING: 'Плъзгащо',
  OTHER: 'Друго / по проект',
}

export const GUIDED_DIRECTION_LABELS: Record<Exclude<FacadeFlowGuidedOpeningDirection, ''>, string> = {
  LEFT: 'Ляво',
  RIGHT: 'Дясно',
}

export const GUIDED_INWARD_OUTWARD_LABELS: Record<Exclude<FacadeFlowGuidedInwardOutward, ''>, string> = {
  INWARD: 'Навътре',
  OUTWARD: 'Навън',
}

export const GUIDED_FILL_LABELS: Record<Exclude<FacadeFlowGuidedFillType, ''>, string> = {
  GLAZING_UNIT: 'Стъклопакет',
  GLASS: 'Стъкло',
  PANEL: 'Панел / пълнеж',
  OTHER: 'Друго / по проект',
}

export const GUIDED_COLOR_MODE_LABELS: Record<Exclude<FacadeFlowGuidedColorMode, ''>, string> = {
  SAME_BOTH_SIDES: 'Един цвят отвън и отвътре',
  DIFFERENT_SIDES: 'Различен външен / вътрешен цвят',
  PROJECT_DEFINED: 'По проект / спецификация',
  OTHER: 'Друго',
}

export const GUIDED_HARDWARE_LABELS: Record<Exclude<FacadeFlowGuidedHardwareType, ''>, string> = {
  WINDOW: 'Прозоречен обков',
  DOOR: 'Вратен обков',
  SLIDING: 'Плъзгащ обков',
  OTHER: 'Друг / по проект',
}

export const GUIDED_HANDLE_LABELS: Record<Exclude<FacadeFlowGuidedHandleType, ''>, string> = {
  STANDARD: 'Стандартна дръжка',
  HANDLE_HANDLE: 'Дръжка / дръжка',
  HANDLE_KNOB: 'Дръжка / топка',
  KEYED: 'Дръжка с ключ',
  OTHER: 'Друга / по проект',
}

export function createEmptyGuidedProductDraft(): FacadeFlowGuidedProductDraft {
  return {
    productType: '',
    name: '',
    quantity: '1',
    width: '',
    height: '',
    profileSystem: '',
    manualProfileSystem: '',
    frameProfileId: '',
    sashProfileId: '',
    mullionProfileId: '',
    manualFrameProfile: '',
    manualSashProfile: '',
    manualMullionProfile: '',
    thresholdDescription: '',
    openingType: '',
    openingDirection: '',
    inwardOutward: '',
    fillType: '',
    fillDescription: '',
    colorMode: '',
    exteriorColor: '',
    interiorColor: '',
    hardwareType: '',
    hardwareDescription: '',
    handleType: '',
    handleDescription: '',
    hingeQuantity: '',
    notes: '',
    reviewAccepted: false,
    status: 'EMPTY',
  }
}


export function createGuidedDemoProductDraft(productType: Exclude<FacadeFlowGuidedProductType, ''>, profiles: CatalogueProfile[]): FacadeFlowGuidedProductDraft {
  const demoSystem = 'DEMO SYSTEM'
  const demoProfile = (role: ProfileRole) => profiles.find((profile) => profile.status !== 'ARCHIVED' && profile.system === demoSystem && profile.role === role)
  const frame = demoProfile('FRAME')
  const sash = demoProfile('SASH')
  const mullion = demoProfile('MULLION')
  const catalogueBacked = Boolean(frame || sash || mullion)
  const isDoor = productType === 'DOOR'

  return {
    ...createEmptyGuidedProductDraft(),
    productType,
    name: isDoor ? 'DEMO-D-01' : 'DEMO-W-01',
    quantity: '1',
    width: isDoor ? '900' : '1400',
    height: isDoor ? '2100' : '1200',
    profileSystem: catalogueBacked ? demoSystem : '',
    manualProfileSystem: catalogueBacked ? '' : demoSystem,
    frameProfileId: frame?.id ?? '',
    sashProfileId: sash?.id ?? '',
    mullionProfileId: mullion?.id ?? '',
    manualFrameProfile: frame ? '' : 'DEMO-FRAME-01',
    manualSashProfile: sash ? '' : 'DEMO-SASH-01',
    manualMullionProfile: mullion ? '' : 'DEMO-MULLION-01',
    thresholdDescription: isDoor ? 'DEMO-THRESHOLD-01 · примерен праг' : '',
    openingType: 'TURN',
    openingDirection: isDoor ? 'RIGHT' : 'LEFT',
    inwardOutward: 'INWARD',
    fillType: 'GLAZING_UNIT',
    fillDescription: 'DEMO-GLAZING-01 · примерен стъклопакет',
    colorMode: 'SAME_BOTH_SIDES',
    exteriorColor: 'DEMO-COLOR-01',
    interiorColor: '',
    hardwareType: isDoor ? 'DOOR' : 'WINDOW',
    hardwareDescription: isDoor ? 'DEMO-DOOR-HARDWARE-01' : 'DEMO-WINDOW-HARDWARE-01',
    handleType: isDoor ? 'HANDLE_HANDLE' : 'STANDARD',
    handleDescription: isDoor ? 'DEMO-DOOR-HANDLE-01' : 'DEMO-WINDOW-HANDLE-01',
    hingeQuantity: isDoor ? '3' : '2',
    notes: 'ДЕМО PRESET · Само за бърза визуална и функционална проверка. Не е реален проект и не е производствена спецификация.',
    reviewAccepted: false,
    status: 'NEEDS_REVIEW',
  }
}

export function activeGuidedProfileSystems(profiles: CatalogueProfile[]) {
  return [...new Set(profiles.filter((profile) => profile.status !== 'ARCHIVED').map((profile) => profile.system).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'bg'))
}

export function guidedProfilesForRole(profiles: CatalogueProfile[], system: string, role: ProfileRole) {
  if (!system) return []
  return profiles
    .filter((profile) => profile.status !== 'ARCHIVED' && profile.system === system && profile.role === role)
    .sort((a, b) => a.code.localeCompare(b.code, 'bg', { numeric: true }))
}

export function effectiveGuidedProfileSystem(draft: FacadeFlowGuidedProductDraft) {
  return draft.profileSystem || draft.manualProfileSystem.trim()
}

function validPositiveNumber(value: string) {
  const parsed = Number(value)
  return value.trim() !== '' && Number.isFinite(parsed) && parsed > 0
}

function validPositiveInteger(value: string) {
  const parsed = Number(value)
  return value.trim() !== '' && Number.isInteger(parsed) && parsed > 0
}

function selectedProfile(profiles: CatalogueProfile[], id: string, system: string, role: ProfileRole) {
  return profiles.find((profile) => profile.id === id && profile.status !== 'ARCHIVED' && profile.system === system && profile.role === role)
}

function profileValue(profiles: CatalogueProfile[], id: string, manual: string, system: string, role: ProfileRole) {
  const selected = selectedProfile(profiles, id, system, role)
  return selected?.code || manual.trim() || undefined
}

function isOperable(draft: FacadeFlowGuidedProductDraft) {
  return Boolean(draft.openingType && draft.openingType !== 'FIXED')
}

function directionRequired(draft: FacadeFlowGuidedProductDraft) {
  return ['TURN', 'TILT', 'TILT_TURN', 'DOUBLE_LEAF'].includes(draft.openingType)
}

export function guidedProductHasInput(draft: FacadeFlowGuidedProductDraft) {
  const initial = createEmptyGuidedProductDraft()
  return (Object.keys(initial) as (keyof FacadeFlowGuidedProductDraft)[]).some((key) => {
    if (key === 'quantity' || key === 'status' || key === 'reviewAccepted') return false
    return draft[key] !== initial[key]
  })
}

export function guidedProductUnresolved(draft: FacadeFlowGuidedProductDraft, profiles: CatalogueProfile[]) {
  const unresolved: string[] = []
  const system = effectiveGuidedProfileSystem(draft)
  const frame = selectedProfile(profiles, draft.frameProfileId, draft.profileSystem, 'FRAME')
  const sash = selectedProfile(profiles, draft.sashProfileId, draft.profileSystem, 'SASH')

  if (!draft.productType) unresolved.push('Тип изделие')
  if (!validPositiveInteger(draft.quantity)) unresolved.push('Количество')
  if (!validPositiveNumber(draft.width)) unresolved.push('Обща ширина')
  if (!validPositiveNumber(draft.height)) unresolved.push('Обща височина')
  if (!system) unresolved.push('Профилна система')
  if (!frame && !draft.manualFrameProfile.trim()) unresolved.push('Каса')

  if (!draft.openingType) unresolved.push('Тип отваряемост')
  if (isOperable(draft) && !sash && !draft.manualSashProfile.trim()) unresolved.push('Крило')
  if (directionRequired(draft) && !draft.openingDirection) unresolved.push('Посока ляво / дясно')
  if (directionRequired(draft) && !draft.inwardOutward) unresolved.push('Посока навътре / навън')

  if (!draft.fillType) unresolved.push('Вид пълнеж / стъкло')
  if (draft.fillType && !draft.fillDescription.trim()) unresolved.push('Описание на пълнежа / стъклопакета')
  if (!draft.colorMode) unresolved.push('Режим на цвета')
  if (draft.colorMode && !draft.exteriorColor.trim()) unresolved.push('Външен цвят / код')
  if (draft.colorMode === 'DIFFERENT_SIDES' && !draft.interiorColor.trim()) unresolved.push('Вътрешен цвят / код')

  if (isOperable(draft) && !draft.hardwareType) unresolved.push('Тип обков')
  if (isOperable(draft) && draft.hardwareType && !draft.hardwareDescription.trim()) unresolved.push('Обков — марка / система / код')
  if (isOperable(draft) && !draft.handleType) unresolved.push('Тип дръжка')
  if (isOperable(draft) && draft.handleType && !draft.handleDescription.trim()) unresolved.push('Дръжка — модел / код / описание')
  if (draft.productType === 'DOOR' && !draft.thresholdDescription.trim()) unresolved.push('Праг / долен възел')

  return unresolved
}

export function guidedProductWarnings(draft: FacadeFlowGuidedProductDraft, profiles: CatalogueProfile[]) {
  const warnings: string[] = []
  if (draft.manualProfileSystem.trim() && !draft.profileSystem) warnings.push('Профилната система е въведена ръчно и още не е сверена с каталога.')
  if (draft.manualFrameProfile.trim() && !selectedProfile(profiles, draft.frameProfileId, draft.profileSystem, 'FRAME')) warnings.push('Кодът на касата е въведен ръчно; съвместимостта остава за проверка по правила.')
  if (draft.manualSashProfile.trim() && !selectedProfile(profiles, draft.sashProfileId, draft.profileSystem, 'SASH')) warnings.push('Кодът на крилото е въведен ръчно; съвместимостта остава за проверка по правила.')
  if (draft.manualMullionProfile.trim() && !selectedProfile(profiles, draft.mullionProfileId, draft.profileSystem, 'MULLION')) warnings.push('Кодът на делителя е въведен ръчно; съвместимостта остава за проверка по правила.')
  return warnings
}

export function guidedProductCompletion(draft: FacadeFlowGuidedProductDraft, profiles: CatalogueProfile[]) {
  const unresolved = guidedProductUnresolved(draft, profiles)
  const total = 12
  const penalty = Math.min(total, unresolved.length)
  return Math.round(((total - penalty) / total) * 100)
}

export function updateGuidedProductDraft(current: FacadeFlowGuidedProductDraft, patch: Partial<FacadeFlowGuidedProductDraft>, profiles: CatalogueProfile[]): FacadeFlowGuidedProductDraft {
  const productTypeChanged = Object.prototype.hasOwnProperty.call(patch, 'productType') && patch.productType !== current.productType
  const base: FacadeFlowGuidedProductDraft = productTypeChanged
    ? { ...current, openingType: '', openingDirection: '', inwardOutward: '', hardwareType: '', hardwareDescription: '', handleType: '', handleDescription: '', hingeQuantity: '', thresholdDescription: patch.productType === 'DOOR' ? current.thresholdDescription : '' }
    : current
  let next: FacadeFlowGuidedProductDraft = { ...base, ...patch, reviewAccepted: false, status: 'NEEDS_REVIEW' }

  if (Object.prototype.hasOwnProperty.call(patch, 'profileSystem') || Object.prototype.hasOwnProperty.call(patch, 'manualProfileSystem')) {
    const system = next.profileSystem
    const valid = (id: string, role: ProfileRole) => !id || Boolean(selectedProfile(profiles, id, system, role))
    next = {
      ...next,
      frameProfileId: valid(next.frameProfileId, 'FRAME') ? next.frameProfileId : '',
      sashProfileId: valid(next.sashProfileId, 'SASH') ? next.sashProfileId : '',
      mullionProfileId: valid(next.mullionProfileId, 'MULLION') ? next.mullionProfileId : '',
    }
  }

  if (Object.prototype.hasOwnProperty.call(patch, 'openingType') && !directionRequired(next)) {
    next = { ...next, openingDirection: '', inwardOutward: '' }
  }

  if (next.openingType === 'FIXED') {
    next = { ...next, hardwareType: '', hardwareDescription: '', handleType: '', handleDescription: '', hingeQuantity: '' }
  }

  const status: FacadeFlowGuidedProductDraft['status'] = guidedProductHasInput(next) ? 'NEEDS_REVIEW' : 'EMPTY'
  return { ...next, status }
}

export function setGuidedProductReviewAccepted(current: FacadeFlowGuidedProductDraft, accepted: boolean): FacadeFlowGuidedProductDraft {
  return { ...current, reviewAccepted: accepted }
}

export function guidedProductToSpecification(draft: FacadeFlowGuidedProductDraft, profiles: CatalogueProfile[], jobId: string, status: FacadeFlowProductSpecification['status'] = 'NEEDS_REVIEW'): FacadeFlowProductSpecification {
  const system = effectiveGuidedProfileSystem(draft)
  const openingType = draft.openingType ? GUIDED_OPENING_LABELS[draft.openingType] : undefined
  const openingDirection = draft.openingDirection ? GUIDED_DIRECTION_LABELS[draft.openingDirection] : undefined
  const inwardOutward = draft.inwardOutward ? GUIDED_INWARD_OUTWARD_LABELS[draft.inwardOutward] : undefined
  const fill = draft.fillType ? `${GUIDED_FILL_LABELS[draft.fillType]}${draft.fillDescription.trim() ? ` — ${draft.fillDescription.trim()}` : ''}` : undefined
  const hardware = draft.hardwareType ? `${GUIDED_HARDWARE_LABELS[draft.hardwareType]}${draft.hardwareDescription.trim() ? ` — ${draft.hardwareDescription.trim()}` : ''}` : undefined
  const handle = draft.handleType ? `${GUIDED_HANDLE_LABELS[draft.handleType]}${draft.handleDescription.trim() ? ` — ${draft.handleDescription.trim()}` : ''}` : undefined
  const colorExterior = draft.exteriorColor.trim() || undefined
  const colorInterior = draft.colorMode === 'SAME_BOTH_SIDES' ? colorExterior : draft.interiorColor.trim() || undefined

  return {
    id: `${jobId}-guided-product`,
    name: draft.name.trim() || (draft.productType ? GUIDED_PRODUCT_TYPE_LABELS[draft.productType] : 'Неименувано изделие'),
    quantity: validPositiveInteger(draft.quantity) ? Number(draft.quantity) : 1,
    groupPath: [],
    dimensions: {
      width: validPositiveNumber(draft.width) ? Number(draft.width) : undefined,
      height: validPositiveNumber(draft.height) ? Number(draft.height) : undefined,
    },
    system: system || undefined,
    profiles: {
      frame: profileValue(profiles, draft.frameProfileId, draft.manualFrameProfile, draft.profileSystem, 'FRAME'),
      sash: profileValue(profiles, draft.sashProfileId, draft.manualSashProfile, draft.profileSystem, 'SASH'),
      mullion: profileValue(profiles, draft.mullionProfileId, draft.manualMullionProfile, draft.profileSystem, 'MULLION'),
      threshold: draft.productType === 'DOOR' ? draft.thresholdDescription.trim() || undefined : undefined,
    },
    opening: { type: openingType, direction: openingDirection, inwardOutward },
    hardware: {
      hinges: draft.hingeQuantity.trim() ? 'Количество панти, въведено от човек' : undefined,
      hingeQuantity: validPositiveInteger(draft.hingeQuantity) ? Number(draft.hingeQuantity) : undefined,
      handle,
      mechanism: hardware,
    },
    glazing: { description: fill },
    finish: { exterior: colorExterior, interior: colorInterior },
    notes: draft.notes.trim() || undefined,
    evidence: [{ id: `${jobId}-guided-manual-evidence`, sourceName: 'Guided AI Product Builder', sourceKind: 'MANUAL', note: 'Структурирано човешко въвеждане. Няма AI inference и няма автоматично производствено решение.' }],
    unresolved: guidedProductUnresolved(draft, profiles),
    status,
    simulationOnly: true,
    machineReady: false,
  }
}
