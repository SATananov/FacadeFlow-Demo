import {
  createNadezhdaProjectPatternDraft,
  conflictingNadezhdaProjectValue,
  sourceBackedNadezhdaProjectValue,
  unresolvedNadezhdaProjectValue,
  validateNadezhdaProjectPatternDraft,
  type NadezhdaProjectEvidenceValue,
  type NadezhdaProjectMaterialKind,
  type NadezhdaProjectModule,
  type NadezhdaProjectModuleOverride,
  type NadezhdaProjectOfferVariant,
  type NadezhdaProjectPatternDraft,
  type NadezhdaProjectPlacementNode,
  type NadezhdaProjectProductGroup,
} from './nadezhdaProjectPatternSchema'
import type {
  NadezhdaDocumentPatternCandidate,
  NadezhdaDocumentPatternCandidateKind,
  NadezhdaDocumentPatternExtractionResult,
} from './nadezhdaDocumentPatternExtractor'

export const NADEZHDA_PROJECT_DRAFT_BRIDGE_VERSION = 'REALDATA02.3' as const

type CandidateOfKind<K extends NadezhdaDocumentPatternCandidateKind> = NadezhdaDocumentPatternCandidate & { kind: K }

interface MutableModuleRecord {
  module: NadezhdaProjectModule
  quantity: NadezhdaDocumentPatternCandidate[]
  width: NadezhdaDocumentPatternCandidate[]
  height: NadezhdaDocumentPatternCandidate[]
  group: MutableGroupRecord | null
}

interface MutableGroupRecord {
  group: NadezhdaProjectProductGroup
  system: NadezhdaDocumentPatternCandidate[]
  color: NadezhdaDocumentPatternCandidate[]
  glazing: NadezhdaDocumentPatternCandidate[]
  hardware: NadezhdaDocumentPatternCandidate[]
  reinforcement: NadezhdaDocumentPatternCandidate[]
  overrides: Map<string, MutableOverrideRecord>
}

interface MutableOverrideRecord {
  override: NadezhdaProjectModuleOverride
  system: NadezhdaDocumentPatternCandidate[]
  color: NadezhdaDocumentPatternCandidate[]
  glazing: NadezhdaDocumentPatternCandidate[]
  hardware: NadezhdaDocumentPatternCandidate[]
  reinforcement: NadezhdaDocumentPatternCandidate[]
}

interface MutableVariantRecord {
  variant: NadezhdaProjectOfferVariant
  vat: NadezhdaDocumentPatternCandidate[]
}

export interface NadezhdaProjectDraftBridgeSafety {
  explicitBridgeInvocationRequired: true
  createsLifecycleProject: false
  createsSourceDraftOnly: true
  sourceEvidenceOnly: true
  automaticAttributeInferenceAllowed: false
  automaticModuleMergeAllowed: false
  automaticReuseAllowed: false
  automaticProductionDecisionAllowed: false
  productionLocked: true
  machineReady: false
  productionApproved: false
}

export interface NadezhdaProjectDraftBridgeResult {
  bridgeVersion: typeof NADEZHDA_PROJECT_DRAFT_BRIDGE_VERSION
  draft: NadezhdaProjectPatternDraft
  warnings: string[]
  validationErrors: string[]
  readyForHumanReview: boolean
  safety: NadezhdaProjectDraftBridgeSafety
}

const bridgeSafety: NadezhdaProjectDraftBridgeSafety = Object.freeze({
  explicitBridgeInvocationRequired: true,
  createsLifecycleProject: false,
  createsSourceDraftOnly: true,
  sourceEvidenceOnly: true,
  automaticAttributeInferenceAllowed: false,
  automaticModuleMergeAllowed: false,
  automaticReuseAllowed: false,
  automaticProductionDecisionAllowed: false,
  productionLocked: true,
  machineReady: false,
  productionApproved: false,
})

function distinct<T>(values: T[]): T[] {
  return [...new Set(values)]
}

