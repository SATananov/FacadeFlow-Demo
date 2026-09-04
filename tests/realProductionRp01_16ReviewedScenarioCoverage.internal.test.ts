import assert from 'node:assert/strict'
import { extname, join } from 'node:path'
import { readdirSync, readFileSync } from 'node:fs'
import test from 'node:test'
import {
  extractSkyGlazingLteObservations,
  extractSkyGlazingXmlObservations,
} from '../src/realProduction/skyGlazingObservationExtraction'
import { aggregateSkyGlazingObservationPatterns } from '../src/realProduction/skyGlazingObservationAggregation'
import {
  buildProductionPatternCandidateSet,
} from '../src/realProduction/skyGlazingProductionPatternCandidates'
import { buildProductionPatternCrossProjectCorroboration } from '../src/realProduction/skyGlazingCrossProjectCorroboration'
import {
  buildCrossProjectHumanPromotionGateAssessmentSet,
} from '../src/realProduction/skyGlazingCrossProjectPromotionGate'
import {
  recordHumanScenarioConsistencyReview,
  type CrossScenarioConsistencyEvidenceGroup,
} from '../src/realProduction/skyGlazingCrossScenarioConsistency'
import {
  assessReviewedScenarioCoverageBoundary,
  assessScenarioAgainstReviewedCoverage,
  buildReviewedScenarioCoverageBoundary,
} from '../src/realProduction/skyGlazingReviewedScenarioCoverage'

const sampleDir = join(process.cwd(), 'local-samples', 'phase05a')
const names = readdirSync(sampleDir)
const xmlName = names.find((name) => extname(name).toLowerCase() === '.xml')
const lteName = names.find((name) => extname(name).toLowerCase() === '.lte')
if (!xmlName || !lteName) throw new Error('RP01.16 requires the locked Vadim XML/LTE sample pair.')

const xml = readFileSync(join(sampleDir, xmlName), 'utf8')
const lte = readFileSync(join(sampleDir, lteName)).toString('latin1')
const vadim = buildProductionPatternCandidateSet(
  aggregateSkyGlazingObservationPatterns(
    extractSkyGlazingXmlObservations(xml),
    extractSkyGlazingLteObservations(lte),
  ),
  'Вадим-2',
)

function syntheticCrossScenarioGroup(
  scenarioIdentities: readonly string[] = [
    '{"input":{"observedPatternMatches":true}}',
    '{"input":{"observedPatternMatches":false}}',
  ],
): CrossScenarioConsistencyEvidenceGroup {
  const evidence = scenarioIdentities.map((scenarioIdentityJson, index) =>
    Object.freeze({
      repeatabilityGroupId: `repeatability-group-${index + 1}`,
      repeatabilityReviewRecordId:
        `repeatability-review-${index + 1}`,
      scenarioIdentityJson,
      observedResults:
        Object.freeze([index % 2 === 0]),
      expectedResults:
        Object.freeze([index % 2 === 0]),
      repeatabilityGroupState:
        'CANDIDATE_REPEATABLE_OUTCOME' as const,
      repeatabilityReviewDecision:
        'CONFIRMED_REPEATABLE_FOR_SIMULATION_CONTEXT' as const,
      repeatabilityReviewState: 'CURRENT' as const,
      repeatabilityEvidenceFingerprint:
        `repeatability-evidence-${index + 1}`,
      repeatabilityReviewFingerprint:
        `repeatability-review-fingerprint-${index + 1}`,
      confirmedForSimulationContext: true,
    }),
  )

  return Object.freeze({
    id: 'synthetic-rp01-15-group',
    comparisonType:
      'CROSS_SCENARIO_SIMULATION_EVIDENCE_COMPARISON',
    ruleIdentity: Object.freeze({
      executableDraftArtifactId: 'synthetic-draft',
      executableExpression:
        'return observedPatternMatches === true',
      executionContext: 'Local sandbox only',
      profileCode: '78.01',
      candidateKind: 'CUT_TUPLE',
      sourcePatternKey:
        'sxB=135|dxB=135|sxC=90|dxC=90',
      operationName: null,
    }),
    scenarioCount: new Set(scenarioIdentities).size,
    currentConfirmedScenarioCount: evidence.length,
    currentRejectedScenarioCount: 0,
    staleScenarioCount: 0,
    distinctObservedOutcomeSignatures:
      Object.freeze(['false', 'true']),
    state:
      scenarioIdentities.length >= 2
        ? 'CANDIDATE_CONSISTENT_ACROSS_REVIEWED_SCENARIOS'
        : 'INSUFFICIENT_SCENARIO_COVERAGE',
    scenarioConsistencyCandidate:
      scenarioIdentities.length >= 2,
    humanScenarioConsistencyReviewRequired: true,
    inferenceBeyondReviewedScenariosAllowed: false,
    engineeringRuleValidated: false,
    automaticRulePromotionAllowed: false,
    productionExecutable: false,
    machineInstructionGenerated: false,
    productionRuleCreated: false,
    productionUnlockAllowed: false,
    machineReady: false,
    productionApproved: false,
    evidence: Object.freeze(evidence),
  })
}

