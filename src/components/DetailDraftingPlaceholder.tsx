import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react'
import { createDetailDraftDocument, DETAIL_DRAFT_INITIAL_VIEWPORT, DETAIL_DRAFT_VIEWPORT_LIMITS, fitDetailDraftViewport, panDetailDraftViewport, zoomDetailDraftViewport } from '../detailDraftViewport'
import { HYBRID_SELECTABLE_CATEGORIES, returnToHybridDesignerStart, selectHybridCreationRoute, selectHybridStandardCategory, type HybridCreationRoute, type HybridGuidedAiHandoff, type HybridProductCategory, type HybridProductDesignerSession } from '../hybridProductDesigner'
import type { CatalogueProfile } from '../profileCatalogueTypes'
import { StructuredConfigurationWizard } from './StructuredConfigurationWizard'
import { FacadeFlowWorkspaceHeader } from './FacadeFlowWorkspaceHeader'
import { GuidedHandoffPreview } from './GuidedHandoffPreview'

interface Props { session: HybridProductDesignerSession; profiles: CatalogueProfile[]; onSession: (updater: (current: HybridProductDesignerSession) => HybridProductDesignerSession) => void; onClose: () => void; returnToAi: boolean; onOpenImportCenter: () => void; onOpenProfileCatalogue: () => void }
const plannedTools = ['Линия', 'Полилиния', 'Правоъгълник', 'Окръжност', 'Дъга']
const routeCards: Array<{ route: HybridCreationRoute; title: string; description: string }> = [
  { route: 'STANDARD', title: 'Стандартно изделие', description: 'Започнете от структурирана схема за прозорец, врата, плъзгаща система или фасаден модул.' },
  { route: 'SKETCH_ASSISTED', title: 'Зареди скица или чертеж', description: 'Използвайте PDF, изображение или разрешения CAD маршрут само за преглед като доказателство за бъдеща човешка реконструкция.' },
  { route: 'NON_STANDARD', title: 'Нестандартно изделие', description: 'Започнете от празен безопасен модел за бъдеща параметрична и ръчна корекция.' },
]
const categoryCards: Array<{ category: HybridProductCategory; title: string }> = [
  { category: 'WINDOW', title: 'Прозорец' }, { category: 'DOOR', title: 'Врата' }, { category: 'SLIDING', title: 'Плъзгаща система' }, { category: 'SHOPFRONT', title: 'Витрина' }, { category: 'FACADE_MODULE', title: 'Фасаден модул' },
]
const sketchSteps = ['Избор на страница и зона', 'Потвърждение на мащаб', 'Заключен фонов слой', 'Предложен контур', 'Човешка корекция', 'Проверка', '2D / 3D']

