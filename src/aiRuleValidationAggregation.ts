import type { FacadeFlowRuleEvaluationRecord } from './aiWorkspaceTypes'

export type FacadeFlowRuleGateAggregateState = 'INCOMPLETE' | 'BLOCKED_BY_FAIL' | 'REVIEWED_COMPLETE'
export type FacadeFlowRuleValidationDecision = 'NOT_MADE'

export interface FacadeFlowRuleValidationAggregation {
  state: FacadeFlowRuleGateAggregateState
  totalEvaluationCount: number
  humanReviewedCount: number
  passCount: number
  failCount: number
  notApplicableCount: number
  needsEvidenceCount: number
  pendingRequirementIds: string[]
  blockerRequirementIds: string[]
  validationDecision: FacadeFlowRuleValidationDecision
  rulesValidated: false
  finalApprovalCreated: false
  handoffLocked: true
  productionLocked: true
  simulationOnly: true
  machineReady: false
}

const isHumanReviewed = (row: FacadeFlowRuleEvaluationRecord) => row.reviewStatus === 'HUMAN_REVIEWED'

export function aggregateFacadeFlowRuleEvaluations(rows: FacadeFlowRuleEvaluationRecord[]): FacadeFlowRuleValidationAggregation {
  const reviewed = rows.filter(isHumanReviewed)
  const passCount = reviewed.filter((row) => row.result === 'PASS').length
  const failRows = reviewed.filter((row) => row.result === 'FAIL')
  const notApplicableCount = reviewed.filter((row) => row.result === 'NOT_APPLICABLE').length
  const pendingRows = rows.filter((row) => !isHumanReviewed(row) || row.result === 'NEEDS_EVIDENCE')

  let state: FacadeFlowRuleGateAggregateState = 'INCOMPLETE'
  if (failRows.length > 0) state = 'BLOCKED_BY_FAIL'
  else if (rows.length > 0 && pendingRows.length === 0 && reviewed.length === rows.length) state = 'REVIEWED_COMPLETE'

  return {
    state,
    totalEvaluationCount: rows.length,
    humanReviewedCount: reviewed.length,
    passCount,
    failCount: failRows.length,
    notApplicableCount,
    needsEvidenceCount: pendingRows.length,
    pendingRequirementIds: pendingRows.map((row) => row.requirementId),
    blockerRequirementIds: failRows.map((row) => row.requirementId),
    validationDecision: 'NOT_MADE',
    rulesValidated: false,
    finalApprovalCreated: false,
    handoffLocked: true,
    productionLocked: true,
    simulationOnly: true,
    machineReady: false,
  }
}
