import { setDwgPendingNote, type DwgVisualTextEditorState, type DwgVisualTextEditorMode } from '../dwgVisualTextEditor'

interface Props { state: DwgVisualTextEditorState; onMode: (mode: DwgVisualTextEditorMode) => void; onState: (state: DwgVisualTextEditorState) => void; onHide: (hidden: boolean) => void; onResetSource: () => void; onUndo: () => void; onClear: () => void; onUpdateNote: (id: string, text: string) => void; onRemoveNote: (id: string) => void }
export function DwgVisualTextEditorPanel({ state, onMode, onState, onHide, onResetSource, onUndo, onClear, onUpdateNote, onRemoveNote }: Props) {
  const selected = state.selectedEntityIndex !== null, edit = selected ? state.sourceEdits.find((item) => item.entityIndex === state.selectedEntityIndex) : null
  return <section className="dwg-text-editor" aria-labelledby="dwg-text-editor-title">
    <header><div><h4 id="dwg-text-editor-title">Визуален текстов редактор</h4><p>SOURCE текстът остава непроменен. Редакциите са само за текущата browser сесия.</p></div><span>VISUAL ONLY</span></header>
    <div className="dwg-text-editor-toolbar">
      <button type="button" aria-pressed={state.mode === 'SELECT_SOURCE'} onClick={() => onMode('SELECT_SOURCE')}>Избери текст</button>
      <button type="button" disabled={!selected} aria-pressed={state.mode === 'MOVE_SOURCE'} onClick={() => onMode('MOVE_SOURCE')}>Премести с drag</button>
      <button type="button" disabled={!selected} aria-pressed={state.mode === 'DRAW_BOX'} onClick={() => onMode('DRAW_BOX')}>Очертай поле</button>
      <button type="button" disabled={!selected} onClick={() => onHide(!edit?.hidden)}>{edit?.hidden ? 'Покажи текста' : 'Скрий текста визуално'}</button>
      <button type="button" disabled={!selected} onClick={onResetSource}>Възстанови SOURCE</button>
      <button type="button" disabled={!state.history.length} onClick={onUndo}>Undo</button>
      <button type="button" disabled={!state.sourceEdits.length && !state.notes.length} onClick={onClear}>Изчисти всичко</button>
    </div>
    <div className="dwg-text-editor-status" role="status">{state.mode === 'SELECT_SOURCE' ? 'Щракнете върху SOURCE текст.' : state.mode === 'MOVE_SOURCE' ? 'Хванете избрания текст и го преместете с drag.' : state.mode === 'DRAW_BOX' ? 'Изтеглете правоъгълник около желаното поле.' : state.mode === 'PLACE_NOTE' ? 'Щракнете върху чертежа, за да поставите новия текст.' : selected ? `Избран SOURCE текст ${state.selectedEntityIndex! + 1}.` : 'Изберете действие.'}</div>
    <details><summary>Добави нов визуален текст</summary><div className="dwg-note-create"><label>Текст<textarea value={state.pendingNote.text} onChange={(event) => onState(setDwgPendingNote(state, { ...state.pendingNote, text: event.target.value }))}/></label><label>Размер<input type="number" min="1" max="100" value={state.pendingNote.height} onChange={(event) => onState(setDwgPendingNote(state, { ...state.pendingNote, height: Number(event.target.value) }))}/></label><label>Ширина на полето<input type="number" min="10" max="5000" value={state.pendingNote.width} onChange={(event) => onState(setDwgPendingNote(state, { ...state.pendingNote, width: Number(event.target.value) }))}/></label><label>Подравняване<select value={state.pendingNote.align} onChange={(event) => onState(setDwgPendingNote(state, { ...state.pendingNote, align: event.target.value as 'left' | 'center' | 'right' }))}><option value="left">Ляво</option><option value="center">Център</option><option value="right">Дясно</option></select></label><button type="button" disabled={!state.pendingNote.text.trim()} onClick={() => onMode('PLACE_NOTE')}>Постави върху чертежа</button></div></details>
    {state.notes.length > 0 && <details><summary>Добавени визуални текстове: {state.notes.length}</summary><ul className="dwg-note-list">{state.notes.map((note) => <li key={note.id}><input aria-label="Редактирай визуален текст" value={note.text} onChange={(event) => onUpdateNote(note.id, event.target.value)}/><button type="button" onClick={() => onRemoveNote(note.id)}>Премахни</button></li>)}</ul></details>}
  </section>
}
