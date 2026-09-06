export type AiPromptKnowledgeCorpus14Track =
  | 'OFFER_DEFAULTS_INHERITANCE'
  | 'MODULE_OVERRIDE_PRESERVATION'
  | 'OFFER_WIDE_REVISION'
  | 'SCOPE_SAFETY_AND_COPY'

export interface AiPromptKnowledgeCorpus14Case {
  id: string
  track: AiPromptKnowledgeCorpus14Track
  commands: string[]
  expectedModuleNumbers: number[]
  expectedReviewSteps: number[]
  expectedDefaults: { system?: string; finish?: string; glazing?: string; hardware?: string }
  expectedEffectiveByModule: Record<number, { system?: string; finish?: string; glazing?: string; hardware?: string }>
  expectedOverrideFieldsByModule: Record<number, string[]>
  tags: string[]
}

const variants = Array.from({ length: 50 }, (_, index) => index)

const inheritanceCases: AiPromptKnowledgeCorpus14Case[] = variants.map((index) => {
  const q1 = (index % 4) + 1
  const q2 = ((index + 2) % 4) + 1
  const finish = index % 2 === 0 ? 'RAL 7016' : 'RAL 9005'
  return {
    id: `PK14-${String(index + 1).padStart(3, '0')}`,
    track: 'OFFER_DEFAULTS_INHERITANCE',
    commands: [
      `Оферта за Клиент ${index + 1}, система PRELUDE 60, цвят ${finish}, двоен стъклопакет, обков ROTO NX`,
      `Модул 1, ${q1} броя, каса 2100 x 1400 mm`,
      `Модул 2, ${q2} броя, каса 1600 x 1400 mm`,
    ],
    expectedModuleNumbers: [1, 2],
    expectedReviewSteps: [],
    expectedDefaults: { system: 'PRELUDE 60', finish, glazing: 'двоен стъклопакет', hardware: 'ROTO NX' },
    expectedEffectiveByModule: {
      1: { system: 'PRELUDE 60', finish, glazing: 'двоен стъклопакет', hardware: 'ROTO NX' },
      2: { system: 'PRELUDE 60', finish, glazing: 'двоен стъклопакет', hardware: 'ROTO NX' },
    },
    expectedOverrideFieldsByModule: { 1: [], 2: [] },
    tags: ['offer-defaults', 'inheritance', 'multi-module'],
  }
})

const overrideCases: AiPromptKnowledgeCorpus14Case[] = variants.map((index) => {
  const localFinish = index % 2 === 0 ? 'RAL 9006' : 'RAL 9016'
  return {
    id: `PK14-${String(index + 51).padStart(3, '0')}`,
    track: 'MODULE_OVERRIDE_PRESERVATION',
    commands: [
      `Оферта за Клиент ${index + 51}, система PRELUDE 60, цвят RAL 7016, двоен стъклопакет, обков ROTO NX`,
      'Модул 1, 2 броя, каса 2100 x 1400 mm',
      'Модул 2, 3 броя, каса 1600 x 1400 mm',
      `Само модул 2, цвят ${localFinish}`,
      'Модул 2, стъкло: троен стъклопакет',
    ],
    expectedModuleNumbers: [1, 2],
    expectedReviewSteps: [],
    expectedDefaults: { system: 'PRELUDE 60', finish: 'RAL 7016', glazing: 'двоен стъклопакет', hardware: 'ROTO NX' },
    expectedEffectiveByModule: {
      1: { system: 'PRELUDE 60', finish: 'RAL 7016', glazing: 'двоен стъклопакет', hardware: 'ROTO NX' },
      2: { system: 'PRELUDE 60', finish: localFinish, glazing: 'троен стъклопакет', hardware: 'ROTO NX' },
    },
    expectedOverrideFieldsByModule: { 1: [], 2: ['finish', 'glazing'] },
    tags: ['module-override', 'no-leakage', 'inheritance'],
  }
})

