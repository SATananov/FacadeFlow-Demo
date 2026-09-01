import {
  assessHumanScenarioConsistencyReviewRecord,
  scenarioConsistencyEvidenceFingerprint,
  type CrossScenarioConsistencyEvidenceGroup,
  type HumanScenarioConsistencyReviewRecord,
} from './skyGlazingCrossScenarioConsistency'

export const REVIEWED_SCENARIO_COVERAGE_BOUNDARY =
  'REVIEWED_SCENARIO_COVERAGE_BOUNDARY' as const
export const RP01_16_SCENARIO_COVERAGE_FINGERPRINT_VERSION =
  'RP01.16-SCENARIO-COVERAGE-V1' as const

export type ReviewedScenarioCoverageBoundaryState =
  | 'BLOCKED'
  | 'DEFINED_FOR_REVIEWED_SCENARIOS'

export type ReviewedScenarioCoverageBoundaryBlockReason =
  | 'SCENARIO_CONSISTENCY_REVIEW_NOT_CURRENT'
  | 'SCENARIO_CONSISTENCY_NOT_CONFIRMED'
  | 'REVIEWED_SCENARIO_COUNT_BELOW_MINIMUM'

export type ReviewedScenarioCoverageBoundaryAssessmentState =
  | 'CURRENT'
  | 'STALE_REQUIRES_REVIEW'

export type ReviewedScenarioCoverageBoundaryInvalidationReason =
  | 'SCENARIO_CONSISTENCY_EVIDENCE_CHANGED'
  | 'SCENARIO_CONSISTENCY_REVIEW_CHANGED_OR_STALE'
  | 'SCENARIO_COVERAGE_NO_LONGER_DEFINED'

export type ScenarioCoverageMembership =
  | 'WITHIN_REVIEWED_SCENARIO_SCOPE'
  | 'OUTSIDE_REVIEWED_SCENARIO_SCOPE'

export interface ReviewedScenarioCoverageItem {
  scenarioIdentityJson: string
  repeatabilityGroupId: string
  repeatabilityReviewRecordId: string
  repeatabilityEvidenceFingerprint: string
  repeatabilityReviewFingerprint: string
  observedResults: readonly boolean[]
  expectedResults: readonly boolean[]
}

export interface ReviewedScenarioCoverageFingerprint {
  version: typeof RP01_16_SCENARIO_COVERAGE_FINGERPRINT_VERSION
  value: string
}

