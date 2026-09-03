import type { NadezhdaHumanOfferApplicabilityResult } from './nadezhdaHumanOfferApplicability'
import type { NadezhdaProjectPatternDraft } from './nadezhdaProjectPatternSchema'

export const NADEZHDA_MODULE_OVERRIDE_REVIEW_VERSION = 'REALDATA02.7' as const

export type NadezhdaModuleOverrideField =
  | 'SYSTEM'
  | 'COLOR'
  | 'GLAZING'
  | 'HARDWARE'
  | 'REINFORCEMENT'
  | 'FILL'
  | 'NOTES'

export interface NadezhdaHumanModuleOverrideDecision {
  id: string
  variantId: string
  moduleId: string
  field: NadezhdaModuleOverrideField
  value: string
  evidenceRefs: string[]
  reviewerId: string
  reviewedAt: string
  note: string
}

export type NadezhdaReviewedModuleOverrideState = 'RESOLVED' | 'CONFLICT_REVIEW_REQUIRED'

export interface NadezhdaReviewedModuleOverride {
  variantId: string
  moduleId: string
  field: NadezhdaModuleOverrideField
  state: NadezhdaReviewedModuleOverrideState
  value: string | null
  evidenceRefs: string[]
  decisionIds: string[]
}

export interface NadezhdaModuleOverrideReviewSafety {
  humanDecisionRequired: true
  sourceEvidenceRequired: true
  automaticOverrideInferenceAllowed: false
  automaticLastWriteWinsAllowed: false
  automaticVariantSelectionAllowed: false
  mutatesSourceDraft: false
  createsLifecycleProject: false
  automaticReuseAllowed: false
  productionLocked: true
  machineReady: false
  productionApproved: false
}

export interface NadezhdaModuleOverrideReviewResult {
  version: typeof NADEZHDA_MODULE_OVERRIDE_REVIEW_VERSION
  decisions: NadezhdaHumanModuleOverrideDecision[]
  overrides: NadezhdaReviewedModuleOverride[]
  validationErrors: string[]
  warnings: string[]
  readyForDownstreamHumanReviewedUse: boolean
  safety: NadezhdaModuleOverrideReviewSafety
}

const safety: NadezhdaModuleOverrideReviewSafety = Object.freeze({
  humanDecisionRequired: true,
  sourceEvidenceRequired: true,
  automaticOverrideInferenceAllowed: false,
  automaticLastWriteWinsAllowed: false,
  automaticVariantSelectionAllowed: false,
  mutatesSourceDraft: false,
  createsLifecycleProject: false,
  automaticReuseAllowed: false,
  productionLocked: true,
  machineReady: false,
  productionApproved: false,
})

function distinct(values: string[]): string[] {
  return [...new Set(values)]
}

function isValidTimestamp(value: string): boolean {
  return value.trim().length > 0 && !Number.isNaN(Date.parse(value))
}

function keyFor(
  decision: Pick<NadezhdaHumanModuleOverrideDecision, 'variantId' | 'moduleId' | 'field'>,
): string {
  return `${decision.variantId}::${decision.moduleId}::${decision.field}`
}

