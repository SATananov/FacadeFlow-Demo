import assert from 'node:assert/strict'
import { extname, join } from 'node:path'
import { readdirSync, readFileSync } from 'node:fs'
import test from 'node:test'
import {
  extractSkyGlazingLteObservations,
  extractSkyGlazingXmlObservations,
} from '../src/realProduction/skyGlazingObservationExtraction'
import { aggregateSkyGlazingObservationPatterns } from '../src/realProduction/skyGlazingObservationAggregation'
import {
  buildProductionPatternCandidateSet,
} from '../src/realProduction/skyGlazingProductionPatternCandidates'
import { buildProductionPatternCrossProjectCorroboration } from '../src/realProduction/skyGlazingCrossProjectCorroboration'
import {
  buildCrossProjectHumanPromotionGateAssessmentSet,
} from '../src/realProduction/skyGlazingCrossProjectPromotionGate'
import {
  buildReviewedEvidenceReadModel,
} from '../src/realProduction/skyGlazingReviewedEvidenceReadModel'
import {
  buildReviewedEvidenceConsumerContract,
} from '../src/realProduction/skyGlazingReviewedEvidenceConsumerContract'
import {
  buildReviewedEvidenceConsumerAuditTrail,
  recordReviewedEvidenceConsumerUsageEvent,
} from '../src/realProduction/skyGlazingReviewedEvidenceConsumerAuditTrail'
import type {
  ReviewedScenarioEvidenceQueryResult,
} from '../src/realProduction/skyGlazingReviewedScenarioEvidenceQuery'

const sampleDir = join(process.cwd(), 'local-samples', 'phase05a')
const names = readdirSync(sampleDir)
const xmlName = names.find((name) => extname(name).toLowerCase() === '.xml')
const lteName = names.find((name) => extname(name).toLowerCase() === '.lte')
if (!xmlName || !lteName) throw new Error('RP01.20 requires the locked Vadim XML/LTE sample pair.')

const xml = readFileSync(join(sampleDir, xmlName), 'utf8')
const lte = readFileSync(join(sampleDir, lteName)).toString('latin1')
const vadim = buildProductionPatternCandidateSet(
  aggregateSkyGlazingObservationPatterns(
    extractSkyGlazingXmlObservations(xml),
    extractSkyGlazingLteObservations(lte),
  ),
  'Вадим-2',
)

