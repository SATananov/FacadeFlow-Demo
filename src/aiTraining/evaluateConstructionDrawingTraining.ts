import { buildFacadeFlowConstructionGraph } from '../aiConstructionGraph'
import { buildFacadeFlowConstructionDrawing, facadeFlowConstructionDrawingSignature } from '../aiConstructionDrawing'
import { interpretFacadeFlowPrompt } from '../aiPromptInterpreter'
import { FACADEFLOW_CONSTRUCTION_DRAWING_TRAINING_CASES } from './constructionDrawingTrainingCorpus'

export interface FacadeFlowConstructionDrawingTrainingEvaluation {
  version: 'AI05.3'
  passed: number
  total: number
  cases: Array<{ id: string; passed: boolean; failures: string[] }>
  humanReviewRequired: true
  automaticDrawingProposal: true
  automaticGeometryAllowed: false
  exactProfileContourApplied: false
  rulesValidated: false
  machineReady: false
  productionApproved: false
}

function sameArray<T>(actual: T[], expected: T[]) {
  return actual.length === expected.length && actual.every((value, index) => value === expected[index])
}

export function evaluateFacadeFlowConstructionDrawingTraining(): FacadeFlowConstructionDrawingTrainingEvaluation {
  const cases = FACADEFLOW_CONSTRUCTION_DRAWING_TRAINING_CASES.map((training) => {
    const interpreted = interpretFacadeFlowPrompt(training.prompt, `drawing-training-${training.id}`)
    const graph = buildFacadeFlowConstructionGraph(interpreted.intent)
    const drawing = buildFacadeFlowConstructionDrawing(interpreted.intent, graph)
    const failures: string[] = []
    const signature = facadeFlowConstructionDrawingSignature(drawing)

    if (drawing.status !== 'READY_FOR_HUMAN_REVIEW') failures.push(`status: ${drawing.status}`)
    if (drawing.fields.length !== training.expected.fieldCount) failures.push(`field count: ${drawing.fields.length} != ${training.expected.fieldCount}`)
    if (drawing.mullions.length !== training.expected.mullionCount) failures.push(`mullion count: ${drawing.mullions.length} != ${training.expected.mullionCount}`)
    if (drawing.basis !== training.expected.basis) failures.push(`basis: ${drawing.basis} != ${training.expected.basis}`)
    if (!sameArray(signature, training.expected.signature)) failures.push(`signature: ${signature.join(' | ')} != ${training.expected.signature.join(' | ')}`)

    return { id: training.id, passed: failures.length === 0, failures }
  })

  return {
    version: 'AI05.3',
    passed: cases.filter((item) => item.passed).length,
    total: cases.length,
    cases,
    humanReviewRequired: true,
    automaticDrawingProposal: true,
    automaticGeometryAllowed: false,
    exactProfileContourApplied: false,
    rulesValidated: false,
    machineReady: false,
    productionApproved: false,
  }
}
