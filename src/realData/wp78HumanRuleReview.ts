import type { FacadeFlowRuleEvaluationRecord, FacadeFlowRuleGateRequirementId } from '../aiWorkspaceTypes'
import {
  evaluateWp78ProfileEvidenceGate,
  WP78_EVIDENCE_RELEVANT_REQUIREMENTS,
  type Wp78ProfileEvidenceGateRow,
  type Wp78ProfileEvidenceRequest,
} from './wp78EvidenceAwareRuleGate'

export type Wp78HumanRuleReviewDecision = 'CONFIRMED_FOR_RULE_CONTEXT' | 'REJECTED_FOR_RULE_CONTEXT'
export type Wp78HumanRuleReviewRecordStatus = 'RECORDED' | 'NOT_ELIGIBLE'
export type Wp78HumanRuleReviewEligibilityReason =
  | 'EVIDENCE_GATE_BLOCKED'
  | 'REQUIREMENT_NOT_RELEVANT'
  | 'RULE_EVALUATION_NOT_HUMAN_REVIEWED'
  | 'RULE_EVALUATION_INCOMPLETE'
  | 'RULE_RESULT_NEEDS_EVIDENCE'
  | 'REVIEWER_REQUIRED'
  | 'REVIEW_TIMESTAMP_REQUIRED'
  | 'PROJECT_EVIDENCE_GAP_NOT_ACKNOWLEDGED'

export interface Wp78HumanRuleReviewInput {
  request: Wp78ProfileEvidenceRequest
  evaluation: FacadeFlowRuleEvaluationRecord
  decision: Wp78HumanRuleReviewDecision
  reviewer: string
  reviewedAt: string
  reviewNote?: string
  projectEvidenceGapAcknowledged?: boolean
}

export interface Wp78HumanRuleReviewEligibility {
  eligible: boolean
  reasons: Wp78HumanRuleReviewEligibilityReason[]
  evidenceGateRow: Wp78ProfileEvidenceGateRow
  relevantRequirement: boolean
  projectEvidenceGapPresent: boolean
}

export interface Wp78HumanRuleReviewRecord {
  id: string
  status: Wp78HumanRuleReviewRecordStatus
  request: Wp78ProfileEvidenceRequest
  evidenceGateRow: Wp78ProfileEvidenceGateRow
  evaluationId: string
  requirementId: FacadeFlowRuleGateRequirementId
  evaluationResult: FacadeFlowRuleEvaluationRecord['result']
  evaluationReviewStatus: FacadeFlowRuleEvaluationRecord['reviewStatus']
  evaluationEvaluator: string
  evaluationEvaluatedAt: string | null
  decision: Wp78HumanRuleReviewDecision | null
  reviewer: string
  reviewedAt: string | null
  reviewNote: string
  projectEvidenceGapPresent: boolean
  projectEvidenceGapAcknowledged: boolean
  eligibilityReasons: Wp78HumanRuleReviewEligibilityReason[]
  acceptedForRuleContext: boolean
  humanRejected: boolean
  validationDecision: 'NOT_MADE'
  rulesValidated: false
  finalApprovalCreated: false
  handoffLocked: true
  productionLocked: true
  simulationOnly: true
  machineReady: false
  productionApproved: false
}

export type Wp78HumanRuleReviewAggregateState =
  | 'NO_RECORDS'
  | 'HUMAN_REVIEW_INCOMPLETE'
  | 'HUMAN_REJECTION_BLOCKED'
  | 'HUMAN_REVIEW_RECORDED_PRODUCTION_LOCKED'

export interface Wp78HumanRuleReviewAggregation {
  state: Wp78HumanRuleReviewAggregateState
  totalRecordCount: number
  recordedCount: number
  confirmedCount: number
  rejectedCount: number
  notEligibleCount: number
  rejectedEvaluationIds: string[]
  pendingEvaluationIds: string[]
  validationDecision: 'NOT_MADE'
  rulesValidated: false
  finalApprovalCreated: false
  handoffLocked: true
  productionLocked: true
  simulationOnly: true
  machineReady: false
  productionApproved: false
}

const hasRelevantRequirement = (requirementId: FacadeFlowRuleGateRequirementId) =>
  WP78_EVIDENCE_RELEVANT_REQUIREMENTS.includes(requirementId)

