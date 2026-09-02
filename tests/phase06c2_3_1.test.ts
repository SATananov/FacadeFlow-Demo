import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) => readFileSync(path, 'utf8')

const catalogue = read('src/components/ProfileCatalogue.tsx')
const css = read('src/customDesigner.css') + read('src/projectsWorkspace.css')
const state = read('src/profileCatalogueState.ts')

void test('06C.2.3.1 keeps the manual editor closed until an explicit catalogue action opens it', () => {
  assert.match(catalogue, /useState<CatalogueProfile \| null>\(null\)/)
  assert.match(catalogue, /\+ Добави ръчен профил/)
  assert.match(catalogue, /editing &&/)
  assert.match(catalogue, /catalogue-only/)
  assert.match(catalogue, /catalogue-manual-editor-shell/)
})

void test('06C.2.3.1 separates real active selection from demo preset state', () => {
  assert.match(catalogue, /kind === 'real'/)
  assert.match(catalogue, /Основен реален профил/)
  assert.match(catalogue, /kind === 'demo'/)
  assert.match(catalogue, /ДЕМО ПО ПОДРАЗБИРАНЕ/)
  assert.match(catalogue, /не участва в нормалния продуктов избор/)
})

void test('06C.2.3.1 leaves demo profiles selectable for explicit demo workflows but not presented as normal active catalogue choices', () => {
  assert.match(state, /catalogueProfileIsDemonstration/)
  assert.match(state, /profile\.status === 'DEMONSTRATION'/)
  assert.doesNotMatch(catalogue, /kind === 'demo'[\s\S]{0,500}type="radio"/)
})

void test('06C.2.3.1 preserves the human-reviewed source-evidence flow in Projects', () => {
  const evidence = read('src/components/ProjectSourceEvidence.tsx')
  assert.match(evidence, /project-source-review-panel/)
  assert.match(evidence, /ЧОВЕШКИ ПРЕГЛЕД/)
  assert.match(evidence, /createPendingCatalogueProfileReviewFromNadezhdaEvidence/)
  assert.match(catalogue, /catalogueProfileIsSelectable/)
})

void test('06C.2.3.1 responsive layout expands the catalogue when no editor is open', () => {
  assert.match(css, /catalogue-content\.catalogue-only\{grid-template-columns:minmax\(0,1fr\)\}/)
  assert.match(css, /catalogue-content\.has-editor/)
  assert.match(css, /catalogue-demo-state/)
})

void test('06C.2.3.1 introduces no network, persistence, machine writer or automatic geometry behavior', () => {
  const combined = `${catalogue}\n${css}`
  assert.doesNotMatch(combined, /fetch\s*\(/)
  assert.doesNotMatch(combined, /WebSocket\s*\(/)
  assert.doesNotMatch(combined, /localStorage|sessionStorage/)
  assert.doesNotMatch(combined, /machineReady\s*:\s*true|automaticGeometryAllowed\s*:\s*true/)
})
