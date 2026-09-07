import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { CanonicalProfileHumanEvidenceRequestQueue } from '../src/aiCanonicalProfileHumanEvidenceRequestQueue'
import {
  buildCanonicalProfileClarificationQuestionPlan,
  PROFILE_DATA_03_27_SAFETY,
} from '../src/aiCanonicalProfileClarificationQuestionPlanner'
import {
  buildCanonicalProfileGuidedClarificationSession,
  PROFILE_DATA_03_28_SAFETY,
  type CanonicalProfileClarificationAnswerInput,
} from '../src/aiCanonicalProfileGuidedClarificationSession'
import {
  buildCanonicalProfileClarificationKnowledgeIntakeBridge,
  PROFILE_DATA_03_29_SAFETY,
} from '../src/aiCanonicalProfileClarificationKnowledgeIntakeBridge'

function queueFixture(mode: 'GAPS' | 'STALE' | 'EMPTY' | 'BLOCKED' = 'GAPS'): CanonicalProfileHumanEvidenceRequestQueue {
  const items = mode === 'EMPTY' || mode === 'BLOCKED' ? [] : [
    {
      requestKey: 'FRAME_SASH:MANUFACTURER_PAIR_RELATION_EVIDENCE',
      relation: 'FRAME_SASH' as const,
      leftProfileCode: '482.30',
      rightProfileCode: '482.05',
      requirementKind: 'MANUFACTURER_PAIR_RELATION_EVIDENCE' as const,
      authorityNeeded: 'MANUFACTURER_CATALOGUE_OR_TECHNICAL_DOCUMENT' as const,
      action: mode === 'STALE' ? 'RENEW_HUMAN_REVIEW' as const : 'PROVIDE_OR_IDENTIFY_EVIDENCE' as const,
      requestedEvidence: 'Manufacturer catalogue or technical-document evidence that explicitly supports the profile pair for FRAME_SASH.',
      reason: 'Missing reviewed evidence.',
      humanActionRequired: true as const,
      mayAutoFetchSource: false as const,
      mayAutoAcceptEvidence: false as const,
      mayInferMissingTechnicalData: false as const,
    },
  ]

  return {
    version: 'PROFILE_DATA_03.25',
    sourceIntentId: 'profile-data03-27-29-fixture',
    systemId: 'PRELUDE_60',
    systemLabel: 'PRELUDE 60',
    status: mode === 'BLOCKED'
      ? 'BLOCKED_UPSTREAM'
      : mode === 'STALE'
        ? 'STALE_REVIEW_QUEUE_READY_PRODUCTION_LOCKED'
        : items.length
          ? 'HUMAN_EVIDENCE_QUEUE_READY_PRODUCTION_LOCKED'
          : 'HUMAN_EVIDENCE_QUEUE_EMPTY_PRODUCTION_LOCKED',
    items,
    authorityGroups: items.length ? [{
      authorityNeeded: items[0].authorityNeeded,
      requestCount: 1,
      requestKeys: [items[0].requestKey],
    }] : [],
    totalRequestCount: items.length,
    humanActionRequired: mode === 'BLOCKED' || items.length > 0,
    conflicts: mode === 'BLOCKED' ? ['fixture upstream conflict'] : [],
    automaticDispatchAllowed: false,
    automaticEvidenceFetchAllowed: false,
    automaticEvidenceAcceptanceAllowed: false,
    automaticKnowledgeResolutionAllowed: false,
    productionUnlockAllowed: false,
    machineReady: false,
  }
}

const sourceAnswer = (questionKey: string): CanonicalProfileClarificationAnswerInput => ({
  questionKey,
  answerKind: 'SOURCE_REFERENCE',
  answeredByRole: 'TECHNICAL_USER',
  answeredAt: '2026-09-07T12:00:00+03:00',
  answerText: 'Това е източникът, който трябва да бъде прегледан.',
  sourceLabel: 'PRELUDE 60 technical catalogue excerpt',
  sourceRef: 'catalogue://prelude60/frame-sash/page-42',
})

test('03.27 creates an exact Bulgarian clarification question from the human evidence queue', () => {
  const plan = buildCanonicalProfileClarificationQuestionPlan(queueFixture())
  assert.equal(plan.status, 'CLARIFICATION_QUESTIONS_READY_PRODUCTION_LOCKED')
  assert.equal(plan.questionCount, 1)
  assert.equal(plan.questions[0].answerKind, 'SOURCE_REFERENCE')
  assert.match(plan.questions[0].questionBg, /FRAME_SASH/)
  assert.match(plan.questions[0].questionBg, /482\.30/)
  assert.match(plan.questions[0].questionBg, /MANUFACTURER_CATALOGUE_OR_TECHNICAL_DOCUMENT/)
})

test('03.27 stale queue asks for renewed human review instead of pretending the old review is current', () => {
  const plan = buildCanonicalProfileClarificationQuestionPlan(queueFixture('STALE'))
  assert.equal(plan.questions[0].answerKind, 'HUMAN_REVIEW_CONFIRMATION')
  assert.match(plan.questions[0].questionBg, /human review.*остарял/i)
})

test('03.27 blocked upstream input is fail-closed and creates no actionable questions', () => {
  const plan = buildCanonicalProfileClarificationQuestionPlan(queueFixture('BLOCKED'))
  assert.equal(plan.status, 'BLOCKED_UPSTREAM')
  assert.equal(plan.questionCount, 0)
})

