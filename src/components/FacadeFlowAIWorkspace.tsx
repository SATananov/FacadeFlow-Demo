import type { Dispatch, SetStateAction } from 'react'
import { FACADEFLOW_AI_DEMO_SCENARIOS, FACADEFLOW_AI_INPUT_LABELS, FACADEFLOW_JOB_TYPE_LABELS, KNOWLEDGE_BASE_SECTIONS, applyFacadeFlowAiDemoScenario, resetFacadeFlowAiIntake, selectFacadeFlowAiInputMode, selectFacadeFlowJobType, setFacadeFlowAiView, updateFacadeFlowJobMetadata } from '../aiWorkspaceState'
import type { FacadeFlowAiDemoScenario, FacadeFlowAiInputMode, FacadeFlowAiSession, FacadeFlowJobType } from '../aiWorkspaceTypes'
import { GUIDED_OPENING_LABELS, GUIDED_PRODUCT_TYPE_LABELS, effectiveGuidedProfileSystem, guidedProductCompletion, guidedProductUnresolved } from '../aiGuidedProduct'
import type { CatalogueProfile } from '../profileCatalogueTypes'
import { AiBlueprintPreview } from './AiBlueprintPreview'
import { FacadeFlowIcon, type FacadeFlowIconName } from './FacadeFlowIcons'
import { FacadeFlowWorkspaceHeader } from './FacadeFlowWorkspaceHeader'
import { GuidedAiProductBuilder } from './GuidedAiProductBuilder'
import { ProjectStructureBuilder } from './ProjectStructureBuilder'
import { PromptInterpretationPanel } from './PromptInterpretationPanel'
import { ProjectDocumentIntelligencePanel } from './ProjectDocumentIntelligencePanel'
import { UnifiedDemoPipeline } from './UnifiedDemoPipeline'

interface Props {
  session: FacadeFlowAiSession
  onSession: Dispatch<SetStateAction<FacadeFlowAiSession>>
  activeProfileCount: number
  profiles: CatalogueProfile[]
  onClose: () => void
  onOpenImportCenter: () => void
  onOpenProductDesigner: () => void
  onOpenCustomCad: () => void
  onOpenProfileCatalogue: () => void
}

const jobTypes = Object.keys(FACADEFLOW_JOB_TYPE_LABELS) as FacadeFlowJobType[]
const inputModes = Object.keys(FACADEFLOW_AI_INPUT_LABELS) as FacadeFlowAiInputMode[]
const demoScenarios = Object.keys(FACADEFLOW_AI_DEMO_SCENARIOS) as FacadeFlowAiDemoScenario[]

const jobIcons: Record<FacadeFlowJobType, FacadeFlowIconName> = { BUILDING: 'building', HOUSE: 'house', SMALL_PROJECT: 'small-project', SINGLE_PRODUCT: 'single-product', CUSTOM_ORDER: 'custom-order', TECHNICAL_DETAIL: 'technical-detail' }
const inputIcons: Record<FacadeFlowAiInputMode, FacadeFlowIconName> = { DOCUMENTS: 'documents', DESCRIPTION: 'description', SKETCH: 'sketch', MANUAL: 'manual' }
const intakeStatusLabels: Record<FacadeFlowAiSession['job']['intakeStatus'], string> = { EMPTY: 'ПРАЗНО', SOURCE_CAPTURED: 'ИЗТОЧНИКЪТ Е ПРИЕТ', NEEDS_REVIEW: 'ИЗИСКВА ПРОВЕРКА', HUMAN_CONFIRMED: 'ПОТВЪРДЕНО ОТ ЧОВЕК' }

