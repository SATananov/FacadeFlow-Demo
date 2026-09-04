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
  assessSimulationValidationRecord,
  recordSimulationValidation,
  simulationDraftEvidenceFingerprint,
} from '../src/realProduction/skyGlazingSimulationExecutionGate'

const sampleDir = join(process.cwd(), 'local-samples', 'phase05a')
const names = readdirSync(sampleDir)
const xmlName = names.find((name) => extname(name).toLowerCase() === '.xml')
const lteName = names.find((name) => extname(name).toLowerCase() === '.lte')
if (!xmlName || !lteName) throw new Error('RP01.11 requires the locked Vadim XML/LTE sample pair.')

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
if (!baseCandidate) throw new Error('RP01.11 expected the repeated 78.01 cut candidate.')

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
    'RP01.11 fixture review.',
  )
  assert.equal(result.status, 'RECORDED')
  assert.ok(result.entry)
  return [...result.ledger.entries]
}

function fixture() {
  const synthetic = cloneCandidate(baseCandidate, 'SYNTHETIC_TEST_PROJECT_B')
  const syntheticSet = candidateSet('SYNTHETIC_TEST_PROJECT_B', synthetic)
  const sets = [vadim, syntheticSet] as const
  const currentCandidates = [...vadim.candidates, synthetic]
  let reviews: ProductionPatternCandidateReviewLedgerEntry[] = []
  reviews = addReview(reviews, currentCandidates, baseCandidate, '2026-09-01T14:00:00+03:00')
  reviews = addReview(reviews, currentCandidates, synthetic, '2026-09-01T14:01:00+03:00')

  const cross = buildProductionPatternCrossProjectCorroboration(sets)
  const pattern = cross.patterns.find((item) =>
    item.profileCode === baseCandidate.profileCode
    && item.kind === baseCandidate.kind
    && item.sourcePatternKey === baseCandidate.sourcePatternKey)
  if (!pattern) throw new Error('RP01.11 synthetic cross-project pattern missing.')

  const promotionGate = assessCrossProjectHumanPromotionGate(pattern, sets, reviews)
  assert.equal(promotionGate.state, 'ELIGIBLE_FOR_HUMAN_PROMOTION_REVIEW')

  const promotionReview = recordHumanPromotionReview(
    [],
    promotionGate,
    'APPROVED_FOR_RULE_DRAFT',
    'Human engineer',
    '2026-09-01T14:02:00+03:00',
    'Permit draft review.',
  ).record
  assert.ok(promotionReview)

  const sourceDraft = createNonExecutableRuleDraft(
    promotionReview,
    promotionGate,
    'WP78 proposal',
    'Explicit proposal.',
    '2026-09-01T14:03:00+03:00',
  ).artifact
  assert.ok(sourceDraft)

  const engineeringValidation = recordRuleDraftEngineeringValidation(
    [],
    sourceDraft,
    promotionReview,
    promotionGate,
    'VALIDATED_FOR_ENGINEERING_CONTEXT',
    'Engineer validator',
    '2026-09-01T14:04:00+03:00',
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
    '2026-09-01T14:05:00+03:00',
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
    'return observedPatternMatches === true',
    'Local sandbox only',
    '2026-09-01T14:06:00+03:00',
  ).artifact
  assert.ok(executableDraft)

  return {
    promotionGate,
    promotionReview,
    sourceDraft,
    engineeringValidation,
    reviewGate,
    executableReview,
    executableDraft,
  }
}

test('RP01.11 real Vadim-only corpus remains blocked upstream', () => {
  const cross = buildProductionPatternCrossProjectCorroboration([vadim])
  const gates = buildCrossProjectHumanPromotionGateAssessmentSet(cross, [vadim], [])
  assert.equal(gates.assessmentCount, 74)
  assert.equal(gates.eligibleForHumanPromotionReviewCount, 0)
})

