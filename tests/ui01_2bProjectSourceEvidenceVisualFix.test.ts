import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) => readFileSync(path, 'utf8')
const evidence = read('src/components/ProjectSourceEvidence.tsx')
const projects = read('src/components/ProjectsWorkspace.tsx')
const css = read('src/projectsWorkspace.css')

test('UI01.2B renders clean Bulgarian project evidence labels', () => {
  for (const text of ['Надежда', 'Заключен реален проектен източник', 'РОЛЯ: НЕПОТВЪРДЕНА', 'Прегледай като:', 'Потвърдено от:', 'Размери: НЕИЗВЕСТНИ']) assert.match(evidence, new RegExp(text))
  for (const mojibake of ['Рџ', 'РµР', 'Р°Р', 'РЅР']) assert.equal(evidence.includes(mojibake), false, `mojibake: ${mojibake}`)
})

test('UI01.2B presents Vadim metrics and profile evidence as FacadeFlow cards', () => {
  assert.match(evidence, /project-source-metrics/)
  assert.match(evidence, /project-source-profile-grid/)
  assert.match(evidence, /project-source-review-actions/)
  assert.match(css, /\.project-source-metrics/)
  assert.match(css, /\.project-source-profile-grid/)
  assert.match(css, /\.project-source-review-panel/)
})

test('UI01.2B presents WP78 as a separate read-only source project', () => {
  assert.match(evidence, /РЕАЛНИ ДАННИ · ПАРТИДА 01 · САМО ЗА ЧЕТЕНЕ/)
  assert.match(evidence, /НЕ МОЖЕ ДА СЕ ИЗБИРА/)
  assert.match(evidence, /РАЗМЕРИ НА ПРОФИЛИТЕ: НЕИЗВЕСТНИ/)
  assert.match(css, /\.project-source-card-wp78/)
})

test('UI01.2B keeps lifecycle and source evidence visually distinct', () => {
  assert.match(projects, /projects-source-region/)
  assert.match(projects, /Все още няма проекти с жизнен цикъл/)
  assert.match(projects, /Подобен ≠ валиден/)
  assert.match(css, /\.projects-empty-state\.compact/)
})

test('UI01.2B does not weaken the safety boundary', () => {
  const combined = `${evidence}\n${projects}\n${css}`
  assert.match(combined, /ПРАВИЛА: НЕВАЛИДИРАНИ/)
  assert.match(combined, /ГОТОВ ЗА МАШИНА: НЕ/)
  assert.match(combined, /ПРОИЗВОДСТВЕНО ОДОБРЕН: НЕ/)
  for (const forbidden of ['fetch(', 'XMLHttpRequest', 'localStorage', 'sessionStorage', 'WebSocket', 'machineReady: true', 'productionApproved: true']) assert.equal(combined.includes(forbidden), false, forbidden)
})
