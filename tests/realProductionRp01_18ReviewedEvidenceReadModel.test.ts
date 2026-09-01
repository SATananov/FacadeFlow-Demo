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
import {
  buildReviewedEvidenceReadModel,
} from '../src/realProduction/skyGlazingReviewedEvidenceReadModel'

const sampleDir = join(process.cwd(), 'local-samples', 'phase05a')
const names = readdirSync(sampleDir)
const xmlName = names.find((name) => extname(name).toLowerCase() === '.xml')
const lteName = names.find((name) => extname(name).toLowerCase() === '.lte')
if (!xmlName || !lteName) throw new Error('RP01.18 requires the locked Vadim XML/LTE sample pair.')

const xml = readFileSync(join(sampleDir, xmlName), 'utf8')
const lte = readFileSync(join(sampleDir, lteName)).toString('latin1')
const vadim = buildProductionPatternCandidateSet(
  aggregateSkyGlazingObservationPatterns(
    extractSkyGlazingXmlObservations(xml),
    extractSkyGlazingLteObservations(lte),
  ),
  'Вадим-2',
)

function syntheticCrossScenarioGroup(): CrossScenarioConsistencyEvidenceGroup {
  const scenarioIdentities = [
    '{"input":{"observedPatternMatches":true}}',
    '{"input":{"observedPatternMatches":false}}',
  ] as const

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
    scenarioCount: 2,
    currentConfirmedScenarioCount: 2,
    currentRejectedScenarioCount: 0,
    staleScenarioCount: 0,
    distinctObservedOutcomeSignatures:
      Object.freeze(['false', 'true']),
    state:
      'CANDIDATE_CONSISTENT_ACROSS_REVIEWED_SCENARIOS',
    scenarioConsistencyCandidate: true,
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
  const review = recordHumanScenarioConsistencyReview(
    [],
    group,
    'CONFIRMED_CONSISTENT_ACROSS_REVIEWED_SIMULATION_SCENARIOS',
    'Scenario consistency reviewer',
    '2026-09-01T22:00:00+03:00',
    'Confirm exact reviewed scenarios only.',
  ).record
  assert.ok(review)

  const boundary = buildReviewedScenarioCoverageBoundary(
    group,
    review,
  )
  assert.equal(
    boundary.state,
    'DEFINED_FOR_REVIEWED_SCENARIOS',
  )

  return { group, review, boundary }
}

test('RP01.18 current real Vadim-only corpus remains blocked upstream', () => {
  const cross = buildProductionPatternCrossProjectCorroboration([vadim])
  const gates = buildCrossProjectHumanPromotionGateAssessmentSet(
    cross,
    [vadim],
    [],
  )
  assert.equal(gates.assessmentCount, 74)
  assert.equal(gates.eligibleForHumanPromotionReviewCount, 0)
})

test('RP01.18 projects an exact reviewed evidence reference into a read-only consumer model', () => {
  const f = currentFixture()
  const query = queryReviewedScenarioEvidence(
    f.boundary,
    f.group,
    f.review,
    f.group.evidence[0].scenarioIdentityJson,
  )
  const model = buildReviewedEvidenceReadModel(query)

  assert.equal(
    model.state,
    'AVAILABLE_FOR_READ_ONLY_CONSUMER',
  )
  assert.deepEqual(model.reasons, [])
  assert.equal(model.reviewedEvidenceAvailable, true)
  assert.equal(model.mayDisplayReviewedEvidenceReference, true)
  assert.equal(model.mayExposeReviewedEvidenceToAiContext, true)
  assert.ok(model.consumerProjection)
  assert.equal(
    model.consumerProjection.evidenceNature,
    'HUMAN_REVIEWED_SIMULATION_EVIDENCE',
  )
  assert.equal(
    model.consumerProjection.resultInterpretation,
    'HISTORICAL_REVIEWED_SIMULATION_RESULTS',
  )
  assert.equal(model.consumerProjection.readOnly, true)
  assert.equal(
    model.consumerProjection.usableAsCurrentScenarioPrediction,
    false,
  )
})

