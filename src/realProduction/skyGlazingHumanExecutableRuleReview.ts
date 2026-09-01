import type {
  CrossProjectPromotionGateAssessment,
} from './skyGlazingCrossProjectPromotionGate'
import type {
  HumanPromotionReviewRecord,
  NonExecutableRuleDraftArtifact,
} from './skyGlazingHumanPromotionReview'
import type {
  RuleDraftEngineeringValidationRecord,
} from './skyGlazingRuleDraftEngineeringValidation'
import {
  assessExecutableRuleReviewGate,
  engineeringValidationClosureFingerprint,
  type ExecutableRuleReviewGateAssessment,
} from './skyGlazingExecutableRuleReviewGate'

export const HUMAN_EXECUTABLE_RULE_REVIEW_RECORD =
  'HUMAN_EXECUTABLE_RULE_REVIEW_RECORD' as const
export const NON_PRODUCTION_EXECUTABLE_RULE_DRAFT =
  'NON_PRODUCTION_EXECUTABLE_RULE_DRAFT' as const
export const RP01_10_EXECUTABLE_REVIEW_FINGERPRINT_VERSION =
  'RP01.10-EXECUTABLE-REVIEW-V1' as const

export type HumanExecutableRuleReviewDecision =
  | 'APPROVED_FOR_NON_PRODUCTION_EXECUTABLE_DRAFT'
  | 'REJECTED_FOR_NON_PRODUCTION_EXECUTABLE_DRAFT'

export type HumanExecutableRuleReviewRecordState =
  | 'CURRENT'
  | 'STALE_REQUIRES_REVIEW'

export type HumanExecutableRuleReviewRecordFailureReason =
  | 'EXECUTABLE_RULE_REVIEW_GATE_NOT_ELIGIBLE'
  | 'REVIEWER_REQUIRED'
  | 'REVIEW_TIMESTAMP_REQUIRED'
  | 'EXECUTION_CONTEXT_REQUIRED'
  | 'RATIONALE_REQUIRED'
  | 'CURRENT_EXECUTABLE_REVIEW_ALREADY_RECORDED'

export type HumanExecutableRuleReviewInvalidationReason =
  | 'EXECUTABLE_RULE_REVIEW_GATE_CHANGED'
  | 'EXECUTABLE_RULE_REVIEW_GATE_NO_LONGER_ELIGIBLE'

export type NonProductionExecutableDraftFailureReason =
  | 'EXECUTABLE_REVIEW_NOT_CURRENT'
  | 'EXECUTABLE_REVIEW_NOT_APPROVED'
  | 'DRAFT_TITLE_REQUIRED'
  | 'EXECUTABLE_EXPRESSION_REQUIRED'
  | 'EXECUTION_CONTEXT_REQUIRED'
  | 'DRAFT_TIMESTAMP_REQUIRED'

export interface ExecutableRuleReviewEvidenceFingerprint {
  version: typeof RP01_10_EXECUTABLE_REVIEW_FINGERPRINT_VERSION
  value: string
}

export interface HumanExecutableRuleReviewRecord {
  id: string
  recordType: typeof HUMAN_EXECUTABLE_RULE_REVIEW_RECORD
  executableRuleReviewGateId: string
  engineeringValidationRecordId: string
  draftArtifactId: string
  promotionReviewRecordId: string
  promotionGateAssessmentId: string
  corroborationId: string
  profileCode: string
  candidateKind: NonExecutableRuleDraftArtifact['candidateKind']
  sourcePatternKey: string
  operationName: string | null
  decision: HumanExecutableRuleReviewDecision
  reviewer: string
  reviewedAt: string
  executionContext: string
  rationale: string
  gateFingerprint: ExecutableRuleReviewEvidenceFingerprint
  humanExecutableRuleReviewCompleted: true
  nonProductionExecutableDraftAllowed: boolean
  productionExecutableRuleAllowed: false
  engineeringRuleValidated: false
  productionRuleCreated: false
  productionUnlockAllowed: false
  machineInstructionGenerated: false
  machineReady: false
  productionApproved: false
}

