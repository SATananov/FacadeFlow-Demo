export const NADEZHDA_PROJECT_PATTERN_SCHEMA_VERSION = 'REALDATA02.1' as const

export type NadezhdaProjectEvidenceState = 'UNRESOLVED' | 'RESOLVED' | 'CONFLICT'
export type NadezhdaProjectSourceKind = 'PDF' | 'DOCX' | 'IMAGE' | 'MANUAL' | 'OTHER'
export type NadezhdaProjectPlacementKind = 'BUILDING' | 'FLOOR' | 'FACADE' | 'ROOM' | 'ZONE' | 'SECTION'
export type NadezhdaProjectMaterialKind = 'PVC' | 'ALUMINIUM' | 'MIXED' | 'OTHER' | 'UNRESOLVED'
export type NadezhdaProjectPricingBasis = 'AREA_M2' | 'PER_PIECE' | 'LINEAR_METER' | 'FIXED' | 'OTHER'

export interface NadezhdaProjectEvidenceRef {
  id: string
  sourceKind: NadezhdaProjectSourceKind
  sourceReference: string
  locator: string
  note: string
  privateSource: true
}

export interface NadezhdaProjectEvidenceValue<T> {
  state: NadezhdaProjectEvidenceState
  value: T | null
  evidenceRefs: string[]
  humanConfirmed: boolean
}

export interface NadezhdaProjectPlacementNode {
  kind: NadezhdaProjectPlacementKind
  label: NadezhdaProjectEvidenceValue<string>
}

export interface NadezhdaProjectModule {
  id: string
  externalReference: NadezhdaProjectEvidenceValue<string>
  quantity: NadezhdaProjectEvidenceValue<number>
  widthMm: NadezhdaProjectEvidenceValue<number>
  heightMm: NadezhdaProjectEvidenceValue<number>
  placement: NadezhdaProjectPlacementNode[]
  notes: NadezhdaProjectEvidenceValue<string>
}

export interface NadezhdaProjectModuleOverride {
  moduleId: string
  system?: NadezhdaProjectEvidenceValue<string>
  color?: NadezhdaProjectEvidenceValue<string>
  glazing?: NadezhdaProjectEvidenceValue<string>
  hardware?: NadezhdaProjectEvidenceValue<string>
  reinforcement?: NadezhdaProjectEvidenceValue<string>
  fill?: NadezhdaProjectEvidenceValue<string>
  notes?: NadezhdaProjectEvidenceValue<string>
}

export interface NadezhdaProjectProductGroup {
  id: string
  label: NadezhdaProjectEvidenceValue<string>
  material: NadezhdaProjectEvidenceValue<NadezhdaProjectMaterialKind>
  system: NadezhdaProjectEvidenceValue<string>
  color: NadezhdaProjectEvidenceValue<string>
  glazing: NadezhdaProjectEvidenceValue<string>
  hardware: NadezhdaProjectEvidenceValue<string>
  reinforcement: NadezhdaProjectEvidenceValue<string>
  moduleIds: string[]
  moduleOverrides: NadezhdaProjectModuleOverride[]
}

export interface NadezhdaProjectPriceComponent {
  id: string
  label: NadezhdaProjectEvidenceValue<string>
  basis: NadezhdaProjectPricingBasis
  quantity: NadezhdaProjectEvidenceValue<number>
  unit: NadezhdaProjectEvidenceValue<string>
  unitPrice: NadezhdaProjectEvidenceValue<number>
  totalPrice: NadezhdaProjectEvidenceValue<number>
  currency: NadezhdaProjectEvidenceValue<string>
}

export interface NadezhdaProjectOfferVariant {
  id: string
  label: NadezhdaProjectEvidenceValue<string>
  productGroups: NadezhdaProjectProductGroup[]
  priceComponents: NadezhdaProjectPriceComponent[]
  totalPrice: NadezhdaProjectEvidenceValue<number>
  currency: NadezhdaProjectEvidenceValue<string>
  vatIncluded: NadezhdaProjectEvidenceValue<boolean>
  includedItems: NadezhdaProjectEvidenceValue<string>[]
  excludedItems: NadezhdaProjectEvidenceValue<string>[]
}

export interface NadezhdaProjectPatternSafety {
  privateReferenceCorpus: true
  sourceEvidenceOnly: true
  templatePromotionAllowed: false
  automaticReuseAllowed: false
  automaticModuleMergeAllowed: false
  automaticAttributeInferenceAllowed: false
  automaticProductionDecisionAllowed: false
  productionLocked: true
  machineReady: false
  productionApproved: false
}

