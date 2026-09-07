import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { CanonicalProfileClarificationQuestion } from '../src/aiCanonicalProfileClarificationQuestionPlanner'
import {
  buildProfileDataV2HumanClarificationAnswer,
  removeProfileDataV2HumanClarificationAnswer,
  upsertProfileDataV2HumanClarificationAnswer,
  PROFILE_DATA_V2_1_SAFETY,
} from '../src/profileData/profileDataV2HumanClarificationWorkflow'

const sourceQuestion = (): CanonicalProfileClarificationQuestion => ({
  questionKey: 'CLARIFY:FRAME_SASH:MANUFACTURER_PAIR_RELATION_EVIDENCE',
  requestKey: 'FRAME_SASH:MANUFACTURER_PAIR_RELATION_EVIDENCE',
  relation: 'FRAME_SASH',
  leftProfileCode: '482.30',
  rightProfileCode: '482.05',
  requirementKind: 'MANUFACTURER_PAIR_RELATION_EVIDENCE',
  authorityNeeded: 'MANUFACTURER_CATALOGUE_OR_TECHNICAL_DOCUMENT',
  answerKind: 'SOURCE_REFERENCE',
  questionBg: 'Посочи конкретен source.',
  evidenceNeeded: 'Manufacturer relation evidence.',
  humanAnswerRequired: true,
  mayInferAnswer: false,
  mayAutoFetchEvidence: false,
  mayAutoAcceptAnswer: false,
})

test('V2.1 captures a trimmed SOURCE_REFERENCE human answer for the existing 03.28 session', () => {
  const answer = buildProfileDataV2HumanClarificationAnswer({
    question: sourceQuestion(),
    draft: {
      answerText: '  Това е конкретният каталог.  ',
      sourceLabel: '  PRELUDE 60 technical catalogue  ',
      sourceRef: '  catalogue://prelude60/frame-sash/page-42  ',
    },
    answeredAt: '2026-09-07T15:30:00+03:00',
  })

  assert.equal(answer.questionKey, sourceQuestion().questionKey)
  assert.equal(answer.answerKind, 'SOURCE_REFERENCE')
  assert.equal(answer.answeredByRole, 'TECHNICAL_USER')
  assert.equal(answer.answerText, 'Това е конкретният каталог.')
  assert.equal(answer.sourceLabel, 'PRELUDE 60 technical catalogue')
  assert.equal(answer.sourceRef, 'catalogue://prelude60/frame-sash/page-42')
})

test('V2.1 fails closed when SOURCE_REFERENCE is missing source label or reference', () => {
  assert.throws(
    () => buildProfileDataV2HumanClarificationAnswer({
      question: sourceQuestion(),
      draft: {
        answerText: 'Имам source.',
        sourceLabel: 'PRELUDE 60',
        sourceRef: '',
      },
      answeredAt: '2026-09-07T15:30:00+03:00',
    }),
    /requires both sourceLabel and sourceRef/,
  )
})

test('V2.1 accepts renewed human-review text without inventing a source reference', () => {
  const question: CanonicalProfileClarificationQuestion = {
    ...sourceQuestion(),
    answerKind: 'HUMAN_REVIEW_CONFIRMATION',
    questionKey: 'CLARIFY:FRAME_SASH:REVIEW',
  }
  const answer = buildProfileDataV2HumanClarificationAnswer({
    question,
    draft: {
      answerText: 'Новият technical review е извършен; резултатът остава pending downstream review.',
      sourceLabel: '',
      sourceRef: '',
    },
    answeredAt: '2026-09-07T15:31:00+03:00',
  })

  assert.equal(answer.answerKind, 'HUMAN_REVIEW_CONFIRMATION')
  assert.equal(answer.sourceLabel, undefined)
  assert.equal(answer.sourceRef, undefined)
})

test('V2.1 upserts one answer per question and supports explicit removal', () => {
  const first = buildProfileDataV2HumanClarificationAnswer({
    question: sourceQuestion(),
    draft: {
      answerText: 'First',
      sourceLabel: 'Source A',
      sourceRef: 'ref://a',
    },
    answeredAt: '2026-09-07T15:32:00+03:00',
  })
  const second = buildProfileDataV2HumanClarificationAnswer({
    question: sourceQuestion(),
    draft: {
      answerText: 'Second',
      sourceLabel: 'Source B',
      sourceRef: 'ref://b',
    },
    answeredAt: '2026-09-07T15:33:00+03:00',
  })

  const upserted = upsertProfileDataV2HumanClarificationAnswer([first], second)
  assert.equal(upserted.length, 1)
  assert.equal(upserted[0].answerText, 'Second')

  const removed = removeProfileDataV2HumanClarificationAnswer(upserted, second.questionKey)
  assert.equal(removed.length, 0)
})

test('V2.1 preserves all automatic evidence/production safety locks', () => {
  assert.equal(PROFILE_DATA_V2_1_SAFETY.humanAnswerCaptureOnly, true)
  assert.equal(PROFILE_DATA_V2_1_SAFETY.candidateIntakeOnly, true)
  assert.equal(PROFILE_DATA_V2_1_SAFETY.automaticEvidenceFetchAllowed, false)
  assert.equal(PROFILE_DATA_V2_1_SAFETY.automaticEvidenceRegistrationAllowed, false)
  assert.equal(PROFILE_DATA_V2_1_SAFETY.automaticEvidenceAcceptanceAllowed, false)
  assert.equal(PROFILE_DATA_V2_1_SAFETY.automaticRequirementSatisfactionAllowed, false)
  assert.equal(PROFILE_DATA_V2_1_SAFETY.automaticKnowledgeResolutionAllowed, false)
  assert.equal(PROFILE_DATA_V2_1_SAFETY.automaticProfileSelectionAllowed, false)
  assert.equal(PROFILE_DATA_V2_1_SAFETY.automaticGeometryAllowed, false)
  assert.equal(PROFILE_DATA_V2_1_SAFETY.rulesValidated, false)
  assert.equal(PROFILE_DATA_V2_1_SAFETY.productionUnlockAllowed, false)
  assert.equal(PROFILE_DATA_V2_1_SAFETY.machineReady, false)
})

test('V2.1 UI passes explicit human answers into 03.28 and exposes candidate state without auto registration', () => {
  const repoRoot = process.cwd()
  const panel = readFileSync(resolve(repoRoot, 'src/components/CanonicalProfileClarificationIntakePanel.tsx'), 'utf8')

  assert.match(panel, /buildCanonicalProfileGuidedClarificationSession\(\{ plan: questionPlan, answers \}\)/)
  assert.match(panel, /Запази human answer · pending intake/)
  assert.match(panel, /Source label/)
  assert.match(panel, /Source reference/)
  assert.match(panel, /data-profile-data-v2-candidate/)
  assert.match(panel, /Automatically registered:<\/strong> NO/)
  assert.match(panel, /Human intake\/review required:<\/strong> YES/)
  assert.match(panel, /Production unlock:<\/strong> NO/)
  assert.match(panel, /Machine ready:<\/strong> NO/)
})
