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
  type ProductionPatternCandidate,
  type ProductionPatternCandidateSet,
} from '../src/realProduction/skyGlazingProductionPatternCandidates'
import {
  recordProductionPatternCandidateReview,
  type ProductionPatternCandidateReviewLedgerEntry,
} from '../src/realProduction/skyGlazingProductionPatternReviewLedger'
import { buildProductionPatternCrossProjectCorroboration } from '../src/realProduction/skyGlazingCrossProjectCorroboration'
import {
  assessCrossProjectHumanPromotionGate,
  buildCrossProjectHumanPromotionGateAssessmentSet,
} from '../src/realProduction/skyGlazingCrossProjectPromotionGate'
import {
  createNonExecutableRuleDraft,
  recordHumanPromotionReview,
} from '../src/realProduction/skyGlazingHumanPromotionReview'
import { recordRuleDraftEngineeringValidation } from '../src/realProduction/skyGlazingRuleDraftEngineeringValidation'
import { assessExecutableRuleReviewGate } from '../src/realProduction/skyGlazingExecutableRuleReviewGate'
import {
  createNonProductionExecutableRuleDraft,
  recordHumanExecutableRuleReview,
} from '../src/realProduction/skyGlazingHumanExecutableRuleReview'
import {
  assessSimulationExecutionGate,
  recordSimulationValidation,
} from '../src/realProduction/skyGlazingSimulationExecutionGate'
import {
  createLocalSimulationRuntimeAdapter,
  executeLocalSimulationDryRun,
} from '../src/realProduction/skyGlazingLocalSimulationRuntime'
import {
  recordSimulationOutcomeValidation,
} from '../src/realProduction/skyGlazingSimulationOutcomeValidation'
import {
  buildSimulationRepeatabilityEvidenceSet,
  recordHumanSimulationRepeatabilityReview,
  type SimulationOutcomeEvidencePacket,
} from '../src/realProduction/skyGlazingSimulationRepeatability'
import {
  assessHumanScenarioConsistencyReviewRecord,
  buildCrossScenarioConsistencyEvidenceSet,
  recordHumanScenarioConsistencyReview,
  type ReviewedSimulationRepeatabilityPacket,
} from '../src/realProduction/skyGlazingCrossScenarioConsistency'

const sampleDir = join(process.cwd(), 'local-samples', 'phase05a')
const names = readdirSync(sampleDir)
const xmlName = names.find((name) => extname(name).toLowerCase() === '.xml')
const lteName = names.find((name) => extname(name).toLowerCase() === '.lte')
if (!xmlName || !lteName) throw new Error('RP01.15 requires the locked Vadim XML/LTE sample pair.')

const xml = readFileSync(join(sampleDir, xmlName), 'utf8')
const lte = readFileSync(join(sampleDir, lteName)).toString('latin1')
const vadim = buildProductionPatternCandidateSet(
  aggregateSkyGlazingObservationPatterns(
    extractSkyGlazingXmlObservations(xml),
    extractSkyGlazingLteObservations(lte),
  ),
  'Вадим-2',
)
const baseCandidate = vadim.candidates.find((candidate) =>
  candidate.profileCode === '78.01'
  && candidate.kind === 'CUT_TUPLE'
  && candidate.sourcePatternKey === 'sxB=135|dxB=135|sxC=90|dxC=90')
if (!baseCandidate) throw new Error('RP01.15 expected the repeated 78.01 cut candidate.')

function cloneCandidate(
  candidate: ProductionPatternCandidate,
  sourceProject: string,
): ProductionPatternCandidate {
  return Object.freeze({
    ...candidate,
    sourceProject,
    evidenceCount: 5,
    reviewStatus: 'NOT_REVIEWED',
    reviewer: null,
    reviewedAt: null,
    reviewNote: '',
    humanConfirmedAsCandidate: false,
    humanRejectedAsCandidate: false,
    singleProjectOnly: true,
    crossProjectCorroborated: false,
    candidateIsProductionRule: false,
    universalRuleInferenceAllowed: false,
    productionRuleCreated: false,
    machineReady: false,
    productionApproved: false,
  })
}

