import type {
  ProductionPatternCandidate,
  ProductionPatternCandidateReviewDecision,
} from './skyGlazingProductionPatternCandidates'

export const RP01_4_EVIDENCE_FINGERPRINT_VERSION = 'RP01.4-EVIDENCE-V1' as const
export const HUMAN_CANDIDATE_REVIEW_LEDGER = 'HUMAN_CANDIDATE_REVIEW_LEDGER' as const

export type ProductionPatternReviewLedgerDecision =
  | 'CONFIRMED_AS_CANDIDATE'
  | 'REJECTED_AS_CANDIDATE'

export type ProductionPatternReviewLedgerEntryState =
  | 'CURRENT'
  | 'STALE_REQUIRES_REVIEW'

export type ProductionPatternReviewInvalidationReason =
  | 'CANDIDATE_MISSING'
  | 'EVIDENCE_FINGERPRINT_CHANGED'

export type ProductionPatternReviewRecordFailureReason =
  | 'REVIEWER_REQUIRED'
  | 'REVIEW_TIMESTAMP_REQUIRED'
  | 'CURRENT_REVIEW_ALREADY_RECORDED'

export interface ProductionPatternCandidateEvidenceFingerprint {
  version: typeof RP01_4_EVIDENCE_FINGERPRINT_VERSION
  value: string
}

export interface ProductionPatternCandidateReviewLedgerEntry {
  id: string
  ledgerType: typeof HUMAN_CANDIDATE_REVIEW_LEDGER
  candidateId: string
  profileCode: string
  candidateKind: ProductionPatternCandidate['kind']
  sourceProject: string
  decision: ProductionPatternReviewLedgerDecision
  reviewer: string
  reviewedAt: string
  reviewNote: string
  evidenceFingerprint: ProductionPatternCandidateEvidenceFingerprint
  sourceEvidenceCountAtReview: number
  sourcePatternKeyAtReview: string
  operationNameAtReview: string | null
  candidateIsProductionRule: false
  productionRuleCreated: false
  machineReady: false
  productionApproved: false
}

export interface ProductionPatternCandidateReviewLedgerAssessment {
  entryId: string
  candidateId: string
  state: ProductionPatternReviewLedgerEntryState
  reasons: readonly ProductionPatternReviewInvalidationReason[]
  currentEvidenceFingerprint: ProductionPatternCandidateEvidenceFingerprint | null
  decision: ProductionPatternReviewLedgerDecision
  decisionCurrentlyUsableAsCandidateReview: boolean
  productionRuleCreated: false
  machineReady: false
  productionApproved: false
}

export interface ProductionPatternCandidateReviewLedger {
  entries: readonly ProductionPatternCandidateReviewLedgerEntry[]
  entryCount: number
  currentEntryCount: number
  staleEntryCount: number
  currentConfirmedCount: number
  currentRejectedCount: number
  staleCandidateIds: readonly string[]
  appendOnly: true
  automaticRulePromotionAllowed: false
  productionRuleCreated: false
  machineReady: false
  productionApproved: false
}

export interface RecordProductionPatternCandidateReviewResult {
  status: 'RECORDED' | 'NOT_RECORDED'
  reasons: readonly ProductionPatternReviewRecordFailureReason[]
  entry: ProductionPatternCandidateReviewLedgerEntry | null
  ledger: ProductionPatternCandidateReviewLedger
}

function ledgerDecision(
  decision: ProductionPatternCandidateReviewDecision,
): ProductionPatternReviewLedgerDecision {
  return decision === 'CONFIRM_CANDIDATE'
    ? 'CONFIRMED_AS_CANDIDATE'
    : 'REJECTED_AS_CANDIDATE'
}

export function productionPatternCandidateEvidenceFingerprint(
  candidate: ProductionPatternCandidate,
): ProductionPatternCandidateEvidenceFingerprint {
  const value = JSON.stringify({
    version: RP01_4_EVIDENCE_FINGERPRINT_VERSION,
    candidateId: candidate.id,
    status: candidate.status,
    kind: candidate.kind,
    profileCode: candidate.profileCode,
    sourceProject: candidate.sourceProject,
    sourcePatternKey: candidate.sourcePatternKey,
    evidenceCount: candidate.evidenceCount,
    sourceMultiplicity: candidate.sourceMultiplicity,
    operationName: candidate.operationName,
    singleProjectOnly: candidate.singleProjectOnly,
    crossProjectCorroborated: candidate.crossProjectCorroborated,
  })

  return Object.freeze({
    version: RP01_4_EVIDENCE_FINGERPRINT_VERSION,
    value,
  })
}

function reviewEntryId(
  candidate: ProductionPatternCandidate,
  reviewedAt: string,
  reviewer: string,
): string {
  return [
    'rp01-4-review',
    encodeURIComponent(candidate.id),
    encodeURIComponent(reviewedAt),
    encodeURIComponent(reviewer.trim()),
  ].join(':')
}