export function FacadeFlowAIWorkspace({ session, onSession, activeProfileCount, profiles, onClose, onOpenImportCenter, onOpenProductDesigner, onOpenCustomCad, onOpenProfileCatalogue }: Props) {
  const setSession = (updater: (current: FacadeFlowAiSession) => FacadeFlowAiSession) => onSession(updater)
  return <section className="ff-ai-workspace ff-section-workspace" role="dialog" aria-modal="true" aria-labelledby="ff-ai-title">
    <FacadeFlowWorkspaceHeader
      titleId="ff-ai-title"
      icon="ai"
      eyebrow="Интелигентна CAD работна зона"
      title="FacadeFlow AI"
      subtitle="От идея, документ или скица към проверена параметрична подготовка."
      onBack={onClose}
      backLabel="Назад"
      actions={<button type="button" className={session.view === 'KNOWLEDGE_BASE' ? 'selected' : ''} onClick={() => setSession((current) => setFacadeFlowAiView(current, current.view === 'KNOWLEDGE_BASE' ? 'INTAKE' : 'KNOWLEDGE_BASE'))}><FacadeFlowIcon name="data"/><span>Данни и каталози</span></button>}
      className="ff-ai-unified-header"
    />
    <div className="ff-ai-safety"><b>AI моделът още не е свързан.</b> Няма автоматично генерирана геометрия, сървърна логика, мрежово изпращане или производствен изход. Всеки бъдещ AI резултат ще минава през човешка проверка и правила.</div>
    <StatusRail session={session}/>
    {session.view === 'KNOWLEDGE_BASE' ? <KnowledgeBase session={session} profiles={profiles} setSession={setSession} activeProfileCount={activeProfileCount} onOpenProfileCatalogue={onOpenProfileCatalogue} demoActive={session.job.demoScenario === 'KNOWLEDGE_BASE'}/> : <Intake session={session} profiles={profiles} setSession={setSession} onOpenImportCenter={onOpenImportCenter} onOpenProductDesigner={onOpenProductDesigner} onOpenCustomCad={onOpenCustomCad} onOpenProfileCatalogue={onOpenProfileCatalogue}/>}
  </section>
}

function StatusRail({ session }: { session: FacadeFlowAiSession }) {
  return <div className="ff-ai-status-rail" aria-label="Граници на AI работния поток">
    <span><i className="locked"/>AI модел: <b>НЕ Е СВЪРЗАН</b></span>
    <span><i/>Източници: <b>ЗАДЪЛЖИТЕЛНИ</b></span>
    <span><i/>Човешка проверка: <b>ЗАДЪЛЖИТЕЛНА</b></span>
    <span><i/>Проверка по правила: <b>ЗАДЪЛЖИТЕЛНА</b></span>
    <span><i className="locked"/>Готово за машина: <b>{session.productionApproved ? 'ДА' : 'НЕ'}</b></span>
  </div>
}

function Intake({ session, profiles, setSession, onOpenImportCenter, onOpenProductDesigner, onOpenCustomCad, onOpenProfileCatalogue }: { session: FacadeFlowAiSession; profiles: CatalogueProfile[]; setSession: (updater: (current: FacadeFlowAiSession) => FacadeFlowAiSession) => void; onOpenImportCenter: () => void; onOpenProductDesigner: () => void; onOpenCustomCad: () => void; onOpenProfileCatalogue: () => void }) {
  const selectedJob = session.job.jobType ? FACADEFLOW_JOB_TYPE_LABELS[session.job.jobType] : null
  return <main className="ff-ai-main">
    <section className="ff-ai-intake-column">
      <AiDemoSuite session={session} profiles={profiles} setSession={setSession}/>
      <UnifiedDemoPipeline session={session} profiles={profiles} setSession={setSession}/>
      <div className="ff-ai-launch-hero ff-ai-launch-hero-compact"><div><span className="ff-ai-launch-kicker">НОВА РАБОТА / AI ВХОД</span><h3>Избери контекст и започни изделието</h3><p>Контекстът пази структурата на проекта, но не те спира. След избора FacadeFlow отваря водения продуктов формуляр веднага.</p></div><div className="ff-ai-launch-orbit" aria-hidden="true"><span>2D</span><span>AI</span><span>CAD</span><i/></div></div>
      <div className="ff-ai-section-heading compact"><span>01</span><div><h3>Работен контекст</h3><p>Избери най-близкия сценарий. „Единично изделие“ е директният вход за един прозорец или врата.</p></div></div>
      <div className="ff-ai-context-strip" role="group" aria-label="Работен контекст">{jobTypes.map((jobType) => { const item = FACADEFLOW_JOB_TYPE_LABELS[jobType]; const selected = session.job.jobType === jobType; return <button type="button" key={jobType} className={`ff-ai-job-card ${selected ? 'selected' : ''}`} aria-pressed={selected} onClick={() => setSession((current) => selectFacadeFlowAiInputMode(selectFacadeFlowJobType(current, jobType), 'DESCRIPTION'))}><span className="ff-ai-context-icon"><FacadeFlowIcon name={jobIcons[jobType]}/></span><span><strong>{item.title}</strong><small>{item.groupHint}</small></span><span className="ff-ai-context-blueprint" aria-hidden="true"><AiBlueprintPreview type={jobType}/></span></button> })}</div>

      {session.job.jobType && <>
        <div className="ff-ai-job-meta ff-ai-job-meta-compact"><label>Име на работа / поръчка<input value={session.job.name} onChange={(event) => setSession((current) => updateFacadeFlowJobMetadata(current, { name: event.target.value }))} placeholder={session.job.jobType === 'SINGLE_PRODUCT' ? 'Напр. W-01 / входна врата' : 'Напр. Къща Иванови / Обект А'}/></label><label>Референция / номер<input value={session.job.reference} onChange={(event) => setSession((current) => updateFacadeFlowJobMetadata(current, { reference: event.target.value }))} placeholder="По желание"/></label><div><span>Препоръчана структура</span><b>{selectedJob?.groupHint}</b></div></div>
        <ProjectStructureBuilder session={session} setSession={setSession}/>
        <div className="ff-ai-mode-switch-row"><span>Начин на работа</span><div className="ff-ai-input-switcher">{inputModes.map((mode) => { const item = FACADEFLOW_AI_INPUT_LABELS[mode]; const selected = session.job.inputMode === mode; return <button type="button" key={mode} className={selected ? 'selected' : ''} aria-pressed={selected} title={item.description} onClick={() => setSession((current) => selectFacadeFlowAiInputMode(current, mode))}><span className="ff-ai-input-icon"><FacadeFlowIcon name={inputIcons[mode]}/></span><strong>{item.title}</strong></button> })}</div></div>
      </>}

      {session.job.inputMode && <InputModePanel mode={session.job.inputMode} session={session} profiles={profiles} setSession={setSession} onOpenImportCenter={onOpenImportCenter} onOpenProductDesigner={onOpenProductDesigner} onOpenCustomCad={onOpenCustomCad} onOpenProfileCatalogue={onOpenProfileCatalogue}/>}
    </section>
    <ReviewColumn session={session} profiles={profiles} onReset={() => setSession((current) => resetFacadeFlowAiIntake(current))}/>
  </main>
}

