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

const sampleDir = join(process.cwd(), 'local-samples', 'phase05a')
const names = readdirSync(sampleDir)
const xmlName = names.find((name) => extname(name).toLowerCase() === '.xml')
const lteName = names.find((name) => extname(name).toLowerCase() === '.lte')
if (!xmlName || !lteName) throw new Error('RP01.12 requires the locked Vadim XML/LTE sample pair.')

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
if (!baseCandidate) throw new Error('RP01.12 expected the repeated 78.01 cut candidate.')

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
    'RP01.12 fixture review.',
  )
  assert.equal(result.status, 'RECORDED')
  assert.ok(result.entry)
  return [...result.ledger.entries]
}

function fixture(
  executableExpression = 'return observedPatternMatches === true',
) {
  const synthetic = cloneCandidate(baseCandidate, 'SYNTHETIC_TEST_PROJECT_B')
  const syntheticSet = candidateSet('SYNTHETIC_TEST_PROJECT_B', synthetic)
  const sets = [vadim, syntheticSet] as const
  const currentCandidates = [...vadim.candidates, synthetic]
  let reviews: ProductionPatternCandidateReviewLedgerEntry[] = []
  reviews = addReview(reviews, currentCandidates, baseCandidate, '2026-09-01T15:00:00+03:00')
  reviews = addReview(reviews, currentCandidates, synthetic, '2026-09-01T15:01:00+03:00')

  const cross = buildProductionPatternCrossProjectCorroboration(sets)
  const pattern = cross.patterns.find((item) =>
    item.profileCode === baseCandidate.profileCode
    && item.kind === baseCandidate.kind
    && item.sourcePatternKey === baseCandidate.sourcePatternKey)
  if (!pattern) throw new Error('RP01.12 synthetic corroboration missing.')

  const promotionGate = assessCrossProjectHumanPromotionGate(pattern, sets, reviews)
  assert.equal(promotionGate.state, 'ELIGIBLE_FOR_HUMAN_PROMOTION_REVIEW')

  const promotionReview = recordHumanPromotionReview(
    [],
    promotionGate,
    'APPROVED_FOR_RULE_DRAFT',
    'Human engineer',
    '2026-09-01T15:02:00+03:00',
    'Permit draft review.',
  ).record
  assert.ok(promotionReview)

  const sourceDraft = createNonExecutableRuleDraft(
    promotionReview,
    promotionGate,
    'WP78 proposal',
    'Explicit proposal.',
    '2026-09-01T15:03:00+03:00',
  ).artifact
  assert.ok(sourceDraft)

  const engineeringValidation = recordRuleDraftEngineeringValidation(
    [],
    sourceDraft,
    promotionReview,
    promotionGate,
    'VALIDATED_FOR_ENGINEERING_CONTEXT',
    'Engineer validator',
    '2026-09-01T15:04:00+03:00',
    'Simulation context',
    'Engineering-context validation only.',
  ).record
  assert.ok(engineeringValidation)

  const reviewGate = assessExecutableRuleReviewGate(
    engineeringValidation,
    sourceDraft,
    promotionReview,
    promotionGate,
  )
  assert.equal(reviewGate.state, 'ELIGIBLE_FOR_EXECUTABLE_RULE_REVIEW')

  const executableReview = recordHumanExecutableRuleReview(
    [],
    reviewGate,
    engineeringValidation,
    sourceDraft,
    promotionReview,
    promotionGate,
    'APPROVED_FOR_NON_PRODUCTION_EXECUTABLE_DRAFT',
    'Executable reviewer',
    '2026-09-01T15:05:00+03:00',
    'Local sandbox only',
    'Simulation-only approval.',
  ).record
  assert.ok(executableReview)

  const executableDraft = createNonProductionExecutableRuleDraft(
    executableReview,
    reviewGate,
    engineeringValidation,
    sourceDraft,
    promotionReview,
    promotionGate,
    'Simulation draft',
    executableExpression,
    'Local sandbox only',
    '2026-09-01T15:06:00+03:00',
  ).artifact
  assert.ok(executableDraft)

  const simulationValidation = recordSimulationValidation(
    [],
    executableDraft,
    executableReview,
    reviewGate,
    engineeringValidation,
    sourceDraft,
    promotionReview,
    promotionGate,
    'VALIDATED_FOR_SIMULATION_EXECUTION',
    'Simulation validator',
    '2026-09-01T15:07:00+03:00',
    'Local deterministic sandbox',
    'Validate local dry-run only.',
  ).record
  assert.ok(simulationValidation)

  const simulationGate = assessSimulationExecutionGate(
    simulationValidation,
    executableDraft,
    executableReview,
    reviewGate,
    engineeringValidation,
    sourceDraft,
    promotionReview,
    promotionGate,
  )
  assert.equal(
    simulationGate.state,
    'ELIGIBLE_FOR_LOCAL_SIMULATION_EXECUTION',
  )

  return {
    promotionGate,
    promotionReview,
    sourceDraft,
    engineeringValidation,
    reviewGate,
    executableReview,
    executableDraft,
    simulationValidation,
    simulationGate,
  }
}

