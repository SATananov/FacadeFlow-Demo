import type { NadezhdaGeometryOfferSeparationResult } from './nadezhdaGeometryOfferSeparation'
import type { NadezhdaProjectPatternDraft } from './nadezhdaProjectPatternSchema'

export const NADEZHDA_HUMAN_OFFER_APPLICABILITY_VERSION = 'REALDATA02.6' as const

export type NadezhdaHumanOfferApplicabilityDecisionValue = 'APPLIES' | 'DOES_NOT_APPLY'
export type NadezhdaHumanOfferApplicabilityDecisionScope = 'SHARED_PROJECT_GEOMETRY' | 'MODULE_SUBSET'

export interface NadezhdaHumanOfferApplicabilityDecision {
  id: string
  variantId: string
  decision: NadezhdaHumanOfferApplicabilityDecisionValue
  scope: NadezhdaHumanOfferApplicabilityDecisionScope
  moduleIds: string[]
  reviewerId: string
  reviewedAt: string
  note: string
}

export type NadezhdaReviewedVariantApplicabilityState =
  | 'NOT_APPLICABLE'
  | 'NOT_REVIEWED'
  | 'PARTIALLY_REVIEWED'
  | 'CONFIRMED_APPLIES'
  | 'CONFIRMED_DOES_NOT_APPLY'
  | 'CONFIRMED_MIXED_SCOPE'
  | 'CONFLICT_REVIEW_REQUIRED'

export interface NadezhdaReviewedVariantApplicability {
  variantId: string
  state: NadezhdaReviewedVariantApplicabilityState
  appliesModuleIds: string[]
  doesNotApplyModuleIds: string[]
  conflictingModuleIds: string[]
  unreviewedModuleIds: string[]
  decisionIds: string[]
}

export interface NadezhdaHumanOfferApplicabilitySafety {
  humanDecisionRequired: true
  automaticApplicabilityInferenceAllowed: false
  automaticOfferSelectionAllowed: false
  automaticModuleDuplicationAllowed: false
  automaticModuleMergeAllowed: false
  mutatesSourceDraft: false
  createsLifecycleProject: false
  automaticReuseAllowed: false
  productionLocked: true
  machineReady: false
  productionApproved: false
}

export interface NadezhdaHumanOfferApplicabilityResult {
  version: typeof NADEZHDA_HUMAN_OFFER_APPLICABILITY_VERSION
  decisions: NadezhdaHumanOfferApplicabilityDecision[]
  variants: NadezhdaReviewedVariantApplicability[]
  validationErrors: string[]
  warnings: string[]
  readyForDownstreamHumanReviewedUse: boolean
  safety: NadezhdaHumanOfferApplicabilitySafety
}

