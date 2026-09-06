import assert from 'node:assert/strict'
import test from 'node:test'
import {
  AI_PROMPT_KNOWLEDGE_CORPUS_10,
  AI_PROMPT_KNOWLEDGE_CORPUS_10_EXPECTED_COUNTS,
  type AiPromptKnowledgeCorpus10Case,
} from '../src/aiPromptKnowledgeCorpus10'
import { interpretFacadeFlowModuleLivePreview } from '../src/aiPromptModuleLivePreview'

function evaluate(item: AiPromptKnowledgeCorpus10Case) {
  const result = interpretFacadeFlowModuleLivePreview(item.prompt, item.id)
  const failures: string[] = []
  const current = result.currentFrame

  if (result.commands.length !== item.expectedCommandCount) failures.push(`commands=${result.commands.length} expected=${item.expectedCommandCount}`)
  if (result.frames.length !== item.expectedCommandCount) failures.push(`frames=${result.frames.length} expected=${item.expectedCommandCount}`)
  if (!current) failures.push('currentFrame must exist')
  if (JSON.stringify(current?.cells.map((cell) => cell.id)) !== JSON.stringify(item.expectedActiveCellIds)) failures.push(`active=${current?.cells.map((cell) => cell.id)} expected=${item.expectedActiveCellIds}`)
  if (JSON.stringify(current?.retiredCellIds) !== JSON.stringify(item.expectedRetiredCellIds)) failures.push(`retired=${current?.retiredCellIds} expected=${item.expectedRetiredCellIds}`)
  if (JSON.stringify(current?.dividers.map((divider) => divider.positionMm)) !== JSON.stringify(item.expectedDividerPositions)) failures.push(`dividerPositions=${current?.dividers.map((divider) => divider.positionMm)} expected=${item.expectedDividerPositions}`)
  if (JSON.stringify(current?.cells.filter((cell) => cell.hasSash).map((cell) => cell.id)) !== JSON.stringify(item.expectedSashCellIds)) failures.push(`sashes=${current?.cells.filter((cell) => cell.hasSash).map((cell) => cell.id)} expected=${item.expectedSashCellIds}`)
  if (current?.unresolvedCount !== item.expectedFinalUnresolvedCount) failures.push(`unresolved=${current?.unresolvedCount} expected=${item.expectedFinalUnresolvedCount}`)

  for (const step of item.expectedUnresolvedSteps) {
    const frame = result.frames[step - 1]
    const previous = result.frames[step - 2]
    if (frame?.status !== 'REVIEW_REQUIRED') failures.push(`step ${step} must be REVIEW_REQUIRED`)
    if (frame?.applied !== false) failures.push(`step ${step} must not be applied`)
    if (frame?.stateChanged !== false) failures.push(`step ${step} must not mutate state`)
    if (previous && frame?.visibleStateKey !== previous.visibleStateKey) failures.push(`step ${step} visible state must match previous frame`)
  }

  if (result.humanReviewRequired !== true) failures.push('humanReviewRequired must stay true')
  if (result.rulesValidated !== false) failures.push('rulesValidated must stay false')
  if (result.automaticGeometryAllowed !== false) failures.push('automaticGeometryAllowed must stay false')
  if (result.simulationOnly !== true) failures.push('simulationOnly must stay true')
  if (result.machineReady !== false) failures.push('machineReady must stay false')
  if (result.productionApproved !== false) failures.push('productionApproved must stay false')
  return failures
}

test('AI PROMPT KNOWLEDGE CORPUS 10 contains exactly 200 unique live-preview sessions split 50/50/50/50', () => {
  assert.equal(AI_PROMPT_KNOWLEDGE_CORPUS_10.length, AI_PROMPT_KNOWLEDGE_CORPUS_10_EXPECTED_COUNTS.TOTAL)
  assert.equal(new Set(AI_PROMPT_KNOWLEDGE_CORPUS_10.map((item) => item.id)).size, AI_PROMPT_KNOWLEDGE_CORPUS_10.length)
  assert.equal(new Set(AI_PROMPT_KNOWLEDGE_CORPUS_10.map((item) => item.prompt)).size, AI_PROMPT_KNOWLEDGE_CORPUS_10.length)
  for (const track of ['FRAME_EQUAL_SPLIT_LIVE_PREVIEW', 'MOVE_STABLE_IDS_LIVE_PREVIEW', 'DELETE_UNDO_LIVE_PREVIEW', 'AMBIGUOUS_NO_MUTATION_LIVE_PREVIEW'] as const) {
    assert.equal(AI_PROMPT_KNOWLEDGE_CORPUS_10.filter((item) => item.track === track).length, AI_PROMPT_KNOWLEDGE_CORPUS_10_EXPECTED_COUNTS[track])
  }
})

