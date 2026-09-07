import type { CanonicalProfileAssemblyEvidenceReadiness } from './aiCanonicalProfileAssemblyEvidenceReadiness'
import type { CanonicalProfileAssemblyEvidenceSubmissionRecord } from './aiCanonicalProfileAssemblyEvidenceIntake'
import {
  buildCanonicalProfileAssemblyEvidenceIntakeHumanReviewGate,
  canonicalProfileAssemblyEvidenceSubmissionSignature,
  type CanonicalProfileAssemblyEvidenceIntakeHumanReviewRecord,
} from './aiCanonicalProfileAssemblyEvidenceIntakeHumanReview'

export const PROFILE_DATA_03_12_VERSION = 'PROFILE_DATA_03.12' as const

export type CanonicalProfileAssemblyEvidenceApplicationDecision =
  | 'APPLY_ACCEPTED_SOURCE'
  | 'HOLD_SOURCE'
  | 'NEEDS_FURTHER_REVIEW'

export type CanonicalProfileAssemblyEvidenceApplicationState =
  | 'UNDECIDED'
  | 'APPLIED_TO_CANDIDATE_LEDGER'
  | 'HELD_BY_HUMAN'
  | 'FURTHER_REVIEW_REQUIRED'
  | 'STALE_APPLICATION_REQUIRED'

export type CanonicalProfileAssemblyEvidenceApplicationStatus =
  | 'BLOCKED_UPSTREAM'
  | 'BLOCKED_APPLICATION_CONFLICT'
  | 'NO_ACCEPTED_SOURCE'
  | 'APPLICATION_REVIEW_INCOMPLETE'
  | 'APPLICATION_ACTION_REQUIRED'
  | 'STALE_APPLICATION_REQUIRED'
  | 'CANDIDATE_LEDGER_APPLICATION_RECORDED_PRODUCTION_LOCKED'

export interface CanonicalProfileAssemblyEvidenceApplicationInput {
  applicationId: string
  submissionId: string
  reviewerRole: 'TECHNICAL_REVIEWER' | 'CONSTRUCTOR'
  decidedAt: string
  decision: CanonicalProfileAssemblyEvidenceApplicationDecision
  note?: string
}

