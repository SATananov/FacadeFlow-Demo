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
  assessHumanSimulationRepeatabilityReviewRecord,
  buildSimulationRepeatabilityEvidenceSet,
  recordHumanSimulationRepeatabilityReview,
  type SimulationOutcomeEvidencePacket,
} from '../src/realProduction/skyGlazingSimulationRepeatability'

const sampleDir = join(process.cwd(), 'local-samples', 'phase05a')
const names = readdirSync(sampleDir)
const xmlName = names.find((name) => extname(name).toLowerCase() === '.xml')
const lteName = names.find((name) => extname(name).toLowerCase() === '.lte')
if (!xmlName || !lteName) throw new Error('RP01.14 requires the locked Vadim XML/LTE sample pair.')

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
if (!baseCandidate) throw new Error('RP01.14 expected the repeated 78.01 cut candidate.')

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
    'RP01.14 fixture review.',
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
  reviews = addReview(reviews, currentCandidates, baseCandidate, '2026-09-01T17:00:00+03:00')
  reviews = addReview(reviews, currentCandidates, synthetic, '2026-09-01T17:01:00+03:00')

  const cross = buildProductionPatternCrossProjectCorroboration(sets)
  const pattern = cross.patterns.find((item) =>
    item.profileCode === baseCandidate.profileCode
    && item.kind === baseCandidate.kind
    && item.sourcePatternKey === baseCandidate.sourcePatternKey)
  if (!pattern) throw new Error('RP01.14 synthetic corroboration missing.')

  const promotionGate = assessCrossProjectHumanPromotionGate(pattern, sets, reviews)
  const promotionReview = recordHumanPromotionReview(
    [],
    promotionGate,
    'APPROVED_FOR_RULE_DRAFT',
    'Human engineer',
    '2026-09-01T17:02:00+03:00',
    'Permit draft review.',
  ).record
  assert.ok(promotionReview)

  const sourceDraft = createNonExecutableRuleDraft(
    promotionReview,
    promotionGate,
    'WP78 proposal',
    'Explicit proposal.',
    '2026-09-01T17:03:00+03:00',
  ).artifact
  assert.ok(sourceDraft)

  const engineeringValidation = recordRuleDraftEngineeringValidation(
    [],
    sourceDraft,
    promotionReview,
    promotionGate,
    'VALIDATED_FOR_ENGINEERING_CONTEXT',
    'Engineer validator',
    '2026-09-01T17:04:00+03:00',
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
    '2026-09-01T17:05:00+03:00',
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
    '2026-09-01T17:06:00+03:00',
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
    '2026-09-01T17:07:00+03:00',
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
  executedAt: string,
  validatedAt: string,
  inputValue: boolean,
  decision:
    | 'VALIDATED_AS_EXPECTED_SIMULATION_OUTCOME'
    | 'REJECTED_SIMULATION_OUTCOME' =
      'VALIDATED_AS_EXPECTED_SIMULATION_OUTCOME',
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

  const outcomeValidation = recordSimulationOutcomeValidation(
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
    decision,
    inputValue,
    'Outcome reviewer',
    validatedAt,
    decision === 'VALIDATED_AS_EXPECTED_SIMULATION_OUTCOME'
      ? 'Expected outcome confirmed.'
      : 'Repeatability evidence rejected.',
  ).record
  assert.ok(outcomeValidation)

  return Object.freeze({
    outcomeValidation,
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

test('RP01.14 real Vadim-only corpus remains blocked upstream', () => {
  const cross = buildProductionPatternCrossProjectCorroboration([vadim])
  const gates = buildCrossProjectHumanPromotionGateAssessmentSet(
    cross,
    [vadim],
    [],
  )
  assert.equal(gates.assessmentCount, 74)
  assert.equal(gates.eligibleForHumanPromotionReviewCount, 0)
})

test('RP01.14 one reviewed dry-run is insufficient repeatability evidence', () => {
  const f = baseFixture()
  const packet = outcomePacket(
    f,
    '2026-09-01T17:08:00+03:00',
    '2026-09-01T17:09:00+03:00',
    true,
  )

  const set = buildSimulationRepeatabilityEvidenceSet([packet])
  assert.equal(set.groupCount, 1)
  assert.equal(set.insufficientEvidenceGroupCount, 1)
  assert.equal(
    set.groups[0].state,
    'INSUFFICIENT_REPEATABILITY_EVIDENCE',
  )
  assert.equal(set.groups[0].repeatabilityCandidate, false)
})

test('RP01.14 two independent current validations for the same scenario create only a repeatability candidate', () => {
  const f = baseFixture()
  const packets = [
    outcomePacket(
      f,
      '2026-09-01T17:10:00+03:00',
      '2026-09-01T17:11:00+03:00',
      true,
    ),
    outcomePacket(
      f,
      '2026-09-01T17:12:00+03:00',
      '2026-09-01T17:13:00+03:00',
      true,
    ),
  ]

  const set = buildSimulationRepeatabilityEvidenceSet(packets)
  const group = set.groups[0]

  assert.equal(set.candidateRepeatableGroupCount, 1)
  assert.equal(group.state, 'CANDIDATE_REPEATABLE_OUTCOME')
  assert.equal(group.distinctDryRunCount, 2)
  assert.equal(group.currentValidatedOutcomeCount, 2)
  assert.deepEqual(group.observedResults, [true])
  assert.deepEqual(group.expectedResults, [true])
  assert.equal(group.humanRepeatabilityReviewRequired, true)
  assert.equal(group.engineeringRuleValidated, false)
})

test('RP01.14 different input scenario is not merged into the same repeatability group', () => {
  const f = baseFixture()
  const packets = [
    outcomePacket(
      f,
      '2026-09-01T17:14:00+03:00',
      '2026-09-01T17:15:00+03:00',
      true,
    ),
    outcomePacket(
      f,
      '2026-09-01T17:16:00+03:00',
      '2026-09-01T17:17:00+03:00',
      false,
    ),
  ]

  const set = buildSimulationRepeatabilityEvidenceSet(packets)
  assert.equal(set.groupCount, 2)
  assert.equal(set.insufficientEvidenceGroupCount, 2)
})

test('RP01.14 a current rejection prevents repeatable-candidate classification', () => {
  const f = baseFixture()
  const packets = [
    outcomePacket(
      f,
      '2026-09-01T17:18:00+03:00',
      '2026-09-01T17:19:00+03:00',
      true,
    ),
    outcomePacket(
      f,
      '2026-09-01T17:20:00+03:00',
      '2026-09-01T17:21:00+03:00',
      true,
    ),
    outcomePacket(
      f,
      '2026-09-01T17:22:00+03:00',
      '2026-09-01T17:23:00+03:00',
      true,
      'REJECTED_SIMULATION_OUTCOME',
    ),
  ]

  const group = buildSimulationRepeatabilityEvidenceSet(packets).groups[0]
  assert.equal(group.state, 'CONFLICTING_REPEATABILITY_EVIDENCE')
  assert.equal(group.currentRejectedOutcomeCount, 1)
})

test('RP01.14 human repeatability review is recordable only for candidate evidence', () => {
  const f = baseFixture()
  const packets = [
    outcomePacket(
      f,
      '2026-09-01T17:24:00+03:00',
      '2026-09-01T17:25:00+03:00',
      true,
    ),
    outcomePacket(
      f,
      '2026-09-01T17:26:00+03:00',
      '2026-09-01T17:27:00+03:00',
      true,
    ),
  ]
  const group = buildSimulationRepeatabilityEvidenceSet(packets).groups[0]

  const review = recordHumanSimulationRepeatabilityReview(
    [],
    group,
    'CONFIRMED_REPEATABLE_FOR_SIMULATION_CONTEXT',
    'Repeatability reviewer',
    '2026-09-01T17:28:00+03:00',
    'Repeated dry-runs are consistent for this exact simulation scenario.',
  )

  assert.equal(review.status, 'RECORDED')
  assert.ok(review.record)
  assert.equal(
    review.record.repeatabilityConfirmedForSimulationContext,
    true,
  )
  assert.equal(review.record.crossScenarioInferenceAllowed, false)
  assert.equal(review.record.engineeringRuleValidated, false)
})

test('RP01.14 repeatability review becomes stale when evidence changes', () => {
  const f = baseFixture()
  const firstTwo = [
    outcomePacket(
      f,
      '2026-09-01T17:29:00+03:00',
      '2026-09-01T17:30:00+03:00',
      true,
    ),
    outcomePacket(
      f,
      '2026-09-01T17:31:00+03:00',
      '2026-09-01T17:32:00+03:00',
      true,
    ),
  ]
  const originalGroup =
    buildSimulationRepeatabilityEvidenceSet(firstTwo).groups[0]

  const review = recordHumanSimulationRepeatabilityReview(
    [],
    originalGroup,
    'CONFIRMED_REPEATABLE_FOR_SIMULATION_CONTEXT',
    'Repeatability reviewer',
    '2026-09-01T17:33:00+03:00',
    'Bound to current evidence.',
  ).record
  assert.ok(review)

  const third = outcomePacket(
    f,
    '2026-09-01T17:34:00+03:00',
    '2026-09-01T17:35:00+03:00',
    true,
  )
  const changedGroup =
    buildSimulationRepeatabilityEvidenceSet([...firstTwo, third]).groups[0]

  const assessment =
    assessHumanSimulationRepeatabilityReviewRecord(
      review,
      changedGroup,
    )

  assert.equal(assessment.state, 'STALE_REQUIRES_REVIEW')
  assert.ok(
    assessment.reasons.includes('REPEATABILITY_EVIDENCE_CHANGED'),
  )
})

test('RP01.14 never converts repeatability evidence into engineering or production authority', () => {
  const f = baseFixture()
  const packets = [
    outcomePacket(
      f,
      '2026-09-01T17:36:00+03:00',
      '2026-09-01T17:37:00+03:00',
      true,
    ),
    outcomePacket(
      f,
      '2026-09-01T17:38:00+03:00',
      '2026-09-01T17:39:00+03:00',
      true,
    ),
  ]
  const group = buildSimulationRepeatabilityEvidenceSet(packets).groups[0]
  const review = recordHumanSimulationRepeatabilityReview(
    [],
    group,
    'CONFIRMED_REPEATABLE_FOR_SIMULATION_CONTEXT',
    'Reviewer',
    '2026-09-01T17:40:00+03:00',
    'Simulation context only.',
  ).record
  assert.ok(review)

  assert.equal(review.engineeringRuleValidated, false)
  assert.equal(review.automaticRulePromotionAllowed, false)
  assert.equal(review.productionExecutable, false)
  assert.equal(review.machineInstructionGenerated, false)
  assert.equal(review.productionRuleCreated, false)
  assert.equal(review.productionUnlockAllowed, false)
  assert.equal(review.machineReady, false)
  assert.equal(review.productionApproved, false)

  const source = readFileSync(
    'src/realProduction/skyGlazingSimulationRepeatability.ts',
    'utf8',
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
