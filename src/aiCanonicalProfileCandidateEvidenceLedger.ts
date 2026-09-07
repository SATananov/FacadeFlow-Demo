import type { CanonicalProfileAssemblyEvidenceReadiness } from './aiCanonicalProfileAssemblyEvidenceReadiness'
import type { CanonicalProfileAssemblyEvidenceSubmissionRecord } from './aiCanonicalProfileAssemblyEvidenceIntake'
import type { CanonicalProfileAssemblyEvidenceIntakeHumanReviewRecord } from './aiCanonicalProfileAssemblyEvidenceIntakeHumanReview'
import {
  buildCanonicalProfileAssemblyEvidenceApplicationGate,
  type CanonicalProfileAssemblyEvidenceApplicationRecord,
} from './aiCanonicalProfileAssemblyEvidenceApplicationGate'

export const PROFILE_DATA_03_13_VERSION = 'PROFILE_DATA_03.13' as const

export type CanonicalProfileCandidateEvidenceLedgerStatus =
  | 'BLOCKED_UPSTREAM'
  | 'NO_CANDIDATE_EVIDENCE'
  | 'CANDIDATE_EVIDENCE_PENDING_REQUIREMENT_REVIEW_PRODUCTION_LOCKED'

export interface CanonicalProfileCandidateEvidenceEntry {
  version: typeof PROFILE_DATA_03_13_VERSION
  candidateEvidenceId: string
  sourceIntentId: string
  submissionId: string
  applicationId: string
  relation: CanonicalProfileAssemblyEvidenceSubmissionRecord['relation']
  requirementKind: CanonicalProfileAssemblyEvidenceSubmissionRecord['requirementKind']
  authorityKind: CanonicalProfileAssemblyEvidenceSubmissionRecord['authorityKind']
  sourceLabel: string
  sourceRef: string
  candidateState: 'CANDIDATE_EVIDENCE_PENDING_REQUIREMENT_REVIEW'
  requirementSatisfied: false
  validatedEvidence: false
  manufacturerApproved: false
  verifiedAssemblyNodeEvidence: false
  exactJointGeometryVerified: false
  productionCompatibilityValidated: false
  productionUnlockAllowed: false
  machineReady: false
}

export interface CanonicalProfileCandidateEvidenceLedger {
  version: typeof PROFILE_DATA_03_13_VERSION
  sourceIntentId: string
  status: CanonicalProfileCandidateEvidenceLedgerStatus
  entries: CanonicalProfileCandidateEvidenceEntry[]
  conflicts: string[]
  warnings: string[]
  candidateEvidenceCount: number
  candidateEvidenceRequiresRequirementReview: true
  requirementSatisfied: false
  validatedEvidenceCreated: false
  createsManufacturerApproval: false
  createsVerifiedAssemblyNodeEvidence: false
  validatesExactJointGeometry: false
  upgradesEvidenceMaturityAutomatically: false
  productionCompatibilityValidated: false
  productionUnlockAllowed: false
  machineReady: false
}

export function canonicalProfileCandidateEvidenceEntrySignature(entry: CanonicalProfileCandidateEvidenceEntry): string {
  return JSON.stringify({
    candidateEvidenceId: entry.candidateEvidenceId,
    sourceIntentId: entry.sourceIntentId,
    submissionId: entry.submissionId,
    applicationId: entry.applicationId,
    relation: entry.relation,
    requirementKind: entry.requirementKind,
    authorityKind: entry.authorityKind,
    sourceLabel: entry.sourceLabel,
    sourceRef: entry.sourceRef,
  })
}

export function buildCanonicalProfileCandidateEvidenceLedger(input: {
  readiness: CanonicalProfileAssemblyEvidenceReadiness
  submissions?: readonly CanonicalProfileAssemblyEvidenceSubmissionRecord[]
  sourceReviews?: readonly CanonicalProfileAssemblyEvidenceIntakeHumanReviewRecord[]
  applicationRecords?: readonly CanonicalProfileAssemblyEvidenceApplicationRecord[]
}): CanonicalProfileCandidateEvidenceLedger {
  const submissions = input.submissions ?? []
  const sourceReviews = input.sourceReviews ?? []
  const applicationRecords = input.applicationRecords ?? []
  const gate = buildCanonicalProfileAssemblyEvidenceApplicationGate({
    readiness: input.readiness,
    submissions,
    sourceReviews,
    records: applicationRecords,
  })
  const entries: CanonicalProfileCandidateEvidenceEntry[] = []

  if (!gate.conflicts.length) {
    for (const row of gate.rows.filter((item) => item.state === 'APPLIED_TO_CANDIDATE_LEDGER')) {
      const submission = submissions.find((item) => item.submissionId === row.submissionId)
      const application = applicationRecords.find((item) => item.submissionId === row.submissionId && item.decision === 'APPLY_ACCEPTED_SOURCE')
      if (!submission || !application) continue
      entries.push(Object.freeze({
        version: PROFILE_DATA_03_13_VERSION,
        candidateEvidenceId: `candidate:${submission.submissionId}:${application.applicationId}`,
        sourceIntentId: input.readiness.sourceIntentId,
        submissionId: submission.submissionId,
        applicationId: application.applicationId,
        relation: submission.relation,
        requirementKind: submission.requirementKind,
        authorityKind: submission.authorityKind,
        sourceLabel: submission.sourceLabel,
        sourceRef: submission.sourceRef,
        candidateState: 'CANDIDATE_EVIDENCE_PENDING_REQUIREMENT_REVIEW',
        requirementSatisfied: false,
        validatedEvidence: false,
        manufacturerApproved: false,
        verifiedAssemblyNodeEvidence: false,
        exactJointGeometryVerified: false,
        productionCompatibilityValidated: false,
        productionUnlockAllowed: false,
        machineReady: false,
      }))
    }
  }

  let status: CanonicalProfileCandidateEvidenceLedgerStatus
  if (gate.status === 'BLOCKED_UPSTREAM' || gate.status === 'BLOCKED_APPLICATION_CONFLICT') status = 'BLOCKED_UPSTREAM'
  else if (entries.length === 0) status = 'NO_CANDIDATE_EVIDENCE'
  else status = 'CANDIDATE_EVIDENCE_PENDING_REQUIREMENT_REVIEW_PRODUCTION_LOCKED'

  return {
    version: PROFILE_DATA_03_13_VERSION,
    sourceIntentId: input.readiness.sourceIntentId,
    status,
    entries,
    conflicts: [...gate.conflicts],
    warnings: [...gate.warnings],
    candidateEvidenceCount: entries.length,
    candidateEvidenceRequiresRequirementReview: true,
    requirementSatisfied: false,
    validatedEvidenceCreated: false,
    createsManufacturerApproval: false,
    createsVerifiedAssemblyNodeEvidence: false,
    validatesExactJointGeometry: false,
    upgradesEvidenceMaturityAutomatically: false,
    productionCompatibilityValidated: false,
    productionUnlockAllowed: false,
    machineReady: false,
  }
}

export const PROFILE_DATA_03_13_SAFETY = Object.freeze({
  candidateEvidenceRequiresRequirementReview: true,
  requirementSatisfied: false,
  validatedEvidenceCreated: false,
  createsManufacturerApproval: false,
  createsVerifiedAssemblyNodeEvidence: false,
  exactJointGeometryVerified: false,
  productionCompatibilityValidated: false,
  productionUnlockAllowed: false,
  machineReady: false,
})