function AiDemoSuite({ session, profiles, setSession }: { session: FacadeFlowAiSession; profiles: CatalogueProfile[]; setSession: (updater: (current: FacadeFlowAiSession) => FacadeFlowAiSession) => void }) {
  const active = session.job.demoScenario
  return <section className="ff-ai-demo-suite" aria-labelledby="ff-ai-demo-suite-title">
    <div className="ff-ai-demo-suite-head"><div><span>DEMO ЦЕНТЪР · ЦЯЛАТА AI СЕКЦИЯ</span><h3 id="ff-ai-demo-suite-title">Провери всеки режим без реални проектни данни</h3><p>Всяка станция зарежда само ясно означени DEMO стойности. Не се симулира реално качен файл, AI inference, проверка по правила или производствена готовност.</p></div><div><b>6 DEMO станции</b><span>4 режима · прозорец + врата · каталози</span><small>6/6 работни контекста остават достъпни в секция 01.</small></div></div>
    <div className="ff-ai-demo-suite-grid">{demoScenarios.map((scenario) => { const item = FACADEFLOW_AI_DEMO_SCENARIOS[scenario]; const selected = active === scenario; return <button type="button" key={scenario} className={selected ? 'selected' : ''} aria-pressed={selected} onClick={() => setSession((current) => applyFacadeFlowAiDemoScenario(current, scenario, profiles))}><span>{item.short}</span><strong>{item.title}</strong><small>{item.coverage}</small></button> })}</div>
    <div className="ff-ai-demo-contexts"><span>КОНТЕКСТИ:</span>{jobTypes.map((jobType) => <b key={jobType}>{FACADEFLOW_JOB_TYPE_LABELS[jobType].title}</b>)}<em>DEMO ONLY · SESSION ONLY · MACHINE READY: NO</em></div>
  </section>
}

