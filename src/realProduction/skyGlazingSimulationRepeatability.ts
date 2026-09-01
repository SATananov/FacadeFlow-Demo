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
import type {
  SimulationExecutionGateAssessment,
  SimulationValidationRecord,
} from './skyGlazingSimulationExecutionGate'
import type {
  LocalSimulationDryRunRecord,
  LocalSimulationRuntimeAdapter,
} from './skyGlazingLocalSimulationRuntime'
import {
  assessSimulationOutcomeValidationRecord,
  type SimulationOutcomeValidationRecord,
} from './skyGlazingSimulationOutcomeValidation'

export const SIMULATION_REPEATABILITY_EVIDENCE_AGGREGATION =
  'SIMULATION_REPEATABILITY_EVIDENCE_AGGREGATION' as const
export const HUMAN_SIMULATION_REPEATABILITY_REVIEW_RECORD =
  'HUMAN_SIMULATION_REPEATABILITY_REVIEW_RECORD' as const
export const RP01_14_REPEATABILITY_FINGERPRINT_VERSION =
  'RP01.14-REPEATABILITY-V1' as const

export type SimulationRepeatabilityState =
  | 'INSUFFICIENT_REPEATABILITY_EVIDENCE'
  | 'CANDIDATE_REPEATABLE_OUTCOME'
  | 'CONFLICTING_REPEATABILITY_EVIDENCE'

export type HumanSimulationRepeatabilityDecision =
  | 'CONFIRMED_REPEATABLE_FOR_SIMULATION_CONTEXT'
  | 'REJECTED_REPEATABILITY_FOR_SIMULATION_CONTEXT'

export type HumanSimulationRepeatabilityReviewState =
  | 'CURRENT'
  | 'STALE_REQUIRES_REVIEW'

export type HumanSimulationRepeatabilityReviewFailureReason =
  | 'REPEATABILITY_EVIDENCE_NOT_CANDIDATE'
  | 'REVIEWER_REQUIRED'
  | 'REVIEW_TIMESTAMP_REQUIRED'
  | 'RATIONALE_REQUIRED'
  | 'CURRENT_REPEATABILITY_REVIEW_ALREADY_RECORDED'

export type HumanSimulationRepeatabilityReviewInvalidationReason =
  | 'REPEATABILITY_EVIDENCE_CHANGED'
  | 'REPEATABILITY_EVIDENCE_NO_LONGER_CANDIDATE'

export interface SimulationOutcomeEvidencePacket {
  outcomeValidation: SimulationOutcomeValidationRecord
  dryRun: LocalSimulationDryRunRecord
  adapter: LocalSimulationRuntimeAdapter
  simulationGate: SimulationExecutionGateAssessment
  simulationValidation: SimulationValidationRecord
  draft: NonProductionExecutableRuleDraftArtifact
  executableReview: HumanExecutableRuleReviewRecord
  executableReviewGate: ExecutableRuleReviewGateAssessment
  engineeringValidation: RuleDraftEngineeringValidationRecord
  sourceDraft: NonExecutableRuleDraftArtifact
  promotionReview: HumanPromotionReviewRecord
  promotionGate: CrossProjectPromotionGateAssessment
}

export interface SimulationRepeatabilityScenarioIdentity {
  executableDraftArtifactId: string
  executableExpression: string
  executionContext: string
  inputSnapshotJson: string
  inputIdentifier: string
  comparisonOperator: '===' | '!=='
  expectedLiteralJson: string
}

export interface SimulationRepeatabilityEvidenceItem {
  outcomeValidationRecordId: string
  dryRunRecordId: string
  executedAt: string
  validationDecision: SimulationOutcomeValidationRecord['decision']
  dryRunResult: boolean
  expectedResult: boolean
  validationRecordState: 'CURRENT' | 'STALE_REQUIRES_REVIEW'
  validationFingerprint: string
}