export function DetailDraftingPlaceholder({ session, profiles, onSession, onClose, returnToAi, onOpenImportCenter, onOpenProfileCatalogue }: Props) {
  const guidedReturn = returnToAi && Boolean(session.guidedAiHandoff)
  const goStart = () => onSession((current) => returnToHybridDesignerStart(current))
  const goBack = () => guidedReturn ? onClose() : session.workflowStep === 'STANDARD_DRAFT' ? onSession((current) => selectHybridCreationRoute(current, 'STANDARD')) : goStart()
  return <section className={`detail-drafting ff-section-workspace${session.guidedAiHandoff ? ' has-ai-handoff' : ''}`} role="dialog" aria-modal="true" aria-labelledby="detail-drafting-title">
    <FacadeFlowWorkspaceHeader titleId="detail-drafting-title" icon="designer" eyebrow="Структурирана конфигурация" title="Конструктор на изделие" subtitle="Един семантичен модел за текущата сесия · без автоматична геометрия и без производствен изход." onBack={onClose} backLabel={guidedReturn ? 'Назад към AI черновата' : 'Назад към FacadeFlow'}/>
    <div className="detail-drafting-safety">Безопасна визуална подготовка: източниците остават непроменими, геометрия не се създава, записът на DWG и машинните формати са блокирани.</div>
    {session.guidedAiHandoff && <GuidedAiHandoffBanner handoff={session.guidedAiHandoff}/>}
    <nav className="hybrid-breadcrumb" aria-label="Стъпки на конструктора"><b>{guidedReturn ? 'AI чернова' : 'Начало на конструктора'}</b>{session.creationRoute && <><span aria-hidden="true">›</span><span>{routeCards.find((card) => card.route === session.creationRoute)?.title}</span></>}{session.productCategory && <><span aria-hidden="true">›</span><span>{categoryCards.find((card) => card.category === session.productCategory)?.title}</span></>}</nav>
    {session.workflowStep !== 'DESIGNER_START' && <div className="hybrid-navigation"><button type="button" onClick={goBack}>{guidedReturn ? '← Назад към AI черновата' : 'Назад'}</button>{!guidedReturn && <button type="button" onClick={goStart}>Начало на конструктора</button>}</div>}
    {session.workflowStep === 'DESIGNER_START' && <RouteSelection onSelect={(route) => onSession((current) => selectHybridCreationRoute(current, route))}/>}
    {session.workflowStep === 'STANDARD_CATEGORY' && <StandardCategories onSelect={(category) => onSession((current) => selectHybridStandardCategory(current, category, profiles))}/>}
    {session.workflowStep === 'STANDARD_DRAFT' && <StandardDraft session={session} profiles={profiles} onSession={onSession} onClose={onClose} onOpenProfileCatalogue={onOpenProfileCatalogue}/>}
    {session.workflowStep === 'SKETCH_ROUTE' && <SketchRoute onOpenImportCenter={onOpenImportCenter}/>}
    {session.workflowStep === 'NON_STANDARD_VIEWPORT' && <DetailViewportFoundation/>}
  </section>
}

function GuidedAiHandoffBanner({ handoff }: { handoff: HybridGuidedAiHandoff }) {
  const profile = handoff.profileEvidence
  const opening = [handoff.opening.type, handoff.opening.direction, handoff.opening.inwardOutward].filter(Boolean).join(' · ') || '—'
  const hardware = [handoff.hardware.type, handoff.hardware.description, handoff.hardware.handle, handoff.hardware.hingeQuantity ? `Панти: ${handoff.hardware.hingeQuantity}` : ''].filter(Boolean).join(' · ') || '—'
  return <aside className="hybrid-ai-handoff" aria-label="Пренесени данни от AI чернова">
    <div className="hybrid-ai-handoff-head"><div><span>AI → ПРЕХОД КЪМ КОНСТРУКТОРА</span><h3>{handoff.productType === 'DOOR' ? 'Врата' : 'Прозорец'} · {handoff.dimensions.width} × {handoff.dimensions.height} mm · количество {handoff.quantity}</h3><p>Чернова, потвърдена от човек · пренесени семантични данни, без автоматична геометрия.</p></div><b>ПРАВИЛАТА НЕ СА ПРОВЕРЕНИ</b></div>
    <div className="hybrid-ai-handoff-layout"><GuidedHandoffPreview handoff={handoff}/><div className="hybrid-ai-handoff-evidence"><p>Каталожните стойности са предварително попълнени. Ръчните профилни кодове остават видимо доказателство и не се прилагат насила към списъците за избор.</p><dl><div><dt>Тип</dt><dd>{handoff.productType === 'DOOR' ? 'Врата' : 'Прозорец'}</dd></div><div><dt>Размер</dt><dd>{handoff.dimensions.width} × {handoff.dimensions.height} mm</dd></div><div><dt>Количество</dt><dd>{handoff.quantity}</dd></div><div><dt>Система</dt><dd>{profile.system || '—'}</dd></div><div><dt>Каса</dt><dd>{profile.frame || '—'}</dd></div><div><dt>Крило</dt><dd>{profile.sash || '—'}</dd></div><div><dt>Делител</dt><dd>{profile.mullion || '—'}</dd></div><div><dt>Праг</dt><dd>{profile.threshold || '—'}</dd></div><div><dt>Отваряемост</dt><dd>{opening}</dd></div><div><dt>Стъкло / пълнеж</dt><dd>{handoff.glazing || '—'}</dd></div><div><dt>Външен цвят</dt><dd>{handoff.finish.exterior || '—'}</dd></div><div><dt>Вътрешен цвят</dt><dd>{handoff.finish.interior || '—'}</dd></div><div className="wide"><dt>Обков / дръжка</dt><dd>{hardware}</dd></div>{handoff.notes && <div className="wide"><dt>Бележки</dt><dd>{handoff.notes}</dd></div>}</dl></div></div>
    <footer data-safety="HUMAN CONFIRMED SOURCE · RULES VALIDATED: NO · AUTOMATIC GEOMETRY: NO · MACHINE READY: NO">ИЗТОЧНИК, ПОТВЪРДЕН ОТ ЧОВЕК · ПРАВИЛА ВАЛИДИРАНИ: НЕ · АВТОМАТИЧНА ГЕОМЕТРИЯ: НЕ · ГОТОВО ЗА МАШИНА: НЕ</footer>
  </aside>
}

