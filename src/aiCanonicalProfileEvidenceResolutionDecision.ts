import type { CanonicalProfileAssemblyEvidenceReadiness } from './aiCanonicalProfileAssemblyEvidenceReadiness'
import type { CanonicalProfileCandidateEvidenceLedger } from './aiCanonicalProfileCandidateEvidenceLedger'
import {
  buildCanonicalProfileEvidenceRequirementSatisfactionGate,
  type CanonicalProfileEvidenceRequirementReviewRecord,
} from './aiCanonicalProfileEvidenceRequirementSatisfaction'

export const PROFILE_DATA_03_15_VERSION = 'PROFILE_DATA_03.15' as const

export type CanonicalProfileEvidenceResolutionDecision =
  | 'RESOLVE_FOR_KNOWLEDGE_READINESS'
  | 'KEEP_UNRESOLVED'
  | 'REOPEN_FOR_EVIDENCE'

export type CanonicalProfileEvidenceResolutionState =
  | 'UNDECIDED'
  | 'RESOLVED_FOR_KNOWLEDGE_READINESS'
  | 'KEPT_UNRESOLVED'
  | 'REOPENED_FOR_EVIDENCE'
  | 'STALE_RESOLUTION_REQUIRED'

export type CanonicalProfileEvidenceResolutionStatus =
  | 'BLOCKED_UPSTREAM'
  | 'NO_CANDIDATE_EVIDENCE'
  | 'RESOLUTION_INCOMPLETE'
  | 'HUMAN_ACTION_REQUIRED'
  | 'STALE_RESOLUTION_REQUIRED'
  | 'KNOWLEDGE_RESOLUTION_RECORDED_PRODUCTION_LOCKED'

export interface CanonicalProfileEvidenceResolutionInput {
  resolutionId: string
  candidateEvidenceId: string
  reviewerRole: 'TECHNICAL_REVIEWER' | 'CONSTRUCTOR'
  decidedAt: string
  decision: CanonicalProfileEvidenceResolutionDecision
  note?: string
}

export interface CanonicalProfileEvidenceResolutionRecord {
  version: typeof PROFILE_DATA_03_15_VERSION
  resolutionId: string
  sourceIntentId: string
  candidateEvidenceId: string
  sourceRequirementReviewSignature: string
  relation: CanonicalProfileCandidateEvidenceLedger['entries'][number]['relation']
  requirementKind: CanonicalProfileCandidateEvidenceLedger['entries'][number]['requirementKind']
  reviewerRole: 'TECHNICAL_REVIEWER' | 'CONSTRUCTOR'
  decidedAt: string
  decision: CanonicalProfileEvidenceResolutionDecision
  note: string
  resolvedForKnowledgeReadiness: boolean
  sourceReadinessMutated: false
  validatedEvidenceCreated: false
  createsManufacturerApproval: false
  createsVerifiedAssemblyNodeEvidence: false
  validatesExactJointGeometry: false
  validatesProductionCompatibility: false
  productionUnlockAllowed: false
  machineReady: false
}

export interface CanonicalProfileEvidenceResolutionRow {
  candidateEvidenceId: string
  relation: CanonicalProfileCandidateEvidenceLedger['entries'][number]['relation']
  requirementKind: CanonicalProfileCandidateEvidenceLedger['entries'][number]['requirementKind']
  state: CanonicalProfileEvidenceResolutionState
  note: string
  resolvedForKnowledgeReadiness: boolean
}

export interface CanonicalProfileEvidenceResolutionGate {
  version: typeof PROFILE_DATA_03_15_VERSION
  sourceIntentId: string
  status: CanonicalProfileEvidenceResolutionStatus
  rows: CanonicalProfileEvidenceResolutionRow[]
  conflicts: string[]
  warnings: string[]
  resolvedCount: number
  unresolvedDecisionCount: number
  staleResolutionCount: number
  explicitResolutionRequired: true
  sourceReadinessMutated: false
  validatedEvidenceCreated: false
  createsManufacturerApproval: false
  createsVerifiedAssemblyNodeEvidence: false
  validatesExactJointGeometry: false
  productionCompatibilityValidated: false
  rulesValidated: false
  productionUnlockAllowed: false
  machineReady: false
}

const unique = (items: string[]) => [...new Set(items)]

