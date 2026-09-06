import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildFacadeFlowQuickStructuredSelection } from '../src/aiProductQuickSelect'
import { buildFacadeFlowConstructionGraph } from '../src/aiConstructionGraph'
import { buildFacadeFlowConstructionDrawing } from '../src/aiConstructionDrawing'
import { buildFacadeFlowAiDrawingProfileSections, facadeFlowAiDrawingCalloutForProfile } from '../src/aiDrawingProfileSections'

const root = process.cwd()

function quickPreludeIntent(withProfiles: boolean) {
  const result = buildFacadeFlowQuickStructuredSelection({
    scope: 'SINGLE_PRODUCT',
    productType: 'WINDOW',
    configuration: 'THREE_FIELD',
    presetId: 'THREE_FIXED_TTR_FIXED',
    widthMm: 1200,
    heightMm: 1400,
    quantity: 3,
    system: 'PRELUDE 60',
    finish: 'RAL 7016',
    glazing: 'двоен стъклопакет',
    hardware: 'ROTO NX',
    frameProfile: withProfiles ? '482.30' : undefined,
    sashProfile: withProfiles ? '482.05' : undefined,
    mullionProfile: withProfiles ? '482.21' : undefined,
  }, withProfiles ? 'profile-sections-explicit' : 'profile-sections-missing')
  assert.ok(result.selection)
  return result.selection!.intent
}

test('Quick Select preserves explicit PRELUDE frame, sash and mullion codes without inventing defaults', () => {
  const explicit = quickPreludeIntent(true)
  assert.equal(explicit.profiles.system, 'PRELUDE 60')
  assert.equal(explicit.profiles.frame, '482.30')
  assert.equal(explicit.profiles.sash, '482.05')
  assert.equal(explicit.profiles.mullion, '482.21')

  const missing = quickPreludeIntent(false)
  assert.equal(missing.profiles.frame, undefined)
  assert.equal(missing.profiles.sash, undefined)
  assert.equal(missing.profiles.mullion, undefined)
})

test('AI drawing profile sections use only explicitly assigned verified catalogue visuals', () => {
  const intent = quickPreludeIntent(true)
  const graph = buildFacadeFlowConstructionGraph(intent)
  const drawing = buildFacadeFlowConstructionDrawing(intent, graph)
  const model = buildFacadeFlowAiDrawingProfileSections(intent, drawing)

  assert.equal(model.systemSupported, true)
  assert.deepEqual(model.sections.map((section) => [section.callout, section.role, section.code]), [
    ['A-A', 'FRAME', '482.30'],
    ['B-B', 'MULLION', '482.21'],
    ['C-C', 'SASH', '482.05'],
  ])
  assert.deepEqual(model.sections.map((section) => section.catalogueAsset), [
    '/technical-profile-inspector/prelude60/482_30_with_dimensions.svg',
    '/technical-profile-inspector/prelude60/482_21_with_dimensions.svg',
    '/technical-profile-inspector/prelude60/482_05_with_dimensions.svg',
  ])
  assert.deepEqual(model.sections.map((section) => section.humanFormulaBg), [
    '64 − 22 = 42 mm',
    '84 − 22 − 22 = 40 mm',
    '78 − 22 = 56 mm',
  ])
  assert.equal(model.missingRoles.length, 0)
  assert.equal(model.automaticProfileAssignmentAllowed, false)
  assert.equal(model.exactAssemblyClaimed, false)
  assert.equal(model.machineReady, false)
  assert.equal(model.productionApproved, false)
})

test('PRELUDE system alone does not auto-assign 482.30 / 482.21 / 482.05 to the product', () => {
  const intent = quickPreludeIntent(false)
  const graph = buildFacadeFlowConstructionGraph(intent)
  const drawing = buildFacadeFlowConstructionDrawing(intent, graph)
  const model = buildFacadeFlowAiDrawingProfileSections(intent, drawing)
  assert.equal(model.sections.length, 0)
  assert.deepEqual(model.missingRoles, ['FRAME', 'MULLION', 'SASH'])
  assert.equal(model.explicitProfileCodesRequired, true)
  assert.equal(model.automaticProfileAssignmentAllowed, false)
})

test('callout ids are stable for the verified PRELUDE working profiles', () => {
  assert.equal(facadeFlowAiDrawingCalloutForProfile('482.30'), 'A-A')
  assert.equal(facadeFlowAiDrawingCalloutForProfile('482.21'), 'B-B')
  assert.equal(facadeFlowAiDrawingCalloutForProfile('482.05'), 'C-C')
  assert.equal(facadeFlowAiDrawingCalloutForProfile('unknown'), null)
})

test('AI proposal UI embeds catalogue profile sections into the same sketch card and preserves safety text', () => {
  const proposal = readFileSync(`${root}/src/components/ParametricConstructionProposalPanel.tsx`, 'utf8')
  const panel = readFileSync(`${root}/src/components/AiDrawingProfileSections.tsx`, 'utf8')
  const quick = readFileSync(`${root}/src/components/AiProductQuickStart.tsx`, 'utf8')

  assert.match(proposal, /AiDrawingProfileSections intent=\{intent\} drawing=\{constructionDrawing\}/)
  assert.match(proposal, /A-A|facadeFlowAiDrawingCalloutForProfile/)
  assert.match(panel, /CATALOGUE VISUAL TRUTH/)
  assert.match(panel, /AI ПРЕРИСУВАНЕ НА ПРОФИЛА: НЕ/)
  assert.match(panel, /АВТОМАТИЧЕН ИЗБОР НА ПРОФИЛ: НЕ/)
  assert.match(panel, /ТОЧЕН СГЛОБЕН ВЪЗЕЛ: НЕ/)
  assert.match(quick, /Каса · точен код/)
  assert.match(quick, /Крило · точен код/)
  assert.match(quick, /Делител · точен код/)
  assert.match(quick, /Не избирай автоматично/)
})
