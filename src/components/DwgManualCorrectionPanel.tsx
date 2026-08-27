import { useEffect, useRef } from 'react'
import type { DwgCorrectionState } from '../dwgManualTextCorrection'
import type { DwgVisualField } from '../dwgVisualFieldDetection'

interface TextChoice { entityIndex: number; unresolved: boolean }
interface Props { state: DwgCorrectionState; textChoices: readonly TextChoice[]; fieldChoices: readonly DwgVisualField[]; activeAssignmentIds: ReadonlySet<string>; onStart: () => void; onCancel: () => void; onText: (entityIndex: number) => void; onField: (fieldId: string) => void; onUndo: () => void; onRemove: (id: string) => void; onClear: () => void }
export function DwgManualCorrectionPanel({ state, textChoices, fieldChoices, activeAssignmentIds, onStart, onCancel, onText, onField, onUndo, onRemove, onClear }: Props) {
  const primaryAction = useRef<HTMLButtonElement>(null), previousStep = useRef(state.step), previousCount = useRef(state.assignments.length)
  useEffect(() => {
    const completedSelection = previousStep.current === 'SELECT_FIELD' && state.step === 'SELECT_TEXT'
    const returnedToIdle = previousStep.current !== 'IDLE' && state.step === 'IDLE'
    const removedLastAssignment = previousCount.current > 0 && state.assignments.length === 0
    if (completedSelection || returnedToIdle || removedLastAssignment) primaryAction.current?.focus()
    previousStep.current = state.step; previousCount.current = state.assignments.length
  }, [state.assignments.length, state.step])
  return <section className="dwg-manual-correction" aria-labelledby="dwg-manual-title">
    <header><div><h4 id="dwg-manual-title">Ръчни визуални корекции: {state.assignments.length}</h4><p>Корекцията е само за визуален преглед в текущата сесия. DWG файлът и производствените данни не се променят.</p></div>{state.step === 'IDLE' ? <button ref={primaryAction} type="button" onClick={onStart}>Коригирай текст визуално</button> : <><span className="dwg-manual-badge">Ръчна визуална корекция</span><button ref={primaryAction} type="button" onClick={onCancel}>Отказ</button></>}</header>
    <div className="dwg-manual-live" role="status" aria-live="polite">{state.step === 'SELECT_TEXT' ? '1/2 Изберете текст' : state.step === 'SELECT_FIELD' ? '2/2 Изберете правилното поле' : 'Режимът за ръчна визуална корекция не е активен.'}</div>
    {state.step === 'SELECT_TEXT' && <details><summary>Клавиатурен избор на видим текст</summary><div className="dwg-choice-list">{textChoices.map((choice, index) => <button key={choice.entityIndex} type="button" onClick={() => onText(choice.entityIndex)}>Текст {index + 1}{choice.unresolved ? ' · без source ширина' : ' · има source оформление'}</button>)}</div></details>}
    {state.step === 'SELECT_FIELD' && <details open><summary>Клавиатурен избор на доказано поле</summary><div className="dwg-choice-list">{fieldChoices.map((field, index) => <button key={field.id} type="button" onClick={() => onField(field.id)}>Поле {index + 1} · доказани четири граници</button>)}</div></details>}
    {state.assignments.length > 0 && <div className="dwg-manual-actions"><button type="button" onClick={onUndo}>Отмени последната корекция</button><button type="button" onClick={onClear}>Изчисти ръчните корекции</button><ul>{[...state.assignments].sort((a, b) => a.creationOrder - b.creationOrder).map((assignment, index) => <li key={assignment.id}><span>Визуална корекция {index + 1}{activeAssignmentIds.has(assignment.id) ? ' · активна' : ' · временно неактивна'}</span><button type="button" aria-label={`Премахни визуална корекция ${index + 1}`} onClick={() => onRemove(assignment.id)}>Премахни</button></li>)}</ul></div>}
  </section>
}
