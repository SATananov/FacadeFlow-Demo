import assert from 'node:assert/strict'
import test from 'node:test'
import type { FacadeFlowRuleEvaluationRecord } from '../src/aiWorkspaceTypes'
import { createWp78HumanRuleReviewRecord } from '../src/realData/wp78HumanRuleReview'
import {
  assessWp78ContextValidationEligibility,
  createWp78ContextValidationDecisionRecord,
} from '../src/realData/wp78ValidationDecisionRecord'

const evaluation = (
  id: string,
  requirementId: FacadeFlowRuleEvaluationRecord['requirementId'],
  overrides: Partial<FacadeFlowRuleEvaluationRecord> = {},
): FacadeFlowRuleEvaluationRecord => ({
  id,
  requirementId,
  ruleId: `WP78-${requirementId}`,
  ruleRevision: 'wp78-6-test-revision',
  applicabilityRecordId: `applicability-${requirementId}`,
  applicabilityDecision: 'APPLIES',
  sourceRecordIds: ['source-wp78-sheet'],
  evidence: [{ id: `evidence-${id}`, sourceName: 'WP 78 checked evidence', sourceKind: 'CATALOGUE' }],
  observationSummary: 'Human-reviewed WP78 evidence context.',
  result: 'PASS',
  evaluator: 'Rule evaluator',
  evaluatedAt: '2026-09-01T07:00:00+03:00',
  reviewStatus: 'HUMAN_REVIEWED',
  reviewNote: '',
  invalidationReasons: [],
  simulationOnly: true,
  machineReady: false,
  ...overrides,
})

const confirmedFrame = () => createWp78HumanRuleReviewRecord({
  request: { system: 'WP 78', role: 'FRAME', code: '78,01' },
  evaluation: evaluation('evaluation-frame', 'PROFILE_COMPATIBILITY'),
  decision: 'CONFIRMED_FOR_RULE_CONTEXT',
  reviewer: 'Human reviewer',
  reviewedAt: '2026-09-01T07:10:00+03:00',
})

const confirmedDivider = () => createWp78HumanRuleReviewRecord({
  request: { system: 'WP 78', role: 'MULLION', code: '78,33' },
  evaluation: evaluation('evaluation-divider', 'SOURCE_TRACEABILITY'),
  decision: 'CONFIRMED_FOR_RULE_CONTEXT',
  reviewer: 'Human reviewer',
  reviewedAt: '2026-09-01T07:11:00+03:00',
})

const rejectedFrame = () => createWp78HumanRuleReviewRecord({
  request: { system: 'WP 78', role: 'FRAME', code: '78,01' },
  evaluation: evaluation('evaluation-frame-rejected', 'PROFILE_COMPATIBILITY'),
  decision: 'REJECTED_FOR_RULE_CONTEXT',
  reviewer: 'Human reviewer',
  reviewedAt: '2026-09-01T07:12:00+03:00',
  reviewNote: 'Rejected for this context.',
})

const baseInput = () => ({
  contextId: 'WP78-WINDOW-CONTEXT-001',
  humanReviewRecords: [confirmedFrame(), confirmedDivider()],
  decision: 'VALIDATED_FOR_CONTEXT' as const,
  decider: 'Senior technologist',
  decidedAt: '2026-09-01T07:20:00+03:00',
  decisionNote: 'Context closure only.',
})

test('WP78.6 records VALIDATED_FOR_CONTEXT only after every supplied human review is recorded and confirmed', () => {
  const record = createWp78ContextValidationDecisionRecord(baseInput())
  assert.equal(record.status, 'RECORDED')
  assert.equal(record.contextDecision, 'VALIDATED_FOR_CONTEXT')
  assert.equal(record.validatedForContext, true)
  assert.equal(record.rejectedForContext, false)
  assert.equal(record.humanReviewAggregateState, 'HUMAN_REVIEW_RECORDED_PRODUCTION_LOCKED')
  assert.deepEqual(record.confirmedEvaluationIds, ['evaluation-frame', 'evaluation-divider'])
})

test('WP78.6 can close a source-only sash context after WP78.5 has explicitly acknowledged the Vadim evidence gap', () => {
  const sash = createWp78HumanRuleReviewRecord({
    request: { system: 'WP 78', role: 'SASH', code: '78,22' },
    evaluation: evaluation('evaluation-sash', 'PROFILE_COMPATIBILITY'),
    decision: 'CONFIRMED_FOR_RULE_CONTEXT',
    reviewer: 'Human reviewer',
    reviewedAt: '2026-09-01T07:13:00+03:00',
    projectEvidenceGapAcknowledged: true,
  })
  assert.equal(sash.status, 'RECORDED')
  assert.equal(sash.projectEvidenceGapPresent, true)

  const record = createWp78ContextValidationDecisionRecord({
    ...baseInput(),
    contextId: 'WP78-WINDOW-CONTEXT-SASH',
    humanReviewRecords: [sash],
  })
  assert.equal(record.status, 'RECORDED')
  assert.equal(record.contextDecision, 'VALIDATED_FOR_CONTEXT')
})