export function canonicalProfileEvidenceRequirementReviewSignature(
  record: CanonicalProfileEvidenceRequirementReviewRecord,
): string {
  return JSON.stringify({
    reviewId: record.reviewId,
    sourceIntentId: record.sourceIntentId,
    sourceCandidateEvidenceSignature: record.sourceCandidateEvidenceSignature,
    candidateEvidenceId: record.candidateEvidenceId,
    relation: record.relation,
    requirementKind: record.requirementKind,
    reviewerRole: record.reviewerRole,
    reviewedAt: record.reviewedAt,
    decision: record.decision,
    note: record.note,
    requirementSatisfiedForKnowledgeLedger: record.requirementSatisfiedForKnowledgeLedger,
  })
}

function currentRequirementReview(
  candidateEvidenceId: string,
  records: readonly CanonicalProfileEvidenceRequirementReviewRecord[],
): CanonicalProfileEvidenceRequirementReviewRecord {
  const matching = records.filter((record) => record.candidateEvidenceId === candidateEvidenceId)
  if (matching.length !== 1) {
    throw new Error(`Candidate evidence ${candidateEvidenceId} must have exactly one current PROFILE DATA 03.14 review.`)
  }
  return matching[0]!
}

export function createCanonicalProfileEvidenceResolutionRecord(input: {
  readiness: CanonicalProfileAssemblyEvidenceReadiness
  ledger: CanonicalProfileCandidateEvidenceLedger
  requirementReviews: readonly CanonicalProfileEvidenceRequirementReviewRecord[]
  resolution: CanonicalProfileEvidenceResolutionInput
}): CanonicalProfileEvidenceResolutionRecord {
  const gate = buildCanonicalProfileEvidenceRequirementSatisfactionGate({
    readiness: input.readiness,
    ledger: input.ledger,
    records: input.requirementReviews,
  })
  if (gate.status === 'BLOCKED_UPSTREAM' || gate.status === 'STALE_REVIEW_REQUIRED') {
    throw new Error(`PROFILE DATA 03.14 gate is ${gate.status}; resolution fails closed.`)
  }

  const row = gate.rows.find((item) => item.candidateEvidenceId === input.resolution.candidateEvidenceId)
  if (!row) throw new Error(`Candidate evidence ${input.resolution.candidateEvidenceId} was not found.`)
  const review = currentRequirementReview(input.resolution.candidateEvidenceId, input.requirementReviews)

  const resolutionId = input.resolution.resolutionId.trim()
  const decidedAt = input.resolution.decidedAt.trim()
  const note = input.resolution.note?.trim() ?? ''
  if (!resolutionId) throw new Error('Resolution requires resolutionId.')
  if (!decidedAt) throw new Error('Resolution requires decidedAt.')
  if (input.resolution.decision !== 'RESOLVE_FOR_KNOWLEDGE_READINESS' && !note) {
    throw new Error(`${input.resolution.decision} requires a human note.`)
  }
  if (
    input.resolution.decision === 'RESOLVE_FOR_KNOWLEDGE_READINESS'
    && row.state !== 'KNOWLEDGE_REQUIREMENT_SATISFIED'
  ) {
    throw new Error(`Candidate evidence ${row.candidateEvidenceId} is ${row.state}; it cannot be resolved for knowledge readiness.`)
  }

  return Object.freeze({
    version: PROFILE_DATA_03_15_VERSION,
    resolutionId,
    sourceIntentId: input.ledger.sourceIntentId,
    candidateEvidenceId: row.candidateEvidenceId,
    sourceRequirementReviewSignature: canonicalProfileEvidenceRequirementReviewSignature(review),
    relation: row.relation,
    requirementKind: row.requirementKind,
    reviewerRole: input.resolution.reviewerRole,
    decidedAt,
    decision: input.resolution.decision,
    note,
    resolvedForKnowledgeReadiness: input.resolution.decision === 'RESOLVE_FOR_KNOWLEDGE_READINESS',
    sourceReadinessMutated: false,
    validatedEvidenceCreated: false,
    createsManufacturerApproval: false,
    createsVerifiedAssemblyNodeEvidence: false,
    validatesExactJointGeometry: false,
    validatesProductionCompatibility: false,
    productionUnlockAllowed: false,
    machineReady: false,
  })
}

function stateForDecision(decision: CanonicalProfileEvidenceResolutionDecision): CanonicalProfileEvidenceResolutionState {
  if (decision === 'RESOLVE_FOR_KNOWLEDGE_READINESS') return 'RESOLVED_FOR_KNOWLEDGE_READINESS'
  if (decision === 'KEEP_UNRESOLVED') return 'KEPT_UNRESOLVED'
  return 'REOPENED_FOR_EVIDENCE'
}

