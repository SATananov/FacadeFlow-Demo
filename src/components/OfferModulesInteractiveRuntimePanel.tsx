import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import {
  applyFacadeFlowOfferCompletenessReviewCommand,
  clearFacadeFlowOfferCompletenessReviewRuntime,
  createFacadeFlowOfferCompletenessReviewRuntime,
  type FacadeFlowCompletenessCheck,
} from '../aiPromptOfferCompletenessReviewRuntime'
import type { FacadeFlowOfferSettings } from '../aiPromptOfferModulesRuntime'
import { GuidedAiCommandBuilder, type FacadeFlowGuidedPreset } from './GuidedAiCommandBuilder'
import type { FacadeFlowGuidedSettingField } from '../aiGuidedCommandBuilder'
import { buildFacadeFlowOfferWorkspaceUiSnapshot, type FacadeFlowOfferWorkspaceUiSnapshot } from '../aiOfferWorkspaceUiSnapshot'
import { NADEZHDA_OFFER_ISSUER, createEmptyFacadeFlowOfferCustomer, facadeFlowOfferCustomerReady } from '../aiOfferPartyDetails'
import { OfferPartyDetailsPanel } from './OfferPartyDetailsPanel'
import { OfferModuleQuickSelect } from './OfferModuleQuickSelect'
import { createFacadeFlowHumanAuditDemoState } from '../aiOfferHumanAuditDemoState'
import { calculateFacadeFlowOfferModulePreviewMaxWidthPx } from '../aiOfferModulePreviewSizing'

function settingsRows(settings: FacadeFlowOfferSettings) {
  return [
    ['Система', settings.system],
    ['Цвят', settings.finish],
    ['Стъклопакет', settings.glazing],
    ['Обков', settings.hardware],
    ['Дръжка', settings.handle],
    ['Панти', settings.hinges],
    ['Брой панти', settings.hingeQuantity === undefined ? undefined : String(settings.hingeQuantity)],
  ] as const
}

const guidedSettingFieldByLabel: Partial<Record<string, FacadeFlowGuidedSettingField>> = {
  Система: 'system',
  Цвят: 'finish',
  Стъклопакет: 'glazing',
  Обков: 'hardware',
  Дръжка: 'handle',
  Панти: 'hinges',
}

function checkLabel(check: FacadeFlowCompletenessCheck) {
  if (check.status === 'COMPLETE') return check.value ?? 'ГОТОВО'
  if (check.status === 'REVIEW_REQUIRED') return 'ИЗИСКВА УТОЧНЕНИЕ'
  return 'ЛИПСВА'
}


function reviewStatusLabel(status: string | null | undefined) {
  if (status === 'HUMAN_CONFIRMED') return 'ПОТВЪРДЕН ОТ ЧОВЕК'
  if (status === 'READY_FOR_HUMAN_REVIEW') return 'ГОТОВ ЗА ЧОВЕШКИ ПРЕГЛЕД'
  return 'НЕПЪЛЕН'
}

function eventKindLabel(kind: string | null | undefined) {
  const labels: Record<string, string> = {
    OFFER_COMMAND: 'КОМАНДА КЪМ ОФЕРТАТА',
    COMPLETENESS_QUERY: 'ПРОВЕРКА ЗА ПЪЛНОТА',
    HUMAN_CONFIRM_MODULE: 'ЧОВЕШКО ПОТВЪРЖДЕНИЕ НА МОДУЛ',
    HUMAN_CONFIRM_ALL_READY: 'ПОТВЪРЖДЕНИЕ НА ГОТОВИТЕ МОДУЛИ',
    UNRESOLVED: 'НЕУТОЧНЕНА КОМАНДА',
  }
  return kind ? labels[kind] ?? 'ОПЕРАЦИЯ' : '—'
}

function eventStatusLabel(status: string | null | undefined) {
  if (status === 'APPLIED') return 'ПРИЛОЖЕНО'
  if (status === 'REVIEW_REQUIRED') return 'ИЗИСКВА УТОЧНЕНИЕ'
  if (status === 'EMPTY') return 'ПРАЗНА СЕСИЯ'
  return status ? 'ОБРАБОТЕНО' : '—'
}

function isOfferWorkspaceSource(sourceText: string) {
  return /(?:оферта|offer)/iu.test(sourceText)
}

