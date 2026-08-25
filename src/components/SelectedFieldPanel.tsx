import { PROVISIONAL_MIN_FIELD_MM } from '../customGeometryTree'
import type { CustomGeometryNode, CustomLeafNode, SplitOrientation } from '../customGeometryTypes'
import type { CatalogueProfile } from '../profileCatalogueTypes'
import { ContextHelp } from './ContextHelp'

interface Props { node?: CustomGeometryNode; fieldWidth: number; fieldHeight: number; profiles: CatalogueProfile[]; errors: string[]; onSplit: (orientation: SplitOrientation, position: number) => void; onRemoveSplit: () => void; onLeaf: (patch: Partial<CustomLeafNode>) => void }

export function SelectedFieldPanel({ node, fieldWidth, fieldHeight, profiles, errors, onSplit, onRemoveSplit, onLeaf }: Props) {
  const [axisSize, defaultPosition] = [Math.max(fieldWidth, fieldHeight), Math.max(fieldWidth, fieldHeight) / 2]
  if (!node) return <aside className="selected-field-panel"><h3>Избрано поле</h3><p>Изберете поле от чертежа.</p></aside>
  return <aside className="selected-field-panel" aria-labelledby="selected-field-title"><h3 id="selected-field-title">Избрано поле</h3><p className="field-breadcrumb">root / {node.id.replace('field-root', '').replaceAll('.', ' / ') || 'основно поле'}</p><small>{Math.round(fieldWidth)} × {Math.round(fieldHeight)} mm</small>
    {node.kind === 'LEAF' ? <>
      <label>Тип на полето<select value={node.fieldType} onChange={(event) => onLeaf({ fieldType: event.target.value as CustomLeafNode['fieldType'], ...(event.target.value !== 'OPENING_SASH' ? { sashProfileId: undefined, openingDirection: undefined } : {}) })}><option value="FIXED">FIXED — Фиксирано</option><option value="OPENING_SASH">OPENING_SASH — Отваряемо крило</option><option value="PLACEHOLDER">PLACEHOLDER — Непотвърдено</option></select></label>
      {node.fieldType === 'OPENING_SASH' && <><label>Профил за крило <ContextHelp helpId="profile-sash"/><select value={node.sashProfileId ?? ''} onChange={(event) => onLeaf({ sashProfileId: event.target.value })}><option value="">Изберете</option>{profiles.filter((item) => item.role === 'SASH' && item.status !== 'ARCHIVED').map((item) => <option key={item.id} value={item.id}>{item.code}</option>)}</select></label><fieldset><legend>Посока — експертно потвърдена конвенция</legend><label><input type="radio" checked={node.openingDirection === 'left'} onChange={() => onLeaf({ openingDirection: 'left' })}/> LEFT — ляво</label><label><input type="radio" checked={node.openingDirection === 'right'} onChange={() => onLeaf({ openingDirection: 'right' })}/> RIGHT — дясно</label></fieldset></>}
      <div className="split-actions"><button onClick={() => onSplit('VERTICAL', fieldWidth / 2)} disabled={fieldWidth < PROVISIONAL_MIN_FIELD_MM * 2}>Раздели вертикално</button><button onClick={() => onSplit('HORIZONTAL', fieldHeight / 2)} disabled={fieldHeight < PROVISIONAL_MIN_FIELD_MM * 2}>Раздели хоризонтално</button></div>
      <p className="provisional-minimum">Временен демонстрационен минимум: {PROVISIONAL_MIN_FIELD_MM} mm за поле. Не е производствен просвет.</p>
    </> : <><label>Позиция на делителя (mm)<input type="number" min={PROVISIONAL_MIN_FIELD_MM} max={axisSize - PROVISIONAL_MIN_FIELD_MM} value={node.position} onChange={(event) => onSplit(node.orientation, Number(event.target.value))}/></label><label>Процентен помощник<input type="range" min="10" max="90" value={(node.position / (node.orientation === 'VERTICAL' ? fieldWidth : fieldHeight)) * 100 || 50} onChange={(event) => onSplit(node.orientation, (node.orientation === 'VERTICAL' ? fieldWidth : fieldHeight) * Number(event.target.value) / 100)}/></label><button className="danger-button" onClick={onRemoveSplit}>Премахни разделянето</button><button onClick={() => onSplit(node.orientation, defaultPosition)}>Центрирай делителя</button></>}
    {errors.length > 0 && <div className="inline-errors" role="alert"><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}
  </aside>
}