test('Corpus 10 evaluates all 200 live-preview sessions without production authority', () => {
  const failures = AI_PROMPT_KNOWLEDGE_CORPUS_10.flatMap((item) => evaluate(item).map((failure) => `${item.id}: ${failure}\n  ${item.prompt}`))
  assert.deepEqual(failures, [], failures.join('\n'))
})

test('every command produces one UI-ready frame with current Cell ID labels', () => {
  for (const item of AI_PROMPT_KNOWLEDGE_CORPUS_10) {
    const result = interpretFacadeFlowModuleLivePreview(item.prompt, `${item.id}-frame-count`)
    assert.equal(result.frames.length, result.commands.length, item.id)
    for (const frame of result.frames) {
      assert.equal(frame.step >= 1, true, item.id)
      assert.equal(frame.cells.every((cell) => cell.label === `Клетка ${cell.id}`), true, `${item.id} step=${frame.step}`)
      assert.equal(frame.cells.every((cell) => cell.xPct >= 0 && cell.yPct >= 0 && cell.widthPct >= 0 && cell.heightPct >= 0), true, `${item.id} step=${frame.step}`)
    }
  }
})

test('moving a divider updates preview geometry without renumbering active cells', () => {
  for (const item of AI_PROMPT_KNOWLEDGE_CORPUS_10.filter((item) => item.track === 'MOVE_STABLE_IDS_LIVE_PREVIEW')) {
    const result = interpretFacadeFlowModuleLivePreview(item.prompt, `${item.id}-stable`)
    assert.deepEqual(result.frames[2]?.cells.map((cell) => cell.id), [2, 3], item.id)
    assert.deepEqual(result.frames[3]?.cells.map((cell) => cell.id), [2, 3], item.id)
    assert.notEqual(result.frames[2]?.visibleStateKey, result.frames[3]?.visibleStateKey, item.id)
  }
})

test('delete then Undo shows the merged preview and then restores the prior Cell IDs', () => {
  for (const item of AI_PROMPT_KNOWLEDGE_CORPUS_10.filter((item) => item.track === 'DELETE_UNDO_LIVE_PREVIEW')) {
    const result = interpretFacadeFlowModuleLivePreview(item.prompt, `${item.id}-undo`)
    assert.deepEqual(result.frames[3]?.cells.map((cell) => cell.id), [4], `${item.id} delete frame`)
    assert.deepEqual(result.frames[4]?.cells.map((cell) => cell.id), [2, 3], `${item.id} undo frame`)
    assert.equal(result.frames[4]?.status, 'APPLIED', item.id)
  }
})

test('ambiguous and retired-target commands surface REVIEW_REQUIRED while preserving the previous visible preview', () => {
  for (const item of AI_PROMPT_KNOWLEDGE_CORPUS_10.filter((item) => item.track === 'AMBIGUOUS_NO_MUTATION_LIVE_PREVIEW')) {
    const result = interpretFacadeFlowModuleLivePreview(item.prompt, `${item.id}-review`)
    for (const step of item.expectedUnresolvedSteps) {
      const frame = result.frames[step - 1]!
      const previous = result.frames[step - 2]!
      assert.equal(frame.status, 'REVIEW_REQUIRED', `${item.id} step=${step}`)
      assert.equal(frame.stateChanged, false, `${item.id} step=${step}`)
      assert.equal(frame.visibleStateKey, previous.visibleStateKey, `${item.id} step=${step}`)
    }
  }
})
