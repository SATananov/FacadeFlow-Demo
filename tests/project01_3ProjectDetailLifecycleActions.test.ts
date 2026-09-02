import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { addProjectToLibrary, createEmptyProjectLibraryState, createProjectRecord, type ProjectLibraryState } from '../src/projectLifecycle'
import { applyProjectLifecycleAction, confirmProjectReviewInLibrary, selectedProjectRecord } from '../src/projectLifecycleActions'

const T0 = '2026-09-02T09:00:00.000Z'
const T1 = '2026-09-02T09:01:00.000Z'
const T2 = '2026-09-02T09:02:00.000Z'
const T3 = '2026-09-02T09:03:00.000Z'
const T4 = '2026-09-02T09:04:00.000Z'

function stateWithProject(): ProjectLibraryState {
  const created = createProjectRecord({ id: 'project-1', name: 'House A', reference: 'P-001', jobType: 'HOUSE', now: T0 })
  assert.ok(created.project)
  return addProjectToLibrary(createEmptyProjectLibraryState(), created.project).state
}

const read = (path: string) => readFileSync(path, 'utf8')
const workspace = read('src/components/ProjectsWorkspace.tsx')
const detail = read('src/components/ProjectDetailPanel.tsx')
const actions = read('src/projectLifecycleActions.ts')
const css = read('src/projectsWorkspace.css')

test('PROJECT01.3 resolves the explicit selected project without creating or inferring a replacement', () => {
  const state = stateWithProject()
  assert.equal(selectedProjectRecord(state)?.id, 'project-1')
  assert.equal(selectedProjectRecord({ ...state, selectedProjectId: null }), null)
  assert.equal(selectedProjectRecord({ ...state, selectedProjectId: 'missing' }), null)
})

test('PROJECT01.3 starts DRAFT work only through the canonical DRAFT -> ACTIVE transition', () => {
  const state = stateWithProject()
  const result = applyProjectLifecycleAction(state, 'project-1', 'START_WORK', T1)
  assert.equal(result.changed, true)
  assert.equal(result.state.projects[0].status, 'ACTIVE')
  assert.equal(state.projects[0].status, 'DRAFT')
})

test('PROJECT01.3 requests review only through ACTIVE -> NEEDS_REVIEW and preserves explicit review state', () => {
  let state = stateWithProject()
  state = applyProjectLifecycleAction(state, 'project-1', 'START_WORK', T1).state
  const review = applyProjectLifecycleAction(state, 'project-1', 'REQUEST_REVIEW', T2)
  assert.equal(review.changed, true)
  assert.equal(review.state.projects[0].status, 'NEEDS_REVIEW')
  assert.equal(review.state.projects[0].review.status, 'NEEDS_REVIEW')
})

test('PROJECT01.3 blocks lifecycle shortcuts instead of bypassing PROJECT01.1 rules', () => {
  const state = stateWithProject()
  const prematureReview = applyProjectLifecycleAction(state, 'project-1', 'REQUEST_REVIEW', T1)
  assert.equal(prematureReview.changed, false)
  assert.equal(prematureReview.state.projects[0].status, 'DRAFT')
  assert.match(prematureReview.blockers[0], /requires project status ACTIVE/)

  const prematureComplete = applyProjectLifecycleAction(state, 'project-1', 'COMPLETE', T1)
  assert.equal(prematureComplete.changed, false)
  assert.equal(prematureComplete.state.projects[0].status, 'DRAFT')

  const semanticMismatch = applyProjectLifecycleAction(state, 'project-1', 'RETURN_TO_ACTIVE', T1)
  assert.equal(semanticMismatch.changed, false)
  assert.match(semanticMismatch.blockers[0], /requires project status NEEDS_REVIEW/)
})

test('PROJECT01.3 requires an explicit named human reviewer before confirmation', () => {
  let state = stateWithProject()
  state = applyProjectLifecycleAction(state, 'project-1', 'START_WORK', T1).state
  state = applyProjectLifecycleAction(state, 'project-1', 'REQUEST_REVIEW', T2).state
  const blocked = confirmProjectReviewInLibrary(state, 'project-1', { reviewedBy: ' ', now: T3 })
  assert.equal(blocked.changed, false)
  assert.match(blocked.blockers[0], /reviewer is required/)

  const confirmed = confirmProjectReviewInLibrary(state, 'project-1', { reviewedBy: 'Stefan', note: ' checked ', now: T3 })
  assert.equal(confirmed.changed, true)
  assert.equal(confirmed.state.projects[0].review.status, 'HUMAN_CONFIRMED')
  assert.equal(confirmed.state.projects[0].review.reviewedBy, 'Stefan')
  assert.equal(confirmed.state.projects[0].review.note, 'checked')
})

