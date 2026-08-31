import { useState } from 'react'
import {
  applyFacadeFlowDryRunDemoMappingChoices,
  buildFacadeFlowDryRunActivationCandidate,
  confirmFacadeFlowDryRunHumanMapping,
  createFacadeFlowRealDataDryRunState,
  loadFacadeFlowDryRunDemoIntake,
  stageFacadeFlowDryRunDemoRecord,
  type FacadeFlowRealDataDryRunStep,
} from '../aiRealDataDryRun'
import type { FacadeFlowStagingMappingDecision, FacadeFlowStagingRecordStatus } from '../aiRealDataStaging'
import type { FacadeFlowRealDataRecordStatus } from '../aiRealDataIntake'
import './RealDataDryRun.css'

const stepOrder: FacadeFlowRealDataDryRunStep[] = ['EMPTY', 'INTAKE_READY', 'STAGED', 'MAPPING_READY', 'HUMAN_CONFIRMED', 'ACTIVATION_CANDIDATE']

const decisionLabels: Record<FacadeFlowStagingMappingDecision, string> = {
  UNREVIEWED: 'НЕПРЕГЛЕДАНО',
  KEEP_SOURCE: 'ЗАПАЗИ ИЗТОЧНИКА',
  MAP_TO_CANONICAL: 'СЪПОСТАВИ КЪМ СТАНДАРТНА СТОЙНОСТ',
  ACKNOWLEDGED_UNRESOLVED: 'ПОТВЪРДЕНО КАТО НЕУТОЧНЕНО',
}


const intakeStatusLabels: Record<FacadeFlowRealDataRecordStatus, string> = {
  UNRESOLVED: 'НЕУТОЧНЕН',
  CONFLICT: 'КОНФЛИКТ',
  READY_FOR_REVIEW: 'ГОТОВ ЗА ПРЕГЛЕД',
}

const stagingStatusLabels: Record<FacadeFlowStagingRecordStatus, string> = {
  MAPPING_INCOMPLETE: 'СЪПОСТАВЯНЕТО Е НЕПЪЛНО',
  READY_FOR_HUMAN_CONFIRMATION: 'ГОТОВО ЗА ЧОВЕШКО ПОТВЪРЖДЕНИЕ',
  READY_FOR_ACTIVATION_REVIEW: 'ГОТОВО ЗА ПРЕГЛЕД ЗА АКТИВИРАНЕ',
}

function localizedDryRunValue(fieldId: string, value: string | null) {
  if (!value) return 'НЕУТОЧНЕНО'
  if (fieldId === 'recordKind' && value === 'PRODUCT') return 'ИЗДЕЛИЕ'
  if (fieldId === 'productType' && value === 'WINDOW') return 'ПРОЗОРЕЦ'
  if (fieldId === 'profileSystem' && value === 'DEMO SOURCE SYSTEM') return 'DEMO ИЗХОДНА СИСТЕМА'
  if (fieldId === 'profileSystem' && value === 'DEMO CANONICAL SYSTEM') return 'DEMO СТАНДАРТНА СИСТЕМА'
  if (fieldId === 'glassFill' && value === 'DEMO-SOURCE-GLAZING') return 'DEMO ИЗХОДЕН СТЪКЛОПАКЕТ'
  if (fieldId === 'projectPosition') return value.replace('FLOOR 1', 'ЕТАЖ 1').replace('ROOM A', 'СТАЯ A')
  return value
}

const dryRunSteps = [
  ['1', 'ТЕСТОВ ВХОД', 'Изцяло DEMO запис, без реални проектни или производствени данни.'],
  ['2', 'ВХОДЕН ДОГОВОР', 'Проверява се само структурата на записа и проследимостта.'],
  ['3', 'КАРАНТИНА', 'Създава се карантинно копие само за текущата сесия, без автоматично съпоставяне.'],
  ['4', 'ЧОВЕШКО СЪПОСТАВЯНЕ', 'Тестовите решения се преглеждат и се потвърждават от човек.'],
  ['5', 'КАНДИДАТ ЗА АКТИВИРАНЕ', 'Създава се само кандидат за отделен бъдещ преглед.'],
  ['6', 'АКТИВНИ ДАННИ', 'Остават 0. Контролният тест няма право да активира данни.'],
] as const