function InputModePanel({ mode, session, profiles, setSession, onOpenImportCenter, onOpenProductDesigner, onOpenCustomCad, onOpenProfileCatalogue }: { mode: FacadeFlowAiInputMode; session: FacadeFlowAiSession; profiles: CatalogueProfile[]; setSession: (updater: (current: FacadeFlowAiSession) => FacadeFlowAiSession) => void; onOpenImportCenter: () => void; onOpenProductDesigner: () => void; onOpenCustomCad: () => void; onOpenProfileCatalogue: () => void }) {
  if (mode === 'DOCUMENTS') return <><section className="ff-ai-mode-panel ff-ai-document-mode"><div><span className="ff-ai-mode-label">ПРОЕКТ / ДОКУМЕНТИ · AI02</span><h3>Разчети проектни източници към Product Intent</h3><p>Качи проектния пакет локално. AI02 V1 извлича само доказуем текст, пази provenance и предлага позиции за Human Review. Сканиран текст, CAD геометрия и конфликтни стойности не се измислят.</p></div><div className="ff-ai-extract-grid"><span>Марка / позиция</span><span>Количество</span><span>Размери</span><span>Профилна система</span><span>Цвят</span><span>Отваряне</span><span>Дръжки / панти</span><span>Стъклопакет</span></div><ProjectDocumentIntelligencePanel profiles={profiles} setSession={setSession} onOpenImportCenter={onOpenImportCenter}/></section><GuidedAiProductBuilder session={session} profiles={profiles} setSession={setSession} onOpenProfileCatalogue={onOpenProfileCatalogue}/></>
  if (mode === 'DESCRIPTION') { const handoffReady = session.job.guidedProduct.status === 'HUMAN_CONFIRMED'; return <><GuidedAiProductBuilder session={session} profiles={profiles} setSession={setSession} onOpenProfileCatalogue={onOpenProfileCatalogue}/><section className="ff-ai-mode-panel ff-ai-free-description"><div><span className="ff-ai-mode-label">СВОБОДНО ОПИСАНИЕ / PROMPT INTELLIGENCE</span><h3>Опиши изделието с нормален език</h3><p>AI01 локалният interpreter разпознава изрично написани параметри и ги предлага за човешка проверка. Външен AI модел още не е свързан и липсващи стойности не се измислят.</p></div><label className="ff-ai-description-label">Допълнително описание<textarea rows={6} value={session.job.description} onChange={(event) => setSession((current) => updateFacadeFlowJobMetadata(current, { description: event.target.value }))} placeholder="Пример: прозорец W-17 2400x1500 mm, 3 полета, ляво fixed, средно tilt-turn, дясно fixed, система SYS-90, RAL 7016, троен стъклопакет, черна дръжка, 2 панти."/></label><PromptInterpretationPanel session={session} profiles={profiles} setSession={setSession}/><div className="ff-ai-mode-actions"><button type="button" className="primary-button" disabled={!handoffReady} title={!handoffReady ? 'Първо подготви и потвърди човешката чернова.' : undefined} onClick={onOpenProductDesigner}>{handoffReady ? 'Продължи към конструктора с данните' : 'Конструкторът чака Human Confirm'}</button><button type="button" onClick={onOpenCustomCad}>Отвори CAD без AI handoff</button></div>{!handoffReady && <small className="ff-ai-handoff-note">Преходът с данни се отключва само след HUMAN CONFIRMED. Няма автоматична геометрия.</small>}</section></> }
  if (mode === 'SKETCH') return <section className="ff-ai-mode-panel"><div><span className="ff-ai-mode-label">ПОМОЩ ПО СКИЦА</span><h3>Скица като доказателствен източник</h3><p>Качената скица остава непроменима. Бъдещият AI ще предлага контур и параметри, но няма да ги прилага без потвърждение.</p></div><div className="ff-ai-flow-line"><span>Скица</span><b>→</b><span>AI предложение</span><b>→</b><span>Човешка проверка</span><b>→</b><span>Правила</span><b>→</b><span>CAD</span></div><div className="ff-ai-mode-actions"><button type="button" className="primary-button" onClick={onOpenImportCenter}>Качи / отвори източник</button><button type="button" onClick={onOpenCustomCad}>Отвори CAD работна зона</button></div></section>
  return <section className="ff-ai-mode-panel"><div><span className="ff-ai-mode-label">РЪЧЕН РЕЖИМ</span><h3>FacadeFlow остава работещ и без AI</h3><p>Избери структурирания конструктор за прозорци/врати или нестандартната CAD работна зона. Това е постоянният ръчен резервен режим, ако AI не е подходящ за задачата.</p></div><div className="ff-ai-mode-actions"><button type="button" className="primary-button" onClick={onOpenProductDesigner}>Конструктор на изделие</button><button type="button" onClick={onOpenCustomCad}>Нестандартен CAD</button></div></section>
}

