import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  AI_PROMPT_KNOWLEDGE_CORPUS_12,
  AI_PROMPT_KNOWLEDGE_CORPUS_12_EXPECTED_COUNTS,
  type AiPromptKnowledgeCorpus12Case,
} from '../src/aiPromptKnowledgeCorpus12'
import {
  applyFacadeFlowModuleInteractiveCommand,
  clearFacadeFlowModuleInteractiveRuntime,
  createFacadeFlowModuleInteractiveRuntime,
  isFacadeFlowInteractiveModuleRuntimeCandidate,
  reloadFacadeFlowModuleInteractiveRuntime,
} from '../src/aiPromptModuleInteractiveRuntime'
import { buildFacadeFlowModuleEditorBinding } from '../src/aiPromptModuleEditorBinding'

function evaluate(item: AiPromptKnowledgeCorpus12Case) {
  let runtime = createFacadeFlowModuleInteractiveRuntime('', item.id)
  const failures: string[] = []

  item.commands.forEach((command, index) => {
    const previousKey = runtime.currentFrame?.visibleStateKey ?? null
    runtime = applyFacadeFlowModuleInteractiveCommand(runtime, command)
    const prefix = item.commands.slice(0, index + 1).join(' | ')
    const expected = buildFacadeFlowModuleEditorBinding(prefix, `${item.id}-expected-${index + 1}`)
    const expectedFrame = expected.currentFrame

    if (runtime.currentStep !== index + 1) failures.push(`step ${index + 1}: currentStep=${runtime.currentStep}`)
    if (runtime.commands.length !== index + 1) failures.push(`step ${index + 1}: commands=${runtime.commands.length}`)
    if (runtime.currentFrame?.visibleStateKey !== expectedFrame?.visibleStateKey) failures.push(`step ${index + 1}: visible state mismatch`)
    if (runtime.lastCommand !== command) failures.push(`step ${index + 1}: lastCommand mismatch`)

    const unresolved = item.expectedUnresolvedSteps.includes(index + 1)
    if (unresolved) {
      if (runtime.lastCommandStatus !== 'REVIEW_REQUIRED') failures.push(`step ${index + 1}: expected REVIEW_REQUIRED`)
      if (runtime.lastCommandApplied !== false) failures.push(`step ${index + 1}: unresolved command must not apply`)
      if (index > 0 && runtime.currentFrame?.visibleStateKey !== previousKey) failures.push(`step ${index + 1}: unresolved command mutated visible state`)
    } else if (runtime.lastCommandStatus !== 'APPLIED') failures.push(`step ${index + 1}: expected APPLIED`)
  })

  if (runtime.commands.length !== item.expectedCommandCount) failures.push(`final commands=${runtime.commands.length} expected=${item.expectedCommandCount}`)
  if (JSON.stringify(runtime.currentFrame?.cells.map((cell) => cell.id)) !== JSON.stringify(item.expectedActiveCellIds)) failures.push(`final active=${runtime.currentFrame?.cells.map((cell) => cell.id)} expected=${item.expectedActiveCellIds}`)
  if (JSON.stringify(runtime.currentFrame?.retiredCellIds) !== JSON.stringify(item.expectedRetiredCellIds)) failures.push(`final retired=${runtime.currentFrame?.retiredCellIds} expected=${item.expectedRetiredCellIds}`)
  if (runtime.currentFrame?.unresolvedCount !== item.expectedFinalUnresolvedCount) failures.push(`final unresolved=${runtime.currentFrame?.unresolvedCount} expected=${item.expectedFinalUnresolvedCount}`)
  if (runtime.humanReviewRequired !== true) failures.push('humanReviewRequired must stay true')
  if (runtime.rulesValidated !== false) failures.push('rulesValidated must stay false')
  if (runtime.automaticGeometryAllowed !== false) failures.push('automaticGeometryAllowed must stay false')
  if (runtime.simulationOnly !== true) failures.push('simulationOnly must stay true')
  if (runtime.machineReady !== false) failures.push('machineReady must stay false')
  if (runtime.productionApproved !== false) failures.push('productionApproved must stay false')
  return failures
}

test('AI PROMPT KNOWLEDGE CORPUS 12 contains exactly 200 interactive sessions split 50/50/50/50', () => {
  assert.equal(AI_PROMPT_KNOWLEDGE_CORPUS_12.length, AI_PROMPT_KNOWLEDGE_CORPUS_12_EXPECTED_COUNTS.TOTAL)
  assert.equal(new Set(AI_PROMPT_KNOWLEDGE_CORPUS_12.map((item) => item.id)).size, AI_PROMPT_KNOWLEDGE_CORPUS_12.length)
  assert.equal(new Set(AI_PROMPT_KNOWLEDGE_CORPUS_12.map((item) => item.commands.join(' | '))).size, AI_PROMPT_KNOWLEDGE_CORPUS_12.length)
  for (const track of ['STEPWISE_BUILD_APPLY', 'STEPWISE_CORRECTION_APPLY', 'STEPWISE_UNDO_CONTINUATION', 'STEPWISE_REVIEW_RECOVERY'] as const) {
    assert.equal(AI_PROMPT_KNOWLEDGE_CORPUS_12.filter((item) => item.track === track).length, AI_PROMPT_KNOWLEDGE_CORPUS_12_EXPECTED_COUNTS[track])
  }
})

