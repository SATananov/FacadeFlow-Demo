import type { CanonicalProfileAssemblyEvidenceReadiness } from './aiCanonicalProfileAssemblyEvidenceReadiness'
import {
  buildCanonicalProfileAssemblyEvidenceIntakeLedger,
  canonicalProfileAssemblyEvidenceReadinessStateKey,
  type CanonicalProfileAssemblyEvidenceSubmissionRecord,
} from './aiCanonicalProfileAssemblyEvidenceIntake'

export const AI_CANONICAL_PROFILE_ASSEMBLY_EVIDENCE_INTAKE_HUMAN_REVIEW_VERSION = 'PROFILE_DATA_03.11' as const

export type CanonicalProfileAssemblyEvidenceIntakeHumanDecision =
  | 'ACCEPT_SOURCE'
  | 'REJECT_SOURCE'
  | 'NEEDS_MORE_EVIDENCE'

export type CanonicalProfileAssemblyEvidenceIntakeHumanReviewState =
  | 'UNREVIEWED'
  | 'HUMAN_ACCEPTED_SOURCE'
  | 'HUMAN_REJECTED_SOURCE'
  | 'HUMAN_MORE_EVIDENCE_REQUIRED'
  | 'STALE_REVIEW_REQUIRED'

export type CanonicalProfileAssemblyEvidenceIntakeHumanReviewStatus =
  | 'BLOCKED_UPSTREAM'
  | 'BLOCKED_REVIEW_CONFLICT'
  | 'NO_REGISTERED_SOURCE'
  | 'HUMAN_REVIEW_INCOMPLETE'
  | 'HUMAN_ACTION_REQUIRED'
  | 'STALE_REVIEW_REQUIRED'
  | 'SOURCES_HUMAN_REVIEWED_NOT_APPLIED'

export interface CanonicalProfileAssemblyEvidenceIntakeHumanReviewInput {
  reviewId: string
  submissionId: string
  reviewerRole: 'TECHNICAL_REVIEWER' | 'CONSTRUCTOR'
  reviewedAt: string
  decision: CanonicalProfileAssemblyEvidenceIntakeHumanDecision
  note?: string
}