function ReviewColumn({ session, profiles, onReset }: { session: FacadeFlowAiSession; profiles: CatalogueProfile[]; onReset: () => void }) {
  const hasScope = Boolean(session.job.jobType), hasInput = Boolean(session.job.inputMode), hasDescription = Boolean(session.job.description.trim())
  const draft = session.job.guidedProduct
  const guidedProposal = session.job.products.find((product) => product.id === `${session.job.id}-guided-product`)
  const hasStructuredProposal = Boolean(guidedProposal)
  const demoReviewPacket = session.job.reviewPacket
  const demoPacketPrepared = Boolean(demoReviewPacket)
  const demoPacketReviewed = demoReviewPacket?.status === 'HUMAN_REVIEWED'
  const humanConfirmed = draft.status === 'HUMAN_CONFIRMED'
  const unresolved = guidedProductUnresolved(draft, profiles)
  const completion = guidedProductCompletion(draft, profiles)
  const profileCode = (id: string) => profiles.find((profile) => profile.id === id)?.code || ''
  const productType = draft.productType ? GUIDED_PRODUCT_TYPE_LABELS[draft.productType] : 'Не е избрано изделие'
  const system = effectiveGuidedProfileSystem(draft) || '—'
  const frame = profileCode(draft.frameProfileId) || draft.manualFrameProfile.trim() || '—'
  const sash = profileCode(draft.sashProfileId) || draft.manualSashProfile.trim() || '—'
  const mullion = profileCode(draft.mullionProfileId) || draft.manualMullionProfile.trim() || '—'
  const opening = draft.openingType ? GUIDED_OPENING_LABELS[draft.openingType] : '—'
  const reviewStatus = humanConfirmed ? 'ПОТВЪРДЕНО ОТ ЧОВЕК' : hasStructuredProposal ? 'НУЖЕН ЧОВЕШКИ ПРЕГЛЕД' : 'НЕПОТВЪРДЕНО'
  return <aside className="ff-ai-review-column">
    <section className="ff-ai-live-product" aria-live="polite">
      <div className="ff-ai-live-product-head"><div><span>ТЕКУЩО ИЗДЕЛИЕ</span><h3>{draft.name.trim() || productType}</h3></div><b className={humanConfirmed ? 'confirmed' : ''}>{reviewStatus}</b></div>
      <div className="ff-ai-live-dimensions"><strong>{draft.width || '—'} × {draft.height || '—'} mm</strong><span>Количество: {draft.quantity || '—'}</span></div>
      <dl><div><dt>Тип</dt><dd>{productType}</dd></div><div><dt>Система</dt><dd>{system}</dd></div><div><dt>Каса</dt><dd>{frame}</dd></div><div><dt>Крило</dt><dd>{sash}</dd></div><div><dt>Делител</dt><dd>{mullion}</dd></div><div><dt>Отваряемост</dt><dd>{opening}</dd></div><div><dt>Цвят</dt><dd>{draft.exteriorColor.trim() || '—'}</dd></div><div><dt>Стъкло / пълнеж</dt><dd>{draft.fillDescription.trim() || '—'}</dd></div></dl>
      <div className="ff-ai-live-progress"><span><i style={{ width: `${completion}%` }}/></span><small>{completion}% попълнено · {unresolved.length} неуточнени</small></div>
      <em>СИМУЛАЦИЯ · ГОТОВО ЗА МАШИНА: НЕ</em>
    </section>
    <div className="ff-ai-review-head"><span>AI → ЧОВЕШКА ПРОВЕРКА</span><h3>Подготовка и проверка</h3><p>Формулярът „Стъпка по стъпка“ изгражда проверима чернова. AI не избира липсващи стойности и не създава производствен изход.</p></div>
    <ol className="ff-ai-gate-list"><li className={hasScope ? 'done' : ''}><b>1</b><div><strong>Контекст на работата</strong><span>{hasScope ? FACADEFLOW_JOB_TYPE_LABELS[session.job.jobType!].title : session.job.demoScenario === 'KNOWLEDGE_BASE' ? 'Данни и каталози' : 'Не е избран'}</span></div></li><li className={hasInput || session.job.demoScenario === 'KNOWLEDGE_BASE' ? 'done' : ''}><b>2</b><div><strong>Източник / режим</strong><span>{hasInput ? FACADEFLOW_AI_INPUT_LABELS[session.job.inputMode!].title : session.job.demoScenario === 'KNOWLEDGE_BASE' ? 'База знания' : 'Не е избран'}</span></div></li><li className={demoPacketPrepared || hasStructuredProposal || (hasDescription && session.job.inputMode === 'DESCRIPTION') ? 'done' : ''}><b>3</b><div><strong>Обща структурирана спецификация</strong><span>{demoReviewPacket ? `DEMO пакет · ${demoReviewPacket.unresolved.length} неуточнени · AI ГЕНЕРИРАНО: НЕ` : hasStructuredProposal ? `Подготвено без AI автоматично извеждане · ${guidedProposal?.unresolved.length ?? 0} неуточнени` : 'Подготви общия пакет или продуктово предложение'}</span></div></li><li className={humanConfirmed || demoPacketReviewed ? 'done' : ''}><b>4</b><div><strong>Човешки преглед / потвърждение</strong><span>{humanConfirmed ? 'Изделието е потвърдено от човек' : demoPacketReviewed ? 'DEMO пакетът е прегледан от човек · изделието остава непотвърдено' : 'Задължително'}</span></div></li><li><b>5</b><div><strong>Проверка по правила</strong><span>Задължително — още не е изпълнена</span></div></li><li className={humanConfirmed ? 'ready' : ''}><b>6</b><div><strong>Преход към конструктора</strong><span>{humanConfirmed ? 'Готово за ръчен преход към конструктора · правилата остават задължителни' : demoPacketReviewed ? 'Остава заключено: прегледан пакет ≠ потвърдено изделие' : 'Заключено до човешко потвърждение'}</span></div></li></ol>
    <div className="ff-ai-review-rules"><h4>Никога не измисляме липсващо</h4><p>Неясните профили, панти, дръжки, стъкло, посоки и размери остават <b>НЕУТОЧНЕНИ</b>, докато човек или надежден източник не ги потвърди.</p></div>
    <div className="ff-ai-job-summary"><span>Текуща сесия{session.job.demoScenario ? ' · DEMO' : ''}</span><b>{session.job.name || 'Без име'}</b><small>{session.job.reference || 'Без референция'} · {intakeStatusLabels[session.job.intakeStatus]}</small></div>
    <button type="button" className="ff-ai-reset" onClick={onReset}>Нова AI подготовка</button>
  </aside>
}

