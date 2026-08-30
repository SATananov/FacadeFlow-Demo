import type { Dispatch, SetStateAction } from 'react'
import { FACADEFLOW_AI_INPUT_LABELS, FACADEFLOW_JOB_TYPE_LABELS, KNOWLEDGE_BASE_SECTIONS, resetFacadeFlowAiIntake, selectFacadeFlowAiInputMode, selectFacadeFlowJobType, setFacadeFlowAiView, updateFacadeFlowJobMetadata } from '../aiWorkspaceState'
import type { FacadeFlowAiInputMode, FacadeFlowAiSession, FacadeFlowJobType } from '../aiWorkspaceTypes'

interface Props {
  session: FacadeFlowAiSession
  onSession: Dispatch<SetStateAction<FacadeFlowAiSession>>
  activeProfileCount: number
  onClose: () => void
  onOpenImportCenter: () => void
  onOpenProductDesigner: () => void
  onOpenCustomCad: () => void
  onOpenProfileCatalogue: () => void
}

const jobTypes = Object.keys(FACADEFLOW_JOB_TYPE_LABELS) as FacadeFlowJobType[]
const inputModes = Object.keys(FACADEFLOW_AI_INPUT_LABELS) as FacadeFlowAiInputMode[]

const jobIcons: Record<FacadeFlowJobType, string> = { BUILDING: '▦', HOUSE: '⌂', SMALL_PROJECT: '▤', SINGLE_PRODUCT: '□', CUSTOM_ORDER: '◇', TECHNICAL_DETAIL: '⌖' }
const inputIcons: Record<FacadeFlowAiInputMode, string> = { DOCUMENTS: '▧', DESCRIPTION: '✦', SKETCH: '⌁', MANUAL: '⌨' }

export function FacadeFlowAIWorkspace({ session, onSession, activeProfileCount, onClose, onOpenImportCenter, onOpenProductDesigner, onOpenCustomCad, onOpenProfileCatalogue }: Props) {
  const setSession = (updater: (current: FacadeFlowAiSession) => FacadeFlowAiSession) => onSession(updater)
  return <section className="ff-ai-workspace" role="dialog" aria-modal="true" aria-labelledby="ff-ai-title">
    <header className="ff-ai-header">
      <div className="ff-ai-title-wrap"><span className="ff-ai-eyebrow">PHASE 06B.1 · AI-READY VISUAL SHELL</span><div><h2 id="ff-ai-title">✦ FacadeFlow AI</h2><p>Един вход за проектни документи, описание, скица, единични поръчки и технически детайли.</p></div></div>
      <div className="ff-ai-header-actions"><button type="button" className={session.view === 'KNOWLEDGE_BASE' ? 'selected' : ''} onClick={() => setSession((current) => setFacadeFlowAiView(current, current.view === 'KNOWLEDGE_BASE' ? 'INTAKE' : 'KNOWLEDGE_BASE'))}>▤ Данни и каталози</button><button type="button" onClick={onClose}>Назад към FacadeFlow</button></div>
    </header>
    <div className="ff-ai-safety"><b>AI моделът още не е свързан.</b> Няма автоматично генерирана геометрия, backend, мрежово изпращане или производствен изход. Всеки бъдещ AI резултат ще минава през човешка проверка и правила.</div>
    <StatusRail session={session}/>
    {session.view === 'KNOWLEDGE_BASE' ? <KnowledgeBase activeProfileCount={activeProfileCount} onOpenProfileCatalogue={onOpenProfileCatalogue}/> : <Intake session={session} setSession={setSession} onOpenImportCenter={onOpenImportCenter} onOpenProductDesigner={onOpenProductDesigner} onOpenCustomCad={onOpenCustomCad}/>}
  </section>
}

function StatusRail({ session }: { session: FacadeFlowAiSession }) {
  return <div className="ff-ai-status-rail" aria-label="Граници на AI работния поток">
    <span><i className="locked"/>AI модел: <b>НЕ Е СВЪРЗАН</b></span>
    <span><i/>Източници: <b>ЗАДЪЛЖИТЕЛНИ</b></span>
    <span><i/>Human review: <b>ЗАДЪЛЖИТЕЛЕН</b></span>
    <span><i/>Rules validation: <b>ЗАДЪЛЖИТЕЛЕН</b></span>
    <span><i className="locked"/>Machine ready: <b>{session.productionApproved ? 'ДА' : 'НЕ'}</b></span>
  </div>
}

