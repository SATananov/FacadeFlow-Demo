import { calculateDwgInnerFieldBounds, type DwgApproximateTextAssignment, type DwgVisualField } from './dwgVisualFieldDetection'
import type { DwgBounds, DwgDrawableEntity } from './dwgViewerTypes'

export type DwgCorrectionStep = 'IDLE' | 'SELECT_TEXT' | 'SELECT_FIELD'
export interface DwgTextHitCandidate { entityIndex: number; bounds: DwgBounds; unresolvedNoWidth: boolean }
export interface DwgManualTextAssignment { id: string; textId: string; entityIndex: number; fieldId: string; fieldBounds: DwgBounds; innerBounds: DwgBounds; sourceEntities: DwgVisualField['sourceEntities']; creationOrder: number; mode: 'MANUAL_APPROXIMATE_FIELD'; humanConfirmed: true; simulationOnly: true; machineReady: false; internalEvaluationOnly: true }
export interface DwgCorrectionState { step: DwgCorrectionStep; selectedEntityIndex: number | null; assignments: readonly DwgManualTextAssignment[]; nextCreationOrder: number }
export const initialDwgCorrectionState = (): DwgCorrectionState => ({ step: 'IDLE', selectedEntityIndex: null, assignments: Object.freeze([]), nextCreationOrder: 1 })
export const startDwgCorrection = (state: DwgCorrectionState): DwgCorrectionState => ({ ...state, step: 'SELECT_TEXT', selectedEntityIndex: null })
export const selectDwgCorrectionText = (state: DwgCorrectionState, entityIndex: number): DwgCorrectionState => ({ ...state, step: 'SELECT_FIELD', selectedEntityIndex: entityIndex })
export const cancelDwgCorrectionStep = (state: DwgCorrectionState): DwgCorrectionState => state.step === 'SELECT_FIELD' ? { ...state, step: 'SELECT_TEXT', selectedEntityIndex: null } : { ...state, step: 'IDLE', selectedEntityIndex: null }
export const stopDwgCorrection = (state: DwgCorrectionState): DwgCorrectionState => ({ ...state, step: 'IDLE', selectedEntityIndex: null })
export function applyDwgManualAssignment(state: DwgCorrectionState, field: DwgVisualField, entity: DwgDrawableEntity): DwgCorrectionState {
  if (state.step !== 'SELECT_FIELD' || state.selectedEntityIndex === null || entity.type !== 'TEXT') return state
  const assignment: DwgManualTextAssignment = Object.freeze({ id: `manual-display-${state.nextCreationOrder}`, textId: `display-text-${state.selectedEntityIndex}`, entityIndex: state.selectedEntityIndex, fieldId: field.id, fieldBounds: Object.freeze({ ...field.bounds }), innerBounds: Object.freeze(calculateDwgInnerFieldBounds(field.bounds, entity.height)), sourceEntities: Object.freeze(field.sourceEntities.map((item) => Object.freeze({ ...item }))), creationOrder: state.nextCreationOrder, mode: 'MANUAL_APPROXIMATE_FIELD', humanConfirmed: true, simulationOnly: true, machineReady: false, internalEvaluationOnly: true })
  return { step: 'SELECT_TEXT', selectedEntityIndex: null, assignments: Object.freeze([...state.assignments.filter((item) => item.entityIndex !== state.selectedEntityIndex), assignment]), nextCreationOrder: state.nextCreationOrder + 1 }
}
export const undoDwgManualAssignment = (state: DwgCorrectionState): DwgCorrectionState => ({ ...state, assignments: Object.freeze(state.assignments.filter((item) => item.creationOrder !== Math.max(0, ...state.assignments.map((candidate) => candidate.creationOrder)))) })
export const removeDwgManualAssignment = (state: DwgCorrectionState, id: string): DwgCorrectionState => ({ ...state, assignments: Object.freeze(state.assignments.filter((item) => item.id !== id)) })
export const clearDwgManualAssignments = (state: DwgCorrectionState): DwgCorrectionState => ({ ...state, assignments: Object.freeze([]), selectedEntityIndex: null, step: state.step === 'IDLE' ? 'IDLE' : 'SELECT_TEXT' })
const contains = (bounds: DwgBounds, x: number, y: number) => x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY
const area = (bounds: DwgBounds) => (bounds.maxX - bounds.minX) * (bounds.maxY - bounds.minY)
export function hitTestVisibleDwgText(candidates: readonly DwgTextHitCandidate[], x: number, y: number) { return candidates.filter((candidate) => contains(candidate.bounds, x, y)).sort((a, b) => Number(b.unresolvedNoWidth) - Number(a.unresolvedNoWidth) || area(a.bounds) - area(b.bounds) || a.entityIndex - b.entityIndex)[0] ?? null }
export function hitTestDwgVisualField(fields: readonly DwgVisualField[], sectionId: string, x: number, y: number) { return fields.filter((field) => field.sectionId === sectionId && x > field.bounds.minX && x < field.bounds.maxX && y > field.bounds.minY && y < field.bounds.maxY).sort((a, b) => area(a.bounds) - area(b.bounds) || a.id.localeCompare(b.id))[0] ?? null }
export function resolveDwgManualDisplayAssignments(assignments: readonly DwgManualTextAssignment[], entities: readonly DwgDrawableEntity[], fields: readonly DwgVisualField[], visibleLayers: ReadonlySet<string>) {
  const result = new Map<number, DwgManualTextAssignment>()
  for (const assignment of assignments) { const entity = entities[assignment.entityIndex], field = fields.find((candidate) => candidate.id === assignment.fieldId); if (entity?.type === 'TEXT' && visibleLayers.has(entity.layer) && field && JSON.stringify(field.sourceEntities) === JSON.stringify(assignment.sourceEntities)) result.set(assignment.entityIndex, assignment) }
  return result
}
export function mergeDwgDisplayAssignments(automatic: ReadonlyMap<number, DwgApproximateTextAssignment>, manual: ReadonlyMap<number, DwgManualTextAssignment>) { const result = new Map<number, DwgApproximateTextAssignment | DwgManualTextAssignment>(automatic); manual.forEach((value, key) => result.set(key, value)); return result }
