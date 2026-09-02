import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { guidedProductWarnings, guidedProfilesForRole } from '../src/aiGuidedProduct'
import { createCatalogueProfileFromNadezhdaEvidence, NADEZHDA_EVIDENCE_SYSTEM_LABEL, nadezhdaProfileEvidence, nadezhdaSourceEvidence } from '../src/nadezhdaCatalogueEvidence'
import { sampleCatalogueProfiles } from '../src/profileCatalogueData'
import { createEmptyGuidedProductDraft } from '../src/aiGuidedProduct'

const read = (path: string) => readFileSync(path, 'utf8')

test('06C.2 locks the real Nadezhda Vадим-2 XML/LTE evidence facts and hashes', () => {
  assert.equal(nadezhdaSourceEvidence.xmlPieceCount, 46)
  assert.equal(nadezhdaSourceEvidence.lteRecordCount, 84)
  assert.equal(nadezhdaSourceEvidence.matchedXmlBarcodesInLte, 46)
  assert.equal(nadezhdaSourceEvidence.machiningCount, 220)
  assert.equal(nadezhdaSourceEvidence.xmlSha256, '1FAFBDE7A13A28936EDC9FE9382DB5F50DA6B22D8168CF5959D95AE053E8DF08')
  assert.equal(nadezhdaSourceEvidence.lteSha256, '6D753E558A1EA330573F2555F34603CD406EC9C6842A4CAB4EE210D1450A272A')
})

test('06C.2 exposes exactly the four observed profile codes without inferring a role', () => {
  assert.deepEqual(nadezhdaProfileEvidence.map((item) => item.code), ['78.01', '78.27', '78.33', '78.51'])
  assert.ok(nadezhdaProfileEvidence.every((item) => item.role === 'UNCONFIRMED'))
  assert.ok(nadezhdaProfileEvidence.every((item) => item.xmlLteBarcodeMatch && item.sourceBacked))
  assert.deepEqual(nadezhdaProfileEvidence.map(({ code, maxY, maxZ }) => ({ code, maxY, maxZ })), [
    { code: '78.01', maxY: 70, maxZ: 57 },
    { code: '78.27', maxY: 78, maxZ: 96 },
    { code: '78.33', maxY: 79, maxZ: 70 },
    { code: '78.51', maxY: 74, maxZ: 61 },
  ])
})

test('06C.2 promoting evidence requires an explicit human role and remains SOURCE_EVIDENCE', () => {
  const evidence = nadezhdaProfileEvidence[0]!
  const profile = createCatalogueProfileFromNadezhdaEvidence(evidence, 'FRAME', '2026-08-31T00:00:00.000Z')
  assert.equal(profile.role, 'FRAME')
  assert.equal(profile.code, '78.01')
  assert.equal(profile.system, NADEZHDA_EVIDENCE_SYSTEM_LABEL)
  assert.equal(profile.status, 'SOURCE_EVIDENCE')
  assert.equal(profile.sourceEvidenceId, evidence.id)
  assert.equal(profile.dimensionA, 70)
  assert.equal(profile.dimensionB, 57)
  assert.equal(profile.simulationOnly, true)
  assert.equal(profile.requiresHumanApproval, true)
})

test('06C.2 source-evidence profiles can feed a role dropdown only after human role assignment and are never auto-selected', () => {
  const promoted = createCatalogueProfileFromNadezhdaEvidence(nadezhdaProfileEvidence[3]!, 'SASH', '2026-08-31T00:00:00.000Z')
  const profiles = [...sampleCatalogueProfiles, promoted]
  assert.deepEqual(guidedProfilesForRole(profiles, NADEZHDA_EVIDENCE_SYSTEM_LABEL, 'FRAME'), [])
  assert.deepEqual(guidedProfilesForRole(profiles, NADEZHDA_EVIDENCE_SYSTEM_LABEL, 'SASH').map((item) => item.code), ['78.51'])
  const draft = createEmptyGuidedProductDraft()
  assert.equal(draft.sashProfileId, '')
})

test('06C.2 AI Builder visibly warns when a SOURCE_EVIDENCE profile is selected', () => {
  const promoted = createCatalogueProfileFromNadezhdaEvidence(nadezhdaProfileEvidence[1]!, 'FRAME', '2026-08-31T00:00:00.000Z')
  const profiles = [...sampleCatalogueProfiles, promoted]
  const draft = { ...createEmptyGuidedProductDraft(), productType: 'WINDOW' as const, profileSystem: NADEZHDA_EVIDENCE_SYSTEM_LABEL, frameProfileId: promoted.id }
  assert.ok(guidedProductWarnings(draft, profiles).some((warning) => warning.includes('реален source-evidence профил')))
})

test('06C.2 catalogue UI shows real evidence separately and requires an explicit role review before catalogue save', () => {
  const ui = read('src/components/ProjectSourceEvidence.tsx')
  const editor = read('src/components/ProfileEditor.tsx')
  const css = read('src/projectsWorkspace.css')
  const guided = read('src/components/GuidedAiProductBuilder.tsx')
  const aiCss = read('src/aiWorkspace.css')
  assert.match(ui, /ИЗТОЧНИКОВ ПРОЕКТ · XML \+ LTE · САМО ЗА ЧЕТЕНЕ/)
  assert.match(ui, /РОЛЯ: .*НЕПОТВЪРДЕНА/)
  assert.match(ui, /beginReview\(item\.id, role\)/)
  assert.match(ui, /Прегледай като:/)
  assert.match(editor, /РЕАЛНИ ДАННИ ОТ ИЗТОЧНИКА/)
  assert.match(editor, /Провери ролята, системата и името преди запис/)
  assert.match(css, /project-source-profile-grid/)
  assert.match(guided, /НАДЕЖДА · SOURCE EVIDENCE/)
  assert.match(guided, /Няма автоматично разпознаване на каса \/ крило \/ делител/)
  assert.match(aiCss, /ff-guided-source-evidence/)
})

test('06C.2 adds only local read-only evidence/audit logic and keeps production safety locked', () => {
  const files = [read('src/nadezhdaCatalogueEvidence.ts'), read('src/components/ProjectSourceEvidence.tsx'), read('src/aiGuidedProduct.ts'), read('scripts/audit-nadezhda-evidence.mjs')].join('\n')
  for (const forbidden of ['fetch(', 'XMLHttpRequest', 'localStorage', 'sessionStorage', 'WebSocket', 'machineReady: true', 'productionApproval: true', 'automaticGeometryAllowed: true']) assert.equal(files.includes(forbidden), false, forbidden)
  assert.match(files, /roleInferenceAllowed: false/)
  assert.match(files, /machineReady: false/)
})
