import type { CanonicalProfileAiConsumableKnowledgeContext } from './aiCanonicalProfileAiConsumableKnowledgeContext'

export const PROFILE_DATA_03_24_VERSION = 'PROFILE_DATA_03.24' as const

export type CanonicalProfileEvidenceRequestPlanStatus =
  | 'BLOCKED_UPSTREAM'
  | 'STALE_REVIEW_REQUESTS_READY_PRODUCTION_LOCKED'
  | 'EVIDENCE_REQUESTS_READY_PRODUCTION_LOCKED'
  | 'NO_EVIDENCE_REQUESTS_KNOWLEDGE_COMPLETE_PRODUCTION_LOCKED'

export type CanonicalProfileEvidenceRequestAction =
  | 'PROVIDE_OR_IDENTIFY_EVIDENCE'
  | 'RENEW_HUMAN_REVIEW'

export interface CanonicalProfileEvidenceRequestPlanItem {
  requestKey: string
  relation: CanonicalProfileAiConsumableKnowledgeContext['unknown'][number]['relation']
  leftProfileCode: string
  rightProfileCode: string
  requirementKind: CanonicalProfileAiConsumableKnowledgeContext['unknown'][number]['requirementKind']
  authorityNeeded: CanonicalProfileAiConsumableKnowledgeContext['unknown'][number]['authorityNeeded']
  action: CanonicalProfileEvidenceRequestAction
  requestedEvidence: string
  reason: string
  humanActionRequired: true
  mayAutoFetchSource: false
  mayAutoAcceptEvidence: false
  mayInferMissingTechnicalData: false
}

export interface CanonicalProfileEvidenceRequestPlan {
  version: typeof PROFILE_DATA_03_24_VERSION
  sourceIntentId: string
  systemId: CanonicalProfileAiConsumableKnowledgeContext['systemId']
  systemLabel: CanonicalProfileAiConsumableKnowledgeContext['systemLabel']
  status: CanonicalProfileEvidenceRequestPlanStatus
  requests: CanonicalProfileEvidenceRequestPlanItem[]
  requestCount: number
  conflicts: string[]
  humanActionRequired: boolean
  automaticEvidenceFetchAllowed: false
  automaticEvidenceAcceptanceAllowed: false
  mayInferMissingTechnicalData: false
  manufacturerApproval: false
  exactJointGeometryVerified: false
  productionCompatibilityValidated: false
  productionUnlockAllowed: false
  machineReady: false
}

const evidenceDescription = (
  requirementKind: CanonicalProfileEvidenceRequestPlanItem['requirementKind'],
  relation: CanonicalProfileEvidenceRequestPlanItem['relation'],
  authorityNeeded: CanonicalProfileEvidenceRequestPlanItem['authorityNeeded'],
) => {
  switch (requirementKind) {
    case 'HUMAN_WORKING_RELATION_EVIDENCE':
      return `Human-reviewed working-relation evidence for ${relation}, confirmed by ${authorityNeeded}.`
    case 'MANUFACTURER_PAIR_RELATION_EVIDENCE':
      return `Manufacturer catalogue or technical-document evidence that explicitly supports the profile pair for ${relation}.`
    case 'VERIFIED_ASSEMBLY_NODE_EVIDENCE':
      return `Human-verified real assembly-node evidence for ${relation}.`
    case 'EXACT_JOINT_DOCUMENTATION':
      return `Exact joint documentation for ${relation} from ${authorityNeeded}.`
    default:
      return `Evidence for ${requirementKind} on ${relation} from ${authorityNeeded}.`
  }
}

const unique = <T>(items: T[]) => [...new Set(items)]