function candidateSet(
  project: string,
  candidate: ProductionPatternCandidate,
): ProductionPatternCandidateSet {
  return Object.freeze({
    sourceProject: project,
    candidateCount: 1,
    cutTupleCandidateCount: candidate.kind === 'CUT_TUPLE' ? 1 : 0,
    exactOperationCandidateCount: candidate.kind === 'EXACT_OPERATION' ? 1 : 0,
    candidates: Object.freeze([candidate]),
    singleProjectOnly: true,
    crossProjectCorroborated: false,
    automaticRulePromotionAllowed: false,
    productionRuleCreated: false,
    machineReady: false,
    productionApproved: false,
  })
}

function addReview(
  entries: readonly ProductionPatternCandidateReviewLedgerEntry[],
  currentCandidates: readonly ProductionPatternCandidate[],
  candidate: ProductionPatternCandidate,
  at: string,
): ProductionPatternCandidateReviewLedgerEntry[] {
  const result = recordProductionPatternCandidateReview(
    entries,
    currentCandidates,
    candidate,
    'CONFIRM_CANDIDATE',
    'Human technologist',
    at,
    'RP01.15 fixture review.',
  )
  assert.equal(result.status, 'RECORDED')
  assert.ok(result.entry)
  return [...result.ledger.entries]
}

function baseFixture() {
  const synthetic = cloneCandidate(baseCandidate, 'SYNTHETIC_TEST_PROJECT_B')
  const syntheticSet = candidateSet('SYNTHETIC_TEST_PROJECT_B', synthetic)
  const sets = [vadim, syntheticSet] as const
  const currentCandidates = [...vadim.candidates, synthetic]

  let reviews: ProductionPatternCandidateReviewLedgerEntry[] = []
  reviews = addReview(reviews, currentCandidates, baseCandidate, '2026-09-01T18:00:00+03:00')
  reviews = addReview(reviews, currentCandidates, synthetic, '2026-09-01T18:01:00+03:00')

  const cross = buildProductionPatternCrossProjectCorroboration(sets)
  const pattern = cross.patterns.find((item) =>
    item.profileCode === baseCandidate.profileCode
    && item.kind === baseCandidate.kind
    && item.sourcePatternKey === baseCandidate.sourcePatternKey)
  if (!pattern) throw new Error('RP01.15 synthetic corroboration missing.')

  const promotionGate = assessCrossProjectHumanPromotionGate(pattern, sets, reviews)
  const promotionReview = recordHumanPromotionReview(
    [],
    promotionGate,
    'APPROVED_FOR_RULE_DRAFT',
    'Human engineer',
    '2026-09-01T18:02:00+03:00',
    'Permit draft review.',
  ).record
  assert.ok(promotionReview)

  const sourceDraft = createNonExecutableRuleDraft(
    promotionReview,
    promotionGate,
    'WP78 proposal',
    'Explicit proposal.',
    '2026-09-01T18:03:00+03:00',
  ).artifact
  assert.ok(sourceDraft)

  const engineeringValidation = recordRuleDraftEngineeringValidation(
    [],
    sourceDraft,
    promotionReview,
    promotionGate,
    'VALIDATED_FOR_ENGINEERING_CONTEXT',
    'Engineer validator',
    '2026-09-01T18:04:00+03:00',
    'Simulation context',
    'Engineering-context validation only.',
  ).record
  assert.ok(engineeringValidation)

  const executableReviewGate = assessExecutableRuleReviewGate(
    engineeringValidation,
    sourceDraft,
    promotionReview,
    promotionGate,
  )

  const executableReview = recordHumanExecutableRuleReview(
    [],
    executableReviewGate,
    engineeringValidation,
    sourceDraft,
    promotionReview,
    promotionGate,
    'APPROVED_FOR_NON_PRODUCTION_EXECUTABLE_DRAFT',
    'Executable reviewer',
    '2026-09-01T18:05:00+03:00',
    'Local sandbox only',
    'Simulation-only approval.',
  ).record
  assert.ok(executableReview)

  const executableDraft = createNonProductionExecutableRuleDraft(
    executableReview,
    executableReviewGate,
    engineeringValidation,
    sourceDraft,
    promotionReview,
    promotionGate,
    'Simulation draft',
    'return observedPatternMatches === true',
    'Local sandbox only',
    '2026-09-01T18:06:00+03:00',
  ).artifact
  assert.ok(executableDraft)

  const simulationValidation = recordSimulationValidation(
    [],
    executableDraft,
    executableReview,
    executableReviewGate,
    engineeringValidation,
    sourceDraft,
    promotionReview,
    promotionGate,
    'VALIDATED_FOR_SIMULATION_EXECUTION',
    'Simulation validator',
    '2026-09-01T18:07:00+03:00',
    'Local deterministic sandbox',
    'Validate local dry-run only.',
  ).record
  assert.ok(simulationValidation)

  const simulationGate = assessSimulationExecutionGate(
    simulationValidation,
    executableDraft,
    executableReview,
    executableReviewGate,
    engineeringValidation,
    sourceDraft,
    promotionReview,
    promotionGate,
  )

  const adapter = createLocalSimulationRuntimeAdapter(
    simulationGate,
    simulationValidation,
    executableDraft,
    executableReview,
    executableReviewGate,
    engineeringValidation,
    sourceDraft,
    promotionReview,
    promotionGate,
  ).adapter
  assert.ok(adapter)

  return {
    promotionGate,
    promotionReview,
    sourceDraft,
    engineeringValidation,
    executableReviewGate,
    executableReview,
    executableDraft,
    simulationValidation,
    simulationGate,
    adapter,
  }
}

