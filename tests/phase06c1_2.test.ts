import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { canCreateGuidedConstructorHandoff, createHybridSessionFromGuidedAi } from '../src/aiConstructorHandoff'
import { confirmFacadeFlowGuidedProduct, createFacadeFlowAiSession, prepareFacadeFlowGuidedProduct, selectFacadeFlowAiInputMode, selectFacadeFlowJobType, setFacadeFlowGuidedReviewAccepted, updateFacadeFlowGuidedProduct } from '../src/aiWorkspaceState'
import { sampleCatalogueProfiles } from '../src/profileCatalogueData'
import type { FacadeFlowGuidedProductDraft } from '../src/aiWorkspaceTypes'

const create = () => selectFacadeFlowAiInputMode(selectFacadeFlowJobType(createFacadeFlowAiSession('phase06c1_2'), 'SINGLE_PRODUCT'), 'DESCRIPTION')
const fullWindowPatch: Partial<FacadeFlowGuidedProductDraft> = {
  productType: 'WINDOW' as const, name: 'W-01', quantity: '2', width: '1400', height: '1200', profileSystem: 'DEMO SYSTEM', frameProfileId: 'profile-demo-frame-01', sashProfileId: 'profile-demo-sash-01', mullionProfileId: 'profile-demo-mullion-01',
  openingType: 'TILT_TURN' as const, openingDirection: 'LEFT' as const, inwardOutward: 'INWARD' as const,
  fillType: 'GLAZING_UNIT' as const, fillDescription: '4 / 16 / 4 Low-E', colorMode: 'DIFFERENT_SIDES' as const, exteriorColor: 'RAL 7016', interiorColor: 'Бяло',
  hardwareType: 'WINDOW' as const, hardwareDescription: 'Обков TEST', handleType: 'STANDARD' as const, handleDescription: 'Дръжка TEST', hingeQuantity: '2', notes: 'Делител по проект.',
}
const confirm = (patch = fullWindowPatch) => {
  let session = create()
  session = updateFacadeFlowGuidedProduct(session, patch, sampleCatalogueProfiles)
  session = prepareFacadeFlowGuidedProduct(session, sampleCatalogueProfiles)
  session = setFacadeFlowGuidedReviewAccepted(session, true)
  return confirmFacadeFlowGuidedProduct(session, sampleCatalogueProfiles)
}

test('06C.1.2 handoff is blocked until the guided product is HUMAN_CONFIRMED', () => {
  const draft = updateFacadeFlowGuidedProduct(create(), fullWindowPatch, sampleCatalogueProfiles)
  assert.equal(canCreateGuidedConstructorHandoff(draft), false)
  assert.equal(createHybridSessionFromGuidedAi(draft, sampleCatalogueProfiles), null)
  const confirmed = confirm()
  assert.equal(canCreateGuidedConstructorHandoff(confirmed), true)
})

test('06C.1.2 confirmed catalogue-backed window opens directly in STANDARD_DRAFT with semantic fields prefilled', () => {
  const hybrid = createHybridSessionFromGuidedAi(confirm(), sampleCatalogueProfiles, 'hybrid-handoff')
  assert.ok(hybrid)
  assert.equal(hybrid.id, 'hybrid-handoff')
  assert.equal(hybrid.creationRoute, 'STANDARD')
  assert.equal(hybrid.productCategory, 'WINDOW')
  assert.equal(hybrid.workflowStep, 'STANDARD_DRAFT')
  assert.equal(hybrid.configuration?.productName, 'W-01')
  assert.equal(hybrid.configuration?.overallWidth, '1400')
  assert.equal(hybrid.configuration?.overallHeight, '1200')
  assert.equal(hybrid.configuration?.profileSystem, 'DEMO SYSTEM')
  assert.equal(hybrid.configuration?.frameProfileId, 'profile-demo-frame-01')
  assert.equal(hybrid.configuration?.sashProfileId, 'profile-demo-sash-01')
  assert.equal(hybrid.configuration?.mullionProfileId, 'profile-demo-mullion-01')
  assert.equal(hybrid.configuration?.wizardStep, 5)
  assert.equal(hybrid.configuration?.humanReviewChecked, false)
  assert.equal(hybrid.configuration?.status, 'NEEDS_REVIEW')
})

