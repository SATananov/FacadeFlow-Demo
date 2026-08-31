import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { applyFacadeFlowAiDemoScenario, completeFacadeFlowDemoHumanReview, createFacadeFlowAiSession, prepareFacadeFlowDemoReviewPacket, setFacadeFlowDemoReviewAccepted, updateFacadeFlowJobMetadata } from '../src/aiWorkspaceState'
import { sampleCatalogueProfiles } from '../src/profileCatalogueData'
import type { FacadeFlowAiDemoScenario } from '../src/aiWorkspaceTypes'

const scenarios: FacadeFlowAiDemoScenario[] = ['PROJECT_DOCUMENTS', 'GUIDED_WINDOW', 'GUIDED_DOOR', 'SKETCH', 'MANUAL', 'KNOWLEDGE_BASE']

void test('06C.3.2 normalizes every DEMO station into the same structured review packet envelope', () => {
  for (const scenario of scenarios) {
    const demo = applyFacadeFlowAiDemoScenario(createFacadeFlowAiSession(`packet-${scenario}`), scenario, sampleCatalogueProfiles)
    const prepared = prepareFacadeFlowDemoReviewPacket(demo, sampleCatalogueProfiles)
    const packet = prepared.job.reviewPacket
    assert.ok(packet, scenario)
    assert.equal(packet.demoScenario, scenario)
    assert.equal(packet.status, 'NEEDS_REVIEW')
    assert.equal(packet.aiGenerated, false)
    assert.equal(packet.rulesValidated, false)
    assert.equal(packet.simulationOnly, true)
    assert.equal(packet.machineReady, false)
    assert.ok(packet.sections.some((item) => item.id === 'RULES' && item.state === 'UNRESOLVED'))
  }
})

void test('06C.3.2 guided window and door packets link a NEEDS_REVIEW product specification without auto-confirming it', () => {
  for (const scenario of ['GUIDED_WINDOW', 'GUIDED_DOOR'] as const) {
    const prepared = prepareFacadeFlowDemoReviewPacket(applyFacadeFlowAiDemoScenario(createFacadeFlowAiSession(`guided-${scenario}`), scenario, sampleCatalogueProfiles), sampleCatalogueProfiles)
    const packet = prepared.job.reviewPacket!
    assert.equal(packet.kind, 'PRODUCT')
    assert.ok(packet.linkedProductSpecificationId)
    const product = prepared.job.products.find((item) => item.id === packet.linkedProductSpecificationId)
    assert.ok(product)
    assert.equal(product.status, 'NEEDS_REVIEW')
    assert.equal(product.machineReady, false)
    assert.notEqual(prepared.job.guidedProduct.status, 'HUMAN_CONFIRMED')
  }
})

void test('06C.3.2 documents and sketch packets never invent uploaded files, evidence or extracted product data', () => {
  for (const scenario of ['PROJECT_DOCUMENTS', 'SKETCH'] as const) {
    const prepared = prepareFacadeFlowDemoReviewPacket(applyFacadeFlowAiDemoScenario(createFacadeFlowAiSession(`source-${scenario}`), scenario, sampleCatalogueProfiles), sampleCatalogueProfiles)
    const packet = prepared.job.reviewPacket!
    assert.equal(packet.evidence.length, 0)
    assert.equal(prepared.job.products.length, 0)
    assert.ok(packet.unresolved.some((item) => /Няма реално качен/.test(item)))
    assert.ok(packet.sections.some((item) => item.id === 'EVIDENCE' && item.state === 'UNRESOLVED'))
  }
})

