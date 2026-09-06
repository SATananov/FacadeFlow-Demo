import assert from 'node:assert/strict'
import test from 'node:test'
import {
  AI_PROMPT_KNOWLEDGE_CORPUS_09,
  AI_PROMPT_KNOWLEDGE_CORPUS_09_EXPECTED_COUNTS,
  type AiPromptKnowledgeCorpus09Case,
} from '../src/aiPromptKnowledgeCorpus09'
import { interpretFacadeFlowModuleSessionPrompt } from '../src/aiPromptModuleSessionInterpreter'

function evaluate(item: AiPromptKnowledgeCorpus09Case) {
  const result = interpretFacadeFlowModuleSessionPrompt(item.prompt, item.id)
  const failures: string[] = []
  if (result.commands.length !== item.expectedCommandCount) failures.push(`commands=${result.commands.length} expected=${item.expectedCommandCount}`)
  if (result.sessionSnapshots.length !== item.expectedCommandCount) failures.push(`snapshots=${result.sessionSnapshots.length} expected=${item.expectedCommandCount}`)
  if (JSON.stringify(result.activeCells.map((cell) => cell.id)) !== JSON.stringify(item.expectedActiveCellIds)) failures.push(`active=${result.activeCells.map((cell) => cell.id)} expected=${item.expectedActiveCellIds}`)
  if (JSON.stringify(result.retiredCells.map((cell) => cell.id)) !== JSON.stringify(item.expectedRetiredCellIds)) failures.push(`retired=${result.retiredCells.map((cell) => cell.id)} expected=${item.expectedRetiredCellIds}`)
  if (JSON.stringify(result.dividers.map((divider) => divider.positionMm)) !== JSON.stringify(item.expectedDividerPositions)) failures.push(`dividerPositions=${result.dividers.map((divider) => divider.positionMm)} expected=${item.expectedDividerPositions}`)
  if (JSON.stringify(result.sashes.map((sash) => sash.cellId)) !== JSON.stringify(item.expectedSashCellIds)) failures.push(`sashes=${result.sashes.map((sash) => sash.cellId)} expected=${item.expectedSashCellIds}`)
  if (item.expectedSashDirection && result.sashes[0]?.direction !== item.expectedSashDirection) failures.push(`sashDirection=${result.sashes[0]?.direction} expected=${item.expectedSashDirection}`)
  if (result.unresolvedCommands.length !== item.expectedUnresolvedCount) failures.push(`unresolved=${result.unresolvedCommands.length} expected=${item.expectedUnresolvedCount}`)
  for (const step of item.expectedNoMutationSteps) {
    if (result.sessionSnapshots[step - 1]?.stateChanged !== false) failures.push(`step ${step} must not mutate visible state`)
    if (result.sessionSnapshots[step - 1]?.applied !== false) failures.push(`step ${step} must stay unresolved`)
  }
  if (result.humanReviewRequired !== true) failures.push('humanReviewRequired must stay true')
  if (result.rulesValidated !== false) failures.push('rulesValidated must stay false')
  if (result.automaticGeometryAllowed !== false) failures.push('automaticGeometryAllowed must stay false')
  if (result.simulationOnly !== true) failures.push('simulationOnly must stay true')
  if (result.machineReady !== false) failures.push('machineReady must stay false')
  if (result.productionApproved !== false) failures.push('productionApproved must stay false')
  return failures
}

