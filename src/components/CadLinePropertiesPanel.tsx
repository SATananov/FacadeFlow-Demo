import { useEffect, useMemo, useState } from 'react'
import { getCustomDrawingLineMetrics, type CustomDrawingLine } from '../customDrawingLines'

interface Props {
  line: CustomDrawingLine
  onUpdate: (start: { x: number; y: number }, end: { x: number; y: number }) => void
  onDelete: () => void
  onClose: () => void
}

interface DraftCoordinates {
  x1: string
  y1: string
  x2: string
  y2: string
}

function createDraft(line: CustomDrawingLine): DraftCoordinates {
  return {
    x1: String(line.start.x),
    y1: String(line.start.y),
    x2: String(line.end.x),
    y2: String(line.end.y),
  }
}

function parseDraft(draft: DraftCoordinates) {
  const raw = [draft.x1, draft.y1, draft.x2, draft.y2]
  if (raw.some((value) => value.trim() === '')) return null
  const values = raw.map((value) => Number(value))
  if (!values.every(Number.isFinite)) return null
  const [x1, y1, x2, y2] = values
  if (x1 === x2 && y1 === y2) return null
  return { start: { x: x1, y: y1 }, end: { x: x2, y: y2 } }
}

export function CadLinePropertiesPanel({ line, onUpdate, onDelete, onClose }: Props) {
  const [draft, setDraft] = useState<DraftCoordinates>(() => createDraft(line))
  const metrics = useMemo(() => getCustomDrawingLineMetrics(line), [line])
  const parsed = parseDraft(draft)

  useEffect(() => setDraft(createDraft(line)), [line])

  const setCoordinate = (key: keyof DraftCoordinates, value: string) => setDraft((current) => ({ ...current, [key]: value }))

  return <aside className="selected-field-panel cad-line-properties" aria-labelledby="cad-line-properties-title">
    <div className="cad-line-properties-heading">
      <div>
        <h3 id="cad-line-properties-title">Избрана линия</h3>
        <p className="field-breadcrumb">drawing / {line.id}</p>
      </div>
      <button type="button" className="cad-line-properties-close" aria-label="Затвори свойствата на линията" onClick={onClose}>×</button>
    </div>

    <div className="cad-line-metrics" aria-label="Геометрия на линията">
      <span><b>Дължина</b>{metrics.lengthMm.toFixed(1)} mm</span>
      <span><b>Ъгъл</b>{metrics.angleDeg.toFixed(1)}°</span>
    </div>

    <div className="cad-line-coordinate-grid">
      <label>X1 (mm)<input type="number" step="1" value={draft.x1} onChange={(event) => setCoordinate('x1', event.target.value)}/></label>
      <label>Y1 (mm)<input type="number" step="1" value={draft.y1} onChange={(event) => setCoordinate('y1', event.target.value)}/></label>
      <label>X2 (mm)<input type="number" step="1" value={draft.x2} onChange={(event) => setCoordinate('x2', event.target.value)}/></label>
      <label>Y2 (mm)<input type="number" step="1" value={draft.y2} onChange={(event) => setCoordinate('y2', event.target.value)}/></label>
    </div>

    {!parsed && <p className="workflow-requirement" role="alert">Координатите трябва да са числови и началната/крайната точка да са различни.</p>}
    <p className="cad-line-session-note">Линията е помощна чертожна геометрия само за текущата сесия. Не влиза в изделието и не се експортира.</p>

    <div className="cad-line-property-actions">
      <button type="button" disabled={!parsed} onClick={() => parsed && onUpdate(parsed.start, parsed.end)}>Приложи координатите</button>
      <button type="button" className="danger-button" onClick={onDelete}>Изтрий линията</button>
    </div>
  </aside>
}
