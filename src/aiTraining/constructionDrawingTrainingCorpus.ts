export const AI05_3_CONSTRUCTION_DRAWING_TRAINING_VERSION = 'AI05.3' as const

export interface FacadeFlowConstructionDrawingTrainingCase {
  id: string
  prompt: string
  expected: {
    fieldCount: number
    mullionCount: number
    basis: 'SINGLE_FIELD' | 'EXPLICIT_LINEAR_DIVIDERS' | 'PROPOSED_EQUAL_FIELD_DISTRIBUTION'
    signature: string[]
  }
  provenance: {
    derivedFromRealWorkflowPatterns: true
    containsOriginalPrivateDocumentText: false
    containsClientIdentity: false
    safeForTrackedRegressionFixture: true
  }
}

const provenance = {
  derivedFromRealWorkflowPatterns: true,
  containsOriginalPrivateDocumentText: false,
  containsClientIdentity: false,
  safeForTrackedRegressionFixture: true,
} as const

export const FACADEFLOW_CONSTRUCTION_DRAWING_TRAINING_CASES: FacadeFlowConstructionDrawingTrainingCase[] = [
  {
    id: 'single-fixed',
    prompt: 'Прозорец 900 x 1200 mm, едно поле, фиксирано.',
    expected: { fieldCount: 1, mullionCount: 0, basis: 'SINGLE_FIELD', signature: ['FRAME', 'FIXED_FIELD'] },
    provenance,
  },
  {
    id: 'two-fix-open',
    prompt: 'Прозорец 1600 x 1300 mm, две полета, лявото фиксирано, дясното отваряемо.',
    expected: { fieldCount: 2, mullionCount: 1, basis: 'PROPOSED_EQUAL_FIELD_DISTRIBUTION', signature: ['FRAME', 'FIXED_FIELD', 'MULLION', 'OPENABLE_FIELD>SASH'] },
    provenance,
  },
  {
    id: 'two-open-fix',
    prompt: 'Прозорец 1600 x 1300 mm, две полета, лявото отваряемо, дясното фиксирано.',
    expected: { fieldCount: 2, mullionCount: 1, basis: 'PROPOSED_EQUAL_FIELD_DISTRIBUTION', signature: ['FRAME', 'OPENABLE_FIELD>SASH', 'MULLION', 'FIXED_FIELD'] },
    provenance,
  },
  {
    id: 'three-middle-open',
    prompt: 'Прозорец 1800 x 1400 mm, три полета, средното отваряемо, крайните фиксирани.',
    expected: { fieldCount: 3, mullionCount: 2, basis: 'PROPOSED_EQUAL_FIELD_DISTRIBUTION', signature: ['FRAME', 'FIXED_FIELD', 'MULLION', 'OPENABLE_FIELD>SASH', 'MULLION', 'FIXED_FIELD'] },
    provenance,
  },
  {
    id: 'three-profile-aware',
    prompt: 'Прозорец 1800 x 1400 mm, три полета, средното отваряемо, крайните фиксирани, каса 482.30, крило 482.05, делител 482.21.',
    expected: { fieldCount: 3, mullionCount: 2, basis: 'PROPOSED_EQUAL_FIELD_DISTRIBUTION', signature: ['FRAME:482.30', 'FIXED_FIELD', 'MULLION:482.21', 'OPENABLE_FIELD>SASH:482.05', 'MULLION:482.21', 'FIXED_FIELD'] },
    provenance,
  },
  {
    id: 'four-alternating',
    prompt: 'Прозорец 2400 x 1400 mm, четири полета, първото фиксирано, второто отваряемо, третото фиксирано, четвъртото отваряемо.',
    expected: { fieldCount: 4, mullionCount: 3, basis: 'PROPOSED_EQUAL_FIELD_DISTRIBUTION', signature: ['FRAME', 'FIXED_FIELD', 'MULLION', 'OPENABLE_FIELD>SASH', 'MULLION', 'FIXED_FIELD', 'MULLION', 'OPENABLE_FIELD>SASH'] },
    provenance,
  },
  {
    id: 'sliding-second',
    prompt: 'Прозорец 2000 x 1300 mm, две полета, първото фиксирано, второто плъзгащо.',
    expected: { fieldCount: 2, mullionCount: 1, basis: 'PROPOSED_EQUAL_FIELD_DISTRIBUTION', signature: ['FRAME', 'FIXED_FIELD', 'MULLION', 'SLIDING_FIELD>SASH'] },
    provenance,
  },
  {
    id: 'prelude-name-no-exact-profile',
    prompt: 'Прозорец 1800 x 1400 mm, три полета, средното отваряемо, крайните фиксирани, система PRELUDE 60.',
    expected: { fieldCount: 3, mullionCount: 2, basis: 'PROPOSED_EQUAL_FIELD_DISTRIBUTION', signature: ['FRAME', 'FIXED_FIELD', 'MULLION', 'OPENABLE_FIELD>SASH', 'MULLION', 'FIXED_FIELD'] },
    provenance,
  },
]
