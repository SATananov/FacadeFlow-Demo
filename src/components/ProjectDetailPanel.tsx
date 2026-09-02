import { useState, type FormEvent } from 'react'
import type { ProjectLifecycleAction } from '../projectLifecycleActions'
import type { ProjectRecord } from '../projectLifecycle'
import { projectBlockerLabel, projectJobTypeLabel, projectStatusLabel } from '../projectWorkspaceModel'

interface Props {
  project: ProjectRecord
  blockers: string[]
  onLifecycleAction: (action: ProjectLifecycleAction) => void
  onConfirmReview: (reviewedBy: string, note: string) => void
  onClose: () => void
}

function reviewStatusLabel(project: ProjectRecord): string {
  if (project.review.status === 'HUMAN_CONFIRMED') return 'Потвърден от човек'
  if (project.review.status === 'NEEDS_REVIEW') return 'Очаква човешки преглед'
  return 'Не е прегледан'
}

function reuseStatusLabel(project: ProjectRecord): string {
  if (project.reuse.status === 'APPROVED') return 'Изрично одобрен пример за повторна употреба'
  if (project.reuse.status === 'REJECTED') return 'Отхвърлен за повторна употреба'
  return 'Няма решение за повторна употреба'
}

export function ProjectDetailPanel({ project, blockers, onLifecycleAction, onConfirmReview, onClose }: Props) {
  const [reviewedBy, setReviewedBy] = useState('')
  const [reviewNote, setReviewNote] = useState('')

  const confirmReview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onConfirmReview(reviewedBy, reviewNote)
  }

  return <section className="projects-detail-panel" aria-labelledby="projects-detail-title">
    <div className="projects-detail-header">
      <div>
        <span className="projects-kicker">PROJECT01.3 · ДЕТАЙЛ НА ПРОЕКТА</span>
        <div className="projects-detail-title-row">
          <span className={`projects-lifecycle-status status-${project.status.toLowerCase()}`}>{projectStatusLabel(project)}</span>
          <h3 id="projects-detail-title">{project.name}</h3>
        </div>
        <p><b>{project.reference}</b><span>{projectJobTypeLabel(project.jobType)}</span></p>
      </div>
      <button type="button" className="projects-detail-close" onClick={onClose}>Затвори детайла</button>
    </div>

    <div className="projects-detail-safety" role="note">
      <b>Жизненият цикъл е само за текущата сесия.</b> Статусът на проекта не дава инженерно, машинно или производствено одобрение.
    </div>

    <div className="projects-detail-grid">
      <article><small>Жизнен цикъл</small><strong>{projectStatusLabel(project)}</strong><span>Обновен {project.updatedAt.slice(0, 10)}</span></article>
      <article><small>Човешки преглед</small><strong>{reviewStatusLabel(project)}</strong><span>{project.review.reviewedBy ? `От: ${project.review.reviewedBy}` : 'Няма потвърден проверяващ'}</span></article>
      <article><small>Съдържание</small><strong>{project.productLinks.length} изделия · {project.sourceLinks.length} източници</strong><span>Нищо не се добавя автоматично</span></article>
      <article><small>Повторна употреба</small><strong>{reuseStatusLabel(project)}</strong><span>Автоматична повторна употреба: не</span></article>
    </div>

    <div className="projects-detail-boundaries" aria-label="Граници за безопасност на проекта">
      <span>Само в текущата сесия: да</span><span>Запис в сървър / база: не</span><span>Готов за машина: не</span><span>Производствено одобрен: не</span>
    </div>

    {blockers.length > 0 && <div className="projects-detail-errors" role="alert"><b>Действието е блокирано:</b><ul>{blockers.map((blocker) => <li key={blocker}>{projectBlockerLabel(blocker)}</li>)}</ul></div>}

    <div className="projects-detail-actions">
      {project.status === 'DRAFT' && <div className="projects-detail-action-card"><div><b>Започване на работа</b><p>Черновата става „Активен“ само след изрично действие.</p></div><button type="button" className="primary" onClick={() => onLifecycleAction('START_WORK')}>Стартирай проект</button></div>}

      {project.status === 'ACTIVE' && <div className="projects-detail-action-card"><div><b>Подготовка за преглед</b><p>Изпращането за преглед не потвърждава проекта и не го завършва.</p></div><button type="button" className="primary" onClick={() => onLifecycleAction('REQUEST_REVIEW')}>Изпрати за човешки преглед</button></div>}

      {project.status === 'NEEDS_REVIEW' && <>
        {project.review.status !== 'HUMAN_CONFIRMED' && <form className="projects-review-form" onSubmit={confirmReview}>
          <div><b>Човешко потвърждение</b><p>Проверяващият трябва да бъде въведен изрично. FacadeFlow не попълва име и не приема преглед автоматично.</p></div>
          <label><span>Проверил *</span><input value={reviewedBy} onChange={(event) => setReviewedBy(event.target.value)} placeholder="Име на човека" /></label>
          <label><span>Бележка</span><textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="По избор" rows={2} /></label>
          <button type="submit" className="primary">Потвърди човешкия преглед</button>
        </form>}
        {project.review.status === 'HUMAN_CONFIRMED' && <div className="projects-review-confirmed"><div><b>Прегледът е потвърден</b><p>{project.review.reviewedBy} · {project.review.reviewedAt?.slice(0, 10)}{project.review.note ? ` · ${project.review.note}` : ''}</p></div><button type="button" className="primary" onClick={() => onLifecycleAction('COMPLETE')}>Завърши проект</button></div>}
        <div className="projects-detail-action-card secondary"><div><b>Нужни са корекции?</b><p>Връщането към „Активен“ анулира текущото потвърждение от човешкия преглед.</p></div><button type="button" onClick={() => onLifecycleAction('RETURN_TO_ACTIVE')}>Върни за редакция</button></div>
      </>}

      {project.status === 'COMPLETED' && <div className="projects-detail-completed"><b>Проектът е завършен.</b><p>Това е исторически статус от жизнения цикъл. Той не превръща проекта автоматично в шаблон и не разрешава производствено изпълнение.</p></div>}

      {project.status === 'ARCHIVED' && <div className="projects-detail-completed"><b>Проектът е архивиран.</b><p>PROJECT01.3 не предоставя автоматично възстановяване, повторна употреба или производствено действие.</p></div>}
    </div>
  </section>
}
