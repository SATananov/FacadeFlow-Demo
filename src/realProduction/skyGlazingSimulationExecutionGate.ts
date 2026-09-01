import type { CrossProjectPromotionGateAssessment } from './skyGlazingCrossProjectPromotionGate'
import type {
  HumanPromotionReviewRecord,
  NonExecutableRuleDraftArtifact,
} from './skyGlazingHumanPromotionReview'
import type { RuleDraftEngineeringValidationRecord } from './skyGlazingRuleDraftEngineeringValidation'
import type { ExecutableRuleReviewGateAssessment } from './skyGlazingExecutableRuleReviewGate'
import {
  assessHumanExecutableRuleReviewRecord,
  executableRuleReviewEvidenceFingerprint,
  type HumanExecutableRuleReviewRecord,
  type NonProductionExecutableRuleDraftArtifact,
} from './skyGlazingHumanExecutableRuleReview'

export const NON_PRODUCTION_EXECUTABLE_DRAFT_VALIDATION_RECORD =
  'NON_PRODUCTION_EXECUTABLE_DRAFT_VALIDATION_RECORD' as const
export const SIMULATION_EXECUTION_GATE = 'SIMULATION_EXECUTION_GATE' as const
export const RP01_11_EXECUTABLE_DRAFT_FINGERPRINT_VERSION =
  'RP01.11-EXECUTABLE-DRAFT-V1' as const

export type SimulationValidationDecision =
  | 'VALIDATED_FOR_SIMULATION_EXECUTION'
  | 'REJECTED_FOR_SIMULATION_EXECUTION'

export type SimulationValidationState =
  | 'CURRENT'
  | 'STALE_REQUIRES_REVIEW'

export type SimulationValidationFailureReason =
  | 'EXECUTABLE_DRAFT_NOT_SIMULATION_ONLY'
  | 'SOURCE_EXECUTABLE_REVIEW_NOT_CURRENT'
  | 'SOURCE_EXECUTABLE_REVIEW_NOT_APPROVED'
  | 'SOURCE_CHAIN_MISMATCH'
  | 'VALIDATOR_REQUIRED'
  | 'VALIDATION_TIMESTAMP_REQUIRED'
  | 'SIMULATION_CONTEXT_REQUIRED'
  | 'RATIONALE_REQUIRED'
  | 'CURRENT_SIMULATION_VALIDATION_ALREADY_RECORDED'

export type SimulationValidationInvalidationReason =
  | 'EXECUTABLE_DRAFT_OR_SOURCE_EVIDENCE_CHANGED'
  | 'SOURCE_EXECUTABLE_REVIEW_CHANGED_OR_STALE'
  | 'SOURCE_CHAIN_CHANGED'
  | 'EXECUTABLE_DRAFT_NO_LONGER_SIMULATION_ONLY'

export type SimulationExecutionGateState =
  | 'BLOCKED'
  | 'ELIGIBLE_FOR_LOCAL_SIMULATION_EXECUTION'

export type SimulationExecutionGateBlockReason =
  | 'SIMULATION_VALIDATION_NOT_CURRENT'
  | 'SIMULATION_EXECUTION_NOT_VALIDATED'
  | 'EXECUTABLE_DRAFT_NOT_SIMULATION_ONLY'
  | 'SOURCE_CHAIN_CHANGED'

export interface SimulationDraftEvidenceFingerprint {
  version: typeof RP01_11_EXECUTABLE_DRAFT_FINGERPRINT_VERSION
  value: string
}