export interface SimulationRepeatabilityEvidenceGroup {
  id: string
  aggregationType: typeof SIMULATION_REPEATABILITY_EVIDENCE_AGGREGATION
  scenario: SimulationRepeatabilityScenarioIdentity
  profileCode: string
  candidateKind: NonProductionExecutableRuleDraftArtifact['candidateKind']
  sourcePatternKey: string
  operationName: string | null
  evidenceItemCount: number
  distinctDryRunCount: number
  currentValidatedOutcomeCount: number
  currentRejectedOutcomeCount: number
  staleOutcomeCount: number
  observedResults: readonly boolean[]
  expectedResults: readonly boolean[]
  state: SimulationRepeatabilityState
  repeatabilityCandidate: boolean
  humanRepeatabilityReviewRequired: true
  crossScenarioInferenceAllowed: false
  engineeringRuleValidated: false
  automaticRulePromotionAllowed: false
  productionExecutable: false
  machineInstructionGenerated: false
  productionRuleCreated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
  evidence: readonly SimulationRepeatabilityEvidenceItem[]
}

export interface SimulationRepeatabilityEvidenceSet {
  groupCount: number
  insufficientEvidenceGroupCount: number
  candidateRepeatableGroupCount: number
  conflictingEvidenceGroupCount: number
  groups: readonly SimulationRepeatabilityEvidenceGroup[]
  engineeringRuleValidated: false
  productionRuleCreated: false
  machineReady: false
  productionApproved: false
}

export interface SimulationRepeatabilityEvidenceFingerprint {
  version: typeof RP01_14_REPEATABILITY_FINGERPRINT_VERSION
  value: string
}

