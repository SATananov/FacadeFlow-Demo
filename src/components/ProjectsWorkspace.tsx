import { useState, type FormEvent } from 'react'
import type { FacadeFlowJobType } from '../aiWorkspaceTypes'
import { addProjectToLibrary, createProjectRecord, selectProjectInLibrary, type ProjectLibraryState } from '../projectLifecycle'
import { applyProjectLifecycleAction, confirmProjectReviewInLibrary, selectedProjectRecord, type ProjectLifecycleAction } from '../projectLifecycleActions'
import {
  PROJECT_JOB_TYPE_OPTIONS,
  projectBlockerLabel,
  projectJobTypeLabel,
  projectStatusLabel,
  summarizeProjectLibrary,
  visibleLifecycleProjects,
  type ProjectWorkspaceFilter,
} from '../projectWorkspaceModel'
import type { CatalogueProfile } from '../profileCatalogueTypes'
import { FacadeFlowIcon } from './FacadeFlowIcons'
import { FacadeFlowWorkspaceHeader } from './FacadeFlowWorkspaceHeader'
import { ProjectSourceEvidence } from './ProjectSourceEvidence'
import { ProjectDetailPanel } from './ProjectDetailPanel'

const filters: Array<{ id: ProjectWorkspaceFilter; label: string }> = [
  { id: 'ALL', label: 'Всички' },
  { id: 'SOURCES', label: 'Източници' },
  { id: 'ACTIVE', label: 'Активни' },
  { id: 'REVIEW', label: 'За преглед' },
  { id: 'COMPLETED', label: 'Завършени' },
  { id: 'TEMPLATES', label: 'Шаблони' },
]

const emptyCopy: Record<Exclude<ProjectWorkspaceFilter, 'SOURCES'>, { title: string; body: string }> = {
  ALL: { title: 'Все още няма проекти с жизнен цикъл', body: 'Създай първия проект само за текущата сесия. Записите от реални източници остават отделни и не се копират автоматично в него.' },
  ACTIVE: { title: 'Няма активни проекти', body: 'Новите чернови и активните проектни задачи ще се показват тук.' },
  REVIEW: { title: 'Няма проекти за преглед', body: 'Проекти, които чакат човешка проверка или решение, ще бъдат отделени тук.' },
  COMPLETED: { title: 'Няма завършени проекти', body: 'Завършените проекти ще останат исторически записи и няма автоматично да стават шаблони.' },
  TEMPLATES: { title: 'Няма шаблони', body: 'Само изрично избрани и почистени проекти или изделия ще могат да се използват като шаблон.' },
}

interface Props {
  profiles: CatalogueProfile[]
  projectLibrary: ProjectLibraryState
  onProjectLibrary: (state: ProjectLibraryState) => void
  onProfiles: (profiles: CatalogueProfile[], changedProfileId?: string) => boolean
  onOpenCatalogue: () => void
  onClose: () => void
}

