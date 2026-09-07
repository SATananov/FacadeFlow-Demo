import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { interpretFacadeFlowPrompt } from '../src/aiPromptInterpreter'
import {
  answerFacadeFlowRealUserWorkflowV1,
  REAL_USER_WORKFLOW_V1_SAFETY,
  removeFacadeFlowRealUserWorkflowV1Answer,
  startFacadeFlowRealUserWorkflowV1,
} from '../src/aiRealUserWorkflowV1'
import {
  createFacadeFlowAiSession,
  setFacadeFlowRealUserWorkflowV1,
  updateFacadeFlowJobMetadata,
} from '../src/aiWorkspaceState'

const sample = 'трикрилен прозорец 1800 × 1400, средното отваряемо, PRELUDE 60, двоен стъклопакет, черна дръжка'

function answerTarget(workflow: ReturnType<typeof startFacadeFlowRealUserWorkflowV1>, target: string, answerText: string) {
  const question = workflow.questions.find((item) => item.target === target)
  assert.ok(question, `Expected active question ${target}`)
  return answerFacadeFlowRealUserWorkflowV1({ workflow, questionId: question.id, answerText, answeredAt: '2026-09-07T12:00:00Z' })
}

test('Real User Workflow V1 understands Bulgarian two/three/four-leaf wording as topology without guessing field roles', () => {
  assert.equal(interpretFacadeFlowPrompt('трикрилен прозорец 1800x1400').intent.fields.length, 3)
  assert.equal(interpretFacadeFlowPrompt('двукрилна врата 1400x2200').intent.fields.length, 2)
  assert.equal(interpretFacadeFlowPrompt('четирикрилен прозорец 2400x1400').intent.fields.length, 4)
})

test('Real User Workflow V1 asks only the unresolved structural questions and proposes PRELUDE codes for human confirmation', () => {
  const workflow = startFacadeFlowRealUserWorkflowV1(interpretFacadeFlowPrompt(sample, 'real-v1'))
  assert.equal(workflow.currentInterpretation.intent.fields.length, 3)
  assert.equal(workflow.status, 'NEEDS_HUMAN_CLARIFICATION')
  assert.deepEqual(workflow.questions.filter((item) => item.priority === 'REQUIRED').map((item) => item.target).sort(), [
    'FIELD:1:ROLE', 'FIELD:2:OPENING_TYPE', 'FIELD:3:ROLE',
  ])
  assert.equal(workflow.questions.find((item) => item.target === 'PROFILE_FRAME')?.suggestedAnswer, '482.30')
  assert.equal(workflow.questions.find((item) => item.target === 'PROFILE_SASH')?.suggestedAnswer, '482.05')
  assert.equal(workflow.questions.find((item) => item.target === 'PROFILE_MULLION')?.suggestedAnswer, '482.21')
  assert.equal(workflow.automaticProfileSelectionAllowed, false)
})

test('human clarification answers produce a new candidate intent with exact fixed / tilt-turn-left / fixed topology', () => {
  let workflow = startFacadeFlowRealUserWorkflowV1(interpretFacadeFlowPrompt(sample, 'real-v1-answer'))
  workflow = answerTarget(workflow, 'FIELD:1:ROLE', 'фиксирано')
  workflow = answerTarget(workflow, 'FIELD:2:OPENING_TYPE', 'tilt-turn наляво')
  workflow = answerTarget(workflow, 'FIELD:3:ROLE', 'фиксирано')

  const fields = workflow.currentInterpretation.intent.fields
  assert.deepEqual(fields.map((item) => item.role), ['FIXED', 'OPENING_SASH', 'FIXED'])
  assert.equal(fields[1]?.openingType, 'TILT_TURN')
  assert.equal(fields[1]?.openingDirection, 'LEFT')
  assert.equal(workflow.requiredQuestionCount, 0)
})

test('PRELUDE profile confirmations expose reviewed working semantics but remain non-production', () => {
  let workflow = startFacadeFlowRealUserWorkflowV1(interpretFacadeFlowPrompt(sample, 'real-v1-profile'))
  workflow = answerTarget(workflow, 'FIELD:1:ROLE', 'фиксирано')
  workflow = answerTarget(workflow, 'FIELD:2:OPENING_TYPE', 'tilt-turn наляво')
  workflow = answerTarget(workflow, 'FIELD:3:ROLE', 'фиксирано')
  workflow = answerTarget(workflow, 'PROFILE_FRAME', '482.30')
  workflow = answerTarget(workflow, 'PROFILE_SASH', '482.05')
  workflow = answerTarget(workflow, 'PROFILE_MULLION', '482.21')

  const values = workflow.knowledgeFacts.map((item) => `${item.label}: ${item.value}`).join('\n')
  assert.match(values, /Каса 482\.30: работен размер 64 mm · видима ширина 42 mm/)
  assert.match(values, /Крило 482\.05: работен размер 78 mm · видима ширина 56 mm/)
  assert.match(values, /Делител 482\.21: работен размер 84 mm · видима ширина 40 mm/)
  assert.equal(workflow.automaticGeometryAllowed, false)
  assert.equal(workflow.productionUnlockAllowed, false)
  assert.equal(workflow.machineReady, false)
})