function RouteSelection({ onSelect }: { onSelect: (route: HybridCreationRoute) => void }) {
  return <main className="hybrid-screen"><div className="hybrid-screen-heading"><h3>Изберете начин за започване</h3><p>Подробните инструменти се въвеждат прогресивно в отделни безопасни фази.</p></div><div className="hybrid-route-grid">{routeCards.map((card) => <button type="button" className="hybrid-route-card" key={card.route} onClick={() => onSelect(card.route)}><span>Прогресивен работен поток</span><strong>{card.title}</strong><p>{card.description}</p><small>В тази фаза се създава само празна семантична сесия.</small></button>)}</div></main>
}

function StandardCategories({ onSelect }: { onSelect: (category: HybridProductCategory) => void }) {
  return <main className="hybrid-screen"><div className="hybrid-screen-heading"><h3>Категория на стандартното изделие</h3><p>Изборът създава само празна семантична чернова за категорията — без размери, профили, полета или операции.</p></div><div className="hybrid-category-grid">{categoryCards.map((card) => { const selectable = HYBRID_SELECTABLE_CATEGORIES.includes(card.category); return <button type="button" key={card.category} disabled={!selectable} onClick={() => onSelect(card.category)}><strong>{card.title}</strong><span>{selectable ? 'Достъпна основа' : 'Предстои'}</span></button> })}</div></main>
}

function StandardDraft({ session, profiles, onSession, onClose, onOpenProfileCatalogue }: { session: HybridProductDesignerSession; profiles: CatalogueProfile[]; onSession: (updater: (current: HybridProductDesignerSession) => HybridProductDesignerSession) => void; onClose: () => void; onOpenProfileCatalogue: () => void }) {
  return <StructuredConfigurationWizard session={session} profiles={profiles} onSession={onSession} onCloseFacadeFlow={onClose} onOpenProfileCatalogue={onOpenProfileCatalogue}/>
}

function SketchRoute({ onOpenImportCenter }: { onOpenImportCenter: () => void }) {
  return <main className="hybrid-screen"><div className="hybrid-screen-heading"><h3>Скица или технически чертеж</h3><p>Оригиналът остава непроменим източник. Бъдещата редактирана геометрия ще бъде отделен, човешки потвърден слой.</p></div><button type="button" className="primary-button hybrid-import-action" onClick={onOpenImportCenter}>Отвори съществуващия импортен център</button><ol className="hybrid-future-steps" aria-label="Бъдещи заключени стъпки">{sketchSteps.map((step) => <li key={step}><span>{step}</span><b>Предстои</b></li>)}</ol><p className="hybrid-source-note">Нищо от PDF, изображение, OCR, DWG обекти, размери, изделия или операции не се копира автоматично в конструктора.</p></main>
}

