import type {
  CrossProjectPromotionGateAssessment,
} from './skyGlazingCrossProjectPromotionGate'
import type {
  HumanPromotionReviewRecord,
  NonExecutableRuleDraftArtifact,
} from './skyGlazingHumanPromotionReview'
import {
  assessRuleDraftEngineeringValidationRecord,
  ruleDraftEngineeringEvidenceFingerprint,
  type RuleDraftEngineeringValidationRecord,
} from './skyGlazingRuleDraftEngineeringValidation'

export const EXECUTABLE_RULE_REVIEW_GATE =
  'EXECUTABLE_RULE_REVIEW_GATE' as const
export const RP01_9_ENGINEERING_VALIDATION_CLOSURE_VERSION =
  'RP01.9-CLOSURE-V1' as const

export type ExecutableRuleReviewGateState =
  | 'BLOCKED'
  | 'ELIGIBLE_FOR_EXECUTABLE_RULE_REVIEW'

export type ExecutableRuleReviewGateBlockReason =
  | 'ENGINEERING_VALIDATION_NOT_CURRENT'
  | 'ENGINEERING_CONTEXT_NOT_VALIDATED'
  | 'DRAFT_NOT_NON_EXECUTABLE'
  | 'SOURCE_CHAIN_CHANGED'

export interface EngineeringValidationClosureFingerprint {
  version: typeof RP01_9_ENGINEERING_VALIDATION_CLOSURE_VERSION
  value: string
}

export interface ExecutableRuleReviewGateAssessment {
  id: string
  gateType: typeof EXECUTABLE_RULE_REVIEW_GATE
  engineeringValidationRecordId: string
  draftArtifactId: string
  promotionReviewRecordId: string
  promotionGateAssessmentId: string
  corroborationId: string
  profileCode: string
  candidateKind: NonExecutableRuleDraftArtifact['candidateKind']
  sourcePatternKey: string
  operationName: string | null
  engineeringContext: string
  engineeringValidationDecision: RuleDraftEngineeringValidationRecord['decision']
  engineeringValidationRecordState: 'CURRENT' | 'STALE_REQUIRES_REVIEW'
  closureFingerprint: EngineeringValidationClosureFingerprint
  state: ExecutableRuleReviewGateState
  reasons: readonly ExecutableRuleReviewGateBlockReason[]
  engineeringValidationClosedForReviewBoundary: boolean
  executableRuleReviewCanStart: boolean
  executableRuleReviewCompleted: false
  executableRuleCreated: false
  engineeringRuleValidated: false
  automaticRulePromotionAllowed: false
  productionRuleCreated: false
  productionUnlockAllowed: false
  machineInstructionGenerated: false
  machineReady: false
  productionApproved: false
}

