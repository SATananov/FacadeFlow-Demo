import type {
  NonProductionExecutableRuleDraftArtifact,
} from './skyGlazingHumanExecutableRuleReview'
import {
  assessHumanSimulationRepeatabilityReviewRecord,
  simulationRepeatabilityEvidenceFingerprint,
  type HumanSimulationRepeatabilityReviewRecord,
  type SimulationRepeatabilityEvidenceGroup,
} from './skyGlazingSimulationRepeatability'

export const CROSS_SCENARIO_SIMULATION_EVIDENCE_COMPARISON =
  'CROSS_SCENARIO_SIMULATION_EVIDENCE_COMPARISON' as const
export const HUMAN_SCENARIO_CONSISTENCY_REVIEW_RECORD =
  'HUMAN_SCENARIO_CONSISTENCY_REVIEW_RECORD' as const
export const RP01_15_SCENARIO_CONSISTENCY_FINGERPRINT_VERSION =
  'RP01.15-SCENARIO-CONSISTENCY-V1' as const

export type CrossScenarioConsistencyState =
  | 'INSUFFICIENT_SCENARIO_COVERAGE'
  | 'CANDIDATE_CONSISTENT_ACROSS_REVIEWED_SCENARIOS'
  | 'CONFLICTING_SCENARIO_REVIEW_EVIDENCE'

export type HumanScenarioConsistencyDecision =
  | 'CONFIRMED_CONSISTENT_ACROSS_REVIEWED_SIMULATION_SCENARIOS'
  | 'REJECTED_SCENARIO_CONSISTENCY'

export type HumanScenarioConsistencyReviewState =
  | 'CURRENT'
  | 'STALE_REQUIRES_REVIEW'

export type HumanScenarioConsistencyReviewFailureReason =
  | 'SCENARIO_CONSISTENCY_EVIDENCE_NOT_CANDIDATE'
  | 'REVIEWER_REQUIRED'
  | 'REVIEW_TIMESTAMP_REQUIRED'
  | 'RATIONALE_REQUIRED'
  | 'CURRENT_SCENARIO_CONSISTENCY_REVIEW_ALREADY_RECORDED'

export type HumanScenarioConsistencyReviewInvalidationReason =
  | 'SCENARIO_CONSISTENCY_EVIDENCE_CHANGED'
  | 'SCENARIO_CONSISTENCY_EVIDENCE_NO_LONGER_CANDIDATE'

export interface ReviewedSimulationRepeatabilityPacket {
  repeatabilityGroup: SimulationRepeatabilityEvidenceGroup
  repeatabilityReview: HumanSimulationRepeatabilityReviewRecord
}

export interface CrossScenarioRuleIdentity {
  executableDraftArtifactId: string
  executableExpression: string
  executionContext: string
  profileCode: string
  candidateKind: NonProductionExecutableRuleDraftArtifact['candidateKind']
  sourcePatternKey: string
  operationName: string | null
}

export interface CrossScenarioEvidenceItem {
  repeatabilityGroupId: string
  repeatabilityReviewRecordId: string
  scenarioIdentityJson: string
  observedResults: readonly boolean[]
  expectedResults: readonly boolean[]
  repeatabilityGroupState:
    SimulationRepeatabilityEvidenceGroup['state']
  repeatabilityReviewDecision:
    HumanSimulationRepeatabilityReviewRecord['decision']
  repeatabilityReviewState: 'CURRENT' | 'STALE_REQUIRES_REVIEW'
  repeatabilityEvidenceFingerprint: string
  repeatabilityReviewFingerprint: string
  confirmedForSimulationContext: boolean
}

