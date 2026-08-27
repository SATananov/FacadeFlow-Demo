import type { DwgBounds, DwgPoint } from './dwgViewerTypes'

export type DwgVisualTextEditorMode = 'IDLE' | 'SELECT_SOURCE' | 'MOVE_SOURCE' | 'DRAW_BOX' | 'PLACE_NOTE'
export type DwgVisualTextAlign = 'left' | 'center' | 'right'
export interface DwgVisualSourceEdit { entityIndex: number; offsetX: number; offsetY: number; box: DwgBounds | null; hidden: boolean }
export interface DwgVisualNote { id: string; text: string; position: DwgPoint; height: number; width: number; align: DwgVisualTextAlign }
interface Snapshot { sourceEdits: readonly DwgVisualSourceEdit[]; notes: readonly DwgVisualNote[] }
export interface DwgVisualTextEditorState { mode: DwgVisualTextEditorMode; selectedEntityIndex: number | null; sourceEdits: readonly DwgVisualSourceEdit[]; notes: readonly DwgVisualNote[]; history: readonly Snapshot[]; nextNoteId: number; pendingNote: Omit<DwgVisualNote, 'id' | 'position'>; simulationOnly: true; machineReady: false; internalEvaluationOnly: true }

const copySnapshot = (state: DwgVisualTextEditorState): Snapshot => ({ sourceEdits: state.sourceEdits.map((edit) => ({ ...edit, box: edit.box ? { ...edit.box } : null })), notes: state.notes.map((note) => ({ ...note, position: { ...note.position } })) })
const changed = (state: DwgVisualTextEditorState, patch: Partial<DwgVisualTextEditorState>): DwgVisualTextEditorState => ({ ...state, ...patch, history: [...state.history, copySnapshot(state)] })
const editFor = (state: DwgVisualTextEditorState, entityIndex: number): DwgVisualSourceEdit => state.sourceEdits.find((edit) => edit.entityIndex === entityIndex) ?? { entityIndex, offsetX: 0, offsetY: 0, box: null, hidden: false }
const replaceEdit = (state: DwgVisualTextEditorState, edit: DwgVisualSourceEdit) => [...state.sourceEdits.filter((item) => item.entityIndex !== edit.entityIndex), edit]

export const initialDwgVisualTextEditorState = (): DwgVisualTextEditorState => ({ mode: 'IDLE', selectedEntityIndex: null, sourceEdits: [], notes: [], history: [], nextNoteId: 1, pendingNote: { text: 'Нов визуален текст', height: 8, width: 120, align: 'left' }, simulationOnly: true, machineReady: false, internalEvaluationOnly: true })
export const setDwgVisualEditorMode = (state: DwgVisualTextEditorState, mode: DwgVisualTextEditorMode): DwgVisualTextEditorState => ({ ...state, mode })
export const selectDwgVisualSource = (state: DwgVisualTextEditorState, entityIndex: number): DwgVisualTextEditorState => ({ ...state, selectedEntityIndex: entityIndex })
export const moveDwgVisualSource = (state: DwgVisualTextEditorState, entityIndex: number, dx: number, dy: number): DwgVisualTextEditorState => { const edit = editFor(state, entityIndex); return changed(state, { sourceEdits: replaceEdit(state, { ...edit, offsetX: edit.offsetX + dx, offsetY: edit.offsetY + dy }), selectedEntityIndex: entityIndex }) }
export const setDwgVisualSourceBox = (state: DwgVisualTextEditorState, entityIndex: number, box: DwgBounds): DwgVisualTextEditorState => {
  const edit = editFor(state, entityIndex)
  const normalizedBox = { minX: Math.min(box.minX, box.maxX), minY: Math.min(box.minY, box.maxY), maxX: Math.max(box.minX, box.maxX), maxY: Math.max(box.minY, box.maxY) }
  return changed(state, { sourceEdits: replaceEdit(state, { ...edit, box: normalizedBox }), selectedEntityIndex: entityIndex })
}
export const setDwgVisualSourceHidden = (state: DwgVisualTextEditorState, entityIndex: number, hidden: boolean): DwgVisualTextEditorState => { const edit = editFor(state, entityIndex); return changed(state, { sourceEdits: replaceEdit(state, { ...edit, hidden }), selectedEntityIndex: entityIndex }) }
export const resetDwgVisualSource = (state: DwgVisualTextEditorState, entityIndex: number): DwgVisualTextEditorState => changed(state, { sourceEdits: state.sourceEdits.filter((edit) => edit.entityIndex !== entityIndex), selectedEntityIndex: null })
export const setDwgPendingNote = (state: DwgVisualTextEditorState, pendingNote: DwgVisualTextEditorState['pendingNote']): DwgVisualTextEditorState => ({ ...state, pendingNote })
export const addDwgVisualNote = (state: DwgVisualTextEditorState, position: DwgPoint): DwgVisualTextEditorState => changed(state, { notes: [...state.notes, { id: `visual-note-${state.nextNoteId}`, position: { ...position }, ...state.pendingNote }], nextNoteId: state.nextNoteId + 1, mode: 'IDLE' })
export const updateDwgVisualNote = (state: DwgVisualTextEditorState, id: string, patch: Partial<Omit<DwgVisualNote, 'id'>>): DwgVisualTextEditorState => changed(state, { notes: state.notes.map((note) => note.id === id ? { ...note, ...patch } : note) })
export const removeDwgVisualNote = (state: DwgVisualTextEditorState, id: string): DwgVisualTextEditorState => changed(state, { notes: state.notes.filter((note) => note.id !== id) })
export const undoDwgVisualTextEdit = (state: DwgVisualTextEditorState): DwgVisualTextEditorState => { const snapshot = state.history.at(-1); return snapshot ? { ...state, sourceEdits: snapshot.sourceEdits, notes: snapshot.notes, history: state.history.slice(0, -1) } : state }
export const clearDwgVisualTextEdits = (state: DwgVisualTextEditorState): DwgVisualTextEditorState => changed(state, { sourceEdits: [], notes: [], selectedEntityIndex: null, mode: 'IDLE' })