function outcomePacket(
  f: ReturnType<typeof baseFixture>,
  inputValue: boolean,
  executedAt: string,
  validatedAt: string,
): SimulationOutcomeEvidencePacket {
  const dryRun = executeLocalSimulationDryRun(
    f.adapter,
    f.simulationGate,
    f.simulationValidation,
    f.executableDraft,
    f.executableReview,
    f.executableReviewGate,
    f.engineeringValidation,
    f.sourceDraft,
    f.promotionReview,
    f.promotionGate,
    { observedPatternMatches: inputValue },
    executedAt,
  ).record
  assert.ok(dryRun)

  const validation = recordSimulationOutcomeValidation(
    [],
    dryRun,
    f.adapter,
    f.simulationGate,
    f.simulationValidation,
    f.executableDraft,
    f.executableReview,
    f.executableReviewGate,
    f.engineeringValidation,
    f.sourceDraft,
    f.promotionReview,
    f.promotionGate,
    'VALIDATED_AS_EXPECTED_SIMULATION_OUTCOME',
    inputValue,
    'Outcome reviewer',
    validatedAt,
    'Expected outcome confirmed.',
  ).record
  assert.ok(validation)

  return Object.freeze({
    outcomeValidation: validation,
    dryRun,
    adapter: f.adapter,
    simulationGate: f.simulationGate,
    simulationValidation: f.simulationValidation,
    draft: f.executableDraft,
    executableReview: f.executableReview,
    executableReviewGate: f.executableReviewGate,
    engineeringValidation: f.engineeringValidation,
    sourceDraft: f.sourceDraft,
    promotionReview: f.promotionReview,
    promotionGate: f.promotionGate,
  })
}

