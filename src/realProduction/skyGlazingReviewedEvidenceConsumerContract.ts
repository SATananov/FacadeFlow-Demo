import type {
  ReviewedEvidenceConsumerProjection,
  ReviewedEvidenceReadModel,
} from './skyGlazingReviewedEvidenceReadModel'

export const REVIEWED_EVIDENCE_CONSUMER_CONTRACT =
  'REVIEWED_EVIDENCE_CONSUMER_CONTRACT' as const
export const RP01_19_CONSUMER_CONTRACT_VERSION =
  'RP01.19-UI-AI-BOUNDARY-V1' as const

export type ReviewedEvidenceConsumerContractState =
  | 'READ_ONLY_CONSUMER_CONTRACT_ACTIVE'
  | 'NO_REVIEWED_EVIDENCE_CONTRACT'

export type ReviewedEvidenceConsumerContractReason =
  | 'READ_MODEL_UNAVAILABLE'
  | 'READ_MODEL_PROJECTION_MISSING'

export type ReviewedEvidenceConsumerAction =
  | 'DISPLAY_REVIEWED_EVIDENCE'
  | 'EXPOSE_REVIEWED_EVIDENCE_TO_AI_CONTEXT'
  | 'TREAT_EVIDENCE_AS_PREDICTION'
  | 'INFER_UNREVIEWED_SCENARIO_OUTCOME'
  | 'GENERALIZE_ACROSS_SCENARIOS'
  | 'CLAIM_ENGINEERING_VALIDATION'
  | 'CLAIM_PRODUCTION_READINESS'
  | 'GENERATE_MACHINE_INSTRUCTION'

export type ReviewedEvidenceConsumerActionDecision =
  | 'ALLOWED_READ_ONLY'
  | 'BLOCKED'

export interface ReviewedEvidenceUiConsumerBoundary {
  mayDisplayReviewedEvidence: boolean
  mayDisplayObservedSimulationResults: boolean
  mayDisplayExpectedSimulationResults: boolean
  mustLabelAsReviewedSimulationEvidence: true
  mustPreserveExactReviewedScenarioScope: true
  readOnly: true
  mayPresentAsPrediction: false
  mayPresentAsEngineeringApproval: false
  mayPresentAsProductionApproval: false
  mayTriggerMachineInstructionGeneration: false
}

export interface ReviewedEvidenceAiConsumerBoundary {
  mayReceiveReviewedEvidenceContext: boolean
  contextPurpose: 'REFERENCE_ONLY' | 'NO_EVIDENCE'
  mustPreserveEvidenceScope: true
  mayTreatEvidenceAsPrediction: false
  mayInferUnreviewedScenarioOutcome: false
  mayGeneralizeAcrossScenarios: false
  mayClaimEngineeringValidation: false
  mayClaimProductionReadiness: false
  mayGenerateMachineInstruction: false
}

export interface ReviewedEvidenceConsumerContract {
  contractType: typeof REVIEWED_EVIDENCE_CONSUMER_CONTRACT
  contractVersion: typeof RP01_19_CONSUMER_CONTRACT_VERSION
  state: ReviewedEvidenceConsumerContractState
  reasons: readonly ReviewedEvidenceConsumerContractReason[]
  sourceReadModelType: ReviewedEvidenceReadModel['readModelType']
  sourceReadModelVersion: ReviewedEvidenceReadModel['readModelVersion']
  scenarioIdentityJson: string
  evidenceProjection: ReviewedEvidenceConsumerProjection | null
  ui: ReviewedEvidenceUiConsumerBoundary
  ai: ReviewedEvidenceAiConsumerBoundary
  readOnlyEvidenceContract: true
  automaticOutcomeInferenceAllowed: false
  inferredOutcome: null
  scenarioGeneralizationAllowed: false
  inferenceBeyondReviewedScenariosAllowed: false
  engineeringRuleValidated: false
  engineeringAuthorityGranted: false
  automaticRulePromotionAllowed: false
  productionExecutable: false
  machineInstructionGenerated: false
  productionRuleCreated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
  productionAuthorityGranted: false
}

export interface ReviewedEvidenceConsumerActionAssessment {
  action: ReviewedEvidenceConsumerAction
  decision: ReviewedEvidenceConsumerActionDecision
  reason:
    | 'READ_ONLY_EVIDENCE_ACTION'
    | 'NO_REVIEWED_EVIDENCE_AVAILABLE'
    | 'PREDICTION_NOT_ALLOWED'
    | 'UNREVIEWED_SCENARIO_INFERENCE_NOT_ALLOWED'
    | 'SCENARIO_GENERALIZATION_NOT_ALLOWED'
    | 'ENGINEERING_AUTHORITY_NOT_GRANTED'
    | 'PRODUCTION_AUTHORITY_NOT_GRANTED'
    | 'MACHINE_INSTRUCTION_NOT_ALLOWED'
  readOnly: true
  automaticOutcomeInferenceAllowed: false
  engineeringAuthorityGranted: false
  productionAuthorityGranted: false
}

function activeReadOnlyContract(
  readModel: ReviewedEvidenceReadModel,
): boolean {
  return (
    readModel.state === 'AVAILABLE_FOR_READ_ONLY_CONSUMER'
    && readModel.reviewedEvidenceAvailable === true
    && readModel.consumerProjection !== null
  )
}

