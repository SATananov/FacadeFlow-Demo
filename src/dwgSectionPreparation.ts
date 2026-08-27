export const DWG_PREPARATION_STEPS = [
  { id: 'SECTION', title: 'Избрана секция', instruction: 'Проверете дали е показана правилната секция от чертежа.' },
  { id: 'DIMENSIONS', title: 'Размери', instruction: 'Прегледайте видимите ширина и височина. Не въвеждайте стойности по предположение.' },
  { id: 'FRAME', title: 'Външна каса', instruction: 'Проследете външния контур и потвърдете, че касата се вижда ясно.' },
  { id: 'DIVIDERS', title: 'Делители', instruction: 'Прегледайте вертикалните и хоризонталните делители в секцията.' },
  { id: 'SASHES', title: 'Крила и отваряемост', instruction: 'Прегледайте крилата, символите и посоките на отваряне.' },
  { id: 'REVIEW', title: 'Човешка проверка', instruction: 'Потвърдете само че секцията е прегледана. Това не е производствено одобрение.' },
] as const

export type DwgPreparationStepId = typeof DWG_PREPARATION_STEPS[number]['id']

export interface DwgSectionPreparationState {
  sectionId: string
  activeStep: number
  completed: readonly DwgPreparationStepId[]
  simulationOnly: true
  machineReady: false
  internalEvaluationOnly: true
}

export const startDwgSectionPreparation = (sectionId: string): DwgSectionPreparationState => ({ sectionId, activeStep: 0, completed: [], simulationOnly: true, machineReady: false, internalEvaluationOnly: true })

export const completeDwgPreparationStep = (state: DwgSectionPreparationState): DwgSectionPreparationState => {
  const step = DWG_PREPARATION_STEPS[state.activeStep]
  if (!step) return state
  const completed = state.completed.includes(step.id) ? state.completed : [...state.completed, step.id]
  return { ...state, completed, activeStep: Math.min(state.activeStep + 1, DWG_PREPARATION_STEPS.length - 1) }
}

export const moveDwgPreparationStep = (state: DwgSectionPreparationState, direction: -1 | 1): DwgSectionPreparationState => ({ ...state, activeStep: Math.max(0, Math.min(DWG_PREPARATION_STEPS.length - 1, state.activeStep + direction)) })

export const isDwgPreparationComplete = (state: DwgSectionPreparationState) => DWG_PREPARATION_STEPS.every((step) => state.completed.includes(step.id))
