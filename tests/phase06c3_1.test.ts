import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { FACADEFLOW_AI_DEMO_SCENARIOS, applyFacadeFlowAiDemoScenario, createFacadeFlowAiSession } from '../src/aiWorkspaceState'
import { sampleCatalogueProfiles } from '../src/profileCatalogueData'
import { projectStructurePathLabels } from '../src/projectStructure'

void test('06C.3.1 exposes a six-station demo suite covering every AI work mode plus knowledge base', () => {
  assert.deepEqual(Object.keys(FACADEFLOW_AI_DEMO_SCENARIOS), ['PROJECT_DOCUMENTS', 'GUIDED_WINDOW', 'GUIDED_DOOR', 'SKETCH', 'MANUAL', 'KNOWLEDGE_BASE'])
  const modes = new Set(['DOCUMENTS', 'DESCRIPTION', 'SKETCH', 'MANUAL'])
  for (const scenario of ['PROJECT_DOCUMENTS', 'GUIDED_WINDOW', 'GUIDED_DOOR', 'SKETCH', 'MANUAL'] as const) {
    const session = applyFacadeFlowAiDemoScenario(createFacadeFlowAiSession(`demo-${scenario}`), scenario, sampleCatalogueProfiles)
    assert.ok(session.job.inputMode)
    modes.delete(session.job.inputMode)
  }
  assert.equal(modes.size, 0)
})

void test('06C.3.1 project/documents demo loads an explicit DEMO hierarchy without claiming an uploaded source', () => {
  const session = applyFacadeFlowAiDemoScenario(createFacadeFlowAiSession('demo-docs'), 'PROJECT_DOCUMENTS', sampleCatalogueProfiles)
  assert.equal(session.job.jobType, 'BUILDING')
  assert.equal(session.job.inputMode, 'DOCUMENTS')
  assert.equal(session.job.demoScenario, 'PROJECT_DOCUMENTS')
  assert.deepEqual(projectStructurePathLabels(session.job.projectStructure), ['DEMO · Корпус А', 'DEMO · Етаж 2', 'DEMO · Южна фасада', 'DEMO-W-21'])
  assert.equal(session.job.products.length, 0)
  assert.equal(session.job.description, '')
})

void test('06C.3.1 guided window and door stations preload complete DEMO drafts but never human-confirm them', () => {
  const windowSession = applyFacadeFlowAiDemoScenario(createFacadeFlowAiSession('demo-window'), 'GUIDED_WINDOW', sampleCatalogueProfiles)
  const doorSession = applyFacadeFlowAiDemoScenario(createFacadeFlowAiSession('demo-door'), 'GUIDED_DOOR', sampleCatalogueProfiles)
  assert.equal(windowSession.job.guidedProduct.productType, 'WINDOW')
  assert.equal(windowSession.job.guidedProduct.name, 'DEMO-W-01')
  assert.equal(windowSession.job.guidedProduct.status, 'NEEDS_REVIEW')
  assert.equal(windowSession.job.guidedProduct.reviewAccepted, false)
  assert.equal(doorSession.job.guidedProduct.productType, 'DOOR')
  assert.equal(doorSession.job.guidedProduct.name, 'DEMO-D-01')
  assert.match(doorSession.job.guidedProduct.thresholdDescription, /DEMO/)
  assert.equal(doorSession.job.guidedProduct.status, 'NEEDS_REVIEW')
  assert.equal(doorSession.productionApproved, false)
})

void test('06C.3.1 sketch demo demonstrates routing without inventing a sketch file or evidence record', () => {
  const session = applyFacadeFlowAiDemoScenario(createFacadeFlowAiSession('demo-sketch'), 'SKETCH', sampleCatalogueProfiles)
  assert.equal(session.job.inputMode, 'SKETCH')
  assert.equal(session.job.jobType, 'CUSTOM_ORDER')
  assert.equal(session.job.products.length, 0)
  assert.equal(session.job.technicalDetails.length, 0)
  assert.equal(session.job.projectStructure.nodes.every((node) => node.evidence.length === 0), true)
  assert.deepEqual(projectStructurePathLabels(session.job.projectStructure), ['DEMO · Витрина А', 'DEMO-S-01'])
})

void test('06C.3.1 manual station stays independent from AI and routes to a DEMO technical-detail context', () => {
  const session = applyFacadeFlowAiDemoScenario(createFacadeFlowAiSession('demo-manual'), 'MANUAL', sampleCatalogueProfiles)
  assert.equal(session.job.inputMode, 'MANUAL')
  assert.equal(session.job.jobType, 'TECHNICAL_DETAIL')
  assert.deepEqual(projectStructurePathLabels(session.job.projectStructure), ['DEMO · Ръчен детайл D-01'])
  assert.equal(session.aiModelStatus, 'NOT_CONNECTED')
  assert.equal(session.automaticGeometryAllowed, false)
})

void test('06C.3.1 knowledge-base station opens data/catalogues while leaving missing engineering data intentionally empty', () => {
  const session = applyFacadeFlowAiDemoScenario(createFacadeFlowAiSession('demo-kb'), 'KNOWLEDGE_BASE', sampleCatalogueProfiles)
  assert.equal(session.view, 'KNOWLEDGE_BASE')
  assert.equal(session.job.demoScenario, 'KNOWLEDGE_BASE')
  assert.equal(session.job.products.length, 0)
  assert.equal(session.productionApproved, false)
})

void test('06C.3.1 UI makes the full demo coverage and all six contexts explicit', () => {
  const workspace = readFileSync('src/components/FacadeFlowAIWorkspace.tsx', 'utf8')
  const css = readFileSync('src/aiWorkspace.css', 'utf8')
  const state = readFileSync('src/aiWorkspaceState.ts', 'utf8')
  assert.match(workspace, /ДЕМО ЦЕНТЪР · ЦЯЛАТА AI СЕКЦИЯ/)
  assert.match(workspace, /6 ДЕМО станции/)
  assert.match(workspace, /6\/6 работни контекста/)
  assert.match(state, /PROJECT_DOCUMENTS/)
  assert.match(state, /GUIDED_WINDOW/)
  assert.match(state, /GUIDED_DOOR/)
  assert.match(state, /KNOWLEDGE_BASE/)
  assert.match(css, /ff-ai-demo-suite/)
  assert.match(css, /ff-ai-kb-demo-banner/)
})

void test('06C.3.1 adds no persistence, network, machine output, production approval or automatic geometry', () => {
  const combined = ['src/aiWorkspaceState.ts', 'src/components/FacadeFlowAIWorkspace.tsx', 'src/aiWorkspaceTypes.ts'].map((path) => readFileSync(path, 'utf8')).join('\n')
  assert.doesNotMatch(combined, /fetch\s*\(/)
  assert.doesNotMatch(combined, /WebSocket\s*\(/)
  assert.doesNotMatch(combined, /localStorage|sessionStorage/)
  assert.doesNotMatch(combined, /machineReady\s*:\s*true|automaticGeometryAllowed\s*:\s*true|productionApproved\s*:\s*true/)
})