test('03.28 starts by waiting for explicit human answers', () => {
  const plan = buildCanonicalProfileClarificationQuestionPlan(queueFixture())
  const session = buildCanonicalProfileGuidedClarificationSession({ plan })
  assert.equal(session.status, 'WAITING_HUMAN_ANSWERS_PRODUCTION_LOCKED')
  assert.equal(session.waitingAnswerCount, 1)
  assert.equal(session.capturedAnswerCount, 0)
})

test('03.28 captures a structured source answer but does not accept it as evidence', () => {
  const plan = buildCanonicalProfileClarificationQuestionPlan(queueFixture())
  const answer = sourceAnswer(plan.questions[0].questionKey)
  const session = buildCanonicalProfileGuidedClarificationSession({ plan, answers: [answer] })
  assert.equal(session.status, 'ANSWERS_CAPTURED_PENDING_INTAKE_PRODUCTION_LOCKED')
  assert.equal(session.capturedAnswerCount, 1)
  assert.equal(session.items[0].sourceRef, 'catalogue://prelude60/frame-sash/page-42')
  assert.equal(session.items[0].acceptedAsEvidence, false)
  assert.equal(session.items[0].requirementSatisfied, false)
})

test('03.28 rejects incomplete source-reference answers and requires human correction', () => {
  const plan = buildCanonicalProfileClarificationQuestionPlan(queueFixture())
  const answer = { ...sourceAnswer(plan.questions[0].questionKey), sourceRef: '' }
  const session = buildCanonicalProfileGuidedClarificationSession({ plan, answers: [answer] })
  assert.equal(session.status, 'HUMAN_CORRECTION_REQUIRED_PRODUCTION_LOCKED')
  assert.equal(session.invalidAnswerCount, 1)
  assert.match(session.items[0].validationIssue, /sourceLabel and sourceRef/)
})

test('03.29 turns a captured answer into candidate intake only', () => {
  const plan = buildCanonicalProfileClarificationQuestionPlan(queueFixture())
  const session = buildCanonicalProfileGuidedClarificationSession({
    plan,
    answers: [sourceAnswer(plan.questions[0].questionKey)],
  })
  const bridge = buildCanonicalProfileClarificationKnowledgeIntakeBridge(session)
  assert.equal(bridge.status, 'INTAKE_CANDIDATES_READY_HUMAN_REVIEW_REQUIRED_PRODUCTION_LOCKED')
  assert.equal(bridge.candidateCount, 1)
  assert.equal(bridge.candidates[0].candidateKind, 'EVIDENCE_SOURCE_REFERENCE_CANDIDATE')
  assert.equal(bridge.candidates[0].mayCreateManualEvidenceRegistration, true)
  assert.equal(bridge.candidates[0].mayAutoRegisterEvidence, false)
  assert.equal(bridge.candidates[0].mayAutoAcceptEvidence, false)
  assert.equal(bridge.candidates[0].mayAutoSatisfyRequirement, false)
  assert.equal(bridge.candidates[0].mayAutoResolveKnowledge, false)
})

test('03.29 waiting clarification cannot be promoted into intake candidates', () => {
  const plan = buildCanonicalProfileClarificationQuestionPlan(queueFixture())
  const session = buildCanonicalProfileGuidedClarificationSession({ plan })
  const bridge = buildCanonicalProfileClarificationKnowledgeIntakeBridge(session)
  assert.equal(bridge.status, 'WAITING_FOR_CLARIFICATION_PRODUCTION_LOCKED')
  assert.equal(bridge.candidateCount, 0)
})

test('03.27-03.29 safety constants keep clarification and intake production locked', () => {
  assert.equal(PROFILE_DATA_03_27_SAFETY.automaticQuestionAnsweringAllowed, false)
  assert.equal(PROFILE_DATA_03_27_SAFETY.automaticEvidenceFetchAllowed, false)
  assert.equal(PROFILE_DATA_03_28_SAFETY.automaticEvidenceRegistrationAllowed, false)
  assert.equal(PROFILE_DATA_03_28_SAFETY.automaticEvidenceAcceptanceAllowed, false)
  assert.equal(PROFILE_DATA_03_29_SAFETY.automaticRequirementSatisfactionAllowed, false)
  assert.equal(PROFILE_DATA_03_29_SAFETY.automaticKnowledgeResolutionAllowed, false)
  assert.equal(PROFILE_DATA_03_29_SAFETY.productionUnlockAllowed, false)
  assert.equal(PROFILE_DATA_03_29_SAFETY.machineReady, false)
})

test('03.27-03.29 UI is wired under the existing 03.24-03.26 safe response panel', () => {
  const repoRoot = process.cwd()
  const parent = readFileSync(resolve(repoRoot, 'src/components/CanonicalProfileEvidenceRequestResponsePanel.tsx'), 'utf8')
  const panel = readFileSync(resolve(repoRoot, 'src/components/CanonicalProfileClarificationIntakePanel.tsx'), 'utf8')
  assert.match(parent, /CanonicalProfileClarificationIntakePanel/)
  assert.match(parent, /queue=\{queue\}/)
  assert.match(panel, /PROFILE DATA V2 · HUMAN CLARIFICATION WORKFLOW/)
  assert.match(panel, /Automatic evidence registration:<\/strong> NO/)
  assert.match(panel, /Automatic knowledge resolution:<\/strong> NO/)
  assert.match(panel, /Production unlock:<\/strong> NO/)
  assert.match(panel, /Machine ready:<\/strong> NO/)
})