function draftIsStillNonExecutable(
  draft: NonExecutableRuleDraftArtifact,
): boolean {
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

function sourceChainMatches(
  validationRecord: RuleDraftEngineeringValidationRecord,
  draft: NonExecutableRuleDraftArtifact,
  promotionReview: HumanPromotionReviewRecord,
  currentGate: CrossProjectPromotionGateAssessment,
): boolean {
  return (
    validationRecord.draftArtifactId === draft.id
    && validationRecord.promotionReviewRecordId === promotionReview.id
    && validationRecord.promotionGateAssessmentId === currentGate.id
    && validationRecord.corroborationId === currentGate.corroborationId
    && validationRecord.profileCode === draft.profileCode
    && validationRecord.candidateKind === draft.candidateKind
    && validationRecord.sourcePatternKey === draft.sourcePatternKey
    && validationRecord.operationName === draft.operationName
    && draft.promotionReviewRecordId === promotionReview.id
    && draft.promotionGateAssessmentId === currentGate.id
    && draft.corroborationId === currentGate.corroborationId
    && promotionReview.promotionGateAssessmentId === currentGate.id
    && promotionReview.corroborationId === currentGate.corroborationId
  )
}

export function engineeringValidationClosureFingerprint(
  validationRecord: RuleDraftEngineeringValidationRecord,
  draft: NonExecutableRuleDraftArtifact,
  promotionReview: HumanPromotionReviewRecord,
  currentGate: CrossProjectPromotionGateAssessment,
): EngineeringValidationClosureFingerprint {
  const currentDraftFingerprint = ruleDraftEngineeringEvidenceFingerprint(
    draft,
    promotionReview,
    currentGate,
  )

  const value = JSON.stringify({
    version: RP01_9_ENGINEERING_VALIDATION_CLOSURE_VERSION,
    validationRecordId: validationRecord.id,
    validationDecision: validationRecord.decision,
    validationScope: validationRecord.validationScope,
    validator: validationRecord.validator,
    validatedAt: validationRecord.validatedAt,
    engineeringContext: validationRecord.engineeringContext,
    rationale: validationRecord.rationale,
    draftArtifactId: draft.id,
    promotionReviewRecordId: promotionReview.id,
    promotionGateAssessmentId: currentGate.id,
    corroborationId: currentGate.corroborationId,
    profileCode: draft.profileCode,
    candidateKind: draft.candidateKind,
    sourcePatternKey: draft.sourcePatternKey,
    operationName: draft.operationName,
    storedDraftFingerprint: validationRecord.draftFingerprint.value,
    currentDraftFingerprint: currentDraftFingerprint.value,
  })

  return Object.freeze({
    version: RP01_9_ENGINEERING_VALIDATION_CLOSURE_VERSION,
    value,
  })
}

export function assessExecutableRuleReviewGate(
  validationRecord: RuleDraftEngineeringValidationRecord,
  draft: NonExecutableRuleDraftArtifact,
  promotionReview: HumanPromotionReviewRecord,
  currentGate: CrossProjectPromotionGateAssessment,
): ExecutableRuleReviewGateAssessment {
  const reasons: ExecutableRuleReviewGateBlockReason[] = []

  const validationAssessment =
    assessRuleDraftEngineeringValidationRecord(
      validationRecord,
      draft,
      promotionReview,
      currentGate,
    )

  if (validationAssessment.state !== 'CURRENT') {
    reasons.push('ENGINEERING_VALIDATION_NOT_CURRENT')
  }

  if (validationRecord.decision !== 'VALIDATED_FOR_ENGINEERING_CONTEXT') {
    reasons.push('ENGINEERING_CONTEXT_NOT_VALIDATED')
  }

  if (!draftIsStillNonExecutable(draft)) {
    reasons.push('DRAFT_NOT_NON_EXECUTABLE')
  }

  if (!sourceChainMatches(
    validationRecord,
    draft,
    promotionReview,
    currentGate,
  )) {
    reasons.push('SOURCE_CHAIN_CHANGED')
  }

  const state: ExecutableRuleReviewGateState =
    reasons.length === 0
      ? 'ELIGIBLE_FOR_EXECUTABLE_RULE_REVIEW'
      : 'BLOCKED'

  return Object.freeze({
    id: `rp01-9:${validationRecord.id}`,
    gateType: EXECUTABLE_RULE_REVIEW_GATE,
    engineeringValidationRecordId: validationRecord.id,
    draftArtifactId: draft.id,
    promotionReviewRecordId: promotionReview.id,
    promotionGateAssessmentId: currentGate.id,
    corroborationId: currentGate.corroborationId,
    profileCode: draft.profileCode,
    candidateKind: draft.candidateKind,
    sourcePatternKey: draft.sourcePatternKey,
    operationName: draft.operationName,
    engineeringContext: validationRecord.engineeringContext,
    engineeringValidationDecision: validationRecord.decision,
    engineeringValidationRecordState: validationAssessment.state,
    closureFingerprint: engineeringValidationClosureFingerprint(
      validationRecord,
      draft,
      promotionReview,
      currentGate,
    ),
    state,
    reasons: Object.freeze(reasons),
    engineeringValidationClosedForReviewBoundary:
      state === 'ELIGIBLE_FOR_EXECUTABLE_RULE_REVIEW',
    executableRuleReviewCanStart:
      state === 'ELIGIBLE_FOR_EXECUTABLE_RULE_REVIEW',
    executableRuleReviewCompleted: false,
    executableRuleCreated: false,
    engineeringRuleValidated: false,
    automaticRulePromotionAllowed: false,
    productionRuleCreated: false,
    productionUnlockAllowed: false,
    machineInstructionGenerated: false,
    machineReady: false,
    productionApproved: false,
  })
}