export interface CrossScenarioConsistencyEvidenceGroup {
  id: string
  comparisonType: typeof CROSS_SCENARIO_SIMULATION_EVIDENCE_COMPARISON
  ruleIdentity: CrossScenarioRuleIdentity
  scenarioCount: number
  currentConfirmedScenarioCount: number
  currentRejectedScenarioCount: number
  staleScenarioCount: number
  distinctObservedOutcomeSignatures: readonly string[]
  state: CrossScenarioConsistencyState
  scenarioConsistencyCandidate: boolean
  humanScenarioConsistencyReviewRequired: true
  inferenceBeyondReviewedScenariosAllowed: false
  engineeringRuleValidated: false
  automaticRulePromotionAllowed: false
  productionExecutable: false
  machineInstructionGenerated: false
  productionRuleCreated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
  evidence: readonly CrossScenarioEvidenceItem[]
}

export interface CrossScenarioConsistencyEvidenceSet {
  groupCount: number
  insufficientScenarioCoverageGroupCount: number
  candidateConsistencyGroupCount: number
  conflictingScenarioEvidenceGroupCount: number
  groups: readonly CrossScenarioConsistencyEvidenceGroup[]
  engineeringRuleValidated: false
  productionRuleCreated: false
  machineReady: false
  productionApproved: false
}

export interface ScenarioConsistencyEvidenceFingerprint {
  version: typeof RP01_15_SCENARIO_CONSISTENCY_FINGERPRINT_VERSION
  value: string
}

