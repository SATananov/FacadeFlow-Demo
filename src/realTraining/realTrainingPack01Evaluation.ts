import { extractNadezhdaDocumentPatterns } from '../realData/nadezhdaDocumentPatternExtractor'
import { bridgeNadezhdaExtractionToProjectDraft } from '../realData/nadezhdaProjectDraftBridge'
import type { NadezhdaProjectMaterialKind } from '../realData/nadezhdaProjectPatternSchema'
import type { FacadeFlowRealTrainingOfferPatternFamily } from './realTrainingPack01'

export const FACADEFLOW_REAL_TRAINING_PACK_01_EVALUATION_VERSION = 'REAL_TRAINING_PACK_01_EVAL' as const

export interface FacadeFlowRealTrainingOfferExpectation {
  moduleCount: number
  variantCount: number
  totalProductGroupCount: number
  materials?: readonly string[]
  floorPlacementLabels?: readonly string[]
}

export interface FacadeFlowRealTrainingOfferEvaluationInput {
  id: string
  patternFamily: FacadeFlowRealTrainingOfferPatternFamily
  sourceReference: string
  sourceText: string
  expectation: FacadeFlowRealTrainingOfferExpectation
}

export interface FacadeFlowRealTrainingOfferEvaluationResult {
  version: typeof FACADEFLOW_REAL_TRAINING_PACK_01_EVALUATION_VERSION
  id: string
  patternFamily: FacadeFlowRealTrainingOfferPatternFamily
  passed: boolean
  failures: readonly string[]
  observed: {
    moduleCount: number
    variantCount: number
    totalProductGroupCount: number
    materials: readonly (NadezhdaProjectMaterialKind | null)[]
    floorPlacementLabels: readonly string[]
  }
  sourceEvidenceOnly: true
  humanReviewRequired: true
  automaticTrainingPromotionAllowed: false
  machineReady: false
  productionApproved: false
}

export function evaluateFacadeFlowRealTrainingOfferPattern(
  input: FacadeFlowRealTrainingOfferEvaluationInput,
): FacadeFlowRealTrainingOfferEvaluationResult {
  const extraction = extractNadezhdaDocumentPatterns({
    sourceId: `rtp01-${input.id}`,
    sourceKind: 'DOCX',
    sourceReference: input.sourceReference,
    text: input.sourceText,
  })
  const bridge = bridgeNadezhdaExtractionToProjectDraft(extraction, `rtp01-draft-${input.id}`)
  const groups = bridge.draft.offerVariants.flatMap((variant) => variant.productGroups)
  const materials = groups.map((group) => group.material.value)
  const floorPlacementLabels = [...new Set(
    bridge.draft.modules
      .flatMap((module) => module.placement.map((placement) => placement.label.value))
      .filter((value): value is string => Boolean(value)),
  )]
  const failures: string[] = []

  if (bridge.draft.modules.length !== input.expectation.moduleCount) failures.push(`moduleCount ${bridge.draft.modules.length} != ${input.expectation.moduleCount}`)
  if (bridge.draft.offerVariants.length !== input.expectation.variantCount) failures.push(`variantCount ${bridge.draft.offerVariants.length} != ${input.expectation.variantCount}`)
  if (groups.length !== input.expectation.totalProductGroupCount) failures.push(`productGroupCount ${groups.length} != ${input.expectation.totalProductGroupCount}`)
  if (input.expectation.materials && JSON.stringify(materials) !== JSON.stringify(input.expectation.materials)) failures.push(`materials ${JSON.stringify(materials)} != ${JSON.stringify(input.expectation.materials)}`)
  if (input.expectation.floorPlacementLabels && JSON.stringify(floorPlacementLabels) !== JSON.stringify(input.expectation.floorPlacementLabels)) failures.push(`floors ${JSON.stringify(floorPlacementLabels)} != ${JSON.stringify(input.expectation.floorPlacementLabels)}`)

  return Object.freeze({
    version: FACADEFLOW_REAL_TRAINING_PACK_01_EVALUATION_VERSION,
    id: input.id,
    patternFamily: input.patternFamily,
    passed: failures.length === 0,
    failures: Object.freeze(failures),
    observed: Object.freeze({
      moduleCount: bridge.draft.modules.length,
      variantCount: bridge.draft.offerVariants.length,
      totalProductGroupCount: groups.length,
      materials: Object.freeze(materials),
      floorPlacementLabels: Object.freeze(floorPlacementLabels),
    }),
    sourceEvidenceOnly: true,
    humanReviewRequired: true,
    automaticTrainingPromotionAllowed: false,
    machineReady: false,
    productionApproved: false,
  })
}
