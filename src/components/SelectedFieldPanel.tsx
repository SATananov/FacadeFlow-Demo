import { PROVISIONAL_MIN_FIELD_MM } from '../customGeometryTree'
import type { CustomGeometryNode, CustomLeafNode, SplitOrientation } from '../customGeometryTypes'
import type { CatalogueProfile } from '../profileCatalogueTypes'
import { ContextHelp } from './ContextHelp'

interface Props {
  node?: CustomGeometryNode
  fieldWidth: number
  fieldHeight: number
  profiles: CatalogueProfile[]
  errors: string[]
  frameReady: boolean
  defaultSashProfileId?: string
  onSplit: (orientation: SplitOrientation, position: number) => void
  onRemoveSplit: () => void
  onLeaf: (patch: Partial<CustomLeafNode>) => void
}

export function SelectedFieldPanel({ node, fieldWidth, fieldHeight, profiles, errors, frameReady, defaultSashProfileId, onSplit, onRemoveSplit, onLeaf }: Props) {
  const [axisSize, defaultPosition] = [Math.max(fieldWidth, fieldHeight), Math.max(fieldWidth, fieldHeight) / 2]
  const fieldIsValid = Number.isFinite(fieldWidth) && Number.isFinite(fieldHeight) && fieldWidth >= PROVISIONAL_MIN_FIELD_MM && fieldHeight >= PROVISIONAL_MIN_FIELD_MM
  const availableSashes = profiles.filter((item) => item.role === 'SASH' && item.status !== 'ARCHIVED')
  const initialSashProfileId = availableSashes.some((item) => item.id === defaultSashProfileId) ? defaultSashProfileId : availableSashes[0]?.id

  if (!node) return <aside className="selected-field-panel"><h3>Избрано поле</h3><p>Изберете поле от чертежа.</p></aside>

  return <aside className="selected-field-panel" aria-labelledby="selected-field-title">
    <h3 id="selected-field-title">Избрано поле</h3>
    <p className="field-breadcrumb">root / {node.id.replace('field-root', '').replaceAll('.', ' / ') || 'основно поле'}</p>
    <small>{Math.round(fieldWidth)} × {Math.round(fieldHeight)} mm</small>
    {node.kind === 'LEAF' ? <>
      <label>Състояние на полето
        <select value={node.fieldType === 'OPENING_SASH' ? 'FIXED' : node.fieldType} disabled={node.fieldType === 'OPENING_SASH'} onChange={(event) => onLeaf({ fieldType: event.target.value as 'FIXED' | 'PLACEHOLDER', sashProfileId: undefined, openingDirection: undefined })}>
          <option value="FIXED">FIXED — Фиксирано остъкляване</option>
          <option value="PLACEHOLDER">PLACEHOLDER — Непотвърдено</option>
        </select>
      </label>
      {node.fieldType !== 'OPENING_SASH' ? <>
        <button type="button" disabled={!frameReady || !fieldIsValid || !initialSashProfileId} onClick={() => onLeaf({ fieldType: 'OPENING_SASH', sashProfileId: initialSashProfileId, openingDirection: undefined })}>Създай крило в избраното поле</button>
        {!frameReady && <p className="workflow-requirement">Първо създайте външната каса.</p>}
        {frameReady && !fieldIsValid && <p className="workflow-requirement">Полето трябва да е валидно, преди да получи крило.</p>}
        {frameReady && fieldIsValid && !initialSashProfileId && <p className="workflow-requirement">Няма активен профил за крило.</p>}
      </> : <>
        <p className="field-state-note">В това поле има създадено крило.</p>
        <label>Профил за крило <ContextHelp helpId="profile-sash"/>
          <select value={node.sashProfileId ?? ''} onChange={(event) => onLeaf({ sashProfileId: event.target.value || undefined, openingDirection: undefined })}>
            <option value="">Изберете</option>
            {availableSashes.map((item) => <option key={item.id} value={item.id}>{item.code}</option>)}
          </select>
        </label>
        {node.sashProfileId && <fieldset>
          <legend>Посока — задава се след създаване на крилото</legend>
          <label><input type="radio" checked={node.openingDirection === 'left'} onChange={() => onLeaf({ openingDirection: 'left' })}/> LEFT — ляво</label>
          <label><input type="radio" checked={node.openingDirection === 'right'} onChange={() => onLeaf({ openingDirection: 'right' })}/> RIGHT — дясно</label>
        </fieldset>}
        {!node.sashProfileId && <p className="workflow-requirement">Изберете профил за създаденото крило, преди да зададете посока.</p>}
        <button type="button" className="danger-button" onClick={() => onLeaf({ fieldType: 'FIXED', sashProfileId: undefined, openingDirection: undefined })}>Премахни крилото</button>
      </>}
      <div className="split-actions">
        <button onClick={() => onSplit('VERTICAL', fieldWidth / 2)} disabled={!frameReady || fieldWidth < PROVISIONAL_MIN_FIELD_MM * 2}>Раздели вертикално</button>
        <button onClick={() => onSplit('HORIZONTAL', fieldHeight / 2)} disabled={!frameReady || fieldHeight < PROVISIONAL_MIN_FIELD_MM * 2}>Раздели хоризонтално</button>
      </div>
      <p className="provisional-minimum">Временен демонстрационен минимум: {PROVISIONAL_MIN_FIELD_MM} mm за поле. Не е производствен просвет.</p>
    </> : <>
      <label>Позиция на делителя (mm)<input type="number" min={PROVISIONAL_MIN_FIELD_MM} max={axisSize - PROVISIONAL_MIN_FIELD_MM} value={node.position} disabled={!frameReady} onChange={(event) => onSplit(node.orientation, Number(event.target.value))}/></label>
      <label>Процентен помощник<input type="range" min="10" max="90" value={(node.position / (node.orientation === 'VERTICAL' ? fieldWidth : fieldHeight)) * 100 || 50} disabled={!frameReady} onChange={(event) => onSplit(node.orientation, (node.orientation === 'VERTICAL' ? fieldWidth : fieldHeight) * Number(event.target.value) / 100)}/></label>
      <button className="danger-button" disabled={!frameReady} onClick={onRemoveSplit}>Премахни разделянето</button>
      <button disabled={!frameReady} onClick={() => onSplit(node.orientation, defaultPosition)}>Центрирай делителя</button>
    </>}
    {errors.length > 0 && <div className="inline-errors" role="alert"><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}
  </aside>
}