function evidenceValueFromCandidates<T>(
  candidates: NadezhdaDocumentPatternCandidate[],
  convert: (candidate: NadezhdaDocumentPatternCandidate) => T | null,
): NadezhdaProjectEvidenceValue<T> {
  const usable = candidates
    .map((candidate) => ({ candidate, value: convert(candidate) }))
    .filter((item): item is { candidate: NadezhdaDocumentPatternCandidate; value: T } => item.value !== null)

  if (usable.length === 0) return unresolvedNadezhdaProjectValue<T>()

  const serialized = distinct(usable.map((item) => JSON.stringify(item.value)))
  const evidenceRefs = distinct(usable.map((item) => item.candidate.evidence.id))
  if (serialized.length > 1) return conflictingNadezhdaProjectValue<T>(evidenceRefs)

  return sourceBackedNadezhdaProjectValue<T>(usable[0]!.value, evidenceRefs)
}

function stringValue(candidates: NadezhdaDocumentPatternCandidate[]): NadezhdaProjectEvidenceValue<string> {
  return evidenceValueFromCandidates(candidates, (candidate) => typeof candidate.value === 'string' ? candidate.value : null)
}

function numberValue(candidates: NadezhdaDocumentPatternCandidate[]): NadezhdaProjectEvidenceValue<number> {
  return evidenceValueFromCandidates(candidates, (candidate) => typeof candidate.value === 'number' ? candidate.value : null)
}

function booleanVatValue(candidates: NadezhdaDocumentPatternCandidate[]): NadezhdaProjectEvidenceValue<boolean> {
  return evidenceValueFromCandidates(candidates, (candidate) => {
    if (candidate.value === 'INCLUDED') return true
    if (candidate.value === 'EXCLUDED') return false
    return null
  })
}

function materialValue(candidate: NadezhdaDocumentPatternCandidate): NadezhdaProjectEvidenceValue<NadezhdaProjectMaterialKind> {
  const material = candidate.context.material
  if (!material) return unresolvedNadezhdaProjectValue<NadezhdaProjectMaterialKind>()
  return sourceBackedNadezhdaProjectValue(material, [candidate.evidence.id])
}

function candidateKey(candidate: NadezhdaDocumentPatternCandidate): string {
  return `${candidate.lineNumber}-${candidate.id}`
}

function createVariant(candidate: CandidateOfKind<'OFFER_VARIANT'>): MutableVariantRecord {
  return {
    variant: {
      id: `variant-${candidateKey(candidate)}`,
      label: sourceBackedNadezhdaProjectValue(String(candidate.value), [candidate.evidence.id]),
      productGroups: [],
      priceComponents: [],
      totalPrice: unresolvedNadezhdaProjectValue<number>(),
      currency: unresolvedNadezhdaProjectValue<string>(),
      vatIncluded: unresolvedNadezhdaProjectValue<boolean>(),
      includedItems: [],
      excludedItems: [],
    },
    vat: [],
  }
}

function createUnscopedVariant(): MutableVariantRecord {
  return {
    variant: {
      id: 'variant-unscoped-source',
      label: unresolvedNadezhdaProjectValue<string>(),
      productGroups: [],
      priceComponents: [],
      totalPrice: unresolvedNadezhdaProjectValue<number>(),
      currency: unresolvedNadezhdaProjectValue<string>(),
      vatIncluded: unresolvedNadezhdaProjectValue<boolean>(),
      includedItems: [],
      excludedItems: [],
    },
    vat: [],
  }
}

function createGroup(candidate: CandidateOfKind<'PRODUCT_GROUP'>): MutableGroupRecord {
  return {
    group: {
      id: `group-${candidateKey(candidate)}`,
      label: sourceBackedNadezhdaProjectValue(String(candidate.value), [candidate.evidence.id]),
      material: materialValue(candidate),
      system: unresolvedNadezhdaProjectValue<string>(),
      color: unresolvedNadezhdaProjectValue<string>(),
      glazing: unresolvedNadezhdaProjectValue<string>(),
      hardware: unresolvedNadezhdaProjectValue<string>(),
      reinforcement: unresolvedNadezhdaProjectValue<string>(),
      moduleIds: [],
      moduleOverrides: [],
    },
    system: [],
    color: [],
    glazing: [],
    hardware: [],
    reinforcement: [],
    overrides: new Map(),
  }
}

function createModule(candidate: CandidateOfKind<'MODULE_REFERENCE'>, placement: NadezhdaProjectPlacementNode[]): MutableModuleRecord {
  return {
    module: {
      id: `module-${candidateKey(candidate)}`,
      externalReference: sourceBackedNadezhdaProjectValue(String(candidate.value), [candidate.evidence.id]),
      quantity: unresolvedNadezhdaProjectValue<number>(),
      widthMm: unresolvedNadezhdaProjectValue<number>(),
      heightMm: unresolvedNadezhdaProjectValue<number>(),
      placement,
      notes: unresolvedNadezhdaProjectValue<string>(),
    },
    quantity: [],
    width: [],
    height: [],
    group: null,
  }
}