export interface ReviewedScenarioCoverageBoundary {
  id: string
  boundaryType: typeof REVIEWED_SCENARIO_COVERAGE_BOUNDARY
  crossScenarioEvidenceGroupId: string
  scenarioConsistencyReviewRecordId: string
  ruleIdentity: CrossScenarioConsistencyEvidenceGroup['ruleIdentity']
  state: ReviewedScenarioCoverageBoundaryState
  reasons: readonly ReviewedScenarioCoverageBoundaryBlockReason[]
  reviewedScenarioCount: number
  reviewedScenarioIdentityJson: readonly string[]
  coverage: readonly ReviewedScenarioCoverageItem[]
  coverageFingerprint: ReviewedScenarioCoverageFingerprint
  exactReviewedScenariosOnly: true
  simulationEvidenceScopeDefined: boolean
  simulationEvidenceMaySupportReviewedScenarioReference: boolean
  inferenceBeyondReviewedScenariosAllowed: false
  automaticScenarioGeneralizationAllowed: false
  engineeringRuleValidated: false
  automaticRulePromotionAllowed: false
  productionExecutable: false
  machineInstructionGenerated: false
  productionRuleCreated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

export interface ReviewedScenarioCoverageBoundaryAssessment {
  boundaryId: string
  state: ReviewedScenarioCoverageBoundaryAssessmentState
  reasons: readonly ReviewedScenarioCoverageBoundaryInvalidationReason[]
  currentCoverageFingerprint: ReviewedScenarioCoverageFingerprint
  reviewedScenarioCoverageCurrentlyUsable: boolean
  inferenceBeyondReviewedScenariosAllowed: false
  engineeringRuleValidated: false
  productionExecutable: false
  productionRuleCreated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

export interface ScenarioCoverageMembershipAssessment {
  boundaryId: string
  membership: ScenarioCoverageMembership
  scenarioIdentityJson: string
  matchedCoverageItem: ReviewedScenarioCoverageItem | null
  reviewedSimulationEvidenceReferenceAvailable: boolean
  automaticOutcomeInferenceAllowed: false
  inferenceBeyondReviewedScenariosAllowed: false
  engineeringRuleValidated: false
  productionExecutable: false
  machineInstructionGenerated: false
  productionRuleCreated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

function coverageItems(
  group: CrossScenarioConsistencyEvidenceGroup,
): readonly ReviewedScenarioCoverageItem[] {
  return Object.freeze(
    [...group.evidence]
      .map((item) =>
        Object.freeze({
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
        }),
      )
      .sort((a, b) =>
        compareText(a.scenarioIdentityJson, b.scenarioIdentityJson),
      ),
  )
}

export function reviewedScenarioCoverageFingerprint(
  group: CrossScenarioConsistencyEvidenceGroup,
  review: HumanScenarioConsistencyReviewRecord,
): ReviewedScenarioCoverageFingerprint {
  const groupFingerprint = scenarioConsistencyEvidenceFingerprint(group)
  const coverage = coverageItems(group)

  return Object.freeze({
    version: RP01_16_SCENARIO_COVERAGE_FINGERPRINT_VERSION,
    value: JSON.stringify({
      version: RP01_16_SCENARIO_COVERAGE_FINGERPRINT_VERSION,
      crossScenarioEvidenceGroupId: group.id,
      scenarioConsistencyReviewRecordId: review.id,
      ruleIdentity: group.ruleIdentity,
      scenarioCount: group.scenarioCount,
      consistencyState: group.state,
      scenarioConsistencyReviewDecision: review.decision,
      scenarioConsistencyReviewFingerprint:
        review.evidenceFingerprint.value,
      currentScenarioConsistencyEvidenceFingerprint:
        groupFingerprint.value,
      reviewedScenarioIdentityJson:
        coverage.map((item) => item.scenarioIdentityJson),
      coverage: coverage.map((item) => ({
        scenarioIdentityJson: item.scenarioIdentityJson,
        repeatabilityGroupId: item.repeatabilityGroupId,
        repeatabilityReviewRecordId:
          item.repeatabilityReviewRecordId,
        repeatabilityEvidenceFingerprint:
          item.repeatabilityEvidenceFingerprint,
        repeatabilityReviewFingerprint:
          item.repeatabilityReviewFingerprint,
        observedResults: [...item.observedResults],
        expectedResults: [...item.expectedResults],
      })),
    }),
  })
}

export function buildReviewedScenarioCoverageBoundary(
  group: CrossScenarioConsistencyEvidenceGroup,
  review: HumanScenarioConsistencyReviewRecord,
): ReviewedScenarioCoverageBoundary {
  const reviewAssessment =
    assessHumanScenarioConsistencyReviewRecord(review, group)
  const reasons: ReviewedScenarioCoverageBoundaryBlockReason[] = []

  if (reviewAssessment.state !== 'CURRENT') {
    reasons.push('SCENARIO_CONSISTENCY_REVIEW_NOT_CURRENT')
  }

  if (
    review.decision !==
      'CONFIRMED_CONSISTENT_ACROSS_REVIEWED_SIMULATION_SCENARIOS'
  ) {
    reasons.push('SCENARIO_CONSISTENCY_NOT_CONFIRMED')
  }

  if (group.scenarioCount < 2) {
    reasons.push('REVIEWED_SCENARIO_COUNT_BELOW_MINIMUM')
  }

  const state: ReviewedScenarioCoverageBoundaryState =
    reasons.length === 0
      ? 'DEFINED_FOR_REVIEWED_SCENARIOS'
      : 'BLOCKED'
  const coverage = coverageItems(group)

  return Object.freeze({
    id: `rp01-16-reviewed-scenario-coverage:${encodeURIComponent(group.id)}:${encodeURIComponent(review.id)}`,
    boundaryType: REVIEWED_SCENARIO_COVERAGE_BOUNDARY,
    crossScenarioEvidenceGroupId: group.id,
    scenarioConsistencyReviewRecordId: review.id,
    ruleIdentity: group.ruleIdentity,
    state,
    reasons: Object.freeze(reasons),
    reviewedScenarioCount: coverage.length,
    reviewedScenarioIdentityJson:
      Object.freeze(coverage.map((item) => item.scenarioIdentityJson)),
    coverage,
    coverageFingerprint:
      reviewedScenarioCoverageFingerprint(group, review),
    exactReviewedScenariosOnly: true,
    simulationEvidenceScopeDefined:
      state === 'DEFINED_FOR_REVIEWED_SCENARIOS',
    simulationEvidenceMaySupportReviewedScenarioReference:
      state === 'DEFINED_FOR_REVIEWED_SCENARIOS',
    inferenceBeyondReviewedScenariosAllowed: false,
    automaticScenarioGeneralizationAllowed: false,
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

export function assessReviewedScenarioCoverageBoundary(
  boundary: ReviewedScenarioCoverageBoundary,
  currentGroup: CrossScenarioConsistencyEvidenceGroup,
  currentReview: HumanScenarioConsistencyReviewRecord,
): ReviewedScenarioCoverageBoundaryAssessment {
  const reasons: ReviewedScenarioCoverageBoundaryInvalidationReason[] = []
  const currentCoverageFingerprint =
    reviewedScenarioCoverageFingerprint(currentGroup, currentReview)
  const currentReviewAssessment =
    assessHumanScenarioConsistencyReviewRecord(
      currentReview,
      currentGroup,
    )
  const rebuiltBoundary =
    buildReviewedScenarioCoverageBoundary(
      currentGroup,
      currentReview,
    )

  if (
    boundary.coverageFingerprint.value !==
      currentCoverageFingerprint.value
  ) {
    reasons.push('SCENARIO_CONSISTENCY_EVIDENCE_CHANGED')
  }

  if (
    currentReviewAssessment.state !== 'CURRENT'
    || currentReview.id !== boundary.scenarioConsistencyReviewRecordId
  ) {
    reasons.push(
      'SCENARIO_CONSISTENCY_REVIEW_CHANGED_OR_STALE',
    )
  }

  if (
    rebuiltBoundary.state !== 'DEFINED_FOR_REVIEWED_SCENARIOS'
  ) {
    reasons.push('SCENARIO_COVERAGE_NO_LONGER_DEFINED')
  }

  const state: ReviewedScenarioCoverageBoundaryAssessmentState =
    reasons.length === 0 ? 'CURRENT' : 'STALE_REQUIRES_REVIEW'

  return Object.freeze({
    boundaryId: boundary.id,
    state,
    reasons: Object.freeze(reasons),
    currentCoverageFingerprint,
    reviewedScenarioCoverageCurrentlyUsable:
      state === 'CURRENT'
      && boundary.state === 'DEFINED_FOR_REVIEWED_SCENARIOS',
    inferenceBeyondReviewedScenariosAllowed: false,
    engineeringRuleValidated: false,
    productionExecutable: false,
    productionRuleCreated: false,
    productionUnlockAllowed: false,
    machineReady: false,
    productionApproved: false,
  })
}

export function assessScenarioAgainstReviewedCoverage(
  boundary: ReviewedScenarioCoverageBoundary,
  scenarioIdentityJson: string,
): ScenarioCoverageMembershipAssessment {
  const matchedCoverageItem =
    boundary.state === 'DEFINED_FOR_REVIEWED_SCENARIOS'
      ? boundary.coverage.find((item) =>
        item.scenarioIdentityJson === scenarioIdentityJson,
      ) ?? null
      : null

  const membership: ScenarioCoverageMembership =
    matchedCoverageItem
      ? 'WITHIN_REVIEWED_SCENARIO_SCOPE'
      : 'OUTSIDE_REVIEWED_SCENARIO_SCOPE'

  return Object.freeze({
    boundaryId: boundary.id,
    membership,
    scenarioIdentityJson,
    matchedCoverageItem,
    reviewedSimulationEvidenceReferenceAvailable:
      membership === 'WITHIN_REVIEWED_SCENARIO_SCOPE',
    automaticOutcomeInferenceAllowed: false,
    inferenceBeyondReviewedScenariosAllowed: false,
    engineeringRuleValidated: false,
    productionExecutable: false,
    machineInstructionGenerated: false,
    productionRuleCreated: false,
    productionUnlockAllowed: false,
    machineReady: false,
    productionApproved: false,
  })
}
