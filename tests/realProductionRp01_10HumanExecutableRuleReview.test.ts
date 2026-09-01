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
import {
  recordRuleDraftEngineeringValidation,
} from '../src/realProduction/skyGlazingRuleDraftEngineeringValidation'
import {
  assessExecutableRuleReviewGate,
} from '../src/realProduction/skyGlazingExecutableRuleReviewGate'
import {
  assessHumanExecutableRuleReviewRecord,
  createNonProductionExecutableRuleDraft,
  executableRuleReviewEvidenceFingerprint,
  recordHumanExecutableRuleReview,
} from '../src/realProduction/skyGlazingHumanExecutableRuleReview'

const sampleDir = join(process.cwd(), 'local-samples', 'phase05a')
const sampleNames = readdirSync(sampleDir)
const xmlName = sampleNames.find((name) => extname(name).toLowerCase() === '.xml')
const lteName = sampleNames.find((name) => extname(name).toLowerCase() === '.lte')
if (!xmlName || !lteName) throw new Error('RP01.10 requires the locked Vadim XML/LTE sample pair.')

const xml = readFileSync(join(sampleDir, xmlName), 'utf8')
const lte = readFileSync(join(sampleDir, lteName)).toString('latin1')
const vadimCandidateSet = buildProductionPatternCandidateSet(
  aggregateSkyGlazingObservationPatterns(
    extractSkyGlazingXmlObservations(xml),
    extractSkyGlazingLteObservations(lte),
  ),
  'Вадим-2',
)

const repeated7801Cut = vadimCandidateSet.candidates.find((candidate) =>
  candidate.profileCode === '78.01'
  && candidate.kind === 'CUT_TUPLE'
  && candidate.sourcePatternKey === 'sxB=135|dxB=135|sxC=90|dxC=90')
if (!repeated7801Cut) throw new Error('RP01.10 expected the repeated 78.01 cut candidate.')

function syntheticProjectSet(
  sourceProject: string,
  candidates: readonly ProductionPatternCandidate[],
): ProductionPatternCandidateSet {
  return Object.freeze({
    sourceProject,
    candidateCount: candidates.length,
    cutTupleCandidateCount: candidates.filter((candidate) => candidate.kind === 'CUT_TUPLE').length,
    exactOperationCandidateCount: candidates.filter((candidate) => candidate.kind === 'EXACT_OPERATION').length,
    candidates: Object.freeze([...candidates]),
    singleProjectOnly: true,
    crossProjectCorroborated: false,
    automaticRulePromotionAllowed: false,
    productionRuleCreated: false,
    machineReady: false,
    productionApproved: false,
  })
}

