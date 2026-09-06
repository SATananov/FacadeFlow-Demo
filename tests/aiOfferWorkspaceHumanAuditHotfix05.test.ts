import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  buildFacadeFlowGuidedCommand,
  guidedFacadeFlowActionAvailability,
  guidedFacadeFlowCellOptions,
} from '../src/aiGuidedCommandBuilder'
import {
  applyFacadeFlowOfferCompletenessReviewCommand,
  createFacadeFlowOfferCompletenessReviewRuntime,
} from '../src/aiPromptOfferCompletenessReviewRuntime'

function preparedModule() {
  let runtime = createFacadeFlowOfferCompletenessReviewRuntime('Нова оферта. Система PRELUDE 60. Цвят RAL 7016. Двоен стъклопакет. Обков ROTO NX.')
  runtime = applyFacadeFlowOfferCompletenessReviewCommand(runtime, 'Модул 1, 3 броя, каса 2100 х 1400 mm')
  runtime = applyFacadeFlowOfferCompletenessReviewCommand(runtime, 'Раздели Модул 1 вертикално на 3 равни части')
  runtime = applyFacadeFlowOfferCompletenessReviewCommand(runtime, 'Раздели клетка 3 хоризонтално на 2 равни части')
  runtime = applyFacadeFlowOfferCompletenessReviewCommand(runtime, 'Постави крило в клетка 5, отваряемо и падащо, дясно')
  return runtime
}

test('Selection-first guided commands still produce deterministic Bulgarian runtime commands', () => {
  assert.equal(buildFacadeFlowGuidedCommand({ action: 'CREATE_MODULE', moduleNumber: 1, widthMm: 2100, heightMm: 1400, quantity: 3 }).command, 'Модул 1, 3 броя, каса 2100 х 1400 mm')
  assert.equal(buildFacadeFlowGuidedCommand({ action: 'SPLIT_CELL', cellId: 3, orientation: 'HORIZONTAL', parts: 2 }).command, 'Раздели клетка 3 хоризонтално на 2 равни части')
  assert.equal(buildFacadeFlowGuidedCommand({ action: 'ADD_SASH', cellId: 5, opening: 'TILT_TURN', direction: 'RIGHT' }).command, 'Постави крило в клетка 5, отваряемо и падащо, дясно')
})

test('Context menus expose only current active cells and preserve unresolved cells for beginner guidance', () => {
  const context = {
    activeModuleNumber: 1,
    moduleNumbers: [1],
    cells: [
      { id: 2, hasSash: false },
      { id: 4, hasSash: false },
      { id: 5, hasSash: true },
      { id: 6, hasSash: false },
    ],
    dividerIds: [1, 2, 3],
    unresolvedCellIds: [2, 4, 6],
  }
  const cells = guidedFacadeFlowCellOptions(context)
  assert.deepEqual(cells.all.map((cell) => cell.id), [2, 4, 5, 6])
  assert.deepEqual(cells.withoutSash.map((cell) => cell.id), [2, 4, 6])
  assert.equal(cells.all.some((cell) => cell.id === 3), false)
  const availability = guidedFacadeFlowActionAvailability(context)
  assert.equal(availability.find((entry) => entry.action === 'SET_FIXED')?.enabled, true)
  assert.equal(availability.find((entry) => entry.action === 'ADD_SASH')?.enabled, true)
})

test('Per-cell completeness remains strict while the guided UI recommends resolving cells 2, 4 and 6', () => {
  const runtime = preparedModule()
  const review = runtime.moduleReviews[0]
  assert.equal(review?.status, 'INCOMPLETE')
  assert.deepEqual(review?.unresolvedCellIds, [2, 4, 6])
  assert.equal(runtime.rulesValidated, false)
  assert.equal(runtime.machineReady, false)
  assert.equal(runtime.productionApproved, false)
})

test('Guided AI is selection-first: module, dimensions, quantity, cells, openings and direction use selects with manual fallback only where necessary', () => {
  const guided = readFileSync('src/components/GuidedAiCommandBuilder.tsx', 'utf8')
  assert.match(guided, /AI ПОМОЩНИК · ВОДЕН РЕЖИМ/)
  assert.match(guided, /ПРЕПОРЪЧАНИ СЛЕДВАЩИ ДЕЙСТВИЯ/)
  assert.match(guided, /Номер на новия модул/)
  assert.match(guided, /SelectNumberOrCustom/)
  assert.match(guided, /Ширина \(mm\)/)
  assert.match(guided, /Височина \(mm\)/)
  assert.match(guided, /Количество/)
  assert.match(guided, /Начин на отваряне/)
  assert.match(guided, /Посока/)
  assert.match(guided, /Въведи стойност, която знам/)
  assert.match(guided, /ff-guided-help-button/)
  assert.match(guided, /Покажи помощ/)
  assert.match(guided, /Приложи избора/)
})

test('Free text is demoted to an explicit advanced mode instead of being the primary beginner interaction', () => {
  const panel = readFileSync('src/components/OfferModulesInteractiveRuntimePanel.tsx', 'utf8')
  assert.match(panel, /<details className="ff-free-command-details">/)
  assert.match(panel, /Разширен режим: свободно писане/)
  assert.match(panel, /За начинаещи препоръчваме водения AI помощник/)
  assert.match(panel, /unresolvedCellIds: selectedReview\?\.unresolvedCellIds/)
})

test('Primary Offer Workspace user-facing copy is Bulgarian and old mixed-language labels are removed', () => {
  const panel = readFileSync('src/components/OfferModulesInteractiveRuntimePanel.tsx', 'utf8')
  const guided = readFileSync('src/components/GuidedAiCommandBuilder.tsx', 'utf8')
  const workspace = readFileSync('src/components/FacadeFlowAIWorkspace.tsx', 'utf8')
  for (const stale of ['OFFER WORKSPACE · CORPUS 14–16 · HUMAN REVIEW ONLY', '>HUMAN CONFIRMED<', '>Human Confirm<', '>FIXED<', 'ACTIVE CELL ID', 'RETIRED CELL ID', 'PRODUCTION APPROVED: NO']) {
    assert.equal(panel.includes(stale), false, `stale visible label: ${stale}`)
  }
  assert.equal(guided.includes('GUIDED AI · ВОДЕН РЕЖИМ'), false)
  assert.equal(guided.includes('Приложи guided команда'), false)
  assert.equal(workspace.includes('Offer Workspace draft'), false)
  assert.equal(workspace.includes('production output'), false)
})

test('Help and visual hierarchy styles exist and machine/production actions remain unavailable', () => {
  const css = readFileSync('src/aiWorkspace.css', 'utf8')
  const source = readFileSync('src/aiGuidedCommandBuilder.ts', 'utf8')
  assert.match(css, /\.ff-guided-ai-steps/)
  assert.match(css, /\.ff-guided-ai-recommendations/)
  assert.match(css, /\.ff-guided-help-button/)
  assert.match(css, /\.ff-guided-help-popover/)
  assert.match(css, /\.ff-free-command-details/)
  assert.doesNotMatch(source, /MACHINE_READY|SEND_TO_MACHINE|EXPORT_MACHINE/)
})