export function ProjectsWorkspace({ profiles, projectLibrary, onProjectLibrary, onProfiles, onOpenCatalogue, onClose }: Props) {
  const [filter, setFilter] = useState<ProjectWorkspaceFilter>('ALL')
  const [showNewProject, setShowNewProject] = useState(false)
  const [name, setName] = useState('')
  const [reference, setReference] = useState('')
  const [jobType, setJobType] = useState<FacadeFlowJobType | ''>('')
  const [creationBlockers, setCreationBlockers] = useState<string[]>([])
  const [detailBlockers, setDetailBlockers] = useState<string[]>([])
  const summary = summarizeProjectLibrary(projectLibrary)
  const lifecycleProjects = visibleLifecycleProjects(projectLibrary, filter)
  const selectedProject = selectedProjectRecord(projectLibrary)
  const showSources = filter === 'ALL' || filter === 'SOURCES'
  const showLifecycle = filter !== 'SOURCES'
  const empty = filter === 'SOURCES' || lifecycleProjects.length > 0 ? null : emptyCopy[filter]
  const summaries = [
    { id: 'SOURCES', count: 2, label: 'Източници', hint: 'Записи от реални източници', icon: 'import' as const },
    { id: 'ACTIVE', count: summary.active, label: 'Активни', hint: 'Чернови и текущи задачи', icon: 'documents' as const },
    { id: 'REVIEW', count: summary.review, label: 'За преглед', hint: 'Чакат човешко решение', icon: 'help' as const },
    { id: 'COMPLETED', count: summary.completed, label: 'Завършени', hint: 'Исторически проекти', icon: 'building' as const },
    { id: 'TEMPLATES', count: summary.templates, label: 'Шаблони', hint: 'Изрично разрешени за повторна употреба', icon: 'catalogue' as const },
  ]

  const resetCreation = () => {
    setName('')
    setReference('')
    setJobType('')
    setCreationBlockers([])
  }

  const closeCreation = () => {
    resetCreation()
    setShowNewProject(false)
  }

  const submitProject = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const now = new Date().toISOString()
    const creation = createProjectRecord({
      id: crypto.randomUUID(),
      name,
      reference,
      jobType: jobType || null,
      now,
    })
    if (!creation.project) {
      setCreationBlockers(creation.blockers)
      return
    }
    const added = addProjectToLibrary(projectLibrary, creation.project)
    if (!added.changed) {
      setCreationBlockers(added.blockers)
      return
    }
    onProjectLibrary(added.state)
    setDetailBlockers([])
    setFilter('ALL')
    closeCreation()
  }

  const selectProject = (projectId: string) => {
    const selected = selectProjectInLibrary(projectLibrary, projectId)
    setDetailBlockers(selected.blockers)
    if (selected.changed) onProjectLibrary(selected.state)
  }

  const closeProjectDetail = () => {
    const selected = selectProjectInLibrary(projectLibrary, null)
    setDetailBlockers(selected.blockers)
    if (selected.changed) onProjectLibrary(selected.state)
  }

  const runLifecycleAction = (action: ProjectLifecycleAction) => {
    if (!selectedProject) return
    const result = applyProjectLifecycleAction(projectLibrary, selectedProject.id, action, new Date().toISOString())
    setDetailBlockers(result.blockers)
    if (result.changed) onProjectLibrary(result.state)
  }

  const confirmHumanReview = (reviewedBy: string, note: string) => {
    if (!selectedProject) return
    const result = confirmProjectReviewInLibrary(projectLibrary, selectedProject.id, { reviewedBy, note, now: new Date().toISOString() })
    setDetailBlockers(result.blockers)
    if (result.changed) onProjectLibrary(result.state)
  }

  return <section className="projects-workspace ff-section-workspace" aria-labelledby="projects-title">
    <FacadeFlowWorkspaceHeader
      titleId="projects-title"
      icon="projects"
      eyebrow="Проектна библиотека"
      title="Проекти"
      subtitle="Проекти само за текущата сесия и отделни данни от реални източници · без автоматична повторна употреба."
      onBack={onClose}
      actions={<><button type="button" className="projects-open-catalogue" onClick={onOpenCatalogue}>Отвори каталог</button><button type="button" className="projects-new-project-action" onClick={() => { setCreationBlockers([]); setShowNewProject((value) => !value) }}>{showNewProject ? 'Затвори формата' : '+ Нов проект'}</button></>}
    />
    <div className="ff-workspace-safety projects-foundation-note">
      PROJECT01.3 · САМО В ТЕКУЩАТА СЕСИЯ — Няма сървър / база, постоянно записване, AI търсене по сходство, автоматично копиране или производствено отключване. Детайлът на проекта и действията по жизнения цикъл не дават производствено одобрение.
    </div>
    <div className="ff-workspace-body projects-workspace-body">
      <div className="projects-content">
        {showNewProject && <form className="projects-new-project-panel" onSubmit={submitProject} aria-labelledby="projects-new-title">
          <div className="projects-new-project-heading">
            <div><span className="projects-kicker">PROJECT01.2 · САМО В ТЕКУЩАТА СЕСИЯ</span><h3 id="projects-new-title">Нов проект</h3><p>Въведи само известните данни. Типът може да остане нерешен; FacadeFlow няма да го отгатва.</p></div>
            <button type="button" onClick={closeCreation}>Отказ</button>
          </div>
          <div className="projects-new-project-fields">
            <label><span>Име на проекта *</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="напр. Къща Иванови" autoFocus /></label>
            <label><span>Референция *</span><input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="напр. PRJ-2026-001" /></label>
            <label><span>Тип</span><select value={jobType} onChange={(event) => setJobType(event.target.value as FacadeFlowJobType | '')}><option value="">Не е зададен</option>{PROJECT_JOB_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          </div>
          {creationBlockers.length > 0 && <div className="projects-new-project-errors" role="alert"><b>Проектът не е създаден:</b><ul>{creationBlockers.map((blocker) => <li key={blocker}>{projectBlockerLabel(blocker)}</li>)}</ul></div>}
          <div className="projects-new-project-footer"><span>ЧЕРНОВА · само в текущата сесия · без запис в сървър / база</span><button type="submit">Създай проект</button></div>
        </form>}

        <section className="projects-intro" aria-labelledby="projects-library-title">
          <div>
            <span className="projects-kicker">БИБЛИОТЕКА НА ПРОЕКТИТЕ</span>
            <h3 id="projects-library-title">Библиотека на проектите</h3>
            <p>Записите от жизнения цикъл са само за текущата сесия. Проектният контекст от реални източници остава в отделна зона и не се превръща автоматично в проект.</p>
          </div>
          <div className="projects-rule-chip"><b>Правило</b><span>Подобен ≠ валиден</span></div>
        </section>

        <section className="projects-summary-grid" aria-label="Обобщение на проектите">
          {summaries.map((item) => <article key={item.id} className={`projects-summary-card ${item.id === 'SOURCES' ? 'source' : ''}`}>
            <span className="projects-summary-icon"><FacadeFlowIcon name={item.icon}/></span>
            <div><strong>{item.count}</strong><b>{item.label}</b><small>{item.hint}</small></div>
          </article>)}
        </section>

        <section className="projects-library-panel" aria-label="Списък с проекти">
          <div className="projects-tabs" role="tablist" aria-label="Филтър на проектите">
            {filters.map((item) => <button key={item.id} type="button" role="tab" aria-selected={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}</button>)}
          </div>

          {showLifecycle && lifecycleProjects.length > 0 && <div className="projects-lifecycle-region" aria-label="Проекти с жизнен цикъл">
            {lifecycleProjects.map((item) => {
              const selected = projectLibrary.selectedProjectId === item.id
              return <article key={item.id} className={`projects-lifecycle-card ${selected ? 'selected' : ''}`}>
                <div className="projects-lifecycle-card-main">
                  <div className="projects-lifecycle-title-row"><span className={`projects-lifecycle-status status-${item.status.toLowerCase()}`}>{projectStatusLabel(item)}</span>{selected && <span className="projects-selected-chip">Активен в сесията</span>}</div>
                  <h4>{item.name}</h4>
                  <p><b>{item.reference}</b><span>{projectJobTypeLabel(item.jobType)}</span></p>
                </div>
                <div className="projects-lifecycle-meta"><span>Продукти <b>{item.productLinks.length}</b></span><span>Източници <b>{item.sourceLinks.length}</b></span><small>Създаден {item.createdAt.slice(0, 10)}</small></div>
                <button type="button" aria-pressed={selected} onClick={() => selectProject(item.id)}>{selected ? 'Избран проект' : 'Избери проект'}</button>
              </article>
            })}
          </div>}

          {selectedProject && <ProjectDetailPanel
            key={`${selectedProject.id}:${selectedProject.status}:${selectedProject.review.reviewedAt ?? 'none'}`}
            project={selectedProject}
            blockers={detailBlockers}
            onLifecycleAction={runLifecycleAction}
            onConfirmReview={confirmHumanReview}
            onClose={closeProjectDetail}
          />}

          {showSources && <div className="projects-source-region"><ProjectSourceEvidence profiles={profiles} onProfiles={onProfiles} onOpenCatalogue={onOpenCatalogue}/></div>}
          {empty && <div className={`projects-empty-state ${showSources ? 'compact' : ''}`} role="status">
            <span className="projects-empty-symbol"><FacadeFlowIcon name="projects"/></span>
            <h4>{empty.title}</h4>
            <p>{empty.body}</p>
            <small>Няма създадени данни и нищо не се записва извън текущата сесия.</small>
          </div>}
        </section>

        <section className="projects-policy" aria-labelledby="projects-policy-title">
          <div>
            <span className="projects-kicker">БЕЗОПАСНА ПОВТОРНА УПОТРЕБА</span>
            <h3 id="projects-policy-title">Завършен проект ≠ автоматичен шаблон</h3>
          </div>
          <ol>
            <li><b>Завършен</b><span>Исторически проект, запазен като извършена работа.</span></li>
            <li><b>Шаблон</b><span>Само изрично одобрен пример за повторна употреба без скрито пренасяне на специфични решения.</span></li>
            <li><b>Бъдещо AI търсене по сходство</b><span>Ще предлага сходни проекти за сравнение; човекът ще решава дали да ги използва.</span></li>
          </ol>
        </section>
      </div>
    </div>
  </section>
}
