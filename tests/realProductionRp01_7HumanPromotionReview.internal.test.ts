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
  assessHumanPromotionReviewRecord,
  createNonExecutableRuleDraft,
  promotionGateEvidenceFingerprint,
  recordHumanPromotionReview,
} from '../src/realProduction/skyGlazingHumanPromotionReview'

const sampleDir = join(process.cwd(), 'local-samples', 'phase05a')
const sampleNames = readdirSync(sampleDir)
const xmlName = sampleNames.find((name) => extname(name).toLowerCase() === '.xml')
const lteName = sampleNames.find((name) => extname(name).toLowerCase() === '.lte')
if (!xmlName || !lteName) throw new Error('RP01.7 requires the locked Vadim XML/LTE sample pair.')

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
if (!repeated7801Cut) throw new Error('RP01.7 expected the repeated 78.01 cut candidate.')

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
    'Confirmed for RP01.7 test gate.',
  )
  assert.equal(result.status, 'RECORDED')
  assert.ok(result.entry)
  return [...result.ledger.entries]
}

function eligibleFixture() {
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

  let reviewEntries: ProductionPatternCandidateReviewLedgerEntry[] = []
  reviewEntries = confirmedCandidateReview(
    reviewEntries,
    currentCandidates,
    repeated7801Cut,
    '2026-09-01T09:00:00+03:00',
  )
  reviewEntries = confirmedCandidateReview(
    reviewEntries,
    currentCandidates,
    secondCandidate,
    '2026-09-01T09:01:00+03:00',
  )

  const corroborationSet = buildProductionPatternCrossProjectCorroboration(candidateSets)
  const corroboration = corroborationSet.patterns.find((pattern) =>
    pattern.profileCode === repeated7801Cut.profileCode
    && pattern.kind === repeated7801Cut.kind
    && pattern.sourcePatternKey === repeated7801Cut.sourcePatternKey)
  if (!corroboration) throw new Error('RP01.7 cross-project test corroboration missing.')

  const gate = assessCrossProjectHumanPromotionGate(
    corroboration,
    candidateSets,
    reviewEntries,
  )
  assert.equal(gate.state, 'ELIGIBLE_FOR_HUMAN_PROMOTION_REVIEW')

  return {
    secondCandidate,
    secondSet,
    candidateSets,
    currentCandidates,
    reviewEntries,
    corroboration,
    gate,
  }
}

test('RP01.7 cannot record a promotion review for the current real Vadim-only corpus', () => {
  const corroborationSet = buildProductionPatternCrossProjectCorroboration([vadimCandidateSet])
  const gates = buildCrossProjectHumanPromotionGateAssessmentSet(
    corroborationSet,
    [vadimCandidateSet],
    [],
  )
  const realGate = gates.assessments.find((gate) =>
    gate.profileCode === repeated7801Cut.profileCode
    && gate.candidateKind === repeated7801Cut.kind
    && gate.sourcePatternKey === repeated7801Cut.sourcePatternKey)
  if (!realGate) throw new Error('RP01.7 real Vadim gate missing.')

  const result = recordHumanPromotionReview(
    [],
    realGate,
    'APPROVED_FOR_RULE_DRAFT',
    'Human engineer',
    '2026-09-01T09:02:00+03:00',
    'Attempt should remain blocked because the real corpus is single-project.',
  )

  assert.equal(realGate.state, 'BLOCKED')
  assert.equal(result.status, 'NOT_RECORDED')
  assert.ok(result.reasons.includes('PROMOTION_GATE_NOT_ELIGIBLE'))
})

test('RP01.7 records an explicit human promotion-review decision only after RP01.6 eligibility', () => {
  const fixture = eligibleFixture()
  const result = recordHumanPromotionReview(
    [],
    fixture.gate,
    'APPROVED_FOR_RULE_DRAFT',
    'Human engineer',
    '2026-09-01T09:03:00+03:00',
    'Evidence is suitable for a non-executable rule draft review.',
  )

  assert.equal(result.status, 'RECORDED')
  assert.ok(result.record)
  assert.equal(result.record.decision, 'APPROVED_FOR_RULE_DRAFT')
  assert.equal(result.record.humanPromotionReviewCompleted, true)
  assert.equal(result.record.ruleDraftAllowed, true)
  assert.deepEqual(
    result.record.gateFingerprint,
    promotionGateEvidenceFingerprint(fixture.gate),
  )
  assert.equal(result.record.engineeringRuleValidated, false)
  assert.equal(result.record.productionRuleCreated, false)
})