export function buildReviewedEvidenceConsumerContract(
  readModel: ReviewedEvidenceReadModel,
): ReviewedEvidenceConsumerContract {
  const reasons: ReviewedEvidenceConsumerContractReason[] = []

  if (readModel.state !== 'AVAILABLE_FOR_READ_ONLY_CONSUMER') {
    reasons.push('READ_MODEL_UNAVAILABLE')
  }

  if (readModel.consumerProjection === null) {
    reasons.push('READ_MODEL_PROJECTION_MISSING')
  }

  const active = activeReadOnlyContract(readModel)
  const mayExposeToAi =
    active && readModel.mayExposeReviewedEvidenceToAiContext === true

  return Object.freeze({
    contractType: REVIEWED_EVIDENCE_CONSUMER_CONTRACT,
    contractVersion: RP01_19_CONSUMER_CONTRACT_VERSION,
    state: active
      ? 'READ_ONLY_CONSUMER_CONTRACT_ACTIVE'
      : 'NO_REVIEWED_EVIDENCE_CONTRACT',
    reasons: Object.freeze(reasons),
    sourceReadModelType: readModel.readModelType,
    sourceReadModelVersion: readModel.readModelVersion,
    scenarioIdentityJson: readModel.scenarioIdentityJson,
    evidenceProjection: active ? readModel.consumerProjection : null,
    ui: Object.freeze({
      mayDisplayReviewedEvidence:
        active && readModel.mayDisplayReviewedEvidenceReference,
      mayDisplayObservedSimulationResults: active,
      mayDisplayExpectedSimulationResults: active,
      mustLabelAsReviewedSimulationEvidence: true,
      mustPreserveExactReviewedScenarioScope: true,
      readOnly: true,
      mayPresentAsPrediction: false,
      mayPresentAsEngineeringApproval: false,
      mayPresentAsProductionApproval: false,
      mayTriggerMachineInstructionGeneration: false,
    }),
    ai: Object.freeze({
      mayReceiveReviewedEvidenceContext: mayExposeToAi,
      contextPurpose: mayExposeToAi
        ? 'REFERENCE_ONLY'
        : 'NO_EVIDENCE',
      mustPreserveEvidenceScope: true,
      mayTreatEvidenceAsPrediction: false,
      mayInferUnreviewedScenarioOutcome: false,
      mayGeneralizeAcrossScenarios: false,
      mayClaimEngineeringValidation: false,
      mayClaimProductionReadiness: false,
      mayGenerateMachineInstruction: false,
    }),
    readOnlyEvidenceContract: true,
    automaticOutcomeInferenceAllowed: false,
    inferredOutcome: null,
    scenarioGeneralizationAllowed: false,
    inferenceBeyondReviewedScenariosAllowed: false,
    engineeringRuleValidated: false,
    engineeringAuthorityGranted: false,
    automaticRulePromotionAllowed: false,
    productionExecutable: false,
    machineInstructionGenerated: false,
    productionRuleCreated: false,
    productionUnlockAllowed: false,
    machineReady: false,
    productionApproved: false,
    productionAuthorityGranted: false,
  })
}

export function assessReviewedEvidenceConsumerAction(
  contract: ReviewedEvidenceConsumerContract,
  action: ReviewedEvidenceConsumerAction,
): ReviewedEvidenceConsumerActionAssessment {
  const evidenceAvailable =
    contract.state === 'READ_ONLY_CONSUMER_CONTRACT_ACTIVE'
    && contract.evidenceProjection !== null

  let decision: ReviewedEvidenceConsumerActionDecision = 'BLOCKED'
  let reason: ReviewedEvidenceConsumerActionAssessment['reason']

  switch (action) {
    case 'DISPLAY_REVIEWED_EVIDENCE':
      if (evidenceAvailable && contract.ui.mayDisplayReviewedEvidence) {
        decision = 'ALLOWED_READ_ONLY'
        reason = 'READ_ONLY_EVIDENCE_ACTION'
      } else {
        reason = 'NO_REVIEWED_EVIDENCE_AVAILABLE'
      }
      break

    case 'EXPOSE_REVIEWED_EVIDENCE_TO_AI_CONTEXT':
      if (
        evidenceAvailable
        && contract.ai.mayReceiveReviewedEvidenceContext
      ) {
        decision = 'ALLOWED_READ_ONLY'
        reason = 'READ_ONLY_EVIDENCE_ACTION'
      } else {
        reason = 'NO_REVIEWED_EVIDENCE_AVAILABLE'
      }
      break

    case 'TREAT_EVIDENCE_AS_PREDICTION':
      reason = 'PREDICTION_NOT_ALLOWED'
      break

    case 'INFER_UNREVIEWED_SCENARIO_OUTCOME':
      reason = 'UNREVIEWED_SCENARIO_INFERENCE_NOT_ALLOWED'
      break

    case 'GENERALIZE_ACROSS_SCENARIOS':
      reason = 'SCENARIO_GENERALIZATION_NOT_ALLOWED'
      break

    case 'CLAIM_ENGINEERING_VALIDATION':
      reason = 'ENGINEERING_AUTHORITY_NOT_GRANTED'
      break

    case 'CLAIM_PRODUCTION_READINESS':
      reason = 'PRODUCTION_AUTHORITY_NOT_GRANTED'
      break

    case 'GENERATE_MACHINE_INSTRUCTION':
      reason = 'MACHINE_INSTRUCTION_NOT_ALLOWED'
      break
  }

  return Object.freeze({
    action,
    decision,
    reason,
    readOnly: true,
    automaticOutcomeInferenceAllowed: false,
    engineeringAuthorityGranted: false,
    productionAuthorityGranted: false,
  })
}
