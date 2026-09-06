import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  applyFacadeFlowOfferCompletenessReviewCommand,
  createFacadeFlowOfferCompletenessReviewRuntime,
} from '../src/aiPromptOfferCompletenessReviewRuntime'

test('Module step has a direct beginner action instead of sending the user to search for the assistant above', () => {
  const panel = readFileSync('src/components/OfferModulesInteractiveRuntimePanel.tsx', 'utf8')
  assert.match(panel, /＋ Създай първи модул/)
  assert.match(panel, /presetGuidedAction\('CREATE_MODULE'\)/)
  assert.match(panel, /воденият помощник ще се отвори директно/)
  assert.doesNotMatch(panel, /Няма създадени модули\. Използвай AI помощника отгоре/)
})

test('Zero-module summary is neutral and displays zero products instead of an error-like incomplete value', () => {
  const panel = readFileSync('src/components/OfferModulesInteractiveRuntimePanel.tsx', 'utf8')
  assert.match(panel, /runtime\.summary\.moduleCount === 0 \? 0/)
  assert.match(panel, /Още няма добавени модули/)
  assert.match(panel, /НЯМА ДОБАВЕНИ МОДУЛИ/)
})

test('Module step explains beginner terminology through a compact question-mark help control', () => {
  const panel = readFileSync('src/components/OfferModulesInteractiveRuntimePanel.tsx', 'utf8')
  assert.match(panel, /aria-label="Какво е модул\?"/)
  assert.match(panel, /Модул е отделен прозорец, врата или друго изделие в офертата/)
  assert.match(panel, /собствен размер, количество, разделение, клетки и отваряемост/)
})

test('Existing modules expose direct Open Edit Copy actions inside Step 3', () => {
  const panel = readFileSync('src/components/OfferModulesInteractiveRuntimePanel.tsx', 'utf8')
  assert.match(panel, /className="ff-module-list-actions"/)
  assert.match(panel, />Отвори<\/button>/)
  assert.match(panel, />✎ Редактирай<\/button>/)
  assert.match(panel, />Копирай<\/button>/)
  assert.match(panel, /＋ Добави модул/)
})

test('Direct module actions scroll the beginner back to the guided assistant instead of requiring manual navigation', () => {
  const panel = readFileSync('src/components/OfferModulesInteractiveRuntimePanel.tsx', 'utf8')
  assert.match(panel, /guidedBuilderRef/)
  assert.match(panel, /scrollIntoView\(\{ behavior: 'smooth', block: 'start' \}\)/)
  assert.match(panel, /presetModuleAction/)
})

test('Copy action can preset the exact source module without relying on whichever module was previously active', () => {
  const guided = readFileSync('src/components/GuidedAiCommandBuilder.tsx', 'utf8')
  const panel = readFileSync('src/components/OfferModulesInteractiveRuntimePanel.tsx', 'utf8')
  assert.match(guided, /sourceModuleNumber\?: number \| null/)
  assert.match(guided, /setSourceModuleNumber\(String\(preset\.sourceModuleNumber\)\)/)
  assert.match(panel, /sourceModuleNumber: action === 'COPY_MODULE' \? moduleNumber : null/)
})

test('Existing offer runtime behavior still creates a module with exact frame and quantity', () => {
  let runtime = createFacadeFlowOfferCompletenessReviewRuntime('Нова оферта.\nСистема PRELUDE 60.\nЦвят RAL 7016.\nДвоен стъклопакет.\nОбков ROTO NX.', 'hf08')
  runtime = applyFacadeFlowOfferCompletenessReviewCommand(runtime, 'Модул 1, 3 броя, каса 2100 х 1400 mm')
  const module = runtime.commercialRuntime.offerRuntime.multiModule.modules[0]
  assert.equal(module?.moduleNumber, 1)
  assert.equal(module?.runtime.currentFrame.frameWidthMm, 2100)
  assert.equal(module?.runtime.currentFrame.frameHeightMm, 1400)
  assert.equal(runtime.commercialRuntime.moduleQuantities[0]?.effectiveQuantity, 3)
})

test('Hotfix 08 remains human-review-only and does not introduce production authority', () => {
  const panel = readFileSync('src/components/OfferModulesInteractiveRuntimePanel.tsx', 'utf8')
  const guided = readFileSync('src/components/GuidedAiCommandBuilder.tsx', 'utf8')
  for (const forbidden of ['SEND_TO_MACHINE', 'MACHINE_READY = true', 'PRODUCTION_APPROVED = true']) {
    assert.equal(panel.includes(forbidden), false)
    assert.equal(guided.includes(forbidden), false)
  }
})
