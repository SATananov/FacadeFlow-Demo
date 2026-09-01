import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const workspace = readFileSync('src/components/FacadeFlowAIWorkspace.tsx', 'utf8')
const panel = readFileSync('src/components/ProjectDocumentIntelligencePanel.tsx', 'utf8')
const intelligence = readFileSync('src/aiDocumentIntelligence.ts', 'utf8')

test('AI02.4 replaces the future-document placeholder with the project document intelligence panel', () => {
  assert.match(workspace, /ProjectDocumentIntelligencePanel/)
  assert.match(workspace, /ПРОЕКТ \/ ДОКУМЕНТИ · AI02/)
  assert.match(panel, /Пусни проектни документи тук/)
  assert.match(panel, /Прехвърли безопасните стойности/)
})

test('AI02.4 keeps provenance, conflicts and human review visible', () => {
  assert.match(panel, /SHA-256/)
  assert.match(panel, /FacadeFlow не избира победител/)
  assert.match(panel, /HUMAN REVIEW REQUIRED/)
  assert.match(panel, /AUTOMATIC GEOMETRY: NO/)
  assert.match(panel, /MACHINE READY: NO/)
})

test('AI02.4 document intelligence has no network, machine output or dynamic-code path', () => {
  for (const forbidden of ['fetch(', 'XMLHttpRequest', 'WebSocket', 'eval(', 'new Function', 'child_process', 'machineReady: true', 'productionApproved: true']) {
    assert.equal(intelligence.includes(forbidden), false, `forbidden token: ${forbidden}`)
    assert.equal(panel.includes(forbidden), false, `forbidden panel token: ${forbidden}`)
  }
})

test('AI02.4 PDF path uses local pdf text extraction and DWG remains metadata-only', () => {
  assert.match(intelligence, /getTextContent\(\)/)
  assert.match(intelligence, /DWG .*provenance/)
  assert.match(intelligence, /read-only DWG viewer/)
  assert.doesNotMatch(intelligence, /automaticGeometryAllowed:\s*true/)
})
