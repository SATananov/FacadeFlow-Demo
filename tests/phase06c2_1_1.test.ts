import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) => readFileSync(path, 'utf8')

test('06C.2.1.1 evidence role click exposes a visible inline human review panel in Projects', () => {
  const evidence = read('src/components/ProjectSourceEvidence.tsx')
  assert.match(evidence, /project-source-review-panel/)
  assert.match(evidence, /ЧОВЕШКИ ПРЕГЛЕД/)
  assert.match(evidence, /Данните от източника остават неизменни/)
})

test('06C.2.1.1 selected evidence card and role button show immediate review feedback', () => {
  const evidence = read('src/components/ProjectSourceEvidence.tsx')
  assert.match(evidence, /editing\?\.sourceEvidenceId === item\.id/)
  assert.match(evidence, /ПРЕГЛЕД ·/)
  assert.match(evidence, /aria-pressed=/)
  assert.match(evidence, /reviewing/)
})

test('06C.2.1.1 keeps project evidence review separate from normalized Catalogue', () => {
  const evidence = read('src/components/ProjectSourceEvidence.tsx')
  const catalogue = read('src/components/ProfileCatalogue.tsx')
  assert.match(evidence, /createPendingCatalogueProfileReviewFromNadezhdaEvidence/)
  assert.match(catalogue, /Суровите проектни данни са в „Проекти“/)
  assert.doesNotMatch(catalogue, /nadezhdaProfileEvidence|wp78CatalogueVisibility/)
})

test('06C.2.1.1 preserves explicit confirmation and production safety boundaries', () => {
  const files = [read('src/components/ProjectSourceEvidence.tsx'), read('src/components/ProfileEditor.tsx'), read('src/nadezhdaCatalogueEvidence.ts')].join('\n')
  assert.match(files, /Потвърди и добави в каталога/)
  for (const forbidden of ['fetch(', 'XMLHttpRequest', 'localStorage', 'sessionStorage', 'WebSocket', 'machineReady: true', 'productionApproval: true', 'automaticGeometryAllowed: true']) assert.equal(files.includes(forbidden), false, forbidden)
})