test('WP78.6 refuses VALIDATED_FOR_CONTEXT when any recorded human review rejects the context', () => {
  const eligibility = assessWp78ContextValidationEligibility({
    ...baseInput(),
    humanReviewRecords: [confirmedFrame(), rejectedFrame()],
  })
  assert.equal(eligibility.eligible, false)
  assert.ok(eligibility.reasons.includes('HUMAN_REJECTION_PRESENT'))
})

test('WP78.6 records REJECTED_FOR_CONTEXT only when a recorded human rejection exists', () => {
  const record = createWp78ContextValidationDecisionRecord({
    ...baseInput(),
    humanReviewRecords: [confirmedFrame(), rejectedFrame()],
    decision: 'REJECTED_FOR_CONTEXT',
  })
  assert.equal(record.status, 'RECORDED')
  assert.equal(record.contextDecision, 'REJECTED_FOR_CONTEXT')
  assert.equal(record.rejectedForContext, true)
  assert.deepEqual(record.rejectedEvaluationIds, ['evaluation-frame-rejected'])
})

test('WP78.6 does not manufacture a rejected closure from an all-confirmed review set', () => {
  const record = createWp78ContextValidationDecisionRecord({
    ...baseInput(),
    decision: 'REJECTED_FOR_CONTEXT',
  })
  assert.equal(record.status, 'NOT_ELIGIBLE')
  assert.equal(record.contextDecision, null)
  assert.ok(record.eligibilityReasons.includes('HUMAN_REJECTION_REQUIRED_FOR_REJECTION'))
})

test('WP78.6 cannot close project-only 78.27 because WP78.5 never records a role assumption for it', () => {
  const blockedReview = createWp78HumanRuleReviewRecord({
    request: { system: 'WP 78', role: 'SASH', code: '78.27' },
    evaluation: evaluation('evaluation-role-unconfirmed', 'PROFILE_COMPATIBILITY'),
    decision: 'CONFIRMED_FOR_RULE_CONTEXT',
    reviewer: 'Human reviewer',
    reviewedAt: '2026-09-01T07:14:00+03:00',
  })
  assert.equal(blockedReview.status, 'NOT_ELIGIBLE')

  const record = createWp78ContextValidationDecisionRecord({
    ...baseInput(),
    contextId: 'WP78-UNCONFIRMED-ROLE',
    humanReviewRecords: [blockedReview],
  })
  assert.equal(record.status, 'NOT_ELIGIBLE')
  assert.ok(record.eligibilityReasons.includes('HUMAN_REVIEW_INCOMPLETE'))
})

test('WP78.6 rejects vacuous closure, missing decision metadata, and duplicate evaluation records', () => {
  const empty = createWp78ContextValidationDecisionRecord({
    ...baseInput(),
    contextId: '',
    humanReviewRecords: [],
    decider: '',
    decidedAt: '',
  })
  assert.equal(empty.status, 'NOT_ELIGIBLE')
  assert.ok(empty.eligibilityReasons.includes('CONTEXT_ID_REQUIRED'))
  assert.ok(empty.eligibilityReasons.includes('NO_HUMAN_REVIEW_RECORDS'))
  assert.ok(empty.eligibilityReasons.includes('DECIDER_REQUIRED'))
  assert.ok(empty.eligibilityReasons.includes('DECISION_TIMESTAMP_REQUIRED'))

  const frame = confirmedFrame()
  const duplicate = createWp78ContextValidationDecisionRecord({
    ...baseInput(),
    humanReviewRecords: [frame, frame],
  })
  assert.equal(duplicate.status, 'NOT_ELIGIBLE')
  assert.ok(duplicate.eligibilityReasons.includes('DUPLICATE_EVALUATION_RECORDS'))
})

test('WP78.6 context closure never becomes generic rule validation, final approval, machine readiness, or production unlock', () => {
  const record = createWp78ContextValidationDecisionRecord(baseInput())
  assert.equal(record.contextOnly, true)
  assert.equal(record.genericValidationDecision, 'NOT_MADE')
  assert.equal(record.rulesValidated, false)
  assert.equal(record.finalApprovalCreated, false)
  assert.equal(record.handoffLocked, true)
  assert.equal(record.productionLocked, true)
  assert.equal(record.simulationOnly, true)
  assert.equal(record.machineReady, false)
  assert.equal(record.productionApproved, false)
  assert.equal(record.productionUnlockAllowed, false)
})
