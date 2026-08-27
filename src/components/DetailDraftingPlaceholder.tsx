import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react'
import { createDetailDraftDocument, DETAIL_DRAFT_INITIAL_VIEWPORT, DETAIL_DRAFT_VIEWPORT_LIMITS, fitDetailDraftViewport, panDetailDraftViewport, zoomDetailDraftViewport } from '../detailDraftViewport'
import { createHybridProductDesignerSession, HYBRID_SELECTABLE_CATEGORIES, returnToHybridDesignerStart, selectHybridCreationRoute, selectHybridStandardCategory, type HybridCreationRoute, type HybridProductCategory, type HybridProductDesignerSession } from '../hybridProductDesigner'

interface Props { onClose: () => void; onOpenImportCenter: () => void }
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

export function DetailDraftingPlaceholder({ onClose, onOpenImportCenter }: Props) {
  const [session, setSession] = useState<HybridProductDesignerSession>(() => createHybridProductDesignerSession(crypto.randomUUID()))
  const goStart = () => setSession((current) => returnToHybridDesignerStart(current))
  const goBack = () => session.workflowStep === 'STANDARD_DRAFT' ? setSession((current) => selectHybridCreationRoute(current, 'STANDARD')) : goStart()
  return <section className="detail-drafting" role="dialog" aria-modal="true" aria-labelledby="detail-drafting-title">
    <header className="detail-drafting-header"><div><span>ФАЗА 06A.2 · ХИБРИДНА ОСНОВА</span><h2 id="detail-drafting-title">Конструктор на изделие</h2><p>Един семантичен модел само за текущата сесия · без автоматична геометрия и без производствен изход.</p></div><button type="button" onClick={onClose}>Назад към FacadeFlow</button></header>
    <div className="detail-drafting-safety">Безопасна визуална подготовка: източниците остават непроменими, геометрия не се създава, записът на DWG и машинните формати са блокирани.</div>
    <nav className="hybrid-breadcrumb" aria-label="Стъпки на конструктора"><b>Начало на конструктора</b>{session.creationRoute && <><span aria-hidden="true">›</span><span>{routeCards.find((card) => card.route === session.creationRoute)?.title}</span></>}{session.productCategory && <><span aria-hidden="true">›</span><span>{categoryCards.find((card) => card.category === session.productCategory)?.title}</span></>}</nav>
    {session.workflowStep !== 'DESIGNER_START' && <div className="hybrid-navigation"><button type="button" onClick={goBack}>Назад</button><button type="button" onClick={goStart}>Начало на конструктора</button></div>}
    {session.workflowStep === 'DESIGNER_START' && <RouteSelection onSelect={(route) => setSession((current) => selectHybridCreationRoute(current, route))}/>}
    {session.workflowStep === 'STANDARD_CATEGORY' && <StandardCategories onSelect={(category) => setSession((current) => selectHybridStandardCategory(current, category))}/>}
    {session.workflowStep === 'STANDARD_DRAFT' && <StandardDraft session={session}/>}
    {session.workflowStep === 'SKETCH_ROUTE' && <SketchRoute onOpenImportCenter={onOpenImportCenter}/>}
    {session.workflowStep === 'NON_STANDARD_VIEWPORT' && <DetailViewportFoundation/>}
  </section>
}

function RouteSelection({ onSelect }: { onSelect: (route: HybridCreationRoute) => void }) {
  return <main className="hybrid-screen"><div className="hybrid-screen-heading"><h3>Изберете начин за започване</h3><p>Подробните инструменти се въвеждат прогресивно в отделни безопасни фази.</p></div><div className="hybrid-route-grid">{routeCards.map((card) => <button type="button" className="hybrid-route-card" key={card.route} onClick={() => onSelect(card.route)}><span>Прогресивен работен поток</span><strong>{card.title}</strong><p>{card.description}</p><small>В тази фаза се създава само празна семантична сесия.</small></button>)}</div></main>
}

function StandardCategories({ onSelect }: { onSelect: (category: HybridProductCategory) => void }) {
  return <main className="hybrid-screen"><div className="hybrid-screen-heading"><h3>Категория на стандартното изделие</h3><p>Изборът създава само празна семантична чернова за категорията — без размери, профили, полета или операции.</p></div><div className="hybrid-category-grid">{categoryCards.map((card) => { const selectable = HYBRID_SELECTABLE_CATEGORIES.includes(card.category); return <button type="button" key={card.category} disabled={!selectable} onClick={() => onSelect(card.category)}><strong>{card.title}</strong><span>{selectable ? 'Достъпна основа' : 'Предстои'}</span></button> })}</div></main>
}

function StandardDraft({ session }: { session: HybridProductDesignerSession }) {
  const title = categoryCards.find((card) => card.category === session.productCategory)?.title
  return <main className="hybrid-screen"><section className="hybrid-empty-draft"><span>ПРАЗНА СЕМАНТИЧНА ЧЕРНОВА</span><h3>{title}</h3><p>Категорията е записана само в текущата сесия. Геометрия, размери, полета, профили, количества и операции не са създадени.</p><dl><dt>Преглед</dt><dd>Чернова</dd><dt>Геометрични обекти</dt><dd>0</dd><dt>Готово за машина</dt><dd>Не</dd></dl></section></main>
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
