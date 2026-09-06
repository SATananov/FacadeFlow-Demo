import assert from 'node:assert/strict'
import test from 'node:test'
import { interpretFacadeFlowModuleGeometryPrompt } from '../src/aiPromptModuleGeometryInterpreter'
import {
  AI_PROMPT_KNOWLEDGE_CORPUS_07,
  AI_PROMPT_KNOWLEDGE_CORPUS_07_EXPECTED_COUNTS,
  type AiPromptKnowledgeCorpus07Case,
} from '../src/aiPromptKnowledgeCorpus07'

function evaluate(item: AiPromptKnowledgeCorpus07Case) {
  const result = interpretFacadeFlowModuleGeometryPrompt(item.prompt, item.id)
  const failures: string[] = []
  const activeIds = result.activeCells.map((cell) => cell.id)
  const retiredIds = result.retiredCells.map((cell) => cell.id)

  if (result.moduleNumber !== item.moduleNumber) failures.push(`moduleNumber=${result.moduleNumber} expected ${item.moduleNumber}`)
  if (result.quantity !== item.quantity) failures.push(`quantity=${result.quantity} expected ${item.quantity}`)
  if (result.frame?.widthMm !== item.frameWidthMm) failures.push(`frameWidth=${result.frame?.widthMm} expected ${item.frameWidthMm}`)
  if (result.frame?.heightMm !== item.frameHeightMm) failures.push(`frameHeight=${result.frame?.heightMm} expected ${item.frameHeightMm}`)
  if (JSON.stringify(activeIds) !== JSON.stringify(item.expectedActiveCellIds)) failures.push(`activeIds=${activeIds.join(',')} expected ${item.expectedActiveCellIds.join(',')}`)
  if (JSON.stringify(retiredIds) !== JSON.stringify(item.expectedRetiredCellIds)) failures.push(`retiredIds=${retiredIds.join(',')} expected ${item.expectedRetiredCellIds.join(',')}`)
  if (result.dividers.length !== item.expectedDividerCount) failures.push(`dividers=${result.dividers.length} expected ${item.expectedDividerCount}`)
  if (result.sashes.length !== item.expectedSashCount) failures.push(`sashes=${result.sashes.length} expected ${item.expectedSashCount}`)
  if (result.snapshots.length !== item.expectedSnapshotCount) failures.push(`snapshots=${result.snapshots.length} expected ${item.expectedSnapshotCount}`)
  if (result.unresolvedCommands.length !== item.expectedUnresolvedCount) failures.push(`unresolved=${result.unresolvedCommands.length} expected ${item.expectedUnresolvedCount}`)

  if (item.expectedEqualCellWidthMm !== undefined) {
    for (const cell of result.activeCells) {
      if (cell.widthMm !== item.expectedEqualCellWidthMm) failures.push(`cell ${cell.id} width=${cell.widthMm} expected ${item.expectedEqualCellWidthMm}`)
    }
  }
  if (item.expectedSashCellId !== undefined) {
    const sash = result.sashes.find((candidate) => candidate.cellId === item.expectedSashCellId)
    if (!sash) failures.push(`sash for cell ${item.expectedSashCellId} missing`)
    else if (sash.direction !== item.expectedSashDirection) failures.push(`sash direction=${sash.direction} expected ${item.expectedSashDirection}`)
  }

  if (result.humanReviewRequired !== true) failures.push('humanReviewRequired must stay true')
  if (result.rulesValidated !== false) failures.push('rulesValidated must stay false')
  if (result.automaticGeometryAllowed !== false) failures.push('automaticGeometryAllowed must stay false')
  if (result.simulationOnly !== true) failures.push('simulationOnly must stay true')
  if (result.machineReady !== false) failures.push('machineReady must stay false')
  if (result.productionApproved !== false) failures.push('productionApproved must stay false')
  return failures
}