function repeatabilityPacket(
  f: ReturnType<typeof baseFixture>,
  inputValue: boolean,
  startMinute: number,
  decision:
    | 'CONFIRMED_REPEATABLE_FOR_SIMULATION_CONTEXT'
    | 'REJECTED_REPEATABILITY_FOR_SIMULATION_CONTEXT' =
      'CONFIRMED_REPEATABLE_FOR_SIMULATION_CONTEXT',
): ReviewedSimulationRepeatabilityPacket {
  const m = (offset: number) =>
    String(startMinute + offset).padStart(2, '0')

  const outcomes = [
    outcomePacket(
      f,
      inputValue,
      `2026-09-01T18:${m(0)}:00+03:00`,
      `2026-09-01T18:${m(1)}:00+03:00`,
    ),
    outcomePacket(
      f,
      inputValue,
      `2026-09-01T18:${m(2)}:00+03:00`,
      `2026-09-01T18:${m(3)}:00+03:00`,
    ),
  ]

  const group =
    buildSimulationRepeatabilityEvidenceSet(outcomes).groups[0]
  assert.equal(group.state, 'CANDIDATE_REPEATABLE_OUTCOME')

  const review = recordHumanSimulationRepeatabilityReview(
    [],
    group,
    decision,
    'Repeatability reviewer',
    `2026-09-01T18:${m(4)}:00+03:00`,
    'Repeatability review for exact simulation scenario.',
  ).record
  assert.ok(review)

  return Object.freeze({
    repeatabilityGroup: group,
    repeatabilityReview: review,
  })
}

test('RP01.15 real Vadim-only corpus remains blocked upstream', () => {
  const cross = buildProductionPatternCrossProjectCorroboration([vadim])
  const gates = buildCrossProjectHumanPromotionGateAssessmentSet(
    cross,
    [vadim],
    [],
  )
  assert.equal(gates.assessmentCount, 74)
  assert.equal(gates.eligibleForHumanPromotionReviewCount, 0)
})

test('RP01.15 one confirmed repeatability scenario is insufficient cross-scenario coverage', () => {
  const f = baseFixture()
  const packet = repeatabilityPacket(f, true, 10)
  const set = buildCrossScenarioConsistencyEvidenceSet([packet])

  assert.equal(set.groupCount, 1)
  assert.equal(set.insufficientScenarioCoverageGroupCount, 1)
  assert.equal(
    set.groups[0].state,
    'INSUFFICIENT_SCENARIO_COVERAGE',
  )
  assert.equal(set.groups[0].scenarioConsistencyCandidate, false)
})

test('RP01.15 two distinct current confirmed repeatability scenarios create only a consistency candidate', () => {
  const f = baseFixture()
  const packets = [
    repeatabilityPacket(f, true, 20),
    repeatabilityPacket(f, false, 30),
  ]

  const set = buildCrossScenarioConsistencyEvidenceSet(packets)
  const group = set.groups[0]

  assert.equal(set.candidateConsistencyGroupCount, 1)
  assert.equal(
    group.state,
    'CANDIDATE_CONSISTENT_ACROSS_REVIEWED_SCENARIOS',
  )
  assert.equal(group.scenarioCount, 2)
  assert.equal(group.currentConfirmedScenarioCount, 2)
  assert.equal(group.currentRejectedScenarioCount, 0)
  assert.equal(group.staleScenarioCount, 0)
  assert.equal(group.inferenceBeyondReviewedScenariosAllowed, false)
  assert.equal(group.engineeringRuleValidated, false)
})

test('RP01.15 different scenario results may still be consistent because each scenario is reviewed independently', () => {
  const f = baseFixture()
  const group = buildCrossScenarioConsistencyEvidenceSet([
    repeatabilityPacket(f, true, 40),
    repeatabilityPacket(f, false, 50),
  ]).groups[0]

  assert.equal(group.distinctObservedOutcomeSignatures.length, 2)
  assert.equal(
    group.state,
    'CANDIDATE_CONSISTENT_ACROSS_REVIEWED_SCENARIOS',
  )
})

test('RP01.15 a rejected repeatability scenario blocks consistency-candidate classification', () => {
  const f = baseFixture()
  const group = buildCrossScenarioConsistencyEvidenceSet([
    repeatabilityPacket(f, true, 10),
    repeatabilityPacket(
      f,
      false,
      20,
      'REJECTED_REPEATABILITY_FOR_SIMULATION_CONTEXT',
    ),
  ]).groups[0]

  assert.equal(
    group.state,
    'CONFLICTING_SCENARIO_REVIEW_EVIDENCE',
  )
  assert.equal(group.currentRejectedScenarioCount, 1)
  assert.equal(group.scenarioConsistencyCandidate, false)
})