test('human may explicitly leave an optional item unknown and the workflow preserves the gap', () => {
  let workflow = startFacadeFlowRealUserWorkflowV1(interpretFacadeFlowPrompt('прозорец PRELUDE 60 1200x1400, едно поле fixed, двоен стъклопакет, каса 482.30', 'real-v1-gap'))
  const finish = workflow.questions.find((item) => item.target === 'FINISH')
  assert.ok(finish)
  workflow = answerFacadeFlowRealUserWorkflowV1({ workflow, questionId: finish.id, defer: true, answeredAt: '2026-09-07T12:00:00Z' })
  assert.ok(workflow.declaredUnknownTargets.includes('FINISH'))
  assert.equal(workflow.questions.some((item) => item.target === 'FINISH'), false)
})

test('required structural clarification cannot be bypassed by deferring it', () => {
  let workflow = startFacadeFlowRealUserWorkflowV1(interpretFacadeFlowPrompt(sample, 'real-v1-required-defer'))
  const required = workflow.questions.find((item) => item.target === 'FIELD:1:ROLE')
  assert.ok(required)
  assert.equal(required.priority, 'REQUIRED')
  workflow = answerFacadeFlowRealUserWorkflowV1({ workflow, questionId: required.id, defer: true, answeredAt: '2026-09-07T12:00:00Z' })
  assert.ok(workflow.declaredUnknownTargets.includes('FIELD:1:ROLE'))
  assert.ok(workflow.questions.some((item) => item.target === 'FIELD:1:ROLE' && item.priority === 'REQUIRED'))
  assert.ok(workflow.requiredQuestionCount > 0)
  assert.equal(workflow.humanClarificationRequired, true)
  assert.equal(workflow.automaticGeometryAllowed, false)
})

test('clarification state is stored in FacadeFlow session state and description edits invalidate it', () => {
  const session = createFacadeFlowAiSession('real-user-session')
  const withText = updateFacadeFlowJobMetadata(session, { description: sample })
  const workflow = startFacadeFlowRealUserWorkflowV1(interpretFacadeFlowPrompt(sample, 'session-intent'))
  const stored = setFacadeFlowRealUserWorkflowV1(withText, workflow)
  assert.equal(stored.job.realUserWorkflow?.version, 'REAL_USER_WORKFLOW_V1')
  const renamed = updateFacadeFlowJobMetadata(stored, { name: 'W-01' })
  assert.equal(renamed.job.realUserWorkflow?.version, 'REAL_USER_WORKFLOW_V1')
  const edited = updateFacadeFlowJobMetadata(renamed, { description: `${sample}, RAL 7016` })
  assert.equal(edited.job.realUserWorkflow, null)
})

test('removing a saved human answer rebuilds the workflow from the original source text', () => {
  let workflow = startFacadeFlowRealUserWorkflowV1(interpretFacadeFlowPrompt(sample, 'real-v1-remove'))
  workflow = answerTarget(workflow, 'FIELD:1:ROLE', 'фиксирано')
  assert.ok(workflow.answers.some((item) => item.target === 'FIELD:1:ROLE'))
  workflow = removeFacadeFlowRealUserWorkflowV1Answer({ workflow, target: 'FIELD:1:ROLE' })
  assert.equal(workflow.answers.some((item) => item.target === 'FIELD:1:ROLE'), false)
  assert.ok(workflow.questions.some((item) => item.target === 'FIELD:1:ROLE'))
})

test('unsupported profile systems remain explicit knowledge gaps and never receive PRELUDE auto-selection', () => {
  const workflow = startFacadeFlowRealUserWorkflowV1(interpretFacadeFlowPrompt('прозорец 1200x1400, едно поле fixed, система SYS-90, двоен стъклопакет, RAL 7016', 'real-v1-other-system'))
  assert.ok(workflow.knowledgeGaps.some((item) => item.id === 'SYSTEM_NOT_COVERED'))
  assert.equal(workflow.questions.some((item) => item.suggestedAnswer === '482.30'), false)
})

test('UI wiring starts knowledge/clarification immediately after prompt analysis and gates drawing until required answers are complete', () => {
  const promptPanel = readFileSync('src/components/PromptInterpretationPanel.tsx', 'utf8')
  const workflowPanel = readFileSync('src/components/RealUserWorkflowV1Panel.tsx', 'utf8')
  const workspace = readFileSync('src/components/FacadeFlowAIWorkspace.tsx', 'utf8')
  assert.match(promptPanel, /startFacadeFlowRealUserWorkflowV1/)
  assert.match(promptPanel, /RealUserWorkflowV1Panel/)
  assert.match(promptPanel, /workflow\.requiredQuestionCount > 0/)
  assert.match(promptPanel, /AI ЧЕРТЕЖЪТ ЧАКА УТОЧНЕНИЕ/)
  assert.match(workflowPanel, /Потвърди предложението/)
  assert.match(workflowPanel, /Не знам \/ остави неуточнено/)
  assert.match(workspace, /session\.job\.realUserWorkflow\?\.currentInterpretation/)
})

test('Real User Workflow V1 hard safety boundary stays fail-closed', () => {
  assert.equal(REAL_USER_WORKFLOW_V1_SAFETY.automaticProfileSelectionAllowed, false)
  assert.equal(REAL_USER_WORKFLOW_V1_SAFETY.automaticEvidenceAcceptanceAllowed, false)
  assert.equal(REAL_USER_WORKFLOW_V1_SAFETY.automaticKnowledgeResolutionAllowed, false)
  assert.equal(REAL_USER_WORKFLOW_V1_SAFETY.automaticGeometryAllowed, false)
  assert.equal(REAL_USER_WORKFLOW_V1_SAFETY.rulesValidated, false)
  assert.equal(REAL_USER_WORKFLOW_V1_SAFETY.productionUnlockAllowed, false)
  assert.equal(REAL_USER_WORKFLOW_V1_SAFETY.machineReady, false)
})