export interface CanonicalProfileAssemblyEvidenceApplicationRecord {
  version: typeof PROFILE_DATA_03_12_VERSION
  applicationId: string
  sourceIntentId: string
  sourceReadinessStateKey: string
  sourceSubmissionSignature: string
  sourceReviewSignature: string
  submissionId: string
  relation: CanonicalProfileAssemblyEvidenceSubmissionRecord['relation']
  requirementKind: CanonicalProfileAssemblyEvidenceSubmissionRecord['requirementKind']
  authorityKind: CanonicalProfileAssemblyEvidenceSubmissionRecord['authorityKind']
  sourceLabel: string
  sourceRef: string
  reviewerRole: 'TECHNICAL_REVIEWER' | 'CONSTRUCTOR'
  decidedAt: string
  decision: CanonicalProfileAssemblyEvidenceApplicationDecision
  note: string
  appliedToCandidateEvidenceLedger: boolean
  appliedToValidatedEvidenceLedger: false
  requirementSatisfied: false
  createsManufacturerApproval: false
  createsVerifiedAssemblyNodeEvidence: false
  validatesExactJointGeometry: false
  upgradesEvidenceMaturityAutomatically: false
  validatesProductionCompatibility: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

export interface CanonicalProfileAssemblyEvidenceApplicationRow {
  submissionId: string
  relation: CanonicalProfileAssemblyEvidenceSubmissionRecord['relation']
  requirementKind: CanonicalProfileAssemblyEvidenceSubmissionRecord['requirementKind']
  sourceLabel: string
  sourceRef: string
  state: CanonicalProfileAssemblyEvidenceApplicationState
  decision: CanonicalProfileAssemblyEvidenceApplicationDecision | null
  note: string
  appliedToCandidateEvidenceLedger: boolean
  appliedToValidatedEvidenceLedger: false
  requirementSatisfied: false
}

export interface CanonicalProfileAssemblyEvidenceApplicationGate {
  version: typeof PROFILE_DATA_03_12_VERSION
  sourceIntentId: string
  status: CanonicalProfileAssemblyEvidenceApplicationStatus
  rows: CanonicalProfileAssemblyEvidenceApplicationRow[]
  conflicts: string[]
  warnings: string[]
  acceptedSourceCount: number
  undecidedCount: number
  candidateAppliedCount: number
  heldCount: number
  furtherReviewCount: number
  staleApplicationCount: number
  explicitApplicationRequired: true
  appliedSourceCreatesCandidateEvidenceOnly: true
  appliedToValidatedEvidenceLedger: false
  requirementSatisfied: false
  createsManufacturerApproval: false
  createsVerifiedAssemblyNodeEvidence: false
  validatesExactJointGeometry: false
  upgradesEvidenceMaturityAutomatically: false
  automaticProfileSelectionAllowed: false
  automaticGeometryAllowed: false
  productionCompatibilityValidated: false
  rulesValidated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

const unique = (items: string[]) => [...new Set(items)]

export function canonicalProfileAssemblyEvidenceHumanReviewSignature(
  review: CanonicalProfileAssemblyEvidenceIntakeHumanReviewRecord,
): string {
  return JSON.stringify({
    reviewId: review.reviewId,
    sourceIntentId: review.sourceIntentId,
    sourceReadinessStateKey: review.sourceReadinessStateKey,
    sourceSubmissionSignature: review.sourceSubmissionSignature,
    submissionId: review.submissionId,
    decision: review.decision,
    reviewerRole: review.reviewerRole,
    reviewedAt: review.reviewedAt,
    note: review.note,
  })
}

function acceptedSource(input: {
  readiness: CanonicalProfileAssemblyEvidenceReadiness
  submissions: readonly CanonicalProfileAssemblyEvidenceSubmissionRecord[]
  sourceReviews: readonly CanonicalProfileAssemblyEvidenceIntakeHumanReviewRecord[]
  submissionId: string
}) {
  const gate = buildCanonicalProfileAssemblyEvidenceIntakeHumanReviewGate({
    readiness: input.readiness,
    submissions: input.submissions,
    records: input.sourceReviews,
  })
  if (gate.status === 'BLOCKED_UPSTREAM' || gate.status === 'BLOCKED_REVIEW_CONFLICT') {
    throw new Error(`PROFILE DATA 03.11 source review is ${gate.status}; application fails closed.`)
  }
  const row = gate.rows.find((item) => item.submissionId === input.submissionId)
  if (!row || row.state !== 'HUMAN_ACCEPTED_SOURCE') {
    throw new Error(`Submission ${input.submissionId} is not a current HUMAN_ACCEPTED_SOURCE.`)
  }
  const submission = input.submissions.find((item) => item.submissionId === input.submissionId)
  const review = input.sourceReviews.find((item) => item.submissionId === input.submissionId && item.decision === 'ACCEPT_SOURCE')
  if (!submission || !review) throw new Error(`Accepted source ${input.submissionId} is missing submission or review provenance.`)
  return { gate, row, submission, review }
}

export function createCanonicalProfileAssemblyEvidenceApplicationRecord(
  readiness: CanonicalProfileAssemblyEvidenceReadiness,
  submissions: readonly CanonicalProfileAssemblyEvidenceSubmissionRecord[],
  sourceReviews: readonly CanonicalProfileAssemblyEvidenceIntakeHumanReviewRecord[],
  input: CanonicalProfileAssemblyEvidenceApplicationInput,
): CanonicalProfileAssemblyEvidenceApplicationRecord {
  const current = acceptedSource({ readiness, submissions, sourceReviews, submissionId: input.submissionId })
  const applicationId = input.applicationId.trim()
  const decidedAt = input.decidedAt.trim()
  const note = input.note?.trim() ?? ''
  if (!applicationId) throw new Error('Evidence application requires applicationId.')
  if (!decidedAt) throw new Error('Evidence application requires decidedAt.')
  if (input.decision !== 'APPLY_ACCEPTED_SOURCE' && !note) {
    throw new Error(`${input.decision} requires a human note.`)
  }

  return Object.freeze({
    version: PROFILE_DATA_03_12_VERSION,
    applicationId,
    sourceIntentId: readiness.sourceIntentId,
    sourceReadinessStateKey: current.review.sourceReadinessStateKey,
    sourceSubmissionSignature: canonicalProfileAssemblyEvidenceSubmissionSignature(current.submission),
    sourceReviewSignature: canonicalProfileAssemblyEvidenceHumanReviewSignature(current.review),
    submissionId: current.submission.submissionId,
    relation: current.submission.relation,
    requirementKind: current.submission.requirementKind,
    authorityKind: current.submission.authorityKind,
    sourceLabel: current.submission.sourceLabel,
    sourceRef: current.submission.sourceRef,
    reviewerRole: input.reviewerRole,
    decidedAt,
    decision: input.decision,
    note,
    appliedToCandidateEvidenceLedger: input.decision === 'APPLY_ACCEPTED_SOURCE',
    appliedToValidatedEvidenceLedger: false,
    requirementSatisfied: false,
    createsManufacturerApproval: false,
    createsVerifiedAssemblyNodeEvidence: false,
    validatesExactJointGeometry: false,
    upgradesEvidenceMaturityAutomatically: false,
    validatesProductionCompatibility: false,
    productionUnlockAllowed: false,
    machineReady: false,
    productionApproved: false,
  })
}

export function buildCanonicalProfileAssemblyEvidenceApplicationGate(input: {
  readiness: CanonicalProfileAssemblyEvidenceReadiness
  submissions?: readonly CanonicalProfileAssemblyEvidenceSubmissionRecord[]
  sourceReviews?: readonly CanonicalProfileAssemblyEvidenceIntakeHumanReviewRecord[]
  records?: readonly CanonicalProfileAssemblyEvidenceApplicationRecord[]
}): CanonicalProfileAssemblyEvidenceApplicationGate {
  const submissions = input.submissions ?? []
  const sourceReviews = input.sourceReviews ?? []
  const records = input.records ?? []
  const reviewGate = buildCanonicalProfileAssemblyEvidenceIntakeHumanReviewGate({
    readiness: input.readiness,
    submissions,
    records: sourceReviews,
  })
  const conflicts = [...reviewGate.conflicts]
  const warnings = [...reviewGate.warnings]
  const acceptedRows = reviewGate.rows.filter((row) => row.state === 'HUMAN_ACCEPTED_SOURCE')

  const rows = acceptedRows.map((row) => {
    const submission = submissions.find((item) => item.submissionId === row.submissionId)
    const review = sourceReviews.find((item) => item.submissionId === row.submissionId && item.decision === 'ACCEPT_SOURCE')
    const matching = records.filter((item) => item.submissionId === row.submissionId)
    if (matching.length > 1) conflicts.push(`${row.submissionId} has multiple active evidence application records.`)
    const record = matching.length === 1 ? matching[0] : undefined
    const stale = Boolean(record) && Boolean(submission) && Boolean(review) && (
      record!.sourceIntentId !== input.readiness.sourceIntentId
      || record!.sourceSubmissionSignature !== canonicalProfileAssemblyEvidenceSubmissionSignature(submission!)
      || record!.sourceReviewSignature !== canonicalProfileAssemblyEvidenceHumanReviewSignature(review!)
    )

    let state: CanonicalProfileAssemblyEvidenceApplicationState = 'UNDECIDED'
    if (stale) state = 'STALE_APPLICATION_REQUIRED'
    else if (record?.decision === 'APPLY_ACCEPTED_SOURCE') state = 'APPLIED_TO_CANDIDATE_LEDGER'
    else if (record?.decision === 'HOLD_SOURCE') state = 'HELD_BY_HUMAN'
    else if (record?.decision === 'NEEDS_FURTHER_REVIEW') state = 'FURTHER_REVIEW_REQUIRED'

    return {
      submissionId: row.submissionId,
      relation: row.relation,
      requirementKind: row.requirementKind,
      sourceLabel: row.sourceLabel,
      sourceRef: row.sourceRef,
      state,
      decision: record?.decision ?? null,
      note: record?.note ?? '',
      appliedToCandidateEvidenceLedger: state === 'APPLIED_TO_CANDIDATE_LEDGER',
      appliedToValidatedEvidenceLedger: false as const,
      requirementSatisfied: false as const,
    }
  })

  const undecidedCount = rows.filter((row) => row.state === 'UNDECIDED').length
  const candidateAppliedCount = rows.filter((row) => row.state === 'APPLIED_TO_CANDIDATE_LEDGER').length
  const heldCount = rows.filter((row) => row.state === 'HELD_BY_HUMAN').length
  const furtherReviewCount = rows.filter((row) => row.state === 'FURTHER_REVIEW_REQUIRED').length
  const staleApplicationCount = rows.filter((row) => row.state === 'STALE_APPLICATION_REQUIRED').length

  let status: CanonicalProfileAssemblyEvidenceApplicationStatus
  if (reviewGate.status === 'BLOCKED_UPSTREAM' || reviewGate.status === 'BLOCKED_REVIEW_CONFLICT') status = 'BLOCKED_UPSTREAM'
  else if (conflicts.length) status = 'BLOCKED_APPLICATION_CONFLICT'
  else if (rows.length === 0) status = 'NO_ACCEPTED_SOURCE'
  else if (staleApplicationCount) status = 'STALE_APPLICATION_REQUIRED'
  else if (undecidedCount) status = 'APPLICATION_REVIEW_INCOMPLETE'
  else if (heldCount || furtherReviewCount) status = 'APPLICATION_ACTION_REQUIRED'
  else status = 'CANDIDATE_LEDGER_APPLICATION_RECORDED_PRODUCTION_LOCKED'

  return {
    version: PROFILE_DATA_03_12_VERSION,
    sourceIntentId: input.readiness.sourceIntentId,
    status,
    rows,
    conflicts: unique(conflicts),
    warnings: unique(warnings),
    acceptedSourceCount: rows.length,
    undecidedCount,
    candidateAppliedCount,
    heldCount,
    furtherReviewCount,
    staleApplicationCount,
    explicitApplicationRequired: true,
    appliedSourceCreatesCandidateEvidenceOnly: true,
    appliedToValidatedEvidenceLedger: false,
    requirementSatisfied: false,
    createsManufacturerApproval: false,
    createsVerifiedAssemblyNodeEvidence: false,
    validatesExactJointGeometry: false,
    upgradesEvidenceMaturityAutomatically: false,
    automaticProfileSelectionAllowed: false,
    automaticGeometryAllowed: false,
    productionCompatibilityValidated: false,
    rulesValidated: false,
    productionUnlockAllowed: false,
    machineReady: false,
    productionApproved: false,
  }
}

export const PROFILE_DATA_03_12_SAFETY = Object.freeze({
  explicitApplicationRequired: true,
  candidateEvidenceOnly: true,
  appliedToValidatedEvidenceLedger: false,
  requirementSatisfied: false,
  createsManufacturerApproval: false,
  createsVerifiedAssemblyNodeEvidence: false,
  exactJointGeometryVerified: false,
  automaticGeometryAllowed: false,
  productionCompatibilityValidated: false,
  productionUnlockAllowed: false,
  machineReady: false,
})