test('AI PROMPT KNOWLEDGE CORPUS 07 contains exactly 200 unique prompts split 50/50/50/50', () => {
  assert.equal(AI_PROMPT_KNOWLEDGE_CORPUS_07.length, AI_PROMPT_KNOWLEDGE_CORPUS_07_EXPECTED_COUNTS.TOTAL)
  assert.equal(new Set(AI_PROMPT_KNOWLEDGE_CORPUS_07.map((item) => item.id)).size, AI_PROMPT_KNOWLEDGE_CORPUS_07.length)
  assert.equal(new Set(AI_PROMPT_KNOWLEDGE_CORPUS_07.map((item) => item.prompt)).size, AI_PROMPT_KNOWLEDGE_CORPUS_07.length)
  for (const track of ['MODULE_FRAME_QUANTITY', 'EXPLICIT_DIVIDER_STABLE_IDS', 'EQUAL_SPLIT_COMPUTED', 'CELL_TARGET_AND_AMBIGUITY_SAFETY'] as const) {
    assert.equal(AI_PROMPT_KNOWLEDGE_CORPUS_07.filter((item) => item.track === track).length, AI_PROMPT_KNOWLEDGE_CORPUS_07_EXPECTED_COUNTS[track])
  }
})

test('Corpus 07 evaluates all 200 stateful module prompts without production authority', () => {
  const failures = AI_PROMPT_KNOWLEDGE_CORPUS_07.flatMap((item) => evaluate(item).map((failure) => `${item.id}: ${failure}\n  ${item.prompt}`))
  assert.deepEqual(failures, [], failures.join('\n'))
})

test('Corpus 07 keeps stable sparse cell IDs when a child cell is divided again', () => {
  const cases = AI_PROMPT_KNOWLEDGE_CORPUS_07.filter((item) => item.track === 'EXPLICIT_DIVIDER_STABLE_IDS')
  assert.equal(cases.length, 50)
  for (const item of cases) {
    const result = interpretFacadeFlowModuleGeometryPrompt(item.prompt, `${item.id}-stable`)
    assert.deepEqual(result.activeCells.map((cell) => cell.id), [2, 4, 5], item.id)
    assert.deepEqual(result.retiredCells.map((cell) => cell.id), [1, 3], item.id)
    assert.ok(result.activeCells.some((cell) => cell.id === 2), item.id)
    assert.ok(!result.activeCells.some((cell) => cell.id === 3), item.id)
  }
})

test('Corpus 07 computes equal vertical split positions deterministically', () => {
  const cases = AI_PROMPT_KNOWLEDGE_CORPUS_07.filter((item) => item.track === 'EQUAL_SPLIT_COMPUTED')
  assert.equal(cases.length, 50)
  for (const item of cases) {
    const result = interpretFacadeFlowModuleGeometryPrompt(item.prompt, `${item.id}-equal`)
    const expected = item.frameWidthMm / 3
    assert.deepEqual(result.activeCells.map((cell) => cell.widthMm), [expected, expected, expected], item.id)
    assert.deepEqual(result.dividers.map((divider) => divider.positionMm), [expected, expected * 2], item.id)
  }
})

test('Corpus 07 targets sashes by active Cell ID and rejects ambiguous or retired references without mutation', () => {
  const cases = AI_PROMPT_KNOWLEDGE_CORPUS_07.filter((item) => item.track === 'CELL_TARGET_AND_AMBIGUITY_SAFETY')
  assert.equal(cases.length, 50)
  for (const item of cases) {
    const result = interpretFacadeFlowModuleGeometryPrompt(item.prompt, `${item.id}-safe`)
    assert.equal(result.sashes.length, 1, item.id)
    assert.deepEqual(result.sashes[0], { cellId: 3, opening: 'TILT_TURN', direction: 'RIGHT', createdAtStep: 3 }, item.id)
    assert.equal(result.unresolvedCommands.length, 1, item.id)
    assert.equal(result.snapshots[3]?.applied, false, item.id)
    assert.deepEqual(result.snapshots[2]?.sashes, result.snapshots[3]?.sashes, item.id)
  }
})

test('Corpus 07 records an updated module state snapshot after every command', () => {
  for (const item of AI_PROMPT_KNOWLEDGE_CORPUS_07) {
    const result = interpretFacadeFlowModuleGeometryPrompt(item.prompt, `${item.id}-snapshots`)
    assert.equal(result.snapshots.length, item.prompt.split('|').length, item.id)
    assert.deepEqual(result.snapshots.at(-1)?.activeCells, result.activeCells, item.id)
    assert.deepEqual(result.snapshots.at(-1)?.sashes, result.sashes, item.id)
  }
})
