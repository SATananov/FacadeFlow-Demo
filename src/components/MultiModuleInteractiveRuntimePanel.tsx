import { useState, type ChangeEvent, type FormEvent } from 'react'
import {
  applyFacadeFlowMultiModuleCommand,
  clearFacadeFlowMultiModuleRuntime,
  createFacadeFlowMultiModuleInteractiveRuntime,
  isFacadeFlowMultiModuleRuntimeCandidate,
  openFacadeFlowMultiModule,
} from '../aiPromptMultiModuleInteractiveRuntime'

export function MultiModuleInteractiveRuntimePanel({ sourceText, interpretationId = 'multi-module-interactive-runtime' }: {
  sourceText: string
  interpretationId?: string
}) {
  const [runtime, setRuntime] = useState(() => createFacadeFlowMultiModuleInteractiveRuntime(sourceText, interpretationId))
  const [draftCommand, setDraftCommand] = useState('')
  const [selectedCellId, setSelectedCellId] = useState<number | null>(null)

  if (!isFacadeFlowMultiModuleRuntimeCandidate(sourceText) && runtime.modules.length === 0) return null

  const activeEntry = runtime.currentModule
  const frame = activeEntry?.runtime.currentFrame ?? null
  const selectedCell = frame?.cells.some((cell) => cell.id === selectedCellId) ? selectedCellId : null
  const aspectRatio = frame?.frameWidthMm && frame.frameHeightMm ? `${frame.frameWidthMm} / ${frame.frameHeightMm}` : '16 / 9'

  const applyCommand = () => {
    const command = draftCommand.trim()
    if (!command) return
    setRuntime((current) => applyFacadeFlowMultiModuleCommand(current, command))
    setSelectedCellId(null)
    setDraftCommand('')
  }

  const reloadSource = () => {
    setRuntime(createFacadeFlowMultiModuleInteractiveRuntime(sourceText, interpretationId))
    setSelectedCellId(null)
  }

  const clearSession = () => {
    setRuntime((current) => clearFacadeFlowMultiModuleRuntime(current))
    setDraftCommand('')
    setSelectedCellId(null)
  }

  const openModule = (moduleNumber: number) => {
    setRuntime((current) => openFacadeFlowMultiModule(current, moduleNumber))
    setSelectedCellId(null)
  }

  return <section className="ff-multi-module-runtime" aria-label="Интерактивна работа с много модули">
    <header className="ff-multi-module-runtime-head">
      <div><span>MULTI-MODULE RUNTIME · SIMULATION</span><h4>Оферта с отделни модулни чернови</h4><p>Всеки модул пази собствен state. Превключването и копирането не пренасят последващи промени между модулите.</p></div>
      <div className="ff-multi-module-runtime-actions"><button type="button" onClick={reloadSource}>Зареди описанието</button><button type="button" className="danger" onClick={clearSession}>Нова multi-module сесия</button></div>
    </header>

    <div className="ff-multi-module-tabs" role="tablist" aria-label="Модули в офертата">
      {runtime.modules.map((entry) => {
        const active = entry.moduleNumber === runtime.activeModuleNumber
        const entryFrame = entry.runtime.currentFrame
        return <button type="button" role="tab" aria-selected={active} key={entry.moduleNumber} className={active ? 'active' : ''} onClick={() => openModule(entry.moduleNumber)}>
          <strong>Модул {entry.moduleNumber}</strong>
          <small>{entryFrame?.quantity === null || entryFrame?.quantity === undefined ? 'бр. ?' : `${entryFrame.quantity} бр.`}</small>
          {entry.copiedFromModuleNumber !== null && <em>копие от {entry.copiedFromModuleNumber}</em>}
        </button>
      })}
      {!runtime.modules.length && <span className="empty">Няма създадени модули.</span>}
    </div>

    <form className="ff-multi-module-command-bar" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); applyCommand() }}>
      <label>Команда за офертата / активния модул<input value={draftCommand} onChange={(event: ChangeEvent<HTMLInputElement>) => setDraftCommand(event.target.value)} placeholder={runtime.activeModuleNumber ? `Пример: раздели клетка 1 вертикално на две · или отвори модул 2` : 'Пример: Модул 1, 3 броя, каса 2100 x 1400 mm'}/></label>
      <button type="submit" disabled={!draftCommand.trim()}>Приложи</button>
    </form>

    <div className={`ff-multi-module-last ${runtime.lastCommandStatus === 'REVIEW_REQUIRED' ? 'review' : ''}`}>
      <span><b>АКТИВЕН МОДУЛ</b>{runtime.activeModuleNumber === null ? '—' : `Модул ${runtime.activeModuleNumber}`}</span>
      <span><b>ПОСЛЕДНА ОПЕРАЦИЯ</b>{runtime.lastCommandKind ?? '—'}</span>
      <span><b>СТАТУС</b>{runtime.lastCommandStatus === 'REVIEW_REQUIRED' ? 'ИЗИСКВА УТОЧНЕНИЕ' : runtime.lastCommandStatus === 'APPLIED' ? 'ПРИЛОЖЕНА КЪМ ЧЕРНОВАТА' : 'ПРАЗНА СЕСИЯ'}</span>
      <span><b>ПРИЧИНА</b>{runtime.lastCommandReason ?? '—'}</span>
    </div>

    {frame ? <div className="ff-multi-module-layout">
      <div className="ff-multi-module-stage-wrap">
        <div className="ff-multi-module-stage" style={{ aspectRatio }} aria-label={`Модул ${runtime.activeModuleNumber}; ${frame.cells.length} активни клетки`}>
          {frame.cells.map((cell) => <button
            type="button"
            key={cell.id}
            className={`ff-multi-module-cell ${cell.hasSash ? 'has-sash' : ''} ${selectedCell === cell.id ? 'selected' : ''}`}
            style={{ left: `${cell.leftPct}%`, top: `${cell.topPct}%`, width: `${cell.widthPct}%`, height: `${cell.heightPct}%` }}
            onClick={() => setSelectedCellId(cell.id)}
            aria-pressed={selectedCell === cell.id}
            title={`${cell.label} · ${cell.widthMm} × ${cell.heightMm} mm${cell.sashLabel ? ` · ${cell.sashLabel}` : ''}`}
          ><strong>{cell.label}</strong><small>{cell.widthMm} × {cell.heightMm}</small>{cell.sashLabel && <em>{cell.sashLabel}</em>}</button>)}
        </div>
        <div className="ff-multi-module-meta">
          <span><b>КАСА</b>{frame.dimensionLabel}</span>
          <span><b>КОЛИЧЕСТВО</b>{frame.quantityLabel}</span>
          <span><b>ACTIVE CELL ID</b>{frame.cells.map((cell) => cell.id).join(', ') || '—'}</span>
          <span><b>RETIRED CELL ID</b>{frame.retiredCellIds.join(', ') || '—'}</span>
        </div>
      </div>

      <aside className="ff-multi-module-overview" aria-label="Модули и история">
        <b>МОДУЛИ В ОФЕРТАТА</b>
        <div className="ff-multi-module-cards">{runtime.modules.map((entry) => {
          const entryFrame = entry.runtime.currentFrame
          return <button type="button" key={entry.moduleNumber} className={entry.moduleNumber === runtime.activeModuleNumber ? 'active' : ''} onClick={() => openModule(entry.moduleNumber)}>
            <strong>Модул {entry.moduleNumber}</strong><span>{entryFrame?.dimensionLabel ?? 'Каса: неуточнена'}</span><span>{entryFrame?.quantityLabel ?? 'Количество: неуточнено'}</span><small>Cell ID: {entryFrame?.cells.map((cell) => cell.id).join(', ') || '—'}</small>
          </button>
        })}</div>
        <b>ИСТОРИЯ НА MULTI-MODULE СЕСИЯТА</b>
        <div className="ff-multi-module-history">{runtime.events.map((event) => <div key={event.step} className={event.status === 'REVIEW_REQUIRED' ? 'review' : ''}><span>{event.step}</span><p><strong>{event.command}</strong><small>{event.kind} · {event.status}{event.targetModuleNumber === null ? '' : ` · Модул ${event.targetModuleNumber}`}</small></p></div>)}</div>
      </aside>
    </div> : <div className="ff-multi-module-empty">Създай модул и задай размер на касата. Пример: „Модул 1, 3 броя, каса 2100 x 1400 mm“.</div>}

    <footer className="ff-multi-module-safety"><span>Избран визуален фокус: <b>{selectedCell ? `Клетка ${selectedCell}` : 'няма'}</b></span><strong>АВТОМАТИЧНА ГЕОМЕТРИЯ: НЕ · ПРАВИЛА ВАЛИДИРАНИ: НЕ · ГОТОВО ЗА МАШИНА: НЕ</strong></footer>
  </section>
}
