import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { activeGuidedProfileSystems, guidedProductUnresolved, guidedProductWarnings, guidedProfilesForRole } from '../src/aiGuidedProduct'
import { confirmFacadeFlowGuidedProduct, createFacadeFlowAiSession, prepareFacadeFlowGuidedProduct, selectFacadeFlowAiInputMode, selectFacadeFlowJobType, setFacadeFlowGuidedReviewAccepted, updateFacadeFlowGuidedProduct } from '../src/aiWorkspaceState'
import { sampleCatalogueProfiles } from '../src/profileCatalogueData'
import type { CatalogueProfile } from '../src/profileCatalogueTypes'

const create = () => selectFacadeFlowAiInputMode(selectFacadeFlowJobType(createFacadeFlowAiSession('phase06c1-test'), 'SINGLE_PRODUCT'), 'DESCRIPTION')

const fullWindowPatch = {
  productType: 'WINDOW' as const,
  name: 'W-01',
  quantity: '1',
  width: '1400',
  height: '1200',
  profileSystem: 'DEMO SYSTEM',
  frameProfileId: 'profile-demo-frame-01',
  sashProfileId: 'profile-demo-sash-01',
  openingType: 'TILT_TURN' as const,
  openingDirection: 'LEFT' as const,
  inwardOutward: 'INWARD' as const,
  fillType: 'GLAZING_UNIT' as const,
  fillDescription: 'Стъклопакет по проект — човешки въведено описание',
  colorMode: 'SAME_BOTH_SIDES' as const,
  exteriorColor: 'Цвят по проект',
  hardwareType: 'WINDOW' as const,
  hardwareDescription: 'Обков по проект — точният код се въвежда от човек',
  handleType: 'STANDARD' as const,
  handleDescription: 'Дръжка по проект',
}

test('06C.1 adds a guided structured draft without relaxing the locked AI/production boundaries', () => {
  const session = create()
  assert.equal(session.job.guidedProduct.productType, '')
  assert.equal(session.job.guidedProduct.quantity, '1')
  assert.equal(session.aiModelStatus, 'NOT_CONNECTED')
  assert.equal(session.automaticGeometryAllowed, false)
  assert.equal(session.rulesValidationRequired, true)
  assert.equal(session.productionApproved, false)
  assert.equal(session.job.machineReady, false)
})

test('06C.1 dropdown data comes from active catalogue systems and role-compatible profiles', () => {
  const archived: CatalogueProfile = { ...sampleCatalogueProfiles[0], id: 'archived-frame', system: 'ARCHIVED SYSTEM', status: 'ARCHIVED' }
  const profiles = [...sampleCatalogueProfiles, archived]
  assert.deepEqual(activeGuidedProfileSystems(profiles), ['DEMO SYSTEM'])
  assert.deepEqual(guidedProfilesForRole(profiles, 'DEMO SYSTEM', 'FRAME').map((profile) => profile.id), ['profile-demo-frame-01'])
  assert.deepEqual(guidedProfilesForRole(profiles, 'DEMO SYSTEM', 'SASH').map((profile) => profile.id), ['profile-demo-sash-01'])
})

test('06C.1 changing profile system clears incompatible catalogue selections instead of carrying stale profile IDs', () => {
  let session = create()
  session = updateFacadeFlowGuidedProduct(session, { profileSystem: 'DEMO SYSTEM', frameProfileId: 'profile-demo-frame-01', sashProfileId: 'profile-demo-sash-01' }, sampleCatalogueProfiles)
  session = updateFacadeFlowGuidedProduct(session, { profileSystem: '', manualProfileSystem: 'REAL SYSTEM FROM EXPERT' }, sampleCatalogueProfiles)
  assert.equal(session.job.guidedProduct.frameProfileId, '')
  assert.equal(session.job.guidedProduct.sashProfileId, '')
  assert.equal(session.job.guidedProduct.manualProfileSystem, 'REAL SYSTEM FROM EXPERT')
})

test('06C.1 allows human-entered profile codes as evidence but keeps catalogue/rules warnings explicit', () => {
  let session = create()
  session = updateFacadeFlowGuidedProduct(session, { ...fullWindowPatch, profileSystem: '', frameProfileId: '', sashProfileId: '', manualProfileSystem: '78', manualFrameProfile: '78.51', manualSashProfile: '78.27' }, sampleCatalogueProfiles)
  const unresolved = guidedProductUnresolved(session.job.guidedProduct, sampleCatalogueProfiles)
  const warnings = guidedProductWarnings(session.job.guidedProduct, sampleCatalogueProfiles)
  assert.doesNotMatch(unresolved.join('\n'), /Каса|Крило|Профилна система/)
  assert.match(warnings.join('\n'), /ръчно|съвместимостта/)
})

