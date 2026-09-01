import type {
  ReviewedScenarioEvidenceQueryResult,
  ReviewedScenarioEvidenceReference,
} from './skyGlazingReviewedScenarioEvidenceQuery'

export const REVIEWED_EVIDENCE_READ_MODEL =
  'REVIEWED_EVIDENCE_READ_MODEL' as const
export const RP01_18_READ_MODEL_VERSION =
  'RP01.18-SAFE-CONSUMER-PROJECTION-V1' as const

export type ReviewedEvidenceReadModelState =
  | 'AVAILABLE_FOR_READ_ONLY_CONSUMER'
  | 'UNAVAILABLE'

export type ReviewedEvidenceReadModelUnavailableReason =
  | 'QUERY_HAS_NO_REVIEWED_EVIDENCE'
  | 'QUERY_NOT_EXACT_SCOPE'
  | 'QUERY_EVIDENCE_REFERENCE_MISSING'

export interface ReviewedEvidenceConsumerProjection {
  evidenceNature: 'HUMAN_REVIEWED_SIMULATION_EVIDENCE'
  evidenceScope: 'EXACT_REVIEWED_SCENARIO_ONLY'
  scenarioIdentityJson: string
  boundaryId: string
  crossScenarioEvidenceGroupId: string
  scenarioConsistencyReviewRecordId: string
  repeatabilityGroupId: string
  repeatabilityReviewRecordId: string
  repeatabilityEvidenceFingerprint: string
  repeatabilityReviewFingerprint: string
  observedSimulationResults: readonly boolean[]
  expectedSimulationResults: readonly boolean[]
  resultInterpretation: 'HISTORICAL_REVIEWED_SIMULATION_RESULTS'
  readOnly: true
  displayAsReviewedEvidenceOnly: true
  usableAsCurrentScenarioPrediction: false
  automaticOutcomeInferenceAllowed: false
  scenarioGeneralizationAllowed: false
  inferenceBeyondReviewedScenariosAllowed: false
  engineeringAuthorityGranted: false
  productionAuthorityGranted: false
}

export interface ReviewedEvidenceReadModel {
  readModelType: typeof REVIEWED_EVIDENCE_READ_MODEL
  readModelVersion: typeof RP01_18_READ_MODEL_VERSION
  state: ReviewedEvidenceReadModelState
  reasons: readonly ReviewedEvidenceReadModelUnavailableReason[]
  scenarioIdentityJson: string
  exactScopeMatch: boolean
  reviewedEvidenceAvailable: boolean
  consumerProjection: ReviewedEvidenceConsumerProjection | null
  consumerMode: 'READ_ONLY_EVIDENCE_PROJECTION'
  mayDisplayReviewedEvidenceReference: boolean
  mayExposeReviewedEvidenceToAiContext: boolean
  aiContextMayTreatEvidenceAsPrediction: false
  automaticOutcomeInferenceAllowed: false
  inferredOutcome: null
  scenarioGeneralizationAllowed: false
  inferenceBeyondReviewedScenariosAllowed: false
  engineeringRuleValidated: false
  automaticRulePromotionAllowed: false
  productionExecutable: false
  machineInstructionGenerated: false
  productionRuleCreated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

function projectReference(
  reference: ReviewedScenarioEvidenceReference,
): ReviewedEvidenceConsumerProjection {
  return Object.freeze({
    evidenceNature: 'HUMAN_REVIEWED_SIMULATION_EVIDENCE',
    evidenceScope: 'EXACT_REVIEWED_SCENARIO_ONLY',
    scenarioIdentityJson: reference.scenarioIdentityJson,
    boundaryId: reference.boundaryId,
    crossScenarioEvidenceGroupId:
      reference.crossScenarioEvidenceGroupId,
    scenarioConsistencyReviewRecordId:
      reference.scenarioConsistencyReviewRecordId,
    repeatabilityGroupId: reference.repeatabilityGroupId,
    repeatabilityReviewRecordId:
      reference.repeatabilityReviewRecordId,
    repeatabilityEvidenceFingerprint:
      reference.repeatabilityEvidenceFingerprint,
    repeatabilityReviewFingerprint:
      reference.repeatabilityReviewFingerprint,
    observedSimulationResults:
      Object.freeze([...reference.observedResults]),
    expectedSimulationResults:
      Object.freeze([...reference.expectedResults]),
    resultInterpretation:
      'HISTORICAL_REVIEWED_SIMULATION_RESULTS',
    readOnly: true,
    displayAsReviewedEvidenceOnly: true,
    usableAsCurrentScenarioPrediction: false,
    automaticOutcomeInferenceAllowed: false,
    scenarioGeneralizationAllowed: false,
    inferenceBeyondReviewedScenariosAllowed: false,
    engineeringAuthorityGranted: false,
    productionAuthorityGranted: false,
  })
}

export function buildReviewedEvidenceReadModel(
  query: ReviewedScenarioEvidenceQueryResult,
): ReviewedEvidenceReadModel {
  const reasons: ReviewedEvidenceReadModelUnavailableReason[] = []

  if (query.status !== 'EVIDENCE_REFERENCE_AVAILABLE') {
    reasons.push('QUERY_HAS_NO_REVIEWED_EVIDENCE')
  }

  if (!query.exactScopeMatch) {
    reasons.push('QUERY_NOT_EXACT_SCOPE')
  }

  if (query.evidenceReference === null) {
    reasons.push('QUERY_EVIDENCE_REFERENCE_MISSING')
  }

  const available = reasons.length === 0
  const consumerProjection =
    available && query.evidenceReference
      ? projectReference(query.evidenceReference)
      : null

  return Object.freeze({
    readModelType: REVIEWED_EVIDENCE_READ_MODEL,
    readModelVersion: RP01_18_READ_MODEL_VERSION,
    state: available
      ? 'AVAILABLE_FOR_READ_ONLY_CONSUMER'
      : 'UNAVAILABLE',
    reasons: Object.freeze(reasons),
    scenarioIdentityJson: query.scenarioIdentityJson,
    exactScopeMatch: available,
    reviewedEvidenceAvailable: available,
    consumerProjection,
    consumerMode: 'READ_ONLY_EVIDENCE_PROJECTION',
    mayDisplayReviewedEvidenceReference: available,
    mayExposeReviewedEvidenceToAiContext: available,
    aiContextMayTreatEvidenceAsPrediction: false,
    automaticOutcomeInferenceAllowed: false,
    inferredOutcome: null,
    scenarioGeneralizationAllowed: false,
    inferenceBeyondReviewedScenariosAllowed: false,
    engineeringRuleValidated: false,
    automaticRulePromotionAllowed: false,
    productionExecutable: false,
    machineInstructionGenerated: false,
    productionRuleCreated: false,
    productionUnlockAllowed: false,
    machineReady: false,
    productionApproved: false,
  })
}
