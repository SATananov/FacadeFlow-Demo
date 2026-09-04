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
  assessSimulationOutcomeValidationRecord,
  recordSimulationOutcomeValidation,
} from '../src/realProduction/skyGlazingSimulationOutcomeValidation'

const sampleDir = join(process.cwd(), 'local-samples', 'phase05a')
const names = readdirSync(sampleDir)
const xmlName = names.find((name) => extname(name).toLowerCase() === '.xml')
const lteName = names.find((name) => extname(name).toLowerCase() === '.lte')
if (!xmlName || !lteName) throw new Error('RP01.13 requires the locked Vadim XML/LTE sample pair.')

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
if (!baseCandidate) throw new Error('RP01.13 expected the repeated 78.01 cut candidate.')

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
    'RP01.13 fixture review.',
  )
  assert.equal(result.status, 'RECORDED')
  assert.ok(result.entry)
  return [...result.ledger.entries]
}

function fixture(inputValue = true) {
  const synthetic = cloneCandidate(baseCandidate, 'SYNTHETIC_TEST_PROJECT_B')
  const syntheticSet = candidateSet('SYNTHETIC_TEST_PROJECT_B', synthetic)
  const sets = [vadim, syntheticSet] as const
  const currentCandidates = [...vadim.candidates, synthetic]

  let reviews: ProductionPatternCandidateReviewLedgerEntry[] = []
  reviews = addReview(reviews, currentCandidates, baseCandidate, '2026-09-01T16:00:00+03:00')
  reviews = addReview(reviews, currentCandidates, synthetic, '2026-09-01T16:01:00+03:00')

  const cross = buildProductionPatternCrossProjectCorroboration(sets)
  const pattern = cross.patterns.find((item) =>
    item.profileCode === baseCandidate.profileCode
    && item.kind === baseCandidate.kind
    && item.sourcePatternKey === baseCandidate.sourcePatternKey)
  if (!pattern) throw new Error('RP01.13 synthetic corroboration missing.')

  const promotionGate = assessCrossProjectHumanPromotionGate(pattern, sets, reviews)
  const promotionReview = recordHumanPromotionReview(
    [],
    promotionGate,
    'APPROVED_FOR_RULE_DRAFT',
    'Human engineer',
    '2026-09-01T16:02:00+03:00',
    'Permit draft review.',
  ).record
  assert.ok(promotionReview)

  const sourceDraft = createNonExecutableRuleDraft(
    promotionReview,
    promotionGate,
    'WP78 proposal',
    'Explicit proposal.',
    '2026-09-01T16:03:00+03:00',
  ).artifact
  assert.ok(sourceDraft)

  const engineeringValidation = recordRuleDraftEngineeringValidation(
    [],
    sourceDraft,
    promotionReview,
    promotionGate,
    'VALIDATED_FOR_ENGINEERING_CONTEXT',
    'Engineer validator',
    '2026-09-01T16:04:00+03:00',
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
    '2026-09-01T16:05:00+03:00',
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
    '2026-09-01T16:06:00+03:00',
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
    '2026-09-01T16:07:00+03:00',
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
  assert.equal(simulationGate.state, 'ELIGIBLE_FOR_LOCAL_SIMULATION_EXECUTION')

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

  const dryRun = executeLocalSimulationDryRun(
    adapter,
    simulationGate,
    simulationValidation,
    executableDraft,
    executableReview,
    executableReviewGate,
    engineeringValidation,
    sourceDraft,
    promotionReview,
    promotionGate,
    { observedPatternMatches: inputValue },
    '2026-09-01T16:08:00+03:00',
  ).record
  assert.ok(dryRun)

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
    dryRun,
  }
}

test('RP01.13 real Vadim-only corpus remains blocked upstream', () => {
  const cross = buildProductionPatternCrossProjectCorroboration([vadim])
  const gates = buildCrossProjectHumanPromotionGateAssessmentSet(
    cross,
    [vadim],
    [],
  )
  assert.equal(gates.assessmentCount, 74)
  assert.equal(gates.eligibleForHumanPromotionReviewCount, 0)
})

test('RP01.13 records human validation of an expected dry-run outcome', () => {
  const f = fixture(true)
  const result = recordSimulationOutcomeValidation(
    [],
    f.dryRun,
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
    true,
    'Simulation outcome reviewer',
    '2026-09-01T16:09:00+03:00',
    'Observed result matches the expected dry-run outcome.',
  )

  assert.equal(result.status, 'RECORDED')
  assert.ok(result.record)
  assert.equal(result.record.validationScope, 'SIMULATION_OUTCOME_ONLY')
  assert.equal(result.record.simulationOutcomeValidated, true)
  assert.equal(result.record.dryRunResult, true)
  assert.equal(result.record.expectedResult, true)
  assert.equal(result.record.engineeringRuleValidated, false)
})

