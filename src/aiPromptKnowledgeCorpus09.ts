export type AiPromptKnowledgeCorpus09Track =
  | 'SEQUENTIAL_BUILD_VISUAL_STATE'
  | 'CORRECT_UNDO_CONTINUE'
  | 'DELETE_UNDO_RETARGET_CONTINUE'
  | 'AMBIGUOUS_TURN_NO_MUTATION'

export interface AiPromptKnowledgeCorpus09Case {
  id: string
  track: AiPromptKnowledgeCorpus09Track
  prompt: string
  expectedCommandCount: number
  expectedActiveCellIds: number[]
  expectedRetiredCellIds: number[]
  expectedDividerPositions: number[]
  expectedSashCellIds: number[]
  expectedSashDirection?: 'LEFT' | 'RIGHT'
  expectedUnresolvedCount: number
  expectedNoMutationSteps: number[]
  tags: string[]
}

const pad = (value: number) => String(value).padStart(3, '0')

function sequentialBuildCase(index: number): AiPromptKnowledgeCorpus09Case {
  const moduleNumber = 800 + index
  const quantity = (index % 5) + 1
  return {
    id: `CP9-BUILD-${pad(index)}`,
    track: 'SEQUENTIAL_BUILD_VISUAL_STATE',
    prompt: `Модул ${moduleNumber}, ${quantity} броя, каса 2100 x 1400 mm | раздели клетка 1 с вертикални делители на три равни части | раздели клетка 3 хоризонтално на две равни части | сложи крило в клетка 5 с двуосен десен механизъм | сложи хоризонтален делител в клетка 4 на 500 mm отгоре | сложи крило в клетка 8 с двуосен ляв механизъм`,
    expectedCommandCount: 6,
    expectedActiveCellIds: [2, 5, 6, 7, 8],
    expectedRetiredCellIds: [1, 3, 4],
    expectedDividerPositions: [700, 1400, 700, 500],
    expectedSashCellIds: [5, 8],
    expectedUnresolvedCount: 0,
    expectedNoMutationSteps: [],
    tags: ['multi-turn-build', 'snapshot-after-every-command', 'stable-cell-ids', 'nested-split'],
  }
}

function correctUndoContinueCase(index: number): AiPromptKnowledgeCorpus09Case {
  const moduleNumber = 900 + index
  const quantity = (index % 4) + 1
  const movedPosition = 750 + (index % 5) * 25
  return {
    id: `CP9-CORRECT-${pad(index)}`,
    track: 'CORRECT_UNDO_CONTINUE',
    prompt: `Модул ${moduleNumber}, ${quantity} броя, каса 2100 x 1400 mm | сложи вертикален делител отляво на 700 mm | сложи крило в клетка 2 с двуосен десен механизъм | смени крилото в клетка 2 да е двуосно ляво | премести делител 1 на ${movedPosition} mm отляво | върни последната команда | клетка 2 да стане фикс | върни последната команда`,
    expectedCommandCount: 8,
    expectedActiveCellIds: [2, 3],
    expectedRetiredCellIds: [1],
    expectedDividerPositions: [700],
    expectedSashCellIds: [2],
    expectedSashDirection: 'LEFT',
    expectedUnresolvedCount: 0,
    expectedNoMutationSteps: [],
    tags: ['correction-session', 'undo', 'continue-after-undo', 'stable-cell-ids'],
  }
}

function deleteUndoRetargetCase(index: number): AiPromptKnowledgeCorpus09Case {
  const moduleNumber = 1000 + index
  const quantity = (index % 6) + 1
  return {
    id: `CP9-DELETE-${pad(index)}`,
    track: 'DELETE_UNDO_RETARGET_CONTINUE',
    prompt: `Модул ${moduleNumber}, ${quantity} броя, каса 2100 x 1400 mm | сложи вертикален делител отляво на 700 mm | сложи крило в клетка 2 с двуосен десен механизъм | махни делител 1 | върни последната команда | смени крилото в клетка 2 да е двуосно ляво | премести крилото от клетка 2 в клетка 3`,
    expectedCommandCount: 7,
    expectedActiveCellIds: [2, 3],
    expectedRetiredCellIds: [1],
    expectedDividerPositions: [700],
    expectedSashCellIds: [3],
    expectedSashDirection: 'LEFT',
    expectedUnresolvedCount: 0,
    expectedNoMutationSteps: [],
    tags: ['delete', 'undo-structural-change', 'continue-after-restore', 'explicit-retarget'],
  }
}

function ambiguousTurnCase(index: number): AiPromptKnowledgeCorpus09Case {
  const moduleNumber = 1100 + index
  const quantity = (index % 3) + 1
  const movedPosition = 725 + (index % 6) * 25
  return {
    id: `CP9-SAFE-${pad(index)}`,
    track: 'AMBIGUOUS_TURN_NO_MUTATION',
    prompt: `Модул ${moduleNumber}, ${quantity} броя, каса 2100 x 1400 mm | сложи вертикален делител отляво на 700 mm | сложи крило в клетка 2 с двуосен десен механизъм | премести крилото там | смени крилото в клетка 2 да е двуосно ляво | премести делител 1 | премести делител 1 на ${movedPosition} mm отляво | смени крилото в клетка 1 да е двуосно дясно`,
    expectedCommandCount: 8,
    expectedActiveCellIds: [2, 3],
    expectedRetiredCellIds: [1],
    expectedDividerPositions: [movedPosition],
    expectedSashCellIds: [2],
    expectedSashDirection: 'LEFT',
    expectedUnresolvedCount: 3,
    expectedNoMutationSteps: [4, 6, 8],
    tags: ['ambiguous-reference', 'retired-cell', 'no-guessed-mutation', 'session-continues-after-unresolved-turn'],
  }
}

export const AI_PROMPT_KNOWLEDGE_CORPUS_09: AiPromptKnowledgeCorpus09Case[] = [
  ...Array.from({ length: 50 }, (_, index) => sequentialBuildCase(index + 1)),
  ...Array.from({ length: 50 }, (_, index) => correctUndoContinueCase(index + 1)),
  ...Array.from({ length: 50 }, (_, index) => deleteUndoRetargetCase(index + 1)),
  ...Array.from({ length: 50 }, (_, index) => ambiguousTurnCase(index + 1)),
]

export const AI_PROMPT_KNOWLEDGE_CORPUS_09_EXPECTED_COUNTS = {
  TOTAL: 200,
  SEQUENTIAL_BUILD_VISUAL_STATE: 50,
  CORRECT_UNDO_CONTINUE: 50,
  DELETE_UNDO_RETARGET_CONTINUE: 50,
  AMBIGUOUS_TURN_NO_MUTATION: 50,
} as const