export interface HumanScenarioConsistencyReviewRecord {
  id: string
  recordType: typeof HUMAN_SCENARIO_CONSISTENCY_REVIEW_RECORD
  crossScenarioEvidenceGroupId: string
  decision: HumanScenarioConsistencyDecision
  reviewer: string
  reviewedAt: string
  rationale: string
  evidenceFingerprint: ScenarioConsistencyEvidenceFingerprint
  humanScenarioConsistencyReviewCompleted: true
  consistencyConfirmedAcrossReviewedSimulationScenarios: boolean
  consistencyRejectedAcrossReviewedSimulationScenarios: boolean
  inferenceBeyondReviewedScenariosAllowed: false
  engineeringRuleValidated: false
  automaticRulePromotionAllowed: false
  productionExecutable: false
  machineInstructionGenerated: false
  productionRuleCreated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

export interface HumanScenarioConsistencyReviewAssessment {
  recordId: string
  state: HumanScenarioConsistencyReviewState
  reasons: readonly HumanScenarioConsistencyReviewInvalidationReason[]
  currentEvidenceFingerprint: ScenarioConsistencyEvidenceFingerprint
  decisionCurrentlyUsableForReviewedScenarioConsistencyEvidence: boolean
  inferenceBeyondReviewedScenariosAllowed: false
  engineeringRuleValidated: false
  productionExecutable: false
  productionRuleCreated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

export interface RecordHumanScenarioConsistencyReviewResult {
  status: 'RECORDED' | 'NOT_RECORDED'
  reasons: readonly HumanScenarioConsistencyReviewFailureReason[]
  record: HumanScenarioConsistencyReviewRecord | null
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

function ruleIdentity(
  group: SimulationRepeatabilityEvidenceGroup,
): CrossScenarioRuleIdentity {
  return Object.freeze({
    executableDraftArtifactId:
      group.scenario.executableDraftArtifactId,
    executableExpression: group.scenario.executableExpression,
    executionContext: group.scenario.executionContext,
    profileCode: group.profileCode,
    candidateKind: group.candidateKind,
    sourcePatternKey: group.sourcePatternKey,
    operationName: group.operationName,
  })
}

function ruleKey(identity: CrossScenarioRuleIdentity): string {
  return canonicalJsonValue(identity)
}

function evidenceItem(
  packet: ReviewedSimulationRepeatabilityPacket,
): CrossScenarioEvidenceItem {
  const assessment =
    assessHumanSimulationRepeatabilityReviewRecord(
      packet.repeatabilityReview,
      packet.repeatabilityGroup,
    )

  return Object.freeze({
    repeatabilityGroupId: packet.repeatabilityGroup.id,
    repeatabilityReviewRecordId: packet.repeatabilityReview.id,
    scenarioIdentityJson:
      canonicalJsonValue(packet.repeatabilityGroup.scenario),
    observedResults:
      Object.freeze([...packet.repeatabilityGroup.observedResults]),
    expectedResults:
      Object.freeze([...packet.repeatabilityGroup.expectedResults]),
    repeatabilityGroupState: packet.repeatabilityGroup.state,
    repeatabilityReviewDecision:
      packet.repeatabilityReview.decision,
    repeatabilityReviewState: assessment.state,
    repeatabilityEvidenceFingerprint:
      simulationRepeatabilityEvidenceFingerprint(
        packet.repeatabilityGroup,
      ).value,
    repeatabilityReviewFingerprint:
      packet.repeatabilityReview.evidenceFingerprint.value,
    confirmedForSimulationContext:
      assessment.state === 'CURRENT'
      && packet.repeatabilityReview.decision ===
        'CONFIRMED_REPEATABLE_FOR_SIMULATION_CONTEXT',
  })
}

function crossScenarioState(
  evidence: readonly CrossScenarioEvidenceItem[],
): CrossScenarioConsistencyState {
  const distinctScenarios = new Set(
    evidence.map((item) => item.scenarioIdentityJson),
  )
  if (distinctScenarios.size < 2) {
    return 'INSUFFICIENT_SCENARIO_COVERAGE'
  }

  const allCurrentConfirmed = evidence.every((item) =>
    item.repeatabilityReviewState === 'CURRENT'
    && item.repeatabilityGroupState ===
      'CANDIDATE_REPEATABLE_OUTCOME'
    && item.confirmedForSimulationContext,
  )

  if (allCurrentConfirmed) {
    return 'CANDIDATE_CONSISTENT_ACROSS_REVIEWED_SCENARIOS'
  }

  return 'CONFLICTING_SCENARIO_REVIEW_EVIDENCE'
}

export function buildCrossScenarioConsistencyEvidenceSet(
  packets: readonly ReviewedSimulationRepeatabilityPacket[],
): CrossScenarioConsistencyEvidenceSet {
  const grouped = new Map<
    string,
    {
      identity: CrossScenarioRuleIdentity
      packets: ReviewedSimulationRepeatabilityPacket[]
    }
  >()

  for (const packet of packets) {
    const identity = ruleIdentity(packet.repeatabilityGroup)
    const key = ruleKey(identity)
    const existing = grouped.get(key)
    if (existing) {
      existing.packets.push(packet)
    } else {
      grouped.set(key, { identity, packets: [packet] })
    }
  }

  const groups = [...grouped.entries()]
    .sort(([a], [b]) => compareText(a, b))
    .map(([key, value]) => {
      const evidence = value.packets
        .map((packet) => evidenceItem(packet))
        .sort((a, b) =>
          compareText(
            a.scenarioIdentityJson,
            b.scenarioIdentityJson,
          ),
        )

      const state = crossScenarioState(evidence)
      const currentConfirmedScenarioCount =
        evidence.filter((item) =>
          item.repeatabilityReviewState === 'CURRENT'
          && item.confirmedForSimulationContext,
        ).length
      const currentRejectedScenarioCount =
        evidence.filter((item) =>
          item.repeatabilityReviewState === 'CURRENT'
          && item.repeatabilityReviewDecision ===
            'REJECTED_REPEATABILITY_FOR_SIMULATION_CONTEXT',
        ).length
      const staleScenarioCount =
        evidence.filter((item) =>
          item.repeatabilityReviewState ===
            'STALE_REQUIRES_REVIEW',
        ).length

      const outcomeSignatures = [
        ...new Set(
          evidence.map((item) =>
            canonicalJsonValue({
              observedResults: item.observedResults,
              expectedResults: item.expectedResults,
            }),
          ),
        ),
      ].sort(compareText)

      return Object.freeze({
        id: `rp01-15-cross-scenario:${encodeURIComponent(key)}`,
        comparisonType:
          CROSS_SCENARIO_SIMULATION_EVIDENCE_COMPARISON,
        ruleIdentity: value.identity,
        scenarioCount: new Set(
          evidence.map((item) => item.scenarioIdentityJson),
        ).size,
        currentConfirmedScenarioCount,
        currentRejectedScenarioCount,
        staleScenarioCount,
        distinctObservedOutcomeSignatures:
          Object.freeze(outcomeSignatures),
        state,
        scenarioConsistencyCandidate:
          state ===
            'CANDIDATE_CONSISTENT_ACROSS_REVIEWED_SCENARIOS',
        humanScenarioConsistencyReviewRequired: true,
        inferenceBeyondReviewedScenariosAllowed: false,
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
    insufficientScenarioCoverageGroupCount:
      groups.filter((group) =>
        group.state === 'INSUFFICIENT_SCENARIO_COVERAGE',
      ).length,
    candidateConsistencyGroupCount:
      groups.filter((group) =>
        group.state ===
          'CANDIDATE_CONSISTENT_ACROSS_REVIEWED_SCENARIOS',
      ).length,
    conflictingScenarioEvidenceGroupCount:
      groups.filter((group) =>
        group.state ===
          'CONFLICTING_SCENARIO_REVIEW_EVIDENCE',
      ).length,
    groups: Object.freeze(groups),
    engineeringRuleValidated: false,
    productionRuleCreated: false,
    machineReady: false,
    productionApproved: false,
  })
}

export function scenarioConsistencyEvidenceFingerprint(
  group: CrossScenarioConsistencyEvidenceGroup,
): ScenarioConsistencyEvidenceFingerprint {
  return Object.freeze({
    version: RP01_15_SCENARIO_CONSISTENCY_FINGERPRINT_VERSION,
    value: JSON.stringify({
      version: RP01_15_SCENARIO_CONSISTENCY_FINGERPRINT_VERSION,
      groupId: group.id,
      ruleIdentity: group.ruleIdentity,
      scenarioCount: group.scenarioCount,
      currentConfirmedScenarioCount:
        group.currentConfirmedScenarioCount,
      currentRejectedScenarioCount:
        group.currentRejectedScenarioCount,
      staleScenarioCount: group.staleScenarioCount,
      distinctObservedOutcomeSignatures:
        [...group.distinctObservedOutcomeSignatures],
      state: group.state,
      evidence: [...group.evidence].map((item) => ({
        repeatabilityGroupId: item.repeatabilityGroupId,
        repeatabilityReviewRecordId:
          item.repeatabilityReviewRecordId,
        scenarioIdentityJson: item.scenarioIdentityJson,
        observedResults: [...item.observedResults],
        expectedResults: [...item.expectedResults],
        repeatabilityGroupState: item.repeatabilityGroupState,
        repeatabilityReviewDecision:
          item.repeatabilityReviewDecision,
        repeatabilityReviewState:
          item.repeatabilityReviewState,
        repeatabilityEvidenceFingerprint:
          item.repeatabilityEvidenceFingerprint,
        repeatabilityReviewFingerprint:
          item.repeatabilityReviewFingerprint,
        confirmedForSimulationContext:
          item.confirmedForSimulationContext,
      })),
    }),
  })
}

export function recordHumanScenarioConsistencyReview(
  existingRecords: readonly HumanScenarioConsistencyReviewRecord[],
  group: CrossScenarioConsistencyEvidenceGroup,
  decision: HumanScenarioConsistencyDecision,
  reviewer: string,
  reviewedAt: string,
  rationale: string,
): RecordHumanScenarioConsistencyReviewResult {
  const reasons: HumanScenarioConsistencyReviewFailureReason[] = []
  const fingerprint = scenarioConsistencyEvidenceFingerprint(group)

  if (
    group.state !==
      'CANDIDATE_CONSISTENT_ACROSS_REVIEWED_SCENARIOS'
  ) {
    reasons.push('SCENARIO_CONSISTENCY_EVIDENCE_NOT_CANDIDATE')
  }
  if (!reviewer.trim()) reasons.push('REVIEWER_REQUIRED')
  if (!reviewedAt.trim()) reasons.push('REVIEW_TIMESTAMP_REQUIRED')
  if (!rationale.trim()) reasons.push('RATIONALE_REQUIRED')

  if (existingRecords.some((record) =>
    record.crossScenarioEvidenceGroupId === group.id
    && record.evidenceFingerprint.value === fingerprint.value
  )) {
    reasons.push(
      'CURRENT_SCENARIO_CONSISTENCY_REVIEW_ALREADY_RECORDED',
    )
  }

  if (reasons.length > 0) {
    return Object.freeze({
      status: 'NOT_RECORDED',
      reasons: Object.freeze(reasons),
      record: null,
    })
  }

  const confirmed =
    decision ===
      'CONFIRMED_CONSISTENT_ACROSS_REVIEWED_SIMULATION_SCENARIOS'

  const record: HumanScenarioConsistencyReviewRecord = Object.freeze({
    id: [
      'rp01-15-scenario-consistency-review',
      encodeURIComponent(group.id),
      encodeURIComponent(reviewedAt),
      encodeURIComponent(reviewer.trim()),
    ].join(':'),
    recordType: HUMAN_SCENARIO_CONSISTENCY_REVIEW_RECORD,
    crossScenarioEvidenceGroupId: group.id,
    decision,
    reviewer: reviewer.trim(),
    reviewedAt,
    rationale: rationale.trim(),
    evidenceFingerprint: fingerprint,
    humanScenarioConsistencyReviewCompleted: true,
    consistencyConfirmedAcrossReviewedSimulationScenarios:
      confirmed,
    consistencyRejectedAcrossReviewedSimulationScenarios:
      !confirmed,
    inferenceBeyondReviewedScenariosAllowed: false,
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

export function assessHumanScenarioConsistencyReviewRecord(
  record: HumanScenarioConsistencyReviewRecord,
  currentGroup: CrossScenarioConsistencyEvidenceGroup,
): HumanScenarioConsistencyReviewAssessment {
  const reasons: HumanScenarioConsistencyReviewInvalidationReason[] = []
  const currentEvidenceFingerprint =
    scenarioConsistencyEvidenceFingerprint(currentGroup)

  if (
    record.evidenceFingerprint.value !==
      currentEvidenceFingerprint.value
  ) {
    reasons.push('SCENARIO_CONSISTENCY_EVIDENCE_CHANGED')
  }

  if (
    currentGroup.state !==
      'CANDIDATE_CONSISTENT_ACROSS_REVIEWED_SCENARIOS'
  ) {
    reasons.push(
      'SCENARIO_CONSISTENCY_EVIDENCE_NO_LONGER_CANDIDATE',
    )
  }

  const state: HumanScenarioConsistencyReviewState =
    reasons.length === 0 ? 'CURRENT' : 'STALE_REQUIRES_REVIEW'

  return Object.freeze({
    recordId: record.id,
    state,
    reasons: Object.freeze(reasons),
    currentEvidenceFingerprint,
    decisionCurrentlyUsableForReviewedScenarioConsistencyEvidence:
      state === 'CURRENT'
      && record.decision ===
        'CONFIRMED_CONSISTENT_ACROSS_REVIEWED_SIMULATION_SCENARIOS',
    inferenceBeyondReviewedScenariosAllowed: false,
    engineeringRuleValidated: false,
    productionExecutable: false,
    productionRuleCreated: false,
    productionUnlockAllowed: false,
    machineReady: false,
    productionApproved: false,
  })
}
