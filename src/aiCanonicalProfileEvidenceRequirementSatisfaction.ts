import type { CanonicalProfileAssemblyEvidenceReadiness } from './aiCanonicalProfileAssemblyEvidenceReadiness'
import {
  canonicalProfileCandidateEvidenceEntrySignature,
  type CanonicalProfileCandidateEvidenceEntry,
  type CanonicalProfileCandidateEvidenceLedger,
} from './aiCanonicalProfileCandidateEvidenceLedger'

export const PROFILE_DATA_03_14_VERSION = 'PROFILE_DATA_03.14' as const

export type CanonicalProfileEvidenceRequirementDecision =
  | 'SATISFIES_KNOWLEDGE_REQUIREMENT'
  | 'INSUFFICIENT_EVIDENCE'
  | 'NEEDS_MORE_EVIDENCE'

export type CanonicalProfileEvidenceRequirementReviewState =
  | 'UNREVIEWED'
  | 'KNOWLEDGE_REQUIREMENT_SATISFIED'
  | 'INSUFFICIENT_EVIDENCE'
  | 'MORE_EVIDENCE_REQUIRED'
  | 'STALE_REVIEW_REQUIRED'

export type CanonicalProfileEvidenceRequirementSatisfactionStatus =
  | 'BLOCKED_UPSTREAM'
  | 'NO_CANDIDATE_EVIDENCE'
  | 'KNOWLEDGE_REQUIREMENT_REVIEW_INCOMPLETE'
  | 'HUMAN_ACTION_REQUIRED'
  | 'STALE_REVIEW_REQUIRED'
  | 'KNOWLEDGE_REQUIREMENT_SATISFACTION_RECORDED_PRODUCTION_LOCKED'

export interface CanonicalProfileEvidenceRequirementReviewInput {
  reviewId: string
  candidateEvidenceId: string
  reviewerRole: 'TECHNICAL_REVIEWER' | 'CONSTRUCTOR'
  reviewedAt: string
  decision: CanonicalProfileEvidenceRequirementDecision
  note?: string
}

export interface CanonicalProfileEvidenceRequirementReviewRecord {
  version: typeof PROFILE_DATA_03_14_VERSION
  reviewId: string
  sourceIntentId: string
  sourceCandidateEvidenceSignature: string
  candidateEvidenceId: string
  relation: CanonicalProfileCandidateEvidenceEntry['relation']
  requirementKind: CanonicalProfileCandidateEvidenceEntry['requirementKind']
  reviewerRole: 'TECHNICAL_REVIEWER' | 'CONSTRUCTOR'
  reviewedAt: string
  decision: CanonicalProfileEvidenceRequirementDecision
  note: string
  requirementSatisfiedForKnowledgeLedger: boolean
  sourceReadinessMutated: false
  createsManufacturerApproval: false
  createsVerifiedAssemblyNodeEvidence: false
  validatesExactJointGeometry: false
  validatesProductionCompatibility: false
  productionUnlockAllowed: false
  machineReady: false
}

export interface CanonicalProfileEvidenceRequirementSatisfactionRow {
  candidateEvidenceId: string
  relation: CanonicalProfileCandidateEvidenceEntry['relation']
  requirementKind: CanonicalProfileCandidateEvidenceEntry['requirementKind']
  sourceLabel: string
  sourceRef: string
  state: CanonicalProfileEvidenceRequirementReviewState
  note: string
  requirementSatisfiedForKnowledgeLedger: boolean
  manufacturerApproved: false
  verifiedAssemblyNodeEvidence: false
  exactJointGeometryVerified: false
  productionCompatibilityValidated: false
}

