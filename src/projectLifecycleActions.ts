import {
  confirmProjectHumanReview,
  replaceProjectInLibrary,
  transitionProjectLifecycle,
  type ProjectLibraryMutationResult,
  type ProjectLibraryState,
  type ProjectMutationResult,
  type ProjectRecord,
} from './projectLifecycle'

export type ProjectLifecycleAction = 'START_WORK' | 'REQUEST_REVIEW' | 'RETURN_TO_ACTIVE' | 'COMPLETE'

const ACTION_RULES: Record<ProjectLifecycleAction, { from: ProjectRecord['status']; to: ProjectRecord['status'] }> = {
  START_WORK: { from: 'DRAFT', to: 'ACTIVE' },
  REQUEST_REVIEW: { from: 'ACTIVE', to: 'NEEDS_REVIEW' },
  RETURN_TO_ACTIVE: { from: 'NEEDS_REVIEW', to: 'ACTIVE' },
  COMPLETE: { from: 'NEEDS_REVIEW', to: 'COMPLETED' },
}

function blocked(state: ProjectLibraryState, blocker: string): ProjectLibraryMutationResult {
  return { state, changed: false, blockers: [blocker] }
}

function findProject(state: ProjectLibraryState, projectId: string): ProjectRecord | null {
  return state.projects.find((project) => project.id === projectId) ?? null
}

function applyMutation(
  state: ProjectLibraryState,
  mutation: ProjectMutationResult,
): ProjectLibraryMutationResult {
  if (!mutation.changed) return { state, changed: false, blockers: mutation.blockers }
  return replaceProjectInLibrary(state, mutation.project)
}

export function selectedProjectRecord(state: ProjectLibraryState): ProjectRecord | null {
  if (!state.selectedProjectId) return null
  return findProject(state, state.selectedProjectId)
}

export function applyProjectLifecycleAction(
  state: ProjectLibraryState,
  projectId: string,
  action: ProjectLifecycleAction,
  now: string,
): ProjectLibraryMutationResult {
  const project = findProject(state, projectId)
  if (!project) return blocked(state, 'Project does not exist in the session library.')
  const rule = ACTION_RULES[action]
  if (project.status !== rule.from) {
    return blocked(state, `Action ${action} requires project status ${rule.from}.`)
  }
  return applyMutation(state, transitionProjectLifecycle(project, rule.to, now))
}

export function confirmProjectReviewInLibrary(
  state: ProjectLibraryState,
  projectId: string,
  input: { reviewedBy: string; now: string; note?: string | null },
): ProjectLibraryMutationResult {
  const project = findProject(state, projectId)
  if (!project) return blocked(state, 'Project does not exist in the session library.')
  return applyMutation(state, confirmProjectHumanReview(project, input))
}
