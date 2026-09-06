import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  applyFacadeFlowOfferCompletenessReviewCommand,
  createFacadeFlowOfferCompletenessReviewRuntime,
} from '../src/aiPromptOfferCompletenessReviewRuntime'

function seededOffer() {
  return createFacadeFlowOfferCompletenessReviewRuntime('Оферта за Human Audit, система PRELUDE 60, цвят RAL 7016, двоен стъклопакет, обков ROTO NX')
}

for (const separator of ['x', 'х', '×'] as const) {
  test(`Combined offer command routes frame geometry with ${separator} separator`, () => {
    let runtime = seededOffer()
    runtime = applyFacadeFlowOfferCompletenessReviewCommand(runtime, `Модул 1, 3 броя, каса 2100 ${separator} 1400 mm`)

    const module = runtime.commercialRuntime.offerRuntime.multiModule.modules.find((entry) => entry.moduleNumber === 1)
    const frame = module?.runtime.currentFrame
    const quantity = runtime.commercialRuntime.moduleQuantities.find((entry) => entry.moduleNumber === 1)

    assert.equal(runtime.lastCommandStatus, 'APPLIED')
    assert.equal(quantity?.effectiveQuantity, 3)
    assert.equal(frame?.frameWidthMm, 2100)
    assert.equal(frame?.frameHeightMm, 1400)
    assert.equal(frame?.cells.length, 1)
    assert.equal(frame?.cells[0]?.id, 1)
    assert.equal(frame?.cells[0]?.widthMm, 2100)
    assert.equal(frame?.cells[0]?.heightMm, 1400)
  })
}

test('Offer module panel does not render a blank drawing stage when frame geometry is missing', () => {
  const panel = readFileSync('src/components/OfferModulesInteractiveRuntimePanel.tsx', 'utf8')
  assert.match(panel, /const hasFrameGeometry = Boolean\(frame\?\.frameWidthMm && frame\.frameHeightMm && frame\.cells\.length > 0\)/)
  assert.match(panel, /\{hasFrameGeometry && frame \? <div className="ff-offer-module-stage-wrap">/)
})

test('Offer module selector forces dark high-contrast colors over global light button styles', () => {
  const css = readFileSync('src/aiWorkspace.css', 'utf8')
  assert.match(css, /\.ff-ai-workspace \.ff-offer-modules-tabs>button\{background:#0a2b22!important;color:#e6f4ed!important;/)
  assert.match(css, /\.ff-ai-workspace \.ff-offer-modules-tabs>button\.active\{background:#123f31!important;color:#fff!important;/)
  assert.match(css, /\.ff-ai-workspace \.ff-offer-modules-tabs>button strong\{color:#f1faf5!important\}/)
})

test('Hotfix 02 keeps production authority locked', () => {
  let runtime = seededOffer()
  runtime = applyFacadeFlowOfferCompletenessReviewCommand(runtime, 'Модул 1, 3 броя, каса 2100 х 1400 mm')
  assert.equal(runtime.rulesValidated, false)
  assert.equal(runtime.machineReady, false)
  assert.equal(runtime.productionApproved, false)
  assert.equal(runtime.automaticGeometryAllowed, false)
})
