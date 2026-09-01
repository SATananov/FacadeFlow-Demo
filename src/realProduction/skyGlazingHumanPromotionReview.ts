import type {
  CrossProjectPromotionGateAssessment,
} from './skyGlazingCrossProjectPromotionGate'

export const HUMAN_PROMOTION_REVIEW_RECORD =
  'HUMAN_PROMOTION_REVIEW_RECORD' as const
export const NON_EXECUTABLE_RULE_DRAFT =
  'NON_EXECUTABLE_RULE_DRAFT' as const
export const RP01_7_PROMOTION_GATE_FINGERPRINT_VERSION =
  'RP01.7-PROMOTION-GATE-V1' as const

export type HumanPromotionReviewDecision =
  | 'APPROVED_FOR_RULE_DRAFT'
  | 'REJECTED_FOR_RULE_DRAFT'

export type HumanPromotionReviewRecordState =
  | 'CURRENT'
  | 'STALE_REQUIRES_REVIEW'

export type HumanPromotionReviewRecordFailureReason =
  | 'PROMOTION_GATE_NOT_ELIGIBLE'
  | 'REVIEWER_REQUIRED'
  | 'REVIEW_TIMESTAMP_REQUIRED'
  | 'RATIONALE_REQUIRED'
  | 'CURRENT_PROMOTION_REVIEW_ALREADY_RECORDED'

export type HumanPromotionReviewInvalidationReason =
  | 'PROMOTION_GATE_CHANGED'
  | 'PROMOTION_GATE_NO_LONGER_ELIGIBLE'

export type NonExecutableRuleDraftFailureReason =
  | 'PROMOTION_REVIEW_NOT_CURRENT'
  | 'PROMOTION_REVIEW_NOT_APPROVED_FOR_RULE_DRAFT'
  | 'DRAFT_TITLE_REQUIRED'
  | 'PROPOSED_RULE_STATEMENT_REQUIRED'
  | 'DRAFT_TIMESTAMP_REQUIRED'

export interface PromotionGateEvidenceFingerprint {
  version: typeof RP01_7_PROMOTION_GATE_FINGERPRINT_VERSION
  value: string
}

