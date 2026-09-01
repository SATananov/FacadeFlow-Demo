import assert from 'node:assert/strict'
import test from 'node:test'
import type { FacadeFlowRuleEvaluationRecord } from '../src/aiWorkspaceTypes'
import {
  aggregateWp78HumanRuleReviewRecords,
  assessWp78HumanRuleReviewEligibility,
  createWp78HumanRuleReviewRecord,
} from '../src/realData/wp78HumanRuleReview'

const evaluation = (
  overrides: Partial<FacadeFlowRuleEvaluationRecord> = {},
): FacadeFlowRuleEvaluationRecord => ({
  id: 'evaluation-PROFILE_COMPATIBILITY',
  requirementId: 'PROFILE_COMPATIBILITY',
  ruleId: 'WP78-PROFILE-COMPATIBILITY',
  ruleRevision: 'human-test-revision',
  applicabilityRecordId: 'applicability-PROFILE_COMPATIBILITY',
  applicabilityDecision: 'APPLIES',
  sourceRecordIds: ['source-wp78-sheet'],
  evidence: [{ id: 'evidence-wp78', sourceName: 'WP 78 source', sourceKind: 'CATALOGUE' }],
  observationSummary: 'Human-reviewed source/profile evidence context.',
  result: 'PASS',
  evaluator: 'Rule evaluator',
  evaluatedAt: '2026-09-01T06:00:00+03:00',
  reviewStatus: 'HUMAN_REVIEWED',
  reviewNote: '',
  invalidationReasons: [],
  simulationOnly: true,
  machineReady: false,
  ...overrides,
})

const baseInput = {
  request: { system: 'WP 78', role: 'FRAME' as const, code: '78,01' },
  evaluation: evaluation(),
  decision: 'CONFIRMED_FOR_RULE_CONTEXT' as const,
  reviewer: 'Human reviewer',
  reviewedAt: '2026-09-01T06:10:00+03:00',
}

test('WP78.5 records explicit human confirmation only after the WP78.4 evidence gate and generic human rule review are complete', () => {
  const record = createWp78HumanRuleReviewRecord(baseInput)
  assert.equal(record.status, 'RECORDED')
  assert.equal(record.acceptedForRuleContext, true)
  assert.equal(record.evidenceGateRow.evidenceClass, 'SOURCE_VERIFIED_PROJECT_OBSERVED')
  assert.equal(record.evaluationReviewStatus, 'HUMAN_REVIEWED')
  assert.equal(record.validationDecision, 'NOT_MADE')
  assert.equal(record.rulesValidated, false)
  assert.equal(record.productionLocked, true)
  assert.equal(record.productionApproved, false)
})

test('WP78.5 does not allow a decision record when the underlying rule evaluation is not human reviewed', () => {
  const eligibility = assessWp78HumanRuleReviewEligibility({
    ...baseInput,
    evaluation: evaluation({ reviewStatus: 'NEEDS_REVIEW', evaluator: '', evaluatedAt: null }),
  })
  assert.equal(eligibility.eligible, false)
  assert.ok(eligibility.reasons.includes('RULE_EVALUATION_NOT_HUMAN_REVIEWED'))
  assert.ok(eligibility.reasons.includes('RULE_EVALUATION_INCOMPLETE'))
})

test('WP78.5 requires explicit acknowledgement before confirming source-only 78,22 with a Vadim project evidence gap', () => {
  const input = {
    ...baseInput,
    request: { system: 'WP 78', role: 'SASH' as const, code: '78,22' },
  }
  const blocked = createWp78HumanRuleReviewRecord(input)
  assert.equal(blocked.status, 'NOT_ELIGIBLE')
  assert.equal(blocked.projectEvidenceGapPresent, true)
  assert.ok(blocked.eligibilityReasons.includes('PROJECT_EVIDENCE_GAP_NOT_ACKNOWLEDGED'))

  const acknowledged = createWp78HumanRuleReviewRecord({ ...input, projectEvidenceGapAcknowledged: true })
  assert.equal(acknowledged.status, 'RECORDED')
  assert.equal(acknowledged.acceptedForRuleContext, true)
  assert.equal(acknowledged.projectEvidenceGapAcknowledged, true)
})

test('WP78.5 blocks a human decision record for project-only 78.27 because its role remains unconfirmed', () => {
  const record = createWp78HumanRuleReviewRecord({
    ...baseInput,
    request: { system: 'WP 78', role: 'SASH' as const, code: '78.27' },
  })
  assert.equal(record.status, 'NOT_ELIGIBLE')
  assert.ok(record.eligibilityReasons.includes('EVIDENCE_GATE_BLOCKED'))
  assert.equal(record.evidenceGateRow.decision, 'BLOCK_ROLE_ASSUMPTION')
})

test('WP78.5 does not repurpose unrelated rule requirements as WP78 profile evidence decisions', () => {
  const record = createWp78HumanRuleReviewRecord({
    ...baseInput,
    evaluation: evaluation({ id: 'evaluation-GEOMETRY_LIMITS', requirementId: 'GEOMETRY_LIMITS' }),
  })
  assert.equal(record.status, 'NOT_ELIGIBLE')
  assert.ok(record.eligibilityReasons.includes('REQUIREMENT_NOT_RELEVANT'))
})

test('WP78.5 can record an explicit human rejection without converting it into final rule validation', () => {
  const record = createWp78HumanRuleReviewRecord({
    ...baseInput,
    decision: 'REJECTED_FOR_RULE_CONTEXT',
    reviewNote: 'Evidence is not sufficient for this rule context.',
  })
  assert.equal(record.status, 'RECORDED')
  assert.equal(record.humanRejected, true)
  assert.equal(record.acceptedForRuleContext, false)
  assert.equal(record.validationDecision, 'NOT_MADE')
  assert.equal(record.productionLocked, true)
})

test('WP78.5 aggregation records human review state while production and final validation remain locked', () => {
  const frame = createWp78HumanRuleReviewRecord(baseInput)
  const divider = createWp78HumanRuleReviewRecord({
    ...baseInput,
    request: { system: 'WP 78', role: 'MULLION' as const, code: '78,33' },
    evaluation: evaluation({ id: 'evaluation-SOURCE_TRACEABILITY', requirementId: 'SOURCE_TRACEABILITY' }),
  })
  const aggregate = aggregateWp78HumanRuleReviewRecords([frame, divider])
  assert.equal(aggregate.state, 'HUMAN_REVIEW_RECORDED_PRODUCTION_LOCKED')
  assert.equal(aggregate.confirmedCount, 2)
  assert.equal(aggregate.validationDecision, 'NOT_MADE')
  assert.equal(aggregate.rulesValidated, false)
  assert.equal(aggregate.finalApprovalCreated, false)
  assert.equal(aggregate.machineReady, false)
})

test('WP78.5 aggregation exposes an explicit human rejection as a blocker', () => {
  const confirmed = createWp78HumanRuleReviewRecord(baseInput)
  const rejected = createWp78HumanRuleReviewRecord({ ...baseInput, decision: 'REJECTED_FOR_RULE_CONTEXT' })
  const aggregate = aggregateWp78HumanRuleReviewRecords([confirmed, rejected])
  assert.equal(aggregate.state, 'HUMAN_REJECTION_BLOCKED')
  assert.equal(aggregate.rejectedCount, 1)
  assert.deepEqual(aggregate.rejectedEvaluationIds, ['evaluation-PROFILE_COMPATIBILITY'])
  assert.equal(aggregate.productionLocked, true)
})
