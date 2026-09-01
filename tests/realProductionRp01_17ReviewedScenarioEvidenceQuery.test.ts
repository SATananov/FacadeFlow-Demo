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
  buildReviewedScenarioCoverageBoundary,
} from '../src/realProduction/skyGlazingReviewedScenarioCoverage'
import {
  queryReviewedScenarioEvidence,
} from '../src/realProduction/skyGlazingReviewedScenarioEvidenceQuery'

const sampleDir = join(process.cwd(), 'local-samples', 'phase05a')
const names = readdirSync(sampleDir)
const xmlName = names.find((name) => extname(name).toLowerCase() === '.xml')
const lteName = names.find((name) => extname(name).toLowerCase() === '.lte')
if (!xmlName || !lteName) throw new Error('RP01.17 requires the locked Vadim XML/LTE sample pair.')

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
      observedResults: Object.freeze([index % 2 === 0]),
      expectedResults: Object.freeze([index % 2 === 0]),
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

function currentFixture() {
  const group = syntheticCrossScenarioGroup()
  const reviewResult = recordHumanScenarioConsistencyReview(
    [],
    group,
    'CONFIRMED_CONSISTENT_ACROSS_REVIEWED_SIMULATION_SCENARIOS',
    'Scenario consistency reviewer',
    '2026-09-01T21:00:00+03:00',
    'Confirm exact reviewed scenarios only.',
  )
  assert.equal(reviewResult.status, 'RECORDED')
  assert.ok(reviewResult.record)

  const boundary = buildReviewedScenarioCoverageBoundary(
    group,
    reviewResult.record,
  )
  assert.equal(
    boundary.state,
    'DEFINED_FOR_REVIEWED_SCENARIOS',
  )

  return {
    group,
    review: reviewResult.record,
    boundary,
  }
}

test('RP01.17 current real Vadim-only corpus remains blocked upstream', () => {
  const cross = buildProductionPatternCrossProjectCorroboration([vadim])
  const gates = buildCrossProjectHumanPromotionGateAssessmentSet(
    cross,
    [vadim],
    [],
  )
  assert.equal(gates.assessmentCount, 74)
  assert.equal(gates.eligibleForHumanPromotionReviewCount, 0)
})

test('RP01.17 exact reviewed-scenario query returns an evidence reference only', () => {
  const f = currentFixture()
  const query = queryReviewedScenarioEvidence(
    f.boundary,
    f.group,
    f.review,
    f.group.evidence[0].scenarioIdentityJson,
  )

  assert.equal(query.status, 'EVIDENCE_REFERENCE_AVAILABLE')
  assert.deepEqual(query.reasons, [])
  assert.equal(query.exactScopeMatch, true)
  assert.equal(
    query.reviewedSimulationEvidenceReferenceAvailable,
    true,
  )
  assert.ok(query.evidenceReference)
  assert.equal(
    query.evidenceReference.evidenceScope,
    'EXACT_REVIEWED_SCENARIO_ONLY',
  )
  assert.equal(
    query.evidenceReference.repeatabilityGroupId,
    f.group.evidence[0].repeatabilityGroupId,
  )
  assert.equal(query.automaticOutcomeInferenceAllowed, false)
  assert.equal(query.inferredOutcome, null)
})

test('RP01.17 unseen scenario returns no reviewed evidence and no inferred outcome', () => {
  const f = currentFixture()
  const query = queryReviewedScenarioEvidence(
    f.boundary,
    f.group,
    f.review,
    '{"input":{"observedPatternMatches":"UNSEEN"}}',
  )

  assert.equal(query.status, 'NO_REVIEWED_EVIDENCE')
  assert.deepEqual(
    query.reasons,
    ['SCENARIO_OUTSIDE_REVIEWED_SCOPE'],
  )
  assert.equal(query.exactScopeMatch, false)
  assert.equal(query.evidenceReference, null)
  assert.equal(
    query.reviewedSimulationEvidenceReferenceAvailable,
    false,
  )
  assert.equal(query.inferredOutcome, null)
})

test('RP01.17 stale coverage boundary blocks retrieval even when scenario text still matches old scope', () => {
  const f = currentFixture()
  const changedGroup = syntheticCrossScenarioGroup([
    ...f.group.evidence.map((item) => item.scenarioIdentityJson),
    '{"input":{"observedPatternMatches":null}}',
  ])

  const query = queryReviewedScenarioEvidence(
    f.boundary,
    changedGroup,
    f.review,
    f.group.evidence[0].scenarioIdentityJson,
  )

  assert.equal(query.status, 'NO_REVIEWED_EVIDENCE')
  assert.ok(
    query.reasons.includes('COVERAGE_BOUNDARY_NOT_CURRENT'),
  )
  assert.equal(query.evidenceReference, null)
  assert.equal(query.inferredOutcome, null)
})

test('RP01.17 exact-scope retrieval never generalizes or grants engineering/production authority', () => {
  const f = currentFixture()
  const query = queryReviewedScenarioEvidence(
    f.boundary,
    f.group,
    f.review,
    f.group.evidence[1].scenarioIdentityJson,
  )

  assert.equal(query.status, 'EVIDENCE_REFERENCE_AVAILABLE')
  assert.equal(query.automaticOutcomeInferenceAllowed, false)
  assert.equal(query.inferredOutcome, null)
  assert.equal(query.scenarioGeneralizationAllowed, false)
  assert.equal(
    query.inferenceBeyondReviewedScenariosAllowed,
    false,
  )
  assert.equal(query.engineeringRuleValidated, false)
  assert.equal(query.automaticRulePromotionAllowed, false)
  assert.equal(query.productionExecutable, false)
  assert.equal(query.machineInstructionGenerated, false)
  assert.equal(query.productionRuleCreated, false)
  assert.equal(query.productionUnlockAllowed, false)
  assert.equal(query.machineReady, false)
  assert.equal(query.productionApproved, false)

  const source = readFileSync(
    'src/realProduction/skyGlazingReviewedScenarioEvidenceQuery.ts',
    'utf8',
  )
  assert.doesNotMatch(
    source,
    /automaticOutcomeInferenceAllowed:\s*true/,
  )
  assert.doesNotMatch(source, /inferredOutcome:\s*(true|false)/)
  assert.doesNotMatch(
    source,
    /scenarioGeneralizationAllowed:\s*true/,
  )
  assert.doesNotMatch(
    source,
    /inferenceBeyondReviewedScenariosAllowed:\s*true/,
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