test('Corpus 12 evaluates all 200 sessions one command at a time without production authority', () => {
  const failures = AI_PROMPT_KNOWLEDGE_CORPUS_12.flatMap((item) => evaluate(item).map((failure) => `${item.id}: ${failure}\n  ${item.commands.join(' | ')}`))
  assert.deepEqual(failures, [], failures.join('\n'))
})

test('interactive runtime keeps stable Cell IDs through correction commands and continues after Undo', () => {
  for (const item of AI_PROMPT_KNOWLEDGE_CORPUS_12.filter((candidate) => candidate.track === 'STEPWISE_CORRECTION_APPLY' || candidate.track === 'STEPWISE_UNDO_CONTINUATION')) {
    let runtime = createFacadeFlowModuleInteractiveRuntime('', `${item.id}-stable`)
    for (const command of item.commands) runtime = applyFacadeFlowModuleInteractiveCommand(runtime, command)
    assert.deepEqual(runtime.currentFrame?.cells.map((cell) => cell.id), item.expectedActiveCellIds, item.id)
    assert.deepEqual(runtime.currentFrame?.retiredCellIds, item.expectedRetiredCellIds, item.id)
  }
})

test('review-required command does not mutate visible state and a later clear command still applies', () => {
  for (const item of AI_PROMPT_KNOWLEDGE_CORPUS_12.filter((candidate) => candidate.track === 'STEPWISE_REVIEW_RECOVERY')) {
    let runtime = createFacadeFlowModuleInteractiveRuntime('', `${item.id}-review`)
    item.commands.forEach((command, index) => {
      const previousKey = runtime.currentFrame?.visibleStateKey ?? null
      runtime = applyFacadeFlowModuleInteractiveCommand(runtime, command)
      if (item.expectedUnresolvedSteps.includes(index + 1)) {
        assert.equal(runtime.lastCommandStatus, 'REVIEW_REQUIRED', `${item.id} step=${index + 1}`)
        assert.equal(runtime.currentFrame?.visibleStateKey, previousKey, `${item.id} step=${index + 1}`)
      }
    })
    assert.equal(runtime.currentFrame?.unresolvedCount, item.expectedFinalUnresolvedCount, item.id)
  }
})

test('runtime supports explicit reload, clear and single-command module start without hidden mutation', () => {
  const source = 'Модул 1, 3 броя, каса 2100 x 1400 mm'
  assert.equal(isFacadeFlowInteractiveModuleRuntimeCandidate(source), true)
  assert.equal(isFacadeFlowInteractiveModuleRuntimeCandidate('Прозорец 1800 x 1400 mm'), false)

  let runtime = createFacadeFlowModuleInteractiveRuntime(source, 'runtime-controls')
  assert.equal(runtime.commands.length, 1)
  assert.deepEqual(runtime.currentFrame?.cells.map((cell) => cell.id), [1])

  const same = applyFacadeFlowModuleInteractiveCommand(runtime, '   ')
  assert.equal(same, runtime)

  runtime = applyFacadeFlowModuleInteractiveCommand(runtime, 'раздели клетка 1 вертикално на три равни части')
  assert.deepEqual(runtime.currentFrame?.cells.map((cell) => cell.id), [2, 3, 4])

  runtime = reloadFacadeFlowModuleInteractiveRuntime(runtime, source)
  assert.deepEqual(runtime.currentFrame?.cells.map((cell) => cell.id), [1])

  runtime = clearFacadeFlowModuleInteractiveRuntime(runtime)
  assert.equal(runtime.currentFrame, null)
  assert.equal(runtime.commands.length, 0)
  assert.equal(runtime.lastCommandStatus, 'EMPTY')
})

test('Corpus 12 is wired into AI workspace through an interactive Apply command panel with safety boundary', () => {
  const workspace = readFileSync('src/components/FacadeFlowAIWorkspace.tsx', 'utf8')
  const panel = readFileSync('src/components/ModuleCommandInteractiveRuntimePanel.tsx', 'utf8')
  const css = readFileSync('src/aiWorkspace.css', 'utf8')

  assert.match(workspace, /import \{ ModuleCommandInteractiveRuntimePanel \} from '\.\/ModuleCommandInteractiveRuntimePanel'/)
  assert.match(workspace, /<ModuleCommandInteractiveRuntimePanel sourceText=\{session\.job\.description\}/)
  assert.match(panel, /Следваща команда/)
  assert.match(panel, />Приложи</)
  assert.match(panel, /applyFacadeFlowModuleInteractiveCommand/)
  assert.match(panel, /Зареди описанието/)
  assert.match(panel, /Нова сесия/)
  assert.match(panel, /ИЗИСКВА УТОЧНЕНИЕ · БЕЗ ВИДИМА МУТАЦИЯ/)
  assert.match(panel, /АВТОМАТИЧНА ГЕОМЕТРИЯ: НЕ/)
  assert.match(css, /\.ff-module-interactive-runtime/)
  assert.doesNotMatch(panel, /productionApproved\s*=\s*true|machineReady\s*=\s*true/)
})