function Intake({ session, setSession, onOpenImportCenter, onOpenProductDesigner, onOpenCustomCad }: { session: FacadeFlowAiSession; setSession: (updater: (current: FacadeFlowAiSession) => FacadeFlowAiSession) => void; onOpenImportCenter: () => void; onOpenProductDesigner: () => void; onOpenCustomCad: () => void }) {
  const selectedJob = session.job.jobType ? FACADEFLOW_JOB_TYPE_LABELS[session.job.jobType] : null
  return <main className="ff-ai-main">
    <section className="ff-ai-intake-column">
      <div className="ff-ai-section-heading"><span>01</span><div><h3>Каква работа подготвяме?</h3><p>„Проект“ не означава задължително сграда. Структурата е гъвкава и може да остане съвсем проста.</p></div></div>
      <div className="ff-ai-job-grid">{jobTypes.map((jobType) => { const item = FACADEFLOW_JOB_TYPE_LABELS[jobType]; const selected = session.job.jobType === jobType; return <button type="button" key={jobType} className={selected ? 'selected' : ''} aria-pressed={selected} onClick={() => setSession((current) => selectFacadeFlowJobType(current, jobType))}><span className="ff-ai-card-icon">{jobIcons[jobType]}</span><strong>{item.title}</strong><p>{item.description}</p><small>{item.groupHint}</small></button> })}</div>

      {session.job.jobType && <>
        <div className="ff-ai-job-meta"><label>Име на работа / поръчка<input value={session.job.name} onChange={(event) => setSession((current) => updateFacadeFlowJobMetadata(current, { name: event.target.value }))} placeholder={session.job.jobType === 'SINGLE_PRODUCT' ? 'Напр. Входна врата за клиент' : 'Напр. Къща Иванови / Building A'}/></label><label>Референция / номер<input value={session.job.reference} onChange={(event) => setSession((current) => updateFacadeFlowJobMetadata(current, { reference: event.target.value }))} placeholder="По желание"/></label><div><span>Структура</span><b>{selectedJob?.groupHint}</b></div></div>
        <div className="ff-ai-section-heading compact"><span>02</span><div><h3>Как подаваме информацията?</h3><p>AI и ръчните инструменти използват една и съща бъдеща Product Specification схема.</p></div></div>
        <div className="ff-ai-input-grid">{inputModes.map((mode) => { const item = FACADEFLOW_AI_INPUT_LABELS[mode]; const selected = session.job.inputMode === mode; return <button type="button" key={mode} className={selected ? 'selected' : ''} aria-pressed={selected} onClick={() => setSession((current) => selectFacadeFlowAiInputMode(current, mode))}><span>{inputIcons[mode]}</span><strong>{item.title}</strong><p>{item.description}</p></button> })}</div>
      </>}

      {session.job.inputMode && <InputModePanel mode={session.job.inputMode} session={session} setSession={setSession} onOpenImportCenter={onOpenImportCenter} onOpenProductDesigner={onOpenProductDesigner} onOpenCustomCad={onOpenCustomCad}/>}
    </section>
    <ReviewColumn session={session} onReset={() => setSession((current) => resetFacadeFlowAiIntake(current))}/>
  </main>
}

function InputModePanel({ mode, session, setSession, onOpenImportCenter, onOpenProductDesigner, onOpenCustomCad }: { mode: FacadeFlowAiInputMode; session: FacadeFlowAiSession; setSession: (updater: (current: FacadeFlowAiSession) => FacadeFlowAiSession) => void; onOpenImportCenter: () => void; onOpenProductDesigner: () => void; onOpenCustomCad: () => void }) {
  if (mode === 'DOCUMENTS') return <section className="ff-ai-mode-panel"><div><span className="ff-ai-mode-label">PROJECT / SOURCE INTELLIGENCE</span><h3>Разчети проектни източници</h3><p>Използваме сегашния Import Center като доверена входна точка. В бъдещата AI фаза различни файлове ще могат да допринасят към едно изделие, но всяка стойност ще пази източник, страница и ревизия.</p></div><div className="ff-ai-extract-grid"><span>Етаж / зона</span><span>Марка и количество</span><span>Размери</span><span>Профилна система</span><span>Цвят</span><span>Отваряне</span><span>Дръжки / панти</span><span>Стъклопакет</span></div><button type="button" className="primary-button" onClick={onOpenImportCenter}>Отвори Import Center</button></section>
  if (mode === 'DESCRIPTION') return <section className="ff-ai-mode-panel"><div><span className="ff-ai-mode-label">NATURAL LANGUAGE INTAKE</span><h3>Опиши какво искаш</h3><p>Пиши свободно: размери, профили, делители, крила, посоки, панти, дръжки, стъкло, цвят и всичко специфично.</p></div><label className="ff-ai-description-label">Описание<textarea rows={8} value={session.job.description} onChange={(event) => setSession((current) => updateFacadeFlowJobMetadata(current, { description: event.target.value }))} placeholder="Пример: Нестандартна врата 2400 × 2200, ляв фикс 700 mm, дясно крило навън надясно, система ..., три панти, черна дръжка на 1050 mm, RAL 7016..."/></label><div className="ff-ai-disabled-action"><button type="button" disabled>✦ Разчети с AI</button><span>Ще се активира само след свързан модел и точна Knowledge Base.</span></div><div className="ff-ai-mode-actions"><button type="button" onClick={onOpenProductDesigner}>Продължи към конструктора</button><button type="button" onClick={onOpenCustomCad}>Отвори нестандартния CAD</button></div></section>
  if (mode === 'SKETCH') return <section className="ff-ai-mode-panel"><div><span className="ff-ai-mode-label">SKETCH-ASSISTED</span><h3>Скица като доказателствен източник</h3><p>Качената скица остава непроменима. Бъдещият AI ще предлага контур и параметри, но няма да ги прилага без потвърждение.</p></div><div className="ff-ai-flow-line"><span>Скица</span><b>→</b><span>AI предложение</span><b>→</b><span>Human review</span><b>→</b><span>Rules</span><b>→</b><span>CAD</span></div><div className="ff-ai-mode-actions"><button type="button" className="primary-button" onClick={onOpenImportCenter}>Качи / отвори източник</button><button type="button" onClick={onOpenCustomCad}>Отвори CAD работна зона</button></div></section>
  return <section className="ff-ai-mode-panel"><div><span className="ff-ai-mode-label">MANUAL FALLBACK</span><h3>FacadeFlow остава работещ и без AI</h3><p>Избери структурирания конструктор за прозорци/врати или нестандартната CAD работна зона. Това е постоянният fallback, ако AI не е подходящ за задачата.</p></div><div className="ff-ai-mode-actions"><button type="button" className="primary-button" onClick={onOpenProductDesigner}>Конструктор на изделие</button><button type="button" onClick={onOpenCustomCad}>Нестандартен CAD</button></div></section>
}

