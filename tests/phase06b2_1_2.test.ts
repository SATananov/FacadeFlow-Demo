import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { FACADEFLOW_AI_INPUT_LABELS, FACADEFLOW_JOB_TYPE_LABELS, createFacadeFlowAiSession } from '../src/aiWorkspaceState'

const appSource = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
const aiSource = readFileSync(new URL('../src/components/FacadeFlowAIWorkspace.tsx', import.meta.url), 'utf8')
const iconSource = readFileSync(new URL('../src/components/FacadeFlowIcons.tsx', import.meta.url), 'utf8')
const blueprintSource = readFileSync(new URL('../src/components/AiBlueprintPreview.tsx', import.meta.url), 'utf8')

test('06B.2.1 keeps one unified icon navigation dock without changing destinations', () => {
  assert.match(appSource, /ff-app-dock/)
  for (const action of ['ai', 'designer', 'import', 'catalogue', 'help']) assert.match(appSource, new RegExp(`name="${action}"`))
  assert.match(appSource, /setShowAiWorkspace\(true\)/)
  assert.match(appSource, /setShowDetailDrafting\(true\)/)
  assert.match(appSource, /setShowDrawingImport\(true\)/)
  assert.match(appSource, /setShowProfileCatalogue\(true\)/)
})

test('06B.2.2 launchpad preserves six job scopes and four input modes', () => {
  assert.equal(Object.keys(FACADEFLOW_JOB_TYPE_LABELS).length, 6)
  assert.equal(Object.keys(FACADEFLOW_AI_INPUT_LABELS).length, 4)
  assert.match(aiSource, /AiBlueprintPreview/)
  assert.match(aiSource, /ff-ai-job-card/)
  assert.match(aiSource, /ff-ai-input-icon/)
})

test('06B.2 technical visuals are deterministic local SVG UI assets', () => {
  for (const name of ['building', 'house', 'small-project', 'single-product', 'custom-order', 'technical-detail', 'documents', 'description', 'sketch', 'manual']) assert.match(iconSource, new RegExp(`'${name}'`))
  for (const type of ['BUILDING', 'HOUSE', 'SMALL_PROJECT', 'SINGLE_PRODUCT', 'CUSTOM_ORDER']) assert.match(blueprintSource, new RegExp(`type === '${type}'`))
  assert.doesNotMatch(iconSource + blueprintSource, /fetch\(|WebSocket|localStorage|indexedDB/i)
})

test('06B.2 visual phase does not relax AI safety boundaries', () => {
  const session = createFacadeFlowAiSession('phase06b2-visual-test')
  assert.equal(session.aiModelStatus, 'NOT_CONNECTED')
  assert.equal(session.automaticGeometryAllowed, false)
  assert.equal(session.humanReviewRequired, true)
  assert.equal(session.rulesValidationRequired, true)
  assert.equal(session.sourceEvidenceRequired, true)
  assert.equal(session.productionApproved, false)
  assert.equal(session.job.machineReady, false)
})
