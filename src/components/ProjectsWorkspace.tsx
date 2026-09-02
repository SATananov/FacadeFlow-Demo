import { useState } from 'react'
import type { CatalogueProfile } from '../profileCatalogueTypes'
import { FacadeFlowIcon } from './FacadeFlowIcons'
import { FacadeFlowWorkspaceHeader } from './FacadeFlowWorkspaceHeader'
import { ProjectSourceEvidence } from './ProjectSourceEvidence'

type ProjectFilter = 'ALL' | 'SOURCES' | 'ACTIVE' | 'REVIEW' | 'COMPLETED' | 'TEMPLATES'

const filters: Array<{ id: ProjectFilter; label: string }> = [
  { id: 'ALL', label: 'Всички' },
  { id: 'SOURCES', label: 'Източници' },
  { id: 'ACTIVE', label: 'Активни' },
  { id: 'REVIEW', label: 'За преглед' },
  { id: 'COMPLETED', label: 'Завършени' },
  { id: 'TEMPLATES', label: 'Шаблони' },
]

const summaries = [
  { id: 'SOURCES', count: 2, label: 'Източници', hint: 'Реални source-backed записи', icon: 'import' as const },
  { id: 'ACTIVE', count: 0, label: 'Активни', hint: 'Текущи задачи', icon: 'documents' as const },
  { id: 'REVIEW', count: 0, label: 'За преглед', hint: 'Чакат човешко решение', icon: 'help' as const },
  { id: 'COMPLETED', count: 0, label: 'Завършени', hint: 'Исторически проекти', icon: 'building' as const },
  { id: 'TEMPLATES', count: 0, label: 'Шаблони', hint: 'Изрично разрешени за повторна употреба', icon: 'catalogue' as const },
]

const emptyCopy: Record<Exclude<ProjectFilter, 'SOURCES'>, { title: string; body: string }> = {
  ALL: { title: 'Все още няма lifecycle проекти', body: 'PROJECT01 ще добави жизнен цикъл за нови, активни, преглеждани и завършени проекти. Реалните source-backed записи вече са видими по-долу.' },
  ACTIVE: { title: 'Няма активни проекти', body: 'Тук ще се показват текущите проектни задачи и техният статус.' },
  REVIEW: { title: 'Няма проекти за преглед', body: 'Проекти, които чакат човешка проверка или решение, ще бъдат отделени тук.' },
  COMPLETED: { title: 'Няма завършени проекти', body: 'Завършените проекти ще останат исторически записи и няма автоматично да стават шаблони.' },
  TEMPLATES: { title: 'Няма шаблони', body: 'Само изрично избрани и почистени проекти или изделия ще могат да се използват като шаблон.' },
}

interface Props {
  profiles: CatalogueProfile[]
  onProfiles: (profiles: CatalogueProfile[], changedProfileId?: string) => boolean
  onOpenCatalogue: () => void
  onClose: () => void
}

export function ProjectsWorkspace({ profiles, onProfiles, onOpenCatalogue, onClose }: Props) {
  const [filter, setFilter] = useState<ProjectFilter>('ALL')
  const showSources = filter === 'ALL' || filter === 'SOURCES'
  const empty = filter === 'SOURCES' ? null : emptyCopy[filter]

  return <section className="projects-workspace ff-section-workspace" aria-labelledby="projects-title">
    <FacadeFlowWorkspaceHeader
      titleId="projects-title"
      icon="projects"
      eyebrow="Проектна библиотека"
      title="Проекти"
      subtitle="Проектен контекст, source evidence, бъдещ lifecycle и reusable templates · без автоматична повторна употреба."
      onBack={onClose}
      actions={<><button type="button" className="projects-open-catalogue" onClick={onOpenCatalogue}>Отвори каталог</button><button type="button" disabled title="Създаването на проект ще бъде активирано в PROJECT01.">+ Нов проект</button></>}
    />
    <div className="ff-workspace-safety projects-foundation-note">
      UI01 FOUNDATION — source evidence се преглежда тук. Няма backend, записване, AI similarity, автоматично копиране или production unlock.
    </div>
    <div className="ff-workspace-body projects-workspace-body">
      <div className="projects-content">
        <section className="projects-intro" aria-labelledby="projects-library-title">
          <div>
            <span className="projects-kicker">PROJECT LIBRARY</span>
            <h3 id="projects-library-title">Библиотека на проектите</h3>
            <p>Едно място за source-backed проектен контекст, текуща работа, човешки преглед, история и бъдещи reusable templates.</p>
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
          {showSources && <div className="projects-source-region"><ProjectSourceEvidence profiles={profiles} onProfiles={onProfiles} onOpenCatalogue={onOpenCatalogue}/></div>}
          {empty && <div className={`projects-empty-state ${showSources ? 'compact' : ''}`} role="status">
            <span className="projects-empty-symbol"><FacadeFlowIcon name="projects"/></span>
            <h4>{empty.title}</h4>
            <p>{empty.body}</p>
            <small>Няма създадени данни и нищо не се записва в тази фаза.</small>
          </div>}
        </section>

        <section className="projects-policy" aria-labelledby="projects-policy-title">
          <div>
            <span className="projects-kicker">SAFE REUSE FOUNDATION</span>
            <h3 id="projects-policy-title">Завършен проект ≠ автоматичен шаблон</h3>
          </div>
          <ol>
            <li><b>Завършен</b><span>Исторически проект, запазен като извършена работа.</span></li>
            <li><b>Шаблон</b><span>Само изрично одобрен reusable пример без скрито пренасяне на специфични решения.</span></li>
            <li><b>Бъдещ AI similarity</b><span>Ще предлага сходни проекти за сравнение; човекът ще решава дали да ги използва.</span></li>
          </ol>
        </section>
      </div>
    </div>
  </section>
}
