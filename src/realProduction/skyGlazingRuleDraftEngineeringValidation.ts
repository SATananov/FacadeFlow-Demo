import type {
  CrossProjectPromotionGateAssessment,
} from './skyGlazingCrossProjectPromotionGate'
import {
  assessHumanPromotionReviewRecord,
  promotionGateEvidenceFingerprint,
  type HumanPromotionReviewRecord,
  type NonExecutableRuleDraftArtifact,
} from './skyGlazingHumanPromotionReview'

export const RULE_DRAFT_ENGINEERING_VALIDATION_RECORD =
  'RULE_DRAFT_ENGINEERING_VALIDATION_RECORD' as const
export const RP01_8_RULE_DRAFT_FINGERPRINT_VERSION =
  'RP01.8-RULE-DRAFT-V1' as const

export type RuleDraftEngineeringValidationDecision =
  | 'VALIDATED_FOR_ENGINEERING_CONTEXT'
  | 'REJECTED_FOR_ENGINEERING_CONTEXT'

export type RuleDraftEngineeringValidationRecordState =
  | 'CURRENT'
  | 'STALE_REQUIRES_REVIEW'

export type RuleDraftEngineeringValidationFailureReason =
  | 'DRAFT_NOT_NON_EXECUTABLE'
  | 'DRAFT_SOURCE_LINK_MISMATCH'
  | 'SOURCE_PROMOTION_REVIEW_NOT_CURRENT'
  | 'SOURCE_PROMOTION_REVIEW_NOT_APPROVED'
  | 'VALIDATOR_REQUIRED'
  | 'VALIDATION_TIMESTAMP_REQUIRED'
  | 'ENGINEERING_CONTEXT_REQUIRED'
  | 'RATIONALE_REQUIRED'
  | 'CURRENT_DRAFT_VALIDATION_ALREADY_RECORDED'

export type RuleDraftEngineeringValidationInvalidationReason =
  | 'DRAFT_OR_SOURCE_EVIDENCE_CHANGED'
  | 'DRAFT_SOURCE_LINK_CHANGED'
  | 'SOURCE_PROMOTION_REVIEW_CHANGED_OR_STALE'
  | 'DRAFT_NO_LONGER_NON_EXECUTABLE'

export interface RuleDraftEngineeringEvidenceFingerprint {
  version: typeof RP01_8_RULE_DRAFT_FINGERPRINT_VERSION
  value: string
}

export interface RuleDraftEngineeringValidationRecord {
  id: string
  recordType: typeof RULE_DRAFT_ENGINEERING_VALIDATION_RECORD
  draftArtifactId: string
  promotionReviewRecordId: string
  promotionGateAssessmentId: string
  corroborationId: string
  profileCode: string
  candidateKind: NonExecutableRuleDraftArtifact['candidateKind']
  sourcePatternKey: string
  operationName: string | null
  decision: RuleDraftEngineeringValidationDecision
  validator: string
  validatedAt: string
  engineeringContext: string
  rationale: string
  draftFingerprint: RuleDraftEngineeringEvidenceFingerprint
  validationScope: 'ENGINEERING_CONTEXT_ONLY'
  humanEngineeringDecisionRecorded: true
  draftValidatedForEngineeringContext: boolean
  draftRejectedForEngineeringContext: boolean
  engineeringRuleValidated: false
  executableRuleCreated: false
  automaticRulePromotionAllowed: false
  productionRuleCreated: false
  productionUnlockAllowed: false
  machineInstructionGenerated: false
  machineReady: false
  productionApproved: false
}