test('RP01.7 requires reviewer, timestamp, and rationale and blocks duplicate review of the same gate evidence', () => {
  const fixture = eligibleFixture()
  const missing = recordHumanPromotionReview(
    [],
    fixture.gate,
    'APPROVED_FOR_RULE_DRAFT',
    '',
    '',
    '',
  )
  assert.equal(missing.status, 'NOT_RECORDED')
  assert.deepEqual(
    missing.reasons,
    ['REVIEWER_REQUIRED', 'REVIEW_TIMESTAMP_REQUIRED', 'RATIONALE_REQUIRED'],
  )

  const first = recordHumanPromotionReview(
    [],
    fixture.gate,
    'APPROVED_FOR_RULE_DRAFT',
    'Human engineer',
    '2026-09-01T09:04:00+03:00',
    'First decision on current evidence.',
  )
  assert.ok(first.record)

  const duplicate = recordHumanPromotionReview(
    [first.record],
    fixture.gate,
    'REJECTED_FOR_RULE_DRAFT',
    'Second engineer',
    '2026-09-01T09:05:00+03:00',
    'A second decision must not overwrite the current evidence review.',
  )
  assert.equal(duplicate.status, 'NOT_RECORDED')
  assert.deepEqual(duplicate.reasons, ['CURRENT_PROMOTION_REVIEW_ALREADY_RECORDED'])
})

test('RP01.7 explicit rejection is recorded but never permits a rule draft', () => {
  const fixture = eligibleFixture()
  const review = recordHumanPromotionReview(
    [],
    fixture.gate,
    'REJECTED_FOR_RULE_DRAFT',
    'Human engineer',
    '2026-09-01T09:06:00+03:00',
    'Do not proceed to a draft.',
  )
  assert.ok(review.record)
  assert.equal(review.record.ruleDraftAllowed, false)

  const draft = createNonExecutableRuleDraft(
    review.record,
    fixture.gate,
    'Rejected draft attempt',
    'This statement must not become a draft.',
    '2026-09-01T09:07:00+03:00',
  )
  assert.equal(draft.status, 'NOT_CREATED')
  assert.deepEqual(
    draft.reasons,
    ['PROMOTION_REVIEW_NOT_APPROVED_FOR_RULE_DRAFT'],
  )
})

test('RP01.7 invalidates the promotion review when current gate evidence changes', () => {
  const fixture = eligibleFixture()
  const review = recordHumanPromotionReview(
    [],
    fixture.gate,
    'APPROVED_FOR_RULE_DRAFT',
    'Human engineer',
    '2026-09-01T09:08:00+03:00',
    'Approved on the original eligible evidence package.',
  )
  assert.ok(review.record)

  const changedSecondCandidate = syntheticCandidate(
    fixture.secondCandidate,
    'SYNTHETIC_TEST_PROJECT_B',
    fixture.secondCandidate.evidenceCount + 1,
  )
  const changedSecondSet = syntheticProjectSet(
    'SYNTHETIC_TEST_PROJECT_B',
    [changedSecondCandidate],
  )
  const changedGate = assessCrossProjectHumanPromotionGate(
    fixture.corroboration,
    [vadimCandidateSet, changedSecondSet],
    fixture.reviewEntries,
  )
  const assessment = assessHumanPromotionReviewRecord(review.record, changedGate)

  assert.equal(changedGate.state, 'BLOCKED')
  assert.equal(assessment.state, 'STALE_REQUIRES_REVIEW')
  assert.ok(assessment.reasons.includes('PROMOTION_GATE_CHANGED'))
  assert.ok(assessment.reasons.includes('PROMOTION_GATE_NO_LONGER_ELIGIBLE'))
  assert.equal(assessment.decisionCurrentlyUsableForRuleDraftBoundary, false)
})

