import { buildFacadeFlowConstructionGraph, facadeFlowConstructionGraphSignature } from '../aiConstructionGraph'
import { interpretFacadeFlowPrompt } from '../aiPromptInterpreter'
import { FACADEFLOW_CONSTRUCTION_GRAPH_TRAINING_CASES } from './constructionGraphTrainingCorpus'

export interface FacadeFlowConstructionGraphTrainingCaseResult {
  id: string
  passed: boolean
  failures: string[]
}

export interface FacadeFlowConstructionGraphTrainingEvaluation {
  version: 'AI05.2'
  passed: number
  total: number
  cases: FacadeFlowConstructionGraphTrainingCaseResult[]
  humanReviewRequired: true
  rulesValidated: false
  automaticGeometryAllowed: false
  machineReady: false
  productionApproved: false
}

function sameArray<T>(actual: T[], expected: T[]) {
  return actual.length === expected.length && actual.every((value, index) => value === expected[index])
}

export function evaluateFacadeFlowConstructionGraphTraining(): FacadeFlowConstructionGraphTrainingEvaluation {
  const cases = FACADEFLOW_CONSTRUCTION_GRAPH_TRAINING_CASES.map((training) => {
    const interpreted = interpretFacadeFlowPrompt(training.prompt, `graph-training-${training.id}`)
    const graph = buildFacadeFlowConstructionGraph(interpreted.intent)
    const failures: string[] = []
    const signature = facadeFlowConstructionGraphSignature(graph)

    if (graph.status !== 'READY_FOR_HUMAN_REVIEW') failures.push(`status: ${graph.status}`)
    if (graph.fieldCount !== training.expected.fieldCount) failures.push(`field count: ${graph.fieldCount} != ${training.expected.fieldCount}`)
    if (graph.mullionCount !== training.expected.mullionCount) failures.push(`mullion count: ${graph.mullionCount} != ${training.expected.mullionCount}`)
    if (!sameArray(signature, training.expected.signature)) failures.push(`signature: ${signature.join(' | ')} != ${training.expected.signature.join(' | ')}`)
    if (graph.root?.profileRef !== training.expected.frame) failures.push(`frame: ${graph.root?.profileRef} != ${training.expected.frame}`)

    const sashProfiles = graph.root?.children.flatMap((child) => child.kind === 'FIELD' && child.sash?.profileRef ? [child.sash.profileRef] : []) ?? []
    if (training.expected.sash && !sashProfiles.every((profile) => profile === training.expected.sash)) failures.push(`sash profiles: ${sashProfiles.join(',')} != ${training.expected.sash}`)
    if (!training.expected.sash && sashProfiles.length) failures.push(`unexpected sash profile inference: ${sashProfiles.join(',')}`)

    const mullionProfiles = graph.root?.children.flatMap((child) => child.kind === 'MULLION' && child.profileRef ? [child.profileRef] : []) ?? []
    if (training.expected.mullion && !mullionProfiles.every((profile) => profile === training.expected.mullion)) failures.push(`mullion profiles: ${mullionProfiles.join(',')} != ${training.expected.mullion}`)
    if (!training.expected.mullion && mullionProfiles.length) failures.push(`unexpected mullion profile inference: ${mullionProfiles.join(',')}`)

    return { id: training.id, passed: failures.length === 0, failures }
  })

  return {
    version: 'AI05.2',
    passed: cases.filter((item) => item.passed).length,
    total: cases.length,
    cases,
    humanReviewRequired: true,
    rulesValidated: false,
    automaticGeometryAllowed: false,
    machineReady: false,
    productionApproved: false,
  }
}
