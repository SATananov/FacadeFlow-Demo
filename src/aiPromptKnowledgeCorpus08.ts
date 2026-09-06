export type AiPromptKnowledgeCorpus08Track =
  | 'MOVE_DIVIDER_STABLE_IDS'
  | 'DELETE_DIVIDER_STRUCTURAL_IDS'
  | 'UNDO_RESTORES_VISIBLE_STATE'
  | 'SASH_CORRECTION_RETARGET_SAFETY'

export interface AiPromptKnowledgeCorpus08Case {
  id: string
  track: AiPromptKnowledgeCorpus08Track
  prompt: string
  expectedActiveCellIds: number[]
  expectedRetiredCellIds: number[]
  expectedDividerPositions: number[]
  expectedSashCellIds: number[]
  expectedSashDirection?: 'LEFT' | 'RIGHT'
  expectedUnresolvedCount: number
  expectedCorrectionSnapshotCount: number
  tags: string[]
}

const pad = (value: number) => String(value).padStart(3, '0')

function moveDividerCase(index: number): AiPromptKnowledgeCorpus08Case {
  const moduleNumber = 400 + index
  const quantity = (index % 5) + 1
  const frameWidth = 2100 + (index % 4) * 100
  const position = 750 + (index % 5) * 50
  return {
    id: `CP8-MOVE-${pad(index)}`,
    track: 'MOVE_DIVIDER_STABLE_IDS',
    prompt: `Модул ${moduleNumber}, ${quantity} броя, каса ${frameWidth} x 1400 mm | сложи вертикален делител отляво на 700 mm | премести делител 1 на ${position} mm отляво`,
    expectedActiveCellIds: [2, 3],
    expectedRetiredCellIds: [1],
    expectedDividerPositions: [position],
    expectedSashCellIds: [],
    expectedUnresolvedCount: 0,
    expectedCorrectionSnapshotCount: 1,
    tags: ['move-divider', 'preserve-active-cell-ids', 'no-renumber', 'geometry-adjustment-not-structural-replacement'],
  }
}

function deleteDividerCase(index: number): AiPromptKnowledgeCorpus08Case {
  const moduleNumber = 500 + index
  const quantity = (index % 4) + 1
  return {
    id: `CP8-DELETE-${pad(index)}`,
    track: 'DELETE_DIVIDER_STRUCTURAL_IDS',
    prompt: `Модул ${moduleNumber}, ${quantity} броя, каса 2100 x 1400 mm | сложи вертикален делител отляво на 700 mm | махни делител 1`,
    expectedActiveCellIds: [4],
    expectedRetiredCellIds: [1, 2, 3],
    expectedDividerPositions: [],
    expectedSashCellIds: [],
    expectedUnresolvedCount: 0,
    expectedCorrectionSnapshotCount: 1,
    tags: ['delete-divider', 'structural-merge', 'children-retired', 'new-cell-id'],
  }
}

function undoCase(index: number): AiPromptKnowledgeCorpus08Case {
  const moduleNumber = 600 + index
  const quantity = (index % 6) + 1
  return {
    id: `CP8-UNDO-${pad(index)}`,
    track: 'UNDO_RESTORES_VISIBLE_STATE',
    prompt: `Модул ${moduleNumber}, ${quantity} броя, каса 2100 x 1400 mm | сложи вертикален делител отляво на 700 mm | махни делител 1 | върни последната команда`,
    expectedActiveCellIds: [2, 3],
    expectedRetiredCellIds: [1],
    expectedDividerPositions: [700],
    expectedSashCellIds: [],
    expectedUnresolvedCount: 0,
    expectedCorrectionSnapshotCount: 2,
    tags: ['undo', 'restore-visible-state', 'restore-stable-cell-ids', 'no-global-renumber'],
  }
}

function sashCorrectionCase(index: number): AiPromptKnowledgeCorpus08Case {
  const moduleNumber = 700 + index
  const unsafe = index <= 25
    ? 'премести крилото там'
    : 'смени крилото в клетка 1 да е двуосно дясно'
  return {
    id: `CP8-SASH-${pad(index)}`,
    track: 'SASH_CORRECTION_RETARGET_SAFETY',
    prompt: `Модул ${moduleNumber}, 2 броя, каса 2100 x 1400 mm | сложи вертикален делител отляво на 700 mm | сложи крило в клетка 2 с двуосен десен механизъм | смени крилото в клетка 2 да е двуосно ляво | премести крилото от клетка 2 в клетка 3 | ${unsafe}`,
    expectedActiveCellIds: [2, 3],
    expectedRetiredCellIds: [1],
    expectedDividerPositions: [700],
    expectedSashCellIds: [3],
    expectedSashDirection: 'LEFT',
    expectedUnresolvedCount: 1,
    expectedCorrectionSnapshotCount: 3,
    tags: index <= 25
      ? ['change-sash', 'retarget-sash', 'ambiguous-target-rejected', 'state-preserved']
      : ['change-sash', 'retarget-sash', 'retired-cell-rejected', 'state-preserved'],
  }
}

export const AI_PROMPT_KNOWLEDGE_CORPUS_08: AiPromptKnowledgeCorpus08Case[] = [
  ...Array.from({ length: 50 }, (_, index) => moveDividerCase(index + 1)),
  ...Array.from({ length: 50 }, (_, index) => deleteDividerCase(index + 1)),
  ...Array.from({ length: 50 }, (_, index) => undoCase(index + 1)),
  ...Array.from({ length: 50 }, (_, index) => sashCorrectionCase(index + 1)),
]

export const AI_PROMPT_KNOWLEDGE_CORPUS_08_EXPECTED_COUNTS = {
  TOTAL: 200,
  MOVE_DIVIDER_STABLE_IDS: 50,
  DELETE_DIVIDER_STRUCTURAL_IDS: 50,
  UNDO_RESTORES_VISIBLE_STATE: 50,
  SASH_CORRECTION_RETARGET_SAFETY: 50,
} as const