test('RP01.11 records simulation validation and preserves fingerprint', () => {
  const f = fixture()
  const result = recordSimulationValidation(
    [],
    f.executableDraft,
    f.executableReview,
    f.reviewGate,
    f.engineeringValidation,
    f.sourceDraft,
    f.promotionReview,
    f.promotionGate,
    'VALIDATED_FOR_SIMULATION_EXECUTION',
    'Simulation validator',
    '2026-09-01T14:07:00+03:00',
    'Local deterministic sandbox',
    'Validate local simulation only.',
  )
  assert.equal(result.status, 'RECORDED')
  assert.ok(result.record)
  assert.equal(result.record.validationScope, 'LOCAL_SIMULATION_ONLY')
  assert.equal(result.record.simulationExecutionValidated, true)
  assert.equal(result.record.productionExecutable, false)
  assert.deepEqual(
    result.record.draftFingerprint,
    simulationDraftEvidenceFingerprint(
      f.executableDraft,
      f.executableReview,
      f.reviewGate,
      f.engineeringValidation,
      f.sourceDraft,
      f.promotionReview,
      f.promotionGate,
    ),
  )
})

test('RP01.11 requires validator metadata', () => {
  const f = fixture()
  const result = recordSimulationValidation(
    [],
    f.executableDraft,
    f.executableReview,
    f.reviewGate,
    f.engineeringValidation,
    f.sourceDraft,
    f.promotionReview,
    f.promotionGate,
    'VALIDATED_FOR_SIMULATION_EXECUTION',
    '',
    '',
    '',
    '',
  )
  assert.deepEqual(result.reasons, [
    'VALIDATOR_REQUIRED',
    'VALIDATION_TIMESTAMP_REQUIRED',
    'SIMULATION_CONTEXT_REQUIRED',
    'RATIONALE_REQUIRED',
  ])
})

test('RP01.11 rejection keeps simulation execution blocked', () => {
  const f = fixture()
  const validation = recordSimulationValidation(
    [],
    f.executableDraft,
    f.executableReview,
    f.reviewGate,
    f.engineeringValidation,
    f.sourceDraft,
    f.promotionReview,
    f.promotionGate,
    'REJECTED_FOR_SIMULATION_EXECUTION',
    'Simulation validator',
    '2026-09-01T14:08:00+03:00',
    'Local sandbox',
    'Reject.',
  ).record
  assert.ok(validation)

  const gate = assessSimulationExecutionGate(
    validation,
    f.executableDraft,
    f.executableReview,
    f.reviewGate,
    f.engineeringValidation,
    f.sourceDraft,
    f.promotionReview,
    f.promotionGate,
  )
  assert.equal(gate.state, 'BLOCKED')
  assert.ok(gate.reasons.includes('SIMULATION_EXECUTION_NOT_VALIDATED'))
})

test('RP01.11 blocks duplicate validation of identical current evidence', () => {
  const f = fixture()
  const first = recordSimulationValidation(
    [],
    f.executableDraft,
    f.executableReview,
    f.reviewGate,
    f.engineeringValidation,
    f.sourceDraft,
    f.promotionReview,
    f.promotionGate,
    'VALIDATED_FOR_SIMULATION_EXECUTION',
    'Validator',
    '2026-09-01T14:09:00+03:00',
    'Sandbox',
    'First.',
  ).record
  assert.ok(first)

  const duplicate = recordSimulationValidation(
    [first],
    f.executableDraft,
    f.executableReview,
    f.reviewGate,
    f.engineeringValidation,
    f.sourceDraft,
    f.promotionReview,
    f.promotionGate,
    'REJECTED_FOR_SIMULATION_EXECUTION',
    'Validator 2',
    '2026-09-01T14:10:00+03:00',
    'Sandbox',
    'Duplicate.',
  )
  assert.deepEqual(
    duplicate.reasons,
    ['CURRENT_SIMULATION_VALIDATION_ALREADY_RECORDED'],
  )
})