test('RP01.15 human consistency review is recordable only for candidate reviewed-scenario evidence', () => {
  const f = baseFixture()
  const group = buildCrossScenarioConsistencyEvidenceSet([
    repeatabilityPacket(f, true, 30),
    repeatabilityPacket(f, false, 40),
  ]).groups[0]

  const review = recordHumanScenarioConsistencyReview(
    [],
    group,
    'CONFIRMED_CONSISTENT_ACROSS_REVIEWED_SIMULATION_SCENARIOS',
    'Scenario consistency reviewer',
    '2026-09-01T19:00:00+03:00',
    'Consistency confirmed only across the explicitly reviewed scenarios.',
  )

  assert.equal(review.status, 'RECORDED')
  assert.ok(review.record)
  assert.equal(
    review.record
      .consistencyConfirmedAcrossReviewedSimulationScenarios,
    true,
  )
  assert.equal(
    review.record.inferenceBeyondReviewedScenariosAllowed,
    false,
  )
  assert.equal(review.record.engineeringRuleValidated, false)
})

test('RP01.15 review becomes stale when reviewed-scenario evidence changes', () => {
  const f = baseFixture()
  const firstTwo = [
    repeatabilityPacket(f, true, 10),
    repeatabilityPacket(f, false, 20),
  ]
  const original =
    buildCrossScenarioConsistencyEvidenceSet(firstTwo).groups[0]

  const review = recordHumanScenarioConsistencyReview(
    [],
    original,
    'CONFIRMED_CONSISTENT_ACROSS_REVIEWED_SIMULATION_SCENARIOS',
    'Scenario consistency reviewer',
    '2026-09-01T19:01:00+03:00',
    'Bound to exact reviewed-scenario evidence.',
  ).record
  assert.ok(review)

  const extraScenarioPacket = repeatabilityPacket(f, true, 30)
  const changedPacket = Object.freeze({
    ...extraScenarioPacket,
    repeatabilityGroup: Object.freeze({
      ...extraScenarioPacket.repeatabilityGroup,
      scenario: Object.freeze({
        ...extraScenarioPacket.repeatabilityGroup.scenario,
        inputSnapshotJson:
          '{"observedPatternMatches":true,"syntheticVariant":1}',
      }),
    }),
  })

  const changed =
    buildCrossScenarioConsistencyEvidenceSet([
      ...firstTwo,
      changedPacket,
    ]).groups[0]

  const assessment =
    assessHumanScenarioConsistencyReviewRecord(review, changed)

  assert.equal(assessment.state, 'STALE_REQUIRES_REVIEW')
  assert.ok(
    assessment.reasons.includes(
      'SCENARIO_CONSISTENCY_EVIDENCE_CHANGED',
    ),
  )
})

test('RP01.15 never creates cross-scenario inference, engineering authority, or production authority', () => {
  const f = baseFixture()
  const group = buildCrossScenarioConsistencyEvidenceSet([
    repeatabilityPacket(f, true, 40),
    repeatabilityPacket(f, false, 50),
  ]).groups[0]

  const review = recordHumanScenarioConsistencyReview(
    [],
    group,
    'CONFIRMED_CONSISTENT_ACROSS_REVIEWED_SIMULATION_SCENARIOS',
    'Reviewer',
    '2026-09-01T19:02:00+03:00',
    'Reviewed scenarios only.',
  ).record
  assert.ok(review)

  assert.equal(review.inferenceBeyondReviewedScenariosAllowed, false)
  assert.equal(review.engineeringRuleValidated, false)
  assert.equal(review.automaticRulePromotionAllowed, false)
  assert.equal(review.productionExecutable, false)
  assert.equal(review.machineInstructionGenerated, false)
  assert.equal(review.productionRuleCreated, false)
  assert.equal(review.productionUnlockAllowed, false)
  assert.equal(review.machineReady, false)
  assert.equal(review.productionApproved, false)

  const source = readFileSync(
    'src/realProduction/skyGlazingCrossScenarioConsistency.ts',
    'utf8',
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
