import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { CanonicalProfileAiConsumableKnowledgeContext } from '../src/aiCanonicalProfileAiConsumableKnowledgeContext'
import {
  buildCanonicalProfileEvidenceRequestPlan,
  PROFILE_DATA_03_24_SAFETY,
} from '../src/aiCanonicalProfileEvidenceRequestPlanner'
import {
  buildCanonicalProfileHumanEvidenceRequestQueue,
  PROFILE_DATA_03_25_SAFETY,
} from '../src/aiCanonicalProfileHumanEvidenceRequestQueue'
import {
  buildCanonicalProfileSafeAiResponse,
  PROFILE_DATA_03_26_SAFETY,
} from '../src/aiCanonicalProfileSafeResponseComposer'

const unknown = (overrides: Partial<CanonicalProfileAiConsumableKnowledgeContext['unknown'][number]> = {}) => ({
  relation: 'FRAME_SASH' as const,
  leftProfileCode: '482.30',
  rightProfileCode: '482.05',
  requirementKind: 'MANUFACTURER_PAIR_RELATION_EVIDENCE' as const,
  authorityNeeded: 'MANUFACTURER_CATALOGUE_OR_TECHNICAL_DOCUMENT' as const,
  state: 'NO_CANDIDATE_EVIDENCE' as const,
  humanEvidenceRequired: true as const,
  mayInferMissingValue: false as const,
  ...overrides,
})

function contextFixture(mode: 'GAPS' | 'COMPLETE' | 'STALE' | 'BLOCKED' = 'GAPS'): CanonicalProfileAiConsumableKnowledgeContext {
  const unknownItems = mode === 'COMPLETE' || mode === 'BLOCKED' ? [] : [
    unknown(),
    unknown({
      relation: 'MULLION_SASH',
      leftProfileCode: '482.21',
      requirementKind: 'EXACT_JOINT_DOCUMENTATION',
      authorityNeeded: 'MANUFACTURER_OR_ENGINEERING_EXACT_JOINT_DOCUMENT',
    }),
  ]

  return {
    version: 'PROFILE_DATA_03.23',
    sourceIntentId: 'profile-data03-24-26-fixture',
    systemId: 'PRELUDE_60',
    systemLabel: 'PRELUDE 60',
    status: mode === 'BLOCKED'
      ? 'BLOCKED_UPSTREAM'
      : mode === 'STALE'
        ? 'STALE_HUMAN_REVIEW_REQUIRED'
        : mode === 'COMPLETE'
          ? 'AI_CONTEXT_READY_COMPLETE_PRODUCTION_LOCKED'
          : 'AI_CONTEXT_READY_WITH_GAPS_PRODUCTION_LOCKED',
    knowledgeCoveragePercent: mode === 'COMPLETE' ? 100 : 80,
    known: mode === 'BLOCKED' ? [] : [{
      relation: 'FRAME_MULLION',
      leftProfileCode: '482.30',
      rightProfileCode: '482.21',
      requirementKind: 'HUMAN_WORKING_RELATION_EVIDENCE',
      state: 'RESOLVED_FOR_KNOWLEDGE_READINESS',
      resolvedForKnowledgeReadiness: true,
    }],
    unknown: unknownItems,
    humanEvidenceRequests: unknownItems.map((item) => ({
      relation: item.relation,
      requirementKind: item.requirementKind,
      authorityNeeded: item.authorityNeeded,
      reason: `${item.requirementKind} for ${item.relation} is unresolved. Human evidence/review from ${item.authorityNeeded} is required before it can become known for knowledge readiness.`,
    })),
    responsePolicy: {
      maySayWhatIsKnown: mode !== 'BLOCKED' && mode !== 'STALE',
      maySayWhatIsUnknown: mode !== 'BLOCKED' && mode !== 'STALE',
      mayAskForHumanEvidence: mode !== 'BLOCKED',
      mustKeepUnknownExplicit: true,
      mayGuessMissingTechnicalData: false,
      mayPromoteKnowledgeToProductionFact: false,
    },
    hardSafetyLocks: {
      manufacturerApproval: false,
      exactJointGeometryVerified: false,
      productionCompatibilityValidated: false,
      automaticProfileSelectionAllowed: false,
      automaticGeometryAllowed: false,
      productionRulesValidated: false,
      productionUnlockAllowed: false,
      machineReady: false,
    },
    aiInstruction: 'Fixture AI instruction.',
  }
}

test('03.24 creates one deterministic evidence request per unknown requirement', () => {
  const plan = buildCanonicalProfileEvidenceRequestPlan(contextFixture())
  assert.equal(plan.status, 'EVIDENCE_REQUESTS_READY_PRODUCTION_LOCKED')
  assert.equal(plan.requestCount, 2)
  assert.deepEqual(plan.requests.map((item) => item.requestKey), [
    'FRAME_SASH:MANUFACTURER_PAIR_RELATION_EVIDENCE',
    'MULLION_SASH:EXACT_JOINT_DOCUMENTATION',
  ])
  assert.equal(plan.requests[0].leftProfileCode, '482.30')
  assert.equal(plan.requests[0].rightProfileCode, '482.05')
})

test('03.24 names the exact evidence class and authority without inventing technical values', () => {
  const plan = buildCanonicalProfileEvidenceRequestPlan(contextFixture())
  const manufacturer = plan.requests.find((item) => item.requirementKind === 'MANUFACTURER_PAIR_RELATION_EVIDENCE')!
  assert.match(manufacturer.requestedEvidence, /Manufacturer catalogue or technical-document evidence/)
  assert.equal(manufacturer.authorityNeeded, 'MANUFACTURER_CATALOGUE_OR_TECHNICAL_DOCUMENT')
  assert.equal(manufacturer.mayInferMissingTechnicalData, false)
  assert.equal(manufacturer.mayAutoFetchSource, false)
  assert.equal(manufacturer.mayAutoAcceptEvidence, false)
})

