export const AI05_2_CONSTRUCTION_GRAPH_TRAINING_VERSION = 'AI05.2' as const

export interface FacadeFlowConstructionGraphTrainingCase {
  id: string
  prompt: string
  provenance: {
    derivedFromRealWorkflowPatterns: true
    containsOriginalPrivateDocumentText: false
    containsClientIdentity: false
    safeForTrackedRegressionFixture: true
  }
  expected: {
    fieldCount: number
    mullionCount: number
    signature: string[]
    frame?: string
    sash?: string
    mullion?: string
  }
}

const safeProvenance = Object.freeze({
  derivedFromRealWorkflowPatterns: true,
  containsOriginalPrivateDocumentText: false,
  containsClientIdentity: false,
  safeForTrackedRegressionFixture: true,
}) as FacadeFlowConstructionGraphTrainingCase['provenance']

/**
 * Synthetic reductions of common window/door construction language.
 * They encode semantic topology only and are never production geometry.
 */
export const FACADEFLOW_CONSTRUCTION_GRAPH_TRAINING_CASES: readonly FacadeFlowConstructionGraphTrainingCase[] = Object.freeze([
  {
    id: 'AI05-G01-SINGLE-FIXED',
    prompt: 'Прозорец 900 x 1200 mm, едно поле, фиксирано, система PRELUDE 60.',
    provenance: safeProvenance,
    expected: { fieldCount: 1, mullionCount: 0, signature: ['FIXED_FIELD'] },
  },
  {
    id: 'AI05-G02-SINGLE-OPENABLE',
    prompt: 'Прозорец 900 x 1200 mm, едно поле, turn, система PRELUDE 60, крило 482.05.',
    provenance: safeProvenance,
    expected: { fieldCount: 1, mullionCount: 0, signature: ['OPENABLE_FIELD>SASH'], sash: '482.05' },
  },
  {
    id: 'AI05-G03-TWO-FIX-OPEN',
    prompt: 'Прозорец 1400 x 1200 mm, две полета, лявото фиксирано, дясното отваряемо, система PRELUDE 60, каса 482.30, крило 482.05, делител 482.21.',
    provenance: safeProvenance,
    expected: { fieldCount: 2, mullionCount: 1, signature: ['FIXED_FIELD', 'MULLION', 'OPENABLE_FIELD>SASH'], frame: '482.30', sash: '482.05', mullion: '482.21' },
  },
  {
    id: 'AI05-G04-TWO-OPEN-FIX',
    prompt: 'Прозорец 1400 x 1200 mm, две полета, лявото отваряемо, дясното фиксирано.',
    provenance: safeProvenance,
    expected: { fieldCount: 2, mullionCount: 1, signature: ['OPENABLE_FIELD>SASH', 'MULLION', 'FIXED_FIELD'] },
  },
  {
    id: 'AI05-G05-THREE-FIX-OPEN-FIX',
    prompt: 'Прозорец 1800 x 1400 mm, три полета, средното отваряемо, крайните фиксирани, система PRELUDE 60, каса 482.30, крило 482.05, делител 482.21.',
    provenance: safeProvenance,
    expected: { fieldCount: 3, mullionCount: 2, signature: ['FIXED_FIELD', 'MULLION', 'OPENABLE_FIELD>SASH', 'MULLION', 'FIXED_FIELD'], frame: '482.30', sash: '482.05', mullion: '482.21' },
  },
  {
    id: 'AI05-G06-THREE-OPEN-FIX-OPEN',
    prompt: 'Прозорец 1800 x 1400 mm, три полета, средното фиксирано, крайните отваряеми.',
    provenance: safeProvenance,
    expected: { fieldCount: 3, mullionCount: 2, signature: ['OPENABLE_FIELD>SASH', 'MULLION', 'FIXED_FIELD', 'MULLION', 'OPENABLE_FIELD>SASH'] },
  },
  {
    id: 'AI05-G07-FOUR-ORDINAL-MIX',
    prompt: 'Прозорец 2400 x 1400 mm, четири полета, първото фиксирано, второто отваряемо, третото фиксирано, четвъртото отваряемо.',
    provenance: safeProvenance,
    expected: { fieldCount: 4, mullionCount: 3, signature: ['FIXED_FIELD', 'MULLION', 'OPENABLE_FIELD>SASH', 'MULLION', 'FIXED_FIELD', 'MULLION', 'OPENABLE_FIELD>SASH'] },
  },
  {
    id: 'AI05-G08-FOUR-PAIRED-ORDINALS',
    prompt: 'Прозорец 2400 x 1400 mm, четири полета, първото и четвъртото фиксирани, второто и третото отваряеми.',
    provenance: safeProvenance,
    expected: { fieldCount: 4, mullionCount: 3, signature: ['FIXED_FIELD', 'MULLION', 'OPENABLE_FIELD>SASH', 'MULLION', 'OPENABLE_FIELD>SASH', 'MULLION', 'FIXED_FIELD'] },
  },
  {
    id: 'AI05-G09-THREE-TILT-TURN',
    prompt: 'Прозорец 1800 x 1400 mm, три полета, крайните фиксирани, средното осово-откидно.',
    provenance: safeProvenance,
    expected: { fieldCount: 3, mullionCount: 2, signature: ['FIXED_FIELD', 'MULLION', 'OPENABLE_FIELD>SASH', 'MULLION', 'FIXED_FIELD'] },
  },
  {
    id: 'AI05-G10-THREE-SLIDING-MIDDLE',
    prompt: 'Прозорец 2100 x 1400 mm, три полета, крайните фиксирани, средното плъзгащо.',
    provenance: safeProvenance,
    expected: { fieldCount: 3, mullionCount: 2, signature: ['FIXED_FIELD', 'MULLION', 'SLIDING_FIELD>SASH', 'MULLION', 'FIXED_FIELD'] },
  },
])