function availableQuery(): ReviewedScenarioEvidenceQueryResult {
  return Object.freeze({
    queryGateType: 'REVIEWED_SCENARIO_EVIDENCE_QUERY_GATE',
    queryGateVersion: 'RP01.17-EXACT-SCOPE-QUERY-V1',
    status: 'EVIDENCE_REFERENCE_AVAILABLE',
    reasons: Object.freeze([]),
    scenarioIdentityJson:
      '{"input":{"observedPatternMatches":true}}',
    exactScopeMatch: true,
    evidenceReference: Object.freeze({
      boundaryId: 'boundary-1',
      crossScenarioEvidenceGroupId: 'cross-scenario-group-1',
      scenarioConsistencyReviewRecordId:
        'scenario-consistency-review-1',
      scenarioIdentityJson:
        '{"input":{"observedPatternMatches":true}}',
      repeatabilityGroupId: 'repeatability-group-1',
      repeatabilityReviewRecordId: 'repeatability-review-1',
      repeatabilityEvidenceFingerprint:
        'repeatability-evidence-fingerprint-1',
      repeatabilityReviewFingerprint:
        'repeatability-review-fingerprint-1',
      observedResults: Object.freeze([true]),
      expectedResults: Object.freeze([true]),
      evidenceScope: 'EXACT_REVIEWED_SCENARIO_ONLY',
    }),
    reviewedSimulationEvidenceReferenceAvailable: true,
    automaticOutcomeInferenceAllowed: false,
    inferredOutcome: null,
    scenarioGeneralizationAllowed: false,
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
}

function unavailableQuery(): ReviewedScenarioEvidenceQueryResult {
  return Object.freeze({
    queryGateType: 'REVIEWED_SCENARIO_EVIDENCE_QUERY_GATE',
    queryGateVersion: 'RP01.17-EXACT-SCOPE-QUERY-V1',
    status: 'NO_REVIEWED_EVIDENCE',
    reasons: Object.freeze(['SCENARIO_OUTSIDE_REVIEWED_SCOPE']),
    scenarioIdentityJson:
      '{"input":{"observedPatternMatches":"UNSEEN"}}',
    exactScopeMatch: false,
    evidenceReference: null,
    reviewedSimulationEvidenceReferenceAvailable: false,
    automaticOutcomeInferenceAllowed: false,
    inferredOutcome: null,
    scenarioGeneralizationAllowed: false,
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
}

test('RP01.20 current real Vadim-only corpus remains blocked upstream', () => {
  const cross = buildProductionPatternCrossProjectCorroboration([vadim])
  const gates = buildCrossProjectHumanPromotionGateAssessmentSet(
    cross,
    [vadim],
    [],
  )
  assert.equal(gates.assessmentCount, 74)
  assert.equal(gates.eligibleForHumanPromotionReviewCount, 0)
})

test('RP01.20 records allowed UI display usage as read-only audit evidence', () => {
  const contract = buildReviewedEvidenceConsumerContract(
    buildReviewedEvidenceReadModel(availableQuery()),
  )

  const result = recordReviewedEvidenceConsumerUsageEvent(
    [],
    contract,
    'UI',
    'reviewed-evidence-panel',
    'DISPLAY_REVIEWED_EVIDENCE',
    '2026-09-01T23:00:00+03:00',
    'User opened reviewed evidence panel.',
  )

  assert.equal(result.status, 'RECORDED')
  assert.ok(result.event)
  assert.equal(result.event.outcome, 'ALLOWED_READ_ONLY')
  assert.equal(result.event.actionReason, 'READ_ONLY_EVIDENCE_ACTION')
  assert.equal(result.event.readOnlyUsage, true)
  assert.equal(result.auditTrail.allowedReadOnlyEventCount, 1)
  assert.equal(result.auditTrail.blockedEventCount, 0)
})

test('RP01.20 records allowed AI-context reference usage separately', () => {
  const contract = buildReviewedEvidenceConsumerContract(
    buildReviewedEvidenceReadModel(availableQuery()),
  )

  const result = recordReviewedEvidenceConsumerUsageEvent(
    [],
    contract,
    'AI_CONTEXT',
    'reviewed-evidence-context-provider',
    'EXPOSE_REVIEWED_EVIDENCE_TO_AI_CONTEXT',
    '2026-09-01T23:01:00+03:00',
    'Reviewed evidence added to AI context as reference only.',
  )

  assert.equal(result.status, 'RECORDED')
  assert.ok(result.event)
  assert.equal(result.event.consumerKind, 'AI_CONTEXT')
  assert.equal(result.event.outcome, 'ALLOWED_READ_ONLY')
  assert.equal(result.auditTrail.aiContextEventCount, 1)
})

test('RP01.20 records blocked prediction request without creating any prediction', () => {
  const contract = buildReviewedEvidenceConsumerContract(
    buildReviewedEvidenceReadModel(availableQuery()),
  )

  const result = recordReviewedEvidenceConsumerUsageEvent(
    [],
    contract,
    'AI_CONTEXT',
    'future-ai-consumer',
    'TREAT_EVIDENCE_AS_PREDICTION',
    '2026-09-01T23:02:00+03:00',
    'Consumer attempted to treat evidence as prediction.',
  )

  assert.equal(result.status, 'RECORDED')
  assert.ok(result.event)
  assert.equal(result.event.outcome, 'BLOCKED')
  assert.equal(result.event.actionReason, 'PREDICTION_NOT_ALLOWED')
  assert.equal(result.event.inferredOutcome, null)
  assert.equal(result.auditTrail.blockedEventCount, 1)
})

test('RP01.20 unavailable evidence still records blocked UI display attempt', () => {
  const contract = buildReviewedEvidenceConsumerContract(
    buildReviewedEvidenceReadModel(unavailableQuery()),
  )

  const result = recordReviewedEvidenceConsumerUsageEvent(
    [],
    contract,
    'UI',
    'reviewed-evidence-panel',
    'DISPLAY_REVIEWED_EVIDENCE',
    '2026-09-01T23:03:00+03:00',
    'Panel attempted read with no reviewed evidence.',
  )

  assert.equal(result.status, 'RECORDED')
  assert.ok(result.event)
  assert.equal(result.event.outcome, 'BLOCKED')
  assert.equal(
    result.event.actionReason,
    'NO_REVIEWED_EVIDENCE_AVAILABLE',
  )
  assert.equal(result.event.evidenceReferencePresent, false)
})

test('RP01.20 audit trail is deterministic and append-only in presentation order', () => {
  const contract = buildReviewedEvidenceConsumerContract(
    buildReviewedEvidenceReadModel(availableQuery()),
  )

  const later = recordReviewedEvidenceConsumerUsageEvent(
    [],
    contract,
    'AI_CONTEXT',
    'ai-consumer',
    'TREAT_EVIDENCE_AS_PREDICTION',
    '2026-09-01T23:10:00+03:00',
    'Blocked attempt.',
  ).event
  const earlier = recordReviewedEvidenceConsumerUsageEvent(
    [],
    contract,
    'UI',
    'ui-panel',
    'DISPLAY_REVIEWED_EVIDENCE',
    '2026-09-01T23:09:00+03:00',
    'Allowed display.',
  ).event

  assert.ok(later)
  assert.ok(earlier)

  const trail = buildReviewedEvidenceConsumerAuditTrail([
    later,
    earlier,
  ])

  assert.equal(trail.eventCount, 2)
  assert.equal(trail.events[0].id, earlier.id)
  assert.equal(trail.events[1].id, later.id)
  assert.equal(trail.appendOnly, true)
  assert.equal(trail.allowedReadOnlyEventCount, 1)
  assert.equal(trail.blockedEventCount, 1)
})

test('RP01.20 rejects missing metadata and mismatched read-only consumer action', () => {
  const contract = buildReviewedEvidenceConsumerContract(
    buildReviewedEvidenceReadModel(availableQuery()),
  )

  const result = recordReviewedEvidenceConsumerUsageEvent(
    [],
    contract,
    'UI',
    '',
    'EXPOSE_REVIEWED_EVIDENCE_TO_AI_CONTEXT',
    '',
    '',
  )

  assert.equal(result.status, 'NOT_RECORDED')
  assert.equal(result.event, null)
  assert.deepEqual(result.reasons, [
    'CONSUMER_ID_REQUIRED',
    'EVENT_TIMESTAMP_REQUIRED',
    'REQUEST_CONTEXT_REQUIRED',
    'ACTION_CONSUMER_KIND_MISMATCH',
  ])
})

test('RP01.20 audit events never grant prediction, engineering authority, production authority, or machine output', () => {
  const contract = buildReviewedEvidenceConsumerContract(
    buildReviewedEvidenceReadModel(availableQuery()),
  )

  const result = recordReviewedEvidenceConsumerUsageEvent(
    [],
    contract,
    'AI_CONTEXT',
    'future-ai-consumer',
    'GENERATE_MACHINE_INSTRUCTION',
    '2026-09-01T23:11:00+03:00',
    'Blocked machine instruction request.',
  )

  assert.ok(result.event)
  assert.equal(result.event.outcome, 'BLOCKED')
  assert.equal(result.event.automaticOutcomeInferenceAllowed, false)
  assert.equal(result.event.inferredOutcome, null)
  assert.equal(result.event.scenarioGeneralizationAllowed, false)
  assert.equal(
    result.event.inferenceBeyondReviewedScenariosAllowed,
    false,
  )
  assert.equal(result.event.engineeringAuthorityGranted, false)
  assert.equal(result.event.productionAuthorityGranted, false)
  assert.equal(result.event.machineInstructionGenerated, false)
  assert.equal(result.event.productionUnlockAllowed, false)

  const source = readFileSync(
    'src/realProduction/skyGlazingReviewedEvidenceConsumerAuditTrail.ts',
    'utf8',
  )
  assert.doesNotMatch(
    source,
    /automaticOutcomeInferenceAllowed:\s*true/,
  )
  assert.doesNotMatch(source, /inferredOutcome:\s*(true|false)/)
  assert.doesNotMatch(
    source,
    /scenarioGeneralizationAllowed:\s*true/,
  )
  assert.doesNotMatch(
    source,
    /inferenceBeyondReviewedScenariosAllowed:\s*true/,
  )
  assert.doesNotMatch(
    source,
    /engineeringAuthorityGranted:\s*true/,
  )
  assert.doesNotMatch(
    source,
    /productionAuthorityGranted:\s*true/,
  )
  assert.doesNotMatch(
    source,
    /machineInstructionGenerated:\s*true/,
  )
  assert.doesNotMatch(
    source,
    /productionUnlockAllowed:\s*true/,
  )
})
