import { useState } from 'react'
import { createPendingCatalogueProfileReviewFromNadezhdaEvidence, nadezhdaProfileEvidence, nadezhdaSourceEvidence } from '../nadezhdaCatalogueEvidence'
import { profileStatusLabels, roleLabels } from '../profileCatalogueState'
import type { CatalogueProfile, ProfileRole } from '../profileCatalogueTypes'
import { validateCatalogueProfile } from '../profileCatalogueValidation'
import { wp78CatalogueVisibility } from '../realData/wp78CatalogueVisibility'
import { ProfileEditor } from './ProfileEditor'

interface Props {
  profiles: CatalogueProfile[]
  onProfiles: (profiles: CatalogueProfile[], changedProfileId?: string) => boolean
  onOpenCatalogue: () => void
}

const reviewRoles: ProfileRole[] = ['FRAME', 'SASH', 'MULLION']

export function ProjectSourceEvidence({ profiles, onProfiles, onOpenCatalogue }: Props) {
  const [editing, setEditing] = useState<CatalogueProfile | null>(null)
  const [errors, setErrors] = useState<string[]>([])

  const importedEvidence = (evidenceId: string) => profiles.find((profile) => profile.sourceEvidenceId === evidenceId && profile.status !== 'ARCHIVED')
  const beginReview = (evidenceId: string, role: ProfileRole) => {
    const evidence = nadezhdaProfileEvidence.find((item) => item.id === evidenceId)
    if (!evidence || importedEvidence(evidenceId)) return
    setEditing(createPendingCatalogueProfileReviewFromNadezhdaEvidence(evidence, role, new Date().toISOString()))
    setErrors([])
  }
  const editReviewedProfile = (profile: CatalogueProfile) => {
    setEditing({ ...profile })
    setErrors([])
  }
  const save = (candidate = editing) => {
    if (!candidate) return
    const result = validateCatalogueProfile(candidate, profiles)
    setErrors(result.errors)
    if (!result.valid) return
    const next = profiles.some(({ id }) => id === candidate.id)
      ? profiles.map((profile) => profile.id === candidate.id ? candidate : profile)
      : [...profiles, candidate]
    if (!onProfiles(next, candidate.id)) return
    setEditing(null)
  }

  return <div className="project-source-evidence" aria-label="Проектни source evidence записи">
    <article className="project-source-card project-source-card-vadim" aria-labelledby="project-source-vadim-title">
      <header className="project-source-head">
        <div>
          <span className="project-source-kicker">SOURCE PROJECT · XML + LTE · READ ONLY</span>
          <h4 id="project-source-vadim-title">Надежда · {nadezhdaSourceEvidence.project}</h4>
          <p>Заключен реален проектен източник. Профилните кодове и сеченията са evidence; ролята каса / крило / делител остава изрично човешко решение.</p>
        </div>
        <span className="project-source-state">SOURCE IMMUTABLE</span>
      </header>

      <div className="project-source-metrics" aria-label="Обобщение на Вадим-2">
        <span><b>{nadezhdaSourceEvidence.xmlPieceCount}</b><small>XML детайла</small></span>
        <span><b>{nadezhdaSourceEvidence.lteRecordCount}</b><small>LTE записа</small></span>
        <span><b>{nadezhdaSourceEvidence.matchedXmlBarcodesInLte}/{nadezhdaSourceEvidence.xmlPieceCount}</b><small>barcode match</small></span>
        <span><b>{nadezhdaSourceEvidence.machiningCount}</b><small>обработки</small></span>
      </div>

      <div className="project-source-profile-grid">
        {nadezhdaProfileEvidence.map((item) => {
          const imported = importedEvidence(item.id)
          const confirmed = imported?.humanRoleReviewStatus === 'HUMAN_CONFIRMED'
          const reviewing = editing?.sourceEvidenceId === item.id
          return <section key={item.id} className={`project-source-profile ${confirmed ? 'confirmed' : ''} ${reviewing ? 'reviewing' : ''}`}>
            <div className="project-source-profile-title">
              <b>{item.code}</b>
              <span>{confirmed && imported ? `HUMAN CONFIRMED · ${roleLabels[imported.role].toUpperCase()}` : reviewing && editing ? `ПРЕГЛЕД · ${roleLabels[editing.role].toUpperCase()}` : 'РОЛЯ: НЕПОТВЪРДЕНА'}</span>
            </div>
            <dl>
              <div><dt>Сечение</dt><dd>{item.maxY} × {item.maxZ} mm</dd></div>
              <div><dt>XML / LTE</dt><dd>{item.xmlPieceCount} / {item.lteRecordCount}</dd></div>
              <div><dt>Дължини</dt><dd>{item.minLength}–{item.maxLength} mm</dd></div>
              <div><dt>Обработки</dt><dd>{item.machiningCount}</dd></div>
            </dl>
            <p className="project-source-match">✓ XML ↔ LTE barcode evidence</p>
            {imported ? <div className="project-source-reviewed">
              <span>Каталожен запис: <b>{roleLabels[imported.role]}</b> · {profileStatusLabels[imported.status]}</span>
              {confirmed && <small>Потвърдено от: {imported.humanRoleConfirmedBy}</small>}
              <div><button type="button" onClick={() => editReviewedProfile(imported)}>Прегледай потвърждението</button><button type="button" onClick={onOpenCatalogue}>Отвори каталога</button></div>
            </div> : <div className="project-source-review-actions">
              <span>Прегледай като:</span>
              {reviewRoles.map((role) => <button key={role} type="button" aria-pressed={Boolean(reviewing && editing?.role === role)} onClick={() => beginReview(item.id, role)}>{roleLabels[role]}</button>)}
            </div>}
          </section>
        })}
      </div>

      {editing?.sourceEvidenceId?.startsWith('nadezhda-vadim2-') && <section className="project-source-review-panel" aria-live="polite">
        <div className="project-source-review-heading"><span>HUMAN REVIEW</span><b>{editing.code} · {roleLabels[editing.role]}</b><small>Source evidence остава неизменен. В каталога се добавя само отделен нормализиран запис след изрично човешко потвърждение.</small></div>
        <ProfileEditor value={editing} errors={errors} onChange={setEditing} onSave={save} onCancel={() => setEditing(null)}/>
      </section>}

      <footer className="project-source-safety">SOURCE ONLY · HUMAN REVIEW REQUIRED · RULES VALIDATED: NO · MACHINE READY: NO · PRODUCTION APPROVED: NO</footer>
    </article>

    <article className="project-source-card project-source-card-wp78" aria-labelledby="project-source-wp78-title">
      <header className="project-source-head">
        <div>
          <span className="project-source-kicker">REAL DATA BATCH 01 · READ ONLY</span>
          <h4 id="project-source-wp78-title">{wp78CatalogueVisibility.system}</h4>
          <p>Source-backed роли от предоставения WP 78 лист. Размерите на профилните сечения не са дадени и записите остават non-selectable.</p>
        </div>
        <span className="project-source-state">NO SELECTABLE</span>
      </header>
      <div className="project-source-wp78-summary"><span><b>{wp78CatalogueVisibility.entries.length}</b> профила</span><span><b>WINDOW</b> категория</span><span><b>UNKNOWN</b> размери</span></div>
      <div className="project-source-wp78-grid">
        {wp78CatalogueVisibility.entries.map((item) => <section key={item.code} className="project-source-wp78-profile">
          <b>{item.code}</b>
          <span>{roleLabels[item.catalogueRole]}</span>
          <small>{item.sourceRoleLabel}</small>
          <em>Размери: НЕИЗВЕСТНИ</em>
        </section>)}
      </div>
      <div className="project-source-blockers"><b>Защо остава заключено</b><ul>{wp78CatalogueVisibility.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}</ul></div>
      <footer className="project-source-safety">READ ONLY · PROFILE DIMENSIONS: UNKNOWN · RULES VALIDATED: NO · MACHINE READY: NO · PRODUCTION APPROVED: NO</footer>
    </article>
  </div>
}
