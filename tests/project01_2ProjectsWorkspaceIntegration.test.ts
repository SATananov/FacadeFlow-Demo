import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { addProjectToLibrary, confirmProjectHumanReview, createEmptyProjectLibraryState, createProjectRecord, decideProjectReuse, transitionProjectLifecycle } from '../src/projectLifecycle'
import { projectMatchesWorkspaceFilter, summarizeProjectLibrary, visibleLifecycleProjects } from '../src/projectWorkspaceModel'

const read = (path: string) => readFileSync(path, 'utf8')
const projects = read('src/components/ProjectsWorkspace.tsx')
const app = read('src/App.tsx')
const css = read('src/projectsWorkspace.css')
const T0 = '2026-09-02T08:00:00.000Z'

function create(id: string, reference: string) {
  const result = createProjectRecord({ id, name: `Project ${id}`, reference, now: T0 })
  assert.ok(result.project)
  return result.project
}

test('PROJECT01.2 treats DRAFT and ACTIVE projects as current work in the Active filter', () => {
  const draft = create('p1', 'P-001')
  const active = transitionProjectLifecycle(create('p2', 'P-002'), 'ACTIVE', T0).project
  assert.equal(projectMatchesWorkspaceFilter(draft, 'ACTIVE'), true)
  assert.equal(projectMatchesWorkspaceFilter(active, 'ACTIVE'), true)
  assert.equal(projectMatchesWorkspaceFilter(draft, 'REVIEW'), false)
})

test('PROJECT01.2 derives review completed and template counts from lifecycle state without promoting reuse', () => {
  const draft = create('p1', 'P-001')
  let review = transitionProjectLifecycle(create('p2', 'P-002'), 'ACTIVE', T0).project
  review = transitionProjectLifecycle(review, 'NEEDS_REVIEW', T0).project
  let completed = transitionProjectLifecycle(create('p3', 'P-003'), 'ACTIVE', T0).project
  completed = transitionProjectLifecycle(completed, 'NEEDS_REVIEW', T0).project
  completed = confirmProjectHumanReview(completed, { reviewedBy: 'Human', now: T0 }).project
  completed = transitionProjectLifecycle(completed, 'COMPLETED', T0).project
  let reusable = transitionProjectLifecycle(create('p4', 'P-004'), 'ACTIVE', T0).project
  reusable = transitionProjectLifecycle(reusable, 'NEEDS_REVIEW', T0).project
  reusable = confirmProjectHumanReview(reusable, { reviewedBy: 'Human', now: T0 }).project
  reusable = transitionProjectLifecycle(reusable, 'COMPLETED', T0).project
  reusable = decideProjectReuse(reusable, { decision: 'APPROVE', decidedBy: 'Human', now: T0 }).project

  let state = createEmptyProjectLibraryState()
  for (const project of [draft, review, completed, reusable]) state = addProjectToLibrary(state, project).state
  const summary = summarizeProjectLibrary(state)
  assert.deepEqual(summary, { active: 1, review: 1, completed: 2, templates: 1 })
  assert.equal(completed.reuse.automaticReuseAllowed, false)
  assert.equal(reusable.reuse.automaticReuseAllowed, false)
})

test('PROJECT01.2 lifecycle project filtering never treats source evidence as lifecycle records', () => {
  const draft = create('p1', 'P-001')
  const state = addProjectToLibrary(createEmptyProjectLibraryState(), draft).state
  assert.deepEqual(visibleLifecycleProjects(state, 'SOURCES'), [])
  assert.equal(visibleLifecycleProjects(state, 'ALL').length, 1)
})

test('PROJECT01.2 moves session library ownership to App so projects survive workspace close and reopen', () => {
  assert.match(app, /createEmptyProjectLibraryState/)
  assert.match(app, /useState<ProjectLibraryState>\(\(\) => createEmptyProjectLibraryState\(\)\)/)
  assert.match(app, /<ProjectsWorkspace profiles=\{catalogueProfiles\} projectLibrary=\{projectLibrary\} onProjectLibrary=\{setProjectLibrary\}/)
})

test('PROJECT01.2 activates explicit new-project creation through the PROJECT01.1 contract', () => {
  assert.match(projects, /\+ Нов проект/)
  assert.match(projects, /createProjectRecord\(/)
  assert.match(projects, /addProjectToLibrary\(/)
  assert.match(projects, /crypto\.randomUUID\(\)/)
  assert.match(projects, /new Date\(\)\.toISOString\(\)/)
  assert.doesNotMatch(projects, /status:\s*['"]ACTIVE['"]/)
})

test('PROJECT01.2 requires human-entered name and reference while keeping job type optional', () => {
  assert.match(projects, /Име на проекта \*/)
  assert.match(projects, /Референция \*/)
  assert.match(projects, /<option value="">Не е зададен<\/option>/)
  assert.match(projects, /jobType:\s*jobType \|\| null/)
})

test('PROJECT01.2 exposes creation blockers and explicit session project selection', () => {
  assert.match(projects, /creationBlockers/)
  assert.match(projects, /Проектът не е създаден:/)
  assert.match(projects, /selectProjectInLibrary\(/)
  assert.match(projects, /Активен в сесията/)
  assert.match(projects, /aria-pressed=\{selected\}/)
})

test('PROJECT01.2 keeps source evidence visually and logically separate from lifecycle project cards', () => {
  assert.match(projects, /projects-lifecycle-region/)
  assert.match(projects, /projects-source-region/)
  assert.match(projects, /ProjectSourceEvidence/)
  assert.match(projects, /Source-backed проектният контекст остава отделна evidence зона/)
  assert.doesNotMatch(projects, /linkProjectSource\(/)
})

test('PROJECT01.2 retains zero-state compatibility and explicit no-persistence copy', () => {
  assert.match(projects, /Все още няма lifecycle проекти/)
  assert.match(projects, /Няма създадени данни и нищо не се записва извън текущата сесия/)
  assert.match(projects, /Няма backend, записване, AI similarity, автоматично копиране или production unlock/)
})

test('PROJECT01.2 adds responsive project creation and lifecycle-card styling', () => {
  for (const selector of ['.projects-new-project-panel', '.projects-new-project-fields', '.projects-lifecycle-region', '.projects-lifecycle-card']) assert.match(css, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  assert.match(css, /@media\(max-width:900px\)/)
  assert.match(css, /@media\(max-width:560px\)/)
})

test('PROJECT01.2 introduces no persistence network similarity execution or production unlock', () => {
  const model = read('src/projectWorkspaceModel.ts')
  const combined = `${projects}\n${model}\n${app}`
  for (const forbidden of ['localStorage', 'sessionStorage', 'indexedDB', 'fetch(', 'XMLHttpRequest', 'WebSocket', 'machineReady: true', 'productionApproved: true', 'productionExecutable: true', 'automaticReuseAllowed: true', 'similaritySearchEnabled: true']) assert.equal(combined.includes(forbidden), false, forbidden)
})
