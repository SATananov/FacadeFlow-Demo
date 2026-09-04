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
  assessRuleDraftEngineeringValidationRecord,
  recordRuleDraftEngineeringValidation,
  ruleDraftEngineeringEvidenceFingerprint,
} from '../src/realProduction/skyGlazingRuleDraftEngineeringValidation'

const sampleDir = join(process.cwd(), 'local-samples', 'phase05a')
const sampleNames = readdirSync(sampleDir)
const xmlName = sampleNames.find((name) => extname(name).toLowerCase() === '.xml')
const lteName = sampleNames.find((name) => extname(name).toLowerCase() === '.lte')
if (!xmlName || !lteName) throw new Error('RP01.8 requires the locked Vadim XML/LTE sample pair.')

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
if (!repeated7801Cut) throw new Error('RP01.8 expected the repeated 78.01 cut candidate.')

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
    'Confirmed for RP01.8 engineering-validation fixture.',
  )
  assert.equal(result.status, 'RECORDED')
  assert.ok(result.entry)
  return [...result.ledger.entries]
}

function draftFixture() {
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
    '2026-09-01T10:00:00+03:00',
  )
  candidateReviews = confirmedCandidateReview(
    candidateReviews,
    currentCandidates,
    secondCandidate,
    '2026-09-01T10:01:00+03:00',
  )

  const corroborationSet = buildProductionPatternCrossProjectCorroboration(candidateSets)
  const corroboration = corroborationSet.patterns.find((pattern) =>
    pattern.profileCode === repeated7801Cut.profileCode
    && pattern.kind === repeated7801Cut.kind
    && pattern.sourcePatternKey === repeated7801Cut.sourcePatternKey)
  if (!corroboration) throw new Error('RP01.8 synthetic corroboration missing.')

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
    '2026-09-01T10:02:00+03:00',
    'Permit a non-executable draft for engineering-context review.',
  )
  assert.equal(promotionReviewResult.status, 'RECORDED')
  assert.ok(promotionReviewResult.record)

  const draftResult = createNonExecutableRuleDraft(
    promotionReviewResult.record,
    gate,
    'WP78 cut-pattern proposal',
    'Explicit engineering proposal for later context validation only.',
    '2026-09-01T10:03:00+03:00',
  )
  assert.equal(draftResult.status, 'CREATED')
  assert.ok(draftResult.artifact)

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
  }
}

