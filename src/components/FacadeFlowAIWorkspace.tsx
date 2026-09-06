import { useState, type Dispatch, type SetStateAction } from 'react'
import { FACADEFLOW_AI_DEMO_SCENARIOS, FACADEFLOW_AI_INPUT_LABELS, FACADEFLOW_JOB_TYPE_LABELS, KNOWLEDGE_BASE_SECTIONS, applyFacadeFlowAiDemoScenario, applyFacadeFlowQuickStructuredSelection, resetFacadeFlowAiIntake, selectFacadeFlowAiInputMode, selectFacadeFlowJobType, setFacadeFlowAiView, updateFacadeFlowJobMetadata } from '../aiWorkspaceState'
import type { FacadeFlowAiDemoScenario, FacadeFlowAiInputMode, FacadeFlowAiSession, FacadeFlowJobType } from '../aiWorkspaceTypes'
import { GUIDED_OPENING_LABELS, GUIDED_PRODUCT_TYPE_LABELS, effectiveGuidedProfileSystem, guidedProductCompletion, guidedProductUnresolved } from '../aiGuidedProduct'
import type { CatalogueProfile } from '../profileCatalogueTypes'
import type { FacadeFlowAi03ParametricProposal } from '../aiParametricConstructionProposal'
import { interpretFacadeFlowPrompt } from '../aiPromptInterpreter'
import { AiBlueprintPreview } from './AiBlueprintPreview'
import { AiProductQuickStart } from './AiProductQuickStart'
import { AiWorkflowCoach } from './AiWorkflowCoach'
import { FacadeFlowIcon, type FacadeFlowIconName } from './FacadeFlowIcons'
import { FacadeFlowWorkspaceHeader } from './FacadeFlowWorkspaceHeader'
import { GuidedAiProductBuilder } from './GuidedAiProductBuilder'
import { ModuleCommandInteractiveRuntimePanel } from './ModuleCommandInteractiveRuntimePanel'
import { MultiModuleInteractiveRuntimePanel } from './MultiModuleInteractiveRuntimePanel'
import { OfferModulesInteractiveRuntimePanel } from './OfferModulesInteractiveRuntimePanel'
import type { FacadeFlowOfferWorkspaceUiSnapshot } from '../aiOfferWorkspaceUiSnapshot'
import { ModuleCommandLivePreviewPanel } from './ModuleCommandLivePreviewPanel'
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
  onOpenAi04Constructor: (proposal: FacadeFlowAi03ParametricProposal) => { ok: boolean; message: string }
}

const jobTypes = Object.keys(FACADEFLOW_JOB_TYPE_LABELS) as FacadeFlowJobType[]
const inputModes = Object.keys(FACADEFLOW_AI_INPUT_LABELS) as FacadeFlowAiInputMode[]
const demoScenarios = Object.keys(FACADEFLOW_AI_DEMO_SCENARIOS) as FacadeFlowAiDemoScenario[]

const jobIcons: Record<FacadeFlowJobType, FacadeFlowIconName> = { BUILDING: 'building', HOUSE: 'house', SMALL_PROJECT: 'small-project', SINGLE_PRODUCT: 'single-product', CUSTOM_ORDER: 'custom-order', TECHNICAL_DETAIL: 'technical-detail' }
const inputIcons: Record<FacadeFlowAiInputMode, FacadeFlowIconName> = { DOCUMENTS: 'documents', DESCRIPTION: 'description', SKETCH: 'sketch', MANUAL: 'manual' }
const intakeStatusLabels: Record<FacadeFlowAiSession['job']['intakeStatus'], string> = { EMPTY: 'ПРАЗНО', SOURCE_CAPTURED: 'ИЗТОЧНИКЪТ Е ПРИЕТ', NEEDS_REVIEW: 'ИЗИСКВА ПРОВЕРКА', HUMAN_CONFIRMED: 'ПОТВЪРДЕНО ОТ ЧОВЕК' }

