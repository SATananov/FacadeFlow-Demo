import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { projectBlockerLabel } from '../src/projectWorkspaceModel'

const read = (path: string) => readFileSync(path, 'utf8')
const projects = read('src/components/ProjectsWorkspace.tsx')
const detail = read('src/components/ProjectDetailPanel.tsx')
const evidence = read('src/components/ProjectSourceEvidence.tsx')
const editor = read('src/components/ProfileEditor.tsx')
const catalogue = read('src/components/ProfileCatalogue.tsx')
const visibleLayer = [projects, detail, evidence, editor, catalogue].join('\n')

test('PROJECT01.3B translates project creation and lifecycle blockers without changing domain blocker contracts', () => {
  assert.equal(projectBlockerLabel('Project name is required.'), 'Името на проекта е задължително.')
  assert.equal(projectBlockerLabel('Project id and reference must be unique in the session library.'), 'Референцията на проекта трябва да е уникална в текущата сесия.')
  assert.equal(projectBlockerLabel('Human reviewer is required.'), 'Трябва да бъде посочен човекът, извършил прегледа.')
  assert.equal(projectBlockerLabel('Action COMPLETE requires project status NEEDS_REVIEW.'), 'Завършването на проекта е позволено само при статус „За преглед“.')
})

test('PROJECT01.3B presents Project Detail safety and lifecycle labels in Bulgarian', () => {
  for (const marker of [
    'ДЕТАЙЛ НА ПРОЕКТА',
    'Жизненият цикъл е само за текущата сесия.',
    'Жизнен цикъл',
    'Автоматична повторна употреба: не',
    'Запис в сървър / база: не',
    'Готов за машина: не',
    'Производствено одобрен: не',
  ]) assert.match(detail, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
})

test('PROJECT01.3B presents Projects and source evidence headings in Bulgarian', () => {
  for (const marker of [
    'БИБЛИОТЕКА НА ПРОЕКТИТЕ',
    'САМО В ТЕКУЩАТА СЕСИЯ',
    'ИЗТОЧНИКОВ ПРОЕКТ · XML + LTE · САМО ЗА ЧЕТЕНЕ',
    'ИЗТОЧНИКЪТ Е НЕПРОМЕНЯЕМ',
    'ЧОВЕШКИ ПРЕГЛЕД',
    'РЕАЛНИ ДАННИ · ПАРТИДА 01 · САМО ЗА ЧЕТЕНЕ',
    'НЕ МОЖЕ ДА СЕ ИЗБИРА',
  ]) assert.ok(visibleLayer.includes(marker), marker)
})

test('PROJECT01.3B translates WP78 visible blocker codes instead of rendering raw enum identifiers', () => {
  assert.match(evidence, /Размерите на профилите са неизвестни\./)
  assert.match(evidence, /Правилата за тези профили не са валидирани\./)
  assert.match(evidence, /Преминаването към избираем каталожен запис чака човешко решение\./)
  assert.match(evidence, /wp78BlockerLabels\[blocker\]/)
})

test('PROJECT01.3B keeps Catalogue and embedded profile review user-facing copy Bulgarian', () => {
  for (const marker of [
    'РЕАЛНИ ДАННИ ОТ ИЗТОЧНИКА',
    'ИЗИСКВА СЕ ЧОВЕШКИ ПРЕГЛЕД',
    'РОЛЯТА Е ПОТВЪРДЕНА ОТ ЧОВЕК',
    'ПРОЕКТЕН / ИЗТОЧНИКОВ КОНТЕКСТ',
    'НОРМАЛИЗИРАН ЗАПИС ОТ ИЗТОЧНИК',
    'САМО ДЕМО · временни стойности',
  ]) assert.ok(visibleLayer.includes(marker), marker)
})

test('PROJECT01.3B removes the previous mixed-language UI phrases from the Projects/Catalogue surface', () => {
  for (const oldPhrase of [
    'PROJECT DETAIL',
    'Session-only lifecycle.',
    'automaticReuseAllowed: false',
    'SOURCE PROJECT · XML + LTE · READ ONLY',
    'SOURCE IMMUTABLE',
    'REAL DATA BATCH 01 · READ ONLY',
    'NO SELECTABLE',
    'РЕАЛЕН SOURCE EVIDENCE',
    'HUMAN REVIEW REQUIRED',
    'PROJECT / SOURCE CONTEXT',
    'Placeholder данни',
    'ДЕМО ONLY',
  ]) assert.equal(visibleLayer.includes(oldPhrase), false, oldPhrase)
})

test('PROJECT01.3B changes presentation only and leaves safety contracts locked', () => {
  const lifecycle = read('src/projectLifecycle.ts')
  for (const safe of ['sessionOnly: true', 'backendPersisted: false', 'machineReady: false', 'productionApproved: false', 'productionExecutable: false', 'automaticReuseAllowed: false']) assert.match(lifecycle, new RegExp(safe.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  for (const forbidden of ['machineReady: true', 'productionApproved: true', 'productionExecutable: true', 'automaticReuseAllowed: true']) assert.equal(visibleLayer.includes(forbidden), false, forbidden)
})