export interface RuleDraftEngineeringValidationRecordAssessment {
  recordId: string
  state: RuleDraftEngineeringValidationRecordState
  reasons: readonly RuleDraftEngineeringValidationInvalidationReason[]
  currentDraftFingerprint: RuleDraftEngineeringEvidenceFingerprint
  decisionCurrentlyUsableForFurtherReviewBoundary: boolean
  engineeringRuleValidated: false
  executableRuleCreated: false
  productionRuleCreated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

export interface RecordRuleDraftEngineeringValidationResult {
  status: 'RECORDED' | 'NOT_RECORDED'
  reasons: readonly RuleDraftEngineeringValidationFailureReason[]
  record: RuleDraftEngineeringValidationRecord | null
}

function draftIsNonExecutable(draft: NonExecutableRuleDraftArtifact): boolean {
  return (
    draft.artifactType === 'NON_EXECUTABLE_RULE_DRAFT'
    && draft.draftStatus === 'DRAFT_ONLY'
    && draft.executable === false
    && draft.machineInstructionGenerated === false
    && draft.productionRuleCreated === false
    && draft.productionUnlockAllowed === false
    && draft.machineReady === false
    && draft.productionApproved === false
  )
}

function draftSourceLinksMatch(
  draft: NonExecutableRuleDraftArtifact,
  promotionReview: HumanPromotionReviewRecord,
  currentGate: CrossProjectPromotionGateAssessment,
): boolean {
  return (
    draft.promotionReviewRecordId === promotionReview.id
    && draft.promotionGateAssessmentId === currentGate.id
    && draft.corroborationId === currentGate.corroborationId
    && draft.profileCode === currentGate.profileCode
    && draft.candidateKind === currentGate.candidateKind
    && draft.sourcePatternKey === currentGate.sourcePatternKey
    && draft.operationName === currentGate.operationName
    && promotionReview.promotionGateAssessmentId === currentGate.id
    && promotionReview.corroborationId === currentGate.corroborationId
    && promotionReview.profileCode === currentGate.profileCode
    && promotionReview.candidateKind === currentGate.candidateKind
    && promotionReview.sourcePatternKey === currentGate.sourcePatternKey
    && promotionReview.operationName === currentGate.operationName
  )
}

export function ruleDraftEngineeringEvidenceFingerprint(
  draft: NonExecutableRuleDraftArtifact,
  promotionReview: HumanPromotionReviewRecord,
  currentGate: CrossProjectPromotionGateAssessment,
): RuleDraftEngineeringEvidenceFingerprint {
  const value = JSON.stringify({
    version: RP01_8_RULE_DRAFT_FINGERPRINT_VERSION,
    draftArtifactId: draft.id,
    artifactType: draft.artifactType,
    draftStatus: draft.draftStatus,
    promotionReviewRecordId: draft.promotionReviewRecordId,
    promotionGateAssessmentId: draft.promotionGateAssessmentId,
    corroborationId: draft.corroborationId,
    profileCode: draft.profileCode,
    candidateKind: draft.candidateKind,
    sourcePatternKey: draft.sourcePatternKey,
    operationName: draft.operationName,
    title: draft.title,
    proposedRuleStatement: draft.proposedRuleStatement,
    createdAt: draft.createdAt,
    sourcePromotionDecision: draft.sourcePromotionDecision,
    explicitStatementInputRequired: draft.explicitStatementInputRequired,
    automaticRuleDerivationPerformed: draft.automaticRuleDerivationPerformed,
    executable: draft.executable,
    machineInstructionGenerated: draft.machineInstructionGenerated,
    promotionReviewId: promotionReview.id,
    promotionReviewDecision: promotionReview.decision,
    promotionReviewGateFingerprint: promotionReview.gateFingerprint.value,
    currentPromotionGateFingerprint:
      promotionGateEvidenceFingerprint(currentGate).value,
  })

  return Object.freeze({
    version: RP01_8_RULE_DRAFT_FINGERPRINT_VERSION,
    value,
  })
}

function validationRecordId(
  draft: NonExecutableRuleDraftArtifact,
  validatedAt: string,
  validator: string,
): string {
  return [
    'rp01-8-validation',
    encodeURIComponent(draft.id),
    encodeURIComponent(validatedAt),
    encodeURIComponent(validator.trim()),
  ].join(':')
}

export function assessRuleDraftEngineeringValidationRecord(
  record: RuleDraftEngineeringValidationRecord,
  currentDraft: NonExecutableRuleDraftArtifact,
  promotionReview: HumanPromotionReviewRecord,
  currentGate: CrossProjectPromotionGateAssessment,
): RuleDraftEngineeringValidationRecordAssessment {
  const currentDraftFingerprint = ruleDraftEngineeringEvidenceFingerprint(
    currentDraft,
    promotionReview,
    currentGate,
  )
  const reasons: RuleDraftEngineeringValidationInvalidationReason[] = []
  const promotionReviewAssessment =
    assessHumanPromotionReviewRecord(promotionReview, currentGate)

  if (
    !draftSourceLinksMatch(currentDraft, promotionReview, currentGate)
    || currentDraft.id !== record.draftArtifactId
    || promotionReview.id !== record.promotionReviewRecordId
    || currentGate.id !== record.promotionGateAssessmentId
  ) {
    reasons.push('DRAFT_SOURCE_LINK_CHANGED')
  }

  if (currentDraftFingerprint.value !== record.draftFingerprint.value) {
    reasons.push('DRAFT_OR_SOURCE_EVIDENCE_CHANGED')
  }

  if (
    promotionReviewAssessment.state !== 'CURRENT'
    || promotionReview.decision !== 'APPROVED_FOR_RULE_DRAFT'
  ) {
    reasons.push('SOURCE_PROMOTION_REVIEW_CHANGED_OR_STALE')
  }

  if (!draftIsNonExecutable(currentDraft)) {
    reasons.push('DRAFT_NO_LONGER_NON_EXECUTABLE')
  }

  const state: RuleDraftEngineeringValidationRecordState =
    reasons.length === 0 ? 'CURRENT' : 'STALE_REQUIRES_REVIEW'

  return Object.freeze({
    recordId: record.id,
    state,
    reasons: Object.freeze(reasons),
    currentDraftFingerprint,
    decisionCurrentlyUsableForFurtherReviewBoundary:
      state === 'CURRENT'
      && record.decision === 'VALIDATED_FOR_ENGINEERING_CONTEXT',
    engineeringRuleValidated: false,
    executableRuleCreated: false,
    productionRuleCreated: false,
    productionUnlockAllowed: false,
    machineReady: false,
    productionApproved: false,
  })
}

export function recordRuleDraftEngineeringValidation(
  existingRecords: readonly RuleDraftEngineeringValidationRecord[],
  draft: NonExecutableRuleDraftArtifact,
  promotionReview: HumanPromotionReviewRecord,
  currentGate: CrossProjectPromotionGateAssessment,
  decision: RuleDraftEngineeringValidationDecision,
  validator: string,
  validatedAt: string,
  engineeringContext: string,
  rationale: string,
): RecordRuleDraftEngineeringValidationResult {
  const reasons: RuleDraftEngineeringValidationFailureReason[] = []
  const draftFingerprint = ruleDraftEngineeringEvidenceFingerprint(
    draft,
    promotionReview,
    currentGate,
  )
  const promotionReviewAssessment =
    assessHumanPromotionReviewRecord(promotionReview, currentGate)

  if (!draftIsNonExecutable(draft)) {
    reasons.push('DRAFT_NOT_NON_EXECUTABLE')
  }

  if (!draftSourceLinksMatch(draft, promotionReview, currentGate)) {
    reasons.push('DRAFT_SOURCE_LINK_MISMATCH')
  }

  if (promotionReviewAssessment.state !== 'CURRENT') {
    reasons.push('SOURCE_PROMOTION_REVIEW_NOT_CURRENT')
  }

  if (promotionReview.decision !== 'APPROVED_FOR_RULE_DRAFT') {
    reasons.push('SOURCE_PROMOTION_REVIEW_NOT_APPROVED')
  }

  if (!validator.trim()) reasons.push('VALIDATOR_REQUIRED')
  if (!validatedAt.trim()) reasons.push('VALIDATION_TIMESTAMP_REQUIRED')
  if (!engineeringContext.trim()) reasons.push('ENGINEERING_CONTEXT_REQUIRED')
  if (!rationale.trim()) reasons.push('RATIONALE_REQUIRED')

  const duplicateCurrentValidation = existingRecords.some((record) =>
    record.draftArtifactId === draft.id
    && record.draftFingerprint.value === draftFingerprint.value,
  )
  if (duplicateCurrentValidation) {
    reasons.push('CURRENT_DRAFT_VALIDATION_ALREADY_RECORDED')
  }

  if (reasons.length > 0) {
    return Object.freeze({
      status: 'NOT_RECORDED',
      reasons: Object.freeze(reasons),
      record: null,
    })
  }

  const validated = decision === 'VALIDATED_FOR_ENGINEERING_CONTEXT'
  const record: RuleDraftEngineeringValidationRecord = Object.freeze({
    id: validationRecordId(draft, validatedAt, validator),
    recordType: RULE_DRAFT_ENGINEERING_VALIDATION_RECORD,
    draftArtifactId: draft.id,
    promotionReviewRecordId: promotionReview.id,
    promotionGateAssessmentId: currentGate.id,
    corroborationId: currentGate.corroborationId,
    profileCode: draft.profileCode,
    candidateKind: draft.candidateKind,
    sourcePatternKey: draft.sourcePatternKey,
    operationName: draft.operationName,
    decision,
    validator: validator.trim(),
    validatedAt,
    engineeringContext: engineeringContext.trim(),
    rationale: rationale.trim(),
    draftFingerprint,
    validationScope: 'ENGINEERING_CONTEXT_ONLY',
    humanEngineeringDecisionRecorded: true,
    draftValidatedForEngineeringContext: validated,
    draftRejectedForEngineeringContext: !validated,
    engineeringRuleValidated: false,
    executableRuleCreated: false,
    automaticRulePromotionAllowed: false,
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
