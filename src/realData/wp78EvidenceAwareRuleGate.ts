import { aggregateFacadeFlowRuleEvaluations } from '../aiRuleValidationAggregation'
import type { FacadeFlowRuleEvaluationRecord, FacadeFlowRuleGateRequirementId } from '../aiWorkspaceTypes'
import type { ProfileRole } from '../profileCatalogueTypes'
import {
  normalizeWp78EvidenceCode,
  wp78ProjectOnlyEvidenceLinks,
  wp78ProjectSystemEvidenceLink,
  wp78RoleProjectEvidenceLinks,
} from './wp78ProjectSystemEvidenceLink'
import { WP78_SYSTEM_LABEL } from './wp78'

export type Wp78EvidenceClass =
  | 'SOURCE_VERIFIED_PROJECT_OBSERVED'
  | 'SOURCE_VERIFIED_SOURCE_ONLY'
  | 'PROJECT_OBSERVED_ROLE_UNCONFIRMED'
  | 'SOURCE_ROLE_MISMATCH'
  | 'UNKNOWN_CODE'
  | 'SYSTEM_MISMATCH'

export type Wp78EvidenceGateDecision =
  | 'ELIGIBLE_FOR_HUMAN_RULE_REVIEW'
  | 'ELIGIBLE_WITH_PROJECT_EVIDENCE_GAP'
  | 'BLOCK_ROLE_ASSUMPTION'
  | 'BLOCK_SOURCE_ROLE_MISMATCH'
  | 'BLOCK_UNKNOWN_CODE'
  | 'BLOCK_SYSTEM_MISMATCH'

export type Wp78EvidenceGateAggregateState =
  | 'NO_REQUESTS'
  | 'BLOCKED_EVIDENCE'
  | 'READY_FOR_HUMAN_RULE_REVIEW'
  | 'READY_FOR_HUMAN_RULE_REVIEW_WITH_PROJECT_GAPS'

export interface Wp78ProfileEvidenceRequest {
  system: string
  role: ProfileRole
  code: string
}

export interface Wp78ProfileEvidenceGateRow {
  systemLiteral: string
  requestedRole: ProfileRole
  requestedCodeLiteral: string
  normalizedComparableCode: string
  evidenceClass: Wp78EvidenceClass
  decision: Wp78EvidenceGateDecision
  verifiedSourceRole: ProfileRole | null
  sourceCodeLiteral: string | null
  projectCodeLiteral: string | null
  sourceBacked: boolean
  projectObserved: boolean
  projectEvidenceId: string | null
  eligibleForHumanRuleReview: boolean
  autoRulePassAllowed: false
  rulesValidated: false
  machineReady: false
  productionApproved: false
}

export interface Wp78EvidenceGateAssessment {
  system: typeof WP78_SYSTEM_LABEL
  project: string
  candidateSystemStatus: typeof wp78ProjectSystemEvidenceLink.candidateStatus
  state: Wp78EvidenceGateAggregateState
  rows: Wp78ProfileEvidenceGateRow[]
  totalRequestCount: number
  eligibleRequestCount: number
  blockedRequestCount: number
  sourceVerifiedProjectObservedCount: number
  sourceVerifiedSourceOnlyCount: number
  projectObservedRoleUnconfirmedCount: number
  blockerCodes: string[]
  projectEvidenceGapCodes: string[]
  relevantRequirementIds: FacadeFlowRuleGateRequirementId[]
  evidencePreconditionOnly: true
  humanRuleReviewRequired: true
  autoRulePassAllowed: false
  rulesValidated: false
  finalApprovalCreated: false
  handoffLocked: true
  productionLocked: true
  machineReady: false
}

export type Wp78IntegratedRuleGateState =
  | 'EVIDENCE_BLOCKED'
  | 'RULE_REVIEW_INCOMPLETE'
  | 'RULE_FAIL_BLOCKED'
  | 'REVIEWED_COMPLETE_PRODUCTION_LOCKED'

export const WP78_EVIDENCE_RELEVANT_REQUIREMENTS: FacadeFlowRuleGateRequirementId[] = [
  'PROFILE_COMPATIBILITY',
  'SOURCE_TRACEABILITY',
]

const blockedDecision = (decision: Wp78EvidenceGateDecision) => decision.startsWith('BLOCK_')