export function buildCanonicalProfileEvidenceRequestPlan(
  context: CanonicalProfileAiConsumableKnowledgeContext,
): CanonicalProfileEvidenceRequestPlan {
  const conflicts: string[] = []

  if (context.status === 'BLOCKED_UPSTREAM') {
    return {
      version: PROFILE_DATA_03_24_VERSION,
      sourceIntentId: context.sourceIntentId,
      systemId: context.systemId,
      systemLabel: context.systemLabel,
      status: 'BLOCKED_UPSTREAM',
      requests: [],
      requestCount: 0,
      conflicts: ['PROFILE DATA 03.24 cannot plan evidence requests while the upstream AI knowledge context is blocked.'],
      humanActionRequired: true,
      automaticEvidenceFetchAllowed: false,
      automaticEvidenceAcceptanceAllowed: false,
      mayInferMissingTechnicalData: false,
      manufacturerApproval: false,
      exactJointGeometryVerified: false,
      productionCompatibilityValidated: false,
      productionUnlockAllowed: false,
      machineReady: false,
    }
  }

  const requestMap = new Map<string, CanonicalProfileEvidenceRequestPlanItem>()

  for (const unknown of context.unknown) {
    const requestKey = `${unknown.relation}:${unknown.requirementKind}`
    const declaredRequest = context.humanEvidenceRequests.find(
      (request) => request.relation === unknown.relation && request.requirementKind === unknown.requirementKind,
    )

    if (!declaredRequest) {
      conflicts.push(`${requestKey} is unknown but has no matching humanEvidenceRequest in PROFILE DATA 03.23.`)
      continue
    }
    if (declaredRequest.authorityNeeded !== unknown.authorityNeeded) {
      conflicts.push(`${requestKey} authority mismatch between unknown[] and humanEvidenceRequests[].`)
      continue
    }
    if (requestMap.has(requestKey)) {
      conflicts.push(`${requestKey} appears more than once in the evidence request plan.`)
      continue
    }

    requestMap.set(requestKey, {
      requestKey,
      relation: unknown.relation,
      leftProfileCode: unknown.leftProfileCode,
      rightProfileCode: unknown.rightProfileCode,
      requirementKind: unknown.requirementKind,
      authorityNeeded: unknown.authorityNeeded,
      action: context.status === 'STALE_HUMAN_REVIEW_REQUIRED' ? 'RENEW_HUMAN_REVIEW' : 'PROVIDE_OR_IDENTIFY_EVIDENCE',
      requestedEvidence: evidenceDescription(unknown.requirementKind, unknown.relation, unknown.authorityNeeded),
      reason: declaredRequest.reason,
      humanActionRequired: true,
      mayAutoFetchSource: false,
      mayAutoAcceptEvidence: false,
      mayInferMissingTechnicalData: false,
    })
  }

  const requests = [...requestMap.values()].sort((a, b) => a.requestKey.localeCompare(b.requestKey))

  let status: CanonicalProfileEvidenceRequestPlanStatus
  if (conflicts.length) status = 'BLOCKED_UPSTREAM'
  else if (context.status === 'STALE_HUMAN_REVIEW_REQUIRED') status = 'STALE_REVIEW_REQUESTS_READY_PRODUCTION_LOCKED'
  else if (requests.length) status = 'EVIDENCE_REQUESTS_READY_PRODUCTION_LOCKED'
  else status = 'NO_EVIDENCE_REQUESTS_KNOWLEDGE_COMPLETE_PRODUCTION_LOCKED'

  return {
    version: PROFILE_DATA_03_24_VERSION,
    sourceIntentId: context.sourceIntentId,
    systemId: context.systemId,
    systemLabel: context.systemLabel,
    status,
    requests,
    requestCount: requests.length,
    conflicts: unique(conflicts),
    humanActionRequired: status === 'BLOCKED_UPSTREAM' || requests.length > 0,
    automaticEvidenceFetchAllowed: false,
    automaticEvidenceAcceptanceAllowed: false,
    mayInferMissingTechnicalData: false,
    manufacturerApproval: false,
    exactJointGeometryVerified: false,
    productionCompatibilityValidated: false,
    productionUnlockAllowed: false,
    machineReady: false,
  }
}

export const PROFILE_DATA_03_24_SAFETY = Object.freeze({
  evidenceRequestPlanningOnly: true,
  automaticEvidenceFetchAllowed: false,
  automaticEvidenceAcceptanceAllowed: false,
  mayInferMissingTechnicalData: false,
  manufacturerApproval: false,
  exactJointGeometryVerified: false,
  productionCompatibilityValidated: false,
  productionUnlockAllowed: false,
  machineReady: false,
})
