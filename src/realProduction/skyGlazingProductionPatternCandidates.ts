import type {
  CutTupleObservationFrequency,
  ExactOperationObservationFrequency,
  SkyGlazingObservationAggregation,
} from './skyGlazingObservationAggregation'

export const CANDIDATE_PRODUCTION_PATTERN = 'CANDIDATE_PRODUCTION_PATTERN' as const

export type ProductionPatternCandidateKind = 'CUT_TUPLE' | 'EXACT_OPERATION'
export type ProductionPatternCandidateReviewStatus =
  | 'NOT_REVIEWED'
  | 'CONFIRMED_AS_CANDIDATE'
  | 'REJECTED_AS_CANDIDATE'
export type ProductionPatternCandidateReviewDecision =
  | 'CONFIRM_CANDIDATE'
  | 'REJECT_CANDIDATE'
export type ProductionPatternCandidateReviewReason =
  | 'REVIEWER_REQUIRED'
  | 'REVIEW_TIMESTAMP_REQUIRED'
  | 'CANDIDATE_ALREADY_REVIEWED'

export interface ProductionPatternCandidate {
  id: string
  status: typeof CANDIDATE_PRODUCTION_PATTERN
  kind: ProductionPatternCandidateKind
  profileCode: string
  sourceProject: string
  sourcePatternKey: string
  evidenceCount: number
  sourceMultiplicity: 'REPEATED_OBSERVATION'
  operationName: string | null
  singleProjectOnly: true
  crossProjectCorroborated: false
  reviewStatus: ProductionPatternCandidateReviewStatus
  reviewer: string | null
  reviewedAt: string | null
  reviewNote: string
  humanConfirmedAsCandidate: boolean
  humanRejectedAsCandidate: boolean
  candidateIsProductionRule: false
  universalRuleInferenceAllowed: false
  productionRuleCreated: false
  machineReady: false
  productionApproved: false
}

export interface ProductionPatternCandidateSet {
  sourceProject: string
  candidateCount: number
  cutTupleCandidateCount: number
  exactOperationCandidateCount: number
  candidates: readonly ProductionPatternCandidate[]
  singleProjectOnly: true
  crossProjectCorroborated: false
  automaticRulePromotionAllowed: false
  productionRuleCreated: false
  machineReady: false
  productionApproved: false
}

export interface ProductionPatternCandidateReviewAttempt {
  status: 'RECORDED' | 'NOT_RECORDED'
  reasons: readonly ProductionPatternCandidateReviewReason[]
  candidate: ProductionPatternCandidate
}

function candidateId(
  profileCode: string,
  kind: ProductionPatternCandidateKind,
  sourcePatternKey: string,
): string {
  return `rp01-3:${profileCode}:${kind}:${encodeURIComponent(sourcePatternKey)}`
}

function baseCandidate(
  sourceProject: string,
  profileCode: string,
  kind: ProductionPatternCandidateKind,
  sourcePatternKey: string,
  evidenceCount: number,
  operationName: string | null,
): ProductionPatternCandidate {
  return Object.freeze({
    id: candidateId(profileCode, kind, sourcePatternKey),
    status: CANDIDATE_PRODUCTION_PATTERN,
    kind,
    profileCode,
    sourceProject,
    sourcePatternKey,
    evidenceCount,
    sourceMultiplicity: 'REPEATED_OBSERVATION',
    operationName,
    singleProjectOnly: true,
    crossProjectCorroborated: false,
    reviewStatus: 'NOT_REVIEWED',
    reviewer: null,
    reviewedAt: null,
    reviewNote: '',
    humanConfirmedAsCandidate: false,
    humanRejectedAsCandidate: false,
    candidateIsProductionRule: false,
    universalRuleInferenceAllowed: false,
    productionRuleCreated: false,
    machineReady: false,
    productionApproved: false,
  })
}

function cutTupleCandidates(
  sourceProject: string,
  profileCode: string,
  patterns: readonly CutTupleObservationFrequency[],
): ProductionPatternCandidate[] {
  return patterns
    .filter((pattern) => pattern.multiplicity === 'REPEATED_OBSERVATION')
    .map((pattern) => baseCandidate(
      sourceProject,
      profileCode,
      'CUT_TUPLE',
      pattern.key,
      pattern.count,
      null,
    ))
}

function exactOperationCandidates(
  sourceProject: string,
  profileCode: string,
  patterns: readonly ExactOperationObservationFrequency[],
): ProductionPatternCandidate[] {
  return patterns
    .filter((pattern) => pattern.multiplicity === 'REPEATED_OBSERVATION')
    .map((pattern) => baseCandidate(
      sourceProject,
      profileCode,
      'EXACT_OPERATION',
      pattern.fingerprint,
      pattern.count,
      pattern.operationName,
    ))
}

export function buildProductionPatternCandidateSet(
  aggregation: SkyGlazingObservationAggregation,
  sourceProject: string,
): ProductionPatternCandidateSet {
  const candidates = aggregation.profiles.flatMap((profile) => [
    ...cutTupleCandidates(sourceProject, profile.profileCode, profile.cutTuplePatterns),
    ...exactOperationCandidates(sourceProject, profile.profileCode, profile.exactOperationPatterns),
  ])

  return Object.freeze({
    sourceProject,
    candidateCount: candidates.length,
    cutTupleCandidateCount: candidates.filter((candidate) => candidate.kind === 'CUT_TUPLE').length,
    exactOperationCandidateCount: candidates.filter((candidate) => candidate.kind === 'EXACT_OPERATION').length,
    candidates: Object.freeze(candidates),
    singleProjectOnly: true,
    crossProjectCorroborated: false,
    automaticRulePromotionAllowed: false,
    productionRuleCreated: false,
    machineReady: false,
    productionApproved: false,
  })
}

export function reviewProductionPatternCandidate(
  candidate: ProductionPatternCandidate,
  decision: ProductionPatternCandidateReviewDecision,
  reviewer: string,
  reviewedAt: string,
  reviewNote = '',
): ProductionPatternCandidateReviewAttempt {
  const reasons: ProductionPatternCandidateReviewReason[] = []
  if (candidate.reviewStatus !== 'NOT_REVIEWED') reasons.push('CANDIDATE_ALREADY_REVIEWED')
  if (!reviewer.trim()) reasons.push('REVIEWER_REQUIRED')
  if (!reviewedAt.trim()) reasons.push('REVIEW_TIMESTAMP_REQUIRED')

  if (reasons.length > 0) {
    return Object.freeze({
      status: 'NOT_RECORDED',
      reasons: Object.freeze(reasons),
      candidate,
    })
  }

  const confirmed = decision === 'CONFIRM_CANDIDATE'
  const reviewedCandidate: ProductionPatternCandidate = Object.freeze({
    ...candidate,
    reviewStatus: confirmed ? 'CONFIRMED_AS_CANDIDATE' : 'REJECTED_AS_CANDIDATE',
    reviewer: reviewer.trim(),
    reviewedAt,
    reviewNote: reviewNote.trim(),
    humanConfirmedAsCandidate: confirmed,
    humanRejectedAsCandidate: !confirmed,
    candidateIsProductionRule: false,
    universalRuleInferenceAllowed: false,
    productionRuleCreated: false,
    machineReady: false,
    productionApproved: false,
  })

  return Object.freeze({
    status: 'RECORDED',
    reasons: Object.freeze([]),
    candidate: reviewedCandidate,
  })
}
