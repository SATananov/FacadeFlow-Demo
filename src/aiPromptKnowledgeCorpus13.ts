export type AiPromptKnowledgeCorpus13Track =
  | 'MODULE_CREATE_SWITCH'
  | 'MODULE_STATE_PRESERVATION'
  | 'MODULE_COPY_INDEPENDENCE'
  | 'MODULE_TARGET_SAFETY'

export interface AiPromptKnowledgeCorpus13Case {
  id: string
  track: AiPromptKnowledgeCorpus13Track
  commands: string[]
  expectedModuleNumbers: number[]
  expectedActiveModuleNumber: number | null
  expectedReviewSteps: number[]
  expectedModuleCellIds: Record<number, number[]>
  expectedModuleQuantities: Record<number, number | null>
  tags: string[]
}

const variants = Array.from({ length: 50 }, (_, index) => index)

const createSwitchCases: AiPromptKnowledgeCorpus13Case[] = variants.map((index) => {
  const width1 = 1800 + index * 10
  const width2 = 1200 + index * 10
  const quantity1 = (index % 5) + 1
  const quantity2 = ((index + 2) % 5) + 1
  return {
    id: `PK13-${String(index + 1).padStart(3, '0')}`,
    track: 'MODULE_CREATE_SWITCH',
    commands: [
      `Модул 1, ${quantity1} броя, каса ${width1} x 1400 mm`,
      'Раздели клетка 1 вертикално на две равни части',
      `Създай модул 2`,
      `${quantity2} броя, каса ${width2} x 1500 mm`,
      'Отвори модул 1',
    ],
    expectedModuleNumbers: [1, 2],
    expectedActiveModuleNumber: 1,
    expectedReviewSteps: [],
    expectedModuleCellIds: { 1: [2, 3], 2: [1] },
    expectedModuleQuantities: { 1: quantity1, 2: quantity2 },
    tags: ['multi-module', 'create', 'switch', 'state-isolation'],
  }
})

const preservationCases: AiPromptKnowledgeCorpus13Case[] = variants.map((index) => {
  const q1 = (index % 4) + 2
  const q2 = ((index + 1) % 4) + 2
  return {
    id: `PK13-${String(index + 51).padStart(3, '0')}`,
    track: 'MODULE_STATE_PRESERVATION',
    commands: [
      `Модул 1, ${q1} броя, каса 2100 x 1400 mm`,
      'Раздели клетка 1 вертикално на три равни части',
      `Модул 2, ${q2} броя, каса 1600 x 1400 mm`,
      'Раздели клетка 1 вертикално на две равни части',
      'Върни се на модул 1',
      'Раздели клетка 2 хоризонтално на две равни части',
      'Отвори модул 2',
    ],
    expectedModuleNumbers: [1, 2],
    expectedActiveModuleNumber: 2,
    expectedReviewSteps: [],
    expectedModuleCellIds: { 1: [3, 4, 5, 6], 2: [2, 3] },
    expectedModuleQuantities: { 1: q1, 2: q2 },
    tags: ['multi-module', 'preserve-state', 'stable-cell-ids', 'no-leakage'],
  }
})

const copyCases: AiPromptKnowledgeCorpus13Case[] = variants.map((index) => {
  const sourceQuantity = (index % 3) + 1
  const copiedQuantity = ((index + 3) % 6) + 2
  return {
    id: `PK13-${String(index + 101).padStart(3, '0')}`,
    track: 'MODULE_COPY_INDEPENDENCE',
    commands: [
      `Модул 1, ${sourceQuantity} броя, каса 2100 x 1400 mm`,
      'Раздели клетка 1 вертикално на три равни части',
      `Копирай модул 1 като модул 3, ${copiedQuantity} броя`,
      'Раздели клетка 2 хоризонтално на две равни части',
      'Отвори модул 1',
    ],
    expectedModuleNumbers: [1, 3],
    expectedActiveModuleNumber: 1,
    expectedReviewSteps: [],
    expectedModuleCellIds: { 1: [2, 3, 4], 3: [3, 4, 5, 6] },
    expectedModuleQuantities: { 1: sourceQuantity, 3: copiedQuantity },
    tags: ['multi-module', 'copy', 'independent-runtime', 'quantity-override'],
  }
})

const safetyCases: AiPromptKnowledgeCorpus13Case[] = variants.map((index) => {
  const q1 = (index % 5) + 1
  const q2 = ((index + 1) % 5) + 1
  return {
    id: `PK13-${String(index + 151).padStart(3, '0')}`,
    track: 'MODULE_TARGET_SAFETY',
    commands: [
      `Модул 1, ${q1} броя, каса 1800 x 1400 mm`,
      `Модул 2, ${q2} броя, каса 1500 x 1400 mm`,
      'Отвори модул 9',
      'Копирай модул 1 като модул 2',
      'Копирай този модул',
      'Отвори модул 1',
    ],
    expectedModuleNumbers: [1, 2],
    expectedActiveModuleNumber: 1,
    expectedReviewSteps: [3, 4, 5],
    expectedModuleCellIds: { 1: [1], 2: [1] },
    expectedModuleQuantities: { 1: q1, 2: q2 },
    tags: ['multi-module', 'review-required', 'missing-target', 'no-mutation'],
  }
})

export const AI_PROMPT_KNOWLEDGE_CORPUS_13: AiPromptKnowledgeCorpus13Case[] = [
  ...createSwitchCases,
  ...preservationCases,
  ...copyCases,
  ...safetyCases,
]

export const AI_PROMPT_KNOWLEDGE_CORPUS_13_EXPECTED_COUNTS = {
  TOTAL: 200,
  MODULE_CREATE_SWITCH: 50,
  MODULE_STATE_PRESERVATION: 50,
  MODULE_COPY_INDEPENDENCE: 50,
  MODULE_TARGET_SAFETY: 50,
} as const
