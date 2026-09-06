import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  AI_PROMPT_KNOWLEDGE_CORPUS_14,
  AI_PROMPT_KNOWLEDGE_CORPUS_14_EXPECTED_COUNTS,
} from '../src/aiPromptKnowledgeCorpus14'
import {
  applyFacadeFlowOfferModulesCommand,
  createFacadeFlowOfferModulesRuntime,
} from '../src/aiPromptOfferModulesRuntime'

function evaluate(commands: string[], id: string) {
  let runtime = createFacadeFlowOfferModulesRuntime('', id)
  for (const command of commands) runtime = applyFacadeFlowOfferModulesCommand(runtime, command)
  return runtime
}

function moduleSettings(runtime: ReturnType<typeof evaluate>, moduleNumber: number) {
  return runtime.moduleSettings.find((entry) => entry.moduleNumber === moduleNumber)
}

test('AI PROMPT KNOWLEDGE CORPUS 14 contains exactly 200 cases split 50/50/50/50', () => {
  assert.equal(AI_PROMPT_KNOWLEDGE_CORPUS_14.length, AI_PROMPT_KNOWLEDGE_CORPUS_14_EXPECTED_COUNTS.TOTAL)
  assert.equal(new Set(AI_PROMPT_KNOWLEDGE_CORPUS_14.map((item) => item.id)).size, 200)
  for (const [track, count] of Object.entries(AI_PROMPT_KNOWLEDGE_CORPUS_14_EXPECTED_COUNTS)) {
    if (track === 'TOTAL') continue
    assert.equal(AI_PROMPT_KNOWLEDGE_CORPUS_14.filter((item) => item.track === track).length, count)
  }
})

test('Corpus 14 evaluates all 200 offer/module sessions without production authority', () => {
  for (const item of AI_PROMPT_KNOWLEDGE_CORPUS_14) {
    const runtime = evaluate(item.commands, item.id)
    assert.deepEqual(runtime.multiModule.modules.map((entry) => entry.moduleNumber), item.expectedModuleNumbers, item.id)
    assert.deepEqual(runtime.events.filter((event) => event.status === 'REVIEW_REQUIRED').map((event) => event.step), item.expectedReviewSteps, item.id)
    assert.deepEqual(
      { system: runtime.defaults.system, finish: runtime.defaults.finish, glazing: runtime.defaults.glazing, hardware: runtime.defaults.hardware },
      item.expectedDefaults,
      `${item.id}: defaults`,
    )
    for (const [moduleNumber, expected] of Object.entries(item.expectedEffectiveByModule)) {
      const view = moduleSettings(runtime, Number(moduleNumber))
      assert.ok(view, `${item.id}: module ${moduleNumber} settings missing`)
      assert.deepEqual(
        { system: view.effective.system, finish: view.effective.finish, glazing: view.effective.glazing, hardware: view.effective.hardware },
        expected,
        `${item.id}: effective module ${moduleNumber}`,
      )
    }
    for (const [moduleNumber, fields] of Object.entries(item.expectedOverrideFieldsByModule)) {
      assert.deepEqual(moduleSettings(runtime, Number(moduleNumber))?.overrideFields ?? [], fields, `${item.id}: override fields module ${moduleNumber}`)
    }
    assert.equal(runtime.humanReviewRequired, true)
    assert.equal(runtime.rulesValidated, false)
    assert.equal(runtime.automaticGeometryAllowed, false)
    assert.equal(runtime.simulationOnly, true)
    assert.equal(runtime.machineReady, false)
    assert.equal(runtime.productionApproved, false)
  }
})

test('Corpus 14 offer-wide revisions update inherited values but never clobber explicit module overrides', () => {
  const runtime = evaluate([
    'Оферта за Иван Петров, система PRELUDE 60, цвят RAL 7016, двоен стъклопакет, обков ROTO NX',
    'Модул 1, 2 броя, каса 2100 x 1400 mm',
    'Модул 2, 3 броя, каса 1600 x 1400 mm',
    'Модул 2, цвят RAL 9016',
    'За цялата оферта, цвят RAL 9005',
    'За цялата оферта, стъкло: троен стъклопакет',
  ], 'pk14-revision')
  assert.equal(moduleSettings(runtime, 1)?.effective.finish, 'RAL 9005')
  assert.equal(moduleSettings(runtime, 2)?.effective.finish, 'RAL 9016')
  assert.equal(moduleSettings(runtime, 1)?.effective.glazing, 'троен стъклопакет')
  assert.equal(moduleSettings(runtime, 2)?.effective.glazing, 'троен стъклопакет')
  assert.deepEqual(moduleSettings(runtime, 2)?.overrideFields, ['finish'])
})

test('Corpus 14 copies module overrides into an independent copy and later changes remain local', () => {
  let runtime = evaluate([
    'Оферта за Иван Петров, система PRELUDE 60, цвят RAL 7016, двоен стъклопакет, обков ROTO NX',
    'Модул 1, 2 броя, каса 2100 x 1400 mm',
    'Модул 1, цвят RAL 9016',
    'Копирай модул 1 като модул 3, 4 броя',
  ], 'pk14-copy')
  assert.equal(moduleSettings(runtime, 1)?.effective.finish, 'RAL 9016')
  assert.equal(moduleSettings(runtime, 3)?.effective.finish, 'RAL 9016')
  runtime = applyFacadeFlowOfferModulesCommand(runtime, 'Модул 3, стъкло: троен стъклопакет')
  assert.equal(moduleSettings(runtime, 1)?.effective.glazing, 'двоен стъклопакет')
  assert.equal(moduleSettings(runtime, 3)?.effective.glazing, 'троен стъклопакет')
})

test('Corpus 14 refuses a setting change with no explicit offer/module scope', () => {
  let runtime = evaluate([
    'Оферта за Иван Петров, система PRELUDE 60, цвят RAL 7016, двоен стъклопакет, обков ROTO NX',
    'Модул 1, 2 броя, каса 2100 x 1400 mm',
  ], 'pk14-scope')
  const before = runtime.visibleStateKey
  runtime = applyFacadeFlowOfferModulesCommand(runtime, 'Смени цвета на RAL 9005')
  assert.equal(runtime.lastCommandStatus, 'REVIEW_REQUIRED')
  assert.equal(runtime.visibleStateKey, before)
  assert.equal(runtime.defaults.finish, 'RAL 7016')
})

test('Corpus 14 UI integration exposes offer defaults, module overrides and locked authority', () => {
  const workspace = readFileSync('src/components/FacadeFlowAIWorkspace.tsx', 'utf8')
  const panel = readFileSync('src/components/OfferModulesInteractiveRuntimePanel.tsx', 'utf8')
  assert.match(workspace, /OfferModulesInteractiveRuntimePanel/)
  assert.match(panel, /СТЪПКА 2 ОТ 4 · ОБЩИ НАСТРОЙКИ/)
  assert.match(panel, /НАСЛЕДЕНО/)
  assert.match(panel, /ЛОКАЛНА ПРОМЯНА/)
  assert.match(panel, /АВТОМАТИЧНА ГЕОМЕТРИЯ: НЕ/)
  assert.match(panel, /ПРАВИЛА ВАЛИДИРАНИ: НЕ/)
  assert.match(panel, /ГОТОВО ЗА МАШИНА: НЕ/)
  assert.doesNotMatch(panel, /productionApproved\s*=\s*true/)
})
