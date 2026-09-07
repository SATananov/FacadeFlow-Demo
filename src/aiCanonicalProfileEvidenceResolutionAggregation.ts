import type {
  CanonicalProfileAssemblyEvidenceReadiness,
  CanonicalProfileAssemblyEvidenceRequirement,
} from './aiCanonicalProfileAssemblyEvidenceReadiness'
import type { CanonicalProfileCandidateEvidenceLedger } from './aiCanonicalProfileCandidateEvidenceLedger'
import {
  buildCanonicalProfileEvidenceRequirementSatisfactionGate,
  type CanonicalProfileEvidenceRequirementReviewRecord,
} from './aiCanonicalProfileEvidenceRequirementSatisfaction'
import {
  buildCanonicalProfileEvidenceResolutionGate,
  type CanonicalProfileEvidenceResolutionRecord,
} from './aiCanonicalProfileEvidenceResolutionDecision'

export const PROFILE_DATA_03_16_VERSION = 'PROFILE_DATA_03.16' as const

export type CanonicalProfileKnowledgeRequirementAggregateState =
  | 'NO_CANDIDATE_EVIDENCE'
  | 'CANDIDATE_REVIEW_INCOMPLETE'
  | 'SATISFIED_PENDING_EXPLICIT_RESOLUTION'
  | 'INSUFFICIENT_EVIDENCE'
  | 'MORE_EVIDENCE_REQUIRED'
  | 'KEPT_UNRESOLVED'
  | 'REOPENED_FOR_EVIDENCE'
  | 'STALE_REVIEW_REQUIRED'
  | 'RESOLVED_FOR_KNOWLEDGE_READINESS'

export type CanonicalProfileEvidenceResolutionAggregationStatus =
  | 'BLOCKED_UPSTREAM'
  | 'STALE_REVIEW_REQUIRED'
  | 'KNOWLEDGE_REQUIREMENTS_UNRESOLVED'
  | 'KNOWLEDGE_REQUIREMENTS_PARTIALLY_RESOLVED_PRODUCTION_LOCKED'
  | 'ALL_KNOWLEDGE_REQUIREMENTS_RESOLVED_PRODUCTION_LOCKED'

export interface CanonicalProfileKnowledgeRequirementAggregateRow {
  relation: CanonicalProfileAssemblyEvidenceReadiness['rows'][number]['relation']
  requirementKind: CanonicalProfileAssemblyEvidenceRequirement['kind']
  authorityNeeded: CanonicalProfileAssemblyEvidenceRequirement['authorityNeeded']
  sourceReason: string
  state: CanonicalProfileKnowledgeRequirementAggregateState
  candidateEvidenceCount: number
  satisfiedReviewCount: number
  explicitResolutionCount: number
  resolvedForKnowledgeReadiness: boolean
  productionCompatibilityValidated: false
  productionUnlockAllowed: false
  machineReady: false
}

