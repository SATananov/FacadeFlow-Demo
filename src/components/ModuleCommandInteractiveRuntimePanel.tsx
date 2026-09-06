import { useState, type ChangeEvent, type FormEvent } from 'react'
import {
  applyFacadeFlowModuleInteractiveCommand,
  clearFacadeFlowModuleInteractiveRuntime,
  createFacadeFlowModuleInteractiveRuntime,
  isFacadeFlowInteractiveModuleRuntimeCandidate,
  reloadFacadeFlowModuleInteractiveRuntime,
} from '../aiPromptModuleInteractiveRuntime'

export function ModuleCommandInteractiveRuntimePanel({ sourceText, interpretationId = 'module-command-interactive-runtime' }: {
  sourceText: string
  interpretationId?: string
}) {
  const [runtime, setRuntime] = useState(() => createFacadeFlowModuleInteractiveRuntime(sourceText, interpretationId))
  const [draftCommand, setDraftCommand] = useState('')
  const [selectedCellId, setSelectedCellId] = useState<number | null>(null)

  if (!isFacadeFlowInteractiveModuleRuntimeCandidate(sourceText) && runtime.commands.length === 0) return null

  const frame = runtime.currentFrame
  const selectedCell = frame?.cells.some((cell) => cell.id === selectedCellId) ? selectedCellId : null
  const aspectRatio = frame?.frameWidthMm && frame.frameHeightMm ? `${frame.frameWidthMm} / ${frame.frameHeightMm}` : '16 / 9'

  const applyCommand = () => {
    const command = draftCommand.trim()
    if (!command) return
    setRuntime((current) => applyFacadeFlowModuleInteractiveCommand(current, command))
    setDraftCommand('')
  }

  const reloadSource = () => {
    setRuntime((current) => reloadFacadeFlowModuleInteractiveRuntime(current, sourceText))
    setSelectedCellId(null)
  }

  const clearSession = () => {
    setRuntime((current) => clearFacadeFlowModuleInteractiveRuntime(current))
    setSelectedCellId(null)
    setDraftCommand('')
  }

  return <section className="ff-module-interactive-runtime" aria-label="Интерактивни команди за модул">
    <header className="ff-module-interactive-runtime-head">
      <div><span>INTERACTIVE MODULE RUNTIME · SIMULATION</span><h4>Команда → Apply → актуално състояние</h4><p>Всяка нова команда се прилага върху текущата локална чернова. Неясните команди не променят геометрията.</p></div>
      <div className="ff-module-interactive-runtime-actions"><button type="button" onClick={reloadSource}>Зареди описанието</button><button type="button" className="danger" onClick={clearSession}>Нова сесия</button></div>
    </header>

    <form className="ff-module-interactive-command-bar" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); applyCommand() }}>
      <label>Следваща команда<input value={draftCommand} onChange={(event: ChangeEvent<HTMLInputElement>) => setDraftCommand(event.target.value)} placeholder={selectedCell ? `Пример: раздели клетка ${selectedCell} хоризонтално на две` : 'Пример: раздели клетка 1 вертикално на три равни части'}/></label>
      <button type="submit" disabled={!draftCommand.trim()}>Приложи</button>
    </form>

    <div className={`ff-module-interactive-last ${runtime.lastCommandStatus === 'REVIEW_REQUIRED' ? 'review' : ''}`}>
      <span><b>СТЪПКА</b>{runtime.currentStep || '—'}</span>
      <span><b>ПОСЛЕДНА КОМАНДА</b>{runtime.lastCommand ?? 'Няма приложена команда'}</span>
      <span><b>СТАТУС</b>{runtime.lastCommandStatus === 'REVIEW_REQUIRED' ? 'ИЗИСКВА УТОЧНЕНИЕ' : runtime.lastCommandStatus === 'APPLIED' ? 'ПРИЛОЖЕНА КЪМ ЧЕРНОВАТА' : 'ПРАЗНА СЕСИЯ'}</span>
      <span><b>ВИДИМА ПРОМЯНА</b>{runtime.lastCommandStateChanged ? 'ДА' : 'НЕ'}</span>
    </div>

    {frame ? <div className="ff-module-interactive-layout">
      <div className="ff-module-interactive-stage-wrap">
        <div className="ff-module-interactive-stage" style={{ aspectRatio }} aria-label={`${frame.title}; ${frame.cells.length} активни клетки`}>
          {frame.cells.map((cell) => <button
            type="button"
            key={cell.id}
            className={`ff-module-interactive-cell ${cell.hasSash ? 'has-sash' : ''} ${selectedCell === cell.id ? 'selected' : ''}`}
            style={{ left: `${cell.leftPct}%`, top: `${cell.topPct}%`, width: `${cell.widthPct}%`, height: `${cell.heightPct}%` }}
            onClick={() => setSelectedCellId(cell.id)}
            aria-pressed={selectedCell === cell.id}
            title={`${cell.label} · ${cell.widthMm} × ${cell.heightMm} mm${cell.sashLabel ? ` · ${cell.sashLabel}` : ''}`}
          ><strong>{cell.label}</strong><small>{cell.widthMm} × {cell.heightMm}</small>{cell.sashLabel && <em>{cell.sashLabel}</em>}</button>)}
        </div>
        <div className="ff-module-interactive-meta">
          <span><b>КАСА</b>{frame.dimensionLabel}</span>
          <span><b>КОЛИЧЕСТВО</b>{frame.quantityLabel}</span>
          <span><b>АКТИВНИ CELL ID</b>{frame.cells.map((cell) => cell.id).join(', ') || '—'}</span>
          <span><b>RETIRED CELL ID</b>{frame.retiredCellIds.join(', ') || '—'}</span>
        </div>
      </div>
      <aside className="ff-module-interactive-history" aria-label="Приложени команди">
        <b>ИСТОРИЯ НА СЕСИЯТА</b>
        {runtime.binding.timeline.length ? runtime.binding.timeline.map((item) => <div key={item.step} className={item.status === 'REVIEW_REQUIRED' ? 'review' : ''}><span>{item.step}</span><p><strong>{item.command}</strong><small>{item.status === 'REVIEW_REQUIRED' ? 'ИЗИСКВА УТОЧНЕНИЕ · БЕЗ ВИДИМА МУТАЦИЯ' : item.stateChanged ? 'СЪСТОЯНИЕТО Е ОБНОВЕНО' : 'ПРИЛОЖЕНО · БЕЗ ВИДИМА ПРОМЯНА'}</small></p></div>) : <p className="empty">Няма команди.</p>}
      </aside>
    </div> : <div className="ff-module-interactive-empty">Започни с команда за модул, количество и размер на касата.</div>}

    <footer className="ff-module-interactive-safety"><span>Избран визуален фокус: <b>{selectedCell ? `Клетка ${selectedCell}` : 'няма'}</b></span><strong>АВТОМАТИЧНА ГЕОМЕТРИЯ: НЕ · ПРАВИЛА ВАЛИДИРАНИ: НЕ · ГОТОВО ЗА МАШИНА: НЕ</strong></footer>
  </section>
}
