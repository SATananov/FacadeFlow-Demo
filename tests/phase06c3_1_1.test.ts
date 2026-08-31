import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { FACADEFLOW_AI_DEMO_SCENARIOS, FACADEFLOW_AI_INPUT_LABELS, applyFacadeFlowAiDemoScenario, createFacadeFlowAiSession } from '../src/aiWorkspaceState'
import { sampleCatalogueProfiles } from '../src/profileCatalogueData'

void test('06C.3.1.1 uses clear step-by-step Bulgarian labels for the guided workflow', () => {
  assert.equal(FACADEFLOW_AI_INPUT_LABELS.DESCRIPTION.title, 'Стъпка по стъпка / описание')
  assert.equal(FACADEFLOW_AI_DEMO_SCENARIOS.GUIDED_WINDOW.title, 'Прозорец · стъпка по стъпка')
  assert.equal(FACADEFLOW_AI_DEMO_SCENARIOS.GUIDED_DOOR.title, 'Врата · стъпка по стъпка')
})

void test('06C.3.1.1 demo metadata uses the same understandable terminology', () => {
  const windowSession = applyFacadeFlowAiDemoScenario(createFacadeFlowAiSession('demo-window-label'), 'GUIDED_WINDOW', sampleCatalogueProfiles)
  const doorSession = applyFacadeFlowAiDemoScenario(createFacadeFlowAiSession('demo-door-label'), 'GUIDED_DOOR', sampleCatalogueProfiles)
  assert.equal(windowSession.job.name, 'DEMO · Прозорец · стъпка по стъпка')
  assert.equal(doorSession.job.name, 'DEMO · Врата · стъпка по стъпка')
  assert.match(windowSession.job.description, /режим „Стъпка по стъпка“/)
  assert.match(doorSession.job.description, /режим „Стъпка по стъпка“/)
})

void test('06C.3.1.1 removes the ambiguous visible Bulgarian guided labels without renaming stable internal enum keys', () => {
  const state = readFileSync('src/aiWorkspaceState.ts', 'utf8')
  const workspace = readFileSync('src/components/FacadeFlowAIWorkspace.tsx', 'utf8')
  assert.doesNotMatch(state, /Води ме \/ описание|Воден прозорец|Водена врата/)
  assert.match(state, /GUIDED_WINDOW/)
  assert.match(state, /GUIDED_DOOR/)
  assert.match(workspace, /Формулярът „Стъпка по стъпка“/)
})

void test('06C.3.1.1 is terminology-only and preserves all safety boundaries', () => {
  const combined = ['src/aiWorkspaceState.ts', 'src/components/FacadeFlowAIWorkspace.tsx'].map((path) => readFileSync(path, 'utf8')).join('\n')
  assert.doesNotMatch(combined, /machineReady\s*:\s*true|automaticGeometryAllowed\s*:\s*true|productionApproved\s*:\s*true/)
  assert.doesNotMatch(combined, /fetch\s*\(|WebSocket\s*\(|localStorage|sessionStorage/)
})
