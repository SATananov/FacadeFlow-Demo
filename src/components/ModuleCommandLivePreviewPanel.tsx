import { useMemo, useState } from 'react'
import {
  buildFacadeFlowModuleEditorBinding,
  isFacadeFlowModuleCommandSessionCandidate,
  selectFacadeFlowModuleEditorFrame,
} from '../aiPromptModuleEditorBinding'

export function ModuleCommandLivePreviewPanel({ sourceText, interpretationId = 'module-command-live-preview' }: {
  sourceText: string
  interpretationId?: string
}) {
  const [pinnedStep, setPinnedStep] = useState<number | null>(null)
  const [selectedCellId, setSelectedCellId] = useState<number | null>(null)
  const binding = useMemo(
    () => buildFacadeFlowModuleEditorBinding(sourceText, interpretationId),
    [sourceText, interpretationId],
  )

  if (!isFacadeFlowModuleCommandSessionCandidate(sourceText) || !binding.currentFrame) return null

  const frame = selectFacadeFlowModuleEditorFrame(binding, pinnedStep) ?? binding.currentFrame
  const selectedCell = frame.cells.some((cell) => cell.id === selectedCellId) ? selectedCellId : null
  const aspectRatio = frame.frameWidthMm && frame.frameHeightMm ? `${frame.frameWidthMm} / ${frame.frameHeightMm}` : '16 / 9'

  return <section className="ff-module-command-preview" aria-label="Актуално състояние на модула">
    <header className="ff-module-command-preview-head">
      <div><span>LIVE MODULE PREVIEW · SIMULATION</span><h4>{frame.title}</h4><p>{frame.quantityLabel} · Стъпка {frame.step} от {binding.frames.length}</p></div>
      <b className={frame.status === 'REVIEW_REQUIRED' ? 'review' : 'ready'}>{frame.statusLabel}</b>
    </header>

    <div className="ff-module-command-preview-layout">
      <div className="ff-module-command-preview-main">
        <div className="ff-module-command-stage" style={{ aspectRatio }} aria-label={`${frame.title}; ${frame.cells.length} активни клетки`}>
          {frame.cells.map((cell) => <button
            type="button"
            key={cell.id}
            className={`ff-module-command-cell ${cell.hasSash ? 'has-sash' : ''} ${selectedCell === cell.id ? 'selected' : ''}`}
            style={{ left: `${cell.leftPct}%`, top: `${cell.topPct}%`, width: `${cell.widthPct}%`, height: `${cell.heightPct}%` }}
            aria-pressed={selectedCell === cell.id}
            title={`${cell.label} · ${cell.widthMm} × ${cell.heightMm} mm${cell.sashLabel ? ` · ${cell.sashLabel}` : ''}`}
            onClick={() => setSelectedCellId(cell.id)}
          >
            <strong>{cell.label}</strong>
            <small>{cell.widthMm} × {cell.heightMm}</small>
            {cell.sashLabel && <em>{cell.sashLabel}</em>}
          </button>)}
        </div>

        <div className="ff-module-command-preview-meta">
          <span><b>КАСА</b>{frame.dimensionLabel}</span>
          <span><b>АКТИВНИ КЛЕТКИ</b>{frame.cells.map((cell) => cell.id).join(', ') || '—'}</span>
          <span><b>ОТПАДНАЛИ ID</b>{frame.retiredCellIds.join(', ') || '—'}</span>
          <span><b>НЕУТОЧНЕНИ</b>{frame.unresolvedCount}</span>
        </div>

        <div className="ff-module-command-divider-list" aria-label="Делители">
          {frame.dividers.length ? frame.dividers.map((divider) => <span key={divider.id}><b>{divider.label}</b>{divider.orientation === 'VERTICAL' ? 'вертикален' : 'хоризонтален'} · {divider.positionMm} mm</span>) : <span><b>ДЕЛИТЕЛИ</b>Няма добавени делители</span>}
        </div>
      </div>

      <aside className="ff-module-command-timeline" aria-label="История на командите">
        <div className="ff-module-command-timeline-head"><b>КОМАНДИ</b><button type="button" onClick={() => setPinnedStep(null)} disabled={pinnedStep === null}>Актуално</button></div>
        {binding.timeline.map((item) => <button
          type="button"
          key={item.step}
          className={`${(pinnedStep ?? binding.currentStep) === item.step ? 'selected' : ''} ${item.status === 'REVIEW_REQUIRED' ? 'review' : ''}`}
          onClick={() => setPinnedStep(item.step)}
          aria-pressed={(pinnedStep ?? binding.currentStep) === item.step}
        >
          <span>{item.step}</span><span><strong>{item.command}</strong><small>{item.status === 'REVIEW_REQUIRED' ? 'ИЗИСКВА УТОЧНЕНИЕ' : item.stateChanged ? 'СЪСТОЯНИЕТО Е ОБНОВЕНО' : 'ПРИЛОЖЕНО · БЕЗ ВИДИМА ПРОМЯНА'}</small></span>
        </button>)}
      </aside>
    </div>

    <footer className="ff-module-command-preview-safety"><span>Избраната клетка е само визуален фокус: <b>{selectedCell ? `Клетка ${selectedCell}` : 'няма'}</b>.</span><strong>{binding.safetyLabel}</strong></footer>
  </section>
}