function confirmedScenarioConsistencyReview(
  group: CrossScenarioConsistencyEvidenceGroup,
) {
  const result = recordHumanScenarioConsistencyReview(
    [],
    group,
    'CONFIRMED_CONSISTENT_ACROSS_REVIEWED_SIMULATION_SCENARIOS',
    'Scenario consistency reviewer',
    '2026-09-01T20:00:00+03:00',
    'Confirm only the explicitly reviewed simulation scenarios.',
  )
  assert.equal(result.status, 'RECORDED')
  assert.ok(result.record)
  return result.record
}

test('RP01.16 current real Vadim-only corpus remains blocked upstream', () => {
  const cross = buildProductionPatternCrossProjectCorroboration([vadim])
  const gates = buildCrossProjectHumanPromotionGateAssessmentSet(
    cross,
    [vadim],
    [],
  )
  assert.equal(gates.assessmentCount, 74)
  assert.equal(gates.eligibleForHumanPromotionReviewCount, 0)
})

test('RP01.16 defines an exact reviewed-scenario coverage boundary from a current confirmed RP01.15 review', () => {
  const group = syntheticCrossScenarioGroup()
  const review = confirmedScenarioConsistencyReview(group)

  const boundary = buildReviewedScenarioCoverageBoundary(
    group,
    review,
  )

  assert.equal(
    boundary.state,
    'DEFINED_FOR_REVIEWED_SCENARIOS',
  )
  assert.deepEqual(boundary.reasons, [])
  assert.equal(boundary.reviewedScenarioCount, 2)
  assert.equal(boundary.exactReviewedScenariosOnly, true)
  assert.equal(boundary.simulationEvidenceScopeDefined, true)
  assert.equal(
    boundary.inferenceBeyondReviewedScenariosAllowed,
    false,
  )
})

test('RP01.16 exact reviewed scenario is within coverage but still grants no automatic inference', () => {
  const group = syntheticCrossScenarioGroup()
  const review = confirmedScenarioConsistencyReview(group)
  const boundary = buildReviewedScenarioCoverageBoundary(
    group,
    review,
  )

  const assessment = assessScenarioAgainstReviewedCoverage(
    boundary,
    group.evidence[0].scenarioIdentityJson,
  )

  assert.equal(
    assessment.membership,
    'WITHIN_REVIEWED_SCENARIO_SCOPE',
  )
  assert.equal(
    assessment.reviewedSimulationEvidenceReferenceAvailable,
    true,
  )
  assert.equal(assessment.automaticOutcomeInferenceAllowed, false)
  assert.equal(
    assessment.inferenceBeyondReviewedScenariosAllowed,
    false,
  )
})

test('RP01.16 unseen scenario is outside coverage and never inherits reviewed evidence', () => {
  const group = syntheticCrossScenarioGroup()
  const review = confirmedScenarioConsistencyReview(group)
  const boundary = buildReviewedScenarioCoverageBoundary(
    group,
    review,
  )

  const assessment = assessScenarioAgainstReviewedCoverage(
    boundary,
    '{"input":{"observedPatternMatches":"UNSEEN"}}',
  )

  assert.equal(
    assessment.membership,
    'OUTSIDE_REVIEWED_SCENARIO_SCOPE',
  )
  assert.equal(
    assessment.reviewedSimulationEvidenceReferenceAvailable,
    false,
  )
  assert.equal(assessment.automaticOutcomeInferenceAllowed, false)
})

