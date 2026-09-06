export type AiPromptKnowledgeCorpus10Track =
  | 'FRAME_EQUAL_SPLIT_LIVE_PREVIEW'
  | 'MOVE_STABLE_IDS_LIVE_PREVIEW'
  | 'DELETE_UNDO_LIVE_PREVIEW'
  | 'AMBIGUOUS_NO_MUTATION_LIVE_PREVIEW'

export interface AiPromptKnowledgeCorpus10Case {
  id: string
  track: AiPromptKnowledgeCorpus10Track
  prompt: string
  expectedCommandCount: number
  expectedActiveCellIds: number[]
  expectedRetiredCellIds: number[]
  expectedDividerPositions: number[]
  expectedSashCellIds: number[]
  expectedUnresolvedSteps: number[]
  expectedFinalUnresolvedCount: number
  tags: string[]
}

const pad = (value: number) => String(value).padStart(3, '0')

function frameEqualSplitCase(index: number): AiPromptKnowledgeCorpus10Case {
  const moduleNumber = 1200 + index
  const quantity = (index % 5) + 1
  return {
    id: `CP10-LIVE-${pad(index)}`,
    track: 'FRAME_EQUAL_SPLIT_LIVE_PREVIEW',
    prompt: `Модул ${moduleNumber}, ${quantity} броя, каса 2100 x 1400 mm | раздели клетка 1 с вертикални делители на три равни части | сложи крило в клетка 3 с двуосен десен механизъм | раздели клетка 4 хоризонтално на две равни части | сложи крило в клетка 6 с двуосен ляв механизъм`,
    expectedCommandCount: 5,
    expectedActiveCellIds: [2, 3, 5, 6],
    expectedRetiredCellIds: [1, 4],
    expectedDividerPositions: [700, 1400, 700],
    expectedSashCellIds: [3, 6],
    expectedUnresolvedSteps: [],
    expectedFinalUnresolvedCount: 0,
    tags: ['live-preview', 'equal-split', 'stable-cell-labels', 'nested-split'],
  }
}

function moveStableCase(index: number): AiPromptKnowledgeCorpus10Case {
  const moduleNumber = 1300 + index
  const quantity = (index % 4) + 1
  const movedPosition = 725 + (index % 7) * 25
  return {
    id: `CP10-MOVE-${pad(index)}`,
    track: 'MOVE_STABLE_IDS_LIVE_PREVIEW',
    prompt: `Модул ${moduleNumber}, ${quantity} броя, каса 2100 x 1400 mm | сложи вертикален делител отляво на 700 mm | сложи крило в клетка 2 с двуосен десен механизъм | премести делител 1 на ${movedPosition} mm отляво | смени крилото в клетка 2 да е двуосно ляво`,
    expectedCommandCount: 5,
    expectedActiveCellIds: [2, 3],
    expectedRetiredCellIds: [1],
    expectedDividerPositions: [movedPosition],
    expectedSashCellIds: [2],
    expectedUnresolvedSteps: [],
    expectedFinalUnresolvedCount: 0,
    tags: ['move-divider', 'stable-cell-id', 'live-preview', 'sash-correction'],
  }
}

function deleteUndoCase(index: number): AiPromptKnowledgeCorpus10Case {
  const moduleNumber = 1400 + index
  const quantity = (index % 6) + 1
  return {
    id: `CP10-UNDO-${pad(index)}`,
    track: 'DELETE_UNDO_LIVE_PREVIEW',
    prompt: `Модул ${moduleNumber}, ${quantity} броя, каса 2100 x 1400 mm | сложи вертикален делител отляво на 700 mm | сложи крило в клетка 2 с двуосен десен механизъм | махни делител 1 | върни последната команда | премести крилото от клетка 2 в клетка 3`,
    expectedCommandCount: 6,
    expectedActiveCellIds: [2, 3],
    expectedRetiredCellIds: [1],
    expectedDividerPositions: [700],
    expectedSashCellIds: [3],
    expectedUnresolvedSteps: [],
    expectedFinalUnresolvedCount: 0,
    tags: ['delete-preview', 'undo-preview', 'restored-cell-ids', 'retarget'],
  }
}

function ambiguousCase(index: number): AiPromptKnowledgeCorpus10Case {
  const moduleNumber = 1500 + index
  const quantity = (index % 3) + 1
  const movedPosition = 750 + (index % 5) * 25
  return {
    id: `CP10-SAFE-${pad(index)}`,
    track: 'AMBIGUOUS_NO_MUTATION_LIVE_PREVIEW',
    prompt: `Модул ${moduleNumber}, ${quantity} броя, каса 2100 x 1400 mm | сложи вертикален делител отляво на 700 mm | сложи крило в клетка 2 с двуосен десен механизъм | премести крилото там | смени крилото в клетка 2 да е двуосно ляво | премести делител 1 | премести делител 1 на ${movedPosition} mm отляво | смени крилото в клетка 1 да е двуосно дясно`,
    expectedCommandCount: 8,
    expectedActiveCellIds: [2, 3],
    expectedRetiredCellIds: [1],
    expectedDividerPositions: [movedPosition],
    expectedSashCellIds: [2],
    expectedUnresolvedSteps: [4, 6, 8],
    expectedFinalUnresolvedCount: 3,
    tags: ['review-required-preview', 'no-mutation', 'retired-cell', 'session-continues'],
  }
}

export const AI_PROMPT_KNOWLEDGE_CORPUS_10: AiPromptKnowledgeCorpus10Case[] = [
  ...Array.from({ length: 50 }, (_, index) => frameEqualSplitCase(index + 1)),
  ...Array.from({ length: 50 }, (_, index) => moveStableCase(index + 1)),
  ...Array.from({ length: 50 }, (_, index) => deleteUndoCase(index + 1)),
  ...Array.from({ length: 50 }, (_, index) => ambiguousCase(index + 1)),
]

export const AI_PROMPT_KNOWLEDGE_CORPUS_10_EXPECTED_COUNTS = {
  TOTAL: 200,
  FRAME_EQUAL_SPLIT_LIVE_PREVIEW: 50,
  MOVE_STABLE_IDS_LIVE_PREVIEW: 50,
  DELETE_UNDO_LIVE_PREVIEW: 50,
  AMBIGUOUS_NO_MUTATION_LIVE_PREVIEW: 50,
} as const
