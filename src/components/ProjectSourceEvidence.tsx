import { useState } from 'react'
import { createPendingCatalogueProfileReviewFromNadezhdaEvidence, nadezhdaProfileEvidence, nadezhdaSourceEvidence } from '../nadezhdaCatalogueEvidence'
import { profileStatusLabels, roleLabels } from '../profileCatalogueState'
import type { CatalogueProfile, ProfileRole } from '../profileCatalogueTypes'
import { validateCatalogueProfile } from '../profileCatalogueValidation'
import { wp78CatalogueVisibility } from '../realData/wp78CatalogueVisibility'
import { NADEZHDA_HUMAN_PROFILE_MEASUREMENTS } from '../realData/nadezhdaHumanProfileMeasurements'
import { ProfileEditor } from './ProfileEditor'

interface Props {
  profiles: CatalogueProfile[]
  onProfiles: (profiles: CatalogueProfile[], changedProfileId?: string) => boolean
  onOpenCatalogue: () => void
}

const reviewRoles: ProfileRole[] = ['FRAME', 'SASH', 'MULLION']

const wp78BlockerLabels: Readonly<Record<string, string>> = {
  PROFILE_DIMENSIONS_UNKNOWN: 'Размерите на профилите са неизвестни.',
  RULES_NOT_VALIDATED: 'Правилата за тези профили не са валидирани.',
  CATALOGUE_PROMOTION_PENDING: 'Преминаването към избираем каталожен запис чака човешко решение.',
}

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

  return <div className="project-source-evidence" aria-label="Проектни записи от реални източници">
    <article className="project-source-card project-source-card-human" aria-labelledby="project-source-human-title">
      <header className="project-source-head">
        <div>
          <span className="project-source-kicker">НАДЕЖДА · РЕАЛНИ ПРОИЗВОДСТВЕНИ ДАННИ · ОТДЕЛНО ОТ КАТАЛОГА</span>
          <h4 id="project-source-human-title">PRELUDE 60 · Надежда</h4>
          <p>Технически потвърдени профилни измервания от Надежда. За касата и крилото видимата ширина е пълният размер минус една зона 22 mm; при делителя зоната 22 mm е от двете страни. Данните остават отделен производствен източник и не се сливат автоматично с KMG каталога.</p>
        </div>
        <span className="project-source-state">ИЗТОЧНИК: НАДЕЖДА</span>
      </header>
      <div className="project-source-human-grid">
        {NADEZHDA_HUMAN_PROFILE_MEASUREMENTS.map((item) => <section key={item.id} className="project-source-human-profile confirmed">
          <div><b>{item.code}</b><span>{item.roleLabelBg}</span></div>
          <strong>{item.fullDimensionMm} → {item.visibleWidthMm} mm</strong>
          <small>ТЕХНИЧЕСКИ ПОТВЪРДЕНО · НАДЕЖДА</small>
          <div className="project-source-human-geometry">
            <span><i>Пълен размер</i><b>{item.fullDimensionMm} mm</b></span>
            <span><i>Видима ширина</i><b>{item.visibleWidthMm} mm</b></span>
            <span><i>{item.deductionMeaningBg}</i><b>{item.deductionZoneCount === 2 ? `${item.deductionZoneMm} + ${item.deductionZoneMm}` : item.deductionZoneMm} mm</b></span>
          </div>
          <code>{item.measurementFormulaBg}</code>
          <p>{item.noteBg}</p>
        </section>)}
      </div>
      <div className="project-source-human-rule"><b>Потвърдено правило за видима ширина</b><span>Каса: 64 − 22 = 42 mm · Крило: 78 − 22 = 56 mm · Делител: 84 − 22 − 22 = 40 mm. Правилото е knowledge evidence и не отключва автоматично производствена геометрия.</span></div>
      <footer className="project-source-safety">ИЗТОЧНИК: НАДЕЖДА · ТЕХНИЧЕСКИ КОНТАКТ: БАТ ТРИФОН · БЕЗ АВТОМАТИЧЕН CATALOGUE MERGE · ПРАВИЛА: НЕВАЛИДИРАНИ · ГОТОВ ЗА МАШИНА: НЕ · ПРОИЗВОДСТВЕНО ОДОБРЕН: НЕ</footer>
    </article>

    <article className="project-source-card project-source-card-vadim" aria-labelledby="project-source-vadim-title">
      <header className="project-source-head">
        <div>
          <span className="project-source-kicker">ИЗТОЧНИКОВ ПРОЕКТ · XML + LTE · САМО ЗА ЧЕТЕНЕ</span>
          <h4 id="project-source-vadim-title">Надежда · {nadezhdaSourceEvidence.project}</h4>
          <p>Заключен реален проектен източник. Профилните кодове и сеченията идват от реалния източник; ролята каса / крило / делител остава изрично човешко решение.</p>
        </div>
        <span className="project-source-state">ИЗТОЧНИКЪТ Е НЕПРОМЕНЯЕМ</span>
      </header>

      <div className="project-source-metrics" aria-label="Обобщение на Вадим-2">
        <span><b>{nadezhdaSourceEvidence.xmlPieceCount}</b><small>XML детайла</small></span>
        <span><b>{nadezhdaSourceEvidence.lteRecordCount}</b><small>LTE записа</small></span>
        <span><b>{nadezhdaSourceEvidence.matchedXmlBarcodesInLte}/{nadezhdaSourceEvidence.xmlPieceCount}</b><small>съвпадение на баркодове</small></span>
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
              <span>{confirmed && imported ? `ПОТВЪРДЕНО ОТ ЧОВЕК · ${roleLabels[imported.role].toUpperCase()}` : reviewing && editing ? `ПРЕГЛЕД · ${roleLabels[editing.role].toUpperCase()}` : 'РОЛЯ: НЕПОТВЪРДЕНА'}</span>
            </div>
            <dl>
              <div><dt>Сечение</dt><dd>{item.maxY} × {item.maxZ} mm</dd></div>
              <div><dt>XML / LTE</dt><dd>{item.xmlPieceCount} / {item.lteRecordCount}</dd></div>
              <div><dt>Дължини</dt><dd>{item.minLength}–{item.maxLength} mm</dd></div>
              <div><dt>Обработки</dt><dd>{item.machiningCount}</dd></div>
            </dl>
            <p className="project-source-match">✓ XML ↔ LTE · потвърдено съвпадение на баркодове</p>
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
        <div className="project-source-review-heading"><span>ЧОВЕШКИ ПРЕГЛЕД</span><b>{editing.code} · {roleLabels[editing.role]}</b><small>Данните от източника остават неизменни. В каталога се добавя само отделен нормализиран запис след изрично човешко потвърждение.</small></div>
        <ProfileEditor value={editing} errors={errors} onChange={setEditing} onSave={save} onCancel={() => setEditing(null)}/>
      </section>}

      <footer className="project-source-safety">САМО ИЗТОЧНИК · ИЗИСКВА СЕ ЧОВЕШКИ ПРЕГЛЕД · ПРАВИЛА: НЕВАЛИДИРАНИ · ГОТОВ ЗА МАШИНА: НЕ · ПРОИЗВОДСТВЕНО ОДОБРЕН: НЕ</footer>
    </article>

    <article className="project-source-card project-source-card-wp78" aria-labelledby="project-source-wp78-title">
      <header className="project-source-head">
        <div>
          <span className="project-source-kicker">РЕАЛНИ ДАННИ · ПАРТИДА 01 · САМО ЗА ЧЕТЕНЕ</span>
          <h4 id="project-source-wp78-title">{wp78CatalogueVisibility.system}</h4>
          <p>Роли от предоставения WP 78 лист, подкрепени от реалния източник. Размерите на профилните сечения не са дадени и записите остават недостъпни за избор.</p>
        </div>
        <span className="project-source-state">НЕ МОЖЕ ДА СЕ ИЗБИРА</span>
      </header>
      <div className="project-source-wp78-summary"><span><b>{wp78CatalogueVisibility.entries.length}</b> профила</span><span><b>Прозорец</b> категория</span><span><b>Неизвестни</b> размери</span></div>
      <div className="project-source-wp78-grid">
        {wp78CatalogueVisibility.entries.map((item) => <section key={item.code} className="project-source-wp78-profile">
          <b>{item.code}</b>
          <span>{roleLabels[item.catalogueRole]}</span>
          <small>{item.sourceRoleLabel}</small>
          <em>Размери: НЕИЗВЕСТНИ</em>
        </section>)}
      </div>
      <div className="project-source-blockers"><b>Защо остава заключено</b><ul>{wp78CatalogueVisibility.blockers.map((blocker) => <li key={blocker}>{wp78BlockerLabels[blocker] ?? blocker}</li>)}</ul></div>
      <footer className="project-source-safety">САМО ЗА ЧЕТЕНЕ · РАЗМЕРИ НА ПРОФИЛИТЕ: НЕИЗВЕСТНИ · ПРАВИЛА: НЕВАЛИДИРАНИ · ГОТОВ ЗА МАШИНА: НЕ · ПРОИЗВОДСТВЕНО ОДОБРЕН: НЕ</footer>
    </article>
  </div>
}