export function evaluateWp78ProfileEvidenceGate(
  request: Wp78ProfileEvidenceRequest,
): Wp78ProfileEvidenceGateRow {
  const systemLiteral = request.system.trim()
  const requestedCodeLiteral = request.code.trim()
  const normalizedComparableCode = normalizeWp78EvidenceCode(requestedCodeLiteral)

  if (systemLiteral !== WP78_SYSTEM_LABEL) {
    return {
      systemLiteral,
      requestedRole: request.role,
      requestedCodeLiteral,
      normalizedComparableCode,
      evidenceClass: 'SYSTEM_MISMATCH',
      decision: 'BLOCK_SYSTEM_MISMATCH',
      verifiedSourceRole: null,
      sourceCodeLiteral: null,
      projectCodeLiteral: null,
      sourceBacked: false,
      projectObserved: false,
      projectEvidenceId: null,
      eligibleForHumanRuleReview: false,
      autoRulePassAllowed: false,
      rulesValidated: false,
      machineReady: false,
      productionApproved: false,
    }
  }

  const sourceLink = wp78RoleProjectEvidenceLinks.find(
    (link) => normalizeWp78EvidenceCode(link.sourceCodeLiteral) === normalizedComparableCode,
  )

  if (sourceLink) {
    if (sourceLink.catalogueRole !== request.role) {
      return {
        systemLiteral,
        requestedRole: request.role,
        requestedCodeLiteral,
        normalizedComparableCode,
        evidenceClass: 'SOURCE_ROLE_MISMATCH',
        decision: 'BLOCK_SOURCE_ROLE_MISMATCH',
        verifiedSourceRole: sourceLink.catalogueRole,
        sourceCodeLiteral: sourceLink.sourceCodeLiteral,
        projectCodeLiteral: sourceLink.projectCodeLiteral,
        sourceBacked: true,
        projectObserved: sourceLink.projectObserved,
        projectEvidenceId: sourceLink.projectEvidenceId,
        eligibleForHumanRuleReview: false,
        autoRulePassAllowed: false,
        rulesValidated: false,
        machineReady: false,
        productionApproved: false,
      }
    }

    const projectObserved = sourceLink.projectObserved
    return {
      systemLiteral,
      requestedRole: request.role,
      requestedCodeLiteral,
      normalizedComparableCode,
      evidenceClass: projectObserved ? 'SOURCE_VERIFIED_PROJECT_OBSERVED' : 'SOURCE_VERIFIED_SOURCE_ONLY',
      decision: projectObserved ? 'ELIGIBLE_FOR_HUMAN_RULE_REVIEW' : 'ELIGIBLE_WITH_PROJECT_EVIDENCE_GAP',
      verifiedSourceRole: sourceLink.catalogueRole,
      sourceCodeLiteral: sourceLink.sourceCodeLiteral,
      projectCodeLiteral: sourceLink.projectCodeLiteral,
      sourceBacked: true,
      projectObserved,
      projectEvidenceId: sourceLink.projectEvidenceId,
      eligibleForHumanRuleReview: true,
      autoRulePassAllowed: false,
      rulesValidated: false,
      machineReady: false,
      productionApproved: false,
    }
  }

  const projectOnlyLink = wp78ProjectOnlyEvidenceLinks.find(
    (link) => normalizeWp78EvidenceCode(link.projectCodeLiteral) === normalizedComparableCode,
  )

  if (projectOnlyLink) {
    return {
      systemLiteral,
      requestedRole: request.role,
      requestedCodeLiteral,
      normalizedComparableCode,
      evidenceClass: 'PROJECT_OBSERVED_ROLE_UNCONFIRMED',
      decision: 'BLOCK_ROLE_ASSUMPTION',
      verifiedSourceRole: null,
      sourceCodeLiteral: null,
      projectCodeLiteral: projectOnlyLink.projectCodeLiteral,
      sourceBacked: false,
      projectObserved: true,
      projectEvidenceId: projectOnlyLink.projectEvidenceId,
      eligibleForHumanRuleReview: false,
      autoRulePassAllowed: false,
      rulesValidated: false,
      machineReady: false,
      productionApproved: false,
    }
  }

  return {
    systemLiteral,
    requestedRole: request.role,
    requestedCodeLiteral,
    normalizedComparableCode,
    evidenceClass: 'UNKNOWN_CODE',
    decision: 'BLOCK_UNKNOWN_CODE',
    verifiedSourceRole: null,
    sourceCodeLiteral: null,
    projectCodeLiteral: null,
    sourceBacked: false,
    projectObserved: false,
    projectEvidenceId: null,
    eligibleForHumanRuleReview: false,
    autoRulePassAllowed: false,
    rulesValidated: false,
    machineReady: false,
    productionApproved: false,
  }
}

