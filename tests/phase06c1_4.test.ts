import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { createGuidedDemoProductDraft, guidedProductCompletion, guidedProductUnresolved } from '../src/aiGuidedProduct'
import { applyFacadeFlowGuidedDemo, confirmFacadeFlowGuidedProduct, createFacadeFlowAiSession, prepareFacadeFlowGuidedProduct, setFacadeFlowGuidedReviewAccepted } from '../src/aiWorkspaceState'
import { sampleCatalogueProfiles } from '../src/profileCatalogueData'

const read = (path: string) => readFileSync(path, 'utf8')

test('06C.1.4 DEMO defaults to a complete catalogue-backed window preset', () => {
  const draft = createGuidedDemoProductDraft('WINDOW', sampleCatalogueProfiles)
  assert.equal(draft.productType, 'WINDOW')
  assert.equal(draft.width, '1400')
  assert.equal(draft.height, '1200')
  assert.equal(draft.profileSystem, 'DEMO SYSTEM')
  assert.equal(draft.frameProfileId, 'profile-demo-frame-01')
  assert.equal(draft.sashProfileId, 'profile-demo-sash-01')
  assert.equal(draft.mullionProfileId, 'profile-demo-mullion-01')
  assert.deepEqual(guidedProductUnresolved(draft, sampleCatalogueProfiles), [])
  assert.equal(guidedProductCompletion(draft, sampleCatalogueProfiles), 100)
  assert.equal(draft.reviewAccepted, false)
  assert.equal(draft.status, 'NEEDS_REVIEW')
})

test('06C.1.4 DEMO respects a selected door and includes door-only evidence', () => {
  const draft = createGuidedDemoProductDraft('DOOR', sampleCatalogueProfiles)
  assert.equal(draft.productType, 'DOOR')
  assert.equal(draft.width, '900')
  assert.equal(draft.height, '2100')
  assert.equal(draft.hardwareType, 'DOOR')
  assert.match(draft.thresholdDescription, /DEMO-THRESHOLD-01/)
  assert.deepEqual(guidedProductUnresolved(draft, sampleCatalogueProfiles), [])
})

test('06C.1.4 DEMO falls back to explicit manual DEMO profile evidence when sample catalogue data is unavailable', () => {
  const draft = createGuidedDemoProductDraft('WINDOW', [])
  assert.equal(draft.profileSystem, '')
  assert.equal(draft.manualProfileSystem, 'DEMO SYSTEM')
  assert.equal(draft.manualFrameProfile, 'DEMO-FRAME-01')
  assert.equal(draft.manualSashProfile, 'DEMO-SASH-01')
  assert.equal(draft.manualMullionProfile, 'DEMO-MULLION-01')
  assert.deepEqual(guidedProductUnresolved(draft, []), [])
})

test('06C.1.4 applying DEMO invalidates a previously confirmed proposal instead of bypassing Human Gate', () => {
  let session = createFacadeFlowAiSession('demo-test')
  session = applyFacadeFlowGuidedDemo(session, sampleCatalogueProfiles)
  session = prepareFacadeFlowGuidedProduct(session, sampleCatalogueProfiles)
  session = setFacadeFlowGuidedReviewAccepted(session, true)
  session = confirmFacadeFlowGuidedProduct(session, sampleCatalogueProfiles)
  assert.equal(session.job.guidedProduct.status, 'HUMAN_CONFIRMED')
  assert.equal(session.job.products.length, 1)
  session = applyFacadeFlowGuidedDemo(session, sampleCatalogueProfiles)
  assert.equal(session.job.guidedProduct.status, 'NEEDS_REVIEW')
  assert.equal(session.job.guidedProduct.reviewAccepted, false)
  assert.equal(session.job.products.length, 0)
  assert.equal(session.job.intakeStatus, 'SOURCE_CAPTURED')
  assert.equal(session.productionApproved, false)
  assert.equal(session.automaticGeometryAllowed, false)
  assert.equal(session.job.machineReady, false)
})

test('06C.1.4 UI exposes one-click DEMO fill and a visible sample-data warning', () => {
  const ui = read('src/components/GuidedAiProductBuilder.tsx')
  const css = read('src/aiWorkspace.css')
  assert.match(ui, /applyFacadeFlowGuidedDemo/)
  assert.match(ui, /ДЕМО · \{draft\.productType === 'DOOR' \? 'ВРАТА' : 'ПРОЗОРЕЦ'\}/)
  assert.match(ui, /ДЕМО ДАННИ/)
  assert.match(ui, /Human Gate остава задължителен/)
  assert.match(css, /ff-guided-demo-button/)
  assert.match(css, /ff-guided-demo-banner/)
})

test('06C.1.4 adds no network, persistence, machine writer or automatic geometry behavior', () => {
  const files = [read('src/aiGuidedProduct.ts'), read('src/aiWorkspaceState.ts'), read('src/components/GuidedAiProductBuilder.tsx')].join('\n')
  for (const forbidden of ['fetch(', 'XMLHttpRequest', 'localStorage', 'sessionStorage', 'WebSocket', 'machineReady: true', 'productionApproved: true', 'automaticGeometryAllowed: true']) assert.equal(files.includes(forbidden), false, forbidden)
})
