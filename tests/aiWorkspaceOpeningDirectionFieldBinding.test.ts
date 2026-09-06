import assert from 'node:assert/strict'
import test from 'node:test'
import { buildFacadeFlowConstructionGraph } from '../src/aiConstructionGraph'
import { buildFacadeFlowConstructionDrawing } from '../src/aiConstructionDrawing'
import { interpretFacadeFlowPrompt } from '../src/aiPromptInterpreter'

const base = 'Прозорец KMG PRELUDE 60, общ размер 1800 x 1400 mm, разделен на три вертикални полета. Лявото поле е фиксирано. Средното поле е отваряемо осово-откидно с ляво отваряне. Дясното поле е фиксирано. Използвай каса 482.30, крило 482.05 и два вертикални делителя 482.21. Пълнежът да е двоен стъклопакет. Дръжката да е черна, а на отваряемото крило да има 2 панти.'

test('describe-first parser keeps vertical field adjective and binds middle tilt-turn direction', () => {
  const result = interpretFacadeFlowPrompt(base, 'opening-field-binding')
  assert.equal(result.intent.fields.length, 3)
  assert.deepEqual(result.intent.fields.map((field) => field.role), ['FIXED', 'OPENING_SASH', 'FIXED'])
  assert.equal(result.intent.fields[1]?.openingType, 'TILT_TURN')
  assert.equal(result.intent.fields[1]?.openingDirection, 'LEFT')
  assert.equal(result.intent.profiles.frame, '482.30')
  assert.equal(result.intent.profiles.sash, '482.05')
  assert.equal(result.intent.profiles.mullion, '482.21')
  assert.equal(result.unresolved.some((item) => /не е еднозначно свързана/i.test(item)), false)
})

test('right opening stays bound only to the addressed middle field', () => {
  const result = interpretFacadeFlowPrompt(base.replace('ляво отваряне', 'дясно отваряне'), 'opening-field-right')
  assert.equal(result.intent.fields[0]?.openingDirection, undefined)
  assert.equal(result.intent.fields[1]?.openingDirection, 'RIGHT')
  assert.equal(result.intent.fields[2]?.openingDirection, undefined)
})

test('missing left-right direction is surfaced and never invented', () => {
  const result = interpretFacadeFlowPrompt(base.replace(' с ляво отваряне', ''), 'opening-field-unresolved')
  assert.equal(result.intent.fields[1]?.openingType, 'TILT_TURN')
  assert.equal(result.intent.fields[1]?.openingDirection, undefined)
  assert.ok(result.unresolved.some((item) => /Посока ляво \/ дясно за поле 2/i.test(item)))
})

test('construction drawing preserves three fields and the opening belongs to field 2 only', () => {
  const intent = interpretFacadeFlowPrompt(base, 'opening-drawing').intent
  const drawing = buildFacadeFlowConstructionDrawing(intent, buildFacadeFlowConstructionGraph(intent))
  assert.equal(drawing.fields.length, 3)
  assert.deepEqual(drawing.fields.map((field) => field.semanticRole), ['FIXED_FIELD', 'OPENABLE_FIELD', 'FIXED_FIELD'])
  assert.equal(drawing.fields[1]?.sash?.openingType, 'TILT_TURN')
  assert.equal(drawing.fields[1]?.sash?.openingDirection, 'LEFT')
})

test('AI drawing uses the same opening geometry helper as Visual Composer and has no invented fallback diagonal', async () => {
  const fs = await import('node:fs/promises')
  const source = await fs.readFile('src/components/ParametricConstructionProposalPanel.tsx', 'utf8')
  const grammar = await fs.readFile('src/aiDrawingVisualGrammar.ts', 'utf8')
  assert.match(source, /createOpeningGeometry/)
  assert.match(grammar, /посока неуточнена/i)
  assert.doesNotMatch(source, /ff-ai03-opening unresolved/)
})