export function OfferModulesInteractiveRuntimePanel({ sourceText, interpretationId = 'offer-modules-runtime', onWorkspaceSnapshot, onOpenProfileCatalogue }: {
  sourceText: string
  interpretationId?: string
  onWorkspaceSnapshot?: (snapshot: FacadeFlowOfferWorkspaceUiSnapshot | null) => void
  onOpenProfileCatalogue?: () => void
}) {
  const [runtime, setRuntime] = useState(() => createFacadeFlowOfferCompletenessReviewRuntime(sourceText, interpretationId))
  const [draftCommand, setDraftCommand] = useState('')
  const [guidedPreset, setGuidedPreset] = useState<FacadeFlowGuidedPreset | null>(null)
  const [moduleStepHelpOpen, setModuleStepHelpOpen] = useState(false)
  const guidedBuilderRef = useRef<HTMLDivElement | null>(null)
  const moduleStepRef = useRef<HTMLDivElement | null>(null)
  const finalReviewRef = useRef<HTMLElement | null>(null)
  const [selectedModuleNumber, setSelectedModuleNumber] = useState<number | null>(
    runtime.commercialRuntime.offerRuntime.multiModule.activeModuleNumber,
  )
  const [customerDetails, setCustomerDetails] = useState(() =>
    createEmptyFacadeFlowOfferCustomer(runtime.commercialRuntime.offerRuntime.customerName ?? ''),
  )

  useEffect(() => {
    const next = createFacadeFlowOfferCompletenessReviewRuntime(sourceText, interpretationId)
    setRuntime(next)
    setSelectedModuleNumber(next.commercialRuntime.offerRuntime.multiModule.activeModuleNumber)
    setCustomerDetails(createEmptyFacadeFlowOfferCustomer(next.commercialRuntime.offerRuntime.customerName ?? ''))
  }, [sourceText, interpretationId])

  const commercial = runtime.commercialRuntime
  const offer = commercial.offerRuntime
  const multiModule = offer.multiModule
  const selectedNumber = multiModule.modules.some((entry) => entry.moduleNumber === selectedModuleNumber)
    ? selectedModuleNumber
    : multiModule.activeModuleNumber
  const selectedEntry = multiModule.modules.find((entry) => entry.moduleNumber === selectedNumber) ?? null
  const selectedSettings = offer.moduleSettings.find((entry) => entry.moduleNumber === selectedNumber) ?? null
  const selectedQuantity = commercial.moduleQuantities.find((entry) => entry.moduleNumber === selectedNumber) ?? null
  const selectedReview = runtime.moduleReviews.find((entry) => entry.moduleNumber === selectedNumber) ?? null
  const frame = selectedEntry?.runtime.currentFrame ?? null
  const hasFrameGeometry = Boolean(frame?.frameWidthMm && frame.frameHeightMm && frame.cells.length > 0)
  const aspectRatio = frame?.frameWidthMm && frame.frameHeightMm ? `${frame.frameWidthMm} / ${frame.frameHeightMm}` : '16 / 9'
  const modulePreviewMaxWidthPx = calculateFacadeFlowOfferModulePreviewMaxWidthPx(frame?.frameWidthMm, frame?.frameHeightMm)

  useEffect(() => {
    if (!onWorkspaceSnapshot) return
    if (!isOfferWorkspaceSource(sourceText) && multiModule.modules.length === 0) {
      onWorkspaceSnapshot(null)
      return
    }
    onWorkspaceSnapshot(buildFacadeFlowOfferWorkspaceUiSnapshot(runtime, selectedNumber))
  }, [multiModule.modules.length, onWorkspaceSnapshot, runtime.visibleStateKey, selectedNumber, sourceText])

  const loadHumanAuditDemo = () => {
    const demo = createFacadeFlowHumanAuditDemoState(`${interpretationId}-qa-demo`)
    setRuntime(demo.runtime)
    setCustomerDetails(demo.customer)
    setSelectedModuleNumber(demo.selectedModuleNumber)
    setDraftCommand('')
    setGuidedPreset(null)
    window.setTimeout(() => finalReviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  const qaDemoBar = import.meta.env.DEV ? <div className="ff-human-audit-demo-bar">
    <div><span>QA · САМО ЗА ТЕСТ</span><strong>Демо за финален човешки преглед</strong><small>Зарежда автоматично проверения пример и те отвежда директно до Стъпка 4. Не променя production safety.</small></div>
    <button type="button" onClick={loadHumanAuditDemo}>▶ Зареди QA демо</button>
  </div> : null

  if (!isOfferWorkspaceSource(sourceText) && multiModule.modules.length === 0) {
    if (!import.meta.env.DEV) return null
    return <section className="ff-offer-modules-runtime ff-offer-qa-entry" aria-label="QA демо за човешки преглед">{qaDemoBar}</section>
  }

  const applyCommandText = (rawCommand: string) => {
    const command = rawCommand.trim()
    if (!command) return
    setRuntime((current) => {
      const next = applyFacadeFlowOfferCompletenessReviewCommand(current, command)
      setSelectedModuleNumber(next.commercialRuntime.offerRuntime.multiModule.activeModuleNumber)
      return next
    })
    setDraftCommand('')
  }

  const applyCommand = () => applyCommandText(draftCommand)

  const applyCommandSequence = (commands: string[], moduleNumber: number) => {
    if (!commands.length) return
    setRuntime((current) => commands.reduce((next, command) => applyFacadeFlowOfferCompletenessReviewCommand(next, command), current))
    setSelectedModuleNumber(moduleNumber)
    setDraftCommand('')
    setGuidedPreset(null)
  }

  const reloadSource = () => {
    const next = createFacadeFlowOfferCompletenessReviewRuntime(sourceText, interpretationId)
    setRuntime(next)
    setSelectedModuleNumber(next.commercialRuntime.offerRuntime.multiModule.activeModuleNumber)
    setCustomerDetails(createEmptyFacadeFlowOfferCustomer(next.commercialRuntime.offerRuntime.customerName ?? ''))
  }

  const clearSession = () => {
    setRuntime((current) => clearFacadeFlowOfferCompletenessReviewRuntime(current))
    setDraftCommand('')
    setSelectedModuleNumber(null)
    setGuidedPreset(null)
    setCustomerDetails(createEmptyFacadeFlowOfferCustomer())
  }

  const confirmModule = (moduleNumber: number) => {
    setRuntime((current) => applyFacadeFlowOfferCompletenessReviewCommand(current, `Потвърди Модул ${moduleNumber}`))
  }

  const returnToModuleCorrection = () => {
    requestAnimationFrame(() => moduleStepRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const guidedContext = {
    activeModuleNumber: multiModule.activeModuleNumber,
    moduleNumbers: multiModule.modules.map((entry) => entry.moduleNumber),
    cells: frame?.cells.map((cell) => ({ id: cell.id, hasSash: cell.hasSash })) ?? [],
    dividerIds: frame?.dividers.map((divider) => divider.id) ?? [],
    unresolvedCellIds: selectedReview?.unresolvedCellIds ?? [],
  }

  const scrollToGuidedBuilder = () => {
    requestAnimationFrame(() => guidedBuilderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const presetGuidedAction = (action: FacadeFlowGuidedPreset['action'], cellId?: number) => {
    setGuidedPreset({ nonce: Date.now(), action, cellId: cellId ?? null, moduleNumber: selectedNumber })
    scrollToGuidedBuilder()
  }

  const presetModuleAction = (moduleNumber: number, action: FacadeFlowGuidedPreset['action']) => {
    setSelectedModuleNumber(moduleNumber)
    setGuidedPreset({
      nonce: Date.now(),
      action,
      moduleNumber,
      sourceModuleNumber: action === 'COPY_MODULE' ? moduleNumber : null,
    })
    scrollToGuidedBuilder()
  }

  const openModule = (moduleNumber: number) => {
    applyCommandText(`Отвори Модул ${moduleNumber}`)
  }

  const presetGuidedSetting = (scope: 'OFFER' | 'MODULE', field: FacadeFlowGuidedSettingField) => {
    setGuidedPreset({ nonce: Date.now(), action: scope === 'OFFER' ? 'SET_OFFER_SETTING' : 'SET_MODULE_SETTING', moduleNumber: selectedNumber, settingField: field })
  }

  return <section className="ff-offer-modules-runtime" aria-label="Интегрирана оферта, модули, количества и човешки преглед">
    {qaDemoBar}
    <header className="ff-offer-modules-runtime-head">
      <div>
        <span>РАБОТНА ЗОНА ЗА ОФЕРТА · AI ПОМОЩНИК</span>
        <h4>Оферта → общи настройки → модули → бройки → човешки преглед</h4>
        <p>Всичко се пази в една обща работна сесия: настройки на офертата, състояние на модулите, количества и проверки за пълнота.</p>
      </div>
      <div className="ff-offer-modules-runtime-actions">
        <button type="button" onClick={reloadSource}>Зареди описанието</button>
        <button type="button" className="danger" onClick={clearSession}>Създай нова оферта</button>
      </div>
    </header>

    <div className="ff-offer-workflow-strip" aria-label="Основни стъпки">
      <span className="active"><b>1</b> Страни по офертата</span>
      <span><b>2</b> Общи настройки</span>
      <span><b>3</b> Модули и бройки</span>
      <span><b>4</b> Човешки преглед</span>
    </div>

    <OfferPartyDetailsPanel customer={customerDetails} onCustomerChange={setCustomerDetails}/>

    <div className="ff-offer-defaults">
      <div className="ff-offer-defaults-title"><b>СТЪПКА 2 ОТ 4 · ОБЩИ НАСТРОЙКИ</b><span>ревизия {offer.defaultsRevision}</span></div>
      <div className="ff-offer-defaults-grid">{settingsRows(offer.defaults).map(([label, value]) => { const field = guidedSettingFieldByLabel[label]; return <span key={label}><b>{label}</b><strong>{value ?? 'НЕУТОЧНЕНО'}</strong>{field && <button type="button" className="ff-edit-setting-button" onClick={() => presetGuidedSetting('OFFER', field)}>✎ Редактирай</button>}</span> })}</div>
      <small>{customerDetails.name ? `Възложител: ${customerDetails.name}` : 'Възложител: неуточнен'}{offer.offerReference ? ` · Оферта: ${offer.offerReference}` : ''}</small>
    </div>

    <div className={`ff-offer-modules-last ${runtime.lastCommandStatus === 'REVIEW_REQUIRED' ? 'review' : ''}`}>
      <span><b>АКТИВЕН МОДУЛ</b>{multiModule.activeModuleNumber === null ? '—' : `Модул ${multiModule.activeModuleNumber}`}</span>
      <span><b>ПОСЛЕДНА ОПЕРАЦИЯ</b>{eventKindLabel(runtime.lastCommandKind)}</span>
      <span><b>СТАТУС</b>{runtime.lastCommandStatus === 'REVIEW_REQUIRED' ? 'ИЗИСКВА УТОЧНЕНИЕ' : runtime.lastCommandStatus === 'APPLIED' ? 'ПРИЛОЖЕНА КЪМ ЧЕРНОВАТА' : 'ПРАЗНА СЕСИЯ'}</span>
      <span><b>ПРИЧИНА</b>{runtime.lastCommandReason ?? '—'}</span>
    </div>

    <div ref={moduleStepRef} className="ff-offer-step-heading ff-module-step-heading">
      <span className="ff-offer-step-number">СТЪПКА 3 ОТ 4</span>
      <b>МОДУЛИ И БРОЙКИ</b>
      <small>Всеки отделен прозорец, врата или друго изделие се добавя като модул. Работи директно от тази секция — не е нужно да търсиш помощника нагоре.</small>
      <div className="ff-module-help-wrap">
        <button type="button" className="ff-offer-help-button" aria-label="Какво е модул?" aria-expanded={moduleStepHelpOpen} onClick={() => setModuleStepHelpOpen((open) => !open)}>?</button>
        {moduleStepHelpOpen && <span className="ff-offer-help-popover"><b>Какво е модул?</b><br/>Модул е отделен прозорец, врата или друго изделие в офертата. Всеки модул има собствен размер, количество, разделение, клетки и отваряемост.</span>}
      </div>
    </div>

    <OfferModuleQuickSelect
      existingModuleNumbers={multiModule.modules.map((entry) => entry.moduleNumber)}
      offerDefaults={offer.defaults}
      onApplyPlan={applyCommandSequence}
      onUseGuidedEditor={scrollToGuidedBuilder}
    />

    <div ref={guidedBuilderRef} className="ff-guided-ai-anchor ff-guided-ai-anchor-secondary">
      <GuidedAiCommandBuilder
        context={guidedContext}
        offerDefaults={offer.defaults}
        activeSettings={selectedSettings?.effective ?? null}
        preset={guidedPreset}
        onApplyCommand={applyCommandText}
        onPrepareCommand={setDraftCommand}
        onOpenCatalogues={onOpenProfileCatalogue}
      />
    </div>

    <details className="ff-free-command-details">
      <summary>Разширен режим: свободно писане</summary>
      <p>Използвай това само ако предпочиташ да напишеш команда с думи. За начинаещи препоръчваме водения AI помощник и Бърз избор; свободното писане остава само за разширен режим.</p>
      <form className="ff-offer-modules-command-bar" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); applyCommand() }}>
        <label>Свободна команда<input value={draftCommand} onChange={(event: ChangeEvent<HTMLInputElement>) => setDraftCommand(event.target.value)} placeholder={multiModule.activeModuleNumber ? `Пример: Раздели Модул ${multiModule.activeModuleNumber} вертикално на 3 равни части` : 'Пример: Модул 1, 3 броя, каса 2100 х 1400 mm'}/></label>
        <button type="submit" disabled={!draftCommand.trim()}>Приложи</button>
      </form>
    </details>

    <div className="ff-commercial-summary-cards">
      <span><b>МОДУЛИ</b><strong>{runtime.summary.moduleCount}</strong></span>
      <span><b>ПЪЛНИ</b><strong>{runtime.summary.completeModules}</strong></span>
      <span><b>ПОТВЪРДЕНИ ОТ ЧОВЕК</b><strong>{runtime.summary.confirmedModules}</strong></span>
      <span className={runtime.summary.moduleCount === 0 ? 'empty' : runtime.summary.incompleteModules ? 'review' : 'complete'}><b>ОБЩО ИЗДЕЛИЯ</b><strong>{runtime.summary.moduleCount === 0 ? 0 : runtime.summary.totalQuantity ?? 'НЕПЪЛНО'}</strong>{runtime.summary.moduleCount === 0 && <small>Още няма добавени модули.</small>}</span>
    </div>

    {multiModule.modules.length === 0 ? <div className="ff-module-zero-state">
      <div><span>НЯМА ДОБАВЕНИ МОДУЛИ</span><strong>Започни с първия прозорец или врата в офертата.</strong><p>Натисни бутона и воденият помощник ще се отвори директно на „Създай нов модул“.</p></div>
      <button type="button" className="ff-module-primary-action" onClick={() => presetGuidedAction('CREATE_MODULE')}>＋ Създай първи модул</button>
    </div> : <div className="ff-module-list" aria-label="Модули в офертата">
      {multiModule.modules.map((entry) => {
        const active = entry.moduleNumber === selectedNumber
        const quantity = commercial.moduleQuantities.find((item) => item.moduleNumber === entry.moduleNumber)
        const review = runtime.moduleReviews.find((item) => item.moduleNumber === entry.moduleNumber)
        const moduleFrame = entry.runtime.currentFrame
        return <article className={`ff-module-list-card ${active ? 'active' : ''}`} key={entry.moduleNumber}>
          <button type="button" className="ff-module-list-main" onClick={() => setSelectedModuleNumber(entry.moduleNumber)}>
            <span><strong>Модул {entry.moduleNumber}</strong><small>{moduleFrame?.frameWidthMm && moduleFrame?.frameHeightMm ? `${moduleFrame.frameWidthMm} × ${moduleFrame.frameHeightMm} mm` : 'Размерът не е зададен'}</small></span>
            <span><b>{quantity?.effectiveQuantity === null || quantity?.effectiveQuantity === undefined ? 'бр. ?' : `${quantity.effectiveQuantity} бр.`}</b><em>{reviewStatusLabel(review?.status)}</em></span>
          </button>
          <div className="ff-module-list-actions">
            <button type="button" onClick={() => openModule(entry.moduleNumber)}>Отвори</button>
            <button type="button" onClick={() => presetModuleAction(entry.moduleNumber, 'SET_FRAME')}>✎ Редактирай</button>
            <button type="button" onClick={() => presetModuleAction(entry.moduleNumber, 'COPY_MODULE')}>Копирай</button>
          </div>
        </article>
      })}
      <button type="button" className="ff-module-add-action" onClick={() => presetGuidedAction('CREATE_MODULE')}>＋ Добави модул</button>
    </div>}

    {selectedSettings ? <div className="ff-offer-modules-layout">
      <div className="ff-offer-module-settings">
        <b>ЕФЕКТИВНИ НАСТРОЙКИ · МОДУЛ {selectedSettings.moduleNumber}</b>
        <div>{settingsRows(selectedSettings.effective).map(([label, value]) => {
          const field = guidedSettingFieldByLabel[label]
          const overridden = field ? selectedSettings.overrideFields.includes(field as never) : false
          return <span key={label} className={overridden ? 'override' : 'inherited'}><b>{label}</b><strong>{value ?? 'НЕУТОЧНЕНО'}</strong><small>{overridden ? 'ЛОКАЛНА ПРОМЯНА' : 'НАСЛЕДЕНО'}</small>{field && <button type="button" className="ff-edit-setting-button" onClick={() => presetGuidedSetting('MODULE', field)}>✎ Редактирай</button>}</span>
        })}</div>
        <span><b>Количество</b><strong>{selectedQuantity?.effectiveQuantity ?? 'НЕУТОЧНЕНО'}</strong><small>ОФЕРТНА СТОЙНОСТ</small></span>
      </div>

      {hasFrameGeometry && frame ? <div className="ff-offer-module-stage-wrap">
        <div className="ff-offer-module-stage" style={{ aspectRatio, maxWidth: modulePreviewMaxWidthPx ? `${modulePreviewMaxWidthPx}px` : undefined }} aria-label={`Модул ${selectedSettings.moduleNumber}; ${frame.cells.length} активни клетки`}>
          {frame.cells.map((cell) => {
            const disposition = selectedReview?.cellDispositions.find((entry) => entry.cellId === cell.id)?.status ?? (cell.hasSash ? 'SASH' : 'UNRESOLVED')
            return <span key={cell.id} className={`ff-offer-module-cell ${cell.hasSash ? 'has-sash' : ''} ${disposition === 'FIXED' ? 'is-fixed' : disposition === 'UNRESOLVED' ? 'is-unresolved' : ''}`} style={{ left: `${cell.leftPct}%`, top: `${cell.topPct}%`, width: `${cell.widthPct}%`, height: `${cell.heightPct}%` }}><strong>{cell.label}</strong><small>{cell.widthMm} × {cell.heightMm}</small>{cell.sashLabel ? <em>{cell.sashLabel}</em> : disposition === 'FIXED' ? <em>ФИКСИРАНО</em> : <em className="unresolved">НЕУТОЧНЕНО</em>}</span>
          })}
        </div>
        <div className="ff-offer-module-meta"><span><b>КАСА</b>{frame.dimensionLabel}</span><span><b>КОЛИЧЕСТВО</b>{selectedQuantity?.effectiveQuantity ?? 'НЕУТОЧНЕНО'} бр.</span><span><b>АКТИВНИ КЛЕТКИ</b>{frame.cells.map((cell) => cell.id).join(', ') || '—'}</span><span><b>ПЕНСИОНИРАНИ КЛЕТКИ</b>{frame.retiredCellIds.join(', ') || '—'}</span></div>
      </div> : <div className="ff-offer-module-empty">Модулът още няма зададена каса.</div>}
    </div> : multiModule.modules.length === 0 ? null : <div className="ff-offer-module-empty">Избери модул от списъка, за да видиш неговите настройки и геометрия.</div>}

    {selectedReview && <article ref={finalReviewRef} className={`ff-review-gate-module ff-final-human-review ${selectedReview.status === 'INCOMPLETE' ? 'review' : selectedReview.status === 'HUMAN_CONFIRMED' ? 'confirmed' : 'ready'}`}>
      <header>
        <div><span>СТЪПКА 4 ОТ 4 · ЧОВЕШКИ ПРЕГЛЕД · ФИНАЛЕН ПРЕГЛЕД · МОДУЛ {selectedReview.moduleNumber}</span><strong>{selectedReview.status === 'INCOMPLETE' ? 'НЕПЪЛЕН' : selectedReview.status === 'HUMAN_CONFIRMED' ? 'ПОТВЪРДЕН ОТ ЧОВЕК' : 'ГОТОВ ЗА ЧОВЕШКИ ПРЕГЛЕД'}</strong></div>
        <div className="ff-final-review-actions">
          <button type="button" className="secondary" onClick={returnToModuleCorrection}>✎ Върни се за корекция</button>
          <button type="button" className="confirm" disabled={!selectedReview.complete || selectedReview.confirmed || !facadeFlowOfferCustomerReady(customerDetails)} onClick={() => confirmModule(selectedReview.moduleNumber)}>{selectedReview.confirmed ? '✓ Черновата е потвърдена' : '✓ Потвърждавам тази офертна чернова'}</button>
        </div>
      </header>
      <div className="ff-final-review-parties">
        <span><b>ВЪЗЛОЖИТЕЛ</b><strong>{customerDetails.name || 'НЕУТОЧНЕН'}</strong>{customerDetails.projectAddress && <small>{customerDetails.projectAddress}</small>}</span>
        <span><b>ИЗПЪЛНИТЕЛ</b><strong>{NADEZHDA_OFFER_ISSUER.name}</strong><small>{NADEZHDA_OFFER_ISSUER.city} · {NADEZHDA_OFFER_ISSUER.email}</small></span>
      </div>
      <div className="ff-final-review-explainer">
        <b>КАКВО ПОТВЪРЖДАВАШ?</b>
        <p>Потвърждаваш, че показаните размери, количество, настройки, разделение на клетките и отваряемост съответстват на желаната офертна чернова.</p>
        <strong>Това не е проверка по технически правила, машинна готовност или разрешение за производство.</strong>
      </div>
      {!facadeFlowOfferCustomerReady(customerDetails) && <div className="ff-final-review-customer-warning">Преди потвърждение попълни задължителните данни за възложителя в Стъпка 1.</div>}
      <div className="ff-review-gate-checks">
        {selectedReview.checks.map((item) => <div key={item.field} className={item.status.toLowerCase()}><span>{item.label}</span><b>{checkLabel(item)}</b>{item.reason && <small>{item.reason}</small>}</div>)}
      </div>
      {selectedReview.cellDispositions.length > 0 && <div className="ff-cell-disposition-review"><b>КЛЕТКИ · КАКВО ТОЧНО ПОТВЪРЖДАВАШ</b><div>{selectedReview.cellDispositions.map((cell) => {
        const cellView = frame?.cells.find((entry) => entry.id === cell.cellId)
        const dispositionLabel = cell.status === 'SASH' ? (cellView?.sashLabel ?? 'ОТВАРЯЕМО КРИЛО') : cell.status === 'FIXED' ? 'ФИКСИРАНО' : 'НЕУТОЧНЕНО'
        return <span key={cell.cellId} className={cell.status.toLowerCase()}><strong>Клетка {cell.cellId}</strong><em>{dispositionLabel}</em>{cell.status === 'UNRESOLVED' && <small><button type="button" onClick={() => presetGuidedAction('SET_FIXED', cell.cellId)}>Фикс</button><button type="button" onClick={() => presetGuidedAction('ADD_SASH', cell.cellId)}>Добави крило</button></small>}</span>
      })}</div></div>}
      <div className="ff-final-review-safety-note"><b>ЧОВЕШКОТО ПОТВЪРЖДЕНИЕ Е САМО ЗА ОФЕРТНАТА ЧЕРНОВА.</b><span>ПРАВИЛА ВАЛИДИРАНИ: НЕ · ГОТОВО ЗА МАШИНА: НЕ · ОДОБРЕНО ЗА ПРОИЗВОДСТВО: НЕ</span></div>
    </article>}

    <aside className="ff-offer-modules-history"><b>ИСТОРИЯ НА РАБОТНАТА СЕСИЯ</b>{runtime.events.slice(-12).map((event) => <div key={event.step} className={event.status === 'REVIEW_REQUIRED' ? 'review' : ''}><span>{event.step}</span><p><strong>{event.command}</strong><small>{eventKindLabel(event.kind)} · {eventStatusLabel(event.status)}{event.targetModuleNumber === null ? '' : ` · Модул ${event.targetModuleNumber}`}{event.invalidatedConfirmations.length ? ` · свалено потвърждение: ${event.invalidatedConfirmations.join(', ')}` : ''}</small></p></div>)}</aside>

    <footer className="ff-offer-modules-safety"><span>Наследени стойности, локални промени, количества и проверки за пълнота работят в една обща чернова.</span><strong>АВТОМАТИЧНА ГЕОМЕТРИЯ: НЕ · ПРАВИЛА ВАЛИДИРАНИ: НЕ · ГОТОВО ЗА МАШИНА: НЕ · ОДОБРЕНО ЗА ПРОИЗВОДСТВО: НЕ</strong></footer>
  </section>
}
