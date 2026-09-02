import test from 'node:test'
import assert from 'node:assert/strict'
import {
  addProjectToLibrary,
  confirmProjectHumanReview,
  createEmptyProjectLibraryState,
  createProjectRecord,
  decideProjectReuse,
  isExplicitReusableProject,
  linkProjectProduct,
  linkProjectSource,
  replaceProjectInLibrary,
  selectProjectInLibrary,
  transitionProjectLifecycle,
  type ProjectRecord,
} from '../src/projectLifecycle'

const T0 = '2026-09-02T07:00:00.000Z'
const T1 = '2026-09-02T07:01:00.000Z'
const T2 = '2026-09-02T07:02:00.000Z'
const T3 = '2026-09-02T07:03:00.000Z'

function createProject(id = 'project-1', reference = 'PRJ-001'): ProjectRecord {
  const result = createProjectRecord({ id, name: 'Test Project', reference, now: T0 })
  assert.deepEqual(result.blockers, [])
  assert.ok(result.project)
  return result.project
}

function reviewedProject(): ProjectRecord {
  let project = createProject()
  project = transitionProjectLifecycle(project, 'ACTIVE', T1).project
  project = transitionProjectLifecycle(project, 'NEEDS_REVIEW', T2).project
  project = confirmProjectHumanReview(project, { reviewedBy: 'Human Reviewer', now: T3 }).project
  return project
}

test('PROJECT01.1 creates a session-only safe DRAFT project with no inferred sources, products or reuse authority', () => {
  const project = createProjectRecord({ id: '  p-1  ', name: '  House A  ', reference: '  REF-A  ', now: T0 }).project
  assert.ok(project)
  assert.equal(project.id, 'p-1')
  assert.equal(project.name, 'House A')
  assert.equal(project.reference, 'REF-A')
  assert.equal(project.jobType, null)
  assert.equal(project.status, 'DRAFT')
  assert.deepEqual(project.sourceLinks, [])
  assert.deepEqual(project.productLinks, [])
  assert.equal(project.review.status, 'NOT_REVIEWED')
  assert.equal(project.reuse.status, 'NOT_REVIEWED')
  assert.equal(project.sessionOnly, true)
  assert.equal(project.backendPersisted, false)
  assert.equal(project.similaritySearchEnabled, false)
  assert.equal(project.machineReady, false)
  assert.equal(project.productionApproved, false)
  assert.equal(project.productionExecutable, false)
  assert.equal(project.reuse.automaticReuseAllowed, false)
})


test('PROJECT01.1 accepts an explicit existing FacadeFlow job type but never invents one', () => {
  const typed = createProjectRecord({ id: 'p-house', name: 'House', reference: 'HOUSE-01', jobType: 'HOUSE', now: T0 }).project
  assert.ok(typed)
  assert.equal(typed.jobType, 'HOUSE')

  const unresolved = createProjectRecord({ id: 'p-open', name: 'Open', reference: 'OPEN-01', now: T0 }).project
  assert.ok(unresolved)
  assert.equal(unresolved.jobType, null)
})

test('PROJECT01.1 rejects incomplete project identity instead of inventing values', () => {
  const result = createProjectRecord({ id: ' ', name: '', reference: ' ', now: T0 })
  assert.equal(result.project, null)
  assert.equal(result.blockers.length, 3)
  assert.match(result.blockers.join(' '), /id is required/)
  assert.match(result.blockers.join(' '), /name is required/)
  assert.match(result.blockers.join(' '), /reference is required/)
})

test('PROJECT01.1 lifecycle follows the explicit DRAFT -> ACTIVE -> NEEDS_REVIEW path', () => {
  const draft = createProject()
  const active = transitionProjectLifecycle(draft, 'ACTIVE', T1)
  assert.equal(active.changed, true)
  assert.equal(active.project.status, 'ACTIVE')

  const review = transitionProjectLifecycle(active.project, 'NEEDS_REVIEW', T2)
  assert.equal(review.changed, true)
  assert.equal(review.project.status, 'NEEDS_REVIEW')
  assert.equal(review.project.review.status, 'NEEDS_REVIEW')
})