function ReviewColumn({ session, onReset }: { session: FacadeFlowAiSession; onReset: () => void }) {
  const hasScope = Boolean(session.job.jobType), hasInput = Boolean(session.job.inputMode), hasDescription = Boolean(session.job.description.trim())
  return <aside className="ff-ai-review-column"><div className="ff-ai-review-head"><span>AI → HUMAN GATE</span><h3>Подготовка и проверка</h3><p>Тук ще се появява разчетеното предложение преди да бъде позволено да стигне до геометрията.</p></div><ol className="ff-ai-gate-list"><li className={hasScope ? 'done' : ''}><b>1</b><div><strong>Контекст на работата</strong><span>{hasScope ? FACADEFLOW_JOB_TYPE_LABELS[session.job.jobType!].title : 'Не е избран'}</span></div></li><li className={hasInput ? 'done' : ''}><b>2</b><div><strong>Източник</strong><span>{hasInput ? FACADEFLOW_AI_INPUT_LABELS[session.job.inputMode!].title : 'Не е избран'}</span></div></li><li className={hasDescription && session.job.inputMode === 'DESCRIPTION' ? 'done' : ''}><b>3</b><div><strong>AI предложение</strong><span>{session.aiModelStatus === 'NOT_CONNECTED' ? 'Заключено — моделът не е свързан' : 'Предстои'}</span></div></li><li><b>4</b><div><strong>Човешко потвърждение</strong><span>Задължително</span></div></li><li><b>5</b><div><strong>Rules validation</strong><span>Задължително</span></div></li><li><b>6</b><div><strong>2D / 3D / CAD</strong><span>Само след потвърждение</span></div></li></ol><div className="ff-ai-review-rules"><h4>Никога не измисляме липсващо</h4><p>Неясните профили, панти, дръжки, стъкло, посоки и размери остават <b>UNRESOLVED</b>, докато човек или надежден източник не ги потвърди.</p></div><div className="ff-ai-job-summary"><span>Текуща сесия</span><b>{session.job.name || 'Без име'}</b><small>{session.job.reference || 'Без референция'} · {session.job.intakeStatus}</small></div><button type="button" className="ff-ai-reset" onClick={onReset}>Нова AI подготовка</button></aside>
}

function KnowledgeBase({ activeProfileCount, onOpenProfileCatalogue }: { activeProfileCount: number; onOpenProfileCatalogue: () => void }) {
  return <main className="ff-ai-kb"><div className="ff-ai-kb-heading"><div><span>KNOWLEDGE BASE FOUNDATION</span><h3>Данните, които AI ще има право да използва</h3><p>AI няма да „помни“ производствени факти. Той ще пита тази база, а правилата ще пазят източник и ревизия.</p></div><button type="button" className="primary-button" onClick={onOpenProfileCatalogue}>Отвори сегашния каталог на профилите</button></div><div className="ff-ai-kb-grid">{KNOWLEDGE_BASE_SECTIONS.map((section) => <article key={section.id}><div><span>{section.status === 'FOUNDATION' ? 'ОСНОВА Е НАЛИЦЕ' : 'НУЖНИ СА ТОЧНИ ДАННИ'}</span><h4>{section.title}</h4></div><p>{section.description}</p>{section.id === 'PROFILES' && <small>Активни / демонстрационни записи в текущия каталог: <b>{activeProfileCount}</b></small>}{section.id !== 'PROFILES' && <small>Няма да се попълва с измислени демонстрационни инженерни стойности.</small>}</article>)}</div><section className="ff-ai-kb-source-rule"><h4>Правило за проследимост</h4><code>FACT → SOURCE → PAGE / ROW → REVISION → HUMAN REVIEW</code><p>Пример: максимално тегло на крило = 130 kg → каталог на производителя → стр. 47 → Rev. 2026-03.</p></section></main>
}
