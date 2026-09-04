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
  engineeringValidationClosureFingerprint,
} from '../src/realProduction/skyGlazingExecutableRuleReviewGate'

const sampleDir = join(process.cwd(), 'local-samples', 'phase05a')
const sampleNames = readdirSync(sampleDir)
const xmlName = sampleNames.find((name) => extname(name).toLowerCase() === '.xml')
const lteName = sampleNames.find((name) => extname(name).toLowerCase() === '.lte')
if (!xmlName || !lteName) throw new Error('RP01.9 requires the locked Vadim XML/LTE sample pair.')

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
if (!repeated7801Cut) throw new Error('RP01.9 expected the repeated 78.01 cut candidate.')

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
    'Confirmed for RP01.9 executable-review gate fixture.',
  )
  assert.equal(result.status, 'RECORDED')
  assert.ok(result.entry)
  return [...result.ledger.entries]
}

function validatedFixture() {
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
    '2026-09-01T11:00:00+03:00',
  )
  candidateReviews = confirmedCandidateReview(
    candidateReviews,
    currentCandidates,
    secondCandidate,
    '2026-09-01T11:01:00+03:00',
  )

  const corroborationSet = buildProductionPatternCrossProjectCorroboration(candidateSets)
  const corroboration = corroborationSet.patterns.find((pattern) =>
    pattern.profileCode === repeated7801Cut.profileCode
    && pattern.kind === repeated7801Cut.kind
    && pattern.sourcePatternKey === repeated7801Cut.sourcePatternKey)
  if (!corroboration) throw new Error('RP01.9 synthetic corroboration missing.')

  const gate = assessCrossProjectHumanPromotionGate(
    corroboration,
    candidateSets,
    candidateReviews,
  )
  assert.equal(gate.state, 'ELIGIBLE_FOR_HUMAN_PROMOTION_REVIEW')

  const promotionReviewResult = recordHumanPromotionReview(
    [],
    gate,
    'APPROVED_FOR_RULE_DRAFT',
    'Human engineer',
    '2026-09-01T11:02:00+03:00',
    'Allow a non-executable draft for RP01.9 gate testing.',
  )
  assert.equal(promotionReviewResult.status, 'RECORDED')
  assert.ok(promotionReviewResult.record)

  const draftResult = createNonExecutableRuleDraft(
    promotionReviewResult.record,
    gate,
    'WP78 cut-pattern proposal',
    'Explicit engineering-context proposal only.',
    '2026-09-01T11:03:00+03:00',
  )
  assert.equal(draftResult.status, 'CREATED')
  assert.ok(draftResult.artifact)

  const validationResult = recordRuleDraftEngineeringValidation(
    [],
    draftResult.artifact,
    promotionReviewResult.record,
    gate,
    'VALIDATED_FOR_ENGINEERING_CONTEXT',
    'Human engineer validator',
    '2026-09-01T11:04:00+03:00',
    'WP78 project-scoped cut-pattern engineering context',
    'Accepted only for engineering-context review closure.',
  )
  assert.equal(validationResult.status, 'RECORDED')
  assert.ok(validationResult.record)

  return {
    secondCandidate,
    secondSet,
    candidateSets,
    currentCandidates,
    candidateReviews,
    corroboration,
    gate,
    promotionReview: promotionReviewResult.record,
    draft: draftResult.artifact,
    validation: validationResult.record,
  }
}

test('RP01.9 current real Vadim-only corpus still has no path to executable-rule review eligibility', () => {
  const corroborationSet = buildProductionPatternCrossProjectCorroboration([vadimCandidateSet])
  const gates = buildCrossProjectHumanPromotionGateAssessmentSet(
    corroborationSet,
    [vadimCandidateSet],
    [],
  )

  assert.equal(gates.assessmentCount, 74)
  assert.equal(gates.eligibleForHumanPromotionReviewCount, 0)
  assert.equal(gates.blockedCount, 74)
})

test('RP01.9 opens only executable-rule review after a current positive RP01.8 engineering-context validation', () => {
  const fixture = validatedFixture()
  const result = assessExecutableRuleReviewGate(
    fixture.validation,
    fixture.draft,
    fixture.promotionReview,
    fixture.gate,
  )

  assert.equal(result.state, 'ELIGIBLE_FOR_EXECUTABLE_RULE_REVIEW')
  assert.deepEqual(result.reasons, [])
  assert.equal(result.engineeringValidationClosedForReviewBoundary, true)
  assert.equal(result.executableRuleReviewCanStart, true)
  assert.equal(result.executableRuleReviewCompleted, false)
  assert.equal(result.executableRuleCreated, false)
  assert.deepEqual(
    result.closureFingerprint,
    engineeringValidationClosureFingerprint(
      fixture.validation,
      fixture.draft,
      fixture.promotionReview,
      fixture.gate,
    ),
  )
})

