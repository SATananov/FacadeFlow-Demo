import {
  aggregateWp78HumanRuleReviewRecords,
  type Wp78HumanRuleReviewAggregation,
  type Wp78HumanRuleReviewRecord,
} from './wp78HumanRuleReview'
import { WP78_SYSTEM_LABEL } from './wp78'

export type Wp78ContextValidationDecision =
  | 'VALIDATED_FOR_CONTEXT'
  | 'REJECTED_FOR_CONTEXT'

export type Wp78ContextValidationRecordStatus =
  | 'RECORDED'
  | 'NOT_ELIGIBLE'

export type Wp78ContextValidationEligibilityReason =
  | 'CONTEXT_ID_REQUIRED'
  | 'NO_HUMAN_REVIEW_RECORDS'
  | 'HUMAN_REVIEW_INCOMPLETE'
  | 'HUMAN_REJECTION_PRESENT'
  | 'HUMAN_REJECTION_REQUIRED_FOR_REJECTION'
  | 'DUPLICATE_EVALUATION_RECORDS'
  | 'DECIDER_REQUIRED'
  | 'DECISION_TIMESTAMP_REQUIRED'

export interface Wp78ContextValidationDecisionInput {
  contextId: string
  humanReviewRecords: Wp78HumanRuleReviewRecord[]
  decision: Wp78ContextValidationDecision
  decider: string
  decidedAt: string
  decisionNote?: string
}

export interface Wp78ContextValidationEligibility {
  eligible: boolean
  reasons: Wp78ContextValidationEligibilityReason[]
  humanReviewAggregation: Wp78HumanRuleReviewAggregation
  duplicateEvaluationIds: string[]
}

export interface Wp78ContextValidationDecisionRecord {
  id: string
  status: Wp78ContextValidationRecordStatus
  system: typeof WP78_SYSTEM_LABEL
  contextId: string
  contextDecision: Wp78ContextValidationDecision | null
  decider: string
  decidedAt: string | null
  decisionNote: string
  humanReviewAggregateState: Wp78HumanRuleReviewAggregation['state']
  humanReviewRecordIds: string[]
  evaluationIds: string[]
  confirmedEvaluationIds: string[]
  rejectedEvaluationIds: string[]
  eligibilityReasons: Wp78ContextValidationEligibilityReason[]
  closureRecorded: boolean
  validatedForContext: boolean
  rejectedForContext: boolean
  contextOnly: true
  genericValidationDecision: 'NOT_MADE'
  rulesValidated: false
  finalApprovalCreated: false
  handoffLocked: true
  productionLocked: true
  simulationOnly: true
  machineReady: false
  productionApproved: false
  productionUnlockAllowed: false
}

function duplicateEvaluationIds(records: Wp78HumanRuleReviewRecord[]): string[] {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const record of records) {
    if (seen.has(record.evaluationId)) duplicates.add(record.evaluationId)
    seen.add(record.evaluationId)
  }
  return [...duplicates]
}

export function assessWp78ContextValidationEligibility(
  input: Wp78ContextValidationDecisionInput,
): Wp78ContextValidationEligibility {
  const humanReviewAggregation = aggregateWp78HumanRuleReviewRecords(input.humanReviewRecords)
  const reasons: Wp78ContextValidationEligibilityReason[] = []
  const duplicates = duplicateEvaluationIds(input.humanReviewRecords)

  if (!input.contextId.trim()) reasons.push('CONTEXT_ID_REQUIRED')
  if (input.humanReviewRecords.length === 0) reasons.push('NO_HUMAN_REVIEW_RECORDS')
  if (humanReviewAggregation.notEligibleCount > 0) reasons.push('HUMAN_REVIEW_INCOMPLETE')
  if (duplicates.length > 0) reasons.push('DUPLICATE_EVALUATION_RECORDS')

  if (input.decision === 'VALIDATED_FOR_CONTEXT') {
    if (humanReviewAggregation.rejectedCount > 0) reasons.push('HUMAN_REJECTION_PRESENT')
    if (
      input.humanReviewRecords.length > 0
      && (
        humanReviewAggregation.state !== 'HUMAN_REVIEW_RECORDED_PRODUCTION_LOCKED'
        || humanReviewAggregation.confirmedCount !== input.humanReviewRecords.length
      )
    ) reasons.push('HUMAN_REVIEW_INCOMPLETE')
  }

  if (
    input.decision === 'REJECTED_FOR_CONTEXT'
    && humanReviewAggregation.rejectedCount === 0
  ) reasons.push('HUMAN_REJECTION_REQUIRED_FOR_REJECTION')

  if (!input.decider.trim()) reasons.push('DECIDER_REQUIRED')
  if (!input.decidedAt.trim()) reasons.push('DECISION_TIMESTAMP_REQUIRED')

  return Object.freeze({
    eligible: reasons.length === 0,
    reasons,
    humanReviewAggregation,
    duplicateEvaluationIds: duplicates,
  })
}

export function createWp78ContextValidationDecisionRecord(
  input: Wp78ContextValidationDecisionInput,
): Wp78ContextValidationDecisionRecord {
  const eligibility = assessWp78ContextValidationEligibility(input)
  const recorded = eligibility.eligible
  const contextDecision = recorded ? input.decision : null
  const recordedReviews = input.humanReviewRecords.filter((record) => record.status === 'RECORDED')

  return Object.freeze({
    id: `wp78-context-validation-${input.contextId.trim() || 'unresolved'}`,
    status: recorded ? 'RECORDED' : 'NOT_ELIGIBLE',
    system: WP78_SYSTEM_LABEL,
    contextId: input.contextId.trim(),
    contextDecision,
    decider: recorded ? input.decider.trim() : '',
    decidedAt: recorded ? input.decidedAt : null,
    decisionNote: recorded ? (input.decisionNote ?? '').trim() : '',
    humanReviewAggregateState: eligibility.humanReviewAggregation.state,
    humanReviewRecordIds: recordedReviews.map((record) => record.id),
    evaluationIds: recordedReviews.map((record) => record.evaluationId),
    confirmedEvaluationIds: recordedReviews
      .filter((record) => record.acceptedForRuleContext)
      .map((record) => record.evaluationId),
    rejectedEvaluationIds: recordedReviews
      .filter((record) => record.humanRejected)
      .map((record) => record.evaluationId),
    eligibilityReasons: [...eligibility.reasons],
    closureRecorded: recorded,
    validatedForContext: contextDecision === 'VALIDATED_FOR_CONTEXT',
    rejectedForContext: contextDecision === 'REJECTED_FOR_CONTEXT',
    contextOnly: true,
    genericValidationDecision: 'NOT_MADE',
    rulesValidated: false,
    finalApprovalCreated: false,
    handoffLocked: true,
    productionLocked: true,
    simulationOnly: true,
    machineReady: false,
    productionApproved: false,
    productionUnlockAllowed: false,
  })
}