export interface NadezhdaProjectPatternDraft {
  schemaVersion: typeof NADEZHDA_PROJECT_PATTERN_SCHEMA_VERSION
  id: string
  projectName: NadezhdaProjectEvidenceValue<string>
  projectReference: NadezhdaProjectEvidenceValue<string>
  siteLocation: NadezhdaProjectEvidenceValue<string>
  evidence: NadezhdaProjectEvidenceRef[]
  modules: NadezhdaProjectModule[]
  offerVariants: NadezhdaProjectOfferVariant[]
  status: 'SOURCE_DRAFT'
  humanReviewStatus: 'NOT_REVIEWED'
  safety: NadezhdaProjectPatternSafety
}

export interface NadezhdaProjectValidationResult {
  errors: string[]
  warnings: string[]
  sameGeometryGroups: string[][]
  readyForHumanReview: boolean
}

const safety: NadezhdaProjectPatternSafety = Object.freeze({
  privateReferenceCorpus: true,
  sourceEvidenceOnly: true,
  templatePromotionAllowed: false,
  automaticReuseAllowed: false,
  automaticModuleMergeAllowed: false,
  automaticAttributeInferenceAllowed: false,
  automaticProductionDecisionAllowed: false,
  productionLocked: true,
  machineReady: false,
  productionApproved: false,
})

export function unresolvedNadezhdaProjectValue<T>(): NadezhdaProjectEvidenceValue<T> {
  return { state: 'UNRESOLVED', value: null, evidenceRefs: [], humanConfirmed: false }
}

export function sourceBackedNadezhdaProjectValue<T>(
  value: T,
  evidenceRefs: string[],
): NadezhdaProjectEvidenceValue<T> {
  return { state: 'RESOLVED', value, evidenceRefs: [...evidenceRefs], humanConfirmed: false }
}

export function conflictingNadezhdaProjectValue<T>(
  evidenceRefs: string[],
): NadezhdaProjectEvidenceValue<T> {
  return { state: 'CONFLICT', value: null, evidenceRefs: [...evidenceRefs], humanConfirmed: false }
}

export function createNadezhdaProjectPatternDraft(id: string): NadezhdaProjectPatternDraft {
  return {
    schemaVersion: NADEZHDA_PROJECT_PATTERN_SCHEMA_VERSION,
    id,
    projectName: unresolvedNadezhdaProjectValue<string>(),
    projectReference: unresolvedNadezhdaProjectValue<string>(),
    siteLocation: unresolvedNadezhdaProjectValue<string>(),
    evidence: [],
    modules: [],
    offerVariants: [],
    status: 'SOURCE_DRAFT',
    humanReviewStatus: 'NOT_REVIEWED',
    safety,
  }
}

function duplicatedIds(ids: string[]): string[] {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const id of ids) {
    if (seen.has(id)) duplicates.add(id)
    seen.add(id)
  }
  return [...duplicates]
}

function evidenceValueRefs(value: NadezhdaProjectEvidenceValue<unknown>): string[] {
  return value.evidenceRefs
}

function moduleEvidenceValues(module: NadezhdaProjectModule): NadezhdaProjectEvidenceValue<unknown>[] {
  return [
    module.externalReference,
    module.quantity,
    module.widthMm,
    module.heightMm,
    module.notes,
    ...module.placement.map((node) => node.label),
  ]
}

function overrideEvidenceValues(override: NadezhdaProjectModuleOverride): NadezhdaProjectEvidenceValue<unknown>[] {
  const values: NadezhdaProjectEvidenceValue<unknown>[] = []
  if (override.system) values.push(override.system)
  if (override.color) values.push(override.color)
  if (override.glazing) values.push(override.glazing)
  if (override.hardware) values.push(override.hardware)
  if (override.reinforcement) values.push(override.reinforcement)
  if (override.fill) values.push(override.fill)
  if (override.notes) values.push(override.notes)
  return values
}

function groupEvidenceValues(group: NadezhdaProjectProductGroup): NadezhdaProjectEvidenceValue<unknown>[] {
  return [
    group.label,
    group.material,
    group.system,
    group.color,
    group.glazing,
    group.hardware,
    group.reinforcement,
    ...group.moduleOverrides.flatMap(overrideEvidenceValues),
  ]
}

function priceEvidenceValues(component: NadezhdaProjectPriceComponent): NadezhdaProjectEvidenceValue<unknown>[] {
  return [component.label, component.quantity, component.unit, component.unitPrice, component.totalPrice, component.currency]
}

function variantEvidenceValues(variant: NadezhdaProjectOfferVariant): NadezhdaProjectEvidenceValue<unknown>[] {
  return [
    variant.label,
    variant.totalPrice,
    variant.currency,
    variant.vatIncluded,
    ...variant.includedItems,
    ...variant.excludedItems,
    ...variant.productGroups.flatMap(groupEvidenceValues),
    ...variant.priceComponents.flatMap(priceEvidenceValues),
  ]
}

