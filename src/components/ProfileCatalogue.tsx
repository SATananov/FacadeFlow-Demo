import { useMemo, useState } from 'react'
import { catalogueExport, catalogueProfileIsDemonstration, catalogueProfileIsReal, catalogueProfileIsSelectable, duplicateCatalogueProfile, profileStatusLabels, roleLabels } from '../profileCatalogueState'
import type { ActiveProfileSelection, CatalogueProfile, ProfileCatalogueFilters, ProfileRole } from '../profileCatalogueTypes'
import { catalogueHasRequiredRoles, validateCatalogueProfile } from '../profileCatalogueValidation'
import { ContextHelp } from './ContextHelp'
import { ProfileEditor } from './ProfileEditor'
import { FacadeFlowWorkspaceHeader } from './FacadeFlowWorkspaceHeader'

interface Props {
  profiles: CatalogueProfile[]
  selection: ActiveProfileSelection
  onProfiles: (profiles: CatalogueProfile[], changedProfileId?: string) => boolean
  onSelection: (selection: ActiveProfileSelection) => void
  onOpenProjects: () => void
  onClose: () => void
}

const blankProfile = (): CatalogueProfile => {
  const now = new Date().toISOString()
  return { id: crypto.randomUUID(), role: 'FRAME', system: '', code: '', nameBg: '', dimensionA: 1, dimensionB: 1, status: 'DEMONSTRATION', createdAt: now, updatedAt: now, simulationOnly: true, requiresHumanApproval: true }
}