test('06C.1 prepares one structured simulation specification with manual evidence and never machine-ready output', () => {
  let session = create()
  session = updateFacadeFlowGuidedProduct(session, fullWindowPatch, sampleCatalogueProfiles)
  session = prepareFacadeFlowGuidedProduct(session, sampleCatalogueProfiles)
  assert.equal(session.job.products.length, 1)
  const product = session.job.products[0]
  assert.equal(product.status, 'NEEDS_REVIEW')
  assert.equal(product.machineReady, false)
  assert.equal(product.simulationOnly, true)
  assert.equal(product.system, 'DEMO SYSTEM')
  assert.equal(product.profiles.frame, 'DEMO-FRAME-01')
  assert.equal(product.profiles.sash, 'DEMO-SASH-01')
  assert.equal(product.dimensions.width, 1400)
  assert.equal(product.dimensions.height, 1200)
  assert.equal(product.evidence[0]?.sourceKind, 'MANUAL')
  assert.match(product.evidence[0]?.note ?? '', /Няма AI inference/)
  assert.equal(session.productionApproved, false)
})

test('06C.1 human confirmation requires a complete structured draft plus explicit review and still does not approve production', () => {
  let session = create()
  session = updateFacadeFlowGuidedProduct(session, fullWindowPatch, sampleCatalogueProfiles)
  assert.deepEqual(guidedProductUnresolved(session.job.guidedProduct, sampleCatalogueProfiles), [])
  session = prepareFacadeFlowGuidedProduct(session, sampleCatalogueProfiles)
  const blocked = confirmFacadeFlowGuidedProduct(session, sampleCatalogueProfiles)
  assert.equal(blocked.job.guidedProduct.status, 'NEEDS_REVIEW')
  session = setFacadeFlowGuidedReviewAccepted(session, true)
  session = confirmFacadeFlowGuidedProduct(session, sampleCatalogueProfiles)
  assert.equal(session.job.guidedProduct.status, 'HUMAN_CONFIRMED')
  assert.equal(session.job.products[0]?.status, 'HUMAN_CONFIRMED')
  assert.equal(session.job.products[0]?.machineReady, false)
  assert.equal(session.productionApproved, false)
})

test('06C.1 editing after confirmation invalidates the prepared proposal and returns to review', () => {
  let session = create()
  session = updateFacadeFlowGuidedProduct(session, fullWindowPatch, sampleCatalogueProfiles)
  session = prepareFacadeFlowGuidedProduct(session, sampleCatalogueProfiles)
  session = setFacadeFlowGuidedReviewAccepted(session, true)
  session = confirmFacadeFlowGuidedProduct(session, sampleCatalogueProfiles)
  session = updateFacadeFlowGuidedProduct(session, { width: '1500' }, sampleCatalogueProfiles)
  assert.equal(session.job.guidedProduct.status, 'NEEDS_REVIEW')
  assert.equal(session.job.guidedProduct.reviewAccepted, false)
  assert.equal(session.job.products.length, 0)
  assert.equal(session.job.intakeStatus, 'SOURCE_CAPTURED')
})

test('06C.1 UI exposes guided dropdowns/manual evidence and does not introduce network or persistence behavior', () => {
  const source = readFileSync('src/components/GuidedAiProductBuilder.tsx', 'utf8')
  assert.match(source, /Води ме стъпка по стъпка/)
  for (const label of ['Тип изделие', 'Профилна система', 'Каса', 'Крило', 'Делител', 'Тип отваряемост', 'Пълнеж \/ стъкло', 'Режим на цвета', 'Тип обков', 'Тип дръжка']) assert.match(source, new RegExp(label))
  assert.match(source, /Ръчна система \/ код/)
  assert.match(source, /Ръчен код за/)
  assert.match(source, /Подготви за човешка проверка/)
  assert.match(source, /Потвърди човешката чернова/)
  assert.doesNotMatch(source, /fetch\(|WebSocket|localStorage|indexedDB|XMLHttpRequest/i)
})