const safety: NadezhdaHumanOfferApplicabilitySafety = Object.freeze({
  humanDecisionRequired: true,
  automaticApplicabilityInferenceAllowed: false,
  automaticOfferSelectionAllowed: false,
  automaticModuleDuplicationAllowed: false,
  automaticModuleMergeAllowed: false,
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

function decisionTargetModuleIds(
  decision: NadezhdaHumanOfferApplicabilityDecision,
  sharedModuleIds: string[],
): string[] {
  return decision.scope === 'SHARED_PROJECT_GEOMETRY'
    ? [...sharedModuleIds]
    : distinct(decision.moduleIds)
}

function stateForVariant(
  applicable: boolean,
  sharedModuleIds: string[],
  appliesModuleIds: string[],
  doesNotApplyModuleIds: string[],
  conflictingModuleIds: string[],
): NadezhdaReviewedVariantApplicabilityState {
  if (!applicable) return 'NOT_APPLICABLE'
  if (sharedModuleIds.length === 0) return 'NOT_REVIEWED'
  if (conflictingModuleIds.length > 0) return 'CONFLICT_REVIEW_REQUIRED'

  const reviewed = new Set([...appliesModuleIds, ...doesNotApplyModuleIds])
  if (reviewed.size === 0) return 'NOT_REVIEWED'
  if (reviewed.size < sharedModuleIds.length) return 'PARTIALLY_REVIEWED'
  if (appliesModuleIds.length === sharedModuleIds.length) return 'CONFIRMED_APPLIES'
  if (doesNotApplyModuleIds.length === sharedModuleIds.length) return 'CONFIRMED_DOES_NOT_APPLY'
  return 'CONFIRMED_MIXED_SCOPE'
}

export function reviewNadezhdaOfferApplicability(
  separation: NadezhdaGeometryOfferSeparationResult,
  draft: NadezhdaProjectPatternDraft,
  decisions: NadezhdaHumanOfferApplicabilityDecision[],
): NadezhdaHumanOfferApplicabilityResult {
  const validationErrors: string[] = []
  const warnings: string[] = []
  const draftVariantIds = new Set(draft.offerVariants.map((variant) => variant.id))
  const separationVariants = new Map(separation.variants.map((variant) => [variant.variantId, variant]))
  const sharedModuleIds = [...separation.projectGeometryModuleIds]
  const sharedModuleIdSet = new Set(sharedModuleIds)

  const duplicateDecisionIds = decisions
    .map((decision) => decision.id)
    .filter((id, index, values) => values.indexOf(id) !== index)
  for (const id of distinct(duplicateDecisionIds)) {
    validationErrors.push(`Повтарящ се human applicability decision id: ${id}`)
  }

  const acceptedDecisions: NadezhdaHumanOfferApplicabilityDecision[] = []

  for (const decision of decisions) {
    let valid = true
    const separatedVariant = separationVariants.get(decision.variantId)

    if (!decision.id.trim()) {
      validationErrors.push('Human applicability decision изисква непразен id.')
      valid = false
    }
    if (!draftVariantIds.has(decision.variantId) || !separatedVariant) {
      validationErrors.push(`Human applicability decision сочи към липсващ offer variant: ${decision.variantId}`)
      valid = false
    } else if (separatedVariant.sharedProjectGeometryApplicability !== 'REQUIRES_HUMAN_CONFIRMATION') {
      validationErrors.push(`Offer variant ${decision.variantId} няма shared geometry applicability за човешко потвърждение.`)
      valid = false
    }
    if (!decision.reviewerId.trim()) {
      validationErrors.push(`Human applicability decision ${decision.id || '(без id)'} изисква reviewerId.`)
      valid = false
    }
    if (!isValidTimestamp(decision.reviewedAt)) {
      validationErrors.push(`Human applicability decision ${decision.id || '(без id)'} изисква валиден reviewedAt timestamp.`)
      valid = false
    }
    if (decision.scope === 'SHARED_PROJECT_GEOMETRY' && decision.moduleIds.length > 0) {
      validationErrors.push(`Decision ${decision.id || '(без id)'} със scope SHARED_PROJECT_GEOMETRY не трябва да носи moduleIds.`)
      valid = false
    }
    if (decision.scope === 'MODULE_SUBSET' && decision.moduleIds.length === 0) {
      validationErrors.push(`Decision ${decision.id || '(без id)'} със scope MODULE_SUBSET изисква поне един module id.`)
      valid = false
    }
    if (decision.scope === 'MODULE_SUBSET' && distinct(decision.moduleIds).length !== decision.moduleIds.length) {
      validationErrors.push(`Decision ${decision.id || '(без id)'} съдържа повтарящи се module ids.`)
      valid = false
    }
    if (decision.scope === 'MODULE_SUBSET') {
      for (const moduleId of decision.moduleIds) {
        if (!sharedModuleIdSet.has(moduleId)) {
          validationErrors.push(`Decision ${decision.id || '(без id)'} сочи към module ${moduleId}, който не принадлежи към shared project geometry.`)
          valid = false
        }
      }
    }

    if (valid) acceptedDecisions.push({ ...decision, moduleIds: [...decision.moduleIds] })
  }

  const variants: NadezhdaReviewedVariantApplicability[] = separation.variants.map((variant) => {
    const requiresHumanConfirmation = variant.sharedProjectGeometryApplicability === 'REQUIRES_HUMAN_CONFIRMATION'
    const relevantDecisions = acceptedDecisions.filter((decision) => decision.variantId === variant.variantId)
    const perModule = new Map<string, Set<NadezhdaHumanOfferApplicabilityDecisionValue>>()

    for (const decision of relevantDecisions) {
      for (const moduleId of decisionTargetModuleIds(decision, sharedModuleIds)) {
        const values = perModule.get(moduleId) ?? new Set<NadezhdaHumanOfferApplicabilityDecisionValue>()
        values.add(decision.decision)
        perModule.set(moduleId, values)
      }
    }

    const conflictingModuleIds = sharedModuleIds.filter((moduleId) => (perModule.get(moduleId)?.size ?? 0) > 1)
    const appliesModuleIds = sharedModuleIds.filter((moduleId) => {
      const values = perModule.get(moduleId)
      return values?.size === 1 && values.has('APPLIES')
    })
    const doesNotApplyModuleIds = sharedModuleIds.filter((moduleId) => {
      const values = perModule.get(moduleId)
      return values?.size === 1 && values.has('DOES_NOT_APPLY')
    })
    const reviewedIds = new Set([...appliesModuleIds, ...doesNotApplyModuleIds, ...conflictingModuleIds])
    const unreviewedModuleIds = sharedModuleIds.filter((moduleId) => !reviewedIds.has(moduleId))

    return {
      variantId: variant.variantId,
      state: stateForVariant(
        requiresHumanConfirmation,
        sharedModuleIds,
        appliesModuleIds,
        doesNotApplyModuleIds,
        conflictingModuleIds,
      ),
      appliesModuleIds,
      doesNotApplyModuleIds,
      conflictingModuleIds,
      unreviewedModuleIds,
      decisionIds: relevantDecisions.map((decision) => decision.id),
    }
  })

  if (variants.some((variant) => variant.state === 'CONFLICT_REVIEW_REQUIRED')) {
    warnings.push('Има противоречиви човешки решения за приложимост върху един или повече модули; автоматично последно-решение не се прилага.')
  }
  if (variants.some((variant) => variant.state === 'PARTIALLY_REVIEWED')) {
    warnings.push('Има частично прегледана приложимост; непотвърдените модули остават без решение.')
  }
  if (separation.state === 'MIXED_SCOPES_REVIEW_REQUIRED') {
    warnings.push('REAL DATA 02.6 не разрешава неявен mixed scope; първо е необходима ясна geometry/offer separation.')
  }

  const requiresReview = variants.filter((variant) => variant.state !== 'NOT_APPLICABLE')
  const readyForDownstreamHumanReviewedUse = validationErrors.length === 0
    && requiresReview.length > 0
    && requiresReview.every((variant) =>
      variant.state === 'CONFIRMED_APPLIES'
      || variant.state === 'CONFIRMED_DOES_NOT_APPLY'
      || variant.state === 'CONFIRMED_MIXED_SCOPE')

  return {
    version: NADEZHDA_HUMAN_OFFER_APPLICABILITY_VERSION,
    decisions: acceptedDecisions,
    variants,
    validationErrors: distinct(validationErrors),
    warnings: distinct(warnings),
    readyForDownstreamHumanReviewedUse,
    safety,
  }
}