test('RP01.18 no-evidence query yields no consumer projection', () => {
  const f = currentFixture()
  const query = queryReviewedScenarioEvidence(
    f.boundary,
    f.group,
    f.review,
    '{"input":{"observedPatternMatches":"UNSEEN"}}',
  )
  const model = buildReviewedEvidenceReadModel(query)

  assert.equal(model.state, 'UNAVAILABLE')
  assert.equal(model.reviewedEvidenceAvailable, false)
  assert.equal(model.consumerProjection, null)
  assert.equal(model.mayDisplayReviewedEvidenceReference, false)
  assert.equal(model.mayExposeReviewedEvidenceToAiContext, false)
  assert.deepEqual(model.reasons, [
    'QUERY_HAS_NO_REVIEWED_EVIDENCE',
    'QUERY_NOT_EXACT_SCOPE',
    'QUERY_EVIDENCE_REFERENCE_MISSING',
  ])
})

test('RP01.18 consumer projection preserves source IDs and reviewed result arrays without inferring a new result', () => {
  const f = currentFixture()
  const query = queryReviewedScenarioEvidence(
    f.boundary,
    f.group,
    f.review,
    f.group.evidence[1].scenarioIdentityJson,
  )
  const model = buildReviewedEvidenceReadModel(query)
  assert.ok(query.evidenceReference)
  assert.ok(model.consumerProjection)

  assert.equal(
    model.consumerProjection.boundaryId,
    query.evidenceReference.boundaryId,
  )
  assert.equal(
    model.consumerProjection.repeatabilityGroupId,
    query.evidenceReference.repeatabilityGroupId,
  )
  assert.deepEqual(
    model.consumerProjection.observedSimulationResults,
    query.evidenceReference.observedResults,
  )
  assert.deepEqual(
    model.consumerProjection.expectedSimulationResults,
    query.evidenceReference.expectedResults,
  )
  assert.equal(model.inferredOutcome, null)
  assert.equal(model.automaticOutcomeInferenceAllowed, false)
})

test('RP01.18 safe consumer model never converts reviewed evidence into prediction, engineering authority, or production authority', () => {
  const f = currentFixture()
  const query = queryReviewedScenarioEvidence(
    f.boundary,
    f.group,
    f.review,
    f.group.evidence[0].scenarioIdentityJson,
  )
  const model = buildReviewedEvidenceReadModel(query)
  assert.ok(model.consumerProjection)

  assert.equal(
    model.aiContextMayTreatEvidenceAsPrediction,
    false,
  )
  assert.equal(model.automaticOutcomeInferenceAllowed, false)
  assert.equal(model.inferredOutcome, null)
  assert.equal(model.scenarioGeneralizationAllowed, false)
  assert.equal(
    model.inferenceBeyondReviewedScenariosAllowed,
    false,
  )
  assert.equal(model.engineeringRuleValidated, false)
  assert.equal(model.automaticRulePromotionAllowed, false)
  assert.equal(model.productionExecutable, false)
  assert.equal(model.machineInstructionGenerated, false)
  assert.equal(model.productionRuleCreated, false)
  assert.equal(model.productionUnlockAllowed, false)
  assert.equal(model.machineReady, false)
  assert.equal(model.productionApproved, false)

  assert.equal(
    model.consumerProjection.engineeringAuthorityGranted,
    false,
  )
  assert.equal(
    model.consumerProjection.productionAuthorityGranted,
    false,
  )

  const source = readFileSync(
    'src/realProduction/skyGlazingReviewedEvidenceReadModel.ts',
    'utf8',
  )
  assert.doesNotMatch(
    source,
    /aiContextMayTreatEvidenceAsPrediction:\s*true/,
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
  assert.doesNotMatch(
    source,
    /engineeringAuthorityGranted:\s*true/,
  )
  assert.doesNotMatch(
    source,
    /productionAuthorityGranted:\s*true/,
  )
})