const revisionCases: AiPromptKnowledgeCorpus14Case[] = variants.map((index) => {
  const overrideFinish = index % 2 === 0 ? 'RAL 9016' : 'RAL 9006'
  const revisedFinish = index % 2 === 0 ? 'RAL 9005' : 'RAL 7024'
  return {
    id: `PK14-${String(index + 101).padStart(3, '0')}`,
    track: 'OFFER_WIDE_REVISION',
    commands: [
      `Оферта за Клиент ${index + 101}, система PRELUDE 60, цвят RAL 7016, двоен стъклопакет, обков ROTO NX`,
      'Модул 1, 2 броя, каса 2100 x 1400 mm',
      'Модул 2, 2 броя, каса 1600 x 1400 mm',
      `Модул 2, цвят ${overrideFinish}`,
      `За цялата оферта, цвят ${revisedFinish}`,
      'За цялата оферта, стъкло: троен стъклопакет',
    ],
    expectedModuleNumbers: [1, 2],
    expectedReviewSteps: [],
    expectedDefaults: { system: 'PRELUDE 60', finish: revisedFinish, glazing: 'троен стъклопакет', hardware: 'ROTO NX' },
    expectedEffectiveByModule: {
      1: { system: 'PRELUDE 60', finish: revisedFinish, glazing: 'троен стъклопакет', hardware: 'ROTO NX' },
      2: { system: 'PRELUDE 60', finish: overrideFinish, glazing: 'троен стъклопакет', hardware: 'ROTO NX' },
    },
    expectedOverrideFieldsByModule: { 1: [], 2: ['finish'] },
    tags: ['offer-revision', 'override-preservation', 'no-clobber'],
  }
})

const safetyCopyCases: AiPromptKnowledgeCorpus14Case[] = variants.map((index) => {
  const localFinish = index % 2 === 0 ? 'RAL 9006' : 'RAL 9016'
  return {
    id: `PK14-${String(index + 151).padStart(3, '0')}`,
    track: 'SCOPE_SAFETY_AND_COPY',
    commands: [
      `Оферта за Клиент ${index + 151}, система PRELUDE 60, цвят RAL 7016, двоен стъклопакет, обков ROTO NX`,
      'Модул 1, 2 броя, каса 2100 x 1400 mm',
      `Модул 1, цвят ${localFinish}`,
      'Копирай модул 1 като модул 3, 4 броя',
      'Смени цвета на RAL 9005',
      'Модул 3, стъкло: троен стъклопакет',
    ],
    expectedModuleNumbers: [1, 3],
    expectedReviewSteps: [5],
    expectedDefaults: { system: 'PRELUDE 60', finish: 'RAL 7016', glazing: 'двоен стъклопакет', hardware: 'ROTO NX' },
    expectedEffectiveByModule: {
      1: { system: 'PRELUDE 60', finish: localFinish, glazing: 'двоен стъклопакет', hardware: 'ROTO NX' },
      3: { system: 'PRELUDE 60', finish: localFinish, glazing: 'троен стъклопакет', hardware: 'ROTO NX' },
    },
    expectedOverrideFieldsByModule: { 1: ['finish'], 3: ['finish', 'glazing'] },
    tags: ['scope-safety', 'copy-overrides', 'independent-copy', 'review-required'],
  }
})

export const AI_PROMPT_KNOWLEDGE_CORPUS_14: AiPromptKnowledgeCorpus14Case[] = [
  ...inheritanceCases,
  ...overrideCases,
  ...revisionCases,
  ...safetyCopyCases,
]

export const AI_PROMPT_KNOWLEDGE_CORPUS_14_EXPECTED_COUNTS = {
  TOTAL: 200,
  OFFER_DEFAULTS_INHERITANCE: 50,
  MODULE_OVERRIDE_PRESERVATION: 50,
  OFFER_WIDE_REVISION: 50,
  SCOPE_SAFETY_AND_COPY: 50,
} as const
