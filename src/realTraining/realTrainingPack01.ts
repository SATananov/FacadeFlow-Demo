export const FACADEFLOW_REAL_TRAINING_PACK_01_VERSION = 'REAL_TRAINING_PACK_01' as const

export type FacadeFlowRealTrainingOfferPatternFamily =
  | 'MIXED_PRODUCT_GROUPS'
  | 'FLOOR_HIERARCHY'
  | 'ALTERNATIVE_VARIANTS_SHARED_GEOMETRY'
  | 'MULTI_BASIS_PRICING'
  | 'MULTIPLE_OFFER_VARIANTS'
  | 'MULTI_SYSTEM_VARIANT_AND_COMMERCIAL_SECTIONS'
  | 'MIXED_GROUPS_WITH_PRE_MODULE_ATTRIBUTE'

export type FacadeFlowRealTrainingSourceKind =
  | 'ANONYMIZED_OFFER_PATTERN'
  | 'PROFILE_CATALOGUE'
  | 'DWG_EVIDENCE'
  | 'HUMAN_SKETCH_REVIEW'

export type FacadeFlowRealTrainingEvidenceState =
  | 'ANONYMIZED_REGRESSION_READY'
  | 'REFERENCE_ONLY'
  | 'PENDING_HUMAN_CONFIRMATION'

export type FacadeFlowRealTrainingStage =
  | 'DOCUMENT_STRUCTURE'
  | 'CONSTRUCTION_SEMANTICS'
  | 'PROFILE_KNOWLEDGE'
  | 'HUMAN_CONFIRMATION'

export interface FacadeFlowRealTrainingSource {
  id: string
  sourceKind: FacadeFlowRealTrainingSourceKind
  evidenceState: FacadeFlowRealTrainingEvidenceState
  offerPatternFamily?: FacadeFlowRealTrainingOfferPatternFamily
  exactLocalSha256?: string
  localEvidencePath?: string
  stages: readonly FacadeFlowRealTrainingStage[]
  trackedRawPrivateTextAllowed: false
  containsClientIdentityInTrackedFixture: false
  groundTruthAutomatically: false
  humanConfirmationRequiredForGroundTruth: true
  machineReady: false
  productionApproved: false
}

const offer = (
  id: string,
  offerPatternFamily: FacadeFlowRealTrainingOfferPatternFamily,
): FacadeFlowRealTrainingSource => Object.freeze({
  id,
  sourceKind: 'ANONYMIZED_OFFER_PATTERN' as const,
  evidenceState: 'ANONYMIZED_REGRESSION_READY' as const,
  offerPatternFamily,
  stages: Object.freeze(['DOCUMENT_STRUCTURE'] as const),
  trackedRawPrivateTextAllowed: false as const,
  containsClientIdentityInTrackedFixture: false as const,
  groundTruthAutomatically: false as const,
  humanConfirmationRequiredForGroundTruth: true as const,
  machineReady: false as const,
  productionApproved: false as const,
})

/**
 * Master Training Pack 01 intentionally stores no original client offer text.
 * The seven offer entries point to the already anonymized Golden Pattern families.
 * Exact hashes are kept only for the two local technical evidence files already
 * present in the working checkpoint.
 */
export const FACADEFLOW_REAL_TRAINING_PACK_01_SOURCES: readonly FacadeFlowRealTrainingSource[] = Object.freeze([
  offer('RTP01-OFFER-A', 'MIXED_PRODUCT_GROUPS'),
  offer('RTP01-OFFER-B', 'FLOOR_HIERARCHY'),
  offer('RTP01-OFFER-C', 'ALTERNATIVE_VARIANTS_SHARED_GEOMETRY'),
  offer('RTP01-OFFER-D', 'MULTI_BASIS_PRICING'),
  offer('RTP01-OFFER-E', 'MULTIPLE_OFFER_VARIANTS'),
  offer('RTP01-OFFER-F', 'MULTI_SYSTEM_VARIANT_AND_COMMERCIAL_SECTIONS'),
  offer('RTP01-OFFER-G', 'MIXED_GROUPS_WITH_PRE_MODULE_ATTRIBUTE'),
  Object.freeze({
    id: 'RTP01-PRELUDE-CATALOGUE',
    sourceKind: 'PROFILE_CATALOGUE' as const,
    evidenceState: 'REFERENCE_ONLY' as const,
    exactLocalSha256: '1ba9174b1cf3974b4de171b57147dd4fad41d81958ea62d08b977223c5200f5f',
    localEvidencePath: 'tools/ai_training/input/catalogues/PVC Prelude_bg.pdf',
    stages: Object.freeze(['PROFILE_KNOWLEDGE'] as const),
    trackedRawPrivateTextAllowed: false as const,
    containsClientIdentityInTrackedFixture: false as const,
    groundTruthAutomatically: false as const,
    humanConfirmationRequiredForGroundTruth: true as const,
    machineReady: false as const,
    productionApproved: false as const,
  }),
  Object.freeze({
    id: 'RTP01-DWG-EVIDENCE',
    sourceKind: 'DWG_EVIDENCE' as const,
    evidenceState: 'REFERENCE_ONLY' as const,
    exactLocalSha256: 'df6d1ecf0fde9cfb841fa6a4ae563979aa62be754f37197241e7005dfa8f44d8',
    localEvidencePath: 'local-samples/phase05a/DOGRAMA - Пещерско(1).dwg',
    stages: Object.freeze(['CONSTRUCTION_SEMANTICS', 'HUMAN_CONFIRMATION'] as const),
    trackedRawPrivateTextAllowed: false as const,
    containsClientIdentityInTrackedFixture: false as const,
    groundTruthAutomatically: false as const,
    humanConfirmationRequiredForGroundTruth: true as const,
    machineReady: false as const,
    productionApproved: false as const,
  }),
  Object.freeze({
    id: 'RTP01-HUMAN-SKETCH-REV-A',
    sourceKind: 'HUMAN_SKETCH_REVIEW' as const,
    evidenceState: 'PENDING_HUMAN_CONFIRMATION' as const,
    stages: Object.freeze(['CONSTRUCTION_SEMANTICS', 'HUMAN_CONFIRMATION'] as const),
    trackedRawPrivateTextAllowed: false as const,
    containsClientIdentityInTrackedFixture: false as const,
    groundTruthAutomatically: false as const,
    humanConfirmationRequiredForGroundTruth: true as const,
    machineReady: false as const,
    productionApproved: false as const,
  }),
])

export function facadeFlowRealTrainingSourcesForStage(stage: FacadeFlowRealTrainingStage): FacadeFlowRealTrainingSource[] {
  return FACADEFLOW_REAL_TRAINING_PACK_01_SOURCES.filter((source) => source.stages.includes(stage))
}

export function canPromoteFacadeFlowRealTrainingSourceToGroundTruth(source: FacadeFlowRealTrainingSource): false {
  void source
  return false
}

export const FACADEFLOW_REAL_TRAINING_PACK_01_SAFETY = Object.freeze({
  privateOfferOriginalsTracked: false,
  rawPrivateTextAllowedInRegression: false,
  clientIdentityAllowedInRegression: false,
  pendingHumanSketchMayBecomeGroundTruthAutomatically: false,
  catalogueReferenceMayBecomeProductionTruthAutomatically: false,
  dwgEvidenceMayBecomeProductionTruthAutomatically: false,
  automaticModelWeightUpdateAllowed: false,
  automaticGeometryAllowed: false,
  rulesValidated: false,
  machineReady: false,
  productionApproved: false,
})