export interface HumanExecutableRuleReviewAssessment {
  recordId: string
  state: HumanExecutableRuleReviewRecordState
  reasons: readonly HumanExecutableRuleReviewInvalidationReason[]
  currentGateFingerprint: ExecutableRuleReviewEvidenceFingerprint
  decisionCurrentlyUsableForNonProductionExecutableDraft: boolean
  productionExecutableRuleAllowed: false
  productionRuleCreated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

export interface RecordHumanExecutableRuleReviewResult {
  status: 'RECORDED' | 'NOT_RECORDED'
  reasons: readonly HumanExecutableRuleReviewRecordFailureReason[]
  record: HumanExecutableRuleReviewRecord | null
}

export interface NonProductionExecutableRuleDraftArtifact {
  id: string
  artifactType: typeof NON_PRODUCTION_EXECUTABLE_RULE_DRAFT
  artifactStatus: 'SIMULATION_ONLY_EXECUTABLE_DRAFT'
  humanExecutableRuleReviewRecordId: string
  executableRuleReviewGateId: string
  engineeringValidationRecordId: string
  sourceDraftArtifactId: string
  promotionReviewRecordId: string
  promotionGateAssessmentId: string
  corroborationId: string
  profileCode: string
  candidateKind: NonExecutableRuleDraftArtifact['candidateKind']
  sourcePatternKey: string
  operationName: string | null
  title: string
  executableExpression: string
  executionContext: string
  createdAt: string
  sourceExecutableReviewDecision:
    'APPROVED_FOR_NON_PRODUCTION_EXECUTABLE_DRAFT'
  simulationExecutable: true
  productionExecutable: false
  machineInstructionGenerated: false
  automaticMachineTranslationAllowed: false
  automaticRulePromotionAllowed: false
  productionRuleCreated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

export interface CreateNonProductionExecutableDraftResult {
  status: 'CREATED' | 'NOT_CREATED'
  reasons: readonly NonProductionExecutableDraftFailureReason[]
  artifact: NonProductionExecutableRuleDraftArtifact | null
}

export function executableRuleReviewEvidenceFingerprint(
  executableReviewGate: ExecutableRuleReviewGateAssessment,
  engineeringValidation: RuleDraftEngineeringValidationRecord,
  sourceDraft: NonExecutableRuleDraftArtifact,
  promotionReview: HumanPromotionReviewRecord,
  currentPromotionGate: CrossProjectPromotionGateAssessment,
): ExecutableRuleReviewEvidenceFingerprint {
  const closureFingerprint = engineeringValidationClosureFingerprint(
    engineeringValidation,
    sourceDraft,
    promotionReview,
    currentPromotionGate,
  )

  const value = JSON.stringify({
    version: RP01_10_EXECUTABLE_REVIEW_FINGERPRINT_VERSION,
    executableRuleReviewGateId: executableReviewGate.id,
    executableRuleReviewGateState: executableReviewGate.state,
    executableRuleReviewGateReasons: [...executableReviewGate.reasons],
    executableRuleReviewCanStart:
      executableReviewGate.executableRuleReviewCanStart,
    engineeringValidationRecordId: engineeringValidation.id,
    sourceDraftArtifactId: sourceDraft.id,
    promotionReviewRecordId: promotionReview.id,
    promotionGateAssessmentId: currentPromotionGate.id,
    corroborationId: currentPromotionGate.corroborationId,
    profileCode: sourceDraft.profileCode,
    candidateKind: sourceDraft.candidateKind,
    sourcePatternKey: sourceDraft.sourcePatternKey,
    operationName: sourceDraft.operationName,
    storedGateClosureFingerprint:
      executableReviewGate.closureFingerprint.value,
    currentClosureFingerprint: closureFingerprint.value,
  })

  return Object.freeze({
    version: RP01_10_EXECUTABLE_REVIEW_FINGERPRINT_VERSION,
    value,
  })
}

function reviewRecordId(
  executableReviewGate: ExecutableRuleReviewGateAssessment,
  reviewedAt: string,
  reviewer: string,
): string {
  return [
    'rp01-10-review',
    encodeURIComponent(executableReviewGate.id),
    encodeURIComponent(reviewedAt),
    encodeURIComponent(reviewer.trim()),
  ].join(':')
}

export function assessHumanExecutableRuleReviewRecord(
  record: HumanExecutableRuleReviewRecord,
  currentExecutableReviewGate: ExecutableRuleReviewGateAssessment,
  engineeringValidation: RuleDraftEngineeringValidationRecord,
  sourceDraft: NonExecutableRuleDraftArtifact,
  promotionReview: HumanPromotionReviewRecord,
  currentPromotionGate: CrossProjectPromotionGateAssessment,
): HumanExecutableRuleReviewAssessment {
  const currentGateFingerprint = executableRuleReviewEvidenceFingerprint(
    currentExecutableReviewGate,
    engineeringValidation,
    sourceDraft,
    promotionReview,
    currentPromotionGate,
  )
  const reasons: HumanExecutableRuleReviewInvalidationReason[] = []

  if (currentGateFingerprint.value !== record.gateFingerprint.value) {
    reasons.push('EXECUTABLE_RULE_REVIEW_GATE_CHANGED')
  }

  if (
    currentExecutableReviewGate.state !==
      'ELIGIBLE_FOR_EXECUTABLE_RULE_REVIEW'
    || !currentExecutableReviewGate.executableRuleReviewCanStart
  ) {
    reasons.push('EXECUTABLE_RULE_REVIEW_GATE_NO_LONGER_ELIGIBLE')
  }

  const state: HumanExecutableRuleReviewRecordState =
    reasons.length === 0 ? 'CURRENT' : 'STALE_REQUIRES_REVIEW'

  return Object.freeze({
    recordId: record.id,
    state,
    reasons: Object.freeze(reasons),
    currentGateFingerprint,
    decisionCurrentlyUsableForNonProductionExecutableDraft:
      state === 'CURRENT'
      && record.decision ===
        'APPROVED_FOR_NON_PRODUCTION_EXECUTABLE_DRAFT',
    productionExecutableRuleAllowed: false,
    productionRuleCreated: false,
    productionUnlockAllowed: false,
    machineReady: false,
    productionApproved: false,
  })
}

export function recordHumanExecutableRuleReview(
  existingRecords: readonly HumanExecutableRuleReviewRecord[],
  executableReviewGate: ExecutableRuleReviewGateAssessment,
  engineeringValidation: RuleDraftEngineeringValidationRecord,
  sourceDraft: NonExecutableRuleDraftArtifact,
  promotionReview: HumanPromotionReviewRecord,
  currentPromotionGate: CrossProjectPromotionGateAssessment,
  decision: HumanExecutableRuleReviewDecision,
  reviewer: string,
  reviewedAt: string,
  executionContext: string,
  rationale: string,
): RecordHumanExecutableRuleReviewResult {
  const reasons: HumanExecutableRuleReviewRecordFailureReason[] = []
  const gateFingerprint = executableRuleReviewEvidenceFingerprint(
    executableReviewGate,
    engineeringValidation,
    sourceDraft,
    promotionReview,
    currentPromotionGate,
  )

  const currentGateAssessment = assessExecutableRuleReviewGate(
    engineeringValidation,
    sourceDraft,
    promotionReview,
    currentPromotionGate,
  )

  if (
    executableReviewGate.state !==
      'ELIGIBLE_FOR_EXECUTABLE_RULE_REVIEW'
    || !executableReviewGate.executableRuleReviewCanStart
    || currentGateAssessment.state !==
      'ELIGIBLE_FOR_EXECUTABLE_RULE_REVIEW'
    || currentGateAssessment.closureFingerprint.value !==
      executableReviewGate.closureFingerprint.value
  ) {
    reasons.push('EXECUTABLE_RULE_REVIEW_GATE_NOT_ELIGIBLE')
  }

  if (!reviewer.trim()) reasons.push('REVIEWER_REQUIRED')
  if (!reviewedAt.trim()) reasons.push('REVIEW_TIMESTAMP_REQUIRED')
  if (!executionContext.trim()) reasons.push('EXECUTION_CONTEXT_REQUIRED')
  if (!rationale.trim()) reasons.push('RATIONALE_REQUIRED')

  const duplicateCurrentReview = existingRecords.some((record) =>
    record.executableRuleReviewGateId === executableReviewGate.id
    && record.gateFingerprint.value === gateFingerprint.value,
  )
  if (duplicateCurrentReview) {
    reasons.push('CURRENT_EXECUTABLE_REVIEW_ALREADY_RECORDED')
  }

  if (reasons.length > 0) {
    return Object.freeze({
      status: 'NOT_RECORDED',
      reasons: Object.freeze(reasons),
      record: null,
    })
  }

  const approved =
    decision === 'APPROVED_FOR_NON_PRODUCTION_EXECUTABLE_DRAFT'

  const record: HumanExecutableRuleReviewRecord = Object.freeze({
    id: reviewRecordId(executableReviewGate, reviewedAt, reviewer),
    recordType: HUMAN_EXECUTABLE_RULE_REVIEW_RECORD,
    executableRuleReviewGateId: executableReviewGate.id,
    engineeringValidationRecordId: engineeringValidation.id,
    draftArtifactId: sourceDraft.id,
    promotionReviewRecordId: promotionReview.id,
    promotionGateAssessmentId: currentPromotionGate.id,
    corroborationId: currentPromotionGate.corroborationId,
    profileCode: sourceDraft.profileCode,
    candidateKind: sourceDraft.candidateKind,
    sourcePatternKey: sourceDraft.sourcePatternKey,
    operationName: sourceDraft.operationName,
    decision,
    reviewer: reviewer.trim(),
    reviewedAt,
    executionContext: executionContext.trim(),
    rationale: rationale.trim(),
    gateFingerprint,
    humanExecutableRuleReviewCompleted: true,
    nonProductionExecutableDraftAllowed: approved,
    productionExecutableRuleAllowed: false,
    engineeringRuleValidated: false,
    productionRuleCreated: false,
    productionUnlockAllowed: false,
    machineInstructionGenerated: false,
    machineReady: false,
    productionApproved: false,
  })

  return Object.freeze({
    status: 'RECORDED',
    reasons: Object.freeze([]),
    record,
  })
}

export function createNonProductionExecutableRuleDraft(
  executableReview: HumanExecutableRuleReviewRecord,
  currentExecutableReviewGate: ExecutableRuleReviewGateAssessment,
  engineeringValidation: RuleDraftEngineeringValidationRecord,
  sourceDraft: NonExecutableRuleDraftArtifact,
  promotionReview: HumanPromotionReviewRecord,
  currentPromotionGate: CrossProjectPromotionGateAssessment,
  title: string,
  executableExpression: string,
  executionContext: string,
  createdAt: string,
): CreateNonProductionExecutableDraftResult {
  const reasons: NonProductionExecutableDraftFailureReason[] = []

  const reviewAssessment = assessHumanExecutableRuleReviewRecord(
    executableReview,
    currentExecutableReviewGate,
    engineeringValidation,
    sourceDraft,
    promotionReview,
    currentPromotionGate,
  )

  if (reviewAssessment.state !== 'CURRENT') {
    reasons.push('EXECUTABLE_REVIEW_NOT_CURRENT')
  }

  if (
    executableReview.decision !==
    'APPROVED_FOR_NON_PRODUCTION_EXECUTABLE_DRAFT'
  ) {
    reasons.push('EXECUTABLE_REVIEW_NOT_APPROVED')
  }

  if (!title.trim()) reasons.push('DRAFT_TITLE_REQUIRED')
  if (!executableExpression.trim()) {
    reasons.push('EXECUTABLE_EXPRESSION_REQUIRED')
  }
  if (!executionContext.trim()) reasons.push('EXECUTION_CONTEXT_REQUIRED')
  if (!createdAt.trim()) reasons.push('DRAFT_TIMESTAMP_REQUIRED')

  if (reasons.length > 0) {
    return Object.freeze({
      status: 'NOT_CREATED',
      reasons: Object.freeze(reasons),
      artifact: null,
    })
  }

  const artifact: NonProductionExecutableRuleDraftArtifact = Object.freeze({
    id: [
      'rp01-10-executable-draft',
      encodeURIComponent(executableReview.id),
      encodeURIComponent(createdAt),
    ].join(':'),
    artifactType: NON_PRODUCTION_EXECUTABLE_RULE_DRAFT,
    artifactStatus: 'SIMULATION_ONLY_EXECUTABLE_DRAFT',
    humanExecutableRuleReviewRecordId: executableReview.id,
    executableRuleReviewGateId: currentExecutableReviewGate.id,
    engineeringValidationRecordId: engineeringValidation.id,
    sourceDraftArtifactId: sourceDraft.id,
    promotionReviewRecordId: promotionReview.id,
    promotionGateAssessmentId: currentPromotionGate.id,
    corroborationId: currentPromotionGate.corroborationId,
    profileCode: sourceDraft.profileCode,
    candidateKind: sourceDraft.candidateKind,
    sourcePatternKey: sourceDraft.sourcePatternKey,
    operationName: sourceDraft.operationName,
    title: title.trim(),
    executableExpression: executableExpression.trim(),
    executionContext: executionContext.trim(),
    createdAt,
    sourceExecutableReviewDecision:
      'APPROVED_FOR_NON_PRODUCTION_EXECUTABLE_DRAFT',
    simulationExecutable: true,
    productionExecutable: false,
    machineInstructionGenerated: false,
    automaticMachineTranslationAllowed: false,
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