test('RP01.11 invalidates validation after executable expression changes', () => {
  const f = fixture()
  const validation = recordSimulationValidation(
    [],
    f.executableDraft,
    f.executableReview,
    f.reviewGate,
    f.engineeringValidation,
    f.sourceDraft,
    f.promotionReview,
    f.promotionGate,
    'VALIDATED_FOR_SIMULATION_EXECUTION',
    'Validator',
    '2026-09-01T14:11:00+03:00',
    'Sandbox',
    'Bound to expression.',
  ).record
  assert.ok(validation)

  const changed = Object.freeze({
    ...f.executableDraft,
    executableExpression: 'return false',
  })
  const assessment = assessSimulationValidationRecord(
    validation,
    changed,
    f.executableReview,
    f.reviewGate,
    f.engineeringValidation,
    f.sourceDraft,
    f.promotionReview,
    f.promotionGate,
  )
  assert.equal(assessment.state, 'STALE_REQUIRES_REVIEW')
  assert.ok(
    assessment.reasons.includes('EXECUTABLE_DRAFT_OR_SOURCE_EVIDENCE_CHANGED'),
  )
})

test('RP01.11 opens only a local simulation execution gate', () => {
  const f = fixture()
  const validation = recordSimulationValidation(
    [],
    f.executableDraft,
    f.executableReview,
    f.reviewGate,
    f.engineeringValidation,
    f.sourceDraft,
    f.promotionReview,
    f.promotionGate,
    'VALIDATED_FOR_SIMULATION_EXECUTION',
    'Validator',
    '2026-09-01T14:12:00+03:00',
    'Sandbox',
    'Allow local simulation gate.',
  ).record
  assert.ok(validation)

  const gate = assessSimulationExecutionGate(
    validation,
    f.executableDraft,
    f.executableReview,
    f.reviewGate,
    f.engineeringValidation,
    f.sourceDraft,
    f.promotionReview,
    f.promotionGate,
  )
  assert.equal(gate.state, 'ELIGIBLE_FOR_LOCAL_SIMULATION_EXECUTION')
  assert.equal(gate.localSimulationExecutionCanStart, true)
  assert.equal(gate.localSimulationExecutionCompleted, false)
  assert.equal(gate.runtimeAdapterCreated, false)
})

test('RP01.11 never creates runtime, machine, or production authority', () => {
  const f = fixture()
  const validation = recordSimulationValidation(
    [],
    f.executableDraft,
    f.executableReview,
    f.reviewGate,
    f.engineeringValidation,
    f.sourceDraft,
    f.promotionReview,
    f.promotionGate,
    'VALIDATED_FOR_SIMULATION_EXECUTION',
    'Validator',
    '2026-09-01T14:13:00+03:00',
    'Sandbox',
    'Safety.',
  ).record
  assert.ok(validation)
  const gate = assessSimulationExecutionGate(
    validation,
    f.executableDraft,
    f.executableReview,
    f.reviewGate,
    f.engineeringValidation,
    f.sourceDraft,
    f.promotionReview,
    f.promotionGate,
  )

  assert.equal(gate.localSimulationExecutionCompleted, false)
  assert.equal(gate.runtimeAdapterCreated, false)
  assert.equal(gate.productionExecutable, false)
  assert.equal(gate.machineInstructionGenerated, false)
  assert.equal(gate.automaticMachineTranslationAllowed, false)
  assert.equal(gate.productionRuleCreated, false)
  assert.equal(gate.productionUnlockAllowed, false)
  assert.equal(gate.machineReady, false)
  assert.equal(gate.productionApproved, false)

  const source = readFileSync(
    'src/realProduction/skyGlazingSimulationExecutionGate.ts',
    'utf8',
  )
  assert.doesNotMatch(source, /localSimulationExecutionCompleted:\s*true/)
  assert.doesNotMatch(source, /runtimeAdapterCreated:\s*true/)
  assert.doesNotMatch(source, /productionExecutable:\s*true/)
  assert.doesNotMatch(source, /machineInstructionGenerated:\s*true/)
  assert.doesNotMatch(source, /automaticMachineTranslationAllowed:\s*true/)
  assert.doesNotMatch(source, /productionRuleCreated:\s*true/)
  assert.doesNotMatch(source, /productionUnlockAllowed:\s*true/)
  assert.doesNotMatch(source, /machineReady:\s*true/)
  assert.doesNotMatch(source, /productionApproved:\s*true/)
})
