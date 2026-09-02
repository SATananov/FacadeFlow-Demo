import { isExplicitReusableProject, type ProjectLibraryState, type ProjectRecord } from './projectLifecycle'
import type { FacadeFlowJobType } from './aiWorkspaceTypes'

export type ProjectWorkspaceFilter = 'ALL' | 'SOURCES' | 'ACTIVE' | 'REVIEW' | 'COMPLETED' | 'TEMPLATES'

export interface ProjectWorkspaceSummaryCounts {
  active: number
  review: number
  completed: number
  templates: number
}

export const PROJECT_JOB_TYPE_OPTIONS: ReadonlyArray<{ value: FacadeFlowJobType; label: string }> = [
  { value: 'BUILDING', label: 'Сграда' },
  { value: 'HOUSE', label: 'Къща' },
  { value: 'SMALL_PROJECT', label: 'Малък проект / ремонт' },
  { value: 'SINGLE_PRODUCT', label: 'Единично изделие' },
  { value: 'CUSTOM_ORDER', label: 'Нестандартна поръчка' },
  { value: 'TECHNICAL_DETAIL', label: 'Технически детайл' },
]

export function projectMatchesWorkspaceFilter(project: ProjectRecord, filter: ProjectWorkspaceFilter): boolean {
  if (filter === 'SOURCES') return false
  if (filter === 'ALL') return true
  if (filter === 'ACTIVE') return project.status === 'DRAFT' || project.status === 'ACTIVE'
  if (filter === 'REVIEW') return project.status === 'NEEDS_REVIEW'
  if (filter === 'COMPLETED') return project.status === 'COMPLETED' || project.status === 'ARCHIVED'
  return isExplicitReusableProject(project)
}

export function visibleLifecycleProjects(state: ProjectLibraryState, filter: ProjectWorkspaceFilter): ProjectRecord[] {
  return state.projects.filter((project) => projectMatchesWorkspaceFilter(project, filter))
}

export function summarizeProjectLibrary(state: ProjectLibraryState): ProjectWorkspaceSummaryCounts {
  return {
    active: state.projects.filter((project) => project.status === 'DRAFT' || project.status === 'ACTIVE').length,
    review: state.projects.filter((project) => project.status === 'NEEDS_REVIEW').length,
    completed: state.projects.filter((project) => project.status === 'COMPLETED' || project.status === 'ARCHIVED').length,
    templates: state.projects.filter(isExplicitReusableProject).length,
  }
}

export function projectStatusLabel(project: ProjectRecord): string {
  const labels: Record<ProjectRecord['status'], string> = {
    DRAFT: 'Чернова',
    ACTIVE: 'Активен',
    NEEDS_REVIEW: 'За преглед',
    COMPLETED: 'Завършен',
    ARCHIVED: 'Архивиран',
  }
  return labels[project.status]
}

export function projectJobTypeLabel(jobType: FacadeFlowJobType | null): string {
  if (!jobType) return 'Типът не е зададен'
  return PROJECT_JOB_TYPE_OPTIONS.find((option) => option.value === jobType)?.label ?? jobType
}