test('PROJECT01.1 blocks lifecycle shortcuts and completion without human confirmation', () => {
  const draft = createProject()
  const shortcut = transitionProjectLifecycle(draft, 'COMPLETED', T1)
  assert.equal(shortcut.changed, false)
  assert.equal(shortcut.project.status, 'DRAFT')
  assert.match(shortcut.blockers[0], /not allowed/)

  const active = transitionProjectLifecycle(draft, 'ACTIVE', T1).project
  const review = transitionProjectLifecycle(active, 'NEEDS_REVIEW', T2).project
  const premature = transitionProjectLifecycle(review, 'COMPLETED', T3)
  assert.equal(premature.changed, false)
  assert.equal(premature.project.status, 'NEEDS_REVIEW')
  assert.match(premature.blockers[0], /Human project review/)
})

test('PROJECT01.1 human review is explicit and returning to ACTIVE invalidates the prior review state', () => {
  let project = createProject()
  project = transitionProjectLifecycle(project, 'ACTIVE', T1).project
  project = transitionProjectLifecycle(project, 'NEEDS_REVIEW', T2).project

  const missingReviewer = confirmProjectHumanReview(project, { reviewedBy: ' ', now: T3 })
  assert.equal(missingReviewer.changed, false)

  const confirmed = confirmProjectHumanReview(project, { reviewedBy: 'Stefan', now: T3, note: ' checked ' })
  assert.equal(confirmed.changed, true)
  assert.equal(confirmed.project.review.status, 'HUMAN_CONFIRMED')
  assert.equal(confirmed.project.review.reviewedBy, 'Stefan')
  assert.equal(confirmed.project.review.note, 'checked')

  const reopened = transitionProjectLifecycle(confirmed.project, 'ACTIVE', '2026-09-02T07:04:00.000Z')
  assert.equal(reopened.project.review.status, 'NOT_REVIEWED')
  assert.equal(reopened.project.review.reviewedBy, null)
})

test('PROJECT01.1 completion remains historical and does not automatically create a template', () => {
  const reviewed = reviewedProject()
  const completed = transitionProjectLifecycle(reviewed, 'COMPLETED', '2026-09-02T07:04:00.000Z')
  assert.equal(completed.changed, true)
  assert.equal(completed.project.status, 'COMPLETED')
  assert.equal(completed.project.reuse.status, 'NOT_REVIEWED')
  assert.equal(completed.project.reuse.automaticReuseAllowed, false)
  assert.equal(isExplicitReusableProject(completed.project), false)
})

test('PROJECT01.1 reusable-template status requires a separate explicit human decision after completion', () => {
  const reviewed = reviewedProject()
  const beforeCompletion = decideProjectReuse(reviewed, { decision: 'APPROVE', decidedBy: 'Stefan', now: T3 })
  assert.equal(beforeCompletion.changed, false)

  const completed = transitionProjectLifecycle(reviewed, 'COMPLETED', '2026-09-02T07:04:00.000Z').project
  const approved = decideProjectReuse(completed, {
    decision: 'APPROVE',
    decidedBy: 'Stefan',
    now: '2026-09-02T07:05:00.000Z',
    note: 'Reusable after explicit review',
  })
  assert.equal(approved.changed, true)
  assert.equal(approved.project.reuse.status, 'APPROVED')
  assert.equal(approved.project.reuse.humanDecisionRequired, true)
  assert.equal(approved.project.reuse.automaticReuseAllowed, false)
  assert.equal(isExplicitReusableProject(approved.project), true)
})

test('PROJECT01.1 source links remain evidence links and do not change lifecycle, review or production authority', () => {
  const project = createProject()
  const linked = linkProjectSource(project, {
    id: 'source-vadim',
    kind: 'SOURCE_PROJECT',
    sourceId: 'nadezhda-vadim-2',
    label: 'Nadezhda / Vadim-2',
    now: T1,
  })
  assert.equal(linked.changed, true)
  assert.equal(linked.project.sourceLinks[0].reviewStatus, 'EVIDENCE_ONLY')
  assert.equal(linked.project.status, 'DRAFT')
  assert.equal(linked.project.review.status, 'NOT_REVIEWED')
  assert.equal(linked.project.machineReady, false)
  assert.equal(linked.project.productionApproved, false)

  const duplicate = linkProjectSource(linked.project, {
    id: 'other-id',
    kind: 'SOURCE_PROJECT',
    sourceId: 'nadezhda-vadim-2',
    label: 'Duplicate source',
    now: T2,
  })
  assert.equal(duplicate.changed, false)
  assert.equal(duplicate.project.sourceLinks.length, 1)
})