test('03.24 stale context requests renewed human review instead of treating stale data as current', () => {
  const plan = buildCanonicalProfileEvidenceRequestPlan(contextFixture('STALE'))
  assert.equal(plan.status, 'STALE_REVIEW_REQUESTS_READY_PRODUCTION_LOCKED')
  assert.equal(plan.requests.every((item) => item.action === 'RENEW_HUMAN_REVIEW'), true)
})

test('03.24 blocked upstream context is fail-closed and creates no actionable evidence requests', () => {
  const plan = buildCanonicalProfileEvidenceRequestPlan(contextFixture('BLOCKED'))
  assert.equal(plan.status, 'BLOCKED_UPSTREAM')
  assert.equal(plan.requestCount, 0)
  assert.equal(plan.humanActionRequired, true)
})

test('03.25 queues requests by human authority with no automatic dispatch or acceptance', () => {
  const queue = buildCanonicalProfileHumanEvidenceRequestQueue(buildCanonicalProfileEvidenceRequestPlan(contextFixture()))
  assert.equal(queue.status, 'HUMAN_EVIDENCE_QUEUE_READY_PRODUCTION_LOCKED')
  assert.equal(queue.totalRequestCount, 2)
  assert.equal(queue.authorityGroups.length, 2)
  assert.equal(queue.automaticDispatchAllowed, false)
  assert.equal(queue.automaticEvidenceFetchAllowed, false)
  assert.equal(queue.automaticEvidenceAcceptanceAllowed, false)
  assert.equal(queue.automaticKnowledgeResolutionAllowed, false)
})

test('03.26 composes a safe Bulgarian gap response and keeps unknowns explicit', () => {
  const context = contextFixture()
  const queue = buildCanonicalProfileHumanEvidenceRequestQueue(buildCanonicalProfileEvidenceRequestPlan(context))
  const response = buildCanonicalProfileSafeAiResponse({ context, queue })
  assert.equal(response.status, 'KNOWLEDGE_GAP_RESPONSE_READY_PRODUCTION_LOCKED')
  assert.equal(response.unknownStatements.length, 2)
  assert.equal(response.humanEvidenceRequests.length, 2)
  assert.match(response.messageBg, /Няма да измислям липсващи технически данни/)
  assert.equal(response.unknownRemainsExplicit, true)
  assert.equal(response.mayGuessMissingTechnicalData, false)
})

test('03.26 full knowledge context still refuses production claims and machine-ready status', () => {
  const context = contextFixture('COMPLETE')
  const queue = buildCanonicalProfileHumanEvidenceRequestQueue(buildCanonicalProfileEvidenceRequestPlan(context))
  const response = buildCanonicalProfileSafeAiResponse({ context, queue })
  assert.equal(response.status, 'KNOWLEDGE_COMPLETE_RESPONSE_READY_PRODUCTION_LOCKED')
  assert.equal(response.unknownStatements.length, 0)
  assert.match(response.messageBg, /не означава manufacturer approval/)
  assert.equal(response.mayClaimManufacturerApproval, false)
  assert.equal(response.mayClaimExactJointGeometry, false)
  assert.equal(response.mayClaimProductionCompatibility, false)
  assert.equal(response.productionUnlockAllowed, false)
  assert.equal(response.machineReady, false)
})

test('03.24-03.26 safety constants prohibit autonomous evidence and production promotion', () => {
  assert.equal(PROFILE_DATA_03_24_SAFETY.automaticEvidenceFetchAllowed, false)
  assert.equal(PROFILE_DATA_03_24_SAFETY.automaticEvidenceAcceptanceAllowed, false)
  assert.equal(PROFILE_DATA_03_25_SAFETY.automaticDispatchAllowed, false)
  assert.equal(PROFILE_DATA_03_25_SAFETY.automaticKnowledgeResolutionAllowed, false)
  assert.equal(PROFILE_DATA_03_26_SAFETY.mayGuessMissingTechnicalData, false)
  assert.equal(PROFILE_DATA_03_26_SAFETY.mayClaimProductionCompatibility, false)
  assert.equal(PROFILE_DATA_03_26_SAFETY.productionUnlockAllowed, false)
  assert.equal(PROFILE_DATA_03_26_SAFETY.machineReady, false)
})

test('03.24-03.26 UI is wired under the existing 03.21-03.23 AI knowledge context panel', () => {
  const repoRoot = process.cwd()
  const parent = readFileSync(resolve(repoRoot, 'src/components/CanonicalProfileAiKnowledgeContextPanel.tsx'), 'utf8')
  const panel = readFileSync(resolve(repoRoot, 'src/components/CanonicalProfileEvidenceRequestResponsePanel.tsx'), 'utf8')
  assert.match(parent, /CanonicalProfileEvidenceRequestResponsePanel/)
  assert.match(parent, /aiContext=\{aiContext\}/)
  assert.match(panel, /PROFILE DATA 03\.24-03\.26/)
  assert.match(panel, /Automatic evidence fetch:<\/strong> NO/)
  assert.match(panel, /May guess missing technical data:<\/strong> NO/)
  assert.match(panel, /Production unlock:<\/strong> NO/)
  assert.match(panel, /Machine ready:<\/strong> NO/)
})
