import { confirmDwgSectionDraft, updateDwgSectionDraft, validateDwgSectionDraft, type DwgSectionDraft } from '../dwgSectionDraft'

interface Props { draft: DwgSectionDraft; onChange: (draft: DwgSectionDraft) => void; onClose: () => void }
const numberOrNull = (value: string) => value === '' ? null : Number(value)

function DraftPreview({ draft }: { draft: DwgSectionDraft }) {
  const width = draft.widthMm ?? 1, height = draft.heightMm ?? 1, aspect = Math.max(0.35, Math.min(2.8, width / height)), boxWidth = aspect >= 1 ? 260 : 260 * aspect, boxHeight = aspect >= 1 ? 260 / aspect : 260, x = (300 - boxWidth) / 2, y = (280 - boxHeight) / 2
  return <svg viewBox="0 0 300 280" role="img" aria-label="Концептуален 2D изглед на ръчно въведената чернова">
    <rect x={x} y={y} width={boxWidth} height={boxHeight} className="dwg-draft-frame"/>
    {Array.from({ length: draft.verticalDividers }, (_, index) => { const dx = x + boxWidth * (index + 1) / (draft.verticalDividers + 1); return <line key={`v-${index}`} x1={dx} y1={y} x2={dx} y2={y + boxHeight} className="dwg-draft-divider"/> })}
    {Array.from({ length: draft.horizontalDividers }, (_, index) => { const dy = y + boxHeight * (index + 1) / (draft.horizontalDividers + 1); return <line key={`h-${index}`} x1={x} y1={dy} x2={x + boxWidth} y2={dy} className="dwg-draft-divider"/> })}
    {Array.from({ length: draft.openingSashes }, (_, index) => { const fieldWidth = boxWidth / Math.max(1, draft.fieldCount), left = x + index * fieldWidth; return <path key={`s-${index}`} d={`M ${left + 4} ${y + 4} L ${left + fieldWidth - 4} ${y + boxHeight / 2} L ${left + 4} ${y + boxHeight - 4}`} className="dwg-draft-opening"/> })}
    <text x="150" y="274" textAnchor="middle">{draft.widthMm ?? '—'} × {draft.heightMm ?? '—'} mm</text>
  </svg>
}

export function DwgSectionDraftPanel({ draft, onChange, onClose }: Props) {
  const validation = validateDwgSectionDraft(draft), setNumber = (field: 'widthMm' | 'heightMm' | 'fieldCount' | 'verticalDividers' | 'horizontalDividers' | 'openingSashes', value: string) => onChange(updateDwgSectionDraft(draft, { [field]: numberOrNull(value) } as never))
  return <section className="dwg-draft" aria-labelledby="dwg-draft-title">
    <header><div><span>ЧЕРНОВА · САМО В ТЕКУЩАТА СЕСИЯ</span><h4 id="dwg-draft-title">Чернова от проверената секция</h4></div><button type="button" onClick={onClose}>Затвори черновата</button></header>
    <div className="dwg-draft-grid">
      <form onSubmit={(event) => { event.preventDefault(); onChange(confirmDwgSectionDraft(draft)) }}>
        <label>Наименование<input value={draft.name} onChange={(event) => onChange(updateDwgSectionDraft(draft, { name: event.target.value }))}/></label>
        <label>Вид<select value={draft.kind} onChange={(event) => onChange(updateDwgSectionDraft(draft, { kind: event.target.value as DwgSectionDraft['kind'] }))}><option value="WINDOW">Прозорец</option><option value="DOOR">Врата</option><option value="FACADE">Фасаден елемент</option></select></label>
        <label>Ширина (mm)<input type="number" min="100" max="20000" value={draft.widthMm ?? ''} onChange={(event) => setNumber('widthMm', event.target.value)}/></label>
        <label>Височина (mm)<input type="number" min="100" max="20000" value={draft.heightMm ?? ''} onChange={(event) => setNumber('heightMm', event.target.value)}/></label>
        <label>Брой полета<input type="number" min="1" max="12" value={draft.fieldCount} onChange={(event) => setNumber('fieldCount', event.target.value)}/></label>
        <label>Вертикални делители<input type="number" min="0" max="11" value={draft.verticalDividers} onChange={(event) => setNumber('verticalDividers', event.target.value)}/></label>
        <label>Хоризонтални делители<input type="number" min="0" max="6" value={draft.horizontalDividers} onChange={(event) => setNumber('horizontalDividers', event.target.value)}/></label>
        <label>Отваряеми крила<input type="number" min="0" max="12" value={draft.openingSashes} onChange={(event) => setNumber('openingSashes', event.target.value)}/></label>
        {validation.errors.length > 0 && <ul className="dwg-draft-errors" role="alert">{validation.errors.map((error) => <li key={error}>{error}</li>)}</ul>}
        <button type="submit" className="primary-action" disabled={!validation.valid}>Потвърди черновата</button>
      </form>
      <div className="dwg-draft-preview"><b>Концептуален 2D изглед</b><DraftPreview draft={draft}/><small>Изграден само от ръчно въведените стойности.</small></div>
    </div>
    <div className={draft.humanConfirmed ? 'dwg-draft-result confirmed' : 'dwg-draft-result'} role="status"><b>{draft.humanConfirmed ? 'Черновата е потвърдена от човек.' : 'Черновата не е потвърдена.'}</b><span>Не е производствено изделие · няма експортиране · машинна готовност: НЕ</span></div>
  </section>
}
