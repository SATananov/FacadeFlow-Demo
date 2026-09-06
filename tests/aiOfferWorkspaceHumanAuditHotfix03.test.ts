import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  applyFacadeFlowOfferCompletenessReviewCommand,
  createFacadeFlowOfferCompletenessReviewRuntime,
} from '../src/aiPromptOfferCompletenessReviewRuntime'
import { buildFacadeFlowOfferWorkspaceUiSnapshot } from '../src/aiOfferWorkspaceUiSnapshot'

function preparedModule() {
  let runtime = createFacadeFlowOfferCompletenessReviewRuntime('Оферта за Human Audit, система PRELUDE 60, цвят RAL 7016, двоен стъклопакет, обков ROTO NX')
  runtime = applyFacadeFlowOfferCompletenessReviewCommand(runtime, 'Модул 1, 3 броя, каса 2100 х 1400 mm')
  runtime = applyFacadeFlowOfferCompletenessReviewCommand(runtime, 'Раздели Модул 1 вертикално на 3 равни части')
  runtime = applyFacadeFlowOfferCompletenessReviewCommand(runtime, 'Раздели клетка 3 хоризонтално на 2 равни части')
  return runtime
}

test('Natural Bulgarian tilt-turn wording applies a right sash to the requested stable Cell ID', () => {
  let runtime = preparedModule()
  runtime = applyFacadeFlowOfferCompletenessReviewCommand(runtime, 'Постави крило в клетка 5, отваряемо и падащо, дясно.')
  const module = runtime.commercialRuntime.offerRuntime.multiModule.modules.find((entry) => entry.moduleNumber === 1)
  const frame = module?.runtime.currentFrame
  const cell5 = frame?.cells.find((cell) => cell.id === 5)
  assert.equal(runtime.lastCommandStatus, 'APPLIED')
  assert.equal(cell5?.hasSash, true)
  assert.equal(cell5?.sashLabel, 'Двуосно · дясно')
  assert.deepEqual(frame?.cells.map((cell) => cell.id), [2, 4, 5, 6])
  assert.equal(frame?.cells.find((cell) => cell.id === 6)?.hasSash, false)
})

test('Opening completeness remains incomplete until every active cell has an explicit disposition', () => {
  let runtime = preparedModule()
  runtime = applyFacadeFlowOfferCompletenessReviewCommand(runtime, 'Постави крило в клетка 5, отваряемо и падащо, дясно.')
  const review = runtime.moduleReviews.find((entry) => entry.moduleNumber === 1)
  const opening = review?.checks.find((entry) => entry.field === 'openingDisposition')
  const geometry = review?.checks.find((entry) => entry.field === 'geometry')
  assert.equal(opening?.status, 'MISSING')
  assert.match(opening?.reason ?? '', /2, 4, 6/)
  assert.deepEqual(review?.unresolvedCellIds, [2, 4, 6])
  assert.equal(geometry?.status, 'COMPLETE')
})

test('Common Bulgarian opening synonyms share the same deterministic tilt-turn semantics', () => {
  for (const wording of ['осово-откидно, дясно', 'отваряемо + откидно, дясно', 'падащо и отваряемо, дясно']) {
    let runtime = preparedModule()
    runtime = applyFacadeFlowOfferCompletenessReviewCommand(runtime, `Постави крило в клетка 5, ${wording}.`)
    const frame = runtime.commercialRuntime.offerRuntime.multiModule.modules[0]?.runtime.currentFrame
    assert.equal(runtime.lastCommandStatus, 'APPLIED', wording)
    assert.equal(frame?.cells.find((cell) => cell.id === 5)?.sashLabel, 'Двуосно · дясно', wording)
  }
})

test('Offer workspace UI snapshot exposes frame, quantity and sash state for the legacy review rail', () => {
  let runtime = preparedModule()
  runtime = applyFacadeFlowOfferCompletenessReviewCommand(runtime, 'Постави крило в клетка 5, отваряемо и падащо, дясно.')
  const snapshot = buildFacadeFlowOfferWorkspaceUiSnapshot(runtime, 1)
  assert.equal(snapshot?.widthMm, 2100)
  assert.equal(snapshot?.heightMm, 1400)
  assert.equal(snapshot?.quantity, 3)
  assert.equal(snapshot?.system, 'PRELUDE 60')
  assert.equal(snapshot?.finish, 'RAL 7016')
  assert.equal(snapshot?.glazing?.toLocaleLowerCase('bg'), 'двоен стъклопакет')
  assert.match(snapshot?.openingSummary ?? '', /Клетка 5: Двуосно · дясно/)
})

test('Workspace wires the live Offer Workspace snapshot into the right review column', () => {
  const workspace = readFileSync('src/components/FacadeFlowAIWorkspace.tsx', 'utf8')
  const panel = readFileSync('src/components/OfferModulesInteractiveRuntimePanel.tsx', 'utf8')
  assert.match(workspace, /offerWorkspacePreview/)
  assert.match(workspace, /onWorkspaceSnapshot=\{setOfferWorkspacePreview\}/)
  assert.match(workspace, /Каса \/ размер/)
  assert.match(workspace, /ТЕКУЩА ОФЕРТНА ЧЕРНОВА/)
  assert.match(panel, /buildFacadeFlowOfferWorkspaceUiSnapshot/)
  assert.match(panel, /onWorkspaceSnapshot/)
})

test('Hotfix 03 keeps production authority locked', () => {
  let runtime = preparedModule()
  runtime = applyFacadeFlowOfferCompletenessReviewCommand(runtime, 'Постави крило в клетка 5, отваряемо и падащо, дясно.')
  assert.equal(runtime.rulesValidated, false)
  assert.equal(runtime.machineReady, false)
  assert.equal(runtime.productionApproved, false)
  assert.equal(runtime.automaticGeometryAllowed, false)
})
