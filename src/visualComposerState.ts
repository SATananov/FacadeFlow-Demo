import { composerTemplateById } from './visualComposerTemplates'
import type { ComposerColor, ComposerComponent, ComposerItemType, ComposerOpeningDirection, VisualComposition } from './visualComposerTypes'
export const composerFieldDisplayName = (fields: VisualComposition['fields'], id: string) => { const index = fields.findIndex((field) => field.id === id); if (fields.length === 2) return index === 0 ? 'Ляво поле' : 'Дясно поле'; if (fields.length === 3) return index === 0 ? 'Ляво поле' : index === 1 ? 'Средно поле' : 'Дясно поле'; return `Поле ${index + 1}` }
const safety = { sessionOnly: true, simulationOnly: true, machineReady: false, internalEvaluationOnly: true, productionApproved: false, sourceImmutable: true, exportAvailable: false, dwgWriteAvailable: false, machineConnectivityAvailable: false, geometryCreated: false } as const
export const createEmptyComposition = (): VisualComposition => ({ templateId: null, fields: [], components: [], selectedFieldId: null, selectedComponentId: null, interiorColor: '', exteriorColor: '', interiorColorCustom: '', exteriorColorCustom: '', status: 'EMPTY', message: 'Изберете демонстрационен шаблон.', ...safety })
export function applyComposerTemplate(current: VisualComposition, templateId: string): VisualComposition {
  const template = composerTemplateById(templateId); if (!template) return { ...current, message: 'Невалиден демонстрационен шаблон.' }
  const fields = template.fields.map((item) => ({ ...item, rect: { ...item.rect }, attachedHandleId: null, attachedHingeIds: [], humanReviewState: 'UNREVIEWED' as const }))
  const components: ComposerComponent[] = template.dividers.map((item) => ({ ...item, parentFieldId: null, role: 'DIVIDER', source: 'DEMO', simulationOnly: true, machineReady: false, productionApproved: false }))
  return { ...current, templateId, fields, components, selectedFieldId: fields[0]?.id ?? null, selectedComponentId: null, status: 'NEEDS_REVIEW', message: 'Демонстрационният шаблон е приложен без автоматична посока или обков.' }
}
export const selectComposerField = (state: VisualComposition, id: string): VisualComposition => state.fields.some((field) => field.id === id) ? { ...state, selectedFieldId: id, selectedComponentId: null, message: '' } : state
export const selectComposerComponent = (state: VisualComposition, id: string): VisualComposition => state.components.some((item) => item.id === id) ? { ...state, selectedComponentId: id, selectedFieldId: state.components.find((item) => item.id === id)?.parentFieldId ?? null, message: '' } : state
const changed = (state: VisualComposition, patch: Partial<VisualComposition>): VisualComposition => { const next = { ...state, ...patch }; return { ...next, fields: next.fields.map((field) => ({ ...field, humanReviewState: 'UNREVIEWED' })), status: state.status === 'HUMAN_CONFIRMED' ? 'NEEDS_REVIEW' : 'DRAFT' } }
export const clampPositionRatio = (value: number) => Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : .5
export function applyComposerItem(state: VisualComposition, item: ComposerItemType, idFactory: () => string, positionRatio = .5): VisualComposition {
  const index = state.fields.findIndex(({ id }) => id === state.selectedFieldId); if (index < 0) return { ...state, message: 'Изберете целево поле.' }
  const field = state.fields[index]!, fields = [...state.fields], components = [...state.components]
  const reject = (message: string) => ({ ...state, message })
  if (item === 'DIVIDER_VERTICAL' || item === 'DIVIDER_HORIZONTAL') { const id = idFactory(), type = item === 'DIVIDER_VERTICAL' ? 'VERTICAL_DIVIDER' : 'HORIZONTAL_DIVIDER'; components.push({ id, type, parentFieldId: field.id, role: 'DIVIDER', placement: 'среда', source: 'DEMO', simulationOnly: true, machineReady: false, productionApproved: false }); return changed(state, { components, selectedComponentId: id, message: 'Добавен е демонстрационен семантичен делител.' }) }
  if (item === 'FIELD_FIXED' || item === 'OPEN_FIXED') {
    const removedIds = new Set([field.attachedHandleId, ...field.attachedHingeIds].filter(Boolean)); fields[index] = { ...field, fieldType: 'FIXED', openingDirection: null, attachedHandleId: null, attachedHingeIds: [] }; return changed(state, { fields, components: components.filter(({ id }) => !removedIds.has(id)), selectedComponentId: null, message: 'Полето е зададено като фиксирано; несъвместимите DEMO назначения са премахнати по изрично действие.' })
  }
  if (item === 'FIELD_OPENING') { fields[index] = { ...field, fieldType: 'OPENABLE', openingDirection: null }; return changed(state, { fields, message: 'Полето е зададено като отваряемо; изберете посока.' }) }
  if (field.fieldType !== 'OPENABLE') return reject('Компонентът или отварянето не могат да се приложат върху фиксирано поле.')
  const directions: Partial<Record<ComposerItemType, ComposerOpeningDirection>> = { OPEN_LEFT: 'LEFT', OPEN_RIGHT: 'RIGHT', OPEN_TILT: 'TILT', OPEN_TILT_LEFT: 'TILT_LEFT', OPEN_TILT_RIGHT: 'TILT_RIGHT' }
  if (directions[item]) {
    const direction = directions[item]!, hingeSide: ComposerComponent['side'] | null = direction === 'LEFT' || direction === 'TILT_LEFT' ? 'LEFT' : direction === 'RIGHT' || direction === 'TILT_RIGHT' ? 'RIGHT' : null
    fields[index] = { ...field, openingDirection: direction, attachedHandleId: hingeSide ? field.attachedHandleId : null, attachedHingeIds: hingeSide ? field.attachedHingeIds : [] }
    const compatibleComponents: ComposerComponent[] = hingeSide ? components.map((entry) => entry.parentFieldId !== field.id ? entry : entry.type === 'HINGE' ? { ...entry, side: hingeSide } : entry.type === 'HANDLE' ? { ...entry, side: hingeSide === 'LEFT' ? 'RIGHT' : 'LEFT' } : entry) : components.filter((entry) => entry.parentFieldId !== field.id || entry.role === 'DIVIDER')
    return changed(state, { fields, components: compatibleComponents, selectedComponentId: hingeSide ? state.selectedComponentId : null, message: 'Посоката на отваряне е приложена.' })
  }
  if (item === 'HANDLE') {
    if (field.attachedHandleId) return reject('Полето вече има демонстрационна дръжка.')
    const side = field.openingDirection === 'LEFT' || field.openingDirection === 'TILT_LEFT' ? 'RIGHT' : field.openingDirection === 'RIGHT' || field.openingDirection === 'TILT_RIGHT' ? 'LEFT' : null
    if (!side) return reject('За дръжка е необходима поддържана посока ляво или дясно.')
    const id = idFactory(), ratio = clampPositionRatio(positionRatio); fields[index] = { ...field, attachedHandleId: id }; components.push({ ...component(id, 'HANDLE', field.id, 'HANDLE', `${Math.round(ratio * 100)}%`), positionRatio: ratio, side }); return changed(state, { fields, components, selectedComponentId: id, message: 'Добавена е демонстрационна дръжка.' })
  }
  const side = field.openingDirection === 'LEFT' || field.openingDirection === 'TILT_LEFT' ? 'LEFT' : field.openingDirection === 'RIGHT' || field.openingDirection === 'TILT_RIGHT' ? 'RIGHT' : null
  if (!side) return reject('За панта е необходима поддържана посока ляво или дясно.')
  const id = idFactory(), ratio = clampPositionRatio(positionRatio); fields[index] = { ...field, attachedHingeIds: [...field.attachedHingeIds, id] }; components.push({ ...component(id, 'HINGE', field.id, 'HINGE', `${Math.round(ratio * 100)}%`), positionRatio: ratio, side }); return changed(state, { fields, components, selectedComponentId: id, message: 'Добавена е отделна демонстрационна панта.' })
}
const component = (id: string, type: 'HANDLE' | 'HINGE', parentFieldId: string, role: 'HANDLE' | 'HINGE', placement: string): ComposerComponent => ({ id, type, parentFieldId, role, placement, source: 'DEMO', simulationOnly: true, machineReady: false, productionApproved: false })
export function moveComposerHinge(state: VisualComposition, hingeId: string, positionRatio: number): VisualComposition { const target = state.components.find((item) => item.id === hingeId && item.type === 'HINGE'); if (!target) return { ...state, message: 'Изберете валидна демонстрационна панта.' }; const ratio = clampPositionRatio(positionRatio), next = changed(state, { components: state.components.map((item) => item.id === hingeId ? { ...item, positionRatio: ratio, placement: `${Math.round(ratio * 100)}%` } : item), message: 'Концептуалната позиция на пантата е променена.' }); return { ...next, status: 'NEEDS_REVIEW' } }
export function moveComposerHandle(state: VisualComposition, handleId: string, positionRatio: number): VisualComposition { const target = state.components.find((item) => item.id === handleId && item.type === 'HANDLE'); if (!target) return { ...state, message: 'Изберете валидна демонстрационна дръжка.' }; const ratio = clampPositionRatio(positionRatio), next = changed(state, { components: state.components.map((item) => item.id === handleId ? { ...item, positionRatio: ratio, placement: `${Math.round(ratio * 100)}%` } : item), message: 'Концептуалната позиция на дръжката е променена.' }); return { ...next, status: 'NEEDS_REVIEW' } }
export function setComposerColor(state: VisualComposition, surface: 'INTERIOR' | 'EXTERIOR', color: ComposerColor, custom = ''): VisualComposition { return changed(state, surface === 'INTERIOR' ? { interiorColor: color, interiorColorCustom: color === 'CUSTOM' ? custom : '', message: 'Демонстрационният вътрешен цвят е променен.' } : { exteriorColor: color, exteriorColorCustom: color === 'CUSTOM' ? custom : '', message: 'Демонстрационният външен цвят е променен.' }) }
export function deleteSelectedComposerComponent(state: VisualComposition): VisualComposition {
  const target = state.components.find(({ id }) => id === state.selectedComponentId); if (!target || target.role === 'DIVIDER') return { ...state, message: 'Изберете ръчно добавена дръжка или панта.' }
  const fields = state.fields.map((field) => field.id !== target.parentFieldId ? field : { ...field, attachedHandleId: field.attachedHandleId === target.id ? null : field.attachedHandleId, attachedHingeIds: field.attachedHingeIds.filter((id) => id !== target.id) })
  return changed(state, { fields, components: state.components.filter(({ id }) => id !== target.id), selectedComponentId: null, message: 'Компонентът е изтрит.' })
}
export const clearComposition = (): VisualComposition => ({ ...createEmptyComposition(), message: 'Композицията е изчистена.' })
export const confirmComposition = (state: VisualComposition, humanReviewed: boolean): VisualComposition => {
  if (!state.templateId) return { ...state, message: 'Първо изберете шаблон.' }
  if (state.fields.some((field) => field.fieldType === 'OPENABLE' && !field.openingDirection)) return { ...state, message: 'Изберете посока за всяко отваряемо поле.' }
  if (!humanReviewed) return { ...state, message: 'Потвърдете човешката проверка.' }
  return { ...state, fields: state.fields.map((field) => ({ ...field, humanReviewState: 'HUMAN_CONFIRMED' })), status: 'HUMAN_CONFIRMED', message: 'Композицията е потвърдена от човек като концептуална симулация.' }
}