function syntheticCandidate(
  candidate: ProductionPatternCandidate,
  sourceProject: string,
  evidenceCount = candidate.evidenceCount,
): ProductionPatternCandidate {
  return Object.freeze({
    ...candidate,
    sourceProject,
    evidenceCount,
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

function confirmedCandidateReview(
  existing: readonly ProductionPatternCandidateReviewLedgerEntry[],
  currentCandidates: readonly ProductionPatternCandidate[],
  candidate: ProductionPatternCandidate,
  reviewedAt: string,
): ProductionPatternCandidateReviewLedgerEntry[] {
  const result = recordProductionPatternCandidateReview(
    existing,
    currentCandidates,
    candidate,
    'CONFIRM_CANDIDATE',
    'Human technologist',
    reviewedAt,
    'Confirmed for RP01.10 fixture.',
  )
  assert.equal(result.status, 'RECORDED')
  assert.ok(result.entry)
  return [...result.ledger.entries]
}

function executableReviewFixture() {
  const secondCandidate = syntheticCandidate(
    repeated7801Cut,
    'SYNTHETIC_TEST_PROJECT_B',
    5,
  )
  const secondSet = syntheticProjectSet('SYNTHETIC_TEST_PROJECT_B', [secondCandidate])
  const candidateSets = [vadimCandidateSet, secondSet] as const
  const currentCandidates = [
    ...vadimCandidateSet.candidates,
    ...secondSet.candidates,
  ]

  let candidateReviews: ProductionPatternCandidateReviewLedgerEntry[] = []
  candidateReviews = confirmedCandidateReview(
    candidateReviews,
    currentCandidates,
    repeated7801Cut,
    '2026-09-01T12:00:00+03:00',
  )
  candidateReviews = confirmedCandidateReview(
    candidateReviews,
    currentCandidates,
    secondCandidate,
    '2026-09-01T12:01:00+03:00',
  )

  const corroborationSet = buildProductionPatternCrossProjectCorroboration(candidateSets)
  const corroboration = corroborationSet.patterns.find((pattern) =>
    pattern.profileCode === repeated7801Cut.profileCode
    && pattern.kind === repeated7801Cut.kind
    && pattern.sourcePatternKey === repeated7801Cut.sourcePatternKey)
  if (!corroboration) throw new Error('RP01.10 synthetic corroboration missing.')

  const promotionGate = assessCrossProjectHumanPromotionGate(
    corroboration,
    candidateSets,
    candidateReviews,
  )
  assert.equal(
    promotionGate.state,
    'ELIGIBLE_FOR_HUMAN_PROMOTION_REVIEW',
  )

  const promotionReviewResult = recordHumanPromotionReview(
    [],
    promotionGate,
    'APPROVED_FOR_RULE_DRAFT',
    'Human engineer',
    '2026-09-01T12:02:00+03:00',
    'Allow non-executable draft review.',
  )
  assert.ok(promotionReviewResult.record)

  const sourceDraftResult = createNonExecutableRuleDraft(
    promotionReviewResult.record,
    promotionGate,
    'WP78 cut-pattern proposal',
    'Explicit engineering-context proposal only.',
    '2026-09-01T12:03:00+03:00',
  )
  assert.ok(sourceDraftResult.artifact)

  const engineeringValidationResult = recordRuleDraftEngineeringValidation(
    [],
    sourceDraftResult.artifact,
    promotionReviewResult.record,
    promotionGate,
    'VALIDATED_FOR_ENGINEERING_CONTEXT',
    'Human engineering validator',
    '2026-09-01T12:04:00+03:00',
    'WP78 project-scoped simulation context',
    'Accepted only for engineering-context review.',
  )
  assert.ok(engineeringValidationResult.record)

  const executableReviewGate = assessExecutableRuleReviewGate(
    engineeringValidationResult.record,
    sourceDraftResult.artifact,
    promotionReviewResult.record,
    promotionGate,
  )
  assert.equal(
    executableReviewGate.state,
    'ELIGIBLE_FOR_EXECUTABLE_RULE_REVIEW',
  )

  return {
    candidateSets,
    promotionGate,
    promotionReview: promotionReviewResult.record,
    sourceDraft: sourceDraftResult.artifact,
    engineeringValidation: engineeringValidationResult.record,
    executableReviewGate,
  }
}

test('RP01.10 current real Vadim-only corpus still cannot reach executable-rule review', () => {
  const corroborationSet = buildProductionPatternCrossProjectCorroboration([vadimCandidateSet])
  const gates = buildCrossProjectHumanPromotionGateAssessmentSet(
    corroborationSet,
    [vadimCandidateSet],
    [],
  )

  assert.equal(gates.assessmentCount, 74)
  assert.equal(gates.eligibleForHumanPromotionReviewCount, 0)
})

test('RP01.10 records explicit human executable-rule review only after RP01.9 eligibility', () => {
  const fixture = executableReviewFixture()
  const result = recordHumanExecutableRuleReview(
    [],
    fixture.executableReviewGate,
    fixture.engineeringValidation,
    fixture.sourceDraft,
    fixture.promotionReview,
    fixture.promotionGate,
    'APPROVED_FOR_NON_PRODUCTION_EXECUTABLE_DRAFT',
    'Human executable-rule reviewer',
    '2026-09-01T12:05:00+03:00',
    'Local deterministic simulation evaluator only',
    'Approve only a simulation-only executable draft.',
  )

  assert.equal(result.status, 'RECORDED')
  assert.ok(result.record)
  assert.equal(result.record.humanExecutableRuleReviewCompleted, true)
  assert.equal(result.record.nonProductionExecutableDraftAllowed, true)
  assert.equal(result.record.productionExecutableRuleAllowed, false)
  assert.deepEqual(
    result.record.gateFingerprint,
    executableRuleReviewEvidenceFingerprint(
      fixture.executableReviewGate,
      fixture.engineeringValidation,
      fixture.sourceDraft,
      fixture.promotionReview,
      fixture.promotionGate,
    ),
  )
})

test('RP01.10 requires reviewer, timestamp, execution context, and rationale', () => {
  const fixture = executableReviewFixture()
  const result = recordHumanExecutableRuleReview(
    [],
    fixture.executableReviewGate,
    fixture.engineeringValidation,
    fixture.sourceDraft,
    fixture.promotionReview,
    fixture.promotionGate,
    'APPROVED_FOR_NON_PRODUCTION_EXECUTABLE_DRAFT',
    '',
    '',
    '',
    '',
  )

  assert.equal(result.status, 'NOT_RECORDED')
  assert.deepEqual(
    result.reasons,
    [
      'REVIEWER_REQUIRED',
      'REVIEW_TIMESTAMP_REQUIRED',
      'EXECUTION_CONTEXT_REQUIRED',
      'RATIONALE_REQUIRED',
    ],
  )
})

test('RP01.10 explicit rejection never permits a non-production executable draft', () => {
  const fixture = executableReviewFixture()
  const review = recordHumanExecutableRuleReview(
    [],
    fixture.executableReviewGate,
    fixture.engineeringValidation,
    fixture.sourceDraft,
    fixture.promotionReview,
    fixture.promotionGate,
    'REJECTED_FOR_NON_PRODUCTION_EXECUTABLE_DRAFT',
    'Human executable-rule reviewer',
    '2026-09-01T12:06:00+03:00',
    'Local deterministic simulation evaluator only',
    'Reject executable draft.',
  )
  assert.ok(review.record)
  assert.equal(review.record.nonProductionExecutableDraftAllowed, false)

  const draft = createNonProductionExecutableRuleDraft(
    review.record,
    fixture.executableReviewGate,
    fixture.engineeringValidation,
    fixture.sourceDraft,
    fixture.promotionReview,
    fixture.promotionGate,
    'Rejected attempt',
    'return input > 0',
    'Local deterministic simulation evaluator only',
    '2026-09-01T12:07:00+03:00',
  )
  assert.equal(draft.status, 'NOT_CREATED')
  assert.deepEqual(draft.reasons, ['EXECUTABLE_REVIEW_NOT_APPROVED'])
})

test('RP01.10 blocks duplicate review on the exact same RP01.9 evidence package', () => {
  const fixture = executableReviewFixture()
  const first = recordHumanExecutableRuleReview(
    [],
    fixture.executableReviewGate,
    fixture.engineeringValidation,
    fixture.sourceDraft,
    fixture.promotionReview,
    fixture.promotionGate,
    'APPROVED_FOR_NON_PRODUCTION_EXECUTABLE_DRAFT',
    'Human executable-rule reviewer',
    '2026-09-01T12:08:00+03:00',
    'Simulation evaluator',
    'First current review.',
  )
  assert.ok(first.record)

  const duplicate = recordHumanExecutableRuleReview(
    [first.record],
    fixture.executableReviewGate,
    fixture.engineeringValidation,
    fixture.sourceDraft,
    fixture.promotionReview,
    fixture.promotionGate,
    'REJECTED_FOR_NON_PRODUCTION_EXECUTABLE_DRAFT',
    'Second reviewer',
    '2026-09-01T12:09:00+03:00',
    'Simulation evaluator',
    'Must not overwrite same current evidence.',
  )
  assert.equal(duplicate.status, 'NOT_RECORDED')
  assert.deepEqual(
    duplicate.reasons,
    ['CURRENT_EXECUTABLE_REVIEW_ALREADY_RECORDED'],
  )
})

test('RP01.10 marks review stale when the RP01.9 gate evidence changes', () => {
  const fixture = executableReviewFixture()
  const review = recordHumanExecutableRuleReview(
    [],
    fixture.executableReviewGate,
    fixture.engineeringValidation,
    fixture.sourceDraft,
    fixture.promotionReview,
    fixture.promotionGate,
    'APPROVED_FOR_NON_PRODUCTION_EXECUTABLE_DRAFT',
    'Human executable-rule reviewer',
    '2026-09-01T12:10:00+03:00',
    'Simulation evaluator',
    'Review bound to current gate evidence.',
  )
  assert.ok(review.record)

  const changedGate = Object.freeze({
    ...fixture.executableReviewGate,
    state: 'BLOCKED' as const,
    reasons: Object.freeze(['ENGINEERING_VALIDATION_NOT_CURRENT' as const]),
    executableRuleReviewCanStart: false,
  })

  const assessment = assessHumanExecutableRuleReviewRecord(
    review.record,
    changedGate,
    fixture.engineeringValidation,
    fixture.sourceDraft,
    fixture.promotionReview,
    fixture.promotionGate,
  )

  assert.equal(assessment.state, 'STALE_REQUIRES_REVIEW')
  assert.ok(
    assessment.reasons.includes(
      'EXECUTABLE_RULE_REVIEW_GATE_CHANGED',
    ),
  )
  assert.ok(
    assessment.reasons.includes(
      'EXECUTABLE_RULE_REVIEW_GATE_NO_LONGER_ELIGIBLE',
    ),
  )
})

test('RP01.10 creates only a simulation-only non-production executable draft from current approval', () => {
  const fixture = executableReviewFixture()
  const review = recordHumanExecutableRuleReview(
    [],
    fixture.executableReviewGate,
    fixture.engineeringValidation,
    fixture.sourceDraft,
    fixture.promotionReview,
    fixture.promotionGate,
    'APPROVED_FOR_NON_PRODUCTION_EXECUTABLE_DRAFT',
    'Human executable-rule reviewer',
    '2026-09-01T12:11:00+03:00',
    'Local deterministic simulation evaluator only',
    'Permit simulation-only execution draft.',
  )
  assert.ok(review.record)

  const artifact = createNonProductionExecutableRuleDraft(
    review.record,
    fixture.executableReviewGate,
    fixture.engineeringValidation,
    fixture.sourceDraft,
    fixture.promotionReview,
    fixture.promotionGate,
    'WP78 simulation evaluator draft',
    'return observedPatternMatches === true',
    'Local deterministic simulation evaluator only',
    '2026-09-01T12:12:00+03:00',
  )

  assert.equal(artifact.status, 'CREATED')
  assert.ok(artifact.artifact)
  assert.equal(
    artifact.artifact.artifactType,
    'NON_PRODUCTION_EXECUTABLE_RULE_DRAFT',
  )
  assert.equal(
    artifact.artifact.artifactStatus,
    'SIMULATION_ONLY_EXECUTABLE_DRAFT',
  )
  assert.equal(artifact.artifact.simulationExecutable, true)
  assert.equal(artifact.artifact.productionExecutable, false)
  assert.equal(artifact.artifact.machineInstructionGenerated, false)
  assert.equal(artifact.artifact.automaticMachineTranslationAllowed, false)
})

test('RP01.10 never grants production execution, machine translation, unlock, or approval', () => {
  const fixture = executableReviewFixture()
  const review = recordHumanExecutableRuleReview(
    [],
    fixture.executableReviewGate,
    fixture.engineeringValidation,
    fixture.sourceDraft,
    fixture.promotionReview,
    fixture.promotionGate,
    'APPROVED_FOR_NON_PRODUCTION_EXECUTABLE_DRAFT',
    'Human executable-rule reviewer',
    '2026-09-01T12:13:00+03:00',
    'Local deterministic simulation evaluator only',
    'Safety boundary.',
  )
  assert.ok(review.record)

  const artifact = createNonProductionExecutableRuleDraft(
    review.record,
    fixture.executableReviewGate,
    fixture.engineeringValidation,
    fixture.sourceDraft,
    fixture.promotionReview,
    fixture.promotionGate,
    'Safety-boundary simulation draft',
    'return observedPatternMatches === true',
    'Local deterministic simulation evaluator only',
    '2026-09-01T12:14:00+03:00',
  )
  assert.ok(artifact.artifact)

  assert.equal(review.record.productionExecutableRuleAllowed, false)
  assert.equal(review.record.productionRuleCreated, false)
  assert.equal(review.record.productionUnlockAllowed, false)
  assert.equal(review.record.machineInstructionGenerated, false)
  assert.equal(review.record.machineReady, false)
  assert.equal(review.record.productionApproved, false)

  assert.equal(artifact.artifact.productionExecutable, false)
  assert.equal(artifact.artifact.machineInstructionGenerated, false)
  assert.equal(artifact.artifact.automaticMachineTranslationAllowed, false)
  assert.equal(artifact.artifact.automaticRulePromotionAllowed, false)
  assert.equal(artifact.artifact.productionRuleCreated, false)
  assert.equal(artifact.artifact.productionUnlockAllowed, false)
  assert.equal(artifact.artifact.machineReady, false)
  assert.equal(artifact.artifact.productionApproved, false)

  const source = readFileSync(
    'src/realProduction/skyGlazingHumanExecutableRuleReview.ts',
    'utf8',
  )
  assert.doesNotMatch(source, /productionExecutableRuleAllowed:\s*true/)
  assert.doesNotMatch(source, /productionExecutable:\s*true/)
  assert.doesNotMatch(source, /machineInstructionGenerated:\s*true/)
  assert.doesNotMatch(source, /automaticMachineTranslationAllowed:\s*true/)
  assert.doesNotMatch(source, /automaticRulePromotionAllowed:\s*true/)
  assert.doesNotMatch(source, /productionRuleCreated:\s*true/)
  assert.doesNotMatch(source, /productionUnlockAllowed:\s*true/)
  assert.doesNotMatch(source, /machineReady:\s*true/)
  assert.doesNotMatch(source, /productionApproved:\s*true/)
})