export function assessWp78HumanRuleReviewEligibility(input: Wp78HumanRuleReviewInput): Wp78HumanRuleReviewEligibility {
  const evidenceGateRow = evaluateWp78ProfileEvidenceGate(input.request)
  const reasons: Wp78HumanRuleReviewEligibilityReason[] = []
  const relevantRequirement = hasRelevantRequirement(input.evaluation.requirementId)
  const projectEvidenceGapPresent = evidenceGateRow.evidenceClass === 'SOURCE_VERIFIED_SOURCE_ONLY'

  if (!evidenceGateRow.eligibleForHumanRuleReview) reasons.push('EVIDENCE_GATE_BLOCKED')
  if (!relevantRequirement) reasons.push('REQUIREMENT_NOT_RELEVANT')
  if (input.evaluation.reviewStatus !== 'HUMAN_REVIEWED') reasons.push('RULE_EVALUATION_NOT_HUMAN_REVIEWED')
  if (!input.evaluation.evaluator.trim() || !input.evaluation.evaluatedAt?.trim()) reasons.push('RULE_EVALUATION_INCOMPLETE')
  if (input.evaluation.result === 'NEEDS_EVIDENCE') reasons.push('RULE_RESULT_NEEDS_EVIDENCE')
  if (!input.reviewer.trim()) reasons.push('REVIEWER_REQUIRED')
  if (!input.reviewedAt.trim()) reasons.push('REVIEW_TIMESTAMP_REQUIRED')
  if (
    input.decision === 'CONFIRMED_FOR_RULE_CONTEXT'
    && projectEvidenceGapPresent
    && input.projectEvidenceGapAcknowledged !== true
  ) reasons.push('PROJECT_EVIDENCE_GAP_NOT_ACKNOWLEDGED')

  return {
    eligible: reasons.length === 0,
    reasons,
    evidenceGateRow,
    relevantRequirement,
    projectEvidenceGapPresent,
  }
}

export function createWp78HumanRuleReviewRecord(input: Wp78HumanRuleReviewInput): Wp78HumanRuleReviewRecord {
  const eligibility = assessWp78HumanRuleReviewEligibility(input)
  const recorded = eligibility.eligible
  const decision = recorded ? input.decision : null
  const projectEvidenceGapAcknowledged = input.projectEvidenceGapAcknowledged === true

  return Object.freeze({
    id: `wp78-human-rule-review-${input.evaluation.id}`,
    status: recorded ? 'RECORDED' : 'NOT_ELIGIBLE',
    request: { ...input.request },
    evidenceGateRow: eligibility.evidenceGateRow,
    evaluationId: input.evaluation.id,
    requirementId: input.evaluation.requirementId,
    evaluationResult: input.evaluation.result,
    evaluationReviewStatus: input.evaluation.reviewStatus,
    evaluationEvaluator: input.evaluation.evaluator,
    evaluationEvaluatedAt: input.evaluation.evaluatedAt,
    decision,
    reviewer: recorded ? input.reviewer.trim() : '',
    reviewedAt: recorded ? input.reviewedAt : null,
    reviewNote: recorded ? (input.reviewNote ?? '').trim() : '',
    projectEvidenceGapPresent: eligibility.projectEvidenceGapPresent,
    projectEvidenceGapAcknowledged,
    eligibilityReasons: [...eligibility.reasons],
    acceptedForRuleContext: decision === 'CONFIRMED_FOR_RULE_CONTEXT',
    humanRejected: decision === 'REJECTED_FOR_RULE_CONTEXT',
    validationDecision: 'NOT_MADE',
    rulesValidated: false,
    finalApprovalCreated: false,
    handoffLocked: true,
    productionLocked: true,
    simulationOnly: true,
    machineReady: false,
    productionApproved: false,
  })
}

export function aggregateWp78HumanRuleReviewRecords(records: Wp78HumanRuleReviewRecord[]): Wp78HumanRuleReviewAggregation {
  const recorded = records.filter((record) => record.status === 'RECORDED')
  const rejected = recorded.filter((record) => record.humanRejected)
  const confirmed = recorded.filter((record) => record.acceptedForRuleContext)
  const notEligible = records.filter((record) => record.status === 'NOT_ELIGIBLE')

  let state: Wp78HumanRuleReviewAggregateState = 'NO_RECORDS'
  if (records.length > 0 && rejected.length > 0) state = 'HUMAN_REJECTION_BLOCKED'
  else if (records.length > 0 && notEligible.length > 0) state = 'HUMAN_REVIEW_INCOMPLETE'
  else if (records.length > 0 && recorded.length === records.length) state = 'HUMAN_REVIEW_RECORDED_PRODUCTION_LOCKED'

  return Object.freeze({
    state,
    totalRecordCount: records.length,
    recordedCount: recorded.length,
    confirmedCount: confirmed.length,
    rejectedCount: rejected.length,
    notEligibleCount: notEligible.length,
    rejectedEvaluationIds: rejected.map((record) => record.evaluationId),
    pendingEvaluationIds: notEligible.map((record) => record.evaluationId),
    validationDecision: 'NOT_MADE',
    rulesValidated: false,
    finalApprovalCreated: false,
    handoffLocked: true,
    productionLocked: true,
    simulationOnly: true,
    machineReady: false,
    productionApproved: false,
  })
}
