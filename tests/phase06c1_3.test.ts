import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHybridSessionFromGuidedAi } from '../src/aiConstructorHandoff'
import { confirmFacadeFlowGuidedProduct, createFacadeFlowAiSession, prepareFacadeFlowGuidedProduct, selectFacadeFlowAiInputMode, selectFacadeFlowJobType, setFacadeFlowGuidedReviewAccepted, updateFacadeFlowGuidedProduct } from '../src/aiWorkspaceState'
import { sampleCatalogueProfiles } from '../src/profileCatalogueData'
import type { FacadeFlowGuidedProductDraft } from '../src/aiWorkspaceTypes'

const patch: Partial<FacadeFlowGuidedProductDraft> = {
  productType: 'WINDOW', name: 'W-visual', quantity: '1', width: '1400', height: '1200', profileSystem: 'DEMO SYSTEM', frameProfileId: 'profile-demo-frame-01', sashProfileId: 'profile-demo-sash-01', mullionProfileId: 'profile-demo-mullion-01',
  openingType: 'TILT_TURN', openingDirection: 'LEFT', inwardOutward: 'INWARD', fillType: 'GLAZING_UNIT', fillDescription: '4 / 16 / 4', colorMode: 'SAME_BOTH_SIDES', exteriorColor: 'RAL 7016', hardwareType: 'WINDOW', hardwareDescription: 'TEST', handleType: 'STANDARD', handleDescription: 'TEST HANDLE', hingeQuantity: '2',
}
const confirmed = () => {
  let session = selectFacadeFlowAiInputMode(selectFacadeFlowJobType(createFacadeFlowAiSession('06c1_3'), 'SINGLE_PRODUCT'), 'DESCRIPTION')
  session = updateFacadeFlowGuidedProduct(session, patch, sampleCatalogueProfiles)
  session = prepareFacadeFlowGuidedProduct(session, sampleCatalogueProfiles)
  session = setFacadeFlowGuidedReviewAccepted(session, true)
  return confirmFacadeFlowGuidedProduct(session, sampleCatalogueProfiles)
}

test('06C.1.3 preserves confirmed width and height as handoff evidence for the semantic preview', () => {
  const handoff = createHybridSessionFromGuidedAi(confirmed(), sampleCatalogueProfiles)!.guidedAiHandoff!
  assert.deepEqual(handoff.dimensions, { width: '1400', height: '1200' })
  assert.equal(handoff.automaticGeometryAllowed, false)
  assert.equal(handoff.rulesValidated, false)
  assert.equal(handoff.machineReady, false)
})

test('06C.1.3 visual preview reflects only confirmed dimensions/opening and explicitly refuses to invent mullion position', () => {
  const preview = readFileSync('src/components/GuidedHandoffPreview.tsx', 'utf8')
  assert.match(preview, /КОНЦЕПТУАЛЕН ПРЕГЛЕД/)
  assert.match(preview, /handoff\.dimensions\.width/)
  assert.match(preview, /handoff\.dimensions\.height/)
  assert.match(preview, /handoff\.opening\.direction/)
  assert.match(preview, /позицията е неуточнена и затова не е начертан/)
  assert.equal(preview.includes('geometryCreated'), false)
  assert.equal(preview.includes('createGeometry'), false)
})

test('06C.1.3 handoff page uses a unified preview/evidence layout and keeps safety states visible', () => {
  const constructor = readFileSync('src/components/DetailDraftingPlaceholder.tsx', 'utf8')
  const css = readFileSync('src/structuredConfiguration.css', 'utf8')
  assert.match(constructor, /GuidedHandoffPreview/)
  assert.match(constructor, /Размер/)
  assert.match(constructor, /RULES VALIDATED: NO/)
  assert.match(constructor, /AUTOMATIC GEOMETRY: NO/)
  assert.match(constructor, /MACHINE READY: NO/)
  assert.match(css, /hybrid-ai-handoff-layout/)
  assert.match(css, /hybrid-handoff-preview/)
})

test('06C.1.3 constructor opened from AI returns to the previous AI draft instead of the main page', () => {
  const app = readFileSync('src/App.tsx', 'utf8')
  const constructor = readFileSync('src/components/DetailDraftingPlaceholder.tsx', 'utf8')
  assert.match(app, /detailDraftingOrigin/)
  assert.match(app, /setDetailDraftingOrigin\('AI'\)/)
  assert.match(app, /if \(detailDraftingOrigin === 'AI'\) setShowAiWorkspace\(true\)/)
  assert.match(app, /returnToAi=\{detailDraftingOrigin === 'AI'\}/)
  assert.match(constructor, /Назад към AI черновата/)
  assert.match(constructor, /guidedReturn \? onClose\(\)/)
})

test('06C.1.3 direct constructor entry still returns to main FacadeFlow', () => {
  const app = readFileSync('src/App.tsx', 'utf8')
  const constructor = readFileSync('src/components/DetailDraftingPlaceholder.tsx', 'utf8')
  assert.match(app, /openDetailDraftingFromMain/)
  assert.match(app, /setDetailDraftingOrigin\('MAIN'\)/)
  assert.match(constructor, /guidedReturn \? 'Назад към AI черновата' : 'Назад към FacadeFlow'/)
})

test('06C.1.3 does not add network, persistence, machine export or automatic geometry behavior', () => {
  const sources = ['src/components/GuidedHandoffPreview.tsx', 'src/components/DetailDraftingPlaceholder.tsx', 'src/aiConstructorHandoff.ts'].map((file) => readFileSync(file, 'utf8')).join('\n')
  for (const forbidden of ['fetch(', 'WebSocket', 'XMLHttpRequest', 'localStorage', 'indexedDB', 'machinePayload', 'dwgWriter']) assert.equal(sources.includes(forbidden), false)
  assert.match(sources, /automaticGeometryAllowed: false/)
  assert.match(sources, /machineReady: false/)
})
