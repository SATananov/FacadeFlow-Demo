import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  applyFacadeFlowOfferCompletenessReviewCommand,
  createFacadeFlowOfferCompletenessReviewRuntime,
} from '../src/aiPromptOfferCompletenessReviewRuntime'
import { isFacadeFlowOfferModulesRuntimeCandidate } from '../src/aiPromptOfferModulesRuntime'

test('Human Audit hotfix exposes offer workspace before the first module exists', () => {
  assert.equal(isFacadeFlowOfferModulesRuntimeCandidate('Нова оферта. Система PRELUDE 60.'), true)
  const panel = readFileSync('src/components/OfferModulesInteractiveRuntimePanel.tsx', 'utf8')
  assert.match(panel, /РАБОТНА ЗОНА ЗА ОФЕРТА · AI ПОМОЩНИК/)
  assert.match(panel, /СТЪПКА 2 ОТ 4 · ОБЩИ НАСТРОЙКИ/)
  assert.match(panel, /Разширен режим: свободно писане/)
})

test('Line-separated offer defaults inherit offer scope before modules are created', () => {
  const runtime = createFacadeFlowOfferCompletenessReviewRuntime(`Нова оферта.\nСистема PRELUDE 60.\nЦвят RAL 7016.\nДвоен стъклопакет.\nОбков ROTO NX.`)
  const defaults = runtime.commercialRuntime.offerRuntime.defaults
  assert.equal(defaults.system, 'PRELUDE 60')
  assert.equal(defaults.finish, 'RAL 7016')
  assert.equal(defaults.glazing, 'Двоен стъклопакет')
  assert.equal(defaults.hardware, 'ROTO NX')
  assert.equal(runtime.commercialRuntime.offerRuntime.multiModule.modules.length, 0)
})

test('One shared top-level runtime carries offer defaults into a newly created module', () => {
  let runtime = createFacadeFlowOfferCompletenessReviewRuntime(`Нова оферта.\nСистема PRELUDE 60.\nЦвят RAL 7016.\nДвоен стъклопакет.\nОбков ROTO NX.`)
  runtime = applyFacadeFlowOfferCompletenessReviewCommand(runtime, 'Модул 1, 3 броя, каса 2100 x 1400 mm')
  const offer = runtime.commercialRuntime.offerRuntime
  const settings = offer.moduleSettings.find((entry) => entry.moduleNumber === 1)
  const quantity = runtime.commercialRuntime.moduleQuantities.find((entry) => entry.moduleNumber === 1)
  assert.equal(offer.multiModule.modules.length, 1)
  assert.equal(settings?.effective.system, 'PRELUDE 60')
  assert.equal(settings?.effective.finish, 'RAL 7016')
  assert.equal(settings?.effective.glazing, 'Двоен стъклопакет')
  assert.equal(settings?.effective.hardware, 'ROTO NX')
  assert.equal(quantity?.effectiveQuantity, 3)
})

test('Scope safety remains strict after modules exist', () => {
  let runtime = createFacadeFlowOfferCompletenessReviewRuntime('Оферта за Тест, система PRELUDE 60, цвят RAL 7016, двоен стъклопакет, обков ROTO NX | Модул 1, 2 броя, каса 1500 x 1400 mm, фикс')
  const before = runtime.visibleStateKey
  runtime = applyFacadeFlowOfferCompletenessReviewCommand(runtime, 'Смени цвета на RAL 9005')
  assert.equal(runtime.lastCommandStatus, 'REVIEW_REQUIRED')
  assert.equal(runtime.visibleStateKey, before)
})

test('Workspace mounts one shared offer workspace instead of three independent offer panels', () => {
  const workspace = readFileSync('src/components/FacadeFlowAIWorkspace.tsx', 'utf8')
  assert.match(workspace, /OfferModulesInteractiveRuntimePanel/)
  assert.doesNotMatch(workspace, /OfferCommercialSummaryRuntimePanel/)
  assert.doesNotMatch(workspace, /OfferCompletenessReviewGatePanel/)
})

test('Unified offer workspace keeps production authority locked', () => {
  const panel = readFileSync('src/components/OfferModulesInteractiveRuntimePanel.tsx', 'utf8')
  assert.match(panel, /ПРАВИЛА ВАЛИДИРАНИ: НЕ/)
  assert.match(panel, /ГОТОВО ЗА МАШИНА: НЕ/)
  assert.match(panel, /ОДОБРЕНО ЗА ПРОИЗВОДСТВО: НЕ/)
  assert.doesNotMatch(panel, /productionApproved\s*=\s*true/)
})