test('RP01.9 blocks a current RP01.8 rejection from executable-rule review', () => {
  const fixture = validatedFixture()
  const rejectedValidation = Object.freeze({
    ...fixture.validation,
    decision: 'REJECTED_FOR_ENGINEERING_CONTEXT' as const,
    draftValidatedForEngineeringContext: false,
    draftRejectedForEngineeringContext: true,
  })

  const result = assessExecutableRuleReviewGate(
    rejectedValidation,
    fixture.draft,
    fixture.promotionReview,
    fixture.gate,
  )

  assert.equal(result.state, 'BLOCKED')
  assert.ok(result.reasons.includes('ENGINEERING_CONTEXT_NOT_VALIDATED'))
  assert.equal(result.executableRuleReviewCanStart, false)
})

test('RP01.9 blocks when the RP01.8 validation becomes stale because the draft changed', () => {
  const fixture = validatedFixture()
  const changedDraft = Object.freeze({
    ...fixture.draft,
    proposedRuleStatement: `${fixture.draft.proposedRuleStatement} CHANGED`,
  })

  const result = assessExecutableRuleReviewGate(
    fixture.validation,
    changedDraft,
    fixture.promotionReview,
    fixture.gate,
  )

  assert.equal(result.state, 'BLOCKED')
  assert.ok(result.reasons.includes('ENGINEERING_VALIDATION_NOT_CURRENT'))
  assert.equal(result.engineeringValidationRecordState, 'STALE_REQUIRES_REVIEW')
})

test('RP01.9 blocks when the RP01.7 promotion-review / RP01.6 gate source chain changes', () => {
  const fixture = validatedFixture()
  const changedGate = Object.freeze({
    ...fixture.gate,
    state: 'BLOCKED' as const,
    reasons: Object.freeze(['CURRENT_REJECTION_PRESENT' as const]),
    humanPromotionReviewCanStart: false,
    anyCurrentCandidateRejectionPresent: true,
  })

  const result = assessExecutableRuleReviewGate(
    fixture.validation,
    fixture.draft,
    fixture.promotionReview,
    changedGate,
  )

  assert.equal(result.state, 'BLOCKED')
  assert.ok(result.reasons.includes('ENGINEERING_VALIDATION_NOT_CURRENT'))
})

test('RP01.9 blocks if the source draft is no longer explicitly non-executable', () => {
  const fixture = validatedFixture()
  const unsafeDraft = Object.freeze({
    ...fixture.draft,
    executable: true as boolean,
  }) as typeof fixture.draft

  const result = assessExecutableRuleReviewGate(
    fixture.validation,
    unsafeDraft,
    fixture.promotionReview,
    fixture.gate,
  )

  assert.equal(result.state, 'BLOCKED')
  assert.ok(result.reasons.includes('DRAFT_NOT_NON_EXECUTABLE'))
})

test('RP01.9 blocks a mismatched validation-to-draft source chain', () => {
  const fixture = validatedFixture()
  const detachedValidation = Object.freeze({
    ...fixture.validation,
    draftArtifactId: 'different-draft-id',
  })

  const result = assessExecutableRuleReviewGate(
    detachedValidation,
    fixture.draft,
    fixture.promotionReview,
    fixture.gate,
  )

  assert.equal(result.state, 'BLOCKED')
  assert.ok(result.reasons.includes('SOURCE_CHAIN_CHANGED'))
})

test('RP01.9 eligibility never creates, validates, executes, unlocks, or approves a production rule', () => {
  const fixture = validatedFixture()
  const result = assessExecutableRuleReviewGate(
    fixture.validation,
    fixture.draft,
    fixture.promotionReview,
    fixture.gate,
  )

  assert.equal(result.state, 'ELIGIBLE_FOR_EXECUTABLE_RULE_REVIEW')
  assert.equal(result.executableRuleReviewCompleted, false)
  assert.equal(result.executableRuleCreated, false)
  assert.equal(result.engineeringRuleValidated, false)
  assert.equal(result.automaticRulePromotionAllowed, false)
  assert.equal(result.productionRuleCreated, false)
  assert.equal(result.productionUnlockAllowed, false)
  assert.equal(result.machineInstructionGenerated, false)
  assert.equal(result.machineReady, false)
  assert.equal(result.productionApproved, false)

  const source = readFileSync(
    'src/realProduction/skyGlazingExecutableRuleReviewGate.ts',
    'utf8',
  )
  assert.doesNotMatch(source, /executableRuleReviewCompleted:\s*true/)
  assert.doesNotMatch(source, /executableRuleCreated:\s*true/)
  assert.doesNotMatch(source, /engineeringRuleValidated:\s*true/)
  assert.doesNotMatch(source, /automaticRulePromotionAllowed:\s*true/)
  assert.doesNotMatch(source, /productionRuleCreated:\s*true/)
  assert.doesNotMatch(source, /productionUnlockAllowed:\s*true/)
  assert.doesNotMatch(source, /machineInstructionGenerated:\s*true/)
  assert.doesNotMatch(source, /machineReady:\s*true/)
  assert.doesNotMatch(source, /productionApproved:\s*true/)
})
