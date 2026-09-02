import type { FacadeFlowJobType } from './aiWorkspaceTypes'

export type ProjectLifecycleStatus = 'DRAFT' | 'ACTIVE' | 'NEEDS_REVIEW' | 'COMPLETED' | 'ARCHIVED'
export type ProjectReviewStatus = 'NOT_REVIEWED' | 'NEEDS_REVIEW' | 'HUMAN_CONFIRMED'
export type ProjectReuseStatus = 'NOT_REVIEWED' | 'APPROVED' | 'REJECTED'
export type ProjectSourceKind = 'SOURCE_PROJECT' | 'DOCUMENT' | 'IMPORT' | 'MANUAL_REFERENCE'
export type ProjectSourceReviewStatus = 'EVIDENCE_ONLY' | 'HUMAN_REVIEWED'
export type ProjectProductOrigin = 'MANUAL' | 'IMPORT' | 'AI04_HANDOFF'
export type ProjectProductReviewStatus = 'DRAFT' | 'NEEDS_REVIEW' | 'HUMAN_CONFIRMED'

export interface ProjectSourceLink {
  id: string
  kind: ProjectSourceKind
  sourceId: string
  label: string
  reviewStatus: ProjectSourceReviewStatus
}

export interface ProjectProductLink {
  productId: string
  placementNodeId: string | null
  origin: ProjectProductOrigin
  reviewStatus: ProjectProductReviewStatus
}

export interface ProjectHumanReview {
  status: ProjectReviewStatus
  reviewedBy: string | null
  reviewedAt: string | null
  note: string | null
}

export interface ProjectReuseDecision {
  status: ProjectReuseStatus
  decidedBy: string | null
  decidedAt: string | null
  note: string | null
  humanDecisionRequired: true
  automaticReuseAllowed: false
}

export interface ProjectRecord {
  id: string
  name: string
  reference: string
  jobType: FacadeFlowJobType | null
  status: ProjectLifecycleStatus
  sourceLinks: ProjectSourceLink[]
  productLinks: ProjectProductLink[]
  review: ProjectHumanReview
  reuse: ProjectReuseDecision
  createdAt: string
  updatedAt: string
  sessionOnly: true
  backendPersisted: false
  similaritySearchEnabled: false
  machineReady: false
  productionApproved: false
  productionExecutable: false
}

export interface ProjectLibraryState {
  projects: ProjectRecord[]
  selectedProjectId: string | null
  sessionOnly: true
  backendPersisted: false
}

export interface ProjectCreationInput {
  id: string
  name: string
  reference: string
  jobType?: FacadeFlowJobType | null
  now: string
}

export interface ProjectCreationResult {
  project: ProjectRecord | null
  blockers: string[]
}

export interface ProjectMutationResult {
  project: ProjectRecord
  changed: boolean
  blockers: string[]
}

export interface ProjectLibraryMutationResult {
  state: ProjectLibraryState
  changed: boolean
  blockers: string[]
}

const ALLOWED_TRANSITIONS: Record<ProjectLifecycleStatus, readonly ProjectLifecycleStatus[]> = {
  DRAFT: ['ACTIVE'],
  ACTIVE: ['NEEDS_REVIEW'],
  NEEDS_REVIEW: ['ACTIVE', 'COMPLETED'],
  COMPLETED: ['ARCHIVED'],
  ARCHIVED: [],
}

function cleanRequired(value: string): string {
  return value.trim()
}

function unchanged(project: ProjectRecord, blocker: string): ProjectMutationResult {
  return { project, changed: false, blockers: [blocker] }
}

function touch(project: ProjectRecord, now: string): ProjectRecord {
  return { ...project, updatedAt: now }
}

function emptyHumanReview(): ProjectHumanReview {
  return { status: 'NOT_REVIEWED', reviewedBy: null, reviewedAt: null, note: null }
}

function emptyReuseDecision(): ProjectReuseDecision {
  return {
    status: 'NOT_REVIEWED',
    decidedBy: null,
    decidedAt: null,
    note: null,
    humanDecisionRequired: true,
    automaticReuseAllowed: false,
  }
}

export function createProjectRecord(input: ProjectCreationInput): ProjectCreationResult {
  const id = cleanRequired(input.id)
  const name = cleanRequired(input.name)
  const reference = cleanRequired(input.reference)
  const blockers: string[] = []

  if (!id) blockers.push('Project id is required.')
  if (!name) blockers.push('Project name is required.')
  if (!reference) blockers.push('Project reference is required.')
  if (!cleanRequired(input.now)) blockers.push('Project timestamp is required.')

  if (blockers.length) return { project: null, blockers }

  return {
    project: {
      id,
      name,
      reference,
      jobType: input.jobType ?? null,
      status: 'DRAFT',
      sourceLinks: [],
      productLinks: [],
      review: emptyHumanReview(),
      reuse: emptyReuseDecision(),
      createdAt: input.now,
      updatedAt: input.now,
      sessionOnly: true,
      backendPersisted: false,
      similaritySearchEnabled: false,
      machineReady: false,
      productionApproved: false,
      productionExecutable: false,
    },
    blockers: [],
  }
}

export function transitionProjectLifecycle(
  project: ProjectRecord,
  target: ProjectLifecycleStatus,
  now: string,
): ProjectMutationResult {
  if (target === project.status) return { project, changed: false, blockers: [] }
  if (!ALLOWED_TRANSITIONS[project.status].includes(target)) {
    return unchanged(project, `Lifecycle transition ${project.status} -> ${target} is not allowed.`)
  }
  if (target === 'COMPLETED' && project.review.status !== 'HUMAN_CONFIRMED') {
    return unchanged(project, 'Human project review is required before completion.')
  }

  let review = project.review
  if (target === 'NEEDS_REVIEW') {
    review = { status: 'NEEDS_REVIEW', reviewedBy: null, reviewedAt: null, note: null }
  } else if (project.status === 'NEEDS_REVIEW' && target === 'ACTIVE') {
    review = emptyHumanReview()
  }

  return {
    project: touch({ ...project, status: target, review }, now),
    changed: true,
    blockers: [],
  }
}

