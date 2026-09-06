import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import {
  applyFacadeFlowOfferCommercialSummaryCommand,
  clearFacadeFlowOfferCommercialSummaryRuntime,
  createFacadeFlowOfferCommercialSummaryRuntime,
  isFacadeFlowOfferCommercialSummaryCandidate,
} from '../aiPromptOfferCommercialSummaryRuntime'

interface Props {
  sourceText: string
  interpretationId: string
}

export function OfferCommercialSummaryRuntimePanel({ sourceText, interpretationId }: Props) {
  const [runtime, setRuntime] = useState(() => createFacadeFlowOfferCommercialSummaryRuntime(sourceText, interpretationId))
  const [draftCommand, setDraftCommand] = useState('')

  useEffect(() => {
    setRuntime(createFacadeFlowOfferCommercialSummaryRuntime(sourceText, interpretationId))
  }, [sourceText, interpretationId])

  if (!isFacadeFlowOfferCommercialSummaryCandidate(sourceText) && runtime.offerRuntime.multiModule.modules.length === 0) return null

  const applyCommand = () => {
    const command = draftCommand.trim()
    if (!command) return
    setRuntime((current) => applyFacadeFlowOfferCommercialSummaryCommand(current, command))
    setDraftCommand('')
  }

  const reloadSource = () => setRuntime(createFacadeFlowOfferCommercialSummaryRuntime(sourceText, interpretationId))
  const clearSession = () => {
    setRuntime((current) => clearFacadeFlowOfferCommercialSummaryRuntime(current))
    setDraftCommand('')
  }

  return <section className="ff-commercial-summary-runtime" aria-label="Количества по модули и търговско обобщение">
    <header className="ff-commercial-summary-head">
      <div><span>COMMERCIAL SUMMARY · CORPUS 15 · SIMULATION</span><h4>Бройки по модули → общ брой изделия</h4><p>Количеството е офертна стойност. Промяната на бройки не променя касата, клетките, делителите или крилата.</p></div>
      <div><button type="button" onClick={reloadSource}>Зареди описанието</button><button type="button" className="danger" onClick={clearSession}>Ново обобщение</button></div>
    </header>

    <div className="ff-commercial-summary-cards">
      <span><b>МОДУЛИ</b><strong>{runtime.summary.moduleCount}</strong></span>
      <span><b>С ИЗВЕСТНИ БРОЙКИ</b><strong>{runtime.summary.modulesWithKnownQuantity}</strong></span>
      <span className={runtime.summary.complete ? 'complete' : 'review'}><b>ОБЩО ИЗДЕЛИЯ</b><strong>{runtime.summary.totalQuantity ?? 'НЕПЪЛНО'}</strong></span>
      <span><b>ИЗВЕСТЕН МЕЖДИНЕН СБОР</b><strong>{runtime.summary.totalKnownQuantity}</strong></span>
    </div>

    {!runtime.summary.complete && <div className="ff-commercial-summary-warning"><b>ЛИПСВАТ БРОЙКИ</b><span>{runtime.summary.modulesWithoutQuantity.length ? `Модули: ${runtime.summary.modulesWithoutQuantity.join(', ')}` : 'Няма създадени модули.'}</span><small>FacadeFlow не показва окончателен общ брой, докато всеки модул няма потвърдено количество.</small></div>}

    <form className="ff-commercial-summary-command" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); applyCommand() }}>
      <label>Команда за количество<input value={draftCommand} onChange={(event: ChangeEvent<HTMLInputElement>) => setDraftCommand(event.target.value)} placeholder="Пример: Модул 2 да стане 5 бр. · или Колко са общо?"/></label>
      <button type="submit" disabled={!draftCommand.trim()}>Приложи</button>
    </form>

    <div className={`ff-commercial-summary-last ${runtime.lastCommandStatus === 'REVIEW_REQUIRED' ? 'review' : ''}`}>
      <span><b>ПОСЛЕДНА ОПЕРАЦИЯ</b>{runtime.lastCommandKind ?? '—'}</span>
      <span><b>СТАТУС</b>{runtime.lastCommandStatus === 'REVIEW_REQUIRED' ? 'ИЗИСКВА УТОЧНЕНИЕ' : runtime.lastCommandStatus === 'APPLIED' ? 'ПРИЛОЖЕНА КЪМ ЧЕРНОВАТА' : 'ПРАЗНА СЕСИЯ'}</span>
      <span><b>ПРИЧИНА</b>{runtime.lastCommandReason ?? '—'}</span>
    </div>

    <div className="ff-commercial-module-table" role="table" aria-label="Количество по модули">
      <div className="head" role="row"><span>Модул</span><span>Бройки</span><span>Източник</span><span>Копиран от</span></div>
      {runtime.moduleQuantities.map((entry) => <div key={entry.moduleNumber} role="row" className={entry.effectiveQuantity === null ? 'review' : ''}>
        <strong>Модул {entry.moduleNumber}</strong>
        <b>{entry.effectiveQuantity ?? 'НЕУТОЧНЕНО'}</b>
        <span>{entry.source === 'MODULE_FRAME' ? 'ОТ КОМАНДАТА ЗА МОДУЛА' : entry.source === 'COMMERCIAL_OVERRIDE' ? 'ТЪРГОВСКИ OVERRIDE' : entry.source === 'COPY_INHERITED' ? 'НАСЛЕДЕНО ПРИ КОПИРАНЕ' : 'ЛИПСВА'}</span>
        <span>{entry.copiedFromModuleNumber ?? '—'}</span>
      </div>)}
      {!runtime.moduleQuantities.length && <div className="empty">Няма създадени модули.</div>}
    </div>

    <aside className="ff-commercial-summary-history"><b>ИСТОРИЯ НА КОЛИЧЕСТВАТА</b>{runtime.events.map((event) => <div key={event.step} className={event.status === 'REVIEW_REQUIRED' ? 'review' : ''}><span>{event.step}</span><p><strong>{event.command}</strong><small>{event.kind} · {event.status}{event.targetModuleNumber === null ? '' : ` · Модул ${event.targetModuleNumber}`}{event.quantity === null ? '' : ` · ${event.quantity} бр.`}</small></p></div>)}</aside>

    <footer className="ff-commercial-summary-safety"><span>{runtime.summary.summaryLabel}</span><strong>ЦЕНИ: НЕ · ПРАВИЛА ВАЛИДИРАНИ: НЕ · ГОТОВО ЗА МАШИНА: НЕ</strong></footer>
  </section>
}
