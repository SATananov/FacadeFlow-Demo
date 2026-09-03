import { DWG_PREPARATION_STEPS, isDwgPreparationComplete, type DwgSectionPreparationState } from '../dwgSectionPreparation'

interface Props {
  sectionNumber: number
  state: DwgSectionPreparationState
  onPrevious: () => void
  onCompleteStep: () => void
  onStartDraft: () => void
  onClose: () => void
}

export function DwgSectionPreparationPanel({ sectionNumber, state, onPrevious, onCompleteStep, onStartDraft, onClose }: Props) {
  const step = DWG_PREPARATION_STEPS[state.activeStep]!, complete = isDwgPreparationComplete(state), stepDone = state.completed.includes(step.id)
  return <section className="dwg-preparation" aria-labelledby="dwg-preparation-title">
    <header>
      <div><span className="dwg-preparation-badge">ПОДГОТОВКА · САМО ПРЕГЛЕД</span><h4 id="dwg-preparation-title">Секция {sectionNumber}: стъпка {state.activeStep + 1} от {DWG_PREPARATION_STEPS.length}</h4></div>
      <button type="button" onClick={onClose}>Затвори помощника</button>
    </header>
    <ol aria-label="Стъпки за подготовка на секцията">
      {DWG_PREPARATION_STEPS.map((item, index) => <li key={item.id} className={index === state.activeStep ? 'active' : ''} aria-current={index === state.activeStep ? 'step' : undefined}><span>{state.completed.includes(item.id) ? '✓' : index + 1}</span>{item.title}</li>)}
    </ol>
    <div className="dwg-preparation-card" aria-live="polite"><b>{step.title}</b><p>{step.instruction}</p></div>
    <div className="dwg-preparation-actions">
      <button type="button" disabled={state.activeStep === 0} onClick={onPrevious}>Назад</button>
      <button type="button" className="primary-action" disabled={complete && stepDone} onClick={onCompleteStep}>{state.activeStep === DWG_PREPARATION_STEPS.length - 1 ? 'Потвърди прегледа' : 'Проверено · продължи'}</button>
    </div>
    {complete && <div className="dwg-preparation-complete" role="status"><span><b>Прегледът е завършен.</b> Може да подготвите отделна симулационна чернова.</span><button type="button" onClick={onStartDraft}>Подготви чернова</button></div>}
  </section>
}
