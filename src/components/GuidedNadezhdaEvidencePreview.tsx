import type { CatalogueProfile } from '../profileCatalogueTypes'
import { catalogueProfileIsDemonstration, roleLabels } from '../profileCatalogueState'
import { guidedNadezhdaEvidencePreview } from '../nadezhdaCatalogueEvidence'

interface Props {
  profiles: CatalogueProfile[]
  onOpenCatalogue: () => void
}

export function GuidedNadezhdaEvidencePreview({ profiles, onOpenCatalogue }: Props) {
  const rows = guidedNadezhdaEvidencePreview(profiles)
  const available = rows.filter((row) => row.state === 'AVAILABLE').length
  const demoProfiles = profiles.filter(catalogueProfileIsDemonstration)

  return <section className="ff-guided-catalogue-sources" aria-label="Реален и демонстрационен каталог">
    <section className="ff-guided-real-catalogue-preview" aria-labelledby="ff-guided-real-catalogue-title" data-legacy-label="РЕАЛЕН КАТАЛОГ · SOURCE EVIDENCE">
      <div className="ff-guided-real-catalogue-head">
        <div><span>РЕАЛЕН КАТАЛОГ · НАДЕЖДА</span><b id="ff-guided-real-catalogue-title">Вадим-2 · source evidence</b><small>Реалните кодове са видими винаги. Само HUMAN CONFIRMED ролите могат да влязат в нормалните dropdown-и.</small></div>
        <div className="ff-guided-real-catalogue-kpi"><b>{available}/{rows.length}</b><span>HUMAN CONFIRMED</span></div>
      </div>
      <div className="ff-guided-real-catalogue-grid">
        {rows.map((row) => <article key={row.evidenceId} className={row.state === 'AVAILABLE' ? 'available' : 'locked'}>
          <div className="ff-guided-real-code"><b>{row.code}</b><span>{row.section}</span></div>
          <strong>{row.state === 'AVAILABLE' && row.role ? `ДОСТЪПЕН · ${roleLabels[row.role].toUpperCase()}` : 'ЗАКЛЮЧЕН · РОЛЯ НЕПОТВЪРДЕНА'}</strong>
          <small>XML / LTE: {row.xmlPieceCount} / {row.lteRecordCount}</small>
          {row.state === 'AVAILABLE' ? <small>HUMAN CONFIRMED{row.humanConfirmedBy ? ` · ${row.humanConfirmedBy}` : ''}</small> : <small>Не се предлага за избор в Каса / Крило / Делител.</small>}
        </article>)}
      </div>
      <div className="ff-guided-real-catalogue-foot">
        <span>РЕАЛНИТЕ ЗАКЛЮЧЕНИ КОДОВЕ НЕ СЕ ИЗПОЛЗВАТ АВТОМАТИЧНО.</span>
        <button type="button" onClick={onOpenCatalogue}>Прегледай ролите в каталога</button>
      </div>
    </section>

    <aside className="ff-guided-demo-catalogue" aria-label="Демо каталог само за тест">
      <div><span>ДЕМО КАТАЛОГ · САМО ЗА ТЕСТ</span><b>{demoProfiles.length} placeholder профила</b><small>Не участва в нормалните dropdown-и. Зарежда се само от бутона ДЕМО и никога не замества реален HUMAN CONFIRMED профил.</small></div>
      <div className="ff-guided-demo-codes">{demoProfiles.map((profile) => <span key={profile.id}>{profile.code} · {roleLabels[profile.role]}</span>)}</div>
    </aside>
  </section>
}
