import type {
  CanonicalProfileAssemblyEvidenceHumanReviewGate,
  CanonicalProfileAssemblyEvidenceHumanReviewRow,
} from './aiCanonicalProfileAssemblyEvidenceHumanReview'

export const AI_CANONICAL_PROFILE_ASSEMBLY_EVIDENCE_REVIEW_SUMMARY_VERSION = 'PROFILE_DATA_03.8' as const

export type CanonicalProfileAssemblyEvidenceReviewSummaryStatus =
  | 'BLOCKED_UPSTREAM'
  | 'BLOCKED_REVIEW_CONFLICT'
  | 'STALE_REVIEW_REQUIRED'
  | 'HUMAN_REVIEW_INCOMPLETE'
  | 'HUMAN_ACTION_REQUIRED'
  | 'CURRENT_EVIDENCE_ACCEPTED_PRODUCTION_LOCKED'

export type CanonicalProfileAssemblyEvidenceReviewDisposition =
  | 'BLOCKED'
  | 'STALE'
  | 'PENDING_HUMAN_REVIEW'
  | 'ACTION_REQUIRED'
  | 'ACCEPTED_CURRENT_EVIDENCE_CLASSIFICATION_ONLY'

export interface CanonicalProfileAssemblyEvidenceReviewSummaryRow {
  relation: CanonicalProfileAssemblyEvidenceHumanReviewRow['relation']
  leftRole: CanonicalProfileAssemblyEvidenceHumanReviewRow['leftRole']
  leftProfileCode: string
  rightRole: CanonicalProfileAssemblyEvidenceHumanReviewRow['rightRole']
  rightProfileCode: string
  evidenceMaturity: CanonicalProfileAssemblyEvidenceHumanReviewRow['evidenceMaturity']
  humanReviewState: CanonicalProfileAssemblyEvidenceHumanReviewRow['state']
  reviewId: string | null
  acceptedCurrentEvidence: boolean
  actionRequired: boolean
  staleReview: boolean
  unreviewed: boolean
  manufacturerAssemblyCompatibilityValidated: false
  verifiedAssemblyNodeEvidence: false
  exactJointGeometryVerified: false
  productionCompatibilityValidated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

export interface CanonicalProfileAssemblyEvidenceReviewSummary {
  version: typeof AI_CANONICAL_PROFILE_ASSEMBLY_EVIDENCE_REVIEW_SUMMARY_VERSION
  sourceHumanReviewVersion: CanonicalProfileAssemblyEvidenceHumanReviewGate['version']
  sourceIntentId: string
  sourceEvidenceStateKey: string
  sourceHumanReviewStateKey: string
  status: CanonicalProfileAssemblyEvidenceReviewSummaryStatus
  disposition: CanonicalProfileAssemblyEvidenceReviewDisposition
  rows: CanonicalProfileAssemblyEvidenceReviewSummaryRow[]
  conflicts: string[]
  warnings: string[]
  relationCount: number
  acceptedCount: number
  moreEvidenceRequiredCount: number
  rejectedCount: number
  staleCount: number
  unreviewedCount: number
  currentEvidenceClassificationReviewComplete: boolean
  currentEvidenceClassificationReviewAccepted: boolean
  currentEvidenceClassificationReviewGatePassed: boolean
  humanActionRequired: boolean
  summaryOnly: true
  changesEvidenceMaturity: false
  createsManufacturerApproval: false
  createsVerifiedAssemblyNodeEvidence: false
  validatesExactJointGeometry: false
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

export function canonicalProfileAssemblyEvidenceHumanReviewStateKey(
  gate: CanonicalProfileAssemblyEvidenceHumanReviewGate,
): string {
  return JSON.stringify({
    sourceIntentId: gate.sourceIntentId,
    sourceEvidenceStateKey: gate.sourceEvidenceStateKey,
    status: gate.status,
    rows: [...gate.rows]
      .sort((a, b) => a.relation.localeCompare(b.relation))
      .map((row) => ({
        relation: row.relation,
        evidenceMaturity: row.evidenceMaturity,
        state: row.state,
        reviewId: row.reviewId,
        reviewedAt: row.reviewedAt,
        leftProfileCode: row.leftProfileCode,
        rightProfileCode: row.rightProfileCode,
        sourceEvidencePreserved: row.sourceEvidencePreserved,
      })),
    conflicts: [...gate.conflicts].sort(),
  })
}

function failClosedSafetyConflicts(
  gate: CanonicalProfileAssemblyEvidenceHumanReviewGate,
): string[] {
  const conflicts: string[] = []

  if (gate.manufacturerAssemblyCompatibilityValidated) {
    conflicts.push('PROFILE DATA 03.7 unexpectedly reports manufacturer assembly compatibility validation.')
  }
  if (gate.verifiedAssemblyNodeEvidence) {
    conflicts.push('PROFILE DATA 03.7 unexpectedly reports verified assembly-node evidence.')
  }
  if (gate.exactJointGeometryVerified) {
    conflicts.push('PROFILE DATA 03.7 unexpectedly reports exact joint geometry verification.')
  }
  if (gate.automaticProfileSelectionAllowed || gate.automaticGeometryAllowed) {
    conflicts.push('PROFILE DATA 03.7 unexpectedly allows automatic profile selection or geometry.')
  }
  if (gate.productionCompatibilityValidated || gate.productionRuleApplied || gate.productionDeductionsApplied) {
    conflicts.push('PROFILE DATA 03.7 unexpectedly reports production validation or production rule application.')
  }
  if (gate.manufacturingToleranceApplied || gate.rulesValidated || gate.productionUnlockAllowed || gate.machineReady || gate.productionApproved) {
    conflicts.push('PROFILE DATA 03.7 unexpectedly crosses a production safety boundary.')
  }

  for (const row of gate.rows) {
    if (
      row.manufacturerAssemblyCompatibilityValidated
      || row.verifiedAssemblyNodeEvidence
      || row.exactJointGeometryVerified
      || row.productionCompatibilityValidated
      || row.productionUnlockAllowed
      || row.machineReady
      || row.productionApproved
    ) {
      conflicts.push(`${row.relation} unexpectedly crosses an assembly or production safety boundary.`)
    }
  }

  return conflicts
}

export function buildCanonicalProfileAssemblyEvidenceReviewSummary(
  gate: CanonicalProfileAssemblyEvidenceHumanReviewGate,
): CanonicalProfileAssemblyEvidenceReviewSummary {
  const conflicts = [...gate.conflicts, ...failClosedSafetyConflicts(gate)]
  const warnings = [...gate.warnings]

  const rows: CanonicalProfileAssemblyEvidenceReviewSummaryRow[] = gate.rows.map((row) => ({
    relation: row.relation,
    leftRole: row.leftRole,
    leftProfileCode: row.leftProfileCode,
    rightRole: row.rightRole,
    rightProfileCode: row.rightProfileCode,
    evidenceMaturity: row.evidenceMaturity,
    humanReviewState: row.state,
    reviewId: row.reviewId,
    acceptedCurrentEvidence: row.state === 'HUMAN_ACCEPTED_CURRENT_EVIDENCE',
    actionRequired: row.state === 'HUMAN_MORE_EVIDENCE_REQUIRED' || row.state === 'HUMAN_REJECTED_CURRENT_EVIDENCE',
    staleReview: row.state === 'STALE_REVIEW_REQUIRED',
    unreviewed: row.state === 'UNREVIEWED',
    manufacturerAssemblyCompatibilityValidated: false,
    verifiedAssemblyNodeEvidence: false,
    exactJointGeometryVerified: false,
    productionCompatibilityValidated: false,
    productionUnlockAllowed: false,
    machineReady: false,
    productionApproved: false,
  }))

  const acceptedCount = rows.filter((row) => row.acceptedCurrentEvidence).length
  const moreEvidenceRequiredCount = rows.filter((row) => row.humanReviewState === 'HUMAN_MORE_EVIDENCE_REQUIRED').length
  const rejectedCount = rows.filter((row) => row.humanReviewState === 'HUMAN_REJECTED_CURRENT_EVIDENCE').length
  const staleCount = rows.filter((row) => row.staleReview).length
  const unreviewedCount = rows.filter((row) => row.unreviewed).length
  const relationCount = rows.length

  if (acceptedCount !== gate.acceptedCount) conflicts.push('PROFILE DATA 03.7 acceptedCount does not match row states.')
  if (moreEvidenceRequiredCount !== gate.moreEvidenceRequiredCount) conflicts.push('PROFILE DATA 03.7 moreEvidenceRequiredCount does not match row states.')
  if (rejectedCount !== gate.rejectedCount) conflicts.push('PROFILE DATA 03.7 rejectedCount does not match row states.')
  if (staleCount !== gate.staleCount) conflicts.push('PROFILE DATA 03.7 staleCount does not match row states.')
  if (unreviewedCount !== gate.unreviewedCount) conflicts.push('PROFILE DATA 03.7 unreviewedCount does not match row states.')

  const humanActionRequired = moreEvidenceRequiredCount > 0 || rejectedCount > 0
  const currentEvidenceClassificationReviewComplete = relationCount > 0
    && staleCount === 0
    && unreviewedCount === 0
    && !humanActionRequired
  const currentEvidenceClassificationReviewAccepted = currentEvidenceClassificationReviewComplete
    && acceptedCount === relationCount

  if (gate.humanEvidenceReviewComplete !== currentEvidenceClassificationReviewComplete) {
    conflicts.push('PROFILE DATA 03.7 humanEvidenceReviewComplete does not match aggregated relation states.')
  }
  if (gate.humanEvidenceReviewAccepted !== currentEvidenceClassificationReviewAccepted) {
    conflicts.push('PROFILE DATA 03.7 humanEvidenceReviewAccepted does not match aggregated relation states.')
  }
  if (gate.status === 'HUMAN_REVIEWED_PRODUCTION_LOCKED' && !currentEvidenceClassificationReviewAccepted) {
    conflicts.push('PROFILE DATA 03.7 status says reviewed, but not every current evidence relation is accepted.')
  }

  let status: CanonicalProfileAssemblyEvidenceReviewSummaryStatus
  let disposition: CanonicalProfileAssemblyEvidenceReviewDisposition

  if (gate.status === 'BLOCKED_UPSTREAM') {
    status = 'BLOCKED_UPSTREAM'
    disposition = 'BLOCKED'
  } else if (gate.status === 'BLOCKED_REVIEW_CONFLICT' || conflicts.length) {
    status = 'BLOCKED_REVIEW_CONFLICT'
    disposition = 'BLOCKED'
  } else if (staleCount > 0 || gate.status === 'STALE_REVIEW_REQUIRED') {
    status = 'STALE_REVIEW_REQUIRED'
    disposition = 'STALE'
  } else if (humanActionRequired || gate.status === 'HUMAN_MORE_EVIDENCE_REQUIRED') {
    status = 'HUMAN_ACTION_REQUIRED'
    disposition = 'ACTION_REQUIRED'
  } else if (!currentEvidenceClassificationReviewAccepted) {
    status = 'HUMAN_REVIEW_INCOMPLETE'
    disposition = 'PENDING_HUMAN_REVIEW'
  } else {
    status = 'CURRENT_EVIDENCE_ACCEPTED_PRODUCTION_LOCKED'
    disposition = 'ACCEPTED_CURRENT_EVIDENCE_CLASSIFICATION_ONLY'
  }

  return {
    version: AI_CANONICAL_PROFILE_ASSEMBLY_EVIDENCE_REVIEW_SUMMARY_VERSION,
    sourceHumanReviewVersion: gate.version,
    sourceIntentId: gate.sourceIntentId,
    sourceEvidenceStateKey: gate.sourceEvidenceStateKey,
    sourceHumanReviewStateKey: canonicalProfileAssemblyEvidenceHumanReviewStateKey(gate),
    status,
    disposition,
    rows,
    conflicts: unique(conflicts),
    warnings: unique(warnings),
    relationCount,
    acceptedCount,
    moreEvidenceRequiredCount,
    rejectedCount,
    staleCount,
    unreviewedCount,
    currentEvidenceClassificationReviewComplete,
    currentEvidenceClassificationReviewAccepted,
    currentEvidenceClassificationReviewGatePassed: status === 'CURRENT_EVIDENCE_ACCEPTED_PRODUCTION_LOCKED',
    humanActionRequired,
    summaryOnly: true,
    changesEvidenceMaturity: false,
    createsManufacturerApproval: false,
    createsVerifiedAssemblyNodeEvidence: false,
    validatesExactJointGeometry: false,
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

export const PROFILE_DATA_03_8_STATE = Object.freeze({
  parent: 'PROFILE DATA 03' as const,
  parentStatus: 'OPEN / WORKING' as const,
  step: 'PROFILE DATA 03.8' as const,
  stepStatus: 'WORKING' as const,
})

export const PROFILE_DATA_03_8_REVIEW_SUMMARY_SAFETY = Object.freeze({
  summaryOnly: true,
  currentEvidenceClassificationOnly: true,
  changesEvidenceMaturity: false,
  humanAcceptanceIsManufacturerApproval: false,
  createsVerifiedAssemblyNodeEvidence: false,
  exactJointGeometryVerified: false,
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
