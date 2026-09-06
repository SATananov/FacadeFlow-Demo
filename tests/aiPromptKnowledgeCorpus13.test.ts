import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  AI_PROMPT_KNOWLEDGE_CORPUS_13,
  AI_PROMPT_KNOWLEDGE_CORPUS_13_EXPECTED_COUNTS,
} from '../src/aiPromptKnowledgeCorpus13'
import {
  applyFacadeFlowMultiModuleCommand,
  createFacadeFlowMultiModuleInteractiveRuntime,
} from '../src/aiPromptMultiModuleInteractiveRuntime'

function evaluate(commands: string[], id: string) {
  let runtime = createFacadeFlowMultiModuleInteractiveRuntime('', id)
  for (const command of commands) runtime = applyFacadeFlowMultiModuleCommand(runtime, command)
  return runtime
}

function activeCellIds(runtime: ReturnType<typeof evaluate>, moduleNumber: number) {
  const entry = runtime.modules.find((module) => module.moduleNumber === moduleNumber)
  return entry?.runtime.currentFrame?.cells.map((cell) => cell.id) ?? []
}

test('AI PROMPT KNOWLEDGE CORPUS 13 contains exactly 200 cases split 50/50/50/50', () => {
  assert.equal(AI_PROMPT_KNOWLEDGE_CORPUS_13.length, AI_PROMPT_KNOWLEDGE_CORPUS_13_EXPECTED_COUNTS.TOTAL)
  assert.equal(new Set(AI_PROMPT_KNOWLEDGE_CORPUS_13.map((item) => item.id)).size, 200)
  for (const [track, count] of Object.entries(AI_PROMPT_KNOWLEDGE_CORPUS_13_EXPECTED_COUNTS)) {
    if (track === 'TOTAL') continue
    assert.equal(AI_PROMPT_KNOWLEDGE_CORPUS_13.filter((item) => item.track === track).length, count)
  }
})

test('Corpus 13 evaluates all 200 multi-module sessions without production authority', () => {
  for (const item of AI_PROMPT_KNOWLEDGE_CORPUS_13) {
    const runtime = evaluate(item.commands, item.id)
    assert.deepEqual(runtime.modules.map((module) => module.moduleNumber), item.expectedModuleNumbers, item.id)
    assert.equal(runtime.activeModuleNumber, item.expectedActiveModuleNumber, item.id)
    assert.deepEqual(runtime.events.filter((event) => event.status === 'REVIEW_REQUIRED').map((event) => event.step), item.expectedReviewSteps, item.id)
    for (const [moduleNumber, ids] of Object.entries(item.expectedModuleCellIds)) {
      assert.deepEqual(activeCellIds(runtime, Number(moduleNumber)), ids, `${item.id}: module ${moduleNumber}`)
    }
    for (const [moduleNumber, quantity] of Object.entries(item.expectedModuleQuantities)) {
      const entry = runtime.modules.find((module) => module.moduleNumber === Number(moduleNumber))
      assert.equal(entry?.runtime.currentFrame?.quantity ?? null, quantity, `${item.id}: quantity module ${moduleNumber}`)
    }
    assert.equal(runtime.humanReviewRequired, true)
    assert.equal(runtime.rulesValidated, false)
    assert.equal(runtime.automaticGeometryAllowed, false)
    assert.equal(runtime.simulationOnly, true)
    assert.equal(runtime.machineReady, false)
    assert.equal(runtime.productionApproved, false)
  }
})

test('Corpus 13 preserves independent module state while switching back and forth', () => {
  const runtime = evaluate([
    'Модул 1, 3 броя, каса 2100 x 1400 mm',
    'Раздели клетка 1 вертикално на три равни части',
    'Модул 2, 2 броя, каса 1600 x 1400 mm',
    'Раздели клетка 1 вертикално на две равни части',
    'Върни се на модул 1',
    'Раздели клетка 2 хоризонтално на две равни части',
    'Отвори модул 2',
  ], 'pk13-preserve')
  assert.deepEqual(activeCellIds(runtime, 1), [3, 4, 5, 6])
  assert.deepEqual(activeCellIds(runtime, 2), [2, 3])
  assert.equal(runtime.activeModuleNumber, 2)
})

test('Corpus 13 copies a module into an independent runtime with quantity override', () => {
  let runtime = evaluate([
    'Модул 1, 2 броя, каса 2100 x 1400 mm',
    'Раздели клетка 1 вертикално на три равни части',
    'Копирай модул 1 като модул 3, 5 броя',
  ], 'pk13-copy')
  assert.deepEqual(activeCellIds(runtime, 1), [2, 3, 4])
  assert.deepEqual(activeCellIds(runtime, 3), [2, 3, 4])
  assert.equal(runtime.modules.find((module) => module.moduleNumber === 1)?.runtime.currentFrame?.quantity, 2)
  assert.equal(runtime.modules.find((module) => module.moduleNumber === 3)?.runtime.currentFrame?.quantity, 5)

  runtime = applyFacadeFlowMultiModuleCommand(runtime, 'Раздели клетка 2 хоризонтално на две равни части')
  assert.deepEqual(activeCellIds(runtime, 1), [2, 3, 4])
  assert.deepEqual(activeCellIds(runtime, 3), [3, 4, 5, 6])
})

test('Corpus 13 rejects missing, duplicate and ambiguous module targets without cross-module mutation', () => {
  let runtime = evaluate([
    'Модул 1, 2 броя, каса 1800 x 1400 mm',
    'Модул 2, 3 броя, каса 1500 x 1400 mm',
  ], 'pk13-safety')
  const before = runtime.visibleStateKey
  runtime = applyFacadeFlowMultiModuleCommand(runtime, 'Отвори модул 9')
  assert.equal(runtime.lastCommandStatus, 'REVIEW_REQUIRED')
  assert.equal(runtime.visibleStateKey, before)
  runtime = applyFacadeFlowMultiModuleCommand(runtime, 'Копирай модул 1 като модул 2')
  assert.equal(runtime.lastCommandStatus, 'REVIEW_REQUIRED')
  assert.equal(runtime.visibleStateKey, before)
  runtime = applyFacadeFlowMultiModuleCommand(runtime, 'Копирай този модул')
  assert.equal(runtime.lastCommandStatus, 'REVIEW_REQUIRED')
  assert.equal(runtime.visibleStateKey, before)
})

test('Corpus 13 UI integration exposes module tabs and keeps production authority visibly locked', () => {
  const workspace = readFileSync('src/components/FacadeFlowAIWorkspace.tsx', 'utf8')
  const panel = readFileSync('src/components/MultiModuleInteractiveRuntimePanel.tsx', 'utf8')
  assert.match(workspace, /MultiModuleInteractiveRuntimePanel/)
  assert.match(panel, /МОДУЛИ В ОФЕРТАТА/)
  assert.match(panel, /копие от/)
  assert.match(panel, /АВТОМАТИЧНА ГЕОМЕТРИЯ: НЕ/)
  assert.match(panel, /ПРАВИЛА ВАЛИДИРАНИ: НЕ/)
  assert.match(panel, /ГОТОВО ЗА МАШИНА: НЕ/)
  assert.doesNotMatch(panel, /productionApproved\s*=\s*true/)
})
