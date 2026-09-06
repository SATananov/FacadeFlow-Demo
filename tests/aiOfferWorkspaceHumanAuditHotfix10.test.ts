import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { facadeFlowOfferCustomerReady } from '../src/aiOfferPartyDetails'
import {
  createFacadeFlowHumanAuditDemoState,
  FACADEFLOW_HUMAN_AUDIT_DEMO_COMMANDS,
  FACADEFLOW_HUMAN_AUDIT_DEMO_SOURCE,
} from '../src/aiOfferHumanAuditDemoState'

test('One-click QA demo builds the exact verified human-audit scenario', () => {
  const demo = createFacadeFlowHumanAuditDemoState('hf10-demo')
  const runtime = demo.runtime
  const moduleEntry = runtime.commercialRuntime.offerRuntime.multiModule.modules[0]
  const frame = moduleEntry?.runtime.currentFrame
  const review = runtime.moduleReviews[0]

  assert.equal(FACADEFLOW_HUMAN_AUDIT_DEMO_SOURCE.includes('PRELUDE 60'), true)
  assert.equal(FACADEFLOW_HUMAN_AUDIT_DEMO_COMMANDS.length, 5)
  assert.equal(demo.selectedModuleNumber, 1)
  assert.equal(demo.customer.name, 'Иван Иванов')
  assert.equal(facadeFlowOfferCustomerReady(demo.customer), true)

  assert.equal(frame?.frameWidthMm, 1200)
  assert.equal(frame?.frameHeightMm, 1400)
  assert.equal(runtime.commercialRuntime.moduleQuantities[0]?.effectiveQuantity, 3)
  assert.deepEqual(frame?.cells.map((cell) => [cell.id, cell.widthMm, cell.heightMm]), [
    [2, 400, 1400],
    [3, 400, 1400],
    [4, 400, 1400],
  ])
  assert.equal(frame?.cells.find((cell) => cell.id === 3)?.sashLabel, 'Двуосно · дясно')
  assert.deepEqual(review?.cellDispositions.map((entry) => [entry.cellId, entry.status]), [
    [2, 'FIXED'],
    [3, 'SASH'],
    [4, 'FIXED'],
  ])
  assert.equal(review?.status, 'READY_FOR_HUMAN_REVIEW')
  assert.equal(review?.confirmed, false)
})

test('QA demo never changes production safety boundaries', () => {
  const runtime = createFacadeFlowHumanAuditDemoState('hf10-safety').runtime
  assert.equal(runtime.automaticGeometryAllowed, false)
  assert.equal(runtime.rulesValidated, false)
  assert.equal(runtime.machineReady, false)
  assert.equal(runtime.productionApproved, false)
})

test('QA demo button is explicitly DEV-only and clearly marked as test data', () => {
  const panel = readFileSync('src/components/OfferModulesInteractiveRuntimePanel.tsx', 'utf8')
  assert.match(panel, /import\.meta\.env\.DEV/)
  assert.match(panel, /QA · САМО ЗА ТЕСТ/)
  assert.match(panel, /▶ Зареди QA демо/)
  assert.match(panel, /createFacadeFlowHumanAuditDemoState/)
  assert.match(panel, /finalReviewRef/)
  assert.match(panel, /scrollIntoView/)
})

test('Empty non-offer workspace exposes only the internal QA entry in DEV', () => {
  const panel = readFileSync('src/components/OfferModulesInteractiveRuntimePanel.tsx', 'utf8')
  assert.match(panel, /if \(!isOfferWorkspaceSource\(sourceText\) && multiModule\.modules\.length === 0\)/)
  assert.match(panel, /if \(!import\.meta\.env\.DEV\) return null/)
  assert.match(panel, /ff-offer-qa-entry/)
})

test('Hotfix 10 styles the QA entry distinctly from normal offer controls', () => {
  const css = readFileSync('src/aiWorkspace.css', 'utf8')
  assert.match(css, /\.ff-human-audit-demo-bar/)
  assert.match(css, /\.ff-offer-qa-entry/)
  assert.match(css, /border:1px dashed/)
})
