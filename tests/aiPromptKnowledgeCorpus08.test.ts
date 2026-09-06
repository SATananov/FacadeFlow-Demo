import assert from 'node:assert/strict'
import test from 'node:test'
import {
  AI_PROMPT_KNOWLEDGE_CORPUS_08,
  AI_PROMPT_KNOWLEDGE_CORPUS_08_EXPECTED_COUNTS,
  type AiPromptKnowledgeCorpus08Case,
} from '../src/aiPromptKnowledgeCorpus08'
import { interpretFacadeFlowModuleCorrectionPrompt } from '../src/aiPromptModuleCorrectionInterpreter'

function evaluate(item: AiPromptKnowledgeCorpus08Case) {
  const result = interpretFacadeFlowModuleCorrectionPrompt(item.prompt, item.id)
  const failures: string[] = []
  if (JSON.stringify(result.activeCells.map((cell) => cell.id)) !== JSON.stringify(item.expectedActiveCellIds)) failures.push(`active=${result.activeCells.map((cell) => cell.id)} expected=${item.expectedActiveCellIds}`)
  if (JSON.stringify(result.retiredCells.map((cell) => cell.id)) !== JSON.stringify(item.expectedRetiredCellIds)) failures.push(`retired=${result.retiredCells.map((cell) => cell.id)} expected=${item.expectedRetiredCellIds}`)
  if (JSON.stringify(result.dividers.map((divider) => divider.positionMm)) !== JSON.stringify(item.expectedDividerPositions)) failures.push(`dividerPositions=${result.dividers.map((divider) => divider.positionMm)} expected=${item.expectedDividerPositions}`)
  if (JSON.stringify(result.sashes.map((sash) => sash.cellId)) !== JSON.stringify(item.expectedSashCellIds)) failures.push(`sashes=${result.sashes.map((sash) => sash.cellId)} expected=${item.expectedSashCellIds}`)
  if (item.expectedSashDirection && result.sashes[0]?.direction !== item.expectedSashDirection) failures.push(`sashDirection=${result.sashes[0]?.direction} expected=${item.expectedSashDirection}`)
  if (result.unresolvedCommands.length !== item.expectedUnresolvedCount) failures.push(`unresolved=${result.unresolvedCommands.length} expected=${item.expectedUnresolvedCount}`)
  if (result.snapshots.length !== item.expectedCorrectionSnapshotCount) failures.push(`snapshots=${result.snapshots.length} expected=${item.expectedCorrectionSnapshotCount}`)
  if (result.humanReviewRequired !== true) failures.push('humanReviewRequired must stay true')
  if (result.rulesValidated !== false) failures.push('rulesValidated must stay false')
  if (result.automaticGeometryAllowed !== false) failures.push('automaticGeometryAllowed must stay false')
  if (result.simulationOnly !== true) failures.push('simulationOnly must stay true')
  if (result.machineReady !== false) failures.push('machineReady must stay false')
  if (result.productionApproved !== false) failures.push('productionApproved must stay false')
  return failures
}

test('AI PROMPT KNOWLEDGE CORPUS 08 contains exactly 200 unique prompts split 50/50/50/50', () => {
  assert.equal(AI_PROMPT_KNOWLEDGE_CORPUS_08.length, AI_PROMPT_KNOWLEDGE_CORPUS_08_EXPECTED_COUNTS.TOTAL)
  assert.equal(new Set(AI_PROMPT_KNOWLEDGE_CORPUS_08.map((item) => item.id)).size, AI_PROMPT_KNOWLEDGE_CORPUS_08.length)
  assert.equal(new Set(AI_PROMPT_KNOWLEDGE_CORPUS_08.map((item) => item.prompt)).size, AI_PROMPT_KNOWLEDGE_CORPUS_08.length)
  for (const track of ['MOVE_DIVIDER_STABLE_IDS', 'DELETE_DIVIDER_STRUCTURAL_IDS', 'UNDO_RESTORES_VISIBLE_STATE', 'SASH_CORRECTION_RETARGET_SAFETY'] as const) {
    assert.equal(AI_PROMPT_KNOWLEDGE_CORPUS_08.filter((item) => item.track === track).length, AI_PROMPT_KNOWLEDGE_CORPUS_08_EXPECTED_COUNTS[track])
  }
})

