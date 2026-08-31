import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { activeGuidedProfileSystems, createEmptyGuidedProductDraft, guidedProfilesForRole } from '../src/aiGuidedProduct'
import { confirmCatalogueProfileHumanRole, createPendingCatalogueProfileReviewFromNadezhdaEvidence, guidedNadezhdaEvidencePreview, NADEZHDA_EVIDENCE_SYSTEM_LABEL, nadezhdaProfileEvidence } from '../src/nadezhdaCatalogueEvidence'
import { sampleCatalogueProfiles } from '../src/profileCatalogueData'

const read = (path: string) => readFileSync(path, 'utf8')
const now = '2026-08-31T00:00:00.000Z'

test('06C.2.2 AI preview exposes all four real Nadezhda codes as locked before human role confirmation', () => {
  const rows = guidedNadezhdaEvidencePreview(sampleCatalogueProfiles)
  assert.deepEqual(rows.map((row) => row.code), ['78.01', '78.27', '78.33', '78.51'])
  assert.ok(rows.every((row) => row.state === 'LOCKED'))
  assert.ok(rows.every((row) => row.role === undefined && row.profileId === undefined))
})

test('06C.2.2 pending review stays locked and cannot enter Guided AI dropdowns', () => {
  const pending = createPendingCatalogueProfileReviewFromNadezhdaEvidence(nadezhdaProfileEvidence[0]!, 'FRAME', now)
  const profiles = [...sampleCatalogueProfiles, pending]
  const row = guidedNadezhdaEvidencePreview(profiles).find((item) => item.code === '78.01')!
  assert.equal(row.state, 'LOCKED')
  assert.equal(activeGuidedProfileSystems(profiles).includes(NADEZHDA_EVIDENCE_SYSTEM_LABEL), false)
  assert.deepEqual(guidedProfilesForRole(profiles, NADEZHDA_EVIDENCE_SYSTEM_LABEL, 'FRAME'), [])
})

test('06C.2.2 HUMAN CONFIRMED role becomes available in preview and corresponding dropdown only', () => {
  const pending = createPendingCatalogueProfileReviewFromNadezhdaEvidence(nadezhdaProfileEvidence[1]!, 'SASH', now)
  const confirmed = confirmCatalogueProfileHumanRole(pending, 'Технолог Надежда', 'Потвърдена роля.', '2026-08-31T01:00:00.000Z')
  const profiles = [...sampleCatalogueProfiles, confirmed]
  const row = guidedNadezhdaEvidencePreview(profiles).find((item) => item.code === '78.27')!
  assert.equal(row.state, 'AVAILABLE')
  assert.equal(row.role, 'SASH')
  assert.equal(row.humanConfirmedBy, 'Технолог Надежда')
  assert.deepEqual(guidedProfilesForRole(profiles, NADEZHDA_EVIDENCE_SYSTEM_LABEL, 'SASH').map((profile) => profile.code), ['78.27'])
  assert.deepEqual(guidedProfilesForRole(profiles, NADEZHDA_EVIDENCE_SYSTEM_LABEL, 'FRAME'), [])
})

test('06C.2.2 evidence preview never auto-selects or mutates a guided product draft', () => {
  const draft = createEmptyGuidedProductDraft()
  const before = structuredClone(draft)
  guidedNadezhdaEvidencePreview(sampleCatalogueProfiles)
  assert.deepEqual(draft, before)
  assert.equal(draft.profileSystem, '')
  assert.equal(draft.frameProfileId, '')
  assert.equal(draft.sashProfileId, '')
  assert.equal(draft.mullionProfileId, '')
})

test('06C.2.2 Guided AI UI visibly distinguishes locked evidence from HUMAN CONFIRMED availability', () => {
  const component = read('src/components/GuidedNadezhdaEvidencePreview.tsx')
  const builder = read('src/components/GuidedAiProductBuilder.tsx')
  const css = read('src/aiWorkspace.css')
  assert.match(component, /РЕАЛЕН КАТАЛОГ · SOURCE EVIDENCE/)
  assert.match(component, /ЗАКЛЮЧЕН · РОЛЯ НЕПОТВЪРДЕНА/)
  assert.match(component, /ДОСТЪПЕН ·/)
  assert.match(component, /Не се предлага за избор в Каса \/ Крило \/ Делител/)
  assert.match(component, /Прегледай ролите в каталога/)
  assert.match(builder, /GuidedNadezhdaEvidencePreview/)
  assert.match(css, /ff-guided-real-catalogue-preview/)
})

test('06C.2.2 preserves source and production safety boundaries', () => {
  const files = [read('src/nadezhdaCatalogueEvidence.ts'), read('src/components/GuidedNadezhdaEvidencePreview.tsx'), read('src/components/GuidedAiProductBuilder.tsx')].join('\n')
  for (const forbidden of ['fetch(', 'XMLHttpRequest', 'localStorage', 'sessionStorage', 'WebSocket', 'machineReady: true', 'productionApproval: true', 'automaticGeometryAllowed: true']) assert.equal(files.includes(forbidden), false, forbidden)
  assert.match(files, /catalogueProfileIsSelectable/)
  assert.match(files, /LOCKED/)
})
