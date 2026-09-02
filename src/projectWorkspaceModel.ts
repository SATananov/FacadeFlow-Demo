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

const PROJECT_BLOCKER_LABELS: Readonly<Record<string, string>> = {
  'Project id is required.': 'Липсва идентификатор на проекта.',
  'Project name is required.': 'Името на проекта е задължително.',
  'Project reference is required.': 'Референцията на проекта е задължителна.',
  'Project timestamp is required.': 'Липсва дата и час на проекта.',
  'Human project review is required before completion.': 'Преди завършване е необходим потвърден човешки преглед.',
  'Project must be in NEEDS_REVIEW before human review can be confirmed.': 'Човешки преглед може да се потвърди само когато проектът е със статус „За преглед“.',
  'Human reviewer is required.': 'Трябва да бъде посочен човекът, извършил прегледа.',
  'Source link id, sourceId and label are required.': 'За връзката към източник са необходими идентификатор и име.',
  'Source link already exists.': 'Този източник вече е свързан с проекта.',
  'Product id is required.': 'Липсва идентификатор на изделието.',
  'Product is already linked to this project.': 'Това изделие вече е свързано с проекта.',
  'Only a completed project can receive a reusable-template decision.': 'Решение за повторна употреба може да се вземе само за завършен проект.',
  'Human-confirmed project review is required before reusable-template review.': 'Преди решение за повторна употреба е необходим човешки потвърден преглед на проекта.',
  'Human reuse reviewer is required.': 'Трябва да бъде посочен човекът, взел решението за повторна употреба.',
  'Project id and reference must be unique in the session library.': 'Референцията на проекта трябва да е уникална в текущата сесия.',
  'Project reference must remain unique in the session library.': 'Референцията на проекта трябва да остане уникална в текущата сесия.',
  'Project does not exist in the session library.': 'Проектът не съществува в текущата сесия.',
}

const ACTION_LABELS: Readonly<Record<string, string>> = {
  START_WORK: 'Стартирането на проекта',
  REQUEST_REVIEW: 'Изпращането за преглед',
  RETURN_TO_ACTIVE: 'Връщането за редакция',
  COMPLETE: 'Завършването на проекта',
}

const STATUS_LABELS: Readonly<Record<string, string>> = {
  DRAFT: '„Чернова“',
  ACTIVE: '„Активен“',
  NEEDS_REVIEW: '„За преглед“',
  COMPLETED: '„Завършен“',
  ARCHIVED: '„Архивиран“',
}

export function projectBlockerLabel(blocker: string): string {
  const known = PROJECT_BLOCKER_LABELS[blocker]
  if (known) return known
  const transition = blocker.match(/^Action ([A-Z_]+) requires project status ([A-Z_]+)\.$/)
  if (!transition) return blocker
  const action = ACTION_LABELS[transition[1]] ?? 'Това действие'
  const status = STATUS_LABELS[transition[2]] ?? transition[2]
  return `${action} е позволено само при статус ${status}.`
}