test('AI PROMPT KNOWLEDGE CORPUS 09 contains exactly 200 unique sequential sessions split 50/50/50/50', () => {
  assert.equal(AI_PROMPT_KNOWLEDGE_CORPUS_09.length, AI_PROMPT_KNOWLEDGE_CORPUS_09_EXPECTED_COUNTS.TOTAL)
  assert.equal(new Set(AI_PROMPT_KNOWLEDGE_CORPUS_09.map((item) => item.id)).size, AI_PROMPT_KNOWLEDGE_CORPUS_09.length)
  assert.equal(new Set(AI_PROMPT_KNOWLEDGE_CORPUS_09.map((item) => item.prompt)).size, AI_PROMPT_KNOWLEDGE_CORPUS_09.length)
  for (const track of ['SEQUENTIAL_BUILD_VISUAL_STATE', 'CORRECT_UNDO_CONTINUE', 'DELETE_UNDO_RETARGET_CONTINUE', 'AMBIGUOUS_TURN_NO_MUTATION'] as const) {
    assert.equal(AI_PROMPT_KNOWLEDGE_CORPUS_09.filter((item) => item.track === track).length, AI_PROMPT_KNOWLEDGE_CORPUS_09_EXPECTED_COUNTS[track])
  }
})

test('Corpus 09 evaluates all 200 multi-turn sessions without production authority', () => {
  const failures = AI_PROMPT_KNOWLEDGE_CORPUS_09.flatMap((item) => evaluate(item).map((failure) => `${item.id}: ${failure}\n  ${item.prompt}`))
  assert.deepEqual(failures, [], failures.join('\n'))
})

test('every session command produces an immediate visible-state snapshot', () => {
  for (const item of AI_PROMPT_KNOWLEDGE_CORPUS_09) {
    const result = interpretFacadeFlowModuleSessionPrompt(item.prompt, `${item.id}-snapshots`)
    assert.equal(result.sessionSnapshots.length, result.commands.length, item.id)
    assert.deepEqual(result.sessionSnapshots.map((snapshot) => snapshot.step), result.commands.map((_, index) => index + 1), item.id)
  }
})

test('Undo restores visible state and the session can safely continue afterward', () => {
  for (const item of AI_PROMPT_KNOWLEDGE_CORPUS_09.filter((item) => item.track === 'CORRECT_UNDO_CONTINUE' || item.track === 'DELETE_UNDO_RETARGET_CONTINUE')) {
    const result = interpretFacadeFlowModuleSessionPrompt(item.prompt, `${item.id}-undo`)
    const undoSnapshots = result.sessionSnapshots.filter((snapshot) => /(?:върни|undo)/iu.test(snapshot.command))
    assert.ok(undoSnapshots.length >= 1, item.id)
    assert.ok(undoSnapshots.every((snapshot) => snapshot.applied), item.id)
    assert.equal(result.unresolvedCommands.length, 0, item.id)
  }
})

test('ambiguous or retired-target turns do not mutate state, but later explicit commands still apply', () => {
  for (const item of AI_PROMPT_KNOWLEDGE_CORPUS_09.filter((item) => item.track === 'AMBIGUOUS_TURN_NO_MUTATION')) {
    const result = interpretFacadeFlowModuleSessionPrompt(item.prompt, `${item.id}-safety`)
    assert.equal(result.unresolvedCommands.length, 3, item.id)
    for (const step of item.expectedNoMutationSteps) {
      assert.equal(result.sessionSnapshots[step - 1]?.applied, false, `${item.id} step=${step}`)
      assert.equal(result.sessionSnapshots[step - 1]?.stateChanged, false, `${item.id} step=${step}`)
    }
    assert.equal(result.sessionSnapshots[6]?.applied, true, item.id)
  }
})

test('stable Cell IDs remain addressable across a whole sequential session until their cell is structurally changed', () => {
  for (const item of AI_PROMPT_KNOWLEDGE_CORPUS_09.filter((item) => item.track === 'SEQUENTIAL_BUILD_VISUAL_STATE')) {
    const result = interpretFacadeFlowModuleSessionPrompt(item.prompt, `${item.id}-ids`)
    assert.deepEqual(result.activeCells.map((cell) => cell.id), [2, 5, 6, 7, 8], item.id)
    assert.deepEqual(result.retiredCells.map((cell) => cell.id), [1, 3, 4], item.id)
    assert.deepEqual(result.sashes.map((sash) => sash.cellId), [5, 8], item.id)
  }
})