function adapterFor(f: ReturnType<typeof fixture>) {
  const result = createLocalSimulationRuntimeAdapter(
    f.simulationGate,
    f.simulationValidation,
    f.executableDraft,
    f.executableReview,
    f.reviewGate,
    f.engineeringValidation,
    f.sourceDraft,
    f.promotionReview,
    f.promotionGate,
  )
  assert.equal(result.status, 'CREATED')
  assert.ok(result.adapter)
  return result.adapter
}

test('RP01.12 real Vadim-only corpus remains blocked upstream', () => {
  const cross = buildProductionPatternCrossProjectCorroboration([vadim])
  const gates = buildCrossProjectHumanPromotionGateAssessmentSet(
    cross,
    [vadim],
    [],
  )
  assert.equal(gates.assessmentCount, 74)
  assert.equal(gates.eligibleForHumanPromotionReviewCount, 0)
})

test('RP01.12 creates a local dry-run-only runtime adapter', () => {
  const adapter = adapterFor(fixture())
  assert.equal(adapter.runtimeAdapterCreated, true)
  assert.equal(adapter.localOnly, true)
  assert.equal(adapter.dryRunOnly, true)
  assert.equal(adapter.sideEffectsAllowed, false)
  assert.equal(adapter.dynamicCodeEvaluationAllowed, false)
  assert.equal(adapter.networkAccessAllowed, false)
  assert.equal(adapter.fileSystemAccessAllowed, false)
  assert.equal(adapter.processAccessAllowed, false)
  assert.equal(adapter.productionExecutable, false)
})

test('RP01.12 evaluates the allowlisted strict-equality expression', () => {
  const f = fixture()
  const adapter = adapterFor(f)
  const result = executeLocalSimulationDryRun(
    adapter,
    f.simulationGate,
    f.simulationValidation,
    f.executableDraft,
    f.executableReview,
    f.reviewGate,
    f.engineeringValidation,
    f.sourceDraft,
    f.promotionReview,
    f.promotionGate,
    { observedPatternMatches: true },
    '2026-09-01T15:08:00+03:00',
  )
  assert.equal(result.status, 'EXECUTED')
  assert.ok(result.record)
  assert.equal(result.record.result, true)
  assert.equal(result.record.localSimulationExecutionCompleted, true)
})

test('RP01.12 a false predicate result is still a completed dry-run', () => {
  const f = fixture()
  const adapter = adapterFor(f)
  const result = executeLocalSimulationDryRun(
    adapter,
    f.simulationGate,
    f.simulationValidation,
    f.executableDraft,
    f.executableReview,
    f.reviewGate,
    f.engineeringValidation,
    f.sourceDraft,
    f.promotionReview,
    f.promotionGate,
    { observedPatternMatches: false },
    '2026-09-01T15:09:00+03:00',
  )
  assert.equal(result.status, 'EXECUTED')
  assert.ok(result.record)
  assert.equal(result.record.result, false)
})