export function FacadeFlowAIWorkspace({ session, onSession, activeProfileCount, profiles, onClose, onOpenImportCenter, onOpenProductDesigner, onOpenCustomCad, onOpenProfileCatalogue, onOpenAi04Constructor }: Props) {
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
    <div className="ff-ai-safety" data-legacy-safety="Няма автоматично приемане или handoff на геометрия"><b>AI моделът още не е свързан.</b> Локалният анализ може да генерира само концептуално параметрично предложение. Продължаването към конструктора е отделно изрично действие и е разрешено само за предложение, прегледано от човек. Няма автоматично приемане или прехвърляне на геометрия, сървърна логика, мрежово изпращане или производствен изход. Всеки резултат минава през човешка проверка и правила.</div>
    <StatusRail session={session}/>
    {session.view === 'KNOWLEDGE_BASE' ? <KnowledgeBase session={session} profiles={profiles} setSession={setSession} activeProfileCount={activeProfileCount} onOpenProfileCatalogue={onOpenProfileCatalogue} demoActive={session.job.demoScenario === 'KNOWLEDGE_BASE'}/> : <Intake session={session} profiles={profiles} setSession={setSession} onOpenImportCenter={onOpenImportCenter} onOpenProductDesigner={onOpenProductDesigner} onOpenCustomCad={onOpenCustomCad} onOpenProfileCatalogue={onOpenProfileCatalogue} onOpenAi04Constructor={onOpenAi04Constructor}/>}
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

function Intake({ session, profiles, setSession, onOpenImportCenter, onOpenProductDesigner, onOpenCustomCad, onOpenProfileCatalogue, onOpenAi04Constructor }: { session: FacadeFlowAiSession; profiles: CatalogueProfile[]; setSession: (updater: (current: FacadeFlowAiSession) => FacadeFlowAiSession) => void; onOpenImportCenter: () => void; onOpenProductDesigner: () => void; onOpenCustomCad: () => void; onOpenProfileCatalogue: () => void; onOpenAi04Constructor: (proposal: FacadeFlowAi03ParametricProposal) => { ok: boolean; message: string } }) {
  const selectedJob = session.job.jobType ? FACADEFLOW_JOB_TYPE_LABELS[session.job.jobType] : null
  const descriptionReady = Boolean(session.job.description.trim())
  const [descriptionCollapsed, setDescriptionCollapsed] = useState(false)
  const [primaryInputMode, setPrimaryInputMode] = useState<'QUICK' | 'AI_TEXT'>('QUICK')
  const [secondaryOpen, setSecondaryOpen] = useState(false)
  const [demoOpen, setDemoOpen] = useState(false)
  const [offerWorkspacePreview, setOfferWorkspacePreview] = useState<FacadeFlowOfferWorkspaceUiSnapshot | null>(null)
  const resetIntake = () => {
    setDescriptionCollapsed(false)
    setPrimaryInputMode('QUICK')
    setSecondaryOpen(false)
    setDemoOpen(false)
    setOfferWorkspacePreview(null)
    setSession((current) => resetFacadeFlowAiIntake(current))
  }

  const quickProfiles = session.job.quickProductIntent?.profiles
  const exactQuickProfileCodesComplete = Boolean(quickProfiles?.frame && quickProfiles?.sash && quickProfiles?.mullion)

  return <main className="ff-ai-main">
    <section className="ff-ai-intake-column">
      <AiWorkflowCoach mode={primaryInputMode} selectionApplied={descriptionCollapsed} hasQuickIntent={Boolean(session.job.quickProductIntent)} exactProfileCodesComplete={exactQuickProfileCodesComplete}/>
      <section className={`ff-ai-describe-first ${descriptionCollapsed ? 'is-compact' : ''}`} aria-labelledby="ff-ai-describe-first-title">
        <div className="ff-ai-describe-first-head"><div><span>01 · ОСНОВЕН AI ВХОД</span><h3 id="ff-ai-describe-first-title">Създай изделието</h3><p>Използвай бърз избор за стандартните случаи или свободно AI описание за нестандартните. Локалният интерпретатор разпознава само изрично зададеното; външен AI модел още не е свързан. И двата режима водят към един и същ структуриран FacadeFlow модел и задължителен Human Review.</p></div><div className="ff-ai-describe-first-flow"><b>БЪРЗ ИЗБОР / AI</b><i>→</i><b>AI ЧЕРТЕЖ</b><i>→</i><b>ИНСПЕКТОР НА ПРОФИЛ</b><i>→</i><b>ИЗМЕРВАТЕЛНИ ОПОРИ</b></div></div>
        {!descriptionCollapsed && <div className="ff-ai-primary-mode-tabs" role="tablist" aria-label="Начин за задаване на изделието"><button type="button" role="tab" aria-selected={primaryInputMode === 'QUICK'} className={primaryInputMode === 'QUICK' ? 'selected' : ''} onClick={() => setPrimaryInputMode('QUICK')}>⚡ Бърз избор</button><button type="button" role="tab" aria-selected={primaryInputMode === 'AI_TEXT'} className={primaryInputMode === 'AI_TEXT' ? 'selected' : ''} onClick={() => setPrimaryInputMode('AI_TEXT')}>✨ Опиши изделието с AI</button></div>}
        {!descriptionCollapsed ? primaryInputMode === 'QUICK' ? <AiProductQuickStart profiles={profiles} onApplyStructuredSelection={(selection) => { setSession((current) => applyFacadeFlowQuickStructuredSelection(current, selection)); setDescriptionCollapsed(true) }} onUseTextMode={() => setPrimaryInputMode('AI_TEXT')}/> : <label className="ff-ai-primary-description">Опиши прозореца, вратата или детайла<textarea rows={7} value={session.job.description} onChange={(event) => setSession((current) => updateFacadeFlowJobMetadata(current, { description: event.target.value }))} placeholder="Пример: прозорец PRELUDE 60, 1800 × 1400 mm, три полета. Средното е осово-откидно, лявото и дясното са фиксирани. Каса 482.30, крило 482.05, делители 482.21, двоен стъклопакет, черна дръжка, 2 панти."/></label> : <div className="ff-ai-description-compact-summary"><div><span>ИЗХОДНО ОПИСАНИЕ</span><p>{session.job.description}</p></div><div className="ff-ai-description-compact-actions"><button type="button" onClick={() => { setPrimaryInputMode('QUICK'); setDescriptionCollapsed(false) }}>Нов бърз избор</button><button type="button" onClick={() => { setPrimaryInputMode('AI_TEXT'); setDescriptionCollapsed(false) }}>Редактирай описанието</button></div></div>}
        <PromptInterpretationPanel session={session} profiles={profiles} setSession={setSession} onOpenAi04Constructor={onOpenAi04Constructor} onAnalysisComplete={(result) => { if (result.recognized.length > 0) setDescriptionCollapsed(true) }}/>
        {session.job.quickProductIntent ? <div className="ff-ai-direct-binding-note"><b>БЪРЗ ИЗБОР → STRUCTURED STATE</b><span>Текстовите parser/runtime панели са пропуснати, докато този директен Quick Select intent е активен. За свободна текстова корекция избери „Редактирай описанието“; при първата ръчна промяна директният intent се освобождава и NLP режимът поема.</span></div> : <>
          <ModuleCommandLivePreviewPanel sourceText={session.job.description} interpretationId={`${session.job.id}-module-editor`}/>
          <ModuleCommandInteractiveRuntimePanel sourceText={session.job.description} interpretationId={`${session.job.id}-interactive-runtime`}/>
          <MultiModuleInteractiveRuntimePanel sourceText={session.job.description} interpretationId={`${session.job.id}-multi-module-runtime`}/>
          <OfferModulesInteractiveRuntimePanel sourceText={session.job.description} interpretationId={`${session.job.id}-offer-modules-runtime`} onWorkspaceSnapshot={setOfferWorkspacePreview} onOpenProfileCatalogue={onOpenProfileCatalogue}/>
        </>}
        <div className="ff-ai-describe-safety"><span>{descriptionReady ? 'Изделието е подготвено като изходен текст за локално разчитане.' : 'Избери изделие или напиши описание, за да започне локалното разчитане.'}</span><b>АВТОМАТИЧНА ГЕОМЕТРИЯ: НЕ · ПРАВИЛА ВАЛИДИРАНИ: НЕ · ГОТОВО ЗА МАШИНА: НЕ</b></div>
      </section>

      <section className={`ff-ai-secondary-setup ${secondaryOpen ? 'is-open' : 'is-collapsed'}`} aria-labelledby="ff-ai-secondary-setup-title">
        <div className="ff-ai-collapsible-heading"><div className="ff-ai-section-heading compact"><span>02</span><div><h3 id="ff-ai-secondary-setup-title">Контекст и други входове</h3><p>Организационен слой за обект/позиция, документи, скица или ръчна работа. Не блокира основното AI описание.</p></div></div><button type="button" onClick={() => setSecondaryOpen((value) => !value)} aria-expanded={secondaryOpen}>{secondaryOpen ? 'Свий' : 'Разгъни'}</button></div>
        {secondaryOpen && <div className="ff-ai-collapsible-body">
          <div className="ff-ai-context-strip" role="group" aria-label="Работен контекст">{jobTypes.map((jobType) => { const item = FACADEFLOW_JOB_TYPE_LABELS[jobType]; const selected = session.job.jobType === jobType; return <button type="button" key={jobType} className={`ff-ai-job-card ${selected ? 'selected' : ''}`} aria-pressed={selected} onClick={() => setSession((current) => selectFacadeFlowAiInputMode(selectFacadeFlowJobType(current, jobType), 'DESCRIPTION'))}><span className="ff-ai-context-icon"><FacadeFlowIcon name={jobIcons[jobType]}/></span><span><strong>{item.title}</strong><small>{item.groupHint}</small></span><span className="ff-ai-context-blueprint" aria-hidden="true"><AiBlueprintPreview type={jobType}/></span></button> })}</div>

          {session.job.jobType && <>
            <div className="ff-ai-job-meta ff-ai-job-meta-compact"><label>Име на работа / поръчка<input value={session.job.name} onChange={(event) => setSession((current) => updateFacadeFlowJobMetadata(current, { name: event.target.value }))} placeholder={session.job.jobType === 'SINGLE_PRODUCT' ? 'Напр. W-01 / входна врата' : 'Напр. Къща Иванови / Обект А'}/></label><label>Референция / номер<input value={session.job.reference} onChange={(event) => setSession((current) => updateFacadeFlowJobMetadata(current, { reference: event.target.value }))} placeholder="По желание"/></label><div><span>Препоръчана структура</span><b>{selectedJob?.groupHint}</b></div></div>
            <ProjectStructureBuilder session={session} setSession={setSession}/>
            <div className="ff-ai-mode-switch-row"><span>Начин на работа</span><div className="ff-ai-input-switcher">{inputModes.map((mode) => { const item = FACADEFLOW_AI_INPUT_LABELS[mode]; const selected = session.job.inputMode === mode; return <button type="button" key={mode} className={selected ? 'selected' : ''} aria-pressed={selected} title={item.description} onClick={() => setSession((current) => selectFacadeFlowAiInputMode(current, mode))}><span className="ff-ai-input-icon"><FacadeFlowIcon name={inputIcons[mode]}/></span><strong>{item.title}</strong></button> })}</div></div>
          </>}

          {session.job.inputMode && <InputModePanel mode={session.job.inputMode} session={session} profiles={profiles} setSession={setSession} onOpenImportCenter={onOpenImportCenter} onOpenProductDesigner={onOpenProductDesigner} onOpenCustomCad={onOpenCustomCad} onOpenProfileCatalogue={onOpenProfileCatalogue} onOpenAi04Constructor={onOpenAi04Constructor}/>}
        </div>}
      </section>

      <section className={`ff-ai-demo-collapsible ${demoOpen ? 'is-open' : ''}`}>
        <button type="button" className="ff-ai-demo-collapsible-toggle" onClick={() => setDemoOpen((value) => !value)} aria-expanded={demoOpen}><span><b>ДЕМО ЦЕНТЪР</b><small>Тестови станции и унифициран demo pipeline</small></span><strong>{demoOpen ? 'Свий' : 'Разгъни'}</strong></button>
        {demoOpen && <div className="ff-ai-demo-collapsible-body"><AiDemoSuite session={session} profiles={profiles} setSession={setSession}/><UnifiedDemoPipeline session={session} profiles={profiles} setSession={setSession}/></div>}
      </section>
    </section>
    <ReviewColumn session={session} profiles={profiles} offerWorkspacePreview={offerWorkspacePreview} onReset={resetIntake}/>
  </main>
}

function AiDemoSuite({ session, profiles, setSession }: { session: FacadeFlowAiSession; profiles: CatalogueProfile[]; setSession: (updater: (current: FacadeFlowAiSession) => FacadeFlowAiSession) => void }) {
  const active = session.job.demoScenario
  return <section className="ff-ai-demo-suite" aria-labelledby="ff-ai-demo-suite-title">
    <div className="ff-ai-demo-suite-head"><div><span>ДЕМО ЦЕНТЪР · ЦЯЛАТА AI СЕКЦИЯ</span><h3 id="ff-ai-demo-suite-title">Провери всеки режим без реални проектни данни</h3><p>Всяка станция зарежда само ясно означени ДЕМО стойности. Не се симулира реално качен файл, автоматично AI извеждане, проверка по правила или производствена готовност.</p></div><div><b>6 ДЕМО станции</b><span>4 режима · прозорец + врата · каталози</span><small>6/6 работни контекста остават достъпни в секция 01.</small></div></div>
    <div className="ff-ai-demo-suite-grid">{demoScenarios.map((scenario) => { const item = FACADEFLOW_AI_DEMO_SCENARIOS[scenario]; const selected = active === scenario; return <button type="button" key={scenario} className={selected ? 'selected' : ''} aria-pressed={selected} onClick={() => setSession((current) => applyFacadeFlowAiDemoScenario(current, scenario, profiles))}><span>{item.short}</span><strong>{item.title}</strong><small>{item.coverage}</small></button> })}</div>
    <div className="ff-ai-demo-contexts"><span>КОНТЕКСТИ:</span>{jobTypes.map((jobType) => <b key={jobType}>{FACADEFLOW_JOB_TYPE_LABELS[jobType].title}</b>)}<em>САМО ДЕМО · САМО В ТЕКУЩАТА СЕСИЯ · ГОТОВО ЗА МАШИНА: НЕ</em></div>
  </section>
}

function InputModePanel({ mode, session, profiles, setSession, onOpenImportCenter, onOpenProductDesigner, onOpenCustomCad, onOpenProfileCatalogue, onOpenAi04Constructor }: { mode: FacadeFlowAiInputMode; session: FacadeFlowAiSession; profiles: CatalogueProfile[]; setSession: (updater: (current: FacadeFlowAiSession) => FacadeFlowAiSession) => void; onOpenImportCenter: () => void; onOpenProductDesigner: () => void; onOpenCustomCad: () => void; onOpenProfileCatalogue: () => void; onOpenAi04Constructor: (proposal: FacadeFlowAi03ParametricProposal) => { ok: boolean; message: string } }) {
  if (mode === 'DOCUMENTS') return <><section className="ff-ai-mode-panel ff-ai-document-mode"><div><span className="ff-ai-mode-label">ПРОЕКТНИ ДОКУМЕНТИ · ЛОКАЛНО РАЗЧИТАНЕ</span><h3>Разчети проектните източници към структурирани продуктови данни</h3><p>Качи проектния пакет локално. Локалното разчитане извлича само доказуем текст, пази проследимостта и предлага позиции за човешка проверка. Сканиран текст, CAD геометрия и конфликтни стойности не се измислят.</p></div><div className="ff-ai-extract-grid"><span>Марка / позиция</span><span>Количество</span><span>Размери</span><span>Профилна система</span><span>Цвят</span><span>Отваряне</span><span>Дръжки / панти</span><span>Стъклопакет</span></div><ProjectDocumentIntelligencePanel profiles={profiles} setSession={setSession} onOpenImportCenter={onOpenImportCenter} onOpenAi04Constructor={onOpenAi04Constructor}/></section><GuidedAiProductBuilder session={session} profiles={profiles} setSession={setSession} onOpenProfileCatalogue={onOpenProfileCatalogue}/></>
  if (mode === 'DESCRIPTION') { const handoffReady = session.job.guidedProduct.status === 'HUMAN_CONFIRMED'; return <><section className="ff-ai-mode-panel ff-ai-description-context-note"><div><span className="ff-ai-mode-label">ОПИСАНИЕТО ВЕЧЕ Е ОСНОВНИЯТ ВХОД</span><h3>Структуриран формуляр за човешка корекция</h3><p>Разчитането и AI drawing са по-горе. Този формуляр остава като прецизен слой за човешка проверка за корекции, допълване и потвърждение на стойности.</p></div><div className="ff-ai-mode-actions"><button type="button" onClick={onOpenCustomCad}>Отвори CAD без прехвърляне на AI данни</button><button type="button" className="primary-button" disabled={!handoffReady} title={!handoffReady ? 'Първо подготви и потвърди човешката чернова.' : undefined} onClick={onOpenProductDesigner}>{handoffReady ? 'Продължи към конструктора с данните' : 'Конструкторът чака човешко потвърждение'}</button></div></section><GuidedAiProductBuilder session={session} profiles={profiles} setSession={setSession} onOpenProfileCatalogue={onOpenProfileCatalogue}/>{!handoffReady && <small className="ff-ai-handoff-note">Преходът с данни се отключва само след човешко потвърждение. Няма автоматична геометрия.</small>}</> }
  if (mode === 'SKETCH') return <section className="ff-ai-mode-panel"><div><span className="ff-ai-mode-label">ПОМОЩ ПО СКИЦА</span><h3>Скица като доказателствен източник</h3><p>Качената скица остава непроменима. Бъдещият AI ще предлага контур и параметри, но няма да ги прилага без потвърждение.</p></div><div className="ff-ai-flow-line"><span>Скица</span><b>→</b><span>AI предложение</span><b>→</b><span>Човешка проверка</span><b>→</b><span>Правила</span><b>→</b><span>CAD</span></div><div className="ff-ai-mode-actions"><button type="button" className="primary-button" onClick={onOpenImportCenter}>Качи / отвори източник</button><button type="button" onClick={onOpenCustomCad}>Отвори CAD работна зона</button></div></section>
  return <section className="ff-ai-mode-panel"><div><span className="ff-ai-mode-label">РЪЧЕН РЕЖИМ</span><h3>FacadeFlow остава работещ и без AI</h3><p>Избери структурирания конструктор за прозорци/врати или нестандартната CAD работна зона. Това е постоянният ръчен резервен режим, ако AI не е подходящ за задачата.</p></div><div className="ff-ai-mode-actions"><button type="button" className="primary-button" onClick={onOpenProductDesigner}>Конструктор на изделие</button><button type="button" onClick={onOpenCustomCad}>Нестандартен CAD</button></div></section>
}

function ReviewColumn({ session, profiles, offerWorkspacePreview, onReset }: { session: FacadeFlowAiSession; profiles: CatalogueProfile[]; offerWorkspacePreview: FacadeFlowOfferWorkspaceUiSnapshot | null; onReset: () => void }) {
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
  const quickIntent = session.job.quickProductIntent ?? null
  const promptResult = !quickIntent && hasDescription ? interpretFacadeFlowPrompt(session.job.description.replace(/\s+/g, ' ').trim(), `${session.job.id}-sidebar-preview`) : null
  const promptIntent = promptResult?.validForHumanReview && promptResult.recognized.length > 0 ? promptResult.intent : null
  const draftHasValues = Boolean(draft.productType || draft.width || draft.height || draft.frameProfileId || draft.manualFrameProfile.trim() || draft.openingType || draft.fillDescription.trim())
  const useOfferPreview = Boolean(offerWorkspacePreview?.moduleNumber)
  const useQuickPreview = Boolean(quickIntent && !useOfferPreview)
  const usePromptPreview = Boolean(promptIntent && !draftHasValues && !useOfferPreview && !useQuickPreview)
  const previewIntent = useQuickPreview ? quickIntent : usePromptPreview ? promptIntent : null

  const previewCategoryLabel = previewIntent?.category === 'WINDOW' ? 'Прозорец' : previewIntent?.category === 'DOOR' ? 'Врата' : previewIntent?.category === 'COMBINED' ? 'Плъзгаща / комбинирана конструкция' : previewIntent?.category === 'FACADE' ? 'Фасаден елемент' : 'AI предложение'
  const previewOpeningLabel = previewIntent?.fields.length ? previewIntent.fields.map((field) => {
    if (field.role === 'FIXED') return 'Фиксирано'
    if (field.role === 'SLIDING_SASH') return field.openingDirection === 'LEFT' ? 'Плъзгащо наляво' : field.openingDirection === 'RIGHT' ? 'Плъзгащо надясно' : 'Плъзгащо'
    if (field.role === 'PANEL') return 'Панел'
    if (field.openingType === 'TILT_TURN') return field.openingDirection === 'LEFT' ? 'Ос.-откидно ляво' : field.openingDirection === 'RIGHT' ? 'Ос.-откидно дясно' : 'Ос.-откидно'
    if (field.openingType === 'TURN') return field.openingDirection === 'LEFT' ? 'Отваряемо ляво' : field.openingDirection === 'RIGHT' ? 'Отваряемо дясно' : 'Отваряемо'
    if (field.openingType === 'TILT') return 'Откидно'
    return field.role === 'OPENING_SASH' ? 'Отваряемо' : 'Неуточнено'
  }).join(' | ') : '—'

  const productType = useOfferPreview ? `Офертен модул ${offerWorkspacePreview!.moduleNumber}` : previewIntent ? previewCategoryLabel : draft.productType ? GUIDED_PRODUCT_TYPE_LABELS[draft.productType] : 'Не е избрано изделие'
  const system = useOfferPreview ? offerWorkspacePreview?.system || '—' : previewIntent ? previewIntent.profiles.system || '—' : effectiveGuidedProfileSystem(draft) || '—'
  const frame = useOfferPreview ? offerWorkspacePreview?.frameSummary || '—' : previewIntent ? previewIntent.profiles.frame || '—' : profileCode(draft.frameProfileId) || draft.manualFrameProfile.trim() || '—'
  const sash = useOfferPreview ? offerWorkspacePreview?.sashSummary || '—' : previewIntent ? previewIntent.profiles.sash || '—' : profileCode(draft.sashProfileId) || draft.manualSashProfile.trim() || '—'
  const mullion = useOfferPreview ? offerWorkspacePreview?.dividerSummary || '—' : previewIntent ? previewIntent.profiles.mullion || '—' : profileCode(draft.mullionProfileId) || draft.manualMullionProfile.trim() || '—'
  const opening = useOfferPreview ? offerWorkspacePreview?.openingSummary || '—' : previewIntent ? previewOpeningLabel : draft.openingType ? GUIDED_OPENING_LABELS[draft.openingType] : '—'
  const width = useOfferPreview ? offerWorkspacePreview?.widthMm : previewIntent ? previewIntent.dimensions.widthMm : draft.width
  const height = useOfferPreview ? offerWorkspacePreview?.heightMm : previewIntent ? previewIntent.dimensions.heightMm : draft.height
  const quantity = useOfferPreview ? offerWorkspacePreview?.quantity ?? '—' : previewIntent ? previewIntent.quantity ?? '—' : draft.quantity || '—'
  const color = useOfferPreview ? offerWorkspacePreview?.finish || '—' : previewIntent ? previewIntent.finish.exterior || previewIntent.finish.interior || '—' : draft.exteriorColor.trim() || '—'
  const glazing = useOfferPreview ? offerWorkspacePreview?.glazing || '—' : previewIntent ? previewIntent.glazing.description || '—' : draft.fillDescription.trim() || '—'
  const liveName = useOfferPreview ? `Модул ${offerWorkspacePreview!.moduleNumber} · офертна чернова` : previewIntent ? previewIntent.name?.trim() || previewIntent.mark?.trim() || previewCategoryLabel : draft.name.trim() || productType
  const promptCompletion = promptResult ? Math.round((promptResult.recognized.length / Math.max(1, promptResult.recognized.length + promptResult.unresolved.length)) * 100) : 0
  const quickCompletion = quickIntent ? Math.round(((4 + quickIntent.fields.length) / Math.max(1, 4 + quickIntent.fields.length + quickIntent.unresolved.length)) * 100) : 0
  const offerCompletion = offerWorkspacePreview?.totalChecks ? Math.round((offerWorkspacePreview.completeChecks / offerWorkspacePreview.totalChecks) * 100) : 0
  const liveCompletion = useOfferPreview ? offerCompletion : useQuickPreview ? quickCompletion : usePromptPreview ? promptCompletion : completion
  const liveUnresolved = useOfferPreview ? offerWorkspacePreview?.unresolvedChecks ?? 0 : useQuickPreview ? quickIntent?.unresolved.length || 0 : usePromptPreview ? promptResult?.unresolved.length || 0 : unresolved.length
  const reviewStatus = useOfferPreview ? offerWorkspacePreview?.reviewStatus === 'HUMAN_CONFIRMED' ? 'ПОТВЪРДЕНО ОТ ЧОВЕК · САМО ЗА ПРЕГЛЕД' : offerWorkspacePreview?.reviewStatus === 'READY_FOR_HUMAN_REVIEW' ? 'ОФЕРТНА ЧЕРНОВА · ГОТОВА ЗА ПРЕГЛЕД' : 'ОФЕРТНА ЧЕРНОВА · НЕПЪЛНА' : humanConfirmed ? 'ПОТВЪРДЕНО ОТ ЧОВЕК' : useQuickPreview ? 'БЪРЗ ИЗБОР · СТРУКТУРИРАНО · ЗА ПРОВЕРКА' : usePromptPreview ? 'AI РАЗЧЕТ · ЗА ПРОВЕРКА' : hasStructuredProposal ? 'НУЖЕН ЧОВЕШКИ ПРЕГЛЕД' : 'НЕПОТВЪРДЕНО'
  const sourceReady = hasInput || hasDescription || session.job.demoScenario === 'KNOWLEDGE_BASE'
  const structuredReady = useOfferPreview || demoPacketPrepared || hasStructuredProposal || Boolean(quickIntent) || Boolean(promptIntent) || (hasDescription && session.job.inputMode === 'DESCRIPTION')

  return <aside className="ff-ai-review-column">
    <section className={`ff-ai-live-product ${useQuickPreview || usePromptPreview || useOfferPreview ? 'from-prompt' : ''}`} aria-live="polite">
      <div className="ff-ai-live-product-head"><div><span>{useOfferPreview ? 'ТЕКУЩА ОФЕРТНА ЧЕРНОВА' : useQuickPreview ? 'ТЕКУЩ СТРУКТУРИРАН БЪРЗ ИЗБОР' : usePromptPreview ? 'ТЕКУЩ AI РАЗЧЕТ' : 'ТЕКУЩО ИЗДЕЛИЕ'}</span><h3>{liveName}</h3></div><b className={humanConfirmed ? 'confirmed' : useQuickPreview || usePromptPreview || useOfferPreview ? 'preview' : ''}>{reviewStatus}</b></div>
      <div className="ff-ai-live-dimensions"><strong>{width || '—'} × {height || '—'} mm</strong><span>Количество: {quantity}</span></div>
      <dl><div><dt>Тип</dt><dd>{productType}</dd></div><div><dt>Система</dt><dd>{system}</dd></div><div><dt>{useOfferPreview ? 'Каса / размер' : 'Каса'}</dt><dd>{frame}</dd></div><div><dt>Крило</dt><dd>{sash}</dd></div><div><dt>Делител</dt><dd>{mullion}</dd></div><div><dt>Отваряемост</dt><dd>{opening}</dd></div><div><dt>Цвят</dt><dd>{color}</dd></div><div><dt>Стъкло / пълнеж</dt><dd>{glazing}</dd></div></dl>
      <div className="ff-ai-live-progress"><span><i style={{ width: `${liveCompletion}%` }}/></span><small>{useOfferPreview ? `${offerWorkspacePreview?.completeChecks ?? 0}/${offerWorkspacePreview?.totalChecks ?? 0} проверки готови · ${liveUnresolved} изискват внимание` : useQuickPreview ? `${quickIntent?.fields.length || 0} полета директно структурирани · ${liveUnresolved} неуточнени` : usePromptPreview ? `${promptResult?.recognized.length || 0} разпознати · ${liveUnresolved} неуточнени` : `${liveCompletion}% попълнено · ${liveUnresolved} неуточнени`}</small></div>
      {useOfferPreview && <small className="ff-ai-live-source-note">Синхронизирано от активната работна зона за офертата. Това е само чернова за човешки преглед и не отключва правила, машина или производствен изход.</small>}{useQuickPreview && <small className="ff-ai-live-source-note">Показано директно от Canonical Product Intent, създаден от Quick Select. NLP повторно разчитане: НЕ. Изисква Human Review.</small>}{usePromptPreview && <small className="ff-ai-live-source-note">Показано директно от текущия AI разчет. Това не е човешко потвърждение и не прехвърля автоматично стойности към формуляра.</small>}
      <em>СИМУЛАЦИЯ · ГОТОВО ЗА МАШИНА: НЕ</em>
    </section>
    <div className="ff-ai-review-head"><span>AI → ЧОВЕШКА ПРОВЕРКА</span><h3>Подготовка и проверка</h3><p>AI разчетът и формулярът изграждат проверима чернова. Липсващи стойности не се измислят и производствен изход не се създава автоматично.</p></div>
    <ol className="ff-ai-gate-list"><li className={hasScope ? 'done' : ''}><b>1</b><div><strong>Контекст на работата</strong><span>{hasScope ? FACADEFLOW_JOB_TYPE_LABELS[session.job.jobType!].title : 'По желание на този етап'}</span></div></li><li className={sourceReady ? 'done' : ''}><b>2</b><div><strong>Източник / режим</strong><span>{hasInput ? FACADEFLOW_AI_INPUT_LABELS[session.job.inputMode!].title : hasDescription ? 'Описание · основен AI вход' : session.job.demoScenario === 'KNOWLEDGE_BASE' ? 'База знания' : 'Не е избран'}</span></div></li><li className={structuredReady ? 'done' : ''}><b>3</b><div><strong>Обща структурирана спецификация</strong><span>{demoReviewPacket ? `ДЕМО пакет · ${demoReviewPacket.unresolved.length} неуточнени · AI ГЕНЕРИРАНО: НЕ` : useQuickPreview ? `Quick Select intent · ${quickIntent?.fields.length || 0} полета · NLP reparse: НЕ · ${liveUnresolved} неуточнени` : usePromptPreview ? `AI разчет · ${promptResult?.recognized.length || 0} разпознати · ${liveUnresolved} неуточнени` : hasStructuredProposal ? `Подготвено без AI автоматично извеждане · ${guidedProposal?.unresolved.length ?? 0} неуточнени` : 'Подготви общия пакет или продуктово предложение'}</span></div></li><li className={humanConfirmed || demoPacketReviewed ? 'done' : ''}><b>4</b><div><strong>Човешки преглед / потвърждение</strong><span>{humanConfirmed ? 'Изделието е потвърдено от човек' : demoPacketReviewed ? 'ДЕМО пакетът е прегледан от човек · изделието остава непотвърдено' : 'Задължително'}</span></div></li><li><b>5</b><div><strong>Проверка по правила</strong><span>Задължително — още не е изпълнена</span></div></li><li className={humanConfirmed ? 'ready' : ''}><b>6</b><div><strong>Преход към конструктора</strong><span>{humanConfirmed ? 'Готово за ръчен преход към конструктора · правилата остават задължителни' : 'Заключено до човешко потвърждение'}</span></div></li></ol>
    <div className="ff-ai-review-rules"><h4>Никога не измисляме липсващо</h4><p>Неясните профили, панти, дръжки, стъкло, посоки и размери остават <b>НЕУТОЧНЕНИ</b>, докато човек или надежден източник не ги потвърди.</p></div>
    <div className="ff-ai-job-summary"><span>Текуща сесия{session.job.demoScenario ? ' · ДЕМО' : ''}</span><b>{session.job.name || (useQuickPreview || usePromptPreview ? liveName : 'Без име')}</b><small>{session.job.reference || 'Без референция'} · {useQuickPreview ? 'QUICK SELECT INTENT · ЗА ПРЕГЛЕД' : usePromptPreview ? 'AI РАЗЧЕТЪТ Е ПРИЕТ ЗА ПРЕГЛЕД' : intakeStatusLabels[session.job.intakeStatus]}</small></div>
    <button type="button" className="ff-ai-reset" onClick={onReset}>Нова AI подготовка</button>
  </aside>
}

function KnowledgeBase({ session, profiles, setSession, activeProfileCount, onOpenProfileCatalogue, demoActive }: { session: FacadeFlowAiSession; profiles: CatalogueProfile[]; setSession: (updater: (current: FacadeFlowAiSession) => FacadeFlowAiSession) => void; activeProfileCount: number; onOpenProfileCatalogue: () => void; demoActive: boolean }) {
  return <main className="ff-ai-kb">{demoActive && <><div className="ff-ai-kb-demo-banner"><b>ДЕМО СТАНЦИЯ · ДАННИ И КАТАЛОЗИ</b><span>Разглеждаш покритието на базата знания. Непопълнените инженерни секции остават нарочно без измислени стойности.</span></div><UnifiedDemoPipeline session={session} profiles={profiles} setSession={setSession} compact/></>}<div className="ff-ai-kb-heading"><div><span>ОСНОВА НА БАЗАТА ЗНАНИЯ</span><h3>Данните, които AI ще има право да използва</h3><p>AI няма да „помни“ производствени факти. Той ще проверява тази база, а правилата ще пазят източник и ревизия.</p></div><button type="button" className="primary-button" onClick={onOpenProfileCatalogue}>Отвори сегашния каталог на профилите</button></div><div className="ff-ai-kb-grid">{KNOWLEDGE_BASE_SECTIONS.map((section) => <article key={section.id}><div><span>{section.status === 'FOUNDATION' ? 'ОСНОВА Е НАЛИЦЕ' : 'НУЖНИ СА ТОЧНИ ДАННИ'}</span><h4>{section.title}</h4></div><p>{section.description}</p>{section.id === 'PROFILES' && <small>Активни / демонстрационни записи в текущия каталог: <b>{activeProfileCount}</b></small>}{section.id !== 'PROFILES' && <small>Няма да се попълва с измислени демонстрационни инженерни стойности.</small>}</article>)}</div><section className="ff-ai-kb-source-rule"><h4>Правило за проследимост</h4><code>ФАКТ → ИЗТОЧНИК → СТРАНИЦА / РЕД → РЕВИЗИЯ → ЧОВЕШКА ПРОВЕРКА</code><p>Пример: максимално тегло на крило = 130 kg → каталог на производителя → стр. 47 → рев. 2026-03.</p></section></main>
}