export interface CanonicalProfileEvidenceRequirementSatisfactionGate {
  version: typeof PROFILE_DATA_03_14_VERSION
  sourceIntentId: string
  status: CanonicalProfileEvidenceRequirementSatisfactionStatus
  rows: CanonicalProfileEvidenceRequirementSatisfactionRow[]
  conflicts: string[]
  warnings: string[]
  totalMissingRequirementCountAtSource: number
  knowledgeRequirementSatisfiedCount: number
  projectedRemainingKnowledgeRequirementCount: number
  sourceReadinessMutated: false
  createsManufacturerApproval: false
  createsVerifiedAssemblyNodeEvidence: false
  validatesExactJointGeometry: false
  upgradesEvidenceMaturityAutomatically: false
  productionCompatibilityValidated: false
  productionRuleApplied: false
  productionDeductionsApplied: false
  manufacturingToleranceApplied: false
  rulesValidated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

const unique = (items: string[]) => [...new Set(items)]

function candidateById(ledger: CanonicalProfileCandidateEvidenceLedger, id: string) {
  const entry = ledger.entries.find((item) => item.candidateEvidenceId === id)
  if (!entry) throw new Error(`Candidate evidence ${id} was not found.`)
  return entry
}

export function createCanonicalProfileEvidenceRequirementReviewRecord(
  ledger: CanonicalProfileCandidateEvidenceLedger,
  input: CanonicalProfileEvidenceRequirementReviewInput,
): CanonicalProfileEvidenceRequirementReviewRecord {
  if (ledger.status !== 'CANDIDATE_EVIDENCE_PENDING_REQUIREMENT_REVIEW_PRODUCTION_LOCKED') {
    throw new Error(`PROFILE DATA 03.13 ledger is ${ledger.status}; requirement review fails closed.`)
  }
  const entry = candidateById(ledger, input.candidateEvidenceId)
  const reviewId = input.reviewId.trim()
  const reviewedAt = input.reviewedAt.trim()
  const note = input.note?.trim() ?? ''
  if (!reviewId) throw new Error('Requirement review requires reviewId.')
  if (!reviewedAt) throw new Error('Requirement review requires reviewedAt.')
  if (input.decision !== 'SATISFIES_KNOWLEDGE_REQUIREMENT' && !note) {
    throw new Error(`${input.decision} requires a human note.`)
  }
  return Object.freeze({
    version: PROFILE_DATA_03_14_VERSION,
    reviewId,
    sourceIntentId: ledger.sourceIntentId,
    sourceCandidateEvidenceSignature: canonicalProfileCandidateEvidenceEntrySignature(entry),
    candidateEvidenceId: entry.candidateEvidenceId,
    relation: entry.relation,
    requirementKind: entry.requirementKind,
    reviewerRole: input.reviewerRole,
    reviewedAt,
    decision: input.decision,
    note,
    requirementSatisfiedForKnowledgeLedger: input.decision === 'SATISFIES_KNOWLEDGE_REQUIREMENT',
    sourceReadinessMutated: false,
    createsManufacturerApproval: false,
    createsVerifiedAssemblyNodeEvidence: false,
    validatesExactJointGeometry: false,
    validatesProductionCompatibility: false,
    productionUnlockAllowed: false,
    machineReady: false,
  })
}

function stateForDecision(decision: CanonicalProfileEvidenceRequirementDecision): CanonicalProfileEvidenceRequirementReviewState {
  if (decision === 'SATISFIES_KNOWLEDGE_REQUIREMENT') return 'KNOWLEDGE_REQUIREMENT_SATISFIED'
  if (decision === 'INSUFFICIENT_EVIDENCE') return 'INSUFFICIENT_EVIDENCE'
  return 'MORE_EVIDENCE_REQUIRED'
}

export function buildCanonicalProfileEvidenceRequirementSatisfactionGate(input: {
  readiness: CanonicalProfileAssemblyEvidenceReadiness
  ledger: CanonicalProfileCandidateEvidenceLedger
  records?: readonly CanonicalProfileEvidenceRequirementReviewRecord[]
}): CanonicalProfileEvidenceRequirementSatisfactionGate {
  const records = input.records ?? []
  const conflicts = [...input.ledger.conflicts]
  const warnings = [...input.ledger.warnings]

  const rows = input.ledger.entries.map((entry) => {
    const matching = records.filter((record) => record.candidateEvidenceId === entry.candidateEvidenceId)
    if (matching.length > 1) conflicts.push(`${entry.candidateEvidenceId} has multiple active requirement review records.`)
    const record = matching.length === 1 ? matching[0] : undefined
    const stale = Boolean(record) && (
      record!.sourceIntentId !== input.ledger.sourceIntentId
      || record!.sourceCandidateEvidenceSignature !== canonicalProfileCandidateEvidenceEntrySignature(entry)
    )
    let state: CanonicalProfileEvidenceRequirementReviewState = 'UNREVIEWED'
    if (stale) state = 'STALE_REVIEW_REQUIRED'
    else if (record) state = stateForDecision(record.decision)

    return {
      candidateEvidenceId: entry.candidateEvidenceId,
      relation: entry.relation,
      requirementKind: entry.requirementKind,
      sourceLabel: entry.sourceLabel,
      sourceRef: entry.sourceRef,
      state,
      note: record?.note ?? '',
      requirementSatisfiedForKnowledgeLedger: state === 'KNOWLEDGE_REQUIREMENT_SATISFIED',
      manufacturerApproved: false as const,
      verifiedAssemblyNodeEvidence: false as const,
      exactJointGeometryVerified: false as const,
      productionCompatibilityValidated: false as const,
    }
  })

  const satisfiedKeys = new Set(
    rows.filter((row) => row.requirementSatisfiedForKnowledgeLedger).map((row) => `${row.relation}:${row.requirementKind}`),
  )
  const totalMissingRequirementCountAtSource = input.readiness.totalMissingRequirementCount
  const knowledgeRequirementSatisfiedCount = satisfiedKeys.size
  const projectedRemainingKnowledgeRequirementCount = Math.max(0, totalMissingRequirementCountAtSource - knowledgeRequirementSatisfiedCount)
  const staleCount = rows.filter((row) => row.state === 'STALE_REVIEW_REQUIRED').length
  const unreviewedCount = rows.filter((row) => row.state === 'UNREVIEWED').length
  const actionRequiredCount = rows.filter((row) => row.state === 'INSUFFICIENT_EVIDENCE' || row.state === 'MORE_EVIDENCE_REQUIRED').length

  let status: CanonicalProfileEvidenceRequirementSatisfactionStatus
  if (input.ledger.status === 'BLOCKED_UPSTREAM') status = 'BLOCKED_UPSTREAM'
  else if (input.ledger.entries.length === 0) status = 'NO_CANDIDATE_EVIDENCE'
  else if (conflicts.length) status = 'BLOCKED_UPSTREAM'
  else if (staleCount) status = 'STALE_REVIEW_REQUIRED'
  else if (unreviewedCount) status = 'KNOWLEDGE_REQUIREMENT_REVIEW_INCOMPLETE'
  else if (actionRequiredCount) status = 'HUMAN_ACTION_REQUIRED'
  else status = 'KNOWLEDGE_REQUIREMENT_SATISFACTION_RECORDED_PRODUCTION_LOCKED'

  return {
    version: PROFILE_DATA_03_14_VERSION,
    sourceIntentId: input.ledger.sourceIntentId,
    status,
    rows,
    conflicts: unique(conflicts),
    warnings: unique(warnings),
    totalMissingRequirementCountAtSource,
    knowledgeRequirementSatisfiedCount,
    projectedRemainingKnowledgeRequirementCount,
    sourceReadinessMutated: false,
    createsManufacturerApproval: false,
    createsVerifiedAssemblyNodeEvidence: false,
    validatesExactJointGeometry: false,
    upgradesEvidenceMaturityAutomatically: false,
    productionCompatibilityValidated: false,
    productionRuleApplied: false,
    productionDeductionsApplied: false,
    manufacturingToleranceApplied: false,
    rulesValidated: false,
    productionUnlockAllowed: false,
    machineReady: false,
    productionApproved: false,
  }
}

export const PROFILE_DATA_03_14_SAFETY = Object.freeze({
  knowledgeRequirementSatisfactionOnly: true,
  sourceReadinessMutated: false,
  createsManufacturerApproval: false,
  createsVerifiedAssemblyNodeEvidence: false,
  exactJointGeometryVerified: false,
  upgradesEvidenceMaturityAutomatically: false,
  productionCompatibilityValidated: false,
  productionUnlockAllowed: false,
  machineReady: false,
})