test('06C.1.2 transfers non-geometric product evidence without marking rules or production ready', () => {
  const hybrid = createHybridSessionFromGuidedAi(confirm(), sampleCatalogueProfiles)!
  const handoff = hybrid.guidedAiHandoff!
  assert.equal(handoff.quantity, 2)
  assert.match(handoff.opening.type, /Отваряемо \+ падащо/)
  assert.equal(handoff.opening.direction, 'Ляво')
  assert.equal(handoff.opening.inwardOutward, 'Навътре')
  assert.match(handoff.glazing, /4 \/ 16 \/ 4 Low-E/)
  assert.equal(handoff.finish.exterior, 'RAL 7016')
  assert.equal(handoff.finish.interior, 'Бяло')
  assert.match(handoff.hardware.description, /Обков TEST/)
  assert.match(handoff.hardware.handle, /Дръжка TEST/)
  assert.match(handoff.notes, /Делител по проект/)
  assert.equal(handoff.humanConfirmed, true)
  assert.equal(handoff.rulesValidated, false)
  assert.equal(handoff.automaticGeometryAllowed, false)
  assert.equal(handoff.machineReady, false)
  assert.equal(hybrid.geometryCreated, false)
  assert.equal(hybrid.productionApproved, false)
  assert.equal(hybrid.machineReady, false)
})

test('06C.1.2 manual profile evidence remains visible but is not forced into catalogue selectors', () => {
  const manual = confirm({ ...fullWindowPatch, profileSystem: '', frameProfileId: '', sashProfileId: '', mullionProfileId: '', manualProfileSystem: '78', manualFrameProfile: '78.51', manualSashProfile: '78.27', manualMullionProfile: '78.33' })
  const hybrid = createHybridSessionFromGuidedAi(manual, sampleCatalogueProfiles)!
  assert.equal(hybrid.guidedAiHandoff?.profileEvidence.system, '78')
  assert.equal(hybrid.guidedAiHandoff?.profileEvidence.frame, '78.51')
  assert.equal(hybrid.guidedAiHandoff?.profileEvidence.sash, '78.27')
  assert.equal(hybrid.guidedAiHandoff?.profileEvidence.mullion, '78.33')
  assert.equal(hybrid.configuration?.profileSystem, '')
  assert.equal(hybrid.configuration?.frameProfileId, '')
  assert.equal(hybrid.configuration?.sashProfileId, '')
  assert.equal(hybrid.configuration?.mullionProfileId, '')
  assert.equal(hybrid.configuration?.wizardStep, 3)
})

test('06C.1.2 App replaces the hybrid session and skips the constructor start screen for confirmed handoff', () => {
  const app = readFileSync('src/App.tsx', 'utf8')
  assert.match(app, /createHybridSessionFromGuidedAi/)
  assert.match(app, /openConfirmedAiProductInConstructor/)
  assert.match(app, /replaceHybridSession\(next\)/)
  assert.match(app, /setShowAiWorkspace\(false\)/)
  assert.match(app, /setShowDetailDrafting\(true\)/)
})

test('06C.1.2 UI exposes evidence handoff and keeps custom CAD as an explicit no-handoff path', () => {
  const ai = readFileSync('src/components/FacadeFlowAIWorkspace.tsx', 'utf8')
  const constructor = readFileSync('src/components/DetailDraftingPlaceholder.tsx', 'utf8')
  assert.match(ai, /Продължи към конструктора с данните/)
  assert.match(ai, /Конструкторът чака Human Confirm/)
  assert.match(ai, /Отвори CAD без AI handoff/)
  assert.match(constructor, /AI → CONSTRUCTOR HANDOFF/)
  assert.match(constructor, /ПРАВИЛАТА НЕ СА ПРОВЕРЕНИ/)
  assert.match(constructor, /AUTOMATIC GEOMETRY: NO/)
  assert.match(constructor, /MACHINE READY: NO/)
})

test('06C.1.2 introduces no network, persistence, machine writer or automatic geometry behavior', () => {
  const handoff = readFileSync('src/aiConstructorHandoff.ts', 'utf8')
  for (const forbidden of ['fetch(', 'WebSocket', 'XMLHttpRequest', 'localStorage', 'indexedDB', 'dwgWriter', 'machineFormat', 'machinePayload']) assert.equal(handoff.includes(forbidden), false)
  assert.match(handoff, /rulesValidated: false/)
  assert.match(handoff, /automaticGeometryAllowed: false/)
  assert.match(handoff, /machineReady: false/)
})
