import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  AI_PROMPT_KNOWLEDGE_CORPUS_11,
  AI_PROMPT_KNOWLEDGE_CORPUS_11_EXPECTED_COUNTS,
  type AiPromptKnowledgeCorpus11Case,
} from '../src/aiPromptKnowledgeCorpus11'
import {
  buildFacadeFlowModuleEditorBinding,
  isFacadeFlowModuleCommandSessionCandidate,
} from '../src/aiPromptModuleEditorBinding'

function evaluate(item: AiPromptKnowledgeCorpus11Case) {
  const binding = buildFacadeFlowModuleEditorBinding(item.prompt, item.id)
  const failures: string[] = []
  const current = binding.currentFrame

  if (!binding.eligibleForModulePreview) failures.push('eligibleForModulePreview must be true')
  if (binding.frames.length !== item.expectedCommandCount) failures.push(`frames=${binding.frames.length} expected=${item.expectedCommandCount}`)
  if (binding.timeline.length !== item.expectedCommandCount) failures.push(`timeline=${binding.timeline.length} expected=${item.expectedCommandCount}`)
  if (JSON.stringify(current?.cells.map((cell) => cell.id)) !== JSON.stringify(item.expectedActiveCellIds)) failures.push(`active=${current?.cells.map((cell) => cell.id)} expected=${item.expectedActiveCellIds}`)
  if (JSON.stringify(current?.retiredCellIds) !== JSON.stringify(item.expectedRetiredCellIds)) failures.push(`retired=${current?.retiredCellIds} expected=${item.expectedRetiredCellIds}`)
  if (current?.unresolvedCount !== item.expectedFinalUnresolvedCount) failures.push(`unresolved=${current?.unresolvedCount} expected=${item.expectedFinalUnresolvedCount}`)
  if (current?.cells.some((cell) => cell.label !== `Клетка ${cell.id}`)) failures.push('cell label/id binding mismatch')

  for (const step of item.expectedUnresolvedSteps) {
    const frame = binding.frames[step - 1]
    const previous = binding.frames[step - 2]
    if (frame?.status !== 'REVIEW_REQUIRED') failures.push(`step ${step} must be REVIEW_REQUIRED`)
    if (frame?.applied !== false) failures.push(`step ${step} must not be applied`)
    if (frame?.stateChanged !== false) failures.push(`step ${step} must not mutate state`)
    if (previous && frame?.visibleStateKey !== previous.visibleStateKey) failures.push(`step ${step} visible state must match previous frame`)
  }

  if (binding.humanReviewRequired !== true) failures.push('humanReviewRequired must stay true')
  if (binding.rulesValidated !== false) failures.push('rulesValidated must stay false')
  if (binding.automaticGeometryAllowed !== false) failures.push('automaticGeometryAllowed must stay false')
  if (binding.simulationOnly !== true) failures.push('simulationOnly must stay true')
  if (binding.machineReady !== false) failures.push('machineReady must stay false')
  if (binding.productionApproved !== false) failures.push('productionApproved must stay false')
  return failures
}

test('AI PROMPT KNOWLEDGE CORPUS 11 contains exactly 200 UI-binding sessions split 50/50/50/50', () => {
  assert.equal(AI_PROMPT_KNOWLEDGE_CORPUS_11.length, AI_PROMPT_KNOWLEDGE_CORPUS_11_EXPECTED_COUNTS.TOTAL)
  assert.equal(new Set(AI_PROMPT_KNOWLEDGE_CORPUS_11.map((item) => item.id)).size, AI_PROMPT_KNOWLEDGE_CORPUS_11.length)
  assert.equal(new Set(AI_PROMPT_KNOWLEDGE_CORPUS_11.map((item) => item.prompt)).size, AI_PROMPT_KNOWLEDGE_CORPUS_11.length)
  for (const track of ['EDITOR_CURRENT_FRAME_BINDING', 'EDITOR_STABLE_CELL_BINDING', 'EDITOR_TIMELINE_BINDING', 'EDITOR_REVIEW_GATE_BINDING'] as const) {
    assert.equal(AI_PROMPT_KNOWLEDGE_CORPUS_11.filter((item) => item.track === track).length, AI_PROMPT_KNOWLEDGE_CORPUS_11_EXPECTED_COUNTS[track])
  }
})

test('Corpus 11 evaluates all 200 editor bindings without production authority', () => {
  const failures = AI_PROMPT_KNOWLEDGE_CORPUS_11.flatMap((item) => evaluate(item).map((failure) => `${item.id}: ${failure}\n  ${item.prompt}`))
  assert.deepEqual(failures, [], failures.join('\n'))
})

test('module editor binding preserves stable Cell IDs and exact current-frame labels', () => {
  for (const item of AI_PROMPT_KNOWLEDGE_CORPUS_11) {
    const binding = buildFacadeFlowModuleEditorBinding(item.prompt, `${item.id}-stable`)
    const current = binding.currentFrame!
    assert.deepEqual(current.cells.map((cell) => cell.id), item.expectedActiveCellIds, item.id)
    assert.equal(current.cells.every((cell) => cell.label === `Клетка ${cell.id}`), true, item.id)
  }
})

test('review-gate editor frames preserve visible state and expose no automatic authority', () => {
  for (const item of AI_PROMPT_KNOWLEDGE_CORPUS_11.filter((item) => item.track === 'EDITOR_REVIEW_GATE_BINDING')) {
    const binding = buildFacadeFlowModuleEditorBinding(item.prompt, `${item.id}-review`)
    for (const step of item.expectedUnresolvedSteps) {
      const frame = binding.frames[step - 1]!
      const previous = binding.frames[step - 2]!
      assert.equal(frame.status, 'REVIEW_REQUIRED', `${item.id} step=${step}`)
      assert.equal(frame.visibleStateKey, previous.visibleStateKey, `${item.id} step=${step}`)
    }
    assert.equal(binding.machineReady, false, item.id)
    assert.equal(binding.productionApproved, false, item.id)
  }
})

test('candidate detection limits the live editor to multi-command module sessions', () => {
  assert.equal(isFacadeFlowModuleCommandSessionCandidate('Прозорец 1800 × 1400 mm, три полета.'), false)
  assert.equal(isFacadeFlowModuleCommandSessionCandidate('Модул 1, 3 броя, каса 2100 × 1400 mm'), false)
  assert.equal(isFacadeFlowModuleCommandSessionCandidate('Модул 1, 3 броя, каса 2100 × 1400 mm | раздели вертикално на три равни части'), true)
})

test('Corpus 11 is wired into the AI workspace through a display-only ModuleCommandLivePreviewPanel', () => {
  const workspace = readFileSync('src/components/FacadeFlowAIWorkspace.tsx', 'utf8')
  const panel = readFileSync('src/components/ModuleCommandLivePreviewPanel.tsx', 'utf8')
  const css = readFileSync('src/aiWorkspace.css', 'utf8')

  assert.match(workspace, /import \{ ModuleCommandLivePreviewPanel \} from '\.\/ModuleCommandLivePreviewPanel'/)
  assert.match(workspace, /<ModuleCommandLivePreviewPanel sourceText=\{session\.job\.description\}/)
  assert.match(panel, /isFacadeFlowModuleCommandSessionCandidate\(sourceText\)/)
  assert.match(panel, /Актуално състояние на модула/)
  assert.match(panel, /Клетка \$\{selectedCell\}/)
  assert.match(panel, /binding\.safetyLabel/)
  assert.match(css, /\.ff-module-command-preview/)
  assert.doesNotMatch(panel, /productionApproved\s*=\s*true|machineReady\s*=\s*true/)
})
