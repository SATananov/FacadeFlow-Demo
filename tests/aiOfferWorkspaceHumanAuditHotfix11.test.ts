import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  calculateFacadeFlowOfferModulePreviewMaxWidthPx,
  FACADEFLOW_OFFER_MODULE_PREVIEW_MAX_HEIGHT_PX,
} from '../src/aiOfferModulePreviewSizing'

test('Hotfix 11 caps module preview height while preserving the real frame aspect ratio', () => {
  assert.equal(FACADEFLOW_OFFER_MODULE_PREVIEW_MAX_HEIGHT_PX, 760)
  assert.equal(calculateFacadeFlowOfferModulePreviewMaxWidthPx(1200, 1400), 651)
  assert.equal(calculateFacadeFlowOfferModulePreviewMaxWidthPx(2400, 1200), 1520)
  assert.equal(calculateFacadeFlowOfferModulePreviewMaxWidthPx(900, 2100), 326)
})

test('Invalid frame dimensions do not create an unsafe preview width', () => {
  assert.equal(calculateFacadeFlowOfferModulePreviewMaxWidthPx(null, 1400), null)
  assert.equal(calculateFacadeFlowOfferModulePreviewMaxWidthPx(1200, 0), null)
  assert.equal(calculateFacadeFlowOfferModulePreviewMaxWidthPx(Number.NaN, 1400), null)
})

test('Offer module stage uses the responsive preview cap instead of expanding with the full zoomed-out workspace width', () => {
  const panel = readFileSync('src/components/OfferModulesInteractiveRuntimePanel.tsx', 'utf8')
  const css = readFileSync('src/aiWorkspace.css', 'utf8')

  assert.match(panel, /calculateFacadeFlowOfferModulePreviewMaxWidthPx/)
  assert.match(panel, /maxWidth: modulePreviewMaxWidthPx/)
  assert.match(css, /\.ff-offer-module-stage\{position:relative;width:100%;justify-self:center;box-sizing:border-box;/)
})

test('Hotfix 11 changes preview sizing only and introduces no production authority', () => {
  const panel = readFileSync('src/components/OfferModulesInteractiveRuntimePanel.tsx', 'utf8')
  for (const forbidden of ['MACHINE_READY = true', 'PRODUCTION_APPROVED = true', 'SEND_TO_MACHINE']) {
    assert.equal(panel.includes(forbidden), false)
  }
})
