import type {
  CanonicalProfileEvidenceRequestPlan,
  CanonicalProfileEvidenceRequestPlanItem,
} from './aiCanonicalProfileEvidenceRequestPlanner'

export const PROFILE_DATA_03_25_VERSION = 'PROFILE_DATA_03.25' as const

export type CanonicalProfileHumanEvidenceQueueStatus =
  | 'BLOCKED_UPSTREAM'
  | 'STALE_REVIEW_QUEUE_READY_PRODUCTION_LOCKED'
  | 'HUMAN_EVIDENCE_QUEUE_READY_PRODUCTION_LOCKED'
  | 'HUMAN_EVIDENCE_QUEUE_EMPTY_PRODUCTION_LOCKED'

export interface CanonicalProfileHumanEvidenceQueueAuthorityGroup {
  authorityNeeded: CanonicalProfileEvidenceRequestPlanItem['authorityNeeded']
  requestCount: number
  requestKeys: string[]
}

export interface CanonicalProfileHumanEvidenceRequestQueue {
  version: typeof PROFILE_DATA_03_25_VERSION
  sourceIntentId: string
  systemId: CanonicalProfileEvidenceRequestPlan['systemId']
  systemLabel: CanonicalProfileEvidenceRequestPlan['systemLabel']
  status: CanonicalProfileHumanEvidenceQueueStatus
  items: CanonicalProfileEvidenceRequestPlanItem[]
  authorityGroups: CanonicalProfileHumanEvidenceQueueAuthorityGroup[]
  totalRequestCount: number
  humanActionRequired: boolean
  conflicts: string[]
  automaticDispatchAllowed: false
  automaticEvidenceFetchAllowed: false
  automaticEvidenceAcceptanceAllowed: false
  automaticKnowledgeResolutionAllowed: false
  productionUnlockAllowed: false
  machineReady: false
}

export function buildCanonicalProfileHumanEvidenceRequestQueue(
  plan: CanonicalProfileEvidenceRequestPlan,
): CanonicalProfileHumanEvidenceRequestQueue {
  const conflicts = [...plan.conflicts]
  const keys = new Set<string>()

  for (const item of plan.requests) {
    if (keys.has(item.requestKey)) conflicts.push(`${item.requestKey} is duplicated in PROFILE DATA 03.25 queue input.`)
    keys.add(item.requestKey)
  }

  const authorityMap = new Map<CanonicalProfileEvidenceRequestPlanItem['authorityNeeded'], string[]>()
  for (const item of plan.requests) {
    const current = authorityMap.get(item.authorityNeeded) ?? []
    current.push(item.requestKey)
    authorityMap.set(item.authorityNeeded, current)
  }

  const authorityGroups = [...authorityMap.entries()]
    .map(([authorityNeeded, requestKeys]) => ({
      authorityNeeded,
      requestCount: requestKeys.length,
      requestKeys: [...requestKeys].sort(),
    }))
    .sort((a, b) => a.authorityNeeded.localeCompare(b.authorityNeeded))

  let status: CanonicalProfileHumanEvidenceQueueStatus
  if (plan.status === 'BLOCKED_UPSTREAM' || conflicts.length) status = 'BLOCKED_UPSTREAM'
  else if (plan.status === 'STALE_REVIEW_REQUESTS_READY_PRODUCTION_LOCKED') status = 'STALE_REVIEW_QUEUE_READY_PRODUCTION_LOCKED'
  else if (plan.requests.length) status = 'HUMAN_EVIDENCE_QUEUE_READY_PRODUCTION_LOCKED'
  else status = 'HUMAN_EVIDENCE_QUEUE_EMPTY_PRODUCTION_LOCKED'

  return {
    version: PROFILE_DATA_03_25_VERSION,
    sourceIntentId: plan.sourceIntentId,
    systemId: plan.systemId,
    systemLabel: plan.systemLabel,
    status,
    items: [...plan.requests],
    authorityGroups,
    totalRequestCount: plan.requests.length,
    humanActionRequired: status === 'BLOCKED_UPSTREAM' || plan.requests.length > 0,
    conflicts: [...new Set(conflicts)],
    automaticDispatchAllowed: false,
    automaticEvidenceFetchAllowed: false,
    automaticEvidenceAcceptanceAllowed: false,
    automaticKnowledgeResolutionAllowed: false,
    productionUnlockAllowed: false,
    machineReady: false,
  }
}

export const PROFILE_DATA_03_25_SAFETY = Object.freeze({
  humanQueueOnly: true,
  automaticDispatchAllowed: false,
  automaticEvidenceFetchAllowed: false,
  automaticEvidenceAcceptanceAllowed: false,
  automaticKnowledgeResolutionAllowed: false,
  productionUnlockAllowed: false,
  machineReady: false,
})
