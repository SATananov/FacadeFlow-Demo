import type { Dispatch, SetStateAction } from 'react'
import { FACADEFLOW_AI_INPUT_LABELS, FACADEFLOW_JOB_TYPE_LABELS, KNOWLEDGE_BASE_SECTIONS, resetFacadeFlowAiIntake, selectFacadeFlowAiInputMode, selectFacadeFlowJobType, setFacadeFlowAiView, updateFacadeFlowJobMetadata } from '../aiWorkspaceState'
import type { FacadeFlowAiInputMode, FacadeFlowAiSession, FacadeFlowJobType } from '../aiWorkspaceTypes'
import { AiBlueprintPreview } from './AiBlueprintPreview'
import { FacadeFlowIcon, type FacadeFlowIconName } from './FacadeFlowIcons'
import { FacadeFlowWorkspaceHeader } from './FacadeFlowWorkspaceHeader'

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

const jobIcons: Record<FacadeFlowJobType, FacadeFlowIconName> = { BUILDING: 'building', HOUSE: 'house', SMALL_PROJECT: 'small-project', SINGLE_PRODUCT: 'single-product', CUSTOM_ORDER: 'custom-order', TECHNICAL_DETAIL: 'technical-detail' }
const inputIcons: Record<FacadeFlowAiInputMode, FacadeFlowIconName> = { DOCUMENTS: 'documents', DESCRIPTION: 'description', SKETCH: 'sketch', MANUAL: 'manual' }
const jobCodes: Record<FacadeFlowJobType, string> = { BUILDING: 'СГРАДА', HOUSE: 'КЪЩА', SMALL_PROJECT: 'МАЛЪК ОБЕКТ', SINGLE_PRODUCT: 'ЕДИНИЧНО ИЗДЕЛИЕ', CUSTOM_ORDER: 'НЕСТАНДАРТНА ПОРЪЧКА', TECHNICAL_DETAIL: 'ТЕХНИЧЕСКИ ДЕТАЙЛ' }
const intakeStatusLabels: Record<FacadeFlowAiSession['job']['intakeStatus'], string> = { EMPTY: 'ПРАЗНО', SOURCE_CAPTURED: 'ИЗТОЧНИКЪТ Е ПРИЕТ', NEEDS_REVIEW: 'ИЗИСКВА ПРОВЕРКА', HUMAN_CONFIRMED: 'ПОТВЪРДЕНО ОТ ЧОВЕК' }

