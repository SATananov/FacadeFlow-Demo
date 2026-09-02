import test from 'node:test'
import assert from 'node:assert/strict'
import { interpretFacadeFlowPrompt } from '../src/aiPromptInterpreter'
import { facadeFlowPromptIntentToGuidedPatch } from '../src/aiPromptGuidedBridge'
import type { CatalogueProfile, ProfileRole } from '../src/profileCatalogueTypes'

const profile = (id: string, role: ProfileRole, code: string): CatalogueProfile => ({
  id, role, system: 'SYS-90', code, nameBg: code, dimensionA: 70, dimensionB: 50,
  status: 'EXPERT_CONFIRMED', createdAt: '2026-09-01', updatedAt: '2026-09-01',
  simulationOnly: true, requiresHumanApproval: true,
})
const profiles = [profile('f1', 'FRAME', 'F-01'), profile('s1', 'SASH', 'S-01'), profile('m1', 'MULLION', 'M-01')]

test('AI01.3 bridges exact catalogue system/profile matches as selections', () => {
  const intent = interpretFacadeFlowPrompt('прозорец 1200x1000, 1 поле, system SYS-90, каса F-01, sash profile S-01, turn, opening: left, inward, triple glazing, RAL 7016, black handle, 2 hinges.').intent
  const result = facadeFlowPromptIntentToGuidedPatch(intent, profiles)
  assert.equal(result.patch.productType, 'WINDOW')
  assert.equal(result.patch.profileSystem, 'SYS-90')
  assert.equal(result.patch.frameProfileId, 'f1')
  assert.equal(result.patch.sashProfileId, 's1')
  assert.equal(result.patch.openingType, 'TURN')
  assert.equal(result.patch.openingDirection, 'LEFT')
  assert.equal(result.patch.inwardOutward, 'INWARD')
  assert.equal(result.patch.hingeQuantity, '2')
  assert.equal(result.patch.reviewAccepted, false)
  assert.equal(result.machineReady, false)
})

test('AI01.3 keeps unknown profile systems/manual profile codes as reviewable manual values', () => {
  const intent = interpretFacadeFlowPrompt('прозорец 1000x1000, 1 поле, system UNKNOWN-77, каса ZZ-01, fixed').intent
  const result = facadeFlowPromptIntentToGuidedPatch(intent, profiles)
  assert.equal(result.patch.profileSystem, undefined)
  assert.equal(result.patch.manualProfileSystem, 'UNKNOWN-77')
  assert.equal(result.patch.manualFrameProfile, 'ZZ-01')
})

test('AI01.3 never turns multi-field prompt topology into automatic guided geometry', () => {
  const intent = interpretFacadeFlowPrompt('прозорец 2400x1500, 3 полета, лявото fixed, средното tilt-turn, дясното fixed, system SYS-90').intent
  const result = facadeFlowPromptIntentToGuidedPatch(intent, profiles)
  assert.equal(result.patch.openingType, undefined)
  assert.ok(result.notTransferred.some((item) => /Топологията/i.test(item)))
  assert.equal(result.automaticGeometryAllowed, false)
})

test('AI01.3 transfers finish and glazing only as NEEDS_REVIEW guided values', () => {
  const intent = interpretFacadeFlowPrompt('прозорец 1000x1000, 1 поле, fixed, system SYS-90, RAL 7016, троен стъклопакет').intent
  const result = facadeFlowPromptIntentToGuidedPatch(intent, profiles)
  assert.equal(result.patch.colorMode, 'PROJECT_DEFINED')
  assert.equal(result.patch.exteriorColor, 'RAL 7016')
  assert.equal(result.patch.fillType, 'GLAZING_UNIT')
  assert.equal(result.patch.status, 'NEEDS_REVIEW')
})

test('AI01.3 preserves prompt provenance in notes', () => {
  const prompt = 'window 1000x1000, 1 field, fixed, system SYS-90'
  const result = facadeFlowPromptIntentToGuidedPatch(interpretFacadeFlowPrompt(prompt).intent, profiles)
  assert.match(result.patch.notes ?? '', /ИЗТОЧНИК ОТ ОПИСАНИЕ/)
  assert.match(result.patch.notes ?? '', /window 1000x1000/)
})

test('AI01.3 does not invent a hardware type when the prompt contains no hardware evidence', () => {
  const intent = interpretFacadeFlowPrompt('прозорец 1000x1000, 1 поле, fixed, system SYS-90').intent
  const result = facadeFlowPromptIntentToGuidedPatch(intent, profiles)
  assert.equal(result.patch.hardwareType, undefined)
  assert.equal(result.patch.handleType, undefined)
})
