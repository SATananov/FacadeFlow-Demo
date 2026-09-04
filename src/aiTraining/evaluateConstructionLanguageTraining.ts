import { interpretFacadeFlowPrompt } from '../aiPromptInterpreter'
import { FACADEFLOW_CONSTRUCTION_LANGUAGE_TRAINING_CASES } from './constructionLanguageTrainingCorpus'

export interface FacadeFlowConstructionTrainingCaseResult {
  id: string
  passed: boolean
  failures: string[]
}

export interface FacadeFlowConstructionTrainingEvaluation {
  version: 'AI05.1'
  passed: number
  total: number
  cases: FacadeFlowConstructionTrainingCaseResult[]
  humanReviewRequired: true
  rulesValidated: false
  machineReady: false
  productionApproved: false
}

function sameArray<T>(actual: T[], expected: T[]) {
  return actual.length === expected.length && actual.every((value, index) => value === expected[index])
}

export function evaluateFacadeFlowConstructionLanguageTraining(): FacadeFlowConstructionTrainingEvaluation {
  const cases = FACADEFLOW_CONSTRUCTION_LANGUAGE_TRAINING_CASES.map((training) => {
    const result = interpretFacadeFlowPrompt(training.prompt, `training-${training.id}`)
    const failures: string[] = []
    const expected = training.expected
    if (result.intent.category !== expected.category) failures.push(`category: ${result.intent.category} != ${expected.category}`)
    if (result.intent.dimensions.widthMm !== expected.widthMm) failures.push(`width: ${result.intent.dimensions.widthMm} != ${expected.widthMm}`)
    if (result.intent.dimensions.heightMm !== expected.heightMm) failures.push(`height: ${result.intent.dimensions.heightMm} != ${expected.heightMm}`)
    const roles = result.intent.fields.map((field) => field.role)
    if (!sameArray(roles, expected.fieldRoles)) failures.push(`field roles: ${roles.join(',')} != ${expected.fieldRoles.join(',')}`)
    if (expected.openingTypes) {
      const openingTypes = result.intent.fields.map((field) => field.openingType)
      if (!sameArray(openingTypes, expected.openingTypes)) failures.push(`opening types: ${openingTypes.join(',')} != ${expected.openingTypes.join(',')}`)
    }
    if (result.intent.profiles.system !== expected.profileSystem) failures.push(`system: ${result.intent.profiles.system} != ${expected.profileSystem}`)
    if (result.intent.profiles.frame !== expected.frame) failures.push(`frame: ${result.intent.profiles.frame} != ${expected.frame}`)
    if (result.intent.profiles.sash !== expected.sash) failures.push(`sash: ${result.intent.profiles.sash} != ${expected.sash}`)
    if (result.intent.profiles.mullion !== expected.mullion) failures.push(`mullion: ${result.intent.profiles.mullion} != ${expected.mullion}`)
    if (result.intent.profiles.threshold !== expected.threshold) failures.push(`threshold: ${result.intent.profiles.threshold} != ${expected.threshold}`)
    if (expected.hingeQuantity !== undefined && result.intent.hardwareDefaults.hingeQuantity !== expected.hingeQuantity) failures.push(`hinges: ${result.intent.hardwareDefaults.hingeQuantity} != ${expected.hingeQuantity}`)
    if (expected.handleContains && !result.intent.hardwareDefaults.handle?.toLocaleLowerCase('bg').includes(expected.handleContains.toLocaleLowerCase('bg'))) failures.push(`handle missing: ${expected.handleContains}`)
    if (expected.glazingContains && !result.intent.glazing.description?.toLocaleLowerCase('bg').includes(expected.glazingContains.toLocaleLowerCase('bg'))) failures.push(`glazing missing: ${expected.glazingContains}`)
    if (training.id === 'AI05-T04-GENERIC-NO-PROFILE-INFERENCE' && (result.intent.profiles.frame || result.intent.profiles.sash || result.intent.profiles.mullion)) failures.push('system name alone must not infer exact profile codes')
    if (result.machineReady || result.productionApproved || result.rulesValidated) failures.push('safety boundary relaxed')
    return { id: training.id, passed: failures.length === 0, failures }
  })

  return {
    version: 'AI05.1',
    passed: cases.filter((item) => item.passed).length,
    total: cases.length,
    cases,
    humanReviewRequired: true,
    rulesValidated: false,
    machineReady: false,
    productionApproved: false,
  }
}
