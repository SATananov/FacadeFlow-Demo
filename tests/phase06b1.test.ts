import test from 'node:test'
import assert from 'node:assert/strict'
import { FACADEFLOW_AI_INPUT_LABELS, FACADEFLOW_JOB_TYPE_LABELS, KNOWLEDGE_BASE_SECTIONS, createFacadeFlowAiSession, resetFacadeFlowAiIntake, selectFacadeFlowAiInputMode, selectFacadeFlowJobType, setFacadeFlowAiView, updateFacadeFlowJobMetadata } from '../src/aiWorkspaceState'

const create = () => createFacadeFlowAiSession('phase06b1-test')

test('06B.1 starts as an explicitly disconnected and non-production AI shell', () => {
  const session = create()
  assert.equal(session.aiModelStatus, 'NOT_CONNECTED')
  assert.equal(session.automaticGeometryAllowed, false)
  assert.equal(session.humanReviewRequired, true)
  assert.equal(session.rulesValidationRequired, true)
  assert.equal(session.sourceEvidenceRequired, true)
  assert.equal(session.productionApproved, false)
  assert.equal(session.job.machineReady, false)
  assert.equal(session.job.simulationOnly, true)
})

test('06B.1 job scope supports building, house, small work, one product, custom order and technical detail', () => {
  assert.deepEqual(Object.keys(FACADEFLOW_JOB_TYPE_LABELS).sort(), ['BUILDING', 'CUSTOM_ORDER', 'HOUSE', 'SINGLE_PRODUCT', 'SMALL_PROJECT', 'TECHNICAL_DETAIL'].sort())
  let session = create()
  session = selectFacadeFlowJobType(session, 'TECHNICAL_DETAIL')
  assert.equal(session.job.jobType, 'TECHNICAL_DETAIL')
  assert.match(session.job.groupLabels[0] ?? '', /Детайл/)
})

test('06B.1 input route cannot be selected before a job scope exists', () => {
  const session = create()
  const unchanged = selectFacadeFlowAiInputMode(session, 'DESCRIPTION')
  assert.equal(unchanged.job.inputMode, null)
})

test('06B.1 supports documents, description, sketch and manual fallback', () => {
  assert.deepEqual(Object.keys(FACADEFLOW_AI_INPUT_LABELS).sort(), ['DESCRIPTION', 'DOCUMENTS', 'MANUAL', 'SKETCH'].sort())
  let session = selectFacadeFlowJobType(create(), 'SINGLE_PRODUCT')
  session = selectFacadeFlowAiInputMode(session, 'DESCRIPTION')
  session = updateFacadeFlowJobMetadata(session, { name: 'Входна врата', description: '1000 × 2200, три панти, черна дръжка.' })
  assert.equal(session.job.inputMode, 'DESCRIPTION')
  assert.equal(session.job.intakeStatus, 'SOURCE_CAPTURED')
  assert.match(session.job.description, /три панти/)
})

test('06B.1 knowledge base exposes provenance-oriented domains without invented hardware data', () => {
  assert.equal(KNOWLEDGE_BASE_SECTIONS.length, 8)
  assert.equal(KNOWLEDGE_BASE_SECTIONS.find((item) => item.id === 'PROFILES')?.status, 'FOUNDATION')
  assert.equal(KNOWLEDGE_BASE_SECTIONS.find((item) => item.id === 'HARDWARE')?.status, 'NEEDS_DATA')
  assert.equal(KNOWLEDGE_BASE_SECTIONS.find((item) => item.id === 'ENGINEERING_RULES')?.status, 'NEEDS_DATA')
  assert.equal(KNOWLEDGE_BASE_SECTIONS.find((item) => item.id === 'SOURCES')?.status, 'NEEDS_DATA')
})

test('06B.1 reset keeps the workspace but clears the intake job', () => {
  let session = selectFacadeFlowJobType(create(), 'HOUSE')
  session = selectFacadeFlowAiInputMode(session, 'DOCUMENTS')
  session = updateFacadeFlowJobMetadata(session, { name: 'Къща Иванови', reference: 'JOB-14' })
  session = setFacadeFlowAiView(session, 'KNOWLEDGE_BASE')
  const reset = resetFacadeFlowAiIntake(session)
  assert.equal(reset.view, 'KNOWLEDGE_BASE')
  assert.equal(reset.job.jobType, null)
  assert.equal(reset.job.inputMode, null)
  assert.equal(reset.job.name, '')
  assert.equal(reset.job.machineReady, false)
})