export function RealDataDryRun() {
  const [state, setState] = useState(createFacadeFlowRealDataDryRunState)
  const [reviewer, setReviewer] = useState('')
  const [acknowledged, setAcknowledged] = useState(false)
  const currentIndex = stepOrder.indexOf(state.step)
  const mappings = state.staging?.mappings ?? []

  const reset = () => {
    setState(createFacadeFlowRealDataDryRunState())
    setReviewer('')
    setAcknowledged(false)
  }

  return <section className="ff-ai-real-data-dry-run" aria-label="Контролен тестов маршрут преди реалните данни">
    <div className="ff-ai-real-data-dry-run-head">
      <div><span>06C.3.9.1 · КОНТРОЛЕН ТЕСТОВ МАРШРУТ</span><h4>Последна проверка преди реалните данни</h4><p>Този сценарий използва само стойности, маркирани като DEMO. Той доказва целия маршрут: входен договор → карантина → човешко съпоставяне → кандидат за активиране, без да създава активни данни.</p></div>
      <div><b>{state.step === 'ACTIVATION_CANDIDATE' ? 'КОНТРОЛЕН ТЕСТ · ЗАВЪРШЕН' : 'КОНТРОЛЕН ТЕСТ · В ПРОЦЕС'}</b><small>РЕАЛНИ ДАННИ: {state.realDataCount} · АКТИВНИ ДАННИ: {state.activeDataCount}</small><em>АВТОМАТИЧНО СЪПОСТАВЯНЕ: НЕ · ЗАПИСВАНЕ: НЕ · ГОТОВО ЗА МАШИНА: НЕ</em></div>
    </div>

    <div className="ff-ai-real-data-dry-run-flow">{dryRunSteps.map(([number, title, text], index) => <article key={number} className={index <= currentIndex ? 'done' : index === currentIndex + 1 ? 'active' : ''}><span>{number}</span><div><b>{title}</b><small>{text}</small></div></article>)}</div>

    <div className="ff-ai-real-data-dry-run-actions">
      <button type="button" disabled={state.step !== 'EMPTY'} onClick={() => setState((current) => loadFacadeFlowDryRunDemoIntake(current))}>1. Зареди тестов запис</button>
      <button type="button" disabled={state.step !== 'INTAKE_READY'} onClick={() => setState((current) => stageFacadeFlowDryRunDemoRecord(current))}>2. Премести в карантина</button>
      <button type="button" disabled={state.step !== 'STAGED'} onClick={() => setState((current) => applyFacadeFlowDryRunDemoMappingChoices(current))}>3. Подготви тестовите решения</button>
      <button type="button" disabled={state.step === 'EMPTY'} onClick={reset}>Нулирай тестовия маршрут</button>
    </div>
    <p className="ff-ai-real-data-dry-run-script-note">„Подготви тестовите решения“ изпълнява само фиксиран DEMO сценарий след изрично натискане. Това не е механизъм за автоматично съпоставяне на реални записи.</p>

    {state.intake && <div className="ff-ai-real-data-dry-run-summary">
      <div><span>ТЕСТОВ ЗАПИС</span><b>{state.intake.id}</b></div><div><span>СТАТУС НА ВХОДА</span><b>{intakeStatusLabels[state.intake.status]}</b></div><div><span>КАРАНТИНА</span><b>{state.staging ? stagingStatusLabels[state.staging.status] : 'НЕ Е СЪЗДАДЕНА'}</b></div><div><span>АКТИВНИ ДАННИ</span><b>{state.activeDataCount}</b></div>
    </div>}

    {mappings.length > 0 && <div className="ff-ai-real-data-dry-run-mappings">
      <header><b>Тестов ред за човешко съпоставяне</b><span>Изходната стойност се пази отделно от бъдещия стандартен кандидат.</span></header>
      <div>{mappings.map((mapping) => <article key={mapping.fieldId}><span>{mapping.label}</span><small>Източник: {localizedDryRunValue(mapping.fieldId, mapping.sourceValue)}</small><b>{decisionLabels[mapping.decision]}</b><em>Кандидат: {mapping.canonicalValue ? localizedDryRunValue(mapping.fieldId, mapping.canonicalValue) : '—'}</em></article>)}</div>
    </div>}

    {state.step === 'MAPPING_READY' && <div className="ff-ai-real-data-dry-run-human-review">
      <div><label>Проверил<input value={reviewer} onChange={(event) => setReviewer(event.target.value)} placeholder="Име на човека, който извършва контролния тест"/></label><label className="check"><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)}/><span>Проверих тестовите решения и разбирам, че това не активира реални данни.</span></label></div>
      <button type="button" disabled={!reviewer.trim() || !acknowledged} onClick={() => setState((current) => confirmFacadeFlowDryRunHumanMapping(current, reviewer, new Date().toISOString()))}>4. Потвърди човешкото съпоставяне</button>
    </div>}

    {state.step === 'HUMAN_CONFIRMED' && <div className="ff-ai-real-data-dry-run-candidate-action"><div><b>ЧОВЕШКО СЪПОСТАВЯНЕ · ПОТВЪРДЕНО</b><span>Следващото действие създава само кандидат за преглед за активиране. Не създава активни данни.</span></div><button type="button" onClick={() => setState((current) => buildFacadeFlowDryRunActivationCandidate(current))}>5. Създай кандидат за преглед за активиране</button></div>}

    {state.candidate && <div className="ff-ai-real-data-dry-run-pass"><div><span>КОНТРОЛЕН ТЕСТ · УСПЕШЕН</span><b>Маршрутът стигна до кандидат за преглед за активиране</b><small>Кандидат: {state.candidate.stagingRecordId} · Непрегледан за активиране · АКТИВНИ ДАННИ: 0</small></div><div><b>ОСНОВА ЗА ДАННИТЕ · ГОТОВА ЗА ФИНАЛНА ПРОВЕРКА</b><small>Реални данни още не са приемани.</small></div></div>}

    <footer>САМО КОНТРОЛЕН ТЕСТ · РЕАЛНИ ДАННИ: 0 · АКТИВНИ ДАННИ: 0 · АВТОМАТИЧНО СЪПОСТАВЯНЕ: НЕ · ЗАПИСВАНЕ: НЕ · ПРАВИЛА ВАЛИДИРАНИ: НЕ · ПРЕГЛЕД ЗА АКТИВИРАНЕ: НЕ Е ИЗВЪРШЕН · ПРОИЗВОДСТВО: ЗАКЛЮЧЕНО · ГОТОВО ЗА МАШИНА: НЕ</footer>
  </section>
}
