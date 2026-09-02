import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { activeGuidedProfileSystems, guidedProfilesForRole } from '../src/aiGuidedProduct'
import {
  confirmCatalogueProfileHumanRole,
  createCatalogueProfileFromNadezhdaEvidence,
  createPendingCatalogueProfileReviewFromNadezhdaEvidence,
  NADEZHDA_EVIDENCE_SYSTEM_LABEL,
  nadezhdaProfileEvidence,
} from '../src/nadezhdaCatalogueEvidence'
import { catalogueProfileIsSelectable } from '../src/profileCatalogueState'
import { sampleCatalogueProfiles } from '../src/profileCatalogueData'

const read = (path: string) => readFileSync(path, 'utf8')
const now = '2026-08-31T00:00:00.000Z'

test('06C.2.1 starts real profile role assignment as PENDING and not selectable', () => {
  const pending = createPendingCatalogueProfileReviewFromNadezhdaEvidence(nadezhdaProfileEvidence[0]!, 'FRAME', now)
  assert.equal(pending.status, 'SOURCE_EVIDENCE')
  assert.equal(pending.humanRoleReviewStatus, 'PENDING')
  assert.equal(catalogueProfileIsSelectable(pending), false)
  assert.deepEqual(guidedProfilesForRole([...sampleCatalogueProfiles, pending], NADEZHDA_EVIDENCE_SYSTEM_LABEL, 'FRAME'), [])
  assert.equal(activeGuidedProfileSystems([...sampleCatalogueProfiles, pending]).includes(NADEZHDA_EVIDENCE_SYSTEM_LABEL), false)
})

test('06C.2.1 named human confirmation promotes the role into guided catalogue eligibility', () => {
  const pending = createPendingCatalogueProfileReviewFromNadezhdaEvidence(nadezhdaProfileEvidence[1]!, 'SASH', now)
  const confirmed = confirmCatalogueProfileHumanRole(pending, 'Технолог Надежда', 'Ролята е сверена по реалния проект.', '2026-08-31T01:00:00.000Z')
  assert.equal(confirmed.humanRoleReviewStatus, 'HUMAN_CONFIRMED')
  assert.equal(confirmed.humanRoleConfirmedBy, 'Технолог Надежда')
  assert.equal(confirmed.humanRoleConfirmationNote, 'Ролята е сверена по реалния проект.')
  assert.equal(catalogueProfileIsSelectable(confirmed), true)
  assert.deepEqual(guidedProfilesForRole([...sampleCatalogueProfiles, confirmed], NADEZHDA_EVIDENCE_SYSTEM_LABEL, 'SASH').map((profile) => profile.code), ['78.27'])
})

test('06C.2.1 keeps 06C.2 explicit-role helper backward compatible and human-confirmed', () => {
  const profile = createCatalogueProfileFromNadezhdaEvidence(nadezhdaProfileEvidence[2]!, 'MULLION', now)
  assert.equal(profile.status, 'SOURCE_EVIDENCE')
  assert.equal(profile.humanRoleReviewStatus, 'HUMAN_CONFIRMED')
  assert.equal(catalogueProfileIsSelectable(profile), true)
})

test('06C.2.1 UI requires named human review before source evidence is added', () => {
  const catalogue = read('src/components/ProjectSourceEvidence.tsx')
  const editor = read('src/components/ProfileEditor.tsx')
  assert.match(catalogue, /createPendingCatalogueProfileReviewFromNadezhdaEvidence/)
  assert.match(catalogue, /HUMAN CONFIRMED/)
  assert.match(catalogue, /Потвърдено от:/)
  assert.match(editor, /HUMAN REVIEW REQUIRED/)
  assert.match(editor, /Потвърдено от човек \/ технолог \*/)
  assert.match(editor, /Потвърди и добави в каталога/)
  assert.match(editor, /readOnly=\{Boolean\(value\.sourceEvidenceId\)\}/)
  assert.match(editor, /RULES VALIDATED: NO · MACHINE READY: NO/)
})

test('06C.2.1 AI builder counts only HUMAN CONFIRMED Nadezhda role assignments', () => {
  const guided = read('src/components/GuidedAiProductBuilder.tsx')
  const logic = read('src/aiGuidedProduct.ts')
  assert.match(guided, /humanRoleReviewStatus === 'HUMAN_CONFIRMED'/)
  assert.match(guided, /с HUMAN CONFIRMED роля/)
  assert.match(logic, /catalogueProfileIsSelectable/)
})

test('06C.2.1 changing a reviewed role/system/name invalidates the previous role confirmation', () => {
  const editor = read('src/components/ProfileEditor.tsx')
  assert.match(editor, /reviewSensitiveFields/)
  assert.match(editor, /humanRoleReviewStatus: 'PENDING'/)
  assert.match(editor, /humanRoleConfirmedAt: undefined/)
  assert.match(editor, /humanRoleConfirmedBy: undefined/)
})

test('06C.2.1 preserves source/production safety boundaries and adds no persistence or machine output', () => {
  const files = [
    read('src/nadezhdaCatalogueEvidence.ts'),
    read('src/profileCatalogueState.ts'),
    read('src/components/ProjectSourceEvidence.tsx'),
    read('src/components/ProfileEditor.tsx'),
    read('src/aiGuidedProduct.ts'),
  ].join('\n')
  for (const forbidden of ['fetch(', 'XMLHttpRequest', 'localStorage', 'sessionStorage', 'WebSocket', 'machineReady: true', 'productionApproval: true', 'automaticGeometryAllowed: true']) assert.equal(files.includes(forbidden), false, forbidden)
  assert.match(files, /requiresHumanApproval: true/)
  assert.match(files, /SOURCE_EVIDENCE/)
})