export function buildCanonicalProfileEvidenceResolutionGate(input: {
  readiness: CanonicalProfileAssemblyEvidenceReadiness
  ledger: CanonicalProfileCandidateEvidenceLedger
  requirementReviews?: readonly CanonicalProfileEvidenceRequirementReviewRecord[]
  records?: readonly CanonicalProfileEvidenceResolutionRecord[]
}): CanonicalProfileEvidenceResolutionGate {
  const requirementReviews = input.requirementReviews ?? []
  const records = input.records ?? []
  const satisfactionGate = buildCanonicalProfileEvidenceRequirementSatisfactionGate({
    readiness: input.readiness,
    ledger: input.ledger,
    records: requirementReviews,
  })
  const conflicts = [...satisfactionGate.conflicts]
  const warnings = [...satisfactionGate.warnings]

  const rows = input.ledger.entries.map((entry) => {
    const matchingResolution = records.filter((record) => record.candidateEvidenceId === entry.candidateEvidenceId)
    if (matchingResolution.length > 1) conflicts.push(`${entry.candidateEvidenceId} has multiple active resolution records.`)
    const resolution = matchingResolution.length === 1 ? matchingResolution[0] : undefined
    const matchingReview = requirementReviews.filter((record) => record.candidateEvidenceId === entry.candidateEvidenceId)
    const currentReview = matchingReview.length === 1 ? matchingReview[0] : undefined
    const stale = Boolean(resolution) && (
      !currentReview
      || resolution!.sourceIntentId !== input.ledger.sourceIntentId
      || resolution!.sourceRequirementReviewSignature !== canonicalProfileEvidenceRequirementReviewSignature(currentReview)
    )

    let state: CanonicalProfileEvidenceResolutionState = 'UNDECIDED'
    if (stale) state = 'STALE_RESOLUTION_REQUIRED'
    else if (resolution) state = stateForDecision(resolution.decision)

    return {
      candidateEvidenceId: entry.candidateEvidenceId,
      relation: entry.relation,
      requirementKind: entry.requirementKind,
      state,
      note: resolution?.note ?? '',
      resolvedForKnowledgeReadiness: state === 'RESOLVED_FOR_KNOWLEDGE_READINESS',
    }
  })

  const staleResolutionCount = rows.filter((row) => row.state === 'STALE_RESOLUTION_REQUIRED').length
  const unresolvedDecisionCount = rows.filter((row) => row.state === 'UNDECIDED').length
  const actionRequiredCount = rows.filter((row) => row.state === 'KEPT_UNRESOLVED' || row.state === 'REOPENED_FOR_EVIDENCE').length
  const resolvedCount = rows.filter((row) => row.resolvedForKnowledgeReadiness).length

  let status: CanonicalProfileEvidenceResolutionStatus
  if (satisfactionGate.status === 'BLOCKED_UPSTREAM' || conflicts.length) status = 'BLOCKED_UPSTREAM'
  else if (input.ledger.entries.length === 0) status = 'NO_CANDIDATE_EVIDENCE'
  else if (staleResolutionCount) status = 'STALE_RESOLUTION_REQUIRED'
  else if (unresolvedDecisionCount) status = 'RESOLUTION_INCOMPLETE'
  else if (actionRequiredCount) status = 'HUMAN_ACTION_REQUIRED'
  else status = 'KNOWLEDGE_RESOLUTION_RECORDED_PRODUCTION_LOCKED'

  return {
    version: PROFILE_DATA_03_15_VERSION,
    sourceIntentId: input.ledger.sourceIntentId,
    status,
    rows,
    conflicts: unique(conflicts),
    warnings: unique(warnings),
    resolvedCount,
    unresolvedDecisionCount,
    staleResolutionCount,
    explicitResolutionRequired: true,
    sourceReadinessMutated: false,
    validatedEvidenceCreated: false,
    createsManufacturerApproval: false,
    createsVerifiedAssemblyNodeEvidence: false,
    validatesExactJointGeometry: false,
    productionCompatibilityValidated: false,
    rulesValidated: false,
    productionUnlockAllowed: false,
    machineReady: false,
  }
}

export const PROFILE_DATA_03_15_SAFETY = Object.freeze({
  explicitResolutionRequired: true,
  sourceReadinessMutated: false,
  validatedEvidenceCreated: false,
  createsManufacturerApproval: false,
  createsVerifiedAssemblyNodeEvidence: false,
  exactJointGeometryVerified: false,
  productionCompatibilityValidated: false,
  productionUnlockAllowed: false,
  machineReady: false,
})