test('PROJECT01.3 returns a review project to ACTIVE and invalidates the prior human confirmation', () => {
  let state = stateWithProject()
  state = applyProjectLifecycleAction(state, 'project-1', 'START_WORK', T1).state
  state = applyProjectLifecycleAction(state, 'project-1', 'REQUEST_REVIEW', T2).state
  state = confirmProjectReviewInLibrary(state, 'project-1', { reviewedBy: 'Stefan', now: T3 }).state
  const reopened = applyProjectLifecycleAction(state, 'project-1', 'RETURN_TO_ACTIVE', T4)
  assert.equal(reopened.changed, true)
  assert.equal(reopened.state.projects[0].status, 'ACTIVE')
  assert.equal(reopened.state.projects[0].review.status, 'NOT_REVIEWED')
  assert.equal(reopened.state.projects[0].review.reviewedBy, null)
})

test('PROJECT01.3 completes a project only after explicit human review confirmation', () => {
  let state = stateWithProject()
  state = applyProjectLifecycleAction(state, 'project-1', 'START_WORK', T1).state
  state = applyProjectLifecycleAction(state, 'project-1', 'REQUEST_REVIEW', T2).state
  const blocked = applyProjectLifecycleAction(state, 'project-1', 'COMPLETE', T3)
  assert.equal(blocked.changed, false)
  assert.match(blocked.blockers[0], /Human project review/)

  state = confirmProjectReviewInLibrary(state, 'project-1', { reviewedBy: 'Stefan', now: T3 }).state
  const completed = applyProjectLifecycleAction(state, 'project-1', 'COMPLETE', T4)
  assert.equal(completed.changed, true)
  assert.equal(completed.state.projects[0].status, 'COMPLETED')
  assert.equal(completed.state.projects[0].reuse.status, 'NOT_REVIEWED')
  assert.equal(completed.state.projects[0].reuse.automaticReuseAllowed, false)
})

test('PROJECT01.3 preserves all production safety flags throughout the visible lifecycle flow', () => {
  let state = stateWithProject()
  state = applyProjectLifecycleAction(state, 'project-1', 'START_WORK', T1).state
  state = applyProjectLifecycleAction(state, 'project-1', 'REQUEST_REVIEW', T2).state
  state = confirmProjectReviewInLibrary(state, 'project-1', { reviewedBy: 'Stefan', now: T3 }).state
  state = applyProjectLifecycleAction(state, 'project-1', 'COMPLETE', T4).state
  const project = state.projects[0]
  assert.equal(project.machineReady, false)
  assert.equal(project.productionApproved, false)
  assert.equal(project.productionExecutable, false)
  assert.equal(project.backendPersisted, false)
  assert.equal(project.similaritySearchEnabled, false)
})

test('PROJECT01.3 project detail is driven by selectedProjectId and canonical library mutation helpers', () => {
  assert.match(workspace, /selectedProjectRecord\(projectLibrary\)/)
  assert.match(workspace, /applyProjectLifecycleAction\(projectLibrary, selectedProject\.id, action/)
  assert.match(workspace, /confirmProjectReviewInLibrary\(projectLibrary, selectedProject\.id/)
  assert.match(workspace, /<ProjectDetailPanel/)
  assert.match(workspace, /selectedProject\.review\.reviewedAt/)
  assert.match(workspace, /selectProjectInLibrary\(projectLibrary, null\)/)
})

test('PROJECT01.3 detail exposes explicit DRAFT ACTIVE REVIEW COMPLETED actions without auto completion', () => {
  assert.match(detail, /Стартирай проект/)
  assert.match(detail, /Изпрати за човешки преглед/)
  assert.match(detail, /Потвърди човешкия преглед/)
  assert.match(detail, /Върни за редакция/)
  assert.match(detail, /Завърши проект/)
  assert.doesNotMatch(detail, /decideProjectReuse|onReuseDecision|onLifecycleAction\('ARCHIVE'\)/)
})

test('PROJECT01.3 detail communicates session production and reuse boundaries visibly', () => {
  for (const marker of ['Жизненият цикъл е само за текущата сесия.', 'Готов за машина: не', 'Производствено одобрен: не', 'Автоматична повторна употреба: не', 'не превръща проекта автоматично в шаблон']) assert.match(detail, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  assert.match(workspace, /PROJECT01\.3 · САМО В ТЕКУЩАТА СЕСИЯ/)
})

test('PROJECT01.3 adds responsive detail review and action styling without replacing PROJECT01.2 cards', () => {
  for (const selector of ['.projects-detail-panel', '.projects-detail-grid', '.projects-review-form', '.projects-detail-action-card']) assert.match(css, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  assert.match(css, /@media\(max-width:1000px\)/)
  assert.match(css, /@media\(max-width:620px\)/)
  assert.match(css, /\.projects-lifecycle-card/)
})

test('PROJECT01.3 introduces no persistence network similarity execution automatic reuse or production unlock', () => {
  const combined = `${actions}\n${workspace}\n${detail}`
  for (const forbidden of ['localStorage', 'sessionStorage', 'indexedDB', 'fetch(', 'XMLHttpRequest', 'WebSocket', 'machineReady: true', 'productionApproved: true', 'productionExecutable: true', 'automaticReuseAllowed: true', 'similaritySearchEnabled: true']) assert.equal(combined.includes(forbidden), false, forbidden)
})