test('PROJECT01.1 product membership uses stable product ids without copying production authority into the project', () => {
  const project = createProject()
  const linked = linkProjectProduct(project, {
    productId: 'product-001',
    placementNodeId: ' position-7 ',
    origin: 'AI04_HANDOFF',
    reviewStatus: 'NEEDS_REVIEW',
    now: T1,
  })
  assert.equal(linked.changed, true)
  assert.deepEqual(linked.project.productLinks[0], {
    productId: 'product-001',
    placementNodeId: 'position-7',
    origin: 'AI04_HANDOFF',
    reviewStatus: 'NEEDS_REVIEW',
  })
  assert.equal(linked.project.machineReady, false)
  assert.equal(linked.project.productionApproved, false)

  const duplicate = linkProjectProduct(linked.project, {
    productId: 'product-001',
    placementNodeId: null,
    origin: 'MANUAL',
    reviewStatus: 'DRAFT',
    now: T2,
  })
  assert.equal(duplicate.changed, false)
  assert.equal(duplicate.project.productLinks.length, 1)
})

test('PROJECT01.1 in-memory library enforces session uniqueness and explicit selection', () => {
  const first = createProject('project-1', 'PRJ-001')
  const second = createProject('project-2', 'PRJ-002')
  let state = createEmptyProjectLibraryState()
  assert.equal(state.sessionOnly, true)
  assert.equal(state.backendPersisted, false)

  const addedFirst = addProjectToLibrary(state, first)
  assert.equal(addedFirst.changed, true)
  state = addedFirst.state
  assert.equal(state.selectedProjectId, 'project-1')

  const duplicateReference = addProjectToLibrary(state, createProject('project-3', 'PRJ-001'))
  assert.equal(duplicateReference.changed, false)

  state = addProjectToLibrary(state, second).state
  const selected = selectProjectInLibrary(state, 'project-1')
  assert.equal(selected.changed, true)
  assert.equal(selected.state.selectedProjectId, 'project-1')

  const unknown = selectProjectInLibrary(selected.state, 'missing')
  assert.equal(unknown.changed, false)
})

test('PROJECT01.1 library replacement is immutable and preserves unique references', () => {
  const first = createProject('project-1', 'PRJ-001')
  const second = createProject('project-2', 'PRJ-002')
  let state = addProjectToLibrary(createEmptyProjectLibraryState(), first).state
  state = addProjectToLibrary(state, second).state

  const activeFirst = transitionProjectLifecycle(first, 'ACTIVE', T1).project
  const replaced = replaceProjectInLibrary(state, activeFirst)
  assert.equal(replaced.changed, true)
  assert.equal(replaced.state.projects.find((item) => item.id === 'project-1')?.status, 'ACTIVE')
  assert.equal(state.projects.find((item) => item.id === 'project-1')?.status, 'DRAFT')

  const conflicting = { ...activeFirst, reference: 'PRJ-002' }
  const blocked = replaceProjectInLibrary(replaced.state, conflicting)
  assert.equal(blocked.changed, false)
})

test('PROJECT01.1 source contains no persistence, network, similarity execution or production unlock implementation', async () => {
  const fs = await import('node:fs')
  const path = await import('node:path')
  const source = fs.readFileSync(path.join(process.cwd(), 'src', 'projectLifecycle.ts'), 'utf8')
  assert.doesNotMatch(source, /\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b|\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b/)
  assert.doesNotMatch(source, /machineReady:\s*true|productionApproved:\s*true|productionExecutable:\s*true|automaticReuseAllowed:\s*true|similaritySearchEnabled:\s*true/)
  assert.match(source, /sessionOnly:\s*true/)
  assert.match(source, /backendPersisted:\s*false/)
})
