import { useState } from 'react'
import { PRELUDE_MEASUREMENT_ANCHOR_CANDIDATES, type PreludeMeasurementAnchorKind } from '../profileData/preludeMeasurementAnchors'
import {
  PRELUDE_TECHNICAL_PROFILES,
  preludeTechnicalProfileByCode,
  type PreludeTechnicalProfileCode,
} from '../profileData/preludeTechnicalInspector'
import { TechnicalZoomModal } from './TechnicalZoomModal'

interface Props {
  profileCodes: string[]
  requestedCode?: string | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

type CatalogueViewMode = 'SECTION_ONLY' | 'WITH_DIMENSIONS'

const anchorKindLabelBg: Record<PreludeMeasurementAnchorKind, string> = {
  WORKING_TOTAL: 'РАБОТЕН РАЗМЕР',
  VISIBLE_WIDTH: 'ВИДИМА ШИРИНА',
  DEDUCTION_ZONE: 'РАБОТНА ЗОНА',
}

const placementLabel: Record<(typeof PRELUDE_TECHNICAL_PROFILES)[number]['anchorPlacementStatus'], string> = {
  CANDIDATE_NOT_YET_BOUND_TO_CONTOUR: 'КАНДИДАТ · НЕ Е ВЪРЗАН КЪМ КОНТУРА',
  UNCONFIRMED_ON_CONTOUR: 'НЕПОТВЪРДЕНО ВЪРХУ КОНТУРА',
}

export function TechnicalProfileInspector({ profileCodes, requestedCode, open, onOpenChange }: Props) {
  const available = [...new Set(profileCodes.map((code) => preludeTechnicalProfileByCode(code)).filter((item) => item !== undefined))]
  const requestedProfile = requestedCode ? preludeTechnicalProfileByCode(requestedCode) : undefined
  const [selectedCode, setSelectedCode] = useState<PreludeTechnicalProfileCode | null>(requestedProfile?.code ?? available[0]?.code ?? null)
  const [viewMode, setViewMode] = useState<CatalogueViewMode>('WITH_DIMENSIONS')
  const [internalInspectorOpen, setInternalInspectorOpen] = useState(false)
  const [anchorsOpen, setAnchorsOpen] = useState(true)
  const [focusVisual, setFocusVisual] = useState(false)
  const [zoomOpen, setZoomOpen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const active = available.find((profile) => profile.code === selectedCode) ?? available[0]
  const inspectorOpen = open ?? internalInspectorOpen
  const setInspectorOpen = (next: boolean) => {
    if (open === undefined) setInternalInspectorOpen(next)
    onOpenChange?.(next)
  }


  if (!active) return <section className="ff-profile-inspector unavailable">
    <div className="ff-profile-inspector-empty"><span>ТЕХНИЧЕСКИ ИНСПЕКТОР НА ПРОФИЛ</span><strong>Няма потвърден PRELUDE профилен код за инспекция.</strong><p>Инспекторът не избира профил по подразбиране. Нужен е точен код 482.30, 482.05 или 482.21 от източника.</p></div>
  </section>

  const anchors = PRELUDE_MEASUREMENT_ANCHOR_CANDIDATES[active.code]
  const imageSrc = viewMode === 'WITH_DIMENSIONS' ? active.catalogueWithDimensionsAsset : active.catalogueSectionOnlyAsset
  const semantics = active.humanConfirmedWorkingSemantics
  const viewLabel = viewMode === 'WITH_DIMENSIONS' ? 'Каталогови коти' : 'Само сечение'

  return <section className={`ff-profile-inspector ${focusVisual ? 'focus-visual' : ''}`} aria-labelledby="ff-profile-inspector-title">
    <header className="ff-profile-inspector-head">
      <div><span>03 · ТЕХНИЧЕСКИ ИНСПЕКТОР НА ПРОФИЛ · ПО ЖЕЛАНИЕ</span><h4 id="ff-profile-inspector-title">{active.system} · {active.code} · {active.roleLabelBg}</h4><p>{inspectorOpen ? `Показаното сечение е директно извлечено от каталога PRELUDE, страница ${active.sourcePage}. Не е AI-прерисувано.` : 'Подробният инспектор е свит, за да не дублира трите компактни сечения в AI скицата. Разгъни го само когато искаш увеличение, каталогови коти или измервателните опори.'}</p></div>
      <div className="ff-profile-inspector-head-actions"><b>{inspectorOpen ? 'КАТАЛОЖНА СКИЦА: ПРОВЕРЕНА' : 'ПОДРОБЕН РЕЖИМ · СВИТ'}</b><button type="button" onClick={() => setInspectorOpen(!inspectorOpen)} aria-expanded={inspectorOpen}>{inspectorOpen ? 'Свий' : 'Разгледай подробно'}</button></div>
    </header>

    {inspectorOpen && <>
      <div className="ff-profile-inspector-tabs" role="tablist" aria-label="Профили от конструктивното предложение">
        {available.map((profile) => <button type="button" key={profile.code} role="tab" aria-selected={active.code === profile.code} className={active.code === profile.code ? 'selected' : ''} onClick={() => setSelectedCode(profile.code)}><span>{profile.roleLabelBg.toUpperCase()}</span><strong>{profile.code}</strong><small>{profile.system}</small></button>)}
      </div>

      <div className="ff-profile-view-modes" aria-label="Режим на инспектора"><button type="button" className={!focusVisual ? 'selected' : ''} onClick={() => setFocusVisual(false)}>Разделен изглед</button><button type="button" className={focusVisual ? 'selected' : ''} onClick={() => setFocusVisual(true)}>Фокус върху скицата</button></div>

      <div className="ff-profile-inspector-layout">
        <section className="ff-profile-catalogue-view">
          <div className="ff-profile-catalogue-toolbar"><span>ИСТИНСКА PRELUDE СКИЦА</span><div><button type="button" className={viewMode === 'SECTION_ONLY' ? 'selected' : ''} onClick={() => setViewMode('SECTION_ONLY')}>Само сечение</button><button type="button" className={viewMode === 'WITH_DIMENSIONS' ? 'selected' : ''} onClick={() => setViewMode('WITH_DIMENSIONS')}>Каталогови коти</button><button type="button" className="ff-profile-enlarge" onClick={() => { setZoom(1); setZoomOpen(true) }}>Увеличи</button></div></div>
          <div className="ff-profile-catalogue-image ff-technical-grid" role="button" tabIndex={0} aria-label={`Увеличи каталоговата скица ${active.code}`} onClick={() => { setZoom(1); setZoomOpen(true) }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setZoom(1); setZoomOpen(true) } }}>
            <span className="ff-technical-zoom-hint">Клик за увеличение</span>
            <img src={imageSrc} alt={`Каталогово сечение PRELUDE ${active.code} ${active.roleLabelBg}`}/>
          </div>
          <div className="ff-profile-catalogue-source"><b>Източник</b><span>{active.sourcePdf} · стр. {active.sourcePage}</span><em>AI ПРЕРИСУВАНЕ: НЕ · ИЗОЛИРАН ПРОИЗВОДСТВЕН КОНТУР: НЕ</em></div>
        </section>

        {!focusVisual && <aside className="ff-profile-inspector-facts">
          <div className="ff-profile-fact-title"><span>ПРОВЕРЕНИ ФАКТИ</span><b>{active.code}</b></div>
          <dl>
            <div><dt>Системна дълбочина</dt><dd>{active.catalogueDimensions.systemDepthMm} mm</dd></div>
            <div><dt>Каталогов общ размер</dt><dd>{active.catalogueDimensions.overallExtentMm ?? '—'}{active.catalogueDimensions.overallExtentMm ? ' mm' : ''}</dd></div>
            <div><dt>Каталогова видима стойност</dt><dd>{active.catalogueDimensions.visibleMm ?? '—'}{active.catalogueDimensions.visibleMm ? ' mm' : ''}</dd></div>
            <div><dt>Работен размер · потвърден от човек</dt><dd>{semantics.fullWorkingMm} mm</dd></div>
            <div><dt>Видима ширина · потвърдена от човек</dt><dd>{semantics.visibleMm} mm</dd></div>
          </dl>
          <code>{semantics.formulaBg}</code>
          <p>{semantics.noteBg}</p>
          {active.code === '482.05' && <small><b>Важно:</b> 78 mm е потвърдена работна интерпретация. Не се представя като каталогова кота, ако каталоговата скица не я показва така.</small>}
        </aside>}
      </div>

      <section className="ff-measurement-anchor-layer" aria-labelledby={`ff-anchor-${active.code}`}>
        <div className="ff-measurement-anchor-head"><div><span>04 · ИЗМЕРВАТЕЛНИ ОПОРИ</span><h5 id={`ff-anchor-${active.code}`}>Семантични кандидати за измерване · {active.code}</h5><p>Стойностите са потвърдени като измервателна семантика, но началната и крайната точка върху реалния профилен контур още не са валидирани.</p></div><div className="ff-measurement-anchor-actions"><b>{placementLabel[active.anchorPlacementStatus]}</b><button type="button" onClick={() => setAnchorsOpen((value) => !value)} aria-expanded={anchorsOpen}>{anchorsOpen ? 'Свий' : 'Разгъни'}</button></div></div>
        {anchorsOpen && <>
          <div className="ff-measurement-anchor-grid">{anchors.map((anchor) => <article key={anchor.id}><span>{anchorKindLabelBg[anchor.kind]}</span><strong>{anchor.labelBg}</strong><b>{anchor.valueMm} mm</b><small>НАЧАЛО: НЕСВЪРЗАНО · КРАЙ: НЕСВЪРЗАНО</small></article>)}</div>
          <div className="ff-measurement-equation"><span>Работна семантика</span><code>{semantics.formulaBg}</code><p>Следващата инженерна стъпка е човек да свърже тези измервателни опори с конкретни точки/линии от доказания каталогов контур. До тогава координати не се измислят.</p></div>
          <div className="ff-measurement-status-row"><span>Контурни точки: <b>НЕПОТВЪРДЕНИ</b></span><span>Монтажни опори: <b>НЕПОТВЪРДЕНИ</b></span><span>Координати: <b>НЯМА</b></span></div>
        </>}
        <footer data-safety="GEOMETRIC ANCHORS VALIDATED: NO · ASSEMBLY ANCHORS VALIDATED: NO · MACHINE READY: NO · PRODUCTION APPROVED: NO">ГЕОМЕТРИЧНИ ОПОРИ ПОТВЪРДЕНИ: НЕ · МОНТАЖНИ ОПОРИ ПОТВЪРДЕНИ: НЕ · ГОТОВО ЗА МАШИНА: НЕ · ОДОБРЕНО ЗА ПРОИЗВОДСТВО: НЕ</footer>
      </section>
    </>}

    <TechnicalZoomModal open={zoomOpen} title={`${active.system} · ${active.code} · ${active.roleLabelBg}`} subtitle={`${viewLabel} · каталог ${active.sourcePdf}, стр. ${active.sourcePage}`} zoom={zoom} onZoom={setZoom} onReset={() => setZoom(1)} onClose={() => setZoomOpen(false)}>
      <img className="ff-profile-zoom-image" src={imageSrc} alt={`Увеличено каталогово сечение PRELUDE ${active.code}`}/>
    </TechnicalZoomModal>
  </section>
}