test('Corpus 08 evaluates all 200 stateful correction prompts without production authority', () => {
  const failures = AI_PROMPT_KNOWLEDGE_CORPUS_08.flatMap((item) => evaluate(item).map((failure) => `${item.id}: ${failure}\n  ${item.prompt}`))
  assert.deepEqual(failures, [], failures.join('\n'))
})

test('moving a divider changes geometry but preserves the existing active Cell IDs', () => {
  for (const item of AI_PROMPT_KNOWLEDGE_CORPUS_08.filter((item) => item.track === 'MOVE_DIVIDER_STABLE_IDS')) {
    const result = interpretFacadeFlowModuleCorrectionPrompt(item.prompt, `${item.id}-move`)
    assert.deepEqual(result.activeCells.map((cell) => cell.id), [2, 3], item.id)
    assert.deepEqual(result.retiredCells.map((cell) => cell.id), [1], item.id)
    assert.equal(result.snapshots[0]?.kind, 'MOVE_DIVIDER', item.id)
  }
})

test('deleting a divider retires both structurally changed child cells and creates one new Cell ID', () => {
  for (const item of AI_PROMPT_KNOWLEDGE_CORPUS_08.filter((item) => item.track === 'DELETE_DIVIDER_STRUCTURAL_IDS')) {
    const result = interpretFacadeFlowModuleCorrectionPrompt(item.prompt, `${item.id}-delete`)
    assert.deepEqual(result.activeCells.map((cell) => cell.id), [4], item.id)
    assert.deepEqual(result.retiredCells.map((cell) => cell.id), [1, 2, 3], item.id)
    assert.equal(result.dividers.length, 0, item.id)
  }
})

test('Undo restores the previous visible stable Cell IDs and divider state exactly', () => {
  for (const item of AI_PROMPT_KNOWLEDGE_CORPUS_08.filter((item) => item.track === 'UNDO_RESTORES_VISIBLE_STATE')) {
    const result = interpretFacadeFlowModuleCorrectionPrompt(item.prompt, `${item.id}-undo`)
    assert.deepEqual(result.activeCells.map((cell) => cell.id), [2, 3], item.id)
    assert.deepEqual(result.retiredCells.map((cell) => cell.id), [1], item.id)
    assert.deepEqual(result.dividers.map((divider) => divider.positionMm), [700], item.id)
    assert.equal(result.snapshots.at(-1)?.kind, 'UNDO', item.id)
    assert.equal(result.snapshots.at(-1)?.applied, true, item.id)
  }
})

test('sash changes and retargeting preserve cell identity while ambiguous or retired targets do not mutate state', () => {
  for (const item of AI_PROMPT_KNOWLEDGE_CORPUS_08.filter((item) => item.track === 'SASH_CORRECTION_RETARGET_SAFETY')) {
    const result = interpretFacadeFlowModuleCorrectionPrompt(item.prompt, `${item.id}-sash`)
    assert.deepEqual(result.activeCells.map((cell) => cell.id), [2, 3], item.id)
    assert.deepEqual(result.sashes.map((sash) => [sash.cellId, sash.direction]), [[3, 'LEFT']], item.id)
    assert.equal(result.unresolvedCommands.length, 1, item.id)
    assert.equal(result.snapshots.at(-1)?.applied, false, item.id)
    assert.deepEqual(result.snapshots.at(-2)?.sashes, result.snapshots.at(-1)?.sashes, item.id)
  }
})

test('every correction command emits an updated state snapshot for immediate UI refresh', () => {
  for (const item of AI_PROMPT_KNOWLEDGE_CORPUS_08) {
    const result = interpretFacadeFlowModuleCorrectionPrompt(item.prompt, `${item.id}-snapshots`)
    assert.equal(result.snapshots.length, item.expectedCorrectionSnapshotCount, item.id)
    assert.deepEqual(result.snapshots.at(-1)?.activeCells, result.activeCells, item.id)
    assert.deepEqual(result.snapshots.at(-1)?.sashes, result.sashes, item.id)
  }
})