export interface HumanPromotionReviewRecord {
  id: string
  recordType: typeof HUMAN_PROMOTION_REVIEW_RECORD
  promotionGateAssessmentId: string
  corroborationId: string
  profileCode: string
  candidateKind: CrossProjectPromotionGateAssessment['candidateKind']
  sourcePatternKey: string
  operationName: string | null
  decision: HumanPromotionReviewDecision
  reviewer: string
  reviewedAt: string
  rationale: string
  gateFingerprint: PromotionGateEvidenceFingerprint
  humanPromotionReviewCompleted: true
  ruleDraftAllowed: boolean
  engineeringRuleValidated: false
  automaticRulePromotionAllowed: false
  productionRuleCreated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

export interface HumanPromotionReviewRecordAssessment {
  recordId: string
  state: HumanPromotionReviewRecordState
  reasons: readonly HumanPromotionReviewInvalidationReason[]
  currentGateFingerprint: PromotionGateEvidenceFingerprint
  decisionCurrentlyUsableForRuleDraftBoundary: boolean
  engineeringRuleValidated: false
  productionRuleCreated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

export interface RecordHumanPromotionReviewResult {
  status: 'RECORDED' | 'NOT_RECORDED'
  reasons: readonly HumanPromotionReviewRecordFailureReason[]
  record: HumanPromotionReviewRecord | null
}

export interface NonExecutableRuleDraftArtifact {
  id: string
  artifactType: typeof NON_EXECUTABLE_RULE_DRAFT
  draftStatus: 'DRAFT_ONLY'
  promotionReviewRecordId: string
  promotionGateAssessmentId: string
  corroborationId: string
  profileCode: string
  candidateKind: CrossProjectPromotionGateAssessment['candidateKind']
  sourcePatternKey: string
  operationName: string | null
  title: string
  proposedRuleStatement: string
  createdAt: string
  sourcePromotionDecision: 'APPROVED_FOR_RULE_DRAFT'
  explicitStatementInputRequired: true
  automaticRuleDerivationPerformed: false
  executable: false
  machineInstructionGenerated: false
  ruleDraftCreated: true
  engineeringRuleValidated: false
  automaticRulePromotionAllowed: false
  productionRuleCreated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

export interface CreateNonExecutableRuleDraftResult {
  status: 'CREATED' | 'NOT_CREATED'
  reasons: readonly NonExecutableRuleDraftFailureReason[]
  artifact: NonExecutableRuleDraftArtifact | null
}

function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

export function promotionGateEvidenceFingerprint(
  gate: CrossProjectPromotionGateAssessment,
): PromotionGateEvidenceFingerprint {
  const projectQualifications = [...gate.projectQualifications]
    .map((project) => ({
      sourceProject: project.sourceProject,
      candidateIds: [...project.candidateIds].sort(compareText),
      currentCandidateCount: project.currentCandidateCount,
      currentConfirmedReviewCount: project.currentConfirmedReviewCount,
      currentRejectedReviewCount: project.currentRejectedReviewCount,
      staleReviewEntryCount: project.staleReviewEntryCount,
      currentConfirmedReviewPresent: project.currentConfirmedReviewPresent,
      currentRejectionPresent: project.currentRejectionPresent,
      qualifiedForHumanPromotionReview: project.qualifiedForHumanPromotionReview,
    }))
    .sort((a, b) => compareText(a.sourceProject, b.sourceProject))

  const value = JSON.stringify({
    version: RP01_7_PROMOTION_GATE_FINGERPRINT_VERSION,
    gateAssessmentId: gate.id,
    corroborationId: gate.corroborationId,
    profileCode: gate.profileCode,
    candidateKind: gate.candidateKind,
    sourcePatternKey: gate.sourcePatternKey,
    operationName: gate.operationName,
    corroborationState: gate.corroborationState,
    distinctProjectCount: gate.distinctProjectCount,
    sourceProjects: [...gate.sourceProjects].sort(compareText),
    projectQualifications,
    state: gate.state,
    reasons: [...gate.reasons].sort(compareText),
    allDistinctProjectsHaveCurrentConfirmedCandidateReview:
      gate.allDistinctProjectsHaveCurrentConfirmedCandidateReview,
    anyCurrentCandidateRejectionPresent:
      gate.anyCurrentCandidateRejectionPresent,
    humanPromotionReviewCanStart:
      gate.humanPromotionReviewCanStart,
  })

  return Object.freeze({
    version: RP01_7_PROMOTION_GATE_FINGERPRINT_VERSION,
    value,
  })
}

function promotionReviewRecordId(
  gate: CrossProjectPromotionGateAssessment,
  reviewedAt: string,
  reviewer: string,
): string {
  return [
    'rp01-7-review',
    encodeURIComponent(gate.id),
    encodeURIComponent(reviewedAt),
    encodeURIComponent(reviewer.trim()),
  ].join(':')
}

export function assessHumanPromotionReviewRecord(
  record: HumanPromotionReviewRecord,
  currentGate: CrossProjectPromotionGateAssessment,
): HumanPromotionReviewRecordAssessment {
  const currentGateFingerprint = promotionGateEvidenceFingerprint(currentGate)
  const reasons: HumanPromotionReviewInvalidationReason[] = []

  if (currentGateFingerprint.value !== record.gateFingerprint.value) {
    reasons.push('PROMOTION_GATE_CHANGED')
  }

  if (currentGate.state !== 'ELIGIBLE_FOR_HUMAN_PROMOTION_REVIEW') {
    reasons.push('PROMOTION_GATE_NO_LONGER_ELIGIBLE')
  }

  const state: HumanPromotionReviewRecordState =
    reasons.length === 0 ? 'CURRENT' : 'STALE_REQUIRES_REVIEW'

  return Object.freeze({
    recordId: record.id,
    state,
    reasons: Object.freeze(reasons),
    currentGateFingerprint,
    decisionCurrentlyUsableForRuleDraftBoundary:
      state === 'CURRENT' && record.decision === 'APPROVED_FOR_RULE_DRAFT',
    engineeringRuleValidated: false,
    productionRuleCreated: false,
    productionUnlockAllowed: false,
    machineReady: false,
    productionApproved: false,
  })
}

export function recordHumanPromotionReview(
  existingRecords: readonly HumanPromotionReviewRecord[],
  gate: CrossProjectPromotionGateAssessment,
  decision: HumanPromotionReviewDecision,
  reviewer: string,
  reviewedAt: string,
  rationale: string,
): RecordHumanPromotionReviewResult {
  const reasons: HumanPromotionReviewRecordFailureReason[] = []
  const gateFingerprint = promotionGateEvidenceFingerprint(gate)

  if (gate.state !== 'ELIGIBLE_FOR_HUMAN_PROMOTION_REVIEW') {
    reasons.push('PROMOTION_GATE_NOT_ELIGIBLE')
  }
  if (!reviewer.trim()) reasons.push('REVIEWER_REQUIRED')
  if (!reviewedAt.trim()) reasons.push('REVIEW_TIMESTAMP_REQUIRED')
  if (!rationale.trim()) reasons.push('RATIONALE_REQUIRED')

  const duplicateCurrentReview = existingRecords.some((record) =>
    record.promotionGateAssessmentId === gate.id
    && record.gateFingerprint.value === gateFingerprint.value,
  )
  if (duplicateCurrentReview) {
    reasons.push('CURRENT_PROMOTION_REVIEW_ALREADY_RECORDED')
  }

  if (reasons.length > 0) {
    return Object.freeze({
      status: 'NOT_RECORDED',
      reasons: Object.freeze(reasons),
      record: null,
    })
  }

  const record: HumanPromotionReviewRecord = Object.freeze({
    id: promotionReviewRecordId(gate, reviewedAt, reviewer),
    recordType: HUMAN_PROMOTION_REVIEW_RECORD,
    promotionGateAssessmentId: gate.id,
    corroborationId: gate.corroborationId,
    profileCode: gate.profileCode,
    candidateKind: gate.candidateKind,
    sourcePatternKey: gate.sourcePatternKey,
    operationName: gate.operationName,
    decision,
    reviewer: reviewer.trim(),
    reviewedAt,
    rationale: rationale.trim(),
    gateFingerprint,
    humanPromotionReviewCompleted: true,
    ruleDraftAllowed: decision === 'APPROVED_FOR_RULE_DRAFT',
    engineeringRuleValidated: false,
    automaticRulePromotionAllowed: false,
    productionRuleCreated: false,
    productionUnlockAllowed: false,
    machineReady: false,
    productionApproved: false,
  })

  return Object.freeze({
    status: 'RECORDED',
    reasons: Object.freeze([]),
    record,
  })
}

export function createNonExecutableRuleDraft(
  reviewRecord: HumanPromotionReviewRecord,
  currentGate: CrossProjectPromotionGateAssessment,
  title: string,
  proposedRuleStatement: string,
  createdAt: string,
): CreateNonExecutableRuleDraftResult {
  const reasons: NonExecutableRuleDraftFailureReason[] = []
  const reviewAssessment = assessHumanPromotionReviewRecord(reviewRecord, currentGate)

  if (reviewAssessment.state !== 'CURRENT') {
    reasons.push('PROMOTION_REVIEW_NOT_CURRENT')
  }
  if (reviewRecord.decision !== 'APPROVED_FOR_RULE_DRAFT') {
    reasons.push('PROMOTION_REVIEW_NOT_APPROVED_FOR_RULE_DRAFT')
  }
  if (!title.trim()) reasons.push('DRAFT_TITLE_REQUIRED')
  if (!proposedRuleStatement.trim()) reasons.push('PROPOSED_RULE_STATEMENT_REQUIRED')
  if (!createdAt.trim()) reasons.push('DRAFT_TIMESTAMP_REQUIRED')

  if (reasons.length > 0) {
    return Object.freeze({
      status: 'NOT_CREATED',
      reasons: Object.freeze(reasons),
      artifact: null,
    })
  }

  const artifact: NonExecutableRuleDraftArtifact = Object.freeze({
    id: [
      'rp01-7-draft',
      encodeURIComponent(reviewRecord.id),
      encodeURIComponent(createdAt),
    ].join(':'),
    artifactType: NON_EXECUTABLE_RULE_DRAFT,
    draftStatus: 'DRAFT_ONLY',
    promotionReviewRecordId: reviewRecord.id,
    promotionGateAssessmentId: currentGate.id,
    corroborationId: currentGate.corroborationId,
    profileCode: currentGate.profileCode,
    candidateKind: currentGate.candidateKind,
    sourcePatternKey: currentGate.sourcePatternKey,
    operationName: currentGate.operationName,
    title: title.trim(),
    proposedRuleStatement: proposedRuleStatement.trim(),
    createdAt,
    sourcePromotionDecision: 'APPROVED_FOR_RULE_DRAFT',
    explicitStatementInputRequired: true,
    automaticRuleDerivationPerformed: false,
    executable: false,
    machineInstructionGenerated: false,
    ruleDraftCreated: true,
    engineeringRuleValidated: false,
    automaticRulePromotionAllowed: false,
    productionRuleCreated: false,
    productionUnlockAllowed: false,
    machineReady: false,
    productionApproved: false,
  })

  return Object.freeze({
    status: 'CREATED',
    reasons: Object.freeze([]),
    artifact,
  })
}