function KnowledgeBase({ session, profiles, setSession, activeProfileCount, onOpenProfileCatalogue, demoActive }: { session: FacadeFlowAiSession; profiles: CatalogueProfile[]; setSession: (updater: (current: FacadeFlowAiSession) => FacadeFlowAiSession) => void; activeProfileCount: number; onOpenProfileCatalogue: () => void; demoActive: boolean }) {
  return <main className="ff-ai-kb">{demoActive && <><div className="ff-ai-kb-demo-banner"><b>DEMO СТАНЦИЯ · ДАННИ И КАТАЛОЗИ</b><span>Разглеждаш покритието на базата знания. Непопълнените инженерни секции остават нарочно без измислени стойности.</span></div><UnifiedDemoPipeline session={session} profiles={profiles} setSession={setSession} compact/></>}<div className="ff-ai-kb-heading"><div><span>ОСНОВА НА БАЗАТА ЗНАНИЯ</span><h3>Данните, които AI ще има право да използва</h3><p>AI няма да „помни“ производствени факти. Той ще проверява тази база, а правилата ще пазят източник и ревизия.</p></div><button type="button" className="primary-button" onClick={onOpenProfileCatalogue}>Отвори сегашния каталог на профилите</button></div><div className="ff-ai-kb-grid">{KNOWLEDGE_BASE_SECTIONS.map((section) => <article key={section.id}><div><span>{section.status === 'FOUNDATION' ? 'ОСНОВА Е НАЛИЦЕ' : 'НУЖНИ СА ТОЧНИ ДАННИ'}</span><h4>{section.title}</h4></div><p>{section.description}</p>{section.id === 'PROFILES' && <small>Активни / демонстрационни записи в текущия каталог: <b>{activeProfileCount}</b></small>}{section.id !== 'PROFILES' && <small>Няма да се попълва с измислени демонстрационни инженерни стойности.</small>}</article>)}</div><section className="ff-ai-kb-source-rule"><h4>Правило за проследимост</h4><code>ФАКТ → ИЗТОЧНИК → СТРАНИЦА / РЕД → РЕВИЗИЯ → ЧОВЕШКА ПРОВЕРКА</code><p>Пример: максимално тегло на крило = 130 kg → каталог на производителя → стр. 47 → рев. 2026-03.</p></section></main>
}
