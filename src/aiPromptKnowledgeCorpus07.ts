export type AiPromptKnowledgeCorpus07Track =
  | 'MODULE_FRAME_QUANTITY'
  | 'EXPLICIT_DIVIDER_STABLE_IDS'
  | 'EQUAL_SPLIT_COMPUTED'
  | 'CELL_TARGET_AND_AMBIGUITY_SAFETY'

export interface AiPromptKnowledgeCorpus07Case {
  id: string
  track: AiPromptKnowledgeCorpus07Track
  prompt: string
  moduleNumber: number
  quantity: number
  frameWidthMm: number
  frameHeightMm: number
  expectedActiveCellIds: number[]
  expectedRetiredCellIds: number[]
  expectedDividerCount: number
  expectedSashCount: number
  expectedSnapshotCount: number
  expectedUnresolvedCount: number
  expectedEqualCellWidthMm?: number
  expectedSashCellId?: number
  expectedSashDirection?: 'LEFT' | 'RIGHT'
  tags: string[]
}

const pad = (value: number) => String(value).padStart(3, '0')

function frameCase(index: number): AiPromptKnowledgeCorpus07Case {
  const moduleNumber = index
  const quantity = (index % 7) + 1
  const frameWidthMm = 1200 + index * 10
  const frameHeightMm = 1300 + (index % 5) * 50
  return {
    id: `CP7-FRAME-${pad(index)}`,
    track: 'MODULE_FRAME_QUANTITY',
    prompt: `Модул ${moduleNumber}, ${quantity} броя, каса ${frameWidthMm} x ${frameHeightMm} mm`,
    moduleNumber,
    quantity,
    frameWidthMm,
    frameHeightMm,
    expectedActiveCellIds: [1],
    expectedRetiredCellIds: [],
    expectedDividerCount: 0,
    expectedSashCount: 0,
    expectedSnapshotCount: 1,
    expectedUnresolvedCount: 0,
    tags: ['module-quantity', 'frame-size', 'initial-cell-1', 'state-snapshot'],
  }
}

function explicitDividerCase(index: number): AiPromptKnowledgeCorpus07Case {
  const moduleNumber = 100 + index
  const quantity = (index % 5) + 1
  const frameWidthMm = 2100 + (index % 4) * 100
  const frameHeightMm = 1400 + (index % 3) * 100
  const firstOffset = 700
  const secondOffset = 500
  return {
    id: `CP7-DIV-${pad(index)}`,
    track: 'EXPLICIT_DIVIDER_STABLE_IDS',
    prompt: `Модул ${moduleNumber}, ${quantity} броя, каса ${frameWidthMm} x ${frameHeightMm} mm | сложи вертикален делител отляво на ${firstOffset} mm | в клетка 3 сложи хоризонтален делител отгоре на ${secondOffset} mm`,
    moduleNumber,
    quantity,
    frameWidthMm,
    frameHeightMm,
    expectedActiveCellIds: [2, 4, 5],
    expectedRetiredCellIds: [1, 3],
    expectedDividerCount: 2,
    expectedSashCount: 0,
    expectedSnapshotCount: 3,
    expectedUnresolvedCount: 0,
    tags: ['explicit-divider', 'stable-cell-id', 'sparse-cell-numbering', 'retired-parent-cell'],
  }
}

function equalSplitCase(index: number): AiPromptKnowledgeCorpus07Case {
  const moduleNumber = 200 + index
  const quantity = (index % 6) + 1
  const widths = [2100, 2400, 2700, 3000, 3300]
  const frameWidthMm = widths[(index - 1) % widths.length]!
  const frameHeightMm = 1400 + (index % 4) * 50
  return {
    id: `CP7-EQUAL-${pad(index)}`,
    track: 'EQUAL_SPLIT_COMPUTED',
    prompt: `Модул ${moduleNumber}, ${quantity} броя, каса ${frameWidthMm} x ${frameHeightMm} mm | раздели прозореца с вертикални делители на три равни части`,
    moduleNumber,
    quantity,
    frameWidthMm,
    frameHeightMm,
    expectedActiveCellIds: [2, 3, 4],
    expectedRetiredCellIds: [1],
    expectedDividerCount: 2,
    expectedSashCount: 0,
    expectedSnapshotCount: 2,
    expectedUnresolvedCount: 0,
    expectedEqualCellWidthMm: frameWidthMm / 3,
    tags: ['equal-split', 'computed-divider-position', 'three-equal-cells', 'deterministic-draft-math'],
  }
}

function cellTargetSafetyCase(index: number): AiPromptKnowledgeCorpus07Case {
  const moduleNumber = 300 + index
  const quantity = (index % 4) + 1
  const frameWidthMm = 2100
  const frameHeightMm = 1400 + (index % 3) * 100
  const unsafeCommand = index <= 25
    ? 'сложи крило там с двуосен ляв механизъм'
    : 'сложи крило в клетка 1 с двуосен ляв механизъм'
  return {
    id: `CP7-SAFE-${pad(index)}`,
    track: 'CELL_TARGET_AND_AMBIGUITY_SAFETY',
    prompt: `Модул ${moduleNumber}, ${quantity} броя, каса ${frameWidthMm} x ${frameHeightMm} mm | раздели прозореца с вертикални делители на три равни части | сложи крило в клетка 3 с двуосен десен механизъм | ${unsafeCommand}`,
    moduleNumber,
    quantity,
    frameWidthMm,
    frameHeightMm,
    expectedActiveCellIds: [2, 3, 4],
    expectedRetiredCellIds: [1],
    expectedDividerCount: 2,
    expectedSashCount: 1,
    expectedSnapshotCount: 4,
    expectedUnresolvedCount: 1,
    expectedEqualCellWidthMm: 700,
    expectedSashCellId: 3,
    expectedSashDirection: 'RIGHT',
    tags: index <= 25
      ? ['exact-cell-target', 'ambiguous-there', 'no-guessed-target', 'state-preserved-after-rejected-command']
      : ['exact-cell-target', 'retired-cell-reference', 'no-reuse-of-cell-id', 'state-preserved-after-rejected-command'],
  }
}

export const AI_PROMPT_KNOWLEDGE_CORPUS_07: AiPromptKnowledgeCorpus07Case[] = [
  ...Array.from({ length: 50 }, (_, index) => frameCase(index + 1)),
  ...Array.from({ length: 50 }, (_, index) => explicitDividerCase(index + 1)),
  ...Array.from({ length: 50 }, (_, index) => equalSplitCase(index + 1)),
  ...Array.from({ length: 50 }, (_, index) => cellTargetSafetyCase(index + 1)),
]

export const AI_PROMPT_KNOWLEDGE_CORPUS_07_EXPECTED_COUNTS = {
  TOTAL: 200,
  MODULE_FRAME_QUANTITY: 50,
  EXPLICIT_DIVIDER_STABLE_IDS: 50,
  EQUAL_SPLIT_COMPUTED: 50,
  CELL_TARGET_AND_AMBIGUITY_SAFETY: 50,
} as const