function createLedgerEntry(
  candidate: ProductionPatternCandidate,
  decision: ProductionPatternCandidateReviewDecision,
  reviewer: string,
  reviewedAt: string,
  reviewNote: string,
): ProductionPatternCandidateReviewLedgerEntry {
  return Object.freeze({
    id: reviewEntryId(candidate, reviewedAt, reviewer),
    ledgerType: HUMAN_CANDIDATE_REVIEW_LEDGER,
    candidateId: candidate.id,
    profileCode: candidate.profileCode,
    candidateKind: candidate.kind,
    sourceProject: candidate.sourceProject,
    decision: ledgerDecision(decision),
    reviewer: reviewer.trim(),
    reviewedAt,
    reviewNote: reviewNote.trim(),
    evidenceFingerprint: productionPatternCandidateEvidenceFingerprint(candidate),
    sourceEvidenceCountAtReview: candidate.evidenceCount,
    sourcePatternKeyAtReview: candidate.sourcePatternKey,
    operationNameAtReview: candidate.operationName,
    candidateIsProductionRule: false,
    productionRuleCreated: false,
    machineReady: false,
    productionApproved: false,
  })
}

export function assessProductionPatternCandidateReviewEntry(
  entry: ProductionPatternCandidateReviewLedgerEntry,
  currentCandidate: ProductionPatternCandidate | null,
): ProductionPatternCandidateReviewLedgerAssessment {
  const reasons: ProductionPatternReviewInvalidationReason[] = []
  const currentEvidenceFingerprint = currentCandidate
    ? productionPatternCandidateEvidenceFingerprint(currentCandidate)
    : null

  if (!currentCandidate) {
    reasons.push('CANDIDATE_MISSING')
  } else if (currentEvidenceFingerprint && currentEvidenceFingerprint.value !== entry.evidenceFingerprint.value) {
    reasons.push('EVIDENCE_FINGERPRINT_CHANGED')
  }

  const state: ProductionPatternReviewLedgerEntryState =
    reasons.length === 0 ? 'CURRENT' : 'STALE_REQUIRES_REVIEW'

  return Object.freeze({
    entryId: entry.id,
    candidateId: entry.candidateId,
    state,
    reasons: Object.freeze(reasons),
    currentEvidenceFingerprint,
    decision: entry.decision,
    decisionCurrentlyUsableAsCandidateReview: state === 'CURRENT',
    productionRuleCreated: false,
    machineReady: false,
    productionApproved: false,
  })
}

export function buildProductionPatternCandidateReviewLedger(
  entries: readonly ProductionPatternCandidateReviewLedgerEntry[],
  currentCandidates: readonly ProductionPatternCandidate[],
): ProductionPatternCandidateReviewLedger {
  const currentById = new Map(currentCandidates.map((candidate) => [candidate.id, candidate]))
  const assessments = entries.map((entry) =>
    assessProductionPatternCandidateReviewEntry(entry, currentById.get(entry.candidateId) ?? null),
  )

  const currentEntries = entries.filter((_, index) => assessments[index].state === 'CURRENT')
  const staleCandidateIds = [...new Set(
    assessments
      .filter((assessment) => assessment.state === 'STALE_REQUIRES_REVIEW')
      .map((assessment) => assessment.candidateId),
  )]

  return Object.freeze({
    entries: Object.freeze([...entries]),
    entryCount: entries.length,
    currentEntryCount: currentEntries.length,
    staleEntryCount: entries.length - currentEntries.length,
    currentConfirmedCount: currentEntries.filter(
      (entry) => entry.decision === 'CONFIRMED_AS_CANDIDATE',
    ).length,
    currentRejectedCount: currentEntries.filter(
      (entry) => entry.decision === 'REJECTED_AS_CANDIDATE',
    ).length,
    staleCandidateIds: Object.freeze(staleCandidateIds),
    appendOnly: true,
    automaticRulePromotionAllowed: false,
    productionRuleCreated: false,
    machineReady: false,
    productionApproved: false,
  })
}

export function recordProductionPatternCandidateReview(
  existingEntries: readonly ProductionPatternCandidateReviewLedgerEntry[],
  currentCandidates: readonly ProductionPatternCandidate[],
  candidate: ProductionPatternCandidate,
  decision: ProductionPatternCandidateReviewDecision,
  reviewer: string,
  reviewedAt: string,
  reviewNote = '',
): RecordProductionPatternCandidateReviewResult {
  const reasons: ProductionPatternReviewRecordFailureReason[] = []

  if (!reviewer.trim()) reasons.push('REVIEWER_REQUIRED')
  if (!reviewedAt.trim()) reasons.push('REVIEW_TIMESTAMP_REQUIRED')

  const currentFingerprint = productionPatternCandidateEvidenceFingerprint(candidate)
  const hasCurrentReview = existingEntries.some((entry) =>
    entry.candidateId === candidate.id
    && entry.evidenceFingerprint.value === currentFingerprint.value,
  )
  if (hasCurrentReview) reasons.push('CURRENT_REVIEW_ALREADY_RECORDED')

  if (reasons.length > 0) {
    return Object.freeze({
      status: 'NOT_RECORDED',
      reasons: Object.freeze(reasons),
      entry: null,
      ledger: buildProductionPatternCandidateReviewLedger(existingEntries, currentCandidates),
    })
  }

  const entry = createLedgerEntry(
    candidate,
    decision,
    reviewer,
    reviewedAt,
    reviewNote,
  )
  const entries = Object.freeze([...existingEntries, entry])

  return Object.freeze({
    status: 'RECORDED',
    reasons: Object.freeze([]),
    entry,
    ledger: buildProductionPatternCandidateReviewLedger(entries, currentCandidates),
  })
}
