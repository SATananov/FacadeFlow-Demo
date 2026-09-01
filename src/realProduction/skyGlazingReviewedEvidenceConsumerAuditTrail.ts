import {
  assessReviewedEvidenceConsumerAction,
  type ReviewedEvidenceConsumerAction,
  type ReviewedEvidenceConsumerActionAssessment,
  type ReviewedEvidenceConsumerContract,
} from './skyGlazingReviewedEvidenceConsumerContract'

export const REVIEWED_EVIDENCE_CONSUMER_USAGE_EVENT =
  'REVIEWED_EVIDENCE_CONSUMER_USAGE_EVENT' as const
export const REVIEWED_EVIDENCE_CONSUMER_AUDIT_TRAIL =
  'REVIEWED_EVIDENCE_CONSUMER_AUDIT_TRAIL' as const
export const RP01_20_USAGE_EVENT_VERSION =
  'RP01.20-CONSUMER-USAGE-EVENT-V1' as const

export type ReviewedEvidenceConsumerKind =
  | 'UI'
  | 'AI_CONTEXT'

export type ReviewedEvidenceConsumerUsageOutcome =
  | 'ALLOWED_READ_ONLY'
  | 'BLOCKED'

export type ReviewedEvidenceConsumerUsageEventFailureReason =
  | 'CONSUMER_ID_REQUIRED'
  | 'EVENT_TIMESTAMP_REQUIRED'
  | 'REQUEST_CONTEXT_REQUIRED'
  | 'ACTION_CONSUMER_KIND_MISMATCH'

export interface ReviewedEvidenceConsumerUsageEvent {
  id: string
  eventType: typeof REVIEWED_EVIDENCE_CONSUMER_USAGE_EVENT
  eventVersion: typeof RP01_20_USAGE_EVENT_VERSION
  consumerKind: ReviewedEvidenceConsumerKind
  consumerId: string
  action: ReviewedEvidenceConsumerAction
  outcome: ReviewedEvidenceConsumerUsageOutcome
  actionReason: ReviewedEvidenceConsumerActionAssessment['reason']
  eventTimestamp: string
  requestContext: string
  scenarioIdentityJson: string
  contractState: ReviewedEvidenceConsumerContract['state']
  contractVersion: ReviewedEvidenceConsumerContract['contractVersion']
  evidenceReferencePresent: boolean
  exactReviewedScenarioScopePreserved: true
  readOnlyUsage: true
  automaticOutcomeInferenceAllowed: false
  inferredOutcome: null
  scenarioGeneralizationAllowed: false
  inferenceBeyondReviewedScenariosAllowed: false
  engineeringAuthorityGranted: false
  productionAuthorityGranted: false
  machineInstructionGenerated: false
  productionUnlockAllowed: false
}

export interface ReviewedEvidenceConsumerAuditTrail {
  auditTrailType: typeof REVIEWED_EVIDENCE_CONSUMER_AUDIT_TRAIL
  eventCount: number
  allowedReadOnlyEventCount: number
  blockedEventCount: number
  uiEventCount: number
  aiContextEventCount: number
  events: readonly ReviewedEvidenceConsumerUsageEvent[]
  appendOnly: true
  readOnlyEvidenceUsageOnly: true
  automaticOutcomeInferenceAllowed: false
  engineeringAuthorityGranted: false
  productionAuthorityGranted: false
  machineInstructionGenerated: false
  productionUnlockAllowed: false
}

export interface RecordReviewedEvidenceConsumerUsageEventResult {
  status: 'RECORDED' | 'NOT_RECORDED'
  reasons: readonly ReviewedEvidenceConsumerUsageEventFailureReason[]
  event: ReviewedEvidenceConsumerUsageEvent | null
  auditTrail: ReviewedEvidenceConsumerAuditTrail
}

function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

function emptyAuditTrail(): ReviewedEvidenceConsumerAuditTrail {
  return Object.freeze({
    auditTrailType: REVIEWED_EVIDENCE_CONSUMER_AUDIT_TRAIL,
    eventCount: 0,
    allowedReadOnlyEventCount: 0,
    blockedEventCount: 0,
    uiEventCount: 0,
    aiContextEventCount: 0,
    events: Object.freeze([]),
    appendOnly: true,
    readOnlyEvidenceUsageOnly: true,
    automaticOutcomeInferenceAllowed: false,
    engineeringAuthorityGranted: false,
    productionAuthorityGranted: false,
    machineInstructionGenerated: false,
    productionUnlockAllowed: false,
  })
}

