import type {
  CrossScenarioConsistencyEvidenceGroup,
  HumanScenarioConsistencyReviewRecord,
} from './skyGlazingCrossScenarioConsistency'
import {
  assessReviewedScenarioCoverageBoundary,
  assessScenarioAgainstReviewedCoverage,
  type ReviewedScenarioCoverageBoundary,
  type ReviewedScenarioCoverageItem,
} from './skyGlazingReviewedScenarioCoverage'

export const REVIEWED_SCENARIO_EVIDENCE_QUERY_GATE =
  'REVIEWED_SCENARIO_EVIDENCE_QUERY_GATE' as const
export const RP01_17_QUERY_GATE_VERSION =
  'RP01.17-EXACT-SCOPE-QUERY-V1' as const

export type ReviewedScenarioEvidenceQueryStatus =
  | 'EVIDENCE_REFERENCE_AVAILABLE'
  | 'NO_REVIEWED_EVIDENCE'

export type ReviewedScenarioEvidenceQueryBlockReason =
  | 'COVERAGE_BOUNDARY_NOT_CURRENT'
  | 'SCENARIO_OUTSIDE_REVIEWED_SCOPE'

export interface ReviewedScenarioEvidenceReference {
  boundaryId: string
  crossScenarioEvidenceGroupId: string
  scenarioConsistencyReviewRecordId: string
  scenarioIdentityJson: string
  repeatabilityGroupId: string
  repeatabilityReviewRecordId: string
  repeatabilityEvidenceFingerprint: string
  repeatabilityReviewFingerprint: string
  observedResults: readonly boolean[]
  expectedResults: readonly boolean[]
  evidenceScope: 'EXACT_REVIEWED_SCENARIO_ONLY'
}

export interface ReviewedScenarioEvidenceQueryResult {
  queryGateType: typeof REVIEWED_SCENARIO_EVIDENCE_QUERY_GATE
  queryGateVersion: typeof RP01_17_QUERY_GATE_VERSION
  status: ReviewedScenarioEvidenceQueryStatus
  reasons: readonly ReviewedScenarioEvidenceQueryBlockReason[]
  scenarioIdentityJson: string
  exactScopeMatch: boolean
  evidenceReference: ReviewedScenarioEvidenceReference | null
  reviewedSimulationEvidenceReferenceAvailable: boolean
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

function evidenceReference(
  boundary: ReviewedScenarioCoverageBoundary,
  item: ReviewedScenarioCoverageItem,
): ReviewedScenarioEvidenceReference {
  return Object.freeze({
    boundaryId: boundary.id,
    crossScenarioEvidenceGroupId:
      boundary.crossScenarioEvidenceGroupId,
    scenarioConsistencyReviewRecordId:
      boundary.scenarioConsistencyReviewRecordId,
    scenarioIdentityJson: item.scenarioIdentityJson,
    repeatabilityGroupId: item.repeatabilityGroupId,
    repeatabilityReviewRecordId:
      item.repeatabilityReviewRecordId,
    repeatabilityEvidenceFingerprint:
      item.repeatabilityEvidenceFingerprint,
    repeatabilityReviewFingerprint:
      item.repeatabilityReviewFingerprint,
    observedResults: Object.freeze([...item.observedResults]),
    expectedResults: Object.freeze([...item.expectedResults]),
    evidenceScope: 'EXACT_REVIEWED_SCENARIO_ONLY',
  })
}

export function queryReviewedScenarioEvidence(
  boundary: ReviewedScenarioCoverageBoundary,
  currentGroup: CrossScenarioConsistencyEvidenceGroup,
  currentReview: HumanScenarioConsistencyReviewRecord,
  scenarioIdentityJson: string,
): ReviewedScenarioEvidenceQueryResult {
  const reasons: ReviewedScenarioEvidenceQueryBlockReason[] = []
  const boundaryAssessment =
    assessReviewedScenarioCoverageBoundary(
      boundary,
      currentGroup,
      currentReview,
    )

  if (
    boundaryAssessment.state !== 'CURRENT'
    || !boundaryAssessment.reviewedScenarioCoverageCurrentlyUsable
  ) {
    reasons.push('COVERAGE_BOUNDARY_NOT_CURRENT')
  }

  const membership =
    assessScenarioAgainstReviewedCoverage(
      boundary,
      scenarioIdentityJson,
    )

  if (
    membership.membership !== 'WITHIN_REVIEWED_SCENARIO_SCOPE'
    || membership.matchedCoverageItem === null
  ) {
    reasons.push('SCENARIO_OUTSIDE_REVIEWED_SCOPE')
  }

  const available = reasons.length === 0
  const reference =
    available && membership.matchedCoverageItem
      ? evidenceReference(
        boundary,
        membership.matchedCoverageItem,
      )
      : null

  return Object.freeze({
    queryGateType: REVIEWED_SCENARIO_EVIDENCE_QUERY_GATE,
    queryGateVersion: RP01_17_QUERY_GATE_VERSION,
    status: available
      ? 'EVIDENCE_REFERENCE_AVAILABLE'
      : 'NO_REVIEWED_EVIDENCE',
    reasons: Object.freeze(reasons),
    scenarioIdentityJson,
    exactScopeMatch: available,
    evidenceReference: reference,
    reviewedSimulationEvidenceReferenceAvailable: available,
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