export interface CanonicalProfileAssemblyEvidenceIntakeHumanReviewRecord {
  version: typeof AI_CANONICAL_PROFILE_ASSEMBLY_EVIDENCE_INTAKE_HUMAN_REVIEW_VERSION
  reviewId: string
  sourceIntentId: string
  sourceReadinessStateKey: string
  sourceSubmissionSignature: string
  submissionId: string
  relation: CanonicalProfileAssemblyEvidenceSubmissionRecord['relation']
  requirementKind: CanonicalProfileAssemblyEvidenceSubmissionRecord['requirementKind']
  authorityKind: CanonicalProfileAssemblyEvidenceSubmissionRecord['authorityKind']
  sourceLabel: string
  sourceRef: string
  reviewerRole: 'TECHNICAL_REVIEWER' | 'CONSTRUCTOR'
  reviewedAt: string
  decision: CanonicalProfileAssemblyEvidenceIntakeHumanDecision
  note: string
  acceptsSourceForCurrentRequirementReview: boolean
  appliesSourceToEvidenceLedger: false
  requirementSatisfied: false
  createsValidatedEvidence: false
  createsManufacturerApproval: false
  createsVerifiedAssemblyNodeEvidence: false
  validatesExactJointGeometry: false
  upgradesEvidenceMaturityAutomatically: false
  validatesProductionCompatibility: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

export interface CanonicalProfileAssemblyEvidenceIntakeHumanReviewRow {
  submissionId: string
  relation: CanonicalProfileAssemblyEvidenceSubmissionRecord['relation']
  requirementKind: CanonicalProfileAssemblyEvidenceSubmissionRecord['requirementKind']
  authorityKind: CanonicalProfileAssemblyEvidenceSubmissionRecord['authorityKind']
  sourceLabel: string
  sourceRef: string
  submittedAt: string
  reviewerRole: CanonicalProfileAssemblyEvidenceIntakeHumanReviewRecord['reviewerRole'] | null
  reviewedAt: string | null
  note: string
  state: CanonicalProfileAssemblyEvidenceIntakeHumanReviewState
  acceptedSourceForCurrentRequirementReview: boolean
  appliedToEvidenceLedger: false
  requirementSatisfied: false
  evidenceMaturityUpgraded: false
  productionCompatibilityValidated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

export interface CanonicalProfileAssemblyEvidenceIntakeHumanReviewGate {
  version: typeof AI_CANONICAL_PROFILE_ASSEMBLY_EVIDENCE_INTAKE_HUMAN_REVIEW_VERSION
  sourceIntentId: string
  sourceReadinessStateKey: string
  status: CanonicalProfileAssemblyEvidenceIntakeHumanReviewStatus
  rows: CanonicalProfileAssemblyEvidenceIntakeHumanReviewRow[]
  conflicts: string[]
  warnings: string[]
  registeredSourceCount: number
  unreviewedCount: number
  acceptedSourceCount: number
  rejectedSourceCount: number
  needsMoreEvidenceCount: number
  staleReviewCount: number
  sourceReviewOnly: true
  humanReviewRequired: true
  acceptedSourceIsAppliedEvidence: false
  acceptedSourceSatisfiesRequirement: false
  createsValidatedEvidence: false
  createsManufacturerApproval: false
  createsVerifiedAssemblyNodeEvidence: false
  validatesExactJointGeometry: false
  upgradesEvidenceMaturityAutomatically: false
  automaticProfileSelectionAllowed: false
  automaticGeometryAllowed: false
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

export function canonicalProfileAssemblyEvidenceSubmissionSignature(
  submission: CanonicalProfileAssemblyEvidenceSubmissionRecord,
): string {
  return JSON.stringify({
    submissionId: submission.submissionId,
    sourceIntentId: submission.sourceIntentId,
    sourceReadinessVersion: submission.sourceReadinessVersion,
    sourceReadinessStateKey: submission.sourceReadinessStateKey,
    sourceRequirementSignature: submission.sourceRequirementSignature,
    relation: submission.relation,
    leftRole: submission.leftRole,
    leftProfileCode: submission.leftProfileCode,
    rightRole: submission.rightRole,
    rightProfileCode: submission.rightProfileCode,
    requirementKind: submission.requirementKind,
    authorityKind: submission.authorityKind,
    sourceLabel: submission.sourceLabel,
    sourceRef: submission.sourceRef,
    submittedByRole: submission.submittedByRole,
    submittedAt: submission.submittedAt,
    note: submission.note,
  })
}

function currentSubmission(input: {
  readiness: CanonicalProfileAssemblyEvidenceReadiness
  submissions: readonly CanonicalProfileAssemblyEvidenceSubmissionRecord[]
  submissionId: string
}): CanonicalProfileAssemblyEvidenceSubmissionRecord {
  const submission = input.submissions.find((item) => item.submissionId === input.submissionId)
  if (!submission) throw new Error(`Manual evidence submission ${input.submissionId} was not found.`)

  const ledger = buildCanonicalProfileAssemblyEvidenceIntakeLedger({
    readiness: input.readiness,
    records: input.submissions,
  })
  if (ledger.status === 'BLOCKED_UPSTREAM' || ledger.status === 'BLOCKED_INTAKE_CONFLICT') {
    throw new Error(`PROFILE DATA 03.10 intake is ${ledger.status}; source human review fails closed.`)
  }
  const row = ledger.rows.find((item) => item.relation === submission.relation && item.requirementKind === submission.requirementKind)
  if (!row || row.state !== 'REGISTERED_PENDING_HUMAN_REVIEW') {
    throw new Error(`Manual evidence submission ${input.submissionId} is stale or is not pending human review.`)
  }
  return submission
}

export function createCanonicalProfileAssemblyEvidenceIntakeHumanReviewRecord(
  readiness: CanonicalProfileAssemblyEvidenceReadiness,
  submissions: readonly CanonicalProfileAssemblyEvidenceSubmissionRecord[],
  input: CanonicalProfileAssemblyEvidenceIntakeHumanReviewInput,
): CanonicalProfileAssemblyEvidenceIntakeHumanReviewRecord {
  const submission = currentSubmission({ readiness, submissions, submissionId: input.submissionId })
  const reviewId = input.reviewId.trim()
  const reviewedAt = input.reviewedAt.trim()
  const note = input.note?.trim() ?? ''
  if (!reviewId) throw new Error('Manual evidence human review requires a reviewId.')
  if (!reviewedAt) throw new Error('Manual evidence human review requires reviewedAt.')
  if (input.decision !== 'ACCEPT_SOURCE' && !note) {
    throw new Error(`${input.decision} requires a human review note.`)
  }

  return Object.freeze({
    version: AI_CANONICAL_PROFILE_ASSEMBLY_EVIDENCE_INTAKE_HUMAN_REVIEW_VERSION,
    reviewId,
    sourceIntentId: readiness.sourceIntentId,
    sourceReadinessStateKey: canonicalProfileAssemblyEvidenceReadinessStateKey(readiness),
    sourceSubmissionSignature: canonicalProfileAssemblyEvidenceSubmissionSignature(submission),
    submissionId: submission.submissionId,
    relation: submission.relation,
    requirementKind: submission.requirementKind,
    authorityKind: submission.authorityKind,
    sourceLabel: submission.sourceLabel,
    sourceRef: submission.sourceRef,
    reviewerRole: input.reviewerRole,
    reviewedAt,
    decision: input.decision,
    note,
    acceptsSourceForCurrentRequirementReview: input.decision === 'ACCEPT_SOURCE',
    appliesSourceToEvidenceLedger: false,
    requirementSatisfied: false,
    createsValidatedEvidence: false,
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

function stateForDecision(
  decision: CanonicalProfileAssemblyEvidenceIntakeHumanDecision,
): CanonicalProfileAssemblyEvidenceIntakeHumanReviewState {
  if (decision === 'ACCEPT_SOURCE') return 'HUMAN_ACCEPTED_SOURCE'
  if (decision === 'REJECT_SOURCE') return 'HUMAN_REJECTED_SOURCE'
  return 'HUMAN_MORE_EVIDENCE_REQUIRED'
}

export function buildCanonicalProfileAssemblyEvidenceIntakeHumanReviewGate(input: {
  readiness: CanonicalProfileAssemblyEvidenceReadiness
  submissions?: readonly CanonicalProfileAssemblyEvidenceSubmissionRecord[]
  records?: readonly CanonicalProfileAssemblyEvidenceIntakeHumanReviewRecord[]
}): CanonicalProfileAssemblyEvidenceIntakeHumanReviewGate {
  const readiness = input.readiness
  const submissions = input.submissions ?? []
  const records = input.records ?? []
  const ledger = buildCanonicalProfileAssemblyEvidenceIntakeLedger({ readiness, records: submissions })
  const currentReadinessStateKey = canonicalProfileAssemblyEvidenceReadinessStateKey(readiness)
  const conflicts = [...ledger.conflicts]
  const warnings = [...ledger.warnings]
  const submissionById = new Map(submissions.map((submission) => [submission.submissionId, submission]))
  const recordsBySubmission = new Map<string, CanonicalProfileAssemblyEvidenceIntakeHumanReviewRecord[]>()

  for (const record of records) {
    if (!submissionById.has(record.submissionId)) {
      conflicts.push(`${record.submissionId} has a human review record but no current manual evidence submission.`)
      continue
    }
    const list = recordsBySubmission.get(record.submissionId) ?? []
    list.push(record)
    recordsBySubmission.set(record.submissionId, list)
  }
  for (const [submissionId, list] of recordsBySubmission) {
    if (list.length > 1) conflicts.push(`${submissionId} has multiple active human review records; review is ambiguous.`)
  }

  const rows: CanonicalProfileAssemblyEvidenceIntakeHumanReviewRow[] = submissions.map((submission) => {
    const intakeRow = ledger.rows.find((row) => row.relation === submission.relation && row.requirementKind === submission.requirementKind)
    const matching = recordsBySubmission.get(submission.submissionId) ?? []
    const record = matching.length === 1 ? matching[0] : undefined
    const staleRegistration = !intakeRow || intakeRow.state === 'STALE_REGISTRATION_REVIEW_REQUIRED'
    const staleReview = Boolean(record) && (
      record!.sourceIntentId !== readiness.sourceIntentId
      || record!.sourceReadinessStateKey !== currentReadinessStateKey
      || record!.sourceSubmissionSignature !== canonicalProfileAssemblyEvidenceSubmissionSignature(submission)
    )

    let state: CanonicalProfileAssemblyEvidenceIntakeHumanReviewState = 'UNREVIEWED'
    if (staleRegistration || staleReview) state = 'STALE_REVIEW_REQUIRED'
    else if (record) state = stateForDecision(record.decision)

    return {
      submissionId: submission.submissionId,
      relation: submission.relation,
      requirementKind: submission.requirementKind,
      authorityKind: submission.authorityKind,
      sourceLabel: submission.sourceLabel,
      sourceRef: submission.sourceRef,
      submittedAt: submission.submittedAt,
      reviewerRole: record?.reviewerRole ?? null,
      reviewedAt: record?.reviewedAt ?? null,
      note: record?.note ?? '',
      state,
      acceptedSourceForCurrentRequirementReview: state === 'HUMAN_ACCEPTED_SOURCE',
      appliedToEvidenceLedger: false,
      requirementSatisfied: false,
      evidenceMaturityUpgraded: false,
      productionCompatibilityValidated: false,
      productionUnlockAllowed: false,
      machineReady: false,
      productionApproved: false,
    }
  })

  const staleReviewCount = rows.filter((row) => row.state === 'STALE_REVIEW_REQUIRED').length
  const unreviewedCount = rows.filter((row) => row.state === 'UNREVIEWED').length
  const acceptedSourceCount = rows.filter((row) => row.state === 'HUMAN_ACCEPTED_SOURCE').length
  const rejectedSourceCount = rows.filter((row) => row.state === 'HUMAN_REJECTED_SOURCE').length
  const needsMoreEvidenceCount = rows.filter((row) => row.state === 'HUMAN_MORE_EVIDENCE_REQUIRED').length

  let status: CanonicalProfileAssemblyEvidenceIntakeHumanReviewStatus
  if (ledger.status === 'BLOCKED_UPSTREAM' || ledger.status === 'BLOCKED_INTAKE_CONFLICT') status = 'BLOCKED_UPSTREAM'
  else if (conflicts.length) status = 'BLOCKED_REVIEW_CONFLICT'
  else if (rows.length === 0) status = 'NO_REGISTERED_SOURCE'
  else if (staleReviewCount) status = 'STALE_REVIEW_REQUIRED'
  else if (unreviewedCount) status = 'HUMAN_REVIEW_INCOMPLETE'
  else if (rejectedSourceCount || needsMoreEvidenceCount) status = 'HUMAN_ACTION_REQUIRED'
  else status = 'SOURCES_HUMAN_REVIEWED_NOT_APPLIED'

  return {
    version: AI_CANONICAL_PROFILE_ASSEMBLY_EVIDENCE_INTAKE_HUMAN_REVIEW_VERSION,
    sourceIntentId: readiness.sourceIntentId,
    sourceReadinessStateKey: currentReadinessStateKey,
    status,
    rows,
    conflicts: unique(conflicts),
    warnings: unique(warnings),
    registeredSourceCount: rows.length,
    unreviewedCount,
    acceptedSourceCount,
    rejectedSourceCount,
    needsMoreEvidenceCount,
    staleReviewCount,
    sourceReviewOnly: true,
    humanReviewRequired: true,
    acceptedSourceIsAppliedEvidence: false,
    acceptedSourceSatisfiesRequirement: false,
    createsValidatedEvidence: false,
    createsManufacturerApproval: false,
    createsVerifiedAssemblyNodeEvidence: false,
    validatesExactJointGeometry: false,
    upgradesEvidenceMaturityAutomatically: false,
    automaticProfileSelectionAllowed: false,
    automaticGeometryAllowed: false,
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

export const PROFILE_DATA_03_11_STATE = Object.freeze({
  parent: 'PROFILE DATA 03' as const,
  parentStatus: 'OPEN / WORKING' as const,
  step: 'PROFILE DATA 03.11' as const,
  stepStatus: 'WORKING' as const,
})

export const PROFILE_DATA_03_11_INTAKE_HUMAN_REVIEW_SAFETY = Object.freeze({
  sourceReviewOnly: true,
  humanReviewRequired: true,
  acceptedSourceIsAppliedEvidence: false,
  acceptedSourceSatisfiesRequirement: false,
  createsValidatedEvidence: false,
  createsManufacturerApproval: false,
  createsVerifiedAssemblyNodeEvidence: false,
  exactJointGeometryVerified: false,
  upgradesEvidenceMaturityAutomatically: false,
  automaticProfileSelectionAllowed: false,
  automaticGeometryAllowed: false,
  productionCompatibilityValidated: false,
  productionRuleApplied: false,
  productionDeductionsApplied: false,
  manufacturingToleranceApplied: false,
  rulesValidated: false,
  productionUnlockAllowed: false,
  machineReady: false,
  productionApproved: false,
})