function createOverride(moduleId: string): MutableOverrideRecord {
  return {
    override: { moduleId },
    system: [],
    color: [],
    glazing: [],
    hardware: [],
    reinforcement: [],
  }
}

function valueBucket(
  group: MutableGroupRecord,
  override: MutableOverrideRecord | null,
  kind: NadezhdaDocumentPatternCandidateKind,
): NadezhdaDocumentPatternCandidate[] | null {
  const target = override ?? group
  if (kind === 'SYSTEM') return target.system
  if (kind === 'COLOR') return target.color
  if (kind === 'GLAZING') return target.glazing
  if (kind === 'HARDWARE') return target.hardware
  if (kind === 'REINFORCEMENT') return target.reinforcement
  return null
}

export function bridgeNadezhdaExtractionToProjectDraft(
  extraction: NadezhdaDocumentPatternExtractionResult,
  draftId: string,
): NadezhdaProjectDraftBridgeResult {
  const draft = createNadezhdaProjectPatternDraft(draftId)
  const warnings = [...extraction.warnings]

  draft.evidence = extraction.candidates.map((candidate) => ({
    id: candidate.evidence.id,
    sourceKind: candidate.evidence.sourceKind,
    sourceReference: candidate.evidence.sourceReference,
    locator: candidate.evidence.locator,
    note: candidate.evidence.rawText,
    privateSource: true,
  }))

  draft.siteLocation = stringValue(extraction.candidates.filter((candidate) => candidate.kind === 'SITE_LOCATION'))

  const variants: MutableVariantRecord[] = []
  const groups: MutableGroupRecord[] = []
  const modules: MutableModuleRecord[] = []
  let unscopedVariant: MutableVariantRecord | null = null
  let currentVariant: MutableVariantRecord | null = null
  let currentGroup: MutableGroupRecord | null = null
  let currentModule: MutableModuleRecord | null = null
  let currentPlacement: NadezhdaProjectPlacementNode[] = []
  let currentPlacementEvidenceId: string | null = null

  const ensureVariant = (): MutableVariantRecord => {
    if (currentVariant) return currentVariant
    if (!unscopedVariant) {
      unscopedVariant = createUnscopedVariant()
      variants.push(unscopedVariant)
    }
    currentVariant = unscopedVariant
    return currentVariant
  }

  for (const candidate of extraction.candidates) {
    if (candidate.kind === 'SPECIFICATION_SECTION') {
      currentVariant = null
      currentGroup = null
      currentModule = null
      continue
    }

    if (candidate.kind === 'OFFER_VARIANT') {
      currentVariant = createVariant(candidate as CandidateOfKind<'OFFER_VARIANT'>)
      variants.push(currentVariant)
      currentGroup = null
      currentModule = null
      continue
    }

    if (candidate.kind === 'PRODUCT_GROUP') {
      const variant = ensureVariant()
      currentGroup = createGroup(candidate as CandidateOfKind<'PRODUCT_GROUP'>)
      groups.push(currentGroup)
      variant.variant.productGroups.push(currentGroup.group)
      currentModule = null
      continue
    }

    if (candidate.kind === 'PLACEMENT') {
      const placement = candidate.context.placement[0]
      if (placement) {
        currentPlacementEvidenceId = candidate.evidence.id
        currentPlacement = [{
          kind: placement.kind,
          label: sourceBackedNadezhdaProjectValue(placement.label, [candidate.evidence.id]),
        }]
      }
      currentModule = null
      continue
    }

    if (candidate.kind === 'MODULE_REFERENCE') {
      const placement = candidate.context.placement.map((placementItem) => ({
        kind: placementItem.kind,
        label: sourceBackedNadezhdaProjectValue(
          placementItem.label,
          currentPlacementEvidenceId ? [currentPlacementEvidenceId] : [candidate.evidence.id],
        ),
      }))
      currentModule = createModule(candidate as CandidateOfKind<'MODULE_REFERENCE'>, placement.length > 0 ? placement : currentPlacement)
      currentModule.group = currentGroup
      modules.push(currentModule)
      if (currentGroup) currentGroup.group.moduleIds.push(currentModule.module.id)
      continue
    }

    if (candidate.kind === 'QUANTITY' || candidate.kind === 'WIDTH_MM' || candidate.kind === 'HEIGHT_MM') {
      if (!currentModule) {
        warnings.push(`Ред ${candidate.lineNumber}: ${candidate.kind} няма активен явен „Модул:“ и не е прехвърлен към проектната чернова.`)
        continue
      }
      if (candidate.kind === 'QUANTITY') currentModule.quantity.push(candidate)
      if (candidate.kind === 'WIDTH_MM') currentModule.width.push(candidate)
      if (candidate.kind === 'HEIGHT_MM') currentModule.height.push(candidate)
      continue
    }

    if (candidate.kind === 'SYSTEM' || candidate.kind === 'COLOR' || candidate.kind === 'GLAZING' || candidate.kind === 'HARDWARE' || candidate.kind === 'REINFORCEMENT') {
      if (!currentGroup) {
        warnings.push(`Ред ${candidate.lineNumber}: ${candidate.kind} няма явна продуктова група и остава само като source evidence.`)
        continue
      }
      let overrideRecord: MutableOverrideRecord | null = null
      if (currentModule && currentModule.group === currentGroup) {
        overrideRecord = currentGroup.overrides.get(currentModule.module.id) ?? createOverride(currentModule.module.id)
        currentGroup.overrides.set(currentModule.module.id, overrideRecord)
      }
      valueBucket(currentGroup, overrideRecord, candidate.kind)?.push(candidate)
      continue
    }

    if (candidate.kind === 'INCLUDED_ITEM' || candidate.kind === 'EXCLUDED_ITEM') {
      const variant = ensureVariant()
      const value = sourceBackedNadezhdaProjectValue(String(candidate.value), [candidate.evidence.id])
      if (candidate.kind === 'INCLUDED_ITEM') variant.variant.includedItems.push(value)
      else variant.variant.excludedItems.push(value)
      continue
    }

    if (candidate.kind === 'VAT_MODE') {
      ensureVariant().vat.push(candidate)
      continue
    }

    if (candidate.kind === 'PRICE_TEXT') {
      warnings.push(`Ред ${candidate.lineNumber}: ценовият текст е запазен като evidence, но REAL DATA 02.3 не извлича автоматично числова цена/валута.`)
    }
  }

  for (const moduleRecord of modules) {
    moduleRecord.module.quantity = numberValue(moduleRecord.quantity)
    moduleRecord.module.widthMm = numberValue(moduleRecord.width)
    moduleRecord.module.heightMm = numberValue(moduleRecord.height)
  }

  for (const variantRecord of variants) {
    variantRecord.variant.vatIncluded = booleanVatValue(variantRecord.vat)
    for (const group of variantRecord.variant.productGroups) {
      const groupRecord = groups.find((item) => item.group.id === group.id) ?? null
      if (!groupRecord) continue
      group.system = stringValue(groupRecord.system)
      group.color = stringValue(groupRecord.color)
      group.glazing = stringValue(groupRecord.glazing)
      group.hardware = stringValue(groupRecord.hardware)
      group.reinforcement = stringValue(groupRecord.reinforcement)
      group.moduleOverrides = [...groupRecord.overrides.values()].map((record) => ({
        moduleId: record.override.moduleId,
        ...(record.system.length > 0 ? { system: stringValue(record.system) } : {}),
        ...(record.color.length > 0 ? { color: stringValue(record.color) } : {}),
        ...(record.glazing.length > 0 ? { glazing: stringValue(record.glazing) } : {}),
        ...(record.hardware.length > 0 ? { hardware: stringValue(record.hardware) } : {}),
        ...(record.reinforcement.length > 0 ? { reinforcement: stringValue(record.reinforcement) } : {}),
      }))
    }
  }

  draft.modules = modules.map((item) => item.module)
  draft.offerVariants = variants.map((item) => item.variant)

  const validation = validateNadezhdaProjectPatternDraft(draft)
  warnings.push(...validation.warnings)

  return {
    bridgeVersion: NADEZHDA_PROJECT_DRAFT_BRIDGE_VERSION,
    draft,
    warnings: distinct(warnings),
    validationErrors: validation.errors,
    readyForHumanReview: validation.readyForHumanReview,
    safety: bridgeSafety,
  }
}