export interface CanonicalProfileEvidenceResolutionAggregation {
  version: typeof PROFILE_DATA_03_16_VERSION
  sourceIntentId: string
  status: CanonicalProfileEvidenceResolutionAggregationStatus
  rows: CanonicalProfileKnowledgeRequirementAggregateRow[]
  conflicts: string[]
  warnings: string[]
  totalKnowledgeRequirementCount: number
  resolvedKnowledgeRequirementCount: number
  unresolvedKnowledgeRequirementCount: number
  knowledgeCoveragePercent: number
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
const keyOf = (relation: string, requirementKind: string) => `${relation}:${requirementKind}`

export function buildCanonicalProfileEvidenceResolutionAggregation(input: {
  readiness: CanonicalProfileAssemblyEvidenceReadiness
  ledger: CanonicalProfileCandidateEvidenceLedger
  requirementReviews?: readonly CanonicalProfileEvidenceRequirementReviewRecord[]
  resolutionRecords?: readonly CanonicalProfileEvidenceResolutionRecord[]
}): CanonicalProfileEvidenceResolutionAggregation {
  const requirementReviews = input.requirementReviews ?? []
  const resolutionRecords = input.resolutionRecords ?? []
  const satisfactionGate = buildCanonicalProfileEvidenceRequirementSatisfactionGate({
    readiness: input.readiness,
    ledger: input.ledger,
    records: requirementReviews,
  })
  const resolutionGate = buildCanonicalProfileEvidenceResolutionGate({
    readiness: input.readiness,
    ledger: input.ledger,
    requirementReviews,
    records: resolutionRecords,
  })
  const conflicts = [...satisfactionGate.conflicts, ...resolutionGate.conflicts]
  const warnings = [...satisfactionGate.warnings, ...resolutionGate.warnings]

  const rows = input.readiness.rows.flatMap((readinessRow) => readinessRow.requirements.map((requirement) => {
    const requirementKey = keyOf(readinessRow.relation, requirement.kind)
    const candidates = input.ledger.entries.filter((entry) => keyOf(entry.relation, entry.requirementKind) === requirementKey)
    const satisfactionRows = satisfactionGate.rows.filter((row) => keyOf(row.relation, row.requirementKind) === requirementKey)
    const resolutionRows = resolutionGate.rows.filter((row) => keyOf(row.relation, row.requirementKind) === requirementKey)

    let state: CanonicalProfileKnowledgeRequirementAggregateState
    if (resolutionRows.some((row) => row.state === 'STALE_RESOLUTION_REQUIRED') || satisfactionRows.some((row) => row.state === 'STALE_REVIEW_REQUIRED')) {
      state = 'STALE_REVIEW_REQUIRED'
    } else if (resolutionRows.some((row) => row.state === 'RESOLVED_FOR_KNOWLEDGE_READINESS')) {
      state = 'RESOLVED_FOR_KNOWLEDGE_READINESS'
    } else if (resolutionRows.some((row) => row.state === 'REOPENED_FOR_EVIDENCE')) {
      state = 'REOPENED_FOR_EVIDENCE'
    } else if (resolutionRows.some((row) => row.state === 'KEPT_UNRESOLVED')) {
      state = 'KEPT_UNRESOLVED'
    } else if (satisfactionRows.some((row) => row.state === 'MORE_EVIDENCE_REQUIRED')) {
      state = 'MORE_EVIDENCE_REQUIRED'
    } else if (satisfactionRows.some((row) => row.state === 'INSUFFICIENT_EVIDENCE')) {
      state = 'INSUFFICIENT_EVIDENCE'
    } else if (satisfactionRows.some((row) => row.state === 'KNOWLEDGE_REQUIREMENT_SATISFIED')) {
      state = 'SATISFIED_PENDING_EXPLICIT_RESOLUTION'
    } else if (candidates.length) {
      state = 'CANDIDATE_REVIEW_INCOMPLETE'
    } else {
      state = 'NO_CANDIDATE_EVIDENCE'
    }

    return {
      relation: readinessRow.relation,
      requirementKind: requirement.kind,
      authorityNeeded: requirement.authorityNeeded,
      sourceReason: requirement.reason,
      state,
      candidateEvidenceCount: candidates.length,
      satisfiedReviewCount: satisfactionRows.filter((row) => row.state === 'KNOWLEDGE_REQUIREMENT_SATISFIED').length,
      explicitResolutionCount: resolutionRows.filter((row) => row.state === 'RESOLVED_FOR_KNOWLEDGE_READINESS').length,
      resolvedForKnowledgeReadiness: state === 'RESOLVED_FOR_KNOWLEDGE_READINESS',
      productionCompatibilityValidated: false as const,
      productionUnlockAllowed: false as const,
      machineReady: false as const,
    }
  }))

  const totalKnowledgeRequirementCount = rows.length
  const resolvedKnowledgeRequirementCount = rows.filter((row) => row.resolvedForKnowledgeReadiness).length
  const unresolvedKnowledgeRequirementCount = totalKnowledgeRequirementCount - resolvedKnowledgeRequirementCount
  const knowledgeCoveragePercent = totalKnowledgeRequirementCount === 0
    ? 0
    : Math.round((resolvedKnowledgeRequirementCount / totalKnowledgeRequirementCount) * 100)
  const hasStale = rows.some((row) => row.state === 'STALE_REVIEW_REQUIRED')

  let status: CanonicalProfileEvidenceResolutionAggregationStatus
  if (conflicts.length || satisfactionGate.status === 'BLOCKED_UPSTREAM' || resolutionGate.status === 'BLOCKED_UPSTREAM') {
    status = 'BLOCKED_UPSTREAM'
  } else if (hasStale) {
    status = 'STALE_REVIEW_REQUIRED'
  } else if (resolvedKnowledgeRequirementCount === 0) {
    status = 'KNOWLEDGE_REQUIREMENTS_UNRESOLVED'
  } else if (resolvedKnowledgeRequirementCount < totalKnowledgeRequirementCount) {
    status = 'KNOWLEDGE_REQUIREMENTS_PARTIALLY_RESOLVED_PRODUCTION_LOCKED'
  } else {
    status = 'ALL_KNOWLEDGE_REQUIREMENTS_RESOLVED_PRODUCTION_LOCKED'
  }

  return {
    version: PROFILE_DATA_03_16_VERSION,
    sourceIntentId: input.readiness.sourceIntentId,
    status,
    rows,
    conflicts: unique(conflicts),
    warnings: unique(warnings),
    totalKnowledgeRequirementCount,
    resolvedKnowledgeRequirementCount,
    unresolvedKnowledgeRequirementCount,
    knowledgeCoveragePercent,
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

export const PROFILE_DATA_03_16_SAFETY = Object.freeze({
  sourceReadinessMutated: false,
  validatedEvidenceCreated: false,
  createsManufacturerApproval: false,
  createsVerifiedAssemblyNodeEvidence: false,
  exactJointGeometryVerified: false,
  productionCompatibilityValidated: false,
  productionUnlockAllowed: false,
  machineReady: false,
})