export interface SimulationValidationRecord {
  id: string
  recordType: typeof NON_PRODUCTION_EXECUTABLE_DRAFT_VALIDATION_RECORD
  executableDraftArtifactId: string
  humanExecutableRuleReviewRecordId: string
  executableRuleReviewGateId: string
  engineeringValidationRecordId: string
  sourceDraftArtifactId: string
  promotionReviewRecordId: string
  promotionGateAssessmentId: string
  corroborationId: string
  profileCode: string
  candidateKind: NonProductionExecutableRuleDraftArtifact['candidateKind']
  sourcePatternKey: string
  operationName: string | null
  decision: SimulationValidationDecision
  validator: string
  validatedAt: string
  simulationContext: string
  rationale: string
  draftFingerprint: SimulationDraftEvidenceFingerprint
  validationScope: 'LOCAL_SIMULATION_ONLY'
  humanSimulationValidationRecorded: true
  simulationExecutionValidated: boolean
  simulationExecutionRejected: boolean
  productionExecutable: false
  machineInstructionGenerated: false
  automaticMachineTranslationAllowed: false
  productionRuleCreated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

export interface SimulationValidationAssessment {
  recordId: string
  state: SimulationValidationState
  reasons: readonly SimulationValidationInvalidationReason[]
  currentDraftFingerprint: SimulationDraftEvidenceFingerprint
  decisionCurrentlyUsableForSimulationExecutionGate: boolean
  productionExecutable: false
  productionRuleCreated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

export interface RecordSimulationValidationResult {
  status: 'RECORDED' | 'NOT_RECORDED'
  reasons: readonly SimulationValidationFailureReason[]
  record: SimulationValidationRecord | null
}

export interface SimulationExecutionGateAssessment {
  id: string
  gateType: typeof SIMULATION_EXECUTION_GATE
  validationRecordId: string
  executableDraftArtifactId: string
  humanExecutableRuleReviewRecordId: string
  executableRuleReviewGateId: string
  profileCode: string
  candidateKind: NonProductionExecutableRuleDraftArtifact['candidateKind']
  sourcePatternKey: string
  operationName: string | null
  simulationContext: string
  validationDecision: SimulationValidationDecision
  validationRecordState: SimulationValidationState
  state: SimulationExecutionGateState
  reasons: readonly SimulationExecutionGateBlockReason[]
  localSimulationExecutionCanStart: boolean
  localSimulationExecutionCompleted: false
  runtimeAdapterCreated: false
  productionExecutable: false
  machineInstructionGenerated: false
  automaticMachineTranslationAllowed: false
  productionRuleCreated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

function isSimulationOnlyDraft(
  draft: NonProductionExecutableRuleDraftArtifact,
): boolean {
  return (
    draft.artifactType === 'NON_PRODUCTION_EXECUTABLE_RULE_DRAFT'
    && draft.artifactStatus === 'SIMULATION_ONLY_EXECUTABLE_DRAFT'
    && draft.simulationExecutable === true
    && draft.productionExecutable === false
    && draft.machineInstructionGenerated === false
    && draft.automaticMachineTranslationAllowed === false
    && draft.automaticRulePromotionAllowed === false
    && draft.productionRuleCreated === false
    && draft.productionUnlockAllowed === false
    && draft.machineReady === false
    && draft.productionApproved === false
  )
}

function sourceChainMatches(
  draft: NonProductionExecutableRuleDraftArtifact,
  review: HumanExecutableRuleReviewRecord,
  reviewGate: ExecutableRuleReviewGateAssessment,
  engineeringValidation: RuleDraftEngineeringValidationRecord,
  sourceDraft: NonExecutableRuleDraftArtifact,
  promotionReview: HumanPromotionReviewRecord,
  promotionGate: CrossProjectPromotionGateAssessment,
): boolean {
  return (
    draft.humanExecutableRuleReviewRecordId === review.id
    && draft.executableRuleReviewGateId === reviewGate.id
    && draft.engineeringValidationRecordId === engineeringValidation.id
    && draft.sourceDraftArtifactId === sourceDraft.id
    && draft.promotionReviewRecordId === promotionReview.id
    && draft.promotionGateAssessmentId === promotionGate.id
    && draft.corroborationId === promotionGate.corroborationId
    && review.executableRuleReviewGateId === reviewGate.id
    && review.engineeringValidationRecordId === engineeringValidation.id
    && review.draftArtifactId === sourceDraft.id
    && review.promotionReviewRecordId === promotionReview.id
    && review.promotionGateAssessmentId === promotionGate.id
    && review.corroborationId === promotionGate.corroborationId
    && draft.profileCode === sourceDraft.profileCode
    && draft.candidateKind === sourceDraft.candidateKind
    && draft.sourcePatternKey === sourceDraft.sourcePatternKey
    && draft.operationName === sourceDraft.operationName
  )
}

export function simulationDraftEvidenceFingerprint(
  draft: NonProductionExecutableRuleDraftArtifact,
  review: HumanExecutableRuleReviewRecord,
  reviewGate: ExecutableRuleReviewGateAssessment,
  engineeringValidation: RuleDraftEngineeringValidationRecord,
  sourceDraft: NonExecutableRuleDraftArtifact,
  promotionReview: HumanPromotionReviewRecord,
  promotionGate: CrossProjectPromotionGateAssessment,
): SimulationDraftEvidenceFingerprint {
  const currentReviewFingerprint = executableRuleReviewEvidenceFingerprint(
    reviewGate,
    engineeringValidation,
    sourceDraft,
    promotionReview,
    promotionGate,
  )

  return Object.freeze({
    version: RP01_11_EXECUTABLE_DRAFT_FINGERPRINT_VERSION,
    value: JSON.stringify({
      version: RP01_11_EXECUTABLE_DRAFT_FINGERPRINT_VERSION,
      draftId: draft.id,
      artifactType: draft.artifactType,
      artifactStatus: draft.artifactStatus,
      title: draft.title,
      executableExpression: draft.executableExpression,
      executionContext: draft.executionContext,
      createdAt: draft.createdAt,
      simulationExecutable: draft.simulationExecutable,
      productionExecutable: draft.productionExecutable,
      machineInstructionGenerated: draft.machineInstructionGenerated,
      automaticMachineTranslationAllowed:
        draft.automaticMachineTranslationAllowed,
      automaticRulePromotionAllowed: draft.automaticRulePromotionAllowed,
      reviewId: review.id,
      reviewGateId: reviewGate.id,
      engineeringValidationId: engineeringValidation.id,
      sourceDraftId: sourceDraft.id,
      promotionReviewId: promotionReview.id,
      promotionGateId: promotionGate.id,
      corroborationId: promotionGate.corroborationId,
      storedReviewFingerprint: review.gateFingerprint.value,
      currentReviewFingerprint: currentReviewFingerprint.value,
    }),
  })
}

export function assessSimulationValidationRecord(
  record: SimulationValidationRecord,
  draft: NonProductionExecutableRuleDraftArtifact,
  review: HumanExecutableRuleReviewRecord,
  reviewGate: ExecutableRuleReviewGateAssessment,
  engineeringValidation: RuleDraftEngineeringValidationRecord,
  sourceDraft: NonExecutableRuleDraftArtifact,
  promotionReview: HumanPromotionReviewRecord,
  promotionGate: CrossProjectPromotionGateAssessment,
): SimulationValidationAssessment {
  const currentDraftFingerprint = simulationDraftEvidenceFingerprint(
    draft,
    review,
    reviewGate,
    engineeringValidation,
    sourceDraft,
    promotionReview,
    promotionGate,
  )
  const reviewAssessment = assessHumanExecutableRuleReviewRecord(
    review,
    reviewGate,
    engineeringValidation,
    sourceDraft,
    promotionReview,
    promotionGate,
  )

  const reasons: SimulationValidationInvalidationReason[] = []
  if (record.draftFingerprint.value !== currentDraftFingerprint.value) {
    reasons.push('EXECUTABLE_DRAFT_OR_SOURCE_EVIDENCE_CHANGED')
  }
  if (reviewAssessment.state !== 'CURRENT') {
    reasons.push('SOURCE_EXECUTABLE_REVIEW_CHANGED_OR_STALE')
  }
  if (!sourceChainMatches(
    draft,
    review,
    reviewGate,
    engineeringValidation,
    sourceDraft,
    promotionReview,
    promotionGate,
  )) {
    reasons.push('SOURCE_CHAIN_CHANGED')
  }
  if (!isSimulationOnlyDraft(draft)) {
    reasons.push('EXECUTABLE_DRAFT_NO_LONGER_SIMULATION_ONLY')
  }

  const state: SimulationValidationState =
    reasons.length === 0 ? 'CURRENT' : 'STALE_REQUIRES_REVIEW'

  return Object.freeze({
    recordId: record.id,
    state,
    reasons: Object.freeze(reasons),
    currentDraftFingerprint,
    decisionCurrentlyUsableForSimulationExecutionGate:
      state === 'CURRENT'
      && record.decision === 'VALIDATED_FOR_SIMULATION_EXECUTION',
    productionExecutable: false,
    productionRuleCreated: false,
    productionUnlockAllowed: false,
    machineReady: false,
    productionApproved: false,
  })
}

export function recordSimulationValidation(
  existingRecords: readonly SimulationValidationRecord[],
  draft: NonProductionExecutableRuleDraftArtifact,
  review: HumanExecutableRuleReviewRecord,
  reviewGate: ExecutableRuleReviewGateAssessment,
  engineeringValidation: RuleDraftEngineeringValidationRecord,
  sourceDraft: NonExecutableRuleDraftArtifact,
  promotionReview: HumanPromotionReviewRecord,
  promotionGate: CrossProjectPromotionGateAssessment,
  decision: SimulationValidationDecision,
  validator: string,
  validatedAt: string,
  simulationContext: string,
  rationale: string,
): RecordSimulationValidationResult {
  const reasons: SimulationValidationFailureReason[] = []
  const draftFingerprint = simulationDraftEvidenceFingerprint(
    draft,
    review,
    reviewGate,
    engineeringValidation,
    sourceDraft,
    promotionReview,
    promotionGate,
  )
  const reviewAssessment = assessHumanExecutableRuleReviewRecord(
    review,
    reviewGate,
    engineeringValidation,
    sourceDraft,
    promotionReview,
    promotionGate,
  )

  if (!isSimulationOnlyDraft(draft)) {
    reasons.push('EXECUTABLE_DRAFT_NOT_SIMULATION_ONLY')
  }
  if (reviewAssessment.state !== 'CURRENT') {
    reasons.push('SOURCE_EXECUTABLE_REVIEW_NOT_CURRENT')
  }
  if (
    review.decision !==
    'APPROVED_FOR_NON_PRODUCTION_EXECUTABLE_DRAFT'
  ) {
    reasons.push('SOURCE_EXECUTABLE_REVIEW_NOT_APPROVED')
  }
  if (!sourceChainMatches(
    draft,
    review,
    reviewGate,
    engineeringValidation,
    sourceDraft,
    promotionReview,
    promotionGate,
  )) {
    reasons.push('SOURCE_CHAIN_MISMATCH')
  }
  if (!validator.trim()) reasons.push('VALIDATOR_REQUIRED')
  if (!validatedAt.trim()) reasons.push('VALIDATION_TIMESTAMP_REQUIRED')
  if (!simulationContext.trim()) reasons.push('SIMULATION_CONTEXT_REQUIRED')
  if (!rationale.trim()) reasons.push('RATIONALE_REQUIRED')

  if (existingRecords.some((item) =>
    item.executableDraftArtifactId === draft.id
    && item.draftFingerprint.value === draftFingerprint.value
  )) {
    reasons.push('CURRENT_SIMULATION_VALIDATION_ALREADY_RECORDED')
  }

  if (reasons.length > 0) {
    return Object.freeze({
      status: 'NOT_RECORDED',
      reasons: Object.freeze(reasons),
      record: null,
    })
  }

  const validated = decision === 'VALIDATED_FOR_SIMULATION_EXECUTION'
  const record: SimulationValidationRecord = Object.freeze({
    id: [
      'rp01-11-validation',
      encodeURIComponent(draft.id),
      encodeURIComponent(validatedAt),
      encodeURIComponent(validator.trim()),
    ].join(':'),
    recordType: NON_PRODUCTION_EXECUTABLE_DRAFT_VALIDATION_RECORD,
    executableDraftArtifactId: draft.id,
    humanExecutableRuleReviewRecordId: review.id,
    executableRuleReviewGateId: reviewGate.id,
    engineeringValidationRecordId: engineeringValidation.id,
    sourceDraftArtifactId: sourceDraft.id,
    promotionReviewRecordId: promotionReview.id,
    promotionGateAssessmentId: promotionGate.id,
    corroborationId: promotionGate.corroborationId,
    profileCode: draft.profileCode,
    candidateKind: draft.candidateKind,
    sourcePatternKey: draft.sourcePatternKey,
    operationName: draft.operationName,
    decision,
    validator: validator.trim(),
    validatedAt,
    simulationContext: simulationContext.trim(),
    rationale: rationale.trim(),
    draftFingerprint,
    validationScope: 'LOCAL_SIMULATION_ONLY',
    humanSimulationValidationRecorded: true,
    simulationExecutionValidated: validated,
    simulationExecutionRejected: !validated,
    productionExecutable: false,
    machineInstructionGenerated: false,
    automaticMachineTranslationAllowed: false,
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

export function assessSimulationExecutionGate(
  validationRecord: SimulationValidationRecord,
  draft: NonProductionExecutableRuleDraftArtifact,
  review: HumanExecutableRuleReviewRecord,
  reviewGate: ExecutableRuleReviewGateAssessment,
  engineeringValidation: RuleDraftEngineeringValidationRecord,
  sourceDraft: NonExecutableRuleDraftArtifact,
  promotionReview: HumanPromotionReviewRecord,
  promotionGate: CrossProjectPromotionGateAssessment,
): SimulationExecutionGateAssessment {
  const validationAssessment = assessSimulationValidationRecord(
    validationRecord,
    draft,
    review,
    reviewGate,
    engineeringValidation,
    sourceDraft,
    promotionReview,
    promotionGate,
  )
  const reasons: SimulationExecutionGateBlockReason[] = []

  if (validationAssessment.state !== 'CURRENT') {
    reasons.push('SIMULATION_VALIDATION_NOT_CURRENT')
  }
  if (validationRecord.decision !== 'VALIDATED_FOR_SIMULATION_EXECUTION') {
    reasons.push('SIMULATION_EXECUTION_NOT_VALIDATED')
  }
  if (!isSimulationOnlyDraft(draft)) {
    reasons.push('EXECUTABLE_DRAFT_NOT_SIMULATION_ONLY')
  }
  if (!sourceChainMatches(
    draft,
    review,
    reviewGate,
    engineeringValidation,
    sourceDraft,
    promotionReview,
    promotionGate,
  )) {
    reasons.push('SOURCE_CHAIN_CHANGED')
  }

  const state: SimulationExecutionGateState =
    reasons.length === 0
      ? 'ELIGIBLE_FOR_LOCAL_SIMULATION_EXECUTION'
      : 'BLOCKED'

  return Object.freeze({
    id: `rp01-11-sim-gate:${validationRecord.id}`,
    gateType: SIMULATION_EXECUTION_GATE,
    validationRecordId: validationRecord.id,
    executableDraftArtifactId: draft.id,
    humanExecutableRuleReviewRecordId: review.id,
    executableRuleReviewGateId: reviewGate.id,
    profileCode: draft.profileCode,
    candidateKind: draft.candidateKind,
    sourcePatternKey: draft.sourcePatternKey,
    operationName: draft.operationName,
    simulationContext: validationRecord.simulationContext,
    validationDecision: validationRecord.decision,
    validationRecordState: validationAssessment.state,
    state,
    reasons: Object.freeze(reasons),
    localSimulationExecutionCanStart:
      state === 'ELIGIBLE_FOR_LOCAL_SIMULATION_EXECUTION',
    localSimulationExecutionCompleted: false,
    runtimeAdapterCreated: false,
    productionExecutable: false,
    machineInstructionGenerated: false,
    automaticMachineTranslationAllowed: false,
    productionRuleCreated: false,
    productionUnlockAllowed: false,
    machineReady: false,
    productionApproved: false,
  })
}