export function FacadeFlowAIWorkspace({ session, onSession, activeProfileCount, onClose, onOpenImportCenter, onOpenProductDesigner, onOpenCustomCad, onOpenProfileCatalogue }: Props) {
  const setSession = (updater: (current: FacadeFlowAiSession) => FacadeFlowAiSession) => onSession(updater)
  return <section className="ff-ai-workspace ff-section-workspace" role="dialog" aria-modal="true" aria-labelledby="ff-ai-title">
    <FacadeFlowWorkspaceHeader
      titleId="ff-ai-title"
      icon="ai"
      eyebrow="Интелигентна CAD работна зона"
      title="FacadeFlow AI"
      subtitle="От идея, документ или скица към проверена параметрична подготовка."
      onBack={onClose}
      actions={<button type="button" className={session.view === 'KNOWLEDGE_BASE' ? 'selected' : ''} onClick={() => setSession((current) => setFacadeFlowAiView(current, current.view === 'KNOWLEDGE_BASE' ? 'INTAKE' : 'KNOWLEDGE_BASE'))}><FacadeFlowIcon name="data"/><span>Данни и каталози</span></button>}
      className="ff-ai-unified-header"
    />
    <div className="ff-ai-safety"><b>AI моделът още не е свързан.</b> Няма автоматично генерирана геометрия, сървърна логика, мрежово изпращане или производствен изход. Всеки бъдещ AI резултат ще минава през човешка проверка и правила.</div>
    <StatusRail session={session}/>
    {session.view === 'KNOWLEDGE_BASE' ? <KnowledgeBase activeProfileCount={activeProfileCount} onOpenProfileCatalogue={onOpenProfileCatalogue}/> : <Intake session={session} setSession={setSession} onOpenImportCenter={onOpenImportCenter} onOpenProductDesigner={onOpenProductDesigner} onOpenCustomCad={onOpenCustomCad}/>}
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

function Intake({ session, setSession, onOpenImportCenter, onOpenProductDesigner, onOpenCustomCad }: { session: FacadeFlowAiSession; setSession: (updater: (current: FacadeFlowAiSession) => FacadeFlowAiSession) => void; onOpenImportCenter: () => void; onOpenProductDesigner: () => void; onOpenCustomCad: () => void }) {
  const selectedJob = session.job.jobType ? FACADEFLOW_JOB_TYPE_LABELS[session.job.jobType] : null
  return <main className="ff-ai-main">
    <section className="ff-ai-intake-column">
      <div className="ff-ai-launch-hero"><div><span className="ff-ai-launch-kicker">НОВА РАБОТА / AI ВХОД</span><h3>Какво искаш да подготвиш?</h3><p>Избери вида работа. FacadeFlow ще запази правилната структура — от една врата до цял обект — без да те кара да попълваш ненужни нива.</p></div><div className="ff-ai-launch-orbit" aria-hidden="true"><span>2D</span><span>AI</span><span>CAD</span><i/></div></div>
      <div className="ff-ai-section-heading"><span>01</span><div><h3>Избери работен контекст</h3><p>Всяка карта е различен вход към една и съща проверима логика за спецификация на изделието.</p></div></div>
      <div className="ff-ai-job-grid">{jobTypes.map((jobType) => { const item = FACADEFLOW_JOB_TYPE_LABELS[jobType]; const selected = session.job.jobType === jobType; return <button type="button" key={jobType} className={`ff-ai-job-card ${selected ? 'selected' : ''}`} aria-pressed={selected} onClick={() => setSession((current) => selectFacadeFlowJobType(current, jobType))}><span className="ff-ai-card-top"><span className="ff-ai-card-icon"><FacadeFlowIcon name={jobIcons[jobType]}/></span><span className="ff-ai-card-code">{jobCodes[jobType]}</span></span><span className="ff-ai-blueprint"><AiBlueprintPreview type={jobType}/></span><strong>{item.title}</strong><p>{item.description}</p><small><span>СТРУКТУРА</span>{item.groupHint}</small></button> })}</div>

      {session.job.jobType && <>
        <div className="ff-ai-job-meta"><label>Име на работа / поръчка<input value={session.job.name} onChange={(event) => setSession((current) => updateFacadeFlowJobMetadata(current, { name: event.target.value }))} placeholder={session.job.jobType === 'SINGLE_PRODUCT' ? 'Напр. Входна врата за клиент' : 'Напр. Къща Иванови / Обект А'}/></label><label>Референция / номер<input value={session.job.reference} onChange={(event) => setSession((current) => updateFacadeFlowJobMetadata(current, { reference: event.target.value }))} placeholder="По желание"/></label><div><span>Структура</span><b>{selectedJob?.groupHint}</b></div></div>
        <div className="ff-ai-section-heading compact"><span>02</span><div><h3>Как подаваме информацията?</h3><p>AI и ръчните инструменти използват една и съща бъдеща схема за спецификация на изделието.</p></div></div>
        <div className="ff-ai-input-grid">{inputModes.map((mode) => { const item = FACADEFLOW_AI_INPUT_LABELS[mode]; const selected = session.job.inputMode === mode; return <button type="button" key={mode} className={selected ? 'selected' : ''} aria-pressed={selected} onClick={() => setSession((current) => selectFacadeFlowAiInputMode(current, mode))}><span className="ff-ai-input-icon"><FacadeFlowIcon name={inputIcons[mode]}/></span><span><strong>{item.title}</strong><p>{item.description}</p></span><i aria-hidden="true">→</i></button> })}</div>
      </>}

      {session.job.inputMode && <InputModePanel mode={session.job.inputMode} session={session} setSession={setSession} onOpenImportCenter={onOpenImportCenter} onOpenProductDesigner={onOpenProductDesigner} onOpenCustomCad={onOpenCustomCad}/>}
    </section>
    <ReviewColumn session={session} onReset={() => setSession((current) => resetFacadeFlowAiIntake(current))}/>
  </main>
}

function InputModePanel({ mode, session, setSession, onOpenImportCenter, onOpenProductDesigner, onOpenCustomCad }: { mode: FacadeFlowAiInputMode; session: FacadeFlowAiSession; setSession: (updater: (current: FacadeFlowAiSession) => FacadeFlowAiSession) => void; onOpenImportCenter: () => void; onOpenProductDesigner: () => void; onOpenCustomCad: () => void }) {
  if (mode === 'DOCUMENTS') return <section className="ff-ai-mode-panel"><div><span className="ff-ai-mode-label">ПРОЕКТ / ИЗТОЧНИЦИ</span><h3>Разчети проектни източници</h3><p>Използваме сегашния център за импорт като доверена входна точка. В бъдещата AI фаза различни файлове ще могат да допринасят към едно изделие, но всяка стойност ще пази източник, страница и ревизия.</p></div><div className="ff-ai-extract-grid"><span>Етаж / зона</span><span>Марка и количество</span><span>Размери</span><span>Профилна система</span><span>Цвят</span><span>Отваряне</span><span>Дръжки / панти</span><span>Стъклопакет</span></div><button type="button" className="primary-button" onClick={onOpenImportCenter}>Отвори центъра за импорт</button></section>
  if (mode === 'DESCRIPTION') return <section className="ff-ai-mode-panel"><div><span className="ff-ai-mode-label">ОПИСАНИЕ С ЕСТЕСТВЕН ЕЗИК</span><h3>Опиши какво искаш</h3><p>Пиши свободно: размери, профили, делители, крила, посоки, панти, дръжки, стъкло, цвят и всичко специфично.</p></div><label className="ff-ai-description-label">Описание<textarea rows={8} value={session.job.description} onChange={(event) => setSession((current) => updateFacadeFlowJobMetadata(current, { description: event.target.value }))} placeholder="Пример: Нестандартна врата 2400 × 2200, ляв фикс 700 mm, дясно крило навън надясно, система ..., три панти, черна дръжка на 1050 mm, RAL 7016..."/></label><div className="ff-ai-disabled-action"><button type="button" disabled><FacadeFlowIcon name="ai"/> Разчети с AI</button><span>Ще се активира само след свързан модел и точна база знания.</span></div><div className="ff-ai-mode-actions"><button type="button" onClick={onOpenProductDesigner}>Продължи към конструктора</button><button type="button" onClick={onOpenCustomCad}>Отвори нестандартния CAD</button></div></section>
  if (mode === 'SKETCH') return <section className="ff-ai-mode-panel"><div><span className="ff-ai-mode-label">ПОМОЩ ПО СКИЦА</span><h3>Скица като доказателствен източник</h3><p>Качената скица остава непроменима. Бъдещият AI ще предлага контур и параметри, но няма да ги прилага без потвърждение.</p></div><div className="ff-ai-flow-line"><span>Скица</span><b>→</b><span>AI предложение</span><b>→</b><span>Човешка проверка</span><b>→</b><span>Правила</span><b>→</b><span>CAD</span></div><div className="ff-ai-mode-actions"><button type="button" className="primary-button" onClick={onOpenImportCenter}>Качи / отвори източник</button><button type="button" onClick={onOpenCustomCad}>Отвори CAD работна зона</button></div></section>
  return <section className="ff-ai-mode-panel"><div><span className="ff-ai-mode-label">РЪЧЕН РЕЖИМ</span><h3>FacadeFlow остава работещ и без AI</h3><p>Избери структурирания конструктор за прозорци/врати или нестандартната CAD работна зона. Това е постоянният ръчен резервен режим, ако AI не е подходящ за задачата.</p></div><div className="ff-ai-mode-actions"><button type="button" className="primary-button" onClick={onOpenProductDesigner}>Конструктор на изделие</button><button type="button" onClick={onOpenCustomCad}>Нестандартен CAD</button></div></section>
}

function ReviewColumn({ session, onReset }: { session: FacadeFlowAiSession; onReset: () => void }) {
  const hasScope = Boolean(session.job.jobType), hasInput = Boolean(session.job.inputMode), hasDescription = Boolean(session.job.description.trim())
  return <aside className="ff-ai-review-column"><div className="ff-ai-review-head"><span>AI → ЧОВЕШКА ПРОВЕРКА</span><h3>Подготовка и проверка</h3><p>Тук ще се появява разчетеното предложение преди да бъде позволено да стигне до геометрията.</p></div><ol className="ff-ai-gate-list"><li className={hasScope ? 'done' : ''}><b>1</b><div><strong>Контекст на работата</strong><span>{hasScope ? FACADEFLOW_JOB_TYPE_LABELS[session.job.jobType!].title : 'Не е избран'}</span></div></li><li className={hasInput ? 'done' : ''}><b>2</b><div><strong>Източник</strong><span>{hasInput ? FACADEFLOW_AI_INPUT_LABELS[session.job.inputMode!].title : 'Не е избран'}</span></div></li><li className={hasDescription && session.job.inputMode === 'DESCRIPTION' ? 'done' : ''}><b>3</b><div><strong>AI предложение</strong><span>{session.aiModelStatus === 'NOT_CONNECTED' ? 'Заключено — моделът не е свързан' : 'Предстои'}</span></div></li><li><b>4</b><div><strong>Човешко потвърждение</strong><span>Задължително</span></div></li><li><b>5</b><div><strong>Проверка по правила</strong><span>Задължително</span></div></li><li><b>6</b><div><strong>2D / 3D / CAD</strong><span>Само след потвърждение</span></div></li></ol><div className="ff-ai-review-rules"><h4>Никога не измисляме липсващо</h4><p>Неясните профили, панти, дръжки, стъкло, посоки и размери остават <b>НЕУТОЧНЕНИ</b>, докато човек или надежден източник не ги потвърди.</p></div><div className="ff-ai-job-summary"><span>Текуща сесия</span><b>{session.job.name || 'Без име'}</b><small>{session.job.reference || 'Без референция'} · {intakeStatusLabels[session.job.intakeStatus]}</small></div><button type="button" className="ff-ai-reset" onClick={onReset}>Нова AI подготовка</button></aside>
}

function KnowledgeBase({ activeProfileCount, onOpenProfileCatalogue }: { activeProfileCount: number; onOpenProfileCatalogue: () => void }) {
  return <main className="ff-ai-kb"><div className="ff-ai-kb-heading"><div><span>ОСНОВА НА БАЗАТА ЗНАНИЯ</span><h3>Данните, които AI ще има право да използва</h3><p>AI няма да „помни“ производствени факти. Той ще проверява тази база, а правилата ще пазят източник и ревизия.</p></div><button type="button" className="primary-button" onClick={onOpenProfileCatalogue}>Отвори сегашния каталог на профилите</button></div><div className="ff-ai-kb-grid">{KNOWLEDGE_BASE_SECTIONS.map((section) => <article key={section.id}><div><span>{section.status === 'FOUNDATION' ? 'ОСНОВА Е НАЛИЦЕ' : 'НУЖНИ СА ТОЧНИ ДАННИ'}</span><h4>{section.title}</h4></div><p>{section.description}</p>{section.id === 'PROFILES' && <small>Активни / демонстрационни записи в текущия каталог: <b>{activeProfileCount}</b></small>}{section.id !== 'PROFILES' && <small>Няма да се попълва с измислени демонстрационни инженерни стойности.</small>}</article>)}</div><section className="ff-ai-kb-source-rule"><h4>Правило за проследимост</h4><code>ФАКТ → ИЗТОЧНИК → СТРАНИЦА / РЕД → РЕВИЗИЯ → ЧОВЕШКА ПРОВЕРКА</code><p>Пример: максимално тегло на крило = 130 kg → каталог на производителя → стр. 47 → рев. 2026-03.</p></section></main>
}