void test('06C.3.2 manual route and knowledge base also use the common packet without pretending to be a product', () => {
  const manual = prepareFacadeFlowDemoReviewPacket(applyFacadeFlowAiDemoScenario(createFacadeFlowAiSession('manual-packet'), 'MANUAL', sampleCatalogueProfiles), sampleCatalogueProfiles)
  const kb = prepareFacadeFlowDemoReviewPacket(applyFacadeFlowAiDemoScenario(createFacadeFlowAiSession('kb-packet'), 'KNOWLEDGE_BASE', sampleCatalogueProfiles), sampleCatalogueProfiles)
  assert.equal(manual.job.reviewPacket?.kind, 'MANUAL_ROUTE')
  assert.equal(manual.job.products.length, 0)
  assert.equal(kb.job.reviewPacket?.kind, 'KNOWLEDGE_CONTEXT')
  assert.equal(kb.job.reviewPacket?.inputMode, 'KNOWLEDGE_BASE')
  assert.equal(kb.job.products.length, 0)
})

void test('06C.3.2 Human Review is an acknowledgement and never becomes product HUMAN_CONFIRMED', () => {
  let session = prepareFacadeFlowDemoReviewPacket(applyFacadeFlowAiDemoScenario(createFacadeFlowAiSession('human-review'), 'GUIDED_WINDOW', sampleCatalogueProfiles), sampleCatalogueProfiles)
  const before = completeFacadeFlowDemoHumanReview(session)
  assert.equal(before.job.reviewPacket?.status, 'NEEDS_REVIEW')
  session = setFacadeFlowDemoReviewAccepted(session, true)
  session = completeFacadeFlowDemoHumanReview(session)
  assert.equal(session.job.reviewPacket?.status, 'HUMAN_REVIEWED')
  assert.equal(session.job.guidedProduct.status, 'NEEDS_REVIEW')
  assert.equal(session.job.intakeStatus, 'NEEDS_REVIEW')
  assert.equal(session.productionApproved, false)
})

void test('06C.3.2 changing captured metadata invalidates the normalized packet so stale review cannot survive', () => {
  const prepared = prepareFacadeFlowDemoReviewPacket(applyFacadeFlowAiDemoScenario(createFacadeFlowAiSession('invalidate-packet'), 'GUIDED_WINDOW', sampleCatalogueProfiles), sampleCatalogueProfiles)
  assert.ok(prepared.job.reviewPacket)
  const changed = updateFacadeFlowJobMetadata(prepared, { reference: 'DEMO-W-01-REV-B' })
  assert.equal(changed.job.reviewPacket, null)
})

void test('06C.3.2 UI exposes the common specification, Human Review acknowledgement and locked downstream gates', () => {
  const component = readFileSync('src/components/UnifiedDemoPipeline.tsx', 'utf8')
  const workspace = readFileSync('src/components/FacadeFlowAIWorkspace.tsx', 'utf8')
  const css = readFileSync('src/aiWorkspace.css', 'utf8')
  assert.match(component, /Един формат за всеки AI режим/)
  assert.match(component, /Подготви обща DEMO спецификация/)
  assert.match(component, /ЧОВЕШКИ ПРЕГЛЕД · ГОТОВ/)
  assert.match(component, /ИЗДЕЛИЕ ПОТВЪРДЕНО ОТ ЧОВЕК: НЕ/)
  assert.match(workspace, /<UnifiedDemoPipeline/)
  assert.match(css, /ff-ai-unified-demo-pipeline/)
})

void test('06C.3.2 introduces no network, persistence, automatic geometry, rule approval or machine-ready path', () => {
  const combined = ['src/aiUnifiedReview.ts', 'src/aiWorkspaceState.ts', 'src/components/UnifiedDemoPipeline.tsx', 'src/aiWorkspaceTypes.ts'].map((path) => readFileSync(path, 'utf8')).join('\n')
  assert.doesNotMatch(combined, /fetch\s*\(|WebSocket\s*\(|localStorage|sessionStorage/)
  assert.doesNotMatch(combined, /machineReady\s*:\s*true|rulesValidated\s*:\s*true|automaticGeometryAllowed\s*:\s*true|productionApproved\s*:\s*true/)
})