export interface HumanSimulationRepeatabilityReviewRecord {
  id: string
  recordType: typeof HUMAN_SIMULATION_REPEATABILITY_REVIEW_RECORD
  repeatabilityEvidenceGroupId: string
  decision: HumanSimulationRepeatabilityDecision
  reviewer: string
  reviewedAt: string
  rationale: string
  evidenceFingerprint: SimulationRepeatabilityEvidenceFingerprint
  humanRepeatabilityReviewCompleted: true
  repeatabilityConfirmedForSimulationContext: boolean
  repeatabilityRejectedForSimulationContext: boolean
  crossScenarioInferenceAllowed: false
  engineeringRuleValidated: false
  automaticRulePromotionAllowed: false
  productionExecutable: false
  machineInstructionGenerated: false
  productionRuleCreated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

export interface HumanSimulationRepeatabilityReviewAssessment {
  recordId: string
  state: HumanSimulationRepeatabilityReviewState
  reasons: readonly HumanSimulationRepeatabilityReviewInvalidationReason[]
  currentEvidenceFingerprint: SimulationRepeatabilityEvidenceFingerprint
  decisionCurrentlyUsableForSimulationRepeatabilityEvidence: boolean
  engineeringRuleValidated: false
  productionExecutable: false
  productionRuleCreated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

export interface RecordHumanSimulationRepeatabilityReviewResult {
  status: 'RECORDED' | 'NOT_RECORDED'
  reasons: readonly HumanSimulationRepeatabilityReviewFailureReason[]
  record: HumanSimulationRepeatabilityReviewRecord | null
}

function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

function canonicalJsonValue(value: unknown): string {
  if (
    value === null
    || typeof value === 'boolean'
    || typeof value === 'number'
    || typeof value === 'string'
  ) {
    return JSON.stringify(value)
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJsonValue(item)).join(',')}]`
  }

  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value)
      .sort(([a], [b]) => compareText(a, b))
      .map(([key, item]) =>
        `${JSON.stringify(key)}:${canonicalJsonValue(item)}`,
      )
    return `{${entries.join(',')}}`
  }

  return JSON.stringify(String(value))
}

function scenarioIdentity(
  packet: SimulationOutcomeEvidencePacket,
): SimulationRepeatabilityScenarioIdentity {
  return Object.freeze({
    executableDraftArtifactId: packet.draft.id,
    executableExpression: packet.draft.executableExpression,
    executionContext: packet.draft.executionContext,
    inputSnapshotJson: canonicalJsonValue(packet.dryRun.inputSnapshot),
    inputIdentifier: packet.dryRun.inputIdentifier,
    comparisonOperator: packet.dryRun.comparisonOperator,
    expectedLiteralJson: canonicalJsonValue(packet.dryRun.expectedLiteral),
  })
}

function scenarioKey(
  scenario: SimulationRepeatabilityScenarioIdentity,
): string {
  return canonicalJsonValue(scenario)
}

function booleanValues(values: readonly boolean[]): readonly boolean[] {
  return Object.freeze(
    [...new Set(values)].sort((a, b) => Number(a) - Number(b)),
  )
}

function evidenceItem(
  packet: SimulationOutcomeEvidencePacket,
): SimulationRepeatabilityEvidenceItem {
  const assessment = assessSimulationOutcomeValidationRecord(
    packet.outcomeValidation,
    packet.dryRun,
    packet.adapter,
    packet.simulationGate,
    packet.simulationValidation,
    packet.draft,
    packet.executableReview,
    packet.executableReviewGate,
    packet.engineeringValidation,
    packet.sourceDraft,
    packet.promotionReview,
    packet.promotionGate,
  )

  return Object.freeze({
    outcomeValidationRecordId: packet.outcomeValidation.id,
    dryRunRecordId: packet.dryRun.id,
    executedAt: packet.dryRun.executedAt,
    validationDecision: packet.outcomeValidation.decision,
    dryRunResult: packet.dryRun.result,
    expectedResult: packet.outcomeValidation.expectedResult,
    validationRecordState: assessment.state,
    validationFingerprint:
      packet.outcomeValidation.dryRunOutcomeFingerprint.value,
  })
}

function repeatabilityState(
  evidence: readonly SimulationRepeatabilityEvidenceItem[],
): SimulationRepeatabilityState {
  const current = evidence.filter((item) =>
    item.validationRecordState === 'CURRENT',
  )
  const currentValidated = current.filter((item) =>
    item.validationDecision ===
      'VALIDATED_AS_EXPECTED_SIMULATION_OUTCOME',
  )
  const currentRejected = current.filter((item) =>
    item.validationDecision === 'REJECTED_SIMULATION_OUTCOME',
  )
  const distinctDryRuns = new Set(
    currentValidated.map((item) => item.dryRunRecordId),
  ).size
  const observedResults = new Set(
    currentValidated.map((item) => item.dryRunResult),
  )
  const expectedResults = new Set(
    currentValidated.map((item) => item.expectedResult),
  )

  if (currentValidated.length < 2 || distinctDryRuns < 2) {
    return 'INSUFFICIENT_REPEATABILITY_EVIDENCE'
  }

  if (
    currentRejected.length === 0
    && observedResults.size === 1
    && expectedResults.size === 1
  ) {
    return 'CANDIDATE_REPEATABLE_OUTCOME'
  }

  return 'CONFLICTING_REPEATABILITY_EVIDENCE'
}

export function buildSimulationRepeatabilityEvidenceSet(
  packets: readonly SimulationOutcomeEvidencePacket[],
): SimulationRepeatabilityEvidenceSet {
  const grouped = new Map<
    string,
    {
      scenario: SimulationRepeatabilityScenarioIdentity
      packets: SimulationOutcomeEvidencePacket[]
    }
  >()

  for (const packet of packets) {
    const scenario = scenarioIdentity(packet)
    const key = scenarioKey(scenario)
    const existing = grouped.get(key)
    if (existing) {
      existing.packets.push(packet)
    } else {
      grouped.set(key, { scenario, packets: [packet] })
    }
  }

  const groups = [...grouped.entries()]
    .sort(([a], [b]) => compareText(a, b))
    .map(([key, value]) => {
      const evidence = value.packets
        .map((packet) => evidenceItem(packet))
        .sort((a, b) =>
          compareText(a.dryRunRecordId, b.dryRunRecordId),
        )

      const current = evidence.filter((item) =>
        item.validationRecordState === 'CURRENT',
      )
      const currentValidated = current.filter((item) =>
        item.validationDecision ===
          'VALIDATED_AS_EXPECTED_SIMULATION_OUTCOME',
      )
      const currentRejected = current.filter((item) =>
        item.validationDecision === 'REJECTED_SIMULATION_OUTCOME',
      )
      const state = repeatabilityState(evidence)
      const firstPacket = value.packets[0]

      return Object.freeze({
        id: `rp01-14-repeatability:${encodeURIComponent(key)}`,
        aggregationType: SIMULATION_REPEATABILITY_EVIDENCE_AGGREGATION,
        scenario: value.scenario,
        profileCode: firstPacket.draft.profileCode,
        candidateKind: firstPacket.draft.candidateKind,
        sourcePatternKey: firstPacket.draft.sourcePatternKey,
        operationName: firstPacket.draft.operationName,
        evidenceItemCount: evidence.length,
        distinctDryRunCount: new Set(
          current.map((item) => item.dryRunRecordId),
        ).size,
        currentValidatedOutcomeCount: currentValidated.length,
        currentRejectedOutcomeCount: currentRejected.length,
        staleOutcomeCount:
          evidence.length - current.length,
        observedResults: booleanValues(
          currentValidated.map((item) => item.dryRunResult),
        ),
        expectedResults: booleanValues(
          currentValidated.map((item) => item.expectedResult),
        ),
        state,
        repeatabilityCandidate:
          state === 'CANDIDATE_REPEATABLE_OUTCOME',
        humanRepeatabilityReviewRequired: true,
        crossScenarioInferenceAllowed: false,
        engineeringRuleValidated: false,
        automaticRulePromotionAllowed: false,
        productionExecutable: false,
        machineInstructionGenerated: false,
        productionRuleCreated: false,
        productionUnlockAllowed: false,
        machineReady: false,
        productionApproved: false,
        evidence: Object.freeze(evidence),
      })
    })

  return Object.freeze({
    groupCount: groups.length,
    insufficientEvidenceGroupCount: groups.filter((group) =>
      group.state === 'INSUFFICIENT_REPEATABILITY_EVIDENCE',
    ).length,
    candidateRepeatableGroupCount: groups.filter((group) =>
      group.state === 'CANDIDATE_REPEATABLE_OUTCOME',
    ).length,
    conflictingEvidenceGroupCount: groups.filter((group) =>
      group.state === 'CONFLICTING_REPEATABILITY_EVIDENCE',
    ).length,
    groups: Object.freeze(groups),
    engineeringRuleValidated: false,
    productionRuleCreated: false,
    machineReady: false,
    productionApproved: false,
  })
}

export function simulationRepeatabilityEvidenceFingerprint(
  group: SimulationRepeatabilityEvidenceGroup,
): SimulationRepeatabilityEvidenceFingerprint {
  return Object.freeze({
    version: RP01_14_REPEATABILITY_FINGERPRINT_VERSION,
    value: JSON.stringify({
      version: RP01_14_REPEATABILITY_FINGERPRINT_VERSION,
      groupId: group.id,
      scenario: group.scenario,
      profileCode: group.profileCode,
      candidateKind: group.candidateKind,
      sourcePatternKey: group.sourcePatternKey,
      operationName: group.operationName,
      evidenceItemCount: group.evidenceItemCount,
      distinctDryRunCount: group.distinctDryRunCount,
      currentValidatedOutcomeCount:
        group.currentValidatedOutcomeCount,
      currentRejectedOutcomeCount:
        group.currentRejectedOutcomeCount,
      staleOutcomeCount: group.staleOutcomeCount,
      observedResults: [...group.observedResults],
      expectedResults: [...group.expectedResults],
      state: group.state,
      evidence: [...group.evidence].map((item) => ({
        outcomeValidationRecordId:
          item.outcomeValidationRecordId,
        dryRunRecordId: item.dryRunRecordId,
        executedAt: item.executedAt,
        validationDecision: item.validationDecision,
        dryRunResult: item.dryRunResult,
        expectedResult: item.expectedResult,
        validationRecordState: item.validationRecordState,
        validationFingerprint: item.validationFingerprint,
      })),
    }),
  })
}

export function recordHumanSimulationRepeatabilityReview(
  existingRecords: readonly HumanSimulationRepeatabilityReviewRecord[],
  group: SimulationRepeatabilityEvidenceGroup,
  decision: HumanSimulationRepeatabilityDecision,
  reviewer: string,
  reviewedAt: string,
  rationale: string,
): RecordHumanSimulationRepeatabilityReviewResult {
  const reasons: HumanSimulationRepeatabilityReviewFailureReason[] = []
  const fingerprint = simulationRepeatabilityEvidenceFingerprint(group)

  if (group.state !== 'CANDIDATE_REPEATABLE_OUTCOME') {
    reasons.push('REPEATABILITY_EVIDENCE_NOT_CANDIDATE')
  }
  if (!reviewer.trim()) reasons.push('REVIEWER_REQUIRED')
  if (!reviewedAt.trim()) reasons.push('REVIEW_TIMESTAMP_REQUIRED')
  if (!rationale.trim()) reasons.push('RATIONALE_REQUIRED')

  if (existingRecords.some((record) =>
    record.repeatabilityEvidenceGroupId === group.id
    && record.evidenceFingerprint.value === fingerprint.value
  )) {
    reasons.push('CURRENT_REPEATABILITY_REVIEW_ALREADY_RECORDED')
  }

  if (reasons.length > 0) {
    return Object.freeze({
      status: 'NOT_RECORDED',
      reasons: Object.freeze(reasons),
      record: null,
    })
  }

  const confirmed =
    decision === 'CONFIRMED_REPEATABLE_FOR_SIMULATION_CONTEXT'

  const record: HumanSimulationRepeatabilityReviewRecord = Object.freeze({
    id: [
      'rp01-14-repeatability-review',
      encodeURIComponent(group.id),
      encodeURIComponent(reviewedAt),
      encodeURIComponent(reviewer.trim()),
    ].join(':'),
    recordType: HUMAN_SIMULATION_REPEATABILITY_REVIEW_RECORD,
    repeatabilityEvidenceGroupId: group.id,
    decision,
    reviewer: reviewer.trim(),
    reviewedAt,
    rationale: rationale.trim(),
    evidenceFingerprint: fingerprint,
    humanRepeatabilityReviewCompleted: true,
    repeatabilityConfirmedForSimulationContext: confirmed,
    repeatabilityRejectedForSimulationContext: !confirmed,
    crossScenarioInferenceAllowed: false,
    engineeringRuleValidated: false,
    automaticRulePromotionAllowed: false,
    productionExecutable: false,
    machineInstructionGenerated: false,
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

export function assessHumanSimulationRepeatabilityReviewRecord(
  record: HumanSimulationRepeatabilityReviewRecord,
  currentGroup: SimulationRepeatabilityEvidenceGroup,
): HumanSimulationRepeatabilityReviewAssessment {
  const reasons: HumanSimulationRepeatabilityReviewInvalidationReason[] = []
  const currentEvidenceFingerprint =
    simulationRepeatabilityEvidenceFingerprint(currentGroup)

  if (
    record.evidenceFingerprint.value !==
      currentEvidenceFingerprint.value
  ) {
    reasons.push('REPEATABILITY_EVIDENCE_CHANGED')
  }

  if (currentGroup.state !== 'CANDIDATE_REPEATABLE_OUTCOME') {
    reasons.push('REPEATABILITY_EVIDENCE_NO_LONGER_CANDIDATE')
  }

  const state: HumanSimulationRepeatabilityReviewState =
    reasons.length === 0 ? 'CURRENT' : 'STALE_REQUIRES_REVIEW'

  return Object.freeze({
    recordId: record.id,
    state,
    reasons: Object.freeze(reasons),
    currentEvidenceFingerprint,
    decisionCurrentlyUsableForSimulationRepeatabilityEvidence:
      state === 'CURRENT'
      && record.decision ===
        'CONFIRMED_REPEATABLE_FOR_SIMULATION_CONTEXT',
    engineeringRuleValidated: false,
    productionExecutable: false,
    productionRuleCreated: false,
    productionUnlockAllowed: false,
    machineReady: false,
    productionApproved: false,
  })
}