export function reviewNadezhdaModuleOverrides(
  draft: NadezhdaProjectPatternDraft,
  applicability: NadezhdaHumanOfferApplicabilityResult,
  decisions: NadezhdaHumanModuleOverrideDecision[],
): NadezhdaModuleOverrideReviewResult {
  const validationErrors: string[] = []
  const warnings: string[] = []
  const evidenceIds = new Set(draft.evidence.map((item) => item.id))
  const moduleIds = new Set(draft.modules.map((module) => module.id))
  const variantIds = new Set(draft.offerVariants.map((variant) => variant.id))
  const reviewedVariants = new Map(
    applicability.variants.map((variant) => [variant.variantId, variant]),
  )

  const duplicateDecisionIds = decisions
    .map((decision) => decision.id)
    .filter((id, index, values) => values.indexOf(id) !== index)

  for (const id of distinct(duplicateDecisionIds)) {
    validationErrors.push(`Повтарящ се human module override decision id: ${id}`)
  }

  const acceptedDecisions: NadezhdaHumanModuleOverrideDecision[] = []

  for (const decision of decisions) {
    let valid = true
    const reviewedVariant = reviewedVariants.get(decision.variantId)

    if (!decision.id.trim()) {
      validationErrors.push('Human module override decision изисква непразен id.')
      valid = false
    }
    if (!variantIds.has(decision.variantId) || !reviewedVariant) {
      validationErrors.push(
        `Human module override decision сочи към липсващ offer variant: ${decision.variantId}`,
      )
      valid = false
    }
    if (!moduleIds.has(decision.moduleId)) {
      validationErrors.push(
        `Human module override decision сочи към липсващ module: ${decision.moduleId}`,
      )
      valid = false
    }
    if (reviewedVariant && !reviewedVariant.appliesModuleIds.includes(decision.moduleId)) {
      validationErrors.push(
        `Module ${decision.moduleId} няма човешки потвърдена APPLIES приложимост за variant ${decision.variantId}.`,
      )
      valid = false
    }
    if (!decision.value.trim()) {
      validationErrors.push(
        `Human module override decision ${decision.id || '(без id)'} изисква непразна стойност.`,
      )
      valid = false
    }
    if (decision.evidenceRefs.length === 0) {
      validationErrors.push(
        `Human module override decision ${decision.id || '(без id)'} изисква поне един evidence ref.`,
      )
      valid = false
    }
    if (distinct(decision.evidenceRefs).length !== decision.evidenceRefs.length) {
      validationErrors.push(
        `Human module override decision ${decision.id || '(без id)'} съдържа повтарящи се evidence refs.`,
      )
      valid = false
    }
    for (const evidenceRef of decision.evidenceRefs) {
      if (!evidenceIds.has(evidenceRef)) {
        validationErrors.push(
          `Human module override decision ${decision.id || '(без id)'} сочи към липсващ evidence ref: ${evidenceRef}`,
        )
        valid = false
      }
    }
    if (!decision.reviewerId.trim()) {
      validationErrors.push(
        `Human module override decision ${decision.id || '(без id)'} изисква reviewerId.`,
      )
      valid = false
    }
    if (!isValidTimestamp(decision.reviewedAt)) {
      validationErrors.push(
        `Human module override decision ${decision.id || '(без id)'} изисква валиден reviewedAt timestamp.`,
      )
      valid = false
    }

    if (valid) {
      acceptedDecisions.push({
        ...decision,
        value: decision.value.trim(),
        evidenceRefs: [...decision.evidenceRefs],
      })
    }
  }

  const grouped = new Map<string, NadezhdaHumanModuleOverrideDecision[]>()
  for (const decision of acceptedDecisions) {
    const key = keyFor(decision)
    const entries = grouped.get(key) ?? []
    entries.push(decision)
    grouped.set(key, entries)
  }

  const overrides: NadezhdaReviewedModuleOverride[] = [...grouped.values()].map((entries) => {
    const values = distinct(entries.map((entry) => entry.value))
    const conflict = values.length > 1

    return {
      variantId: entries[0]!.variantId,
      moduleId: entries[0]!.moduleId,
      field: entries[0]!.field,
      state: conflict ? 'CONFLICT_REVIEW_REQUIRED' : 'RESOLVED',
      value: conflict ? null : values[0]!,
      evidenceRefs: distinct(entries.flatMap((entry) => entry.evidenceRefs)),
      decisionIds: entries.map((entry) => entry.id),
    }
  })

  if (overrides.some((override) => override.state === 'CONFLICT_REVIEW_REQUIRED')) {
    warnings.push(
      'Има противоречиви човешки module-level override решения; автоматично last-write-wins не се прилага.',
    )
  }
  if (!applicability.readyForDownstreamHumanReviewedUse) {
    warnings.push(
      'Offer applicability не е напълно потвърдена; module-level overrides не могат да се считат за downstream-ready.',
    )
  }

  return {
    version: NADEZHDA_MODULE_OVERRIDE_REVIEW_VERSION,
    decisions: acceptedDecisions,
    overrides,
    validationErrors: distinct(validationErrors),
    warnings: distinct(warnings),
    readyForDownstreamHumanReviewedUse:
      validationErrors.length === 0
      && applicability.readyForDownstreamHumanReviewedUse
      && overrides.every((override) => override.state === 'RESOLVED'),
    safety,
  }
}
