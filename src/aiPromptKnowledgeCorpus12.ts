import {
  AI_PROMPT_KNOWLEDGE_CORPUS_11,
  type AiPromptKnowledgeCorpus11Case,
} from './aiPromptKnowledgeCorpus11'

export type AiPromptKnowledgeCorpus12Track =
  | 'STEPWISE_BUILD_APPLY'
  | 'STEPWISE_CORRECTION_APPLY'
  | 'STEPWISE_UNDO_CONTINUATION'
  | 'STEPWISE_REVIEW_RECOVERY'

export interface AiPromptKnowledgeCorpus12Case {
  id: string
  track: AiPromptKnowledgeCorpus12Track
  commands: string[]
  expectedCommandCount: number
  expectedActiveCellIds: number[]
  expectedRetiredCellIds: number[]
  expectedUnresolvedSteps: number[]
  expectedFinalUnresolvedCount: number
  tags: string[]
}

const normalize = (value: string) => value.replace(/\s+/g, ' ').trim()

function splitCommands(sourceText: string) {
  return sourceText
    .split(/\s*\|\s*|\r?\n+/g)
    .map(normalize)
    .filter(Boolean)
}

function trackFor(source: AiPromptKnowledgeCorpus11Case): AiPromptKnowledgeCorpus12Track {
  if (source.track === 'EDITOR_CURRENT_FRAME_BINDING') return 'STEPWISE_BUILD_APPLY'
  if (source.track === 'EDITOR_STABLE_CELL_BINDING') return 'STEPWISE_CORRECTION_APPLY'
  if (source.track === 'EDITOR_TIMELINE_BINDING') return 'STEPWISE_UNDO_CONTINUATION'
  return 'STEPWISE_REVIEW_RECOVERY'
}

export const AI_PROMPT_KNOWLEDGE_CORPUS_12: AiPromptKnowledgeCorpus12Case[] = AI_PROMPT_KNOWLEDGE_CORPUS_11.map((source, index) => ({
  id: `PK12-${String(index + 1).padStart(3, '0')}`,
  track: trackFor(source),
  commands: splitCommands(source.prompt),
  expectedCommandCount: source.expectedCommandCount,
  expectedActiveCellIds: [...source.expectedActiveCellIds],
  expectedRetiredCellIds: [...source.expectedRetiredCellIds],
  expectedUnresolvedSteps: [...source.expectedUnresolvedSteps],
  expectedFinalUnresolvedCount: source.expectedFinalUnresolvedCount,
  tags: ['interactive-command-runtime', ...source.tags],
}))

export const AI_PROMPT_KNOWLEDGE_CORPUS_12_EXPECTED_COUNTS = {
  TOTAL: 200,
  STEPWISE_BUILD_APPLY: 50,
  STEPWISE_CORRECTION_APPLY: 50,
  STEPWISE_UNDO_CONTINUATION: 50,
  STEPWISE_REVIEW_RECOVERY: 50,
} as const
