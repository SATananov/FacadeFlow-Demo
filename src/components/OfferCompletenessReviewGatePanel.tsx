import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import {
  applyFacadeFlowOfferCompletenessReviewCommand,
  clearFacadeFlowOfferCompletenessReviewRuntime,
  createFacadeFlowOfferCompletenessReviewRuntime,
  isFacadeFlowOfferCompletenessReviewCandidate,
  type FacadeFlowCompletenessCheck,
} from '../aiPromptOfferCompletenessReviewRuntime'

interface Props {
  sourceText: string
  interpretationId: string
}

function checkLabel(check: FacadeFlowCompletenessCheck) {
  if (check.status === 'COMPLETE') return check.value ?? 'ГОТОВО'
  if (check.status === 'REVIEW_REQUIRED') return 'ИЗИСКВА УТОЧНЕНИЕ'
  return 'ЛИПСВА'
}

export function OfferCompletenessReviewGatePanel({ sourceText, interpretationId }: Props) {
  const [runtime, setRuntime] = useState(() => createFacadeFlowOfferCompletenessReviewRuntime(sourceText, interpretationId))
  const [draftCommand, setDraftCommand] = useState('')

  useEffect(() => {
    setRuntime(createFacadeFlowOfferCompletenessReviewRuntime(sourceText, interpretationId))
  }, [sourceText, interpretationId])

  if (!isFacadeFlowOfferCompletenessReviewCandidate(sourceText) && runtime.moduleReviews.length === 0) return null

  const applyCommand = () => {
    const command = draftCommand.trim()
    if (!command) return
    setRuntime((current) => applyFacadeFlowOfferCompletenessReviewCommand(current, command))
    setDraftCommand('')
  }

  const confirmModule = (moduleNumber: number) => {
    setRuntime((current) => applyFacadeFlowOfferCompletenessReviewCommand(current, `Потвърди Модул ${moduleNumber}`))
  }

  const reloadSource = () => setRuntime(createFacadeFlowOfferCompletenessReviewRuntime(sourceText, interpretationId))
  const clearSession = () => {
    setRuntime((current) => clearFacadeFlowOfferCompletenessReviewRuntime(current))
    setDraftCommand('')
  }

  return <section className="ff-review-gate-runtime" aria-label="Пълнота на офертата и Human Review Gate">
    <header className="ff-review-gate-head">
      <div><span>COMPLETENESS · CORPUS 16 · HUMAN REVIEW ONLY</span><h4>Оферта → проверка за пълнота → Human Confirm</h4><p>Gate-ът проверява наличните данни. Human Confirm удостоверява само прегледаната чернова и не означава валидирани правила, machine-ready или production approval.</p></div>
      <div><button type="button" onClick={reloadSource}>Зареди описанието</button><button type="button" className="danger" onClick={clearSession}>Нова проверка</button></div>
    </header>

    <div className="ff-review-gate-summary">
      <span><b>МОДУЛИ</b><strong>{runtime.summary.moduleCount}</strong></span>
      <span><b>ПЪЛНИ</b><strong>{runtime.summary.completeModules}</strong></span>
      <span><b>HUMAN CONFIRMED</b><strong>{runtime.summary.confirmedModules}</strong></span>
      <span className={runtime.summary.incompleteModules ? 'review' : 'complete'}><b>НЕПЪЛНИ</b><strong>{runtime.summary.incompleteModules}</strong></span>
      <span><b>ОБЩО ИЗДЕЛИЯ</b><strong>{runtime.summary.totalQuantity ?? 'НЕПЪЛНО'}</strong></span>
    </div>

    <div className={`ff-review-gate-offer-status status-${runtime.summary.status.toLowerCase()}`}>
      <b>{runtime.summary.status}</b><span>{runtime.summary.statusLabel}</span>
    </div>

    <form className="ff-review-gate-command" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); applyCommand() }}>
      <label>Review команда<input value={draftCommand} onChange={(event: ChangeEvent<HTMLInputElement>) => setDraftCommand(event.target.value)} placeholder="Пример: Какво липсва? · Потвърди Модул 2 · Модул 1 да стане 5 бр."/></label>
      <button type="submit" disabled={!draftCommand.trim()}>Приложи</button>
    </form>

    {runtime.moduleReviews.map((module) => <article key={module.moduleNumber} className={`ff-review-gate-module ${module.status === 'INCOMPLETE' ? 'review' : module.status === 'HUMAN_CONFIRMED' ? 'confirmed' : 'ready'}`}>
      <header><div><span>МОДУЛ {module.moduleNumber}</span><strong>{module.status === 'INCOMPLETE' ? 'НЕПЪЛЕН' : module.status === 'HUMAN_CONFIRMED' ? 'HUMAN CONFIRMED' : 'ГОТОВ ЗА HUMAN REVIEW'}</strong></div><button type="button" disabled={!module.complete || module.confirmed} onClick={() => confirmModule(module.moduleNumber)}>{module.confirmed ? 'Потвърден' : 'Human Confirm'}</button></header>
      <div className="ff-review-gate-checks">
        {module.checks.map((item) => <div key={item.field} className={item.status.toLowerCase()}><span>{item.label}</span><b>{checkLabel(item)}</b>{item.reason && <small>{item.reason}</small>}</div>)}
      </div>
    </article>)}

    {!runtime.moduleReviews.length && <div className="ff-review-gate-empty">Няма създадени модули за проверка.</div>}

    <aside className="ff-review-gate-history"><b>REVIEW HISTORY</b>{runtime.events.slice(-10).map((event) => <div key={event.step} className={event.status === 'REVIEW_REQUIRED' ? 'review' : ''}><span>{event.step}</span><p><strong>{event.command}</strong><small>{event.kind} · {event.status}{event.invalidatedConfirmations.length ? ` · свалено потвърждение: ${event.invalidatedConfirmations.join(', ')}` : ''}</small></p></div>)}</aside>

    <footer className="ff-review-gate-safety"><span>Human Confirm = потвърдена чернова за следващ човешки/правилен етап.</span><strong>RULES VALIDATED: NO · MACHINE READY: NO · PRODUCTION APPROVED: NO</strong></footer>
  </section>
}