test('RP01.13 refuses a positive validation when the stated expected result contradicts the dry-run', () => {
  const f = fixture(false)
  const result = recordSimulationOutcomeValidation(
    [],
    f.dryRun,
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
    true,
    'Simulation outcome reviewer',
    '2026-09-01T16:10:00+03:00',
    'Contradictory expectation must be rejected.',
  )

  assert.equal(result.status, 'NOT_RECORDED')
  assert.deepEqual(result.reasons, ['EXPECTED_RESULT_MISMATCH'])
})

test('RP01.13 explicit rejection is recordable as simulation-only audit evidence', () => {
  const f = fixture(false)
  const result = recordSimulationOutcomeValidation(
    [],
    f.dryRun,
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
    'REJECTED_SIMULATION_OUTCOME',
    true,
    'Simulation outcome reviewer',
    '2026-09-01T16:11:00+03:00',
    'Dry-run result is not accepted for the reviewed scenario.',
  )

  assert.equal(result.status, 'RECORDED')
  assert.ok(result.record)
  assert.equal(result.record.simulationOutcomeValidated, false)
  assert.equal(result.record.simulationOutcomeRejected, true)
})

test('RP01.13 requires validator metadata', () => {
  const f = fixture(true)
  const result = recordSimulationOutcomeValidation(
    [],
    f.dryRun,
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
    true,
    '',
    '',
    '',
  )

  assert.deepEqual(result.reasons, [
    'VALIDATOR_REQUIRED',
    'VALIDATION_TIMESTAMP_REQUIRED',
    'RATIONALE_REQUIRED',
  ])
})

test('RP01.13 blocks duplicate review for identical dry-run evidence', () => {
  const f = fixture(true)
  const first = recordSimulationOutcomeValidation(
    [],
    f.dryRun,
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
    true,
    'Reviewer',
    '2026-09-01T16:12:00+03:00',
    'First review.',
  ).record
  assert.ok(first)

  const duplicate = recordSimulationOutcomeValidation(
    [first],
    f.dryRun,
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
    'REJECTED_SIMULATION_OUTCOME',
    false,
    'Second reviewer',
    '2026-09-01T16:13:00+03:00',
    'Must not overwrite current review.',
  )

  assert.equal(duplicate.status, 'NOT_RECORDED')
  assert.deepEqual(
    duplicate.reasons,
    ['CURRENT_OUTCOME_VALIDATION_ALREADY_RECORDED'],
  )
})

test('RP01.13 marks validation stale when dry-run result evidence changes', () => {
  const f = fixture(true)
  const validation = recordSimulationOutcomeValidation(
    [],
    f.dryRun,
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
    true,
    'Reviewer',
    '2026-09-01T16:14:00+03:00',
    'Bound to exact dry-run evidence.',
  ).record
  assert.ok(validation)

  const changedDryRun = Object.freeze({
    ...f.dryRun,
    result: false,
  })

  const assessment = assessSimulationOutcomeValidationRecord(
    validation,
    changedDryRun,
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
  )

  assert.equal(assessment.state, 'STALE_REQUIRES_REVIEW')
  assert.ok(
    assessment.reasons.includes(
      'DRY_RUN_OR_EXECUTION_FINGERPRINT_CHANGED',
    ),
  )
})

test('RP01.13 never promotes simulation outcome validation into engineering or production authority', () => {
  const f = fixture(true)
  const result = recordSimulationOutcomeValidation(
    [],
    f.dryRun,
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
    true,
    'Reviewer',
    '2026-09-01T16:15:00+03:00',
    'Safety boundary.',
  )
  assert.ok(result.record)

  assert.equal(result.record.engineeringRuleValidated, false)
  assert.equal(result.record.productionExecutable, false)
  assert.equal(result.record.machineInstructionGenerated, false)
  assert.equal(result.record.automaticMachineTranslationAllowed, false)
  assert.equal(result.record.productionRuleCreated, false)
  assert.equal(result.record.productionUnlockAllowed, false)
  assert.equal(result.record.machineReady, false)
  assert.equal(result.record.productionApproved, false)

  const source = readFileSync(
    'src/realProduction/skyGlazingSimulationOutcomeValidation.ts',
    'utf8',
  )
  assert.doesNotMatch(source, /engineeringRuleValidated:\s*true/)
  assert.doesNotMatch(source, /productionExecutable:\s*true/)
  assert.doesNotMatch(source, /machineInstructionGenerated:\s*true/)
  assert.doesNotMatch(source, /automaticMachineTranslationAllowed:\s*true/)
  assert.doesNotMatch(source, /productionRuleCreated:\s*true/)
  assert.doesNotMatch(source, /productionUnlockAllowed:\s*true/)
  assert.doesNotMatch(source, /machineReady:\s*true/)
  assert.doesNotMatch(source, /productionApproved:\s*true/)
})
