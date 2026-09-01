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
import type {
  ExecutableRuleReviewGateAssessment,
} from './skyGlazingExecutableRuleReviewGate'
import type {
  HumanExecutableRuleReviewRecord,
  NonProductionExecutableRuleDraftArtifact,
} from './skyGlazingHumanExecutableRuleReview'
import {
  assessSimulationExecutionGate,
  type SimulationExecutionGateAssessment,
  type SimulationValidationRecord,
} from './skyGlazingSimulationExecutionGate'
import {
  localSimulationExecutionFingerprint,
  type LocalSimulationDryRunRecord,
  type LocalSimulationRuntimeAdapter,
} from './skyGlazingLocalSimulationRuntime'

export const SIMULATION_OUTCOME_VALIDATION_RECORD =
  'SIMULATION_OUTCOME_VALIDATION_RECORD' as const
export const RP01_13_DRY_RUN_OUTCOME_FINGERPRINT_VERSION =
  'RP01.13-DRY-RUN-OUTCOME-V1' as const

export type SimulationOutcomeValidationDecision =
  | 'VALIDATED_AS_EXPECTED_SIMULATION_OUTCOME'
  | 'REJECTED_SIMULATION_OUTCOME'

export type SimulationOutcomeValidationRecordState =
  | 'CURRENT'
  | 'STALE_REQUIRES_REVIEW'

export type SimulationOutcomeValidationFailureReason =
  | 'DRY_RUN_RECORD_NOT_COMPLETE'
  | 'DRY_RUN_RECORD_SOURCE_MISMATCH'
  | 'DRY_RUN_RECORD_SAFETY_BOUNDARY_BROKEN'
  | 'RUNTIME_ADAPTER_NOT_CURRENT'
  | 'SIMULATION_GATE_NOT_ELIGIBLE'
  | 'VALIDATOR_REQUIRED'
  | 'VALIDATION_TIMESTAMP_REQUIRED'
  | 'RATIONALE_REQUIRED'
  | 'EXPECTED_RESULT_MISMATCH'
  | 'CURRENT_OUTCOME_VALIDATION_ALREADY_RECORDED'

export type SimulationOutcomeValidationInvalidationReason =
  | 'DRY_RUN_OR_EXECUTION_FINGERPRINT_CHANGED'
  | 'RUNTIME_ADAPTER_CHANGED'
  | 'SIMULATION_GATE_CHANGED_OR_BLOCKED'
  | 'DRY_RUN_SOURCE_CHAIN_CHANGED'
  | 'DRY_RUN_SAFETY_BOUNDARY_BROKEN'

export interface DryRunOutcomeEvidenceFingerprint {
  version: typeof RP01_13_DRY_RUN_OUTCOME_FINGERPRINT_VERSION
  value: string
}