test('RP01.8 real Vadim-only corpus still has no gate eligible to produce a draft for engineering validation', () => {
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

test('RP01.8 records explicit validation for engineering context only from a current linked RP01.7 draft', () => {
  const fixture = draftFixture()
  const result = recordRuleDraftEngineeringValidation(
    [],
    fixture.draft,
    fixture.promotionReview,
    fixture.gate,
    'VALIDATED_FOR_ENGINEERING_CONTEXT',
    'Human engineer validator',
    '2026-09-01T10:04:00+03:00',
    'WP78 project-scoped cut-pattern engineering review',
    'Statement is acceptable as a context-limited draft for later review.',
  )

  assert.equal(result.status, 'RECORDED')
  assert.ok(result.record)
  assert.equal(result.record.validationScope, 'ENGINEERING_CONTEXT_ONLY')
  assert.equal(result.record.humanEngineeringDecisionRecorded, true)
  assert.equal(result.record.draftValidatedForEngineeringContext, true)
  assert.equal(result.record.draftRejectedForEngineeringContext, false)
  assert.deepEqual(
    result.record.draftFingerprint,
    ruleDraftEngineeringEvidenceFingerprint(
      fixture.draft,
      fixture.promotionReview,
      fixture.gate,
    ),
  )
  assert.equal(result.record.engineeringRuleValidated, false)
})

test('RP01.8 requires validator, timestamp, engineering context, and rationale', () => {
  const fixture = draftFixture()
  const result = recordRuleDraftEngineeringValidation(
    [],
    fixture.draft,
    fixture.promotionReview,
    fixture.gate,
    'VALIDATED_FOR_ENGINEERING_CONTEXT',
    '',
    '',
    '',
    '',
  )

  assert.equal(result.status, 'NOT_RECORDED')
  assert.deepEqual(
    result.reasons,
    [
      'VALIDATOR_REQUIRED',
      'VALIDATION_TIMESTAMP_REQUIRED',
      'ENGINEERING_CONTEXT_REQUIRED',
      'RATIONALE_REQUIRED',
    ],
  )
})

test('RP01.8 records rejection without treating the draft as engineering-context validated', () => {
  const fixture = draftFixture()
  const result = recordRuleDraftEngineeringValidation(
    [],
    fixture.draft,
    fixture.promotionReview,
    fixture.gate,
    'REJECTED_FOR_ENGINEERING_CONTEXT',
    'Human engineer validator',
    '2026-09-01T10:05:00+03:00',
    'WP78 project-scoped cut-pattern engineering review',
    'Reject the draft statement in this context.',
  )

  assert.equal(result.status, 'RECORDED')
  assert.ok(result.record)
  assert.equal(result.record.draftValidatedForEngineeringContext, false)
  assert.equal(result.record.draftRejectedForEngineeringContext, true)
  assert.equal(result.record.productionRuleCreated, false)
})

test('RP01.8 blocks a draft whose RP01.7 source linkage does not match the supplied current review/gate', () => {
  const fixture = draftFixture()
  const mismatchedDraft = Object.freeze({
    ...fixture.draft,
    promotionReviewRecordId: 'different-review-record',
  })

  const result = recordRuleDraftEngineeringValidation(
    [],
    mismatchedDraft,
    fixture.promotionReview,
    fixture.gate,
    'VALIDATED_FOR_ENGINEERING_CONTEXT',
    'Human engineer validator',
    '2026-09-01T10:06:00+03:00',
    'WP78 context',
    'Must not validate a detached draft.',
  )

  assert.equal(result.status, 'NOT_RECORDED')
  assert.ok(result.reasons.includes('DRAFT_SOURCE_LINK_MISMATCH'))
})

test('RP01.8 blocks duplicate validation of the exact same current draft/source evidence', () => {
  const fixture = draftFixture()
  const first = recordRuleDraftEngineeringValidation(
    [],
    fixture.draft,
    fixture.promotionReview,
    fixture.gate,
    'VALIDATED_FOR_ENGINEERING_CONTEXT',
    'Human engineer validator',
    '2026-09-01T10:07:00+03:00',
    'WP78 context',
    'First decision.',
  )
  assert.ok(first.record)

  const duplicate = recordRuleDraftEngineeringValidation(
    [first.record],
    fixture.draft,
    fixture.promotionReview,
    fixture.gate,
    'REJECTED_FOR_ENGINEERING_CONTEXT',
    'Second engineer',
    '2026-09-01T10:08:00+03:00',
    'WP78 context',
    'Second decision must not overwrite the same current evidence.',
  )

  assert.equal(duplicate.status, 'NOT_RECORDED')
  assert.deepEqual(
    duplicate.reasons,
    ['CURRENT_DRAFT_VALIDATION_ALREADY_RECORDED'],
  )
})

test('RP01.8 marks prior validation stale when the explicit draft statement changes', () => {
  const fixture = draftFixture()
  const recorded = recordRuleDraftEngineeringValidation(
    [],
    fixture.draft,
    fixture.promotionReview,
    fixture.gate,
    'VALIDATED_FOR_ENGINEERING_CONTEXT',
    'Human engineer validator',
    '2026-09-01T10:09:00+03:00',
    'WP78 context',
    'Validated against the original explicit statement.',
  )
  assert.ok(recorded.record)

  const changedDraft = Object.freeze({
    ...fixture.draft,
    proposedRuleStatement: `${fixture.draft.proposedRuleStatement} CHANGED`,
  })
  const assessment = assessRuleDraftEngineeringValidationRecord(
    recorded.record,
    changedDraft,
    fixture.promotionReview,
    fixture.gate,
  )

  assert.equal(assessment.state, 'STALE_REQUIRES_REVIEW')
  assert.ok(assessment.reasons.includes('DRAFT_OR_SOURCE_EVIDENCE_CHANGED'))
  assert.equal(
    assessment.decisionCurrentlyUsableForFurtherReviewBoundary,
    false,
  )
})

test('RP01.8 marks prior validation stale when underlying promotion-gate evidence becomes blocked', () => {
  const fixture = draftFixture()
  const recorded = recordRuleDraftEngineeringValidation(
    [],
    fixture.draft,
    fixture.promotionReview,
    fixture.gate,
    'VALIDATED_FOR_ENGINEERING_CONTEXT',
    'Human engineer validator',
    '2026-09-01T10:10:00+03:00',
    'WP78 context',
    'Validation is bound to current promotion-gate evidence.',
  )
  assert.ok(recorded.record)

  const blockedGate = Object.freeze({
    ...fixture.gate,
    state: 'BLOCKED' as const,
    reasons: Object.freeze(['CURRENT_REJECTION_PRESENT' as const]),
    humanPromotionReviewCanStart: false,
    anyCurrentCandidateRejectionPresent: true,
  })
  const assessment = assessRuleDraftEngineeringValidationRecord(
    recorded.record,
    fixture.draft,
    fixture.promotionReview,
    blockedGate,
  )

  assert.equal(assessment.state, 'STALE_REQUIRES_REVIEW')
  assert.ok(
    assessment.reasons.includes('SOURCE_PROMOTION_REVIEW_CHANGED_OR_STALE'),
  )
  assert.ok(assessment.reasons.includes('DRAFT_OR_SOURCE_EVIDENCE_CHANGED'))
})

test('RP01.8 engineering-context validation never creates executable or production authority', () => {
  const fixture = draftFixture()
  const result = recordRuleDraftEngineeringValidation(
    [],
    fixture.draft,
    fixture.promotionReview,
    fixture.gate,
    'VALIDATED_FOR_ENGINEERING_CONTEXT',
    'Human engineer validator',
    '2026-09-01T10:11:00+03:00',
    'WP78 context',
    'Safety-boundary validation.',
  )
  assert.ok(result.record)

  assert.equal(result.record.engineeringRuleValidated, false)
  assert.equal(result.record.executableRuleCreated, false)
  assert.equal(result.record.automaticRulePromotionAllowed, false)
  assert.equal(result.record.productionRuleCreated, false)
  assert.equal(result.record.productionUnlockAllowed, false)
  assert.equal(result.record.machineInstructionGenerated, false)
  assert.equal(result.record.machineReady, false)
  assert.equal(result.record.productionApproved, false)

  const source = readFileSync(
    'src/realProduction/skyGlazingRuleDraftEngineeringValidation.ts',
    'utf8',
  )
  assert.doesNotMatch(source, /engineeringRuleValidated:\s*true/)
  assert.doesNotMatch(source, /executableRuleCreated:\s*true/)
  assert.doesNotMatch(source, /automaticRulePromotionAllowed:\s*true/)
  assert.doesNotMatch(source, /productionRuleCreated:\s*true/)
  assert.doesNotMatch(source, /productionUnlockAllowed:\s*true/)
  assert.doesNotMatch(source, /machineInstructionGenerated:\s*true/)
  assert.doesNotMatch(source, /machineReady:\s*true/)
  assert.doesNotMatch(source, /productionApproved:\s*true/)
})
