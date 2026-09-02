import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { activeRealGuidedProfileSystems, createGuidedDemoProductDraft, guidedRealProfilesForRole } from '../src/aiGuidedProduct'
import { confirmCatalogueProfileHumanRole, createPendingCatalogueProfileReviewFromNadezhdaEvidence, NADEZHDA_EVIDENCE_SYSTEM_LABEL, nadezhdaProfileEvidence } from '../src/nadezhdaCatalogueEvidence'
import { catalogueProfileIsDemonstration, catalogueProfileIsReal } from '../src/profileCatalogueState'
import { sampleCatalogueProfiles } from '../src/profileCatalogueData'

const read = (path: string) => readFileSync(path, 'utf8')
const now = '2026-08-31T00:00:00.000Z'

test('06C.2.3 classifies DEMONSTRATION separately from selectable real catalogue profiles', () => {
  assert.ok(sampleCatalogueProfiles.every(catalogueProfileIsDemonstration))
  assert.ok(sampleCatalogueProfiles.every((profile) => !catalogueProfileIsReal(profile)))
})

test('06C.2.3 normal Guided AI real systems exclude DEMO SYSTEM', () => {
  assert.deepEqual(activeRealGuidedProfileSystems(sampleCatalogueProfiles), [])
  assert.deepEqual(guidedRealProfilesForRole(sampleCatalogueProfiles, 'DEMO SYSTEM', 'FRAME'), [])
})

test('06C.2.3 HUMAN CONFIRMED Nadezhda profile becomes a real normal dropdown option without auto-selection', () => {
  const pending = createPendingCatalogueProfileReviewFromNadezhdaEvidence(nadezhdaProfileEvidence[0]!, 'FRAME', now)
  const confirmed = confirmCatalogueProfileHumanRole(pending, 'Технолог Надежда', 'Потвърдено.', '2026-08-31T01:00:00.000Z')
  const profiles = [...sampleCatalogueProfiles, confirmed]
  assert.deepEqual(activeRealGuidedProfileSystems(profiles), [NADEZHDA_EVIDENCE_SYSTEM_LABEL])
  assert.deepEqual(guidedRealProfilesForRole(profiles, NADEZHDA_EVIDENCE_SYSTEM_LABEL, 'FRAME').map((profile) => profile.code), ['78.01'])
})

test('06C.2.3 DEMO preset still deliberately uses demonstration profiles', () => {
  const draft = createGuidedDemoProductDraft('WINDOW', sampleCatalogueProfiles)
  assert.equal(draft.profileSystem, 'DEMO SYSTEM')
  assert.equal(draft.frameProfileId, 'profile-demo-frame-01')
  assert.equal(draft.sashProfileId, 'profile-demo-sash-01')
  assert.equal(draft.mullionProfileId, 'profile-demo-mullion-01')
})

test('06C.2.3 UI explicitly separates real Nadezhda and DEMO catalogue zones', () => {
  const preview = read('src/components/GuidedNadezhdaEvidencePreview.tsx')
  const builder = read('src/components/GuidedAiProductBuilder.tsx')
  const catalogue = read('src/components/ProfileCatalogue.tsx')
  const css = read('src/aiWorkspace.css') + read('src/customDesigner.css')
  assert.match(preview, /РЕАЛЕН КАТАЛОГ · НАДЕЖДА/)
  assert.match(preview, /ДЕМО КАТАЛОГ · САМО ЗА ТЕСТ/)
  assert.match(preview, /Не участва в нормалните списъци за избор/)
  assert.match(builder, /activeRealGuidedProfileSystems/)
  assert.match(builder, /usesDemoCatalogue/)
  assert.match(catalogue, /РЕАЛЕН КАТАЛОГ · НОРМАЛИЗИРАНИ/)
  assert.match(catalogue, /ДЕМО КАТАЛОГ · САМО ЗА ТЕСТ/)
  assert.match(catalogue, /Суровите проектни данни са в „Проекти“/)
  assert.match(css, /ff-guided-demo-catalogue/)
  assert.match(css, /catalogue-kind-summary/)
})

test('06C.2.3 preserves safety and does not introduce automatic selection or production behavior', () => {
  const files = [read('src/aiGuidedProduct.ts'), read('src/components/GuidedNadezhdaEvidencePreview.tsx'), read('src/components/GuidedAiProductBuilder.tsx'), read('src/components/ProfileCatalogue.tsx')].join('\n')
  for (const forbidden of ['fetch(', 'XMLHttpRequest', 'localStorage', 'sessionStorage', 'WebSocket', 'machineReady: true', 'productionApproval: true', 'automaticGeometryAllowed: true']) assert.equal(files.includes(forbidden), false, forbidden)
  assert.equal(files.includes('setActiveProfileAutomatically'), false)
})