test('RP01.16 does not define coverage from insufficient RP01.15 scenario evidence', () => {
  const group = syntheticCrossScenarioGroup([
    '{"input":{"observedPatternMatches":true}}',
  ])

  const rejectedLikeReview = Object.freeze({
    id: 'synthetic-insufficient-review',
    recordType: 'HUMAN_SCENARIO_CONSISTENCY_REVIEW_RECORD' as const,
    crossScenarioEvidenceGroupId: group.id,
    decision: 'REJECTED_SCENARIO_CONSISTENCY' as const,
    reviewer: 'Reviewer',
    reviewedAt: '2026-09-01T20:01:00+03:00',
    rationale: 'Insufficient scenario coverage.',
    evidenceFingerprint: Object.freeze({
      version: 'RP01.15-SCENARIO-CONSISTENCY-V1' as const,
      value: 'not-current-for-insufficient-evidence',
    }),
    humanScenarioConsistencyReviewCompleted: true as const,
    consistencyConfirmedAcrossReviewedSimulationScenarios: false,
    consistencyRejectedAcrossReviewedSimulationScenarios: true,
    inferenceBeyondReviewedScenariosAllowed: false as const,
    engineeringRuleValidated: false as const,
    automaticRulePromotionAllowed: false as const,
    productionExecutable: false as const,
    machineInstructionGenerated: false as const,
    productionRuleCreated: false as const,
    productionUnlockAllowed: false as const,
    machineReady: false as const,
    productionApproved: false as const,
  })

  const boundary = buildReviewedScenarioCoverageBoundary(
    group,
    rejectedLikeReview,
  )

  assert.equal(boundary.state, 'BLOCKED')
  assert.ok(
    boundary.reasons.includes(
      'SCENARIO_CONSISTENCY_REVIEW_NOT_CURRENT',
    ),
  )
  assert.ok(
    boundary.reasons.includes(
      'SCENARIO_CONSISTENCY_NOT_CONFIRMED',
    ),
  )
  assert.ok(
    boundary.reasons.includes(
      'REVIEWED_SCENARIO_COUNT_BELOW_MINIMUM',
    ),
  )
})

test('RP01.16 boundary becomes stale when reviewed scenario coverage changes', () => {
  const group = syntheticCrossScenarioGroup()
  const review = confirmedScenarioConsistencyReview(group)
  const boundary = buildReviewedScenarioCoverageBoundary(
    group,
    review,
  )

  const changedGroup = syntheticCrossScenarioGroup([
    ...group.evidence.map((item) => item.scenarioIdentityJson),
    '{"input":{"observedPatternMatches":null}}',
  ])

  const assessment = assessReviewedScenarioCoverageBoundary(
    boundary,
    changedGroup,
    review,
  )

  assert.equal(assessment.state, 'STALE_REQUIRES_REVIEW')
  assert.ok(
    assessment.reasons.includes(
      'SCENARIO_CONSISTENCY_EVIDENCE_CHANGED',
    ),
  )
  assert.ok(
    assessment.reasons.includes(
      'SCENARIO_CONSISTENCY_REVIEW_CHANGED_OR_STALE',
    ),
  )
})

test('RP01.16 never generalizes reviewed scenario coverage into engineering or production authority', () => {
  const group = syntheticCrossScenarioGroup()
  const review = confirmedScenarioConsistencyReview(group)
  const boundary = buildReviewedScenarioCoverageBoundary(
    group,
    review,
  )

  assert.equal(
    boundary.inferenceBeyondReviewedScenariosAllowed,
    false,
  )
  assert.equal(
    boundary.automaticScenarioGeneralizationAllowed,
    false,
  )
  assert.equal(boundary.engineeringRuleValidated, false)
  assert.equal(boundary.automaticRulePromotionAllowed, false)
  assert.equal(boundary.productionExecutable, false)
  assert.equal(boundary.machineInstructionGenerated, false)
  assert.equal(boundary.productionRuleCreated, false)
  assert.equal(boundary.productionUnlockAllowed, false)
  assert.equal(boundary.machineReady, false)
  assert.equal(boundary.productionApproved, false)

  const source = readFileSync(
    'src/realProduction/skyGlazingReviewedScenarioCoverage.ts',
    'utf8',
  )
  assert.doesNotMatch(
    source,
    /inferenceBeyondReviewedScenariosAllowed:\s*true/,
  )
  assert.doesNotMatch(
    source,
    /automaticScenarioGeneralizationAllowed:\s*true/,
  )
  assert.doesNotMatch(source, /engineeringRuleValidated:\s*true/)
  assert.doesNotMatch(source, /automaticRulePromotionAllowed:\s*true/)
  assert.doesNotMatch(source, /productionExecutable:\s*true/)
  assert.doesNotMatch(source, /machineInstructionGenerated:\s*true/)
  assert.doesNotMatch(source, /productionRuleCreated:\s*true/)
  assert.doesNotMatch(source, /productionUnlockAllowed:\s*true/)
  assert.doesNotMatch(source, /machineReady:\s*true/)
  assert.doesNotMatch(source, /productionApproved:\s*true/)
})
