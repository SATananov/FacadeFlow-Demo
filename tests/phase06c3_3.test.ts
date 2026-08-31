import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { applyFacadeFlowAiDemoScenario, completeFacadeFlowDemoHumanReview, createFacadeFlowAiSession, prepareFacadeFlowDemoReviewPacket, prepareFacadeFlowDemoRulesGate, setFacadeFlowDemoReviewAccepted, updateFacadeFlowJobMetadata } from '../src/aiWorkspaceState'
import { sampleCatalogueProfiles } from '../src/profileCatalogueData'
import type { FacadeFlowAiDemoScenario } from '../src/aiWorkspaceTypes'

const scenarios: FacadeFlowAiDemoScenario[] = ['PROJECT_DOCUMENTS', 'GUIDED_WINDOW', 'GUIDED_DOOR', 'SKETCH', 'MANUAL', 'KNOWLEDGE_BASE']

function humanReviewedScenario(scenario: FacadeFlowAiDemoScenario) {
  let session = prepareFacadeFlowDemoReviewPacket(applyFacadeFlowAiDemoScenario(createFacadeFlowAiSession(`rules-${scenario}`), scenario, sampleCatalogueProfiles), sampleCatalogueProfiles)
  session = setFacadeFlowDemoReviewAccepted(session, true)
  return completeFacadeFlowDemoHumanReview(session)
}

void test('06C.3.3 rules framework cannot be prepared before the unified packet is HUMAN_REVIEWED', () => {
  for (const scenario of scenarios) {
    const prepared = prepareFacadeFlowDemoReviewPacket(applyFacadeFlowAiDemoScenario(createFacadeFlowAiSession(`blocked-${scenario}`), scenario, sampleCatalogueProfiles), sampleCatalogueProfiles)
    const blocked = prepareFacadeFlowDemoRulesGate(prepared)
    assert.equal(blocked.job.reviewPacket?.ruleGate, null, scenario)
  }
})

void test('06C.3.3 every DEMO mode can prepare the same source-first rules gate envelope after Human Review', () => {
  for (const scenario of scenarios) {
    const session = prepareFacadeFlowDemoRulesGate(humanReviewedScenario(scenario))
    const gate = session.job.reviewPacket?.ruleGate
    assert.ok(gate, scenario)
    assert.equal(gate.status, 'FRAMEWORK_READY')
    assert.equal(gate.sourcePolicy, 'TRACEABLE_SOURCE_REQUIRED')
    assert.equal(gate.ruleSetRevision, null)
    assert.equal(gate.realRuleCount, 0)
    assert.equal(gate.validated, false)
    assert.equal(gate.simulationOnly, true)
    assert.equal(gate.machineReady, false)
    assert.ok(gate.requirements.some((item) => item.id === 'SOURCE_TRACEABILITY' && item.applicability === 'REQUIRED'))
  }
})

void test('06C.3.3 guided product rules expose categories only, with door threshold required and window threshold not auto-required', () => {
  const windowGate = prepareFacadeFlowDemoRulesGate(humanReviewedScenario('GUIDED_WINDOW')).job.reviewPacket!.ruleGate!
  const doorGate = prepareFacadeFlowDemoRulesGate(humanReviewedScenario('GUIDED_DOOR')).job.reviewPacket!.ruleGate!
  for (const id of ['GEOMETRY_LIMITS', 'PROFILE_COMPATIBILITY', 'OPENING_HARDWARE', 'GLAZING_FILL', 'FINISH_COLOR'] as const) {
    assert.equal(windowGate.requirements.find((item) => item.id === id)?.state, 'SOURCE_REQUIRED')
    assert.equal(doorGate.requirements.find((item) => item.id === id)?.state, 'SOURCE_REQUIRED')
  }
  assert.equal(windowGate.requirements.find((item) => item.id === 'THRESHOLD')?.state, 'NOT_APPLICABLE')
  assert.equal(doorGate.requirements.find((item) => item.id === 'THRESHOLD')?.state, 'SOURCE_REQUIRED')
})

void test('06C.3.3 non-product routes defer product-specific rule categories instead of inventing applicability', () => {
  for (const scenario of ['PROJECT_DOCUMENTS', 'SKETCH', 'MANUAL', 'KNOWLEDGE_BASE'] as const) {
    const gate = prepareFacadeFlowDemoRulesGate(humanReviewedScenario(scenario)).job.reviewPacket!.ruleGate!
    assert.equal(gate.requirements.find((item) => item.id === 'GEOMETRY_LIMITS')?.state, 'DEFERRED', scenario)
    assert.equal(gate.requirements.find((item) => item.id === 'PROFILE_COMPATIBILITY')?.state, 'DEFERRED', scenario)
    assert.equal(gate.requirements.find((item) => item.id === 'THRESHOLD')?.state, 'DEFERRED', scenario)
  }
})

void test('06C.3.3 rule categories contain no fake evidence, rule revision or validated result', () => {
  const gate = prepareFacadeFlowDemoRulesGate(humanReviewedScenario('GUIDED_DOOR')).job.reviewPacket!.ruleGate!
  assert.equal(gate.realRuleCount, 0)
  assert.equal(gate.ruleSetRevision, null)
  assert.equal(gate.validated, false)
  for (const item of gate.requirements) assert.deepEqual(item.evidence, [])
})

void test('06C.3.3 preparing the framework never confirms the product or unlocks handoff / production', () => {
  const session = prepareFacadeFlowDemoRulesGate(humanReviewedScenario('GUIDED_WINDOW'))
  assert.equal(session.job.reviewPacket?.status, 'HUMAN_REVIEWED')
  assert.equal(session.job.reviewPacket?.rulesValidated, false)
  assert.equal(session.job.guidedProduct.status, 'NEEDS_REVIEW')
  assert.equal(session.productionApproved, false)
  assert.equal(session.job.machineReady, false)
})

void test('06C.3.3 changing captured job data invalidates the packet and rules framework together', () => {
  const session = prepareFacadeFlowDemoRulesGate(humanReviewedScenario('GUIDED_WINDOW'))
  assert.ok(session.job.reviewPacket?.ruleGate)
  const changed = updateFacadeFlowJobMetadata(session, { reference: 'DEMO-W-01-RULE-REV-B' })
  assert.equal(changed.job.reviewPacket, null)
})

void test('06C.3.3 UI exposes source-first categories while keeping the downstream gate locked and adding no unsafe path', () => {
  const component = readFileSync('src/components/UnifiedDemoPipeline.tsx', 'utf8')
  const gate = readFileSync('src/aiRulesGate.ts', 'utf8')
  const state = readFileSync('src/aiWorkspaceState.ts', 'utf8')
  const css = readFileSync('src/aiWorkspace.css', 'utf8')
  const combined = [component, gate, state].join('\n')
  assert.match(component, /Подготви рамка за правила/)
  assert.match(component, /РЕАЛНИ ПРАВИЛА:/)
  assert.match(component, /ПРОВЕРКА ПО ПРАВИЛА: НЕ Е ИЗПЪЛНЕНА/)
  assert.match(component, /Стъпка 5 остава заключена/)
  assert.match(gate, /TRACEABLE_SOURCE_REQUIRED/)
  assert.match(css, /ff-ai-rules-gate/)
  assert.doesNotMatch(combined, /fetch\s*\(|WebSocket\s*\(|localStorage|sessionStorage/)
  assert.doesNotMatch(combined, /machineReady\s*:\s*true|rulesValidated\s*:\s*true|productionApproved\s*:\s*true/)
})