export function ProfileCatalogue({ profiles, selection, onProfiles, onSelection, onOpenProjects, onClose }: Props) {
  const [filters, setFilters] = useState<ProfileCatalogueFilters>({ role: 'ALL', system: '', status: 'ALL' })
  const [editing, setEditing] = useState<CatalogueProfile | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const visible = useMemo(() => profiles.filter((item) => (filters.role === 'ALL' || item.role === filters.role) && (filters.status === 'ALL' || item.status === filters.status) && (!filters.system || item.system.toLocaleLowerCase('bg').includes(filters.system.toLocaleLowerCase('bg')))), [profiles, filters])
  const visibleReal = visible.filter((item) => item.status !== 'ARCHIVED' && catalogueProfileIsReal(item))
  const visibleDemo = visible.filter((item) => item.status !== 'ARCHIVED' && catalogueProfileIsDemonstration(item))
  const visibleArchived = visible.filter((item) => item.status === 'ARCHIVED')
  const save = (candidate = editing) => {
    if (!candidate) return
    const result = validateCatalogueProfile(candidate, profiles)
    setErrors(result.errors)
    if (!result.valid) return
    if (!onProfiles(profiles.some(({ id }) => id === candidate.id) ? profiles.map((item) => item.id === candidate.id ? candidate : item) : [...profiles, candidate], candidate.id)) return
    setEditing(null)
  }
  const setActive = (role: ProfileRole, id: string) => {
    const item = profiles.find((profile) => profile.id === id)
    if (!item || !catalogueProfileIsSelectable(item)) return
    onSelection({ ...selection, [role]: id })
  }
  const startManualProfile = () => { setEditing(blankProfile()); setErrors([]) }
  const editCatalogueProfile = (profile: CatalogueProfile) => { setEditing({ ...profile }); setErrors([]) }
  const duplicateProfile = (profile: CatalogueProfile) => { const now = new Date().toISOString(); setEditing(duplicateCatalogueProfile(profile, crypto.randomUUID(), now)); setErrors([]) }

  return <div className="preview-overlay catalogue-overlay ff-section-workspace"><section className="catalogue-modal" role="dialog" aria-modal="true" aria-labelledby="catalogue-title">
    <FacadeFlowWorkspaceHeader
      titleId="catalogue-title"
      icon="catalogue"
      eyebrow="Данни и каталози"
      title="Каталог на профилите"
      subtitle="Нормализирани профилни записи · project/source evidence се преглежда в секция Проекти."
      onBack={onClose}
      actions={<button type="button" onClick={onOpenProjects}>Отвори Проекти</button>}
    />
    <div className="catalogue-workspace-content">
      <div className="catalogue-warning" role="note"><b>Размер A / Размер B — временни наименования.</b> Наименованията и технологичното значение на Размер A и Размер B предстоят за потвърждение от технолог. <ContextHelp helpId="profile-dimensions"/></div>
      <section className="catalogue-source-routing" aria-label="Project source routing">
        <div><span>PROJECT / SOURCE CONTEXT</span><b>Суровите проектни данни са в „Проекти“</b><small>Тук остават само нормализирани каталожни записи. Source evidence не означава каталожно или производствено одобрение.</small></div>
        <button type="button" onClick={onOpenProjects}>Отвори Проекти</button>
      </section>
      {!catalogueHasRequiredRoles(profiles) && <div className="inline-errors" role="alert">Необходим е поне един активен профил за каса, крило и делител.</div>}
      <section className="catalogue-kind-summary" aria-label="Разделение на реален и демонстрационен каталог"><div className="real"><span>РЕАЛЕН КАТАЛОГ</span><b>{visibleReal.length}</b><small>Само HUMAN CONFIRMED source evidence / експертни записи могат да бъдат активни.</small></div><div className="demo"><span>ДЕМО КАТАЛОГ</span><b>{visibleDemo.length}</b><small>Placeholder данни само за ДЕМО и тестове. Не заместват реалните профили.</small></div></section>
      <div className="catalogue-toolbar"><button className="primary catalogue-add-manual" onClick={startManualProfile}>+ Добави ръчен профил</button><label>Роля<select value={filters.role} onChange={(event) => setFilters({ ...filters, role: event.target.value as ProfileCatalogueFilters['role'] })}><option value="ALL">Всички</option>{Object.entries(roleLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label><label>Система<input value={filters.system} onChange={(event) => setFilters({ ...filters, system: event.target.value })}/></label><label>Статус<select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value as ProfileCatalogueFilters['status'] })}><option value="ALL">Всички</option>{Object.entries(profileStatusLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label><button onClick={() => catalogueExport(profiles)}>Експортирай симулационен каталог</button></div>
      <div className={`catalogue-content ${editing ? 'has-editor' : 'catalogue-only'}`}>
        <div className="catalogue-list catalogue-grouped-list">
          <CatalogueGroup kind="real" title="РЕАЛЕН КАТАЛОГ · НОРМАЛИЗИРАНИ" note="HUMAN CONFIRMED / експертни профили за нормалния продуктов избор" items={visibleReal} emptyText="Няма HUMAN CONFIRMED реални профили." selection={selection} setActive={setActive} editProfile={editCatalogueProfile} duplicateProfile={duplicateProfile} profiles={profiles} onProfiles={onProfiles} onOpenProjects={onOpenProjects}/>
          <CatalogueGroup kind="demo" title="ДЕМО КАТАЛОГ · САМО ЗА ТЕСТ" note="Placeholder профили — зареждат се само от ДЕМО preset" items={visibleDemo} emptyText="Няма демонстрационни профили." selection={selection} setActive={setActive} editProfile={editCatalogueProfile} duplicateProfile={duplicateProfile} profiles={profiles} onProfiles={onProfiles} onOpenProjects={onOpenProjects}/>
          {visibleArchived.length > 0 && <CatalogueGroup kind="archive" title="АРХИВ" note="Не участва в изборите" items={visibleArchived} emptyText="" selection={selection} setActive={setActive} editProfile={editCatalogueProfile} duplicateProfile={duplicateProfile} profiles={profiles} onProfiles={onProfiles} onOpenProjects={onOpenProjects}/>}
        </div>
        {editing && <aside className="catalogue-manual-editor-shell" aria-label="Ръчно добавяне или редактиране на профил"><div className="catalogue-manual-editor-head"><div><span>{editing.sourceEvidenceId ? 'НОРМАЛИЗИРАН SOURCE ЗАПИС' : 'РЪЧЕН КАТАЛОЖЕН ЗАПИС'}</span><b>{editing.code || 'Нов профил'}</b></div><button type="button" onClick={() => setEditing(null)}>Затвори</button></div><ProfileEditor value={editing} errors={errors} onChange={setEditing} onSave={save} onCancel={() => setEditing(null)}/></aside>}
      </div>
    </div>
  </section></div>
}

function CatalogueGroup({ kind, title, note, items, emptyText, selection, setActive, editProfile, duplicateProfile, profiles, onProfiles, onOpenProjects }: { kind: 'real' | 'demo' | 'archive'; title: string; note: string; items: CatalogueProfile[]; emptyText: string; selection: ActiveProfileSelection; setActive: (role: ProfileRole, id: string) => void; editProfile: (value: CatalogueProfile) => void; duplicateProfile: (value: CatalogueProfile) => void; profiles: CatalogueProfile[]; onProfiles: (profiles: CatalogueProfile[], changedProfileId?: string) => boolean; onOpenProjects: () => void }) {
  return <section className={`catalogue-profile-group ${kind}`}><header><div><b>{title}</b><small>{note}</small></div><span>{items.length}</span></header>{items.length === 0 ? <p className="catalogue-profile-group-empty">{emptyText}</p> : items.map((item) => <article key={item.id} className={item.status === 'ARCHIVED' ? 'archived' : ''}><div><span className="context-badge">{roleLabels[item.role]}</span><span className="catalogue-status-badge">{item.status === 'ARCHIVED' ? 'Архивиран' : 'Активен'}</span><b>{item.code} — {item.nameBg}</b><small>{item.system} · Размер A {item.dimensionA} mm · Размер B {item.dimensionB} mm</small><small>{profileStatusLabels[item.status]} · {item.description}</small>{item.sourceEvidenceLabel && <small className="catalogue-profile-provenance"><b>Източник:</b> {item.sourceEvidenceLabel}</small>}{item.status === 'DEMONSTRATION' && <strong>ДЕМО ONLY · placeholder стойности — не са реални каталожни данни.</strong>}{item.status === 'SOURCE_EVIDENCE' && <strong>{item.humanRoleReviewStatus === 'HUMAN_CONFIRMED' ? `Реален source evidence · HUMAN CONFIRMED роля от ${item.humanRoleConfirmedBy}. Експертната проверка остава отделна.` : 'Реален source evidence · HUMAN REVIEW REQUIRED.'}</strong>}</div><div className="catalogue-actions">{kind === 'real' ? <label>{selection[item.role] === item.id ? 'Основен реален профил' : 'Задай като основен реален'}<input type="radio" name={`active-${item.role}`} checked={selection[item.role] === item.id} disabled={!catalogueProfileIsSelectable(item)} onChange={() => setActive(item.role, item.id)}/></label> : kind === 'demo' ? <div className="catalogue-demo-state" role="note"><b>ДЕМО ПО ПОДРАЗБИРАНЕ</b><small>Само за ДЕМО preset · не участва в нормалния продуктов избор.</small></div> : <div className="catalogue-archive-state">АРХИВИРАН · не участва в изборите</div>}{item.sourceEvidenceId ? <button type="button" onClick={onOpenProjects}>Отвори проект</button> : <button onClick={() => editProfile(item)}>Редактирай</button>}<button onClick={() => duplicateProfile(item)}>Дублирай</button><button onClick={() => { const nextStatus = item.status === 'ARCHIVED' ? (item.sourceEvidenceId ? 'SOURCE_EVIDENCE' : 'DEMONSTRATION') : 'ARCHIVED'; onProfiles(profiles.map((profile) => profile.id === item.id ? { ...profile, status: nextStatus, updatedAt: new Date().toISOString() } : profile), item.id) }}>{item.status === 'ARCHIVED' ? 'Възстанови' : 'Архивирай'}</button></div></article>)}</section>
}
