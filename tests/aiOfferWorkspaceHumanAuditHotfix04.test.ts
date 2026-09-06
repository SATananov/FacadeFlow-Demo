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
  let runtime = createFacadeFlowOfferCompletenessReviewRuntime('Оферта за Human Audit, система PRELUDE 60, цвят RAL 7016, двоен стъклопакет, обков ROTO NX')
  runtime = applyFacadeFlowOfferCompletenessReviewCommand(runtime, 'Модул 1, 3 броя, каса 2100 х 1400 mm')
  runtime = applyFacadeFlowOfferCompletenessReviewCommand(runtime, 'Раздели Модул 1 вертикално на 3 равни части')
  runtime = applyFacadeFlowOfferCompletenessReviewCommand(runtime, 'Раздели клетка 3 хоризонтално на 2 равни части')
  runtime = applyFacadeFlowOfferCompletenessReviewCommand(runtime, 'Постави крило в клетка 5, отваряемо и падащо, дясно.')
  return runtime
}

test('Per-cell completeness keeps the module INCOMPLETE while active cells 2, 4 and 6 are unresolved', () => {
  const runtime = preparedModule()
  const review = runtime.moduleReviews[0]
  assert.equal(review?.status, 'INCOMPLETE')
  assert.deepEqual(review?.unresolvedCellIds, [2, 4, 6])
  assert.deepEqual(review?.cellDispositions.map((entry) => [entry.cellId, entry.status]), [
    [2, 'UNRESOLVED'],
    [4, 'UNRESOLVED'],
    [5, 'SASH'],
    [6, 'UNRESOLVED'],
  ])
  assert.equal(review?.checks.find((entry) => entry.field === 'openingDisposition')?.status, 'MISSING')
})

test('Explicit multi-cell FIX command resolves only the named active cells and unlocks Human Review, never production', () => {
  let runtime = preparedModule()
  runtime = applyFacadeFlowOfferCompletenessReviewCommand(runtime, 'Клетки 2, 4 и 6 са фиксирани')
  const review = runtime.moduleReviews[0]
  assert.equal(runtime.lastCommandStatus, 'APPLIED')
  assert.equal(review?.status, 'READY_FOR_HUMAN_REVIEW')
  assert.deepEqual(review?.unresolvedCellIds, [])
  assert.deepEqual(review?.cellDispositions.map((entry) => [entry.cellId, entry.status]), [
    [2, 'FIXED'],
    [4, 'FIXED'],
    [5, 'SASH'],
    [6, 'FIXED'],
  ])
  assert.equal(runtime.rulesValidated, false)
  assert.equal(runtime.machineReady, false)
  assert.equal(runtime.productionApproved, false)
})

test('A cell can be changed from explicit FIX to a sash later in the same correction session', () => {
  let runtime = preparedModule()
  runtime = applyFacadeFlowOfferCompletenessReviewCommand(runtime, 'Клетка 2 е фиксирана')
  runtime = applyFacadeFlowOfferCompletenessReviewCommand(runtime, 'Постави крило в клетка 2, отваряемо, ляво')
  const module = runtime.commercialRuntime.offerRuntime.multiModule.modules[0]
  assert.equal(runtime.lastCommandStatus, 'APPLIED')
  assert.equal(module?.runtime.currentFrame?.cells.find((cell) => cell.id === 2)?.sashLabel, 'Едноосно · ляво')
  assert.equal(runtime.moduleReviews[0]?.cellDispositions.find((entry) => entry.cellId === 2)?.status, 'SASH')
})

test('Guided builder exposes only current Cell IDs for fixed/sash actions and never retired Cell 3', () => {
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
  }
  const cells = guidedFacadeFlowCellOptions(context)
  assert.deepEqual(cells.all.map((entry) => entry.id), [2, 4, 5, 6])
  assert.deepEqual(cells.withoutSash.map((entry) => entry.id), [2, 4, 6])
  assert.deepEqual(cells.withSash.map((entry) => entry.id), [5])
  assert.equal(cells.all.some((entry) => entry.id === 3), false)
  const availability = guidedFacadeFlowActionAvailability(context)
  assert.equal(availability.find((entry) => entry.action === 'SET_FIXED')?.enabled, true)
  assert.equal(availability.find((entry) => entry.action === 'CHANGE_SASH')?.enabled, true)
})

test('Guided command builder creates deterministic commands for common beginner workflows', () => {
  assert.equal(buildFacadeFlowGuidedCommand({ action: 'CREATE_MODULE', moduleNumber: 2, widthMm: 1200, heightMm: 1500, quantity: 4 }).command, 'Модул 2, 4 броя, каса 1200 х 1500 mm')
  assert.equal(buildFacadeFlowGuidedCommand({ action: 'SPLIT_CELL', cellId: 4, orientation: 'HORIZONTAL', parts: 2 }).command, 'Раздели клетка 4 хоризонтално на 2 равни части')
  assert.equal(buildFacadeFlowGuidedCommand({ action: 'SET_FIXED', cellId: 6 }).command, 'Клетка 6 е фиксирана')
  assert.equal(buildFacadeFlowGuidedCommand({ action: 'ADD_SASH', cellId: 2, opening: 'TILT_TURN', direction: 'RIGHT' }).command, 'Постави крило в клетка 2, отваряемо и падащо, дясно')
  assert.equal(buildFacadeFlowGuidedCommand({ action: 'SET_OFFER_SETTING', settingField: 'finish', settingValue: 'RAL 9005' }).command, 'За цялата оферта Цвят RAL 9005')
  assert.equal(buildFacadeFlowGuidedCommand({ action: 'SET_MODULE_SETTING', moduleNumber: 3, settingField: 'finish', settingValue: 'RAL 9016' }).command, 'Модул 3, Цвят RAL 9016')
})

test('Guided UI is mounted next to free text and Human Review exposes per-cell quick actions', () => {
  const panel = readFileSync('src/components/OfferModulesInteractiveRuntimePanel.tsx', 'utf8')
  const guided = readFileSync('src/components/GuidedAiCommandBuilder.tsx', 'utf8')
  const css = readFileSync('src/aiWorkspace.css', 'utf8')
  assert.match(panel, /GuidedAiCommandBuilder/)
  assert.match(panel, /cellDispositions/)
  assert.match(panel, /presetGuidedAction\('SET_FIXED'/)
  assert.match(panel, /presetGuidedAction\('ADD_SASH'/)
  assert.match(guided, /Какво искаш да направиш/)
  assert.match(guided, /Прегледай като текст/)
  assert.match(guided, /Приложи избора/)
  assert.match(css, /\.ff-guided-ai-builder/)
  assert.match(css, /\.ff-cell-disposition-review/)
})

test('Hotfix 04 never offers or enables machine/production actions', () => {
  const source = readFileSync('src/aiGuidedCommandBuilder.ts', 'utf8')
  assert.doesNotMatch(source, /MACHINE_READY|PRODUCTION_APPROVED|SEND_TO_MACHINE|EXPORT_MACHINE/)
  const runtime = preparedModule()
  assert.equal(runtime.rulesValidated, false)
  assert.equal(runtime.machineReady, false)
  assert.equal(runtime.productionApproved, false)
  assert.equal(runtime.automaticGeometryAllowed, false)
})