test('RP01.12 rejects arbitrary-code-like expressions instead of evaluating them', () => {
  const f = fixture('return fetch("https://example.com")')
  const adapter = adapterFor(f)
  const result = executeLocalSimulationDryRun(
    adapter,
    f.simulationGate,
    f.simulationValidation,
    f.executableDraft,
    f.executableReview,
    f.reviewGate,
    f.engineeringValidation,
    f.sourceDraft,
    f.promotionReview,
    f.promotionGate,
    {},
    '2026-09-01T15:10:00+03:00',
  )
  assert.equal(result.status, 'NOT_EXECUTED')
  assert.deepEqual(result.reasons, ['UNSUPPORTED_SIMULATION_EXPRESSION'])
})

test('RP01.12 refuses execution when the referenced input is missing', () => {
  const f = fixture()
  const adapter = adapterFor(f)
  const result = executeLocalSimulationDryRun(
    adapter,
    f.simulationGate,
    f.simulationValidation,
    f.executableDraft,
    f.executableReview,
    f.reviewGate,
    f.engineeringValidation,
    f.sourceDraft,
    f.promotionReview,
    f.promotionGate,
    {},
    '2026-09-01T15:11:00+03:00',
  )
  assert.equal(result.status, 'NOT_EXECUTED')
  assert.deepEqual(result.reasons, ['SIMULATION_INPUT_IDENTIFIER_MISSING'])
})

test('RP01.12 blocks a stale adapter after draft evidence changes', () => {
  const f = fixture()
  const adapter = adapterFor(f)
  const changedDraft = Object.freeze({
    ...f.executableDraft,
    executableExpression: 'return observedPatternMatches !== true',
  })
  const result = executeLocalSimulationDryRun(
    adapter,
    f.simulationGate,
    f.simulationValidation,
    changedDraft,
    f.executableReview,
    f.reviewGate,
    f.engineeringValidation,
    f.sourceDraft,
    f.promotionReview,
    f.promotionGate,
    { observedPatternMatches: true },
    '2026-09-01T15:12:00+03:00',
  )
  assert.equal(result.status, 'NOT_EXECUTED')
  assert.ok(result.reasons.includes('RUNTIME_ADAPTER_NOT_CURRENT'))
  assert.ok(result.reasons.includes('SIMULATION_GATE_NOT_ELIGIBLE'))
})

test('RP01.12 dry-run stays side-effect free and non-production', () => {
  const f = fixture()
  const adapter = adapterFor(f)
  const result = executeLocalSimulationDryRun(
    adapter,
    f.simulationGate,
    f.simulationValidation,
    f.executableDraft,
    f.executableReview,
    f.reviewGate,
    f.engineeringValidation,
    f.sourceDraft,
    f.promotionReview,
    f.promotionGate,
    { z: 3, observedPatternMatches: true, a: 'x' },
    '2026-09-01T15:13:00+03:00',
  )
  assert.ok(result.record)
  assert.deepEqual(
    Object.keys(result.record.inputSnapshot),
    ['a', 'observedPatternMatches', 'z'],
  )
  assert.equal(result.record.sideEffectsObserved, false)
  assert.equal(result.record.dynamicCodeEvaluationUsed, false)
  assert.equal(result.record.networkAccessUsed, false)
  assert.equal(result.record.fileSystemAccessUsed, false)
  assert.equal(result.record.processAccessUsed, false)
  assert.equal(result.record.machineInstructionGenerated, false)
  assert.equal(result.record.automaticMachineTranslationAllowed, false)
  assert.equal(result.record.productionExecutable, false)
  assert.equal(result.record.productionRuleCreated, false)
  assert.equal(result.record.productionUnlockAllowed, false)
  assert.equal(result.record.machineReady, false)
  assert.equal(result.record.productionApproved, false)

  const source = readFileSync(
    'src/realProduction/skyGlazingLocalSimulationRuntime.ts',
    'utf8',
  )
  assert.doesNotMatch(source, /\beval\s*\(/)
  assert.doesNotMatch(source, /\bnew\s+Function\b/)
  assert.doesNotMatch(source, /child_process/)
  assert.doesNotMatch(source, /machineInstructionGenerated:\s*true/)
  assert.doesNotMatch(source, /productionExecutable:\s*true/)
  assert.doesNotMatch(source, /productionUnlockAllowed:\s*true/)
  assert.doesNotMatch(source, /machineReady:\s*true/)
  assert.doesNotMatch(source, /productionApproved:\s*true/)
})
