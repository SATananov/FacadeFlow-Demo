import {
  AI_PROMPT_KNOWLEDGE_CORPUS_10,
  type AiPromptKnowledgeCorpus10Case,
} from './aiPromptKnowledgeCorpus10'

export type AiPromptKnowledgeCorpus11Track =
  | 'EDITOR_CURRENT_FRAME_BINDING'
  | 'EDITOR_STABLE_CELL_BINDING'
  | 'EDITOR_TIMELINE_BINDING'
  | 'EDITOR_REVIEW_GATE_BINDING'

export interface AiPromptKnowledgeCorpus11Case {
  id: string
  track: AiPromptKnowledgeCorpus11Track
  prompt: string
  expectedCommandCount: number
  expectedActiveCellIds: number[]
  expectedRetiredCellIds: number[]
  expectedUnresolvedSteps: number[]
  expectedFinalUnresolvedCount: number
  tags: string[]
}

function trackFor(source: AiPromptKnowledgeCorpus10Case): AiPromptKnowledgeCorpus11Track {
  if (source.track === 'FRAME_EQUAL_SPLIT_LIVE_PREVIEW') return 'EDITOR_CURRENT_FRAME_BINDING'
  if (source.track === 'MOVE_STABLE_IDS_LIVE_PREVIEW') return 'EDITOR_STABLE_CELL_BINDING'
  if (source.track === 'DELETE_UNDO_LIVE_PREVIEW') return 'EDITOR_TIMELINE_BINDING'
  return 'EDITOR_REVIEW_GATE_BINDING'
}

export const AI_PROMPT_KNOWLEDGE_CORPUS_11: AiPromptKnowledgeCorpus11Case[] = AI_PROMPT_KNOWLEDGE_CORPUS_10.map((source, index) => ({
  id: `PK11-${String(index + 1).padStart(3, '0')}`,
  track: trackFor(source),
  prompt: source.prompt,
  expectedCommandCount: source.expectedCommandCount,
  expectedActiveCellIds: [...source.expectedActiveCellIds],
  expectedRetiredCellIds: [...source.expectedRetiredCellIds],
  expectedUnresolvedSteps: [...source.expectedUnresolvedSteps],
  expectedFinalUnresolvedCount: source.expectedFinalUnresolvedCount,
  tags: ['module-editor-ui-binding', ...source.tags],
}))

export const AI_PROMPT_KNOWLEDGE_CORPUS_11_EXPECTED_COUNTS = {
  TOTAL: 200,
  EDITOR_CURRENT_FRAME_BINDING: 50,
  EDITOR_STABLE_CELL_BINDING: 50,
  EDITOR_TIMELINE_BINDING: 50,
  EDITOR_REVIEW_GATE_BINDING: 50,
} as const