test('RP01.7 creates only an explicit non-executable draft from a current approved review', () => {
  const fixture = eligibleFixture()
  const review = recordHumanPromotionReview(
    [],
    fixture.gate,
    'APPROVED_FOR_RULE_DRAFT',
    'Human engineer',
    '2026-09-01T09:09:00+03:00',
    'Permit drafting only; no validation or production action.',
  )
  assert.ok(review.record)

  const statement =
    'Proposed engineering statement entered explicitly for later human validation.'
  const draft = createNonExecutableRuleDraft(
    review.record,
    fixture.gate,
    'WP78 cut-pattern draft',
    statement,
    '2026-09-01T09:10:00+03:00',
  )

  assert.equal(draft.status, 'CREATED')
  assert.ok(draft.artifact)
  assert.equal(draft.artifact.artifactType, 'NON_EXECUTABLE_RULE_DRAFT')
  assert.equal(draft.artifact.draftStatus, 'DRAFT_ONLY')
  assert.equal(draft.artifact.proposedRuleStatement, statement)
  assert.equal(draft.artifact.explicitStatementInputRequired, true)
  assert.equal(draft.artifact.automaticRuleDerivationPerformed, false)
  assert.equal(draft.artifact.executable, false)
  assert.equal(draft.artifact.machineInstructionGenerated, false)
  assert.equal(draft.artifact.ruleDraftCreated, true)
})

test('RP01.7 blocks draft creation from a stale approved promotion review', () => {
  const fixture = eligibleFixture()
  const review = recordHumanPromotionReview(
    [],
    fixture.gate,
    'APPROVED_FOR_RULE_DRAFT',
    'Human engineer',
    '2026-09-01T09:11:00+03:00',
    'Original evidence review.',
  )
  assert.ok(review.record)

  const changedGate = Object.freeze({
    ...fixture.gate,
    humanPromotionReviewCanStart: false,
    state: 'BLOCKED' as const,
    reasons: Object.freeze(['CURRENT_REJECTION_PRESENT' as const]),
    anyCurrentCandidateRejectionPresent: true,
  })

  const draft = createNonExecutableRuleDraft(
    review.record,
    changedGate,
    'Stale draft attempt',
    'Should never be created.',
    '2026-09-01T09:12:00+03:00',
  )

  assert.equal(draft.status, 'NOT_CREATED')
  assert.ok(draft.reasons.includes('PROMOTION_REVIEW_NOT_CURRENT'))
})

test('RP01.7 never validates, executes, promotes, unlocks, or approves the rule draft', () => {
  const fixture = eligibleFixture()
  const review = recordHumanPromotionReview(
    [],
    fixture.gate,
    'APPROVED_FOR_RULE_DRAFT',
    'Human engineer',
    '2026-09-01T09:13:00+03:00',
    'Draft boundary safety test.',
  )
  assert.ok(review.record)

  const draft = createNonExecutableRuleDraft(
    review.record,
    fixture.gate,
    'Safety boundary draft',
    'Explicit proposal only.',
    '2026-09-01T09:14:00+03:00',
  )
  assert.ok(draft.artifact)

  assert.equal(draft.artifact.engineeringRuleValidated, false)
  assert.equal(draft.artifact.automaticRulePromotionAllowed, false)
  assert.equal(draft.artifact.productionRuleCreated, false)
  assert.equal(draft.artifact.productionUnlockAllowed, false)
  assert.equal(draft.artifact.machineReady, false)
  assert.equal(draft.artifact.productionApproved, false)

  const source = readFileSync(
    'src/realProduction/skyGlazingHumanPromotionReview.ts',
    'utf8',
  )
  assert.doesNotMatch(source, /engineeringRuleValidated:\s*true/)
  assert.doesNotMatch(source, /automaticRulePromotionAllowed:\s*true/)
  assert.doesNotMatch(source, /productionRuleCreated:\s*true/)
  assert.doesNotMatch(source, /productionUnlockAllowed:\s*true/)
  assert.doesNotMatch(source, /machineReady:\s*true/)
  assert.doesNotMatch(source, /productionApproved:\s*true/)
})