export function findNadezhdaSameGeometryModuleGroups(modules: NadezhdaProjectModule[]): string[][] {
  const byGeometry = new Map<string, string[]>()
  for (const module of modules) {
    if (module.widthMm.state !== 'RESOLVED' || module.heightMm.state !== 'RESOLVED') continue
    if (module.widthMm.value === null || module.heightMm.value === null) continue
    const key = `${module.widthMm.value}x${module.heightMm.value}`
    const ids = byGeometry.get(key) ?? []
    ids.push(module.id)
    byGeometry.set(key, ids)
  }
  return [...byGeometry.values()].filter((ids) => ids.length > 1)
}

export function validateNadezhdaProjectPatternDraft(
  draft: NadezhdaProjectPatternDraft,
): NadezhdaProjectValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const evidenceIds = new Set(draft.evidence.map((item) => item.id))
  const moduleIds = new Set(draft.modules.map((item) => item.id))

  for (const id of duplicatedIds(draft.evidence.map((item) => item.id))) errors.push(`Повтарящ се evidence id: ${id}`)
  for (const id of duplicatedIds(draft.modules.map((item) => item.id))) errors.push(`Повтарящ се module id: ${id}`)
  for (const id of duplicatedIds(draft.offerVariants.map((item) => item.id))) errors.push(`Повтарящ се offer variant id: ${id}`)

  const allValues: NadezhdaProjectEvidenceValue<unknown>[] = [
    draft.projectName,
    draft.projectReference,
    draft.siteLocation,
    ...draft.modules.flatMap(moduleEvidenceValues),
    ...draft.offerVariants.flatMap(variantEvidenceValues),
  ]

  for (const value of allValues) {
    if (value.state === 'RESOLVED' && value.value === null) errors.push('RESOLVED стойност не може да бъде null.')
    if (value.state === 'RESOLVED' && value.evidenceRefs.length === 0) errors.push('RESOLVED стойност трябва да има поне един evidence ref.')
    if (value.state !== 'RESOLVED' && value.value !== null) errors.push('Само RESOLVED стойност може да съдържа ненулева стойност.')
    if (value.state !== 'RESOLVED' && value.humanConfirmed) errors.push('Само RESOLVED стойност може да бъде човешки потвърдена.')
    for (const ref of evidenceValueRefs(value)) {
      if (!evidenceIds.has(ref)) errors.push(`Липсва evidence ref: ${ref}`)
    }
  }

  for (const module of draft.modules) {
    if (module.quantity.state === 'RESOLVED' && (module.quantity.value ?? 0) <= 0) errors.push(`Невалиден брой за модул ${module.id}.`)
    if (module.widthMm.state === 'RESOLVED' && (module.widthMm.value ?? 0) <= 0) errors.push(`Невалидна ширина за модул ${module.id}.`)
    if (module.heightMm.state === 'RESOLVED' && (module.heightMm.value ?? 0) <= 0) errors.push(`Невалидна височина за модул ${module.id}.`)
  }

  for (const variant of draft.offerVariants) {
    for (const id of duplicatedIds(variant.productGroups.map((item) => item.id))) errors.push(`Повтарящ се product group id във вариант ${variant.id}: ${id}`)
    for (const group of variant.productGroups) {
      for (const moduleId of group.moduleIds) {
        if (!moduleIds.has(moduleId)) errors.push(`Product group ${group.id} сочи към липсващ модул ${moduleId}.`)
      }
      for (const override of group.moduleOverrides) {
        if (!moduleIds.has(override.moduleId)) errors.push(`Module override сочи към липсващ модул ${override.moduleId}.`)
        if (!group.moduleIds.includes(override.moduleId)) errors.push(`Module override ${override.moduleId} не принадлежи към product group ${group.id}.`)
      }
    }
  }

  const sameGeometryGroups = findNadezhdaSameGeometryModuleGroups(draft.modules)
  if (sameGeometryGroups.length > 0) warnings.push('Има модули с еднакви L/H; те остават отделни позиции и не се сливат автоматично.')
  if (draft.offerVariants.length > 1) warnings.push('Има няколко офертни варианта върху проектната геометрия; вариантите не дублират автоматично модулите.')
  if (allValues.some((value) => value.state === 'CONFLICT')) warnings.push('Има конфликтни source-backed стойности, които изискват човешки преглед.')
  if (allValues.some((value) => value.state === 'UNRESOLVED')) warnings.push('Има неуточнени стойности; липсващите данни не се извеждат автоматично.')

  return {
    errors: [...new Set(errors)],
    warnings: [...new Set(warnings)],
    sameGeometryGroups,
    readyForHumanReview: errors.length === 0,
  }
}
