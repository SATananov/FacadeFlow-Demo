import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) => readFileSync(path, 'utf8')

test('06C.2.1.1 evidence role click exposes a visible inline human review panel', () => {
  const catalogue = read('src/components/ProfileCatalogue.tsx')
  assert.match(catalogue, /catalogue-human-review-panel/)
  assert.match(catalogue, /catalogue-evidence-review-panel/)
  assert.match(catalogue, /HUMAN REVIEW/)
  assert.match(catalogue, /Нищо не е добавено в каталога/)
})

test('06C.2.1.1 selected evidence card and role button show immediate review feedback', () => {
  const catalogue = read('src/components/ProfileCatalogue.tsx')
  assert.match(catalogue, /editing\?\.sourceEvidenceId === item\.id/)
  assert.match(catalogue, /ПРЕГЛЕД ·/)
  assert.match(catalogue, /aria-pressed=/)
  assert.match(catalogue, /reviewing/)
})

test('06C.2.1.1 moves source-evidence editor above catalogue list and scrolls it into view', () => {
  const catalogue = read('src/components/ProfileCatalogue.tsx')
  const reviewIndex = catalogue.indexOf('catalogue-human-review-panel')
  const toolbarIndex = catalogue.indexOf('catalogue-toolbar')
  assert.ok(reviewIndex > 0 && toolbarIndex > reviewIndex)
  assert.match(catalogue, /scrollIntoView\(\{ behavior: 'smooth', block: 'start' \}\)/)
  assert.match(catalogue, /editing && !editing\.sourceEvidenceId/)
})

test('06C.2.1.1 preserves explicit confirmation and production safety boundaries', () => {
  const files = [read('src/components/ProfileCatalogue.tsx'), read('src/components/ProfileEditor.tsx'), read('src/nadezhdaCatalogueEvidence.ts')].join('\n')
  assert.match(files, /Потвърди и добави в каталога/)
  for (const forbidden of ['fetch(', 'XMLHttpRequest', 'localStorage', 'sessionStorage', 'WebSocket', 'machineReady: true', 'productionApproval: true', 'automaticGeometryAllowed: true']) assert.equal(files.includes(forbidden), false, forbidden)
})
