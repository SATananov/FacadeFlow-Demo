import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  applyFacadeFlowOfferCompletenessReviewCommand,
  createFacadeFlowOfferCompletenessReviewRuntime,
} from '../src/aiPromptOfferCompletenessReviewRuntime'

test('Final human review explains exactly what the user confirms and what confirmation does not mean', () => {
  const panel = readFileSync('src/components/OfferModulesInteractiveRuntimePanel.tsx', 'utf8')
  assert.match(panel, /КАКВО ПОТВЪРЖДАВАШ\?/)
  assert.match(panel, /размери, количество, настройки, разделение на клетките и отваряемост/)
  assert.match(panel, /не е проверка по технически правила, машинна готовност или разрешение за производство/)
  assert.match(panel, /ЧОВЕШКОТО ПОТВЪРЖДЕНИЕ Е САМО ЗА ОФЕРТНАТА ЧЕРНОВА/)
})

test('Final review presents customer and confirmed issuer before the confirmation action', () => {
  const panel = readFileSync('src/components/OfferModulesInteractiveRuntimePanel.tsx', 'utf8')
  assert.match(panel, /ВЪЗЛОЖИТЕЛ/)
  assert.match(panel, /customerDetails\.name/)
  assert.match(panel, /ИЗПЪЛНИТЕЛ/)
  assert.match(panel, /NADEZHDA_OFFER_ISSUER\.name/)
  assert.match(panel, /NADEZHDA_OFFER_ISSUER\.email/)
})

test('Confirmation wording is beginner-friendly and a direct correction route is available', () => {
  const panel = readFileSync('src/components/OfferModulesInteractiveRuntimePanel.tsx', 'utf8')
  assert.match(panel, /✓ Потвърждавам тази офертна чернова/)
  assert.match(panel, /✎ Върни се за корекция/)
  assert.match(panel, /returnToModuleCorrection/)
  assert.match(panel, /moduleStepRef/)
  assert.doesNotMatch(panel, />Потвърди след преглед</)
})

test('Confirmation is disabled when the required customer identity is not ready', () => {
  const panel = readFileSync('src/components/OfferModulesInteractiveRuntimePanel.tsx', 'utf8')
  assert.match(panel, /facadeFlowOfferCustomerReady\(customerDetails\)/)
  assert.match(panel, /Преди потвърждение попълни задължителните данни за възложителя/)
})

test('Cell review exposes the full sash mechanism and direction instead of only saying sash', () => {
  const panel = readFileSync('src/components/OfferModulesInteractiveRuntimePanel.tsx', 'utf8')
  assert.match(panel, /cellView\?\.sashLabel/)
  assert.match(panel, /КЛЕТКИ · КАКВО ТОЧНО ПОТВЪРЖДАВАШ/)

  let runtime = createFacadeFlowOfferCompletenessReviewRuntime(
    'Нова оферта.\nСистема PRELUDE 60.\nЦвят RAL 7016.\nДвоен стъклопакет.\nОбков ROTO NX.',
    'hf09',
  )
  runtime = applyFacadeFlowOfferCompletenessReviewCommand(runtime, 'Модул 1, 3 броя, каса 1200 х 1400 mm')
  runtime = applyFacadeFlowOfferCompletenessReviewCommand(runtime, 'Раздели Модул 1 вертикално на 3 равни части')
  runtime = applyFacadeFlowOfferCompletenessReviewCommand(runtime, 'Клетка 2 е фиксирана')
  runtime = applyFacadeFlowOfferCompletenessReviewCommand(runtime, 'Постави крило в клетка 3, отваряемо и падащо, дясно')
  runtime = applyFacadeFlowOfferCompletenessReviewCommand(runtime, 'Клетка 4 е фиксирана')

  const review = runtime.moduleReviews.find((entry) => entry.moduleNumber === 1)
  assert.equal(review?.status, 'READY_FOR_HUMAN_REVIEW')
  assert.deepEqual(review?.cellDispositions.map((entry) => [entry.cellId, entry.status]), [
    [2, 'FIXED'],
    [3, 'SASH'],
    [4, 'FIXED'],
  ])

  const frame = runtime.commercialRuntime.offerRuntime.multiModule.modules[0]?.runtime.currentFrame
  assert.equal(frame?.cells.find((cell) => cell.id === 3)?.sashLabel, 'Двуосно · дясно')
})

test('Human confirmation remains a draft-level action and does not change production safety boundaries', () => {
  let runtime = createFacadeFlowOfferCompletenessReviewRuntime(
    'Нова оферта.\nСистема PRELUDE 60.\nЦвят RAL 7016.\nДвоен стъклопакет.\nОбков ROTO NX.',
    'hf09-confirm',
  )
  runtime = applyFacadeFlowOfferCompletenessReviewCommand(runtime, 'Модул 1, 3 броя, каса 1200 х 1400 mm')
  runtime = applyFacadeFlowOfferCompletenessReviewCommand(runtime, 'Раздели Модул 1 вертикално на 3 равни части')
  runtime = applyFacadeFlowOfferCompletenessReviewCommand(runtime, 'Клетка 2 е фиксирана')
  runtime = applyFacadeFlowOfferCompletenessReviewCommand(runtime, 'Постави крило в клетка 3, отваряемо и падащо, дясно')
  runtime = applyFacadeFlowOfferCompletenessReviewCommand(runtime, 'Клетка 4 е фиксирана')
  runtime = applyFacadeFlowOfferCompletenessReviewCommand(runtime, 'Потвърди Модул 1')

  assert.equal(runtime.moduleReviews[0]?.status, 'HUMAN_CONFIRMED')
  assert.equal(runtime.rulesValidated, false)
  assert.equal(runtime.automaticGeometryAllowed, false)
  assert.equal(runtime.machineReady, false)
  assert.equal(runtime.productionApproved, false)
})

test('Hotfix 09 styles the final review as a clear beginner decision point', () => {
  const css = readFileSync('src/aiWorkspace.css', 'utf8')
  assert.match(css, /\.ff-final-review-parties/)
  assert.match(css, /\.ff-final-review-explainer/)
  assert.match(css, /\.ff-final-review-actions/)
  assert.match(css, /\.ff-final-review-safety-note/)
})

test('Hotfix 09 introduces no machine or production authority', () => {
  const panel = readFileSync('src/components/OfferModulesInteractiveRuntimePanel.tsx', 'utf8')
  for (const forbidden of ['MACHINE_READY = true', 'PRODUCTION_APPROVED = true', 'SEND_TO_MACHINE']) {
    assert.equal(panel.includes(forbidden), false)
  }
})