export interface SimulationOutcomeValidationRecord {
  id: string
  recordType: typeof SIMULATION_OUTCOME_VALIDATION_RECORD
  dryRunRecordId: string
  adapterId: string
  executableDraftArtifactId: string
  simulationExecutionGateId: string
  simulationValidationRecordId: string
  profileCode: string
  candidateKind: NonProductionExecutableRuleDraftArtifact['candidateKind']
  sourcePatternKey: string
  operationName: string | null
  dryRunResult: boolean
  expectedResult: boolean
  decision: SimulationOutcomeValidationDecision
  validator: string
  validatedAt: string
  rationale: string
  dryRunOutcomeFingerprint: DryRunOutcomeEvidenceFingerprint
  validationScope: 'SIMULATION_OUTCOME_ONLY'
  humanSimulationOutcomeDecisionRecorded: true
  simulationOutcomeValidated: boolean
  simulationOutcomeRejected: boolean
  engineeringRuleValidated: false
  productionExecutable: false
  machineInstructionGenerated: false
  automaticMachineTranslationAllowed: false
  productionRuleCreated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

export interface SimulationOutcomeValidationAssessment {
  recordId: string
  state: SimulationOutcomeValidationRecordState
  reasons: readonly SimulationOutcomeValidationInvalidationReason[]
  currentDryRunOutcomeFingerprint: DryRunOutcomeEvidenceFingerprint
  outcomeDecisionCurrentlyUsableForSimulationEvidence: boolean
  engineeringRuleValidated: false
  productionExecutable: false
  machineInstructionGenerated: false
  productionRuleCreated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

export interface RecordSimulationOutcomeValidationResult {
  status: 'RECORDED' | 'NOT_RECORDED'
  reasons: readonly SimulationOutcomeValidationFailureReason[]
  record: SimulationOutcomeValidationRecord | null
}

function dryRunSourceMatches(
  dryRun: LocalSimulationDryRunRecord,
  adapter: LocalSimulationRuntimeAdapter,
  simulationGate: SimulationExecutionGateAssessment,
  validation: SimulationValidationRecord,
  draft: NonProductionExecutableRuleDraftArtifact,
): boolean {
  return (
    dryRun.adapterId === adapter.id
    && dryRun.adapterVersion === adapter.adapterVersion
    && dryRun.executableDraftArtifactId === draft.id
    && dryRun.simulationExecutionGateId === simulationGate.id
    && dryRun.validationRecordId === validation.id
    && dryRun.executableExpression === adapter.executableExpression
    && adapter.executableDraftArtifactId === draft.id
    && adapter.simulationExecutionGateId === simulationGate.id
    && adapter.validationRecordId === validation.id
  )
}

function dryRunSafetyBoundaryIntact(
  dryRun: LocalSimulationDryRunRecord,
  adapter: LocalSimulationRuntimeAdapter,
): boolean {
  return (
    dryRun.dryRunCompleted === true
    && dryRun.localSimulationExecutionCompleted === true
    && dryRun.sideEffectsObserved === false
    && dryRun.dynamicCodeEvaluationUsed === false
    && dryRun.networkAccessUsed === false
    && dryRun.fileSystemAccessUsed === false
    && dryRun.processAccessUsed === false
    && dryRun.machineInstructionGenerated === false
    && dryRun.automaticMachineTranslationAllowed === false
    && dryRun.productionExecutable === false
    && dryRun.productionRuleCreated === false
    && dryRun.productionUnlockAllowed === false
    && dryRun.machineReady === false
    && dryRun.productionApproved === false
    && adapter.localOnly === true
    && adapter.dryRunOnly === true
    && adapter.sideEffectsAllowed === false
    && adapter.dynamicCodeEvaluationAllowed === false
    && adapter.networkAccessAllowed === false
    && adapter.fileSystemAccessAllowed === false
    && adapter.processAccessAllowed === false
    && adapter.machineInstructionGenerated === false
    && adapter.automaticMachineTranslationAllowed === false
    && adapter.productionExecutable === false
    && adapter.productionRuleCreated === false
    && adapter.productionUnlockAllowed === false
    && adapter.machineReady === false
    && adapter.productionApproved === false
  )
}

function currentAdapterIsBoundToDraft(
  adapter: LocalSimulationRuntimeAdapter,
  simulationGate: SimulationExecutionGateAssessment,
  validation: SimulationValidationRecord,
  draft: NonProductionExecutableRuleDraftArtifact,
): boolean {
  return (
    adapter.executableDraftArtifactId === draft.id
    && adapter.simulationExecutionGateId === simulationGate.id
    && adapter.validationRecordId === validation.id
    && adapter.executableExpression === draft.executableExpression
  )
}

export function dryRunOutcomeEvidenceFingerprint(
  dryRun: LocalSimulationDryRunRecord,
  adapter: LocalSimulationRuntimeAdapter,
  simulationGate: SimulationExecutionGateAssessment,
): DryRunOutcomeEvidenceFingerprint {
  const recomputedExecutionFingerprint = localSimulationExecutionFingerprint(
    adapter,
    simulationGate,
    dryRun.inputSnapshot,
    dryRun.executedAt,
  )

  return Object.freeze({
    version: RP01_13_DRY_RUN_OUTCOME_FINGERPRINT_VERSION,
    value: JSON.stringify({
      version: RP01_13_DRY_RUN_OUTCOME_FINGERPRINT_VERSION,
      dryRunRecordId: dryRun.id,
      adapterId: adapter.id,
      adapterVersion: adapter.adapterVersion,
      executableDraftArtifactId: dryRun.executableDraftArtifactId,
      simulationExecutionGateId: simulationGate.id,
      validationRecordId: dryRun.validationRecordId,
      executedAt: dryRun.executedAt,
      executableExpression: dryRun.executableExpression,
      normalizedExpression: dryRun.normalizedExpression,
      inputSnapshot: dryRun.inputSnapshot,
      inputIdentifier: dryRun.inputIdentifier,
      comparisonOperator: dryRun.comparisonOperator,
      expectedLiteral: dryRun.expectedLiteral,
      actualValue: dryRun.actualValue,
      result: dryRun.result,
      storedExecutionFingerprint: dryRun.executionFingerprint.value,
      recomputedExecutionFingerprint: recomputedExecutionFingerprint.value,
      sourceDraftFingerprint: adapter.sourceDraftFingerprint,
      simulationGateState: simulationGate.state,
      localSimulationExecutionCanStart:
        simulationGate.localSimulationExecutionCanStart,
    }),
  })
}

export function assessSimulationOutcomeValidationRecord(
  record: SimulationOutcomeValidationRecord,
  dryRun: LocalSimulationDryRunRecord,
  adapter: LocalSimulationRuntimeAdapter,
  simulationGate: SimulationExecutionGateAssessment,
  validation: SimulationValidationRecord,
  draft: NonProductionExecutableRuleDraftArtifact,
  executableReview: HumanExecutableRuleReviewRecord,
  executableReviewGate: ExecutableRuleReviewGateAssessment,
  engineeringValidation: RuleDraftEngineeringValidationRecord,
  sourceDraft: NonExecutableRuleDraftArtifact,
  promotionReview: HumanPromotionReviewRecord,
  promotionGate: CrossProjectPromotionGateAssessment,
): SimulationOutcomeValidationAssessment {
  const reasons: SimulationOutcomeValidationInvalidationReason[] = []
  const currentDryRunOutcomeFingerprint = dryRunOutcomeEvidenceFingerprint(
    dryRun,
    adapter,
    simulationGate,
  )

  const currentSimulationGate = assessSimulationExecutionGate(
    validation,
    draft,
    executableReview,
    executableReviewGate,
    engineeringValidation,
    sourceDraft,
    promotionReview,
    promotionGate,
  )

  if (
    record.dryRunOutcomeFingerprint.value !==
      currentDryRunOutcomeFingerprint.value
    || dryRun.executionFingerprint.value !==
      localSimulationExecutionFingerprint(
        adapter,
        simulationGate,
        dryRun.inputSnapshot,
        dryRun.executedAt,
      ).value
  ) {
    reasons.push('DRY_RUN_OR_EXECUTION_FINGERPRINT_CHANGED')
  }

  if (!currentAdapterIsBoundToDraft(
    adapter,
    simulationGate,
    validation,
    draft,
  )) {
    reasons.push('RUNTIME_ADAPTER_CHANGED')
  }

  if (
    simulationGate.state !== 'ELIGIBLE_FOR_LOCAL_SIMULATION_EXECUTION'
    || !simulationGate.localSimulationExecutionCanStart
    || currentSimulationGate.state !==
      'ELIGIBLE_FOR_LOCAL_SIMULATION_EXECUTION'
    || currentSimulationGate.id !== simulationGate.id
  ) {
    reasons.push('SIMULATION_GATE_CHANGED_OR_BLOCKED')
  }

  if (!dryRunSourceMatches(
    dryRun,
    adapter,
    simulationGate,
    validation,
    draft,
  )) {
    reasons.push('DRY_RUN_SOURCE_CHAIN_CHANGED')
  }

  if (!dryRunSafetyBoundaryIntact(dryRun, adapter)) {
    reasons.push('DRY_RUN_SAFETY_BOUNDARY_BROKEN')
  }

  const state: SimulationOutcomeValidationRecordState =
    reasons.length === 0 ? 'CURRENT' : 'STALE_REQUIRES_REVIEW'

  return Object.freeze({
    recordId: record.id,
    state,
    reasons: Object.freeze(reasons),
    currentDryRunOutcomeFingerprint,
    outcomeDecisionCurrentlyUsableForSimulationEvidence:
      state === 'CURRENT'
      && record.decision ===
        'VALIDATED_AS_EXPECTED_SIMULATION_OUTCOME',
    engineeringRuleValidated: false,
    productionExecutable: false,
    machineInstructionGenerated: false,
    productionRuleCreated: false,
    productionUnlockAllowed: false,
    machineReady: false,
    productionApproved: false,
  })
}

export function recordSimulationOutcomeValidation(
  existingRecords: readonly SimulationOutcomeValidationRecord[],
  dryRun: LocalSimulationDryRunRecord,
  adapter: LocalSimulationRuntimeAdapter,
  simulationGate: SimulationExecutionGateAssessment,
  validation: SimulationValidationRecord,
  draft: NonProductionExecutableRuleDraftArtifact,
  executableReview: HumanExecutableRuleReviewRecord,
  executableReviewGate: ExecutableRuleReviewGateAssessment,
  engineeringValidation: RuleDraftEngineeringValidationRecord,
  sourceDraft: NonExecutableRuleDraftArtifact,
  promotionReview: HumanPromotionReviewRecord,
  promotionGate: CrossProjectPromotionGateAssessment,
  decision: SimulationOutcomeValidationDecision,
  expectedResult: boolean,
  validator: string,
  validatedAt: string,
  rationale: string,
): RecordSimulationOutcomeValidationResult {
  const reasons: SimulationOutcomeValidationFailureReason[] = []

  const currentSimulationGate = assessSimulationExecutionGate(
    validation,
    draft,
    executableReview,
    executableReviewGate,
    engineeringValidation,
    sourceDraft,
    promotionReview,
    promotionGate,
  )

  const currentExecutionFingerprint = localSimulationExecutionFingerprint(
    adapter,
    simulationGate,
    dryRun.inputSnapshot,
    dryRun.executedAt,
  )

  if (
    dryRun.dryRunCompleted !== true
    || dryRun.localSimulationExecutionCompleted !== true
  ) {
    reasons.push('DRY_RUN_RECORD_NOT_COMPLETE')
  }

  if (!dryRunSourceMatches(
    dryRun,
    adapter,
    simulationGate,
    validation,
    draft,
  )) {
    reasons.push('DRY_RUN_RECORD_SOURCE_MISMATCH')
  }

  if (!dryRunSafetyBoundaryIntact(dryRun, adapter)) {
    reasons.push('DRY_RUN_RECORD_SAFETY_BOUNDARY_BROKEN')
  }

  if (
    !currentAdapterIsBoundToDraft(
      adapter,
      simulationGate,
      validation,
      draft,
    )
    || adapter.sourceDraftFingerprint === ''
  ) {
    reasons.push('RUNTIME_ADAPTER_NOT_CURRENT')
  }

  if (
    simulationGate.state !== 'ELIGIBLE_FOR_LOCAL_SIMULATION_EXECUTION'
    || !simulationGate.localSimulationExecutionCanStart
    || currentSimulationGate.state !==
      'ELIGIBLE_FOR_LOCAL_SIMULATION_EXECUTION'
    || currentSimulationGate.id !== simulationGate.id
    || currentExecutionFingerprint.value !==
      dryRun.executionFingerprint.value
  ) {
    reasons.push('SIMULATION_GATE_NOT_ELIGIBLE')
  }

  if (!validator.trim()) reasons.push('VALIDATOR_REQUIRED')
  if (!validatedAt.trim()) reasons.push('VALIDATION_TIMESTAMP_REQUIRED')
  if (!rationale.trim()) reasons.push('RATIONALE_REQUIRED')

  if (
    decision === 'VALIDATED_AS_EXPECTED_SIMULATION_OUTCOME'
    && expectedResult !== dryRun.result
  ) {
    reasons.push('EXPECTED_RESULT_MISMATCH')
  }

  const fingerprint = dryRunOutcomeEvidenceFingerprint(
    dryRun,
    adapter,
    simulationGate,
  )

  if (existingRecords.some((record) =>
    record.dryRunRecordId === dryRun.id
    && record.dryRunOutcomeFingerprint.value === fingerprint.value
  )) {
    reasons.push('CURRENT_OUTCOME_VALIDATION_ALREADY_RECORDED')
  }

  if (reasons.length > 0) {
    return Object.freeze({
      status: 'NOT_RECORDED',
      reasons: Object.freeze(reasons),
      record: null,
    })
  }

  const validated =
    decision === 'VALIDATED_AS_EXPECTED_SIMULATION_OUTCOME'

  const record: SimulationOutcomeValidationRecord = Object.freeze({
    id: [
      'rp01-13-outcome-validation',
      encodeURIComponent(dryRun.id),
      encodeURIComponent(validatedAt),
      encodeURIComponent(validator.trim()),
    ].join(':'),
    recordType: SIMULATION_OUTCOME_VALIDATION_RECORD,
    dryRunRecordId: dryRun.id,
    adapterId: adapter.id,
    executableDraftArtifactId: draft.id,
    simulationExecutionGateId: simulationGate.id,
    simulationValidationRecordId: validation.id,
    profileCode: draft.profileCode,
    candidateKind: draft.candidateKind,
    sourcePatternKey: draft.sourcePatternKey,
    operationName: draft.operationName,
    dryRunResult: dryRun.result,
    expectedResult,
    decision,
    validator: validator.trim(),
    validatedAt,
    rationale: rationale.trim(),
    dryRunOutcomeFingerprint: fingerprint,
    validationScope: 'SIMULATION_OUTCOME_ONLY',
    humanSimulationOutcomeDecisionRecorded: true,
    simulationOutcomeValidated: validated,
    simulationOutcomeRejected: !validated,
    engineeringRuleValidated: false,
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