function DetailViewportFoundation() {
  const document = useMemo(() => createDetailDraftDocument(), []), stageRef = useRef<HTMLElement>(null), dragRef = useRef<{ pointerId: number; x: number; y: number } | null>(null)
  const [navigationActive, setNavigationActive] = useState(false), [viewport, setViewport] = useState(DETAIL_DRAFT_INITIAL_VIEWPORT)
  const fit = () => { const box = stageRef.current?.getBoundingClientRect(); if (box) setViewport(fitDetailDraftViewport(box.width, box.height)) }
  useEffect(() => { fit() }, [])
  useEffect(() => { const keydown = (event: KeyboardEvent) => { if (event.key === 'Escape' && navigationActive) { event.preventDefault(); setNavigationActive(false); dragRef.current = null } }; window.addEventListener('keydown', keydown); return () => window.removeEventListener('keydown', keydown) }, [navigationActive])
  const localPoint = (clientX: number, clientY: number) => { const box = stageRef.current?.getBoundingClientRect(); return { x: clientX - (box?.left ?? 0), y: clientY - (box?.top ?? 0) } }
  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => { if (!navigationActive) { setNavigationActive(true); return }; dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId) }
  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => { const drag = dragRef.current; if (!drag || drag.pointerId !== event.pointerId) return; setViewport((current) => panDetailDraftViewport(current, event.clientX - drag.x, event.clientY - drag.y)); dragRef.current = { ...drag, x: event.clientX, y: event.clientY } }
  const stopDrag = (event: ReactPointerEvent<HTMLElement>) => { if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null }
  const onWheel = (event: ReactWheelEvent<HTMLElement>) => { if (!navigationActive) return; event.preventDefault(); const point = localPoint(event.clientX, event.clientY), factor = event.deltaY < 0 ? DETAIL_DRAFT_VIEWPORT_LIMITS.zoomStep : 1 / DETAIL_DRAFT_VIEWPORT_LIMITS.zoomStep; setViewport((current) => zoomDetailDraftViewport(current, factor, point.x, point.y)) }
  const gridSize = 20 * viewport.scale
  return <div className="hybrid-viewport"><fieldset className="hybrid-future-modes"><legend>Бъдещ режим</legend><label><input type="radio" disabled/>Параметрична корекция · Предстои</label><label><input type="radio" disabled/>Свободно чертане · Предстои</label></fieldset><div className="detail-drafting-toolbar" aria-label="Навигация на работната зона"><button type="button" aria-pressed={navigationActive} onClick={() => setNavigationActive((active) => !active)}>✋ {navigationActive ? 'Ръчичка активна' : 'Активирай ръчичката'}</button><button type="button" onClick={fit}>Побери изгледа</button><button type="button" onClick={() => setViewport(DETAIL_DRAFT_INITIAL_VIEWPORT)}>Нулирай изгледа</button><output aria-live="polite">Мащаб {Math.round(viewport.scale * 100)}%</output></div><div className="detail-drafting-layout"><aside><h3>Инструменти</h3>{plannedTools.map((tool) => <button type="button" disabled key={tool}>{tool}</button>)}<small>Инструментите остават заключени до следваща одобрена фаза.</small></aside><main ref={stageRef} className={`detail-drafting-stage ${navigationActive ? 'navigation-active' : ''}`} aria-label="Работна зона за безопасна навигация" tabIndex={0} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={stopDrag} onPointerCancel={stopDrag} onWheel={onWheel} style={{ backgroundSize: `${gridSize}px ${gridSize}px, ${gridSize}px ${gridSize}px, ${gridSize * 5}px ${gridSize * 5}px, ${gridSize * 5}px ${gridSize * 5}px`, backgroundPosition: `${viewport.offsetX}px ${viewport.offsetY}px` }}><div className="detail-drafting-origin" style={{ transform: `translate(${viewport.offsetX}px, ${viewport.offsetY}px)` }} aria-hidden="true"><span/><i/></div><div className="detail-drafting-empty"><strong>Празен документ за детайл</strong><p>{navigationActive ? 'Плъзнете за преместване · колелцето за мащаб · Escape освобождава мишката.' : 'Щракнете в зоната, за да активирате навигацията.'}</p><span>0 геометрични обекта</span></div></main><aside><h3>Свойства</h3><p>Няма избран обект.</p><dl><dt>Документ</dt><dd>{document.id}</dd><dt>Съхранение</dt><dd>Само текущата сесия</dd><dt>Само симулация</dt><dd>Да</dd><dt>Готово за машина</dt><dd>Не</dd><dt>Производствено одобрено</dt><dd>Не</dd></dl></aside></div></div>
}