export function buildReviewedEvidenceConsumerAuditTrail(
  events: readonly ReviewedEvidenceConsumerUsageEvent[],
): ReviewedEvidenceConsumerAuditTrail {
  const sorted = [...events].sort((a, b) => {
    const time = compareText(a.eventTimestamp, b.eventTimestamp)
    return time !== 0 ? time : compareText(a.id, b.id)
  })

  return Object.freeze({
    auditTrailType: REVIEWED_EVIDENCE_CONSUMER_AUDIT_TRAIL,
    eventCount: sorted.length,
    allowedReadOnlyEventCount: sorted.filter((event) =>
      event.outcome === 'ALLOWED_READ_ONLY',
    ).length,
    blockedEventCount: sorted.filter((event) =>
      event.outcome === 'BLOCKED',
    ).length,
    uiEventCount: sorted.filter((event) =>
      event.consumerKind === 'UI',
    ).length,
    aiContextEventCount: sorted.filter((event) =>
      event.consumerKind === 'AI_CONTEXT',
    ).length,
    events: Object.freeze(sorted),
    appendOnly: true,
    readOnlyEvidenceUsageOnly: true,
    automaticOutcomeInferenceAllowed: false,
    engineeringAuthorityGranted: false,
    productionAuthorityGranted: false,
    machineInstructionGenerated: false,
    productionUnlockAllowed: false,
  })
}

function actionMatchesConsumerKind(
  consumerKind: ReviewedEvidenceConsumerKind,
  action: ReviewedEvidenceConsumerAction,
): boolean {
  if (action === 'DISPLAY_REVIEWED_EVIDENCE') {
    return consumerKind === 'UI'
  }

  if (action === 'EXPOSE_REVIEWED_EVIDENCE_TO_AI_CONTEXT') {
    return consumerKind === 'AI_CONTEXT'
  }

  return true
}

export function recordReviewedEvidenceConsumerUsageEvent(
  existingEvents: readonly ReviewedEvidenceConsumerUsageEvent[],
  contract: ReviewedEvidenceConsumerContract,
  consumerKind: ReviewedEvidenceConsumerKind,
  consumerId: string,
  action: ReviewedEvidenceConsumerAction,
  eventTimestamp: string,
  requestContext: string,
): RecordReviewedEvidenceConsumerUsageEventResult {
  const reasons: ReviewedEvidenceConsumerUsageEventFailureReason[] = []

  if (!consumerId.trim()) reasons.push('CONSUMER_ID_REQUIRED')
  if (!eventTimestamp.trim()) reasons.push('EVENT_TIMESTAMP_REQUIRED')
  if (!requestContext.trim()) reasons.push('REQUEST_CONTEXT_REQUIRED')
  if (!actionMatchesConsumerKind(consumerKind, action)) {
    reasons.push('ACTION_CONSUMER_KIND_MISMATCH')
  }

  if (reasons.length > 0) {
    return Object.freeze({
      status: 'NOT_RECORDED',
      reasons: Object.freeze(reasons),
      event: null,
      auditTrail:
        existingEvents.length > 0
          ? buildReviewedEvidenceConsumerAuditTrail(existingEvents)
          : emptyAuditTrail(),
    })
  }

  const actionAssessment =
    assessReviewedEvidenceConsumerAction(contract, action)

  const event: ReviewedEvidenceConsumerUsageEvent = Object.freeze({
    id: [
      'rp01-20-consumer-usage',
      encodeURIComponent(eventTimestamp),
      encodeURIComponent(consumerKind),
      encodeURIComponent(consumerId.trim()),
      encodeURIComponent(action),
    ].join(':'),
    eventType: REVIEWED_EVIDENCE_CONSUMER_USAGE_EVENT,
    eventVersion: RP01_20_USAGE_EVENT_VERSION,
    consumerKind,
    consumerId: consumerId.trim(),
    action,
    outcome: actionAssessment.decision,
    actionReason: actionAssessment.reason,
    eventTimestamp,
    requestContext: requestContext.trim(),
    scenarioIdentityJson: contract.scenarioIdentityJson,
    contractState: contract.state,
    contractVersion: contract.contractVersion,
    evidenceReferencePresent:
      contract.evidenceProjection !== null,
    exactReviewedScenarioScopePreserved: true,
    readOnlyUsage: true,
    automaticOutcomeInferenceAllowed: false,
    inferredOutcome: null,
    scenarioGeneralizationAllowed: false,
    inferenceBeyondReviewedScenariosAllowed: false,
    engineeringAuthorityGranted: false,
    productionAuthorityGranted: false,
    machineInstructionGenerated: false,
    productionUnlockAllowed: false,
  })

  return Object.freeze({
    status: 'RECORDED',
    reasons: Object.freeze([]),
    event,
    auditTrail:
      buildReviewedEvidenceConsumerAuditTrail([
        ...existingEvents,
        event,
      ]),
  })
}
