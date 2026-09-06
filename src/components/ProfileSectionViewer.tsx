import type { ProfileVisualSectionModel } from '../profileData/visualSectionLibrary'
import { prelude60KnowledgeProvenanceByCode } from '../profileData/prelude60KnowledgeProvenance'
import { preludeTechnicalProfileByCode } from '../profileData/preludeTechnicalInspector'

interface Props {
  section: ProfileVisualSectionModel
}

export function ProfileSectionViewer({ section }: Props) {
  const provenance = prelude60KnowledgeProvenanceByCode(section.profileCode)
  const catalogueProfile = preludeTechnicalProfileByCode(section.profileCode)

  return <article className="profile-section-viewer" aria-label={`Каталогово сечение ${section.profileCode}`}>
    <header className="profile-section-viewer-head">
      <div>
        <span>PROFILE DATA 03.2.1 · VERIFIED CATALOGUE VISUAL</span>
        <h5>{section.profileCode} · {section.roleLabelBg}</h5>
        <p>{section.system} · реалната каталогова скица е отделена от human-confirmed измервателната семантика</p>
      </div>
      <strong>CATALOGUE VISUAL VERIFIED</strong>
    </header>

    <div className="profile-section-viewer-layout">
      <div className="profile-section-canvas catalogue-source">
        {catalogueProfile ? <div className="profile-section-catalogue-asset">
          <img
            src={catalogueProfile.catalogueWithDimensionsAsset}
            alt={`Каталогово сечение PRELUDE ${section.profileCode} ${section.roleLabelBg}`}
          />
        </div> : <div className="profile-section-catalogue-missing">
          Няма проверена каталогова скица за {section.profileCode}.
        </div>}
        <div className="profile-section-canvas-note">
          <b>КАТАЛОЖНО СЕЧЕНИЕ · AI ПРЕРИСУВАНЕ: НЕ</b>
          {' · '}изображението е директно извлечено от каталога PRELUDE. То е визуален източник за формата на профила, но не се обявява за изолиран производствен CAD контур.
        </div>
      </div>

      <aside className="profile-section-facts">
        <div><span>Работен размер · Надежда</span><b>{section.fullDimensionMm} mm</b></div>
        <div><span>Видима ширина · Надежда</span><b>{section.visibleWidthMm} mm</b></div>
        {section.zones.filter((zone) => zone.kind === 'DEDUCTION').map((zone) => <div key={zone.id}><span>{zone.labelBg}</span><b>{zone.sizeMm} mm</b></div>)}
        <code>{section.formulaBg}</code>
        <small>Human-confirmed източник: {section.sourceOrganisation} · технически контакт: {section.sourcePerson}</small>
        {catalogueProfile && <small>Каталогов визуален източник: {catalogueProfile.sourcePdf} · стр. {catalogueProfile.sourcePage} · директно извлечено, не AI-прерисувано.</small>}
      </aside>
    </div>

    {provenance && <section className="profile-section-provenance" aria-label={`Provenance ${section.profileCode}`}>
      <div className="catalogue">
        <span>PROFILE DATA 03.2 · КАТАЛОГ</span>
        <b>REFERENCE ONLY</b>
        <small>{provenance.catalogue.sourcePdf} · стр. {provenance.catalogue.sourcePage} · системна дълбочина {provenance.catalogue.systemDepthMm} mm</small>
        <code>labelled extent: {provenance.catalogue.labelledOverallExtentMm ?? '—'} mm · labelled visible: {provenance.catalogue.labelledVisibleMm ?? '—'} mm</code>
      </div>
      <div className="human">
        <span>PROFILE DATA 03.2 · НАДЕЖДА</span>
        <b>HUMAN CONFIRMED WORKING SEMANTICS</b>
        <small>{provenance.humanWorking.sourceOrganisation} · {provenance.humanWorking.sourcePerson}</small>
        <code>{provenance.humanWorking.formulaBg}</code>
      </div>
      <div className="gate">
        <span>{provenance.comparisonState === 'VISIBLE_WIDTH_AGREES_ACROSS_SOURCES' ? 'Видимата ширина съвпада между двата източника.' : 'Размерите не се приемат за директно сравними без отделно техническо потвърждение.'}</span>
        <b>AUTO MERGE: NO · EXACT CONTOUR AUTHORITY: NO</b>
      </div>
    </section>}

    <footer>VERIFIED CATALOGUE VISUAL · HUMAN MEASUREMENT SEMANTICS SEPARATE · SOURCE PROVENANCE SEPARATED · ISOLATED PRODUCTION CONTOUR: NO · MACHINE READY: NO · PRODUCTION APPROVED: NO</footer>
  </article>
}