export function confirmProjectHumanReview(
  project: ProjectRecord,
  input: { reviewedBy: string; now: string; note?: string | null },
): ProjectMutationResult {
  if (project.status !== 'NEEDS_REVIEW') {
    return unchanged(project, 'Project must be in NEEDS_REVIEW before human review can be confirmed.')
  }
  const reviewedBy = cleanRequired(input.reviewedBy)
  if (!reviewedBy) return unchanged(project, 'Human reviewer is required.')

  return {
    project: touch({
      ...project,
      review: {
        status: 'HUMAN_CONFIRMED',
        reviewedBy,
        reviewedAt: input.now,
        note: input.note?.trim() || null,
      },
    }, input.now),
    changed: true,
    blockers: [],
  }
}

export function linkProjectSource(
  project: ProjectRecord,
  input: Omit<ProjectSourceLink, 'reviewStatus'> & { reviewStatus?: ProjectSourceReviewStatus; now: string },
): ProjectMutationResult {
  const id = cleanRequired(input.id)
  const sourceId = cleanRequired(input.sourceId)
  const label = cleanRequired(input.label)
  if (!id || !sourceId || !label) return unchanged(project, 'Source link id, sourceId and label are required.')
  if (project.sourceLinks.some((item) => item.id === id || (item.kind === input.kind && item.sourceId === sourceId))) {
    return unchanged(project, 'Source link already exists.')
  }

  const source: ProjectSourceLink = {
    id,
    kind: input.kind,
    sourceId,
    label,
    reviewStatus: input.reviewStatus ?? 'EVIDENCE_ONLY',
  }
  return {
    project: touch({ ...project, sourceLinks: [...project.sourceLinks, source] }, input.now),
    changed: true,
    blockers: [],
  }
}

export function linkProjectProduct(
  project: ProjectRecord,
  input: ProjectProductLink & { now: string },
): ProjectMutationResult {
  const productId = cleanRequired(input.productId)
  if (!productId) return unchanged(project, 'Product id is required.')
  if (project.productLinks.some((item) => item.productId === productId)) {
    return unchanged(project, 'Product is already linked to this project.')
  }

  const product: ProjectProductLink = {
    productId,
    placementNodeId: input.placementNodeId?.trim() || null,
    origin: input.origin,
    reviewStatus: input.reviewStatus,
  }
  return {
    project: touch({ ...project, productLinks: [...project.productLinks, product] }, input.now),
    changed: true,
    blockers: [],
  }
}

export function decideProjectReuse(
  project: ProjectRecord,
  input: { decision: 'APPROVE' | 'REJECT'; decidedBy: string; now: string; note?: string | null },
): ProjectMutationResult {
  if (project.status !== 'COMPLETED') {
    return unchanged(project, 'Only a completed project can receive a reusable-template decision.')
  }
  if (project.review.status !== 'HUMAN_CONFIRMED') {
    return unchanged(project, 'Human-confirmed project review is required before reusable-template review.')
  }
  const decidedBy = cleanRequired(input.decidedBy)
  if (!decidedBy) return unchanged(project, 'Human reuse reviewer is required.')

  return {
    project: touch({
      ...project,
      reuse: {
        status: input.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        decidedBy,
        decidedAt: input.now,
        note: input.note?.trim() || null,
        humanDecisionRequired: true,
        automaticReuseAllowed: false,
      },
    }, input.now),
    changed: true,
    blockers: [],
  }
}

export function createEmptyProjectLibraryState(): ProjectLibraryState {
  return { projects: [], selectedProjectId: null, sessionOnly: true, backendPersisted: false }
}

export function addProjectToLibrary(state: ProjectLibraryState, project: ProjectRecord): ProjectLibraryMutationResult {
  if (state.projects.some((item) => item.id === project.id || item.reference === project.reference)) {
    return { state, changed: false, blockers: ['Project id and reference must be unique in the session library.'] }
  }
  return {
    state: { ...state, projects: [...state.projects, project], selectedProjectId: project.id },
    changed: true,
    blockers: [],
  }
}

export function replaceProjectInLibrary(state: ProjectLibraryState, project: ProjectRecord): ProjectLibraryMutationResult {
  if (!state.projects.some((item) => item.id === project.id)) {
    return { state, changed: false, blockers: ['Project does not exist in the session library.'] }
  }
  if (state.projects.some((item) => item.id !== project.id && item.reference === project.reference)) {
    return { state, changed: false, blockers: ['Project reference must remain unique in the session library.'] }
  }
  return {
    state: { ...state, projects: state.projects.map((item) => item.id === project.id ? project : item) },
    changed: true,
    blockers: [],
  }
}

export function selectProjectInLibrary(state: ProjectLibraryState, projectId: string | null): ProjectLibraryMutationResult {
  if (projectId !== null && !state.projects.some((item) => item.id === projectId)) {
    return { state, changed: false, blockers: ['Project does not exist in the session library.'] }
  }
  if (state.selectedProjectId === projectId) return { state, changed: false, blockers: [] }
  return { state: { ...state, selectedProjectId: projectId }, changed: true, blockers: [] }
}

export function isExplicitReusableProject(project: ProjectRecord): boolean {
  return project.status === 'COMPLETED'
    && project.review.status === 'HUMAN_CONFIRMED'
    && project.reuse.status === 'APPROVED'
}
