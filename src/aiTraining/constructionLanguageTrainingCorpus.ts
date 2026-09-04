import type { FacadeFlowIntentFieldRole, FacadeFlowIntentOpeningType } from '../aiProductIntent'

export const AI05_1_CONSTRUCTION_LANGUAGE_TRAINING_VERSION = 'AI05.1' as const

export interface FacadeFlowConstructionLanguageTrainingCase {
  id: string
  prompt: string
  provenance: {
    derivedFromRealWorkflowPatterns: true
    containsOriginalPrivateDocumentText: false
    containsClientIdentity: false
    safeForTrackedRegressionFixture: true
  }
  expected: {
    category: 'WINDOW' | 'DOOR'
    widthMm: number
    heightMm: number
    fieldRoles: FacadeFlowIntentFieldRole[]
    openingTypes?: Array<FacadeFlowIntentOpeningType | undefined>
    profileSystem?: string
    frame?: string
    sash?: string
    mullion?: string
    threshold?: string
    hingeQuantity?: number
    handleContains?: string
    glazingContains?: string
  }
}

const safeProvenance = Object.freeze({
  derivedFromRealWorkflowPatterns: true,
  containsOriginalPrivateDocumentText: false,
  containsClientIdentity: false,
  safeForTrackedRegressionFixture: true,
}) as FacadeFlowConstructionLanguageTrainingCase['provenance']

/**
 * Tracked training/evaluation prompts are synthetic reductions of the workflow
 * patterns supplied for FacadeFlow. They intentionally contain no private
 * client/project identity and they are NOT production truth.
 */
export const FACADEFLOW_CONSTRUCTION_LANGUAGE_TRAINING_CASES: readonly FacadeFlowConstructionLanguageTrainingCase[] = Object.freeze([
  {
    id: 'AI05-T01-PRELUDE-THREE-FIELD',
    prompt: 'Прозорец 1800 x 1400 mm, три полета, средното отваряемо, лявото и дясното фиксирани, система PRELUDE 60, каса 482.30, крило 482.05, делител 482.21, двоен стъклопакет, черна дръжка, 2 панти.',
    provenance: safeProvenance,
    expected: {
      category: 'WINDOW', widthMm: 1800, heightMm: 1400,
      fieldRoles: ['FIXED', 'OPENING_SASH', 'FIXED'],
      profileSystem: 'PRELUDE 60', frame: '482.30', sash: '482.05', mullion: '482.21',
      hingeQuantity: 2, handleContains: 'черна', glazingContains: 'двоен',
    },
  },
  {
    id: 'AI05-T02-PRELUDE-TILT-TURN',
    prompt: 'Прозорец 1500 x 1300 mm, три полета, крайните фиксирани, средното осово-обръщателно, система PRELUDE 60, каса 482.30, крило 482.05, делител 482.21.',
    provenance: safeProvenance,
    expected: {
      category: 'WINDOW', widthMm: 1500, heightMm: 1300,
      fieldRoles: ['FIXED', 'OPENING_SASH', 'FIXED'],
      openingTypes: ['FIXED', 'TILT_TURN', 'FIXED'],
      profileSystem: 'PRELUDE 60', frame: '482.30', sash: '482.05', mullion: '482.21',
    },
  },
  {
    id: 'AI05-T03-DOOR-THRESHOLD',
    prompt: 'Врата 900 x 2100 mm, едно поле, отваряемо, система PRELUDE 60, праг E 3308.',
    provenance: safeProvenance,
    expected: {
      category: 'DOOR', widthMm: 900, heightMm: 2100,
      fieldRoles: ['OPENING_SASH'], profileSystem: 'PRELUDE 60', threshold: 'E 3308',
    },
  },
  {
    id: 'AI05-T04-GENERIC-NO-PROFILE-INFERENCE',
    prompt: 'Прозорец 1200 x 1400 mm, едно поле, turn, система PRELUDE 60.',
    provenance: safeProvenance,
    expected: {
      category: 'WINDOW', widthMm: 1200, heightMm: 1400,
      fieldRoles: ['OPENING_SASH'], openingTypes: ['TURN'], profileSystem: 'PRELUDE 60',
    },
  },
])
