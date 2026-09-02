import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) => readFileSync(path, 'utf8')
const projects = read('src/components/ProjectsWorkspace.tsx')
const evidence = read('src/components/ProjectSourceEvidence.tsx')
const catalogue = read('src/components/ProfileCatalogue.tsx')
const app = read('src/App.tsx')

test('UI01.2A routes source-backed project context into Projects', () => {
  assert.match(projects, /Източници/)
  assert.match(projects, /ProjectSourceEvidence/)
  assert.match(evidence, /nadezhdaSourceEvidence/)
  assert.match(evidence, /nadezhdaProfileEvidence/)
  assert.match(evidence, /wp78CatalogueVisibility/)
})

test('UI01.2A keeps normalized records in Catalogue and links back to Projects', () => {
  assert.doesNotMatch(catalogue, /nadezhdaProfileEvidence|wp78CatalogueVisibility/)
  assert.match(catalogue, /Суровите проектни данни са в „Проекти“/)
  assert.match(catalogue, /Източник:/)
  assert.match(catalogue, /Отвори проект/)
})

test('UI01.2A preserves explicit human review from project evidence', () => {
  assert.match(evidence, /createPendingCatalogueProfileReviewFromNadezhdaEvidence/)
  assert.match(evidence, /validateCatalogueProfile/)
  assert.match(evidence, /ProfileEditor/)
  assert.match(evidence, /ЧОВЕШКИ ПРЕГЛЕД/)
  assert.match(evidence, /Данните от източника остават неизменни/)
})

test('UI01.2A wires Projects and Catalogue without persistence or production authority', () => {
  assert.match(app, /<ProjectsWorkspace profiles=\{catalogueProfiles\}/)
  assert.match(app, /onOpenCatalogue=/)
  assert.match(app, /onOpenProjects=/)
  const combined = `${projects}\n${evidence}\n${catalogue}\n${app}`
  for (const forbidden of ['fetch(', 'XMLHttpRequest', 'localStorage', 'sessionStorage', 'WebSocket', 'machineReady: true', 'productionApproval: true', 'productionApproved: true', 'automaticGeometryAllowed: true']) assert.equal(combined.includes(forbidden), false, forbidden)
})
