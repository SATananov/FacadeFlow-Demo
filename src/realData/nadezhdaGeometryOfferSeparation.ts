import type { NadezhdaDocumentPatternExtractionResult } from './nadezhdaDocumentPatternExtractor'
import type { NadezhdaProjectPatternDraft } from './nadezhdaProjectPatternSchema'

export const NADEZHDA_GEOMETRY_OFFER_SEPARATION_VERSION = 'REALDATA02.5' as const

export type NadezhdaGeometryOfferSeparationState =
  | 'NO_GEOMETRY'
  | 'PROJECT_GEOMETRY_ONLY'
  | 'EXPLICIT_SHARED_PROJECT_GEOMETRY'
  | 'VARIANT_SCOPED_GEOMETRY'
  | 'MIXED_SCOPES_REVIEW_REQUIRED'

export type NadezhdaSharedGeometryApplicability =
  | 'NOT_APPLICABLE'
  | 'REQUIRES_HUMAN_CONFIRMATION'

export interface NadezhdaOfferGeometryApplicability {
  variantId: string
  explicitModuleIds: string[]
  sharedProjectGeometryApplicability: NadezhdaSharedGeometryApplicability
}

export interface NadezhdaGeometryOfferSeparationSafety {
  sourceEvidenceOnly: true
  geometryOwnershipInferenceAllowed: false
  variantApplicabilityInferenceAllowed: false
  automaticModuleDuplicationAllowed: false
  automaticModuleMergeAllowed: false
  automaticReuseAllowed: false
  createsLifecycleProject: false
  productionLocked: true
  machineReady: false
  productionApproved: false
}

export interface NadezhdaGeometryOfferSeparationResult {
  version: typeof NADEZHDA_GEOMETRY_OFFER_SEPARATION_VERSION
  state: NadezhdaGeometryOfferSeparationState
  specificationEvidenceRefs: string[]
  projectGeometryModuleIds: string[]
  variantScopedModuleIds: string[]
  crossVariantModuleIds: string[]
  variants: NadezhdaOfferGeometryApplicability[]
  warnings: string[]
  safety: NadezhdaGeometryOfferSeparationSafety
}

const safety: NadezhdaGeometryOfferSeparationSafety = Object.freeze({
  sourceEvidenceOnly: true,
  geometryOwnershipInferenceAllowed: false,
  variantApplicabilityInferenceAllowed: false,
  automaticModuleDuplicationAllowed: false,
  automaticModuleMergeAllowed: false,
  automaticReuseAllowed: false,
  createsLifecycleProject: false,
  productionLocked: true,
  machineReady: false,
  productionApproved: false,
})

function distinct(values: string[]): string[] {
  return [...new Set(values)]
}

export function analyzeNadezhdaGeometryOfferSeparation(
  extraction: NadezhdaDocumentPatternExtractionResult,
  draft: NadezhdaProjectPatternDraft,
): NadezhdaGeometryOfferSeparationResult {
  const specificationEvidenceRefs = extraction.candidates
    .filter((candidate) => candidate.kind === 'SPECIFICATION_SECTION')
    .map((candidate) => candidate.evidence.id)

  const moduleToVariants = new Map<string, Set<string>>()
  const variants = draft.offerVariants.map((variant) => {
    const explicitModuleIds = distinct(variant.productGroups.flatMap((group) => group.moduleIds))
    for (const moduleId of explicitModuleIds) {
      const owners = moduleToVariants.get(moduleId) ?? new Set<string>()
      owners.add(variant.id)
      moduleToVariants.set(moduleId, owners)
    }
    return { variantId: variant.id, explicitModuleIds }
  })

  const allModuleIds = draft.modules.map((module) => module.id)
  const variantScopedModuleIds = distinct([...moduleToVariants.keys()])
  const projectGeometryModuleIds = allModuleIds.filter((moduleId) => !moduleToVariants.has(moduleId))
  const crossVariantModuleIds = [...moduleToVariants.entries()]
    .filter(([, owners]) => owners.size > 1)
    .map(([moduleId]) => moduleId)

  const hasExplicitVariants = draft.offerVariants.some((variant) => variant.label.state === 'RESOLVED')
  const explicitVariantCount = draft.offerVariants.filter((variant) => variant.label.state === 'RESOLVED').length
  const hasSpecificationSection = specificationEvidenceRefs.length > 0

  let state: NadezhdaGeometryOfferSeparationState
  if (allModuleIds.length === 0) {
    state = 'NO_GEOMETRY'
  } else if (variantScopedModuleIds.length === 0) {
    state = hasSpecificationSection && explicitVariantCount > 1
      ? 'EXPLICIT_SHARED_PROJECT_GEOMETRY'
      : 'PROJECT_GEOMETRY_ONLY'
  } else if (projectGeometryModuleIds.length === 0 && crossVariantModuleIds.length === 0 && !(hasExplicitVariants && explicitVariantCount > 1 && !hasSpecificationSection)) {
    state = 'VARIANT_SCOPED_GEOMETRY'
  } else {
    state = 'MIXED_SCOPES_REVIEW_REQUIRED'
  }

  const sharedProjectGeometryApplicability: NadezhdaSharedGeometryApplicability =
    state === 'EXPLICIT_SHARED_PROJECT_GEOMETRY'
      ? 'REQUIRES_HUMAN_CONFIRMATION'
      : 'NOT_APPLICABLE'

  const warnings: string[] = []
  if (state === 'EXPLICIT_SHARED_PROJECT_GEOMETRY') {
    warnings.push('Явна секция „Спецификация“ отделя проектната геометрия от офертните варианти; приложимостта на вариантите към общата геометрия изисква човешко потвърждение.')
  }
  if (state === 'MIXED_SCOPES_REVIEW_REQUIRED') {
    warnings.push('Геометрията и офертните варианти имат смесен или неявен scope; системата не прехвърля и не дублира модули автоматично.')
  }
  if (crossVariantModuleIds.length > 0) {
    warnings.push('Един или повече модули са изрично реферирани от повече от един вариант; това остава за човешки преглед.')
  }

  return {
    version: NADEZHDA_GEOMETRY_OFFER_SEPARATION_VERSION,
    state,
    specificationEvidenceRefs,
    projectGeometryModuleIds,
    variantScopedModuleIds,
    crossVariantModuleIds,
    variants: variants.map((variant) => ({
      ...variant,
      sharedProjectGeometryApplicability,
    })),
    warnings,
    safety,
  }
}