export function aggregateWp78ProfileEvidenceGate(
  requests: Wp78ProfileEvidenceRequest[],
): Wp78EvidenceGateAssessment {
  const rows = requests.map(evaluateWp78ProfileEvidenceGate)
  const blockedRows = rows.filter((row) => blockedDecision(row.decision))
  const projectGapRows = rows.filter((row) => row.evidenceClass === 'SOURCE_VERIFIED_SOURCE_ONLY')

  let state: Wp78EvidenceGateAggregateState = 'NO_REQUESTS'
  if (rows.length > 0 && blockedRows.length > 0) state = 'BLOCKED_EVIDENCE'
  else if (rows.length > 0 && projectGapRows.length > 0) state = 'READY_FOR_HUMAN_RULE_REVIEW_WITH_PROJECT_GAPS'
  else if (rows.length > 0) state = 'READY_FOR_HUMAN_RULE_REVIEW'

  return {
    system: WP78_SYSTEM_LABEL,
    project: wp78ProjectSystemEvidenceLink.project,
    candidateSystemStatus: wp78ProjectSystemEvidenceLink.candidateStatus,
    state,
    rows,
    totalRequestCount: rows.length,
    eligibleRequestCount: rows.filter((row) => row.eligibleForHumanRuleReview).length,
    blockedRequestCount: blockedRows.length,
    sourceVerifiedProjectObservedCount: rows.filter((row) => row.evidenceClass === 'SOURCE_VERIFIED_PROJECT_OBSERVED').length,
    sourceVerifiedSourceOnlyCount: projectGapRows.length,
    projectObservedRoleUnconfirmedCount: rows.filter((row) => row.evidenceClass === 'PROJECT_OBSERVED_ROLE_UNCONFIRMED').length,
    blockerCodes: blockedRows.map((row) => row.requestedCodeLiteral),
    projectEvidenceGapCodes: projectGapRows.map((row) => row.requestedCodeLiteral),
    relevantRequirementIds: [...WP78_EVIDENCE_RELEVANT_REQUIREMENTS],
    evidencePreconditionOnly: true,
    humanRuleReviewRequired: true,
    autoRulePassAllowed: false,
    rulesValidated: false,
    finalApprovalCreated: false,
    handoffLocked: true,
    productionLocked: true,
    machineReady: false,
  }
}

export function integrateWp78EvidenceGateWithRuleAggregation(
  requests: Wp78ProfileEvidenceRequest[],
  ruleRows: FacadeFlowRuleEvaluationRecord[],
) {
  const evidenceGate = aggregateWp78ProfileEvidenceGate(requests)
  const ruleAggregation = aggregateFacadeFlowRuleEvaluations(ruleRows)

  let effectiveState: Wp78IntegratedRuleGateState = 'RULE_REVIEW_INCOMPLETE'
  if (evidenceGate.state === 'NO_REQUESTS' || evidenceGate.state === 'BLOCKED_EVIDENCE') effectiveState = 'EVIDENCE_BLOCKED'
  else if (ruleAggregation.state === 'BLOCKED_BY_FAIL') effectiveState = 'RULE_FAIL_BLOCKED'
  else if (ruleAggregation.state === 'REVIEWED_COMPLETE') effectiveState = 'REVIEWED_COMPLETE_PRODUCTION_LOCKED'

  return Object.freeze({
    system: WP78_SYSTEM_LABEL,
    effectiveState,
    evidenceGate,
    ruleAggregation,
    relevantRequirementIds: [...WP78_EVIDENCE_RELEVANT_REQUIREMENTS],
    validationDecision: 'NOT_MADE' as const,
    evidencePreconditionOnly: true as const,
    humanRuleReviewRequired: true as const,
    autoRulePassAllowed: false as const,
    rulesValidated: false as const,
    finalApprovalCreated: false as const,
    handoffLocked: true as const,
    productionLocked: true as const,
    machineReady: false as const,
    productionApproved: false as const,
  })
}
