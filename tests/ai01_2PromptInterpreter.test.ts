import test from 'node:test'
import assert from 'node:assert/strict'
import { interpretFacadeFlowPrompt } from '../src/aiPromptInterpreter'

const bg = 'Направи прозорец W-17 2400x1500 mm, 3 полета, лявото фиксирано, средното tilt-turn, дясното фиксирано, профилна система Schuco AWS 75, RAL 7016, троен стъклопакет, черна дръжка, 2 панти.'

test('AI01.2 parses explicit Bulgarian product intent without production authority', () => {
  const result = interpretFacadeFlowPrompt(bg, 'bg-window')
  assert.equal(result.intent.category, 'WINDOW')
  assert.equal(result.intent.mark, 'W-17')
  assert.deepEqual(result.intent.dimensions, { widthMm: 2400, heightMm: 1500 })
  assert.equal(result.intent.fields.length, 3)
  assert.equal(result.intent.fields[0].role, 'FIXED')
  assert.equal(result.intent.fields[1].openingType, 'TILT_TURN')
  assert.equal(result.intent.fields[2].role, 'FIXED')
  assert.equal(result.intent.profiles.system, 'Schuco AWS 75')
  assert.equal(result.intent.finish.exterior, 'RAL 7016')
  assert.match(result.intent.glazing.description ?? '', /троен/i)
  assert.equal(result.intent.hardwareDefaults.hingeQuantity, 2)
  assert.equal(result.humanReviewRequired, true)
  assert.equal(result.automaticGeometryAllowed, false)
  assert.equal(result.machineReady, false)
  assert.equal(result.productionApproved, false)
})

test('AI01.2 parses English door direction, swing and hardware evidence', () => {
  const result = interpretFacadeFlowPrompt('Door D-04 900 x 2100 mm, 1 field, profile system SYS-90, opening: right, inward, triple glazing, keyed handle, 3 concealed hinges, threshold low threshold.')
  assert.equal(result.intent.category, 'DOOR')
  assert.equal(result.intent.dimensions.widthMm, 900)
  assert.equal(result.intent.fields.length, 1)
  assert.equal(result.intent.fields[0].openingDirection, 'RIGHT')
  assert.equal(result.intent.fields[0].swing, 'INWARD')
  assert.equal(result.intent.hardwareDefaults.hingeQuantity, 3)
  assert.match(result.intent.hardwareDefaults.hinges ?? '', /concealed/i)
  assert.match(result.intent.hardwareDefaults.handle ?? '', /keyed/i)
  assert.ok(result.intent.profiles.threshold)
})

test('AI01.2 converts explicit centimetres to millimetres', () => {
  const result = interpretFacadeFlowPrompt('прозорец 240 cm x 150 cm, 1 поле, fixed')
  assert.equal(result.intent.dimensions.widthMm, 2400)
  assert.equal(result.intent.dimensions.heightMm, 1500)
})

test('AI01.2 does not invent missing dimensions, profiles, fields or glazing', () => {
  const result = interpretFacadeFlowPrompt('Направи ми прозорец антрацит.')
  assert.equal(result.intent.category, 'WINDOW')
  assert.equal(result.intent.dimensions.widthMm, undefined)
  assert.equal(result.intent.profiles.system, undefined)
  assert.equal(result.intent.fields.length, 0)
  assert.equal(result.intent.glazing.description, undefined)
  assert.ok(result.unresolved.includes('Общи размери'))
  assert.ok(result.unresolved.includes('Профилна система'))
  assert.ok(result.unresolved.includes('Брой / разпределение на полетата'))
})

test('AI01.2 preserves the full prompt as explicit source evidence', () => {
  const result = interpretFacadeFlowPrompt(bg, 'evidence-test')
  assert.equal(result.intent.evidence.length, 1)
  assert.equal(result.intent.evidence[0].sourceKind, 'PROMPT')
  assert.equal(result.intent.evidence[0].excerpt, bg)
  assert.equal(result.intent.evidence[0].strength, 'EXPLICIT')
})

test('AI01.2 marks ambiguous multi-field global opening instead of applying it everywhere', () => {
  const result = interpretFacadeFlowPrompt('прозорец 1800x1400, 3 полета, отваряемо, система X')
  assert.equal(result.intent.fields.length, 3)
  assert.equal(result.intent.fields.every((field) => field.openingType === undefined), true)
  assert.ok(result.unresolved.some((item) => /не е еднозначно свързана/i.test(item)))
})

test('AI01.2 converts decimal metres to millimetres', () => {
  const result = interpretFacadeFlowPrompt('window 2.4 m x 1.5 m, 1 field, fixed')
  assert.equal(result.intent.dimensions.widthMm, 2400)
  assert.equal(result.intent.dimensions.heightMm, 1500)
})

test('AI01.2 keeps global direction unresolved for multi-field products', () => {
  const result = interpretFacadeFlowPrompt('window 1800x1400, 3 fields, opening: right, inward, system X')
  assert.equal(result.intent.fields.every((field) => field.openingDirection === undefined), true)
  assert.ok(result.unresolved.some((item) => /Посоката на отваряне/i.test(item)))
  assert.ok(result.unresolved.some((item) => /Навътре \/ навън/i.test(item)))
})

test('AI01 human-audit hotfix keeps generic operable semantics unresolved and captures Bulgarian word hinge quantity', () => {
  const result = interpretFacadeFlowPrompt('Направи прозорец 2400x1500, три полета, средното отваряемо, профил X, черна дръжка, две панти, троен стъклопакет, RAL 7016')
  assert.equal(result.intent.fields.length, 3)
  assert.equal(result.intent.fields[0].role, 'UNRESOLVED')
  assert.equal(result.intent.fields[1].role, 'OPENING_SASH')
  assert.equal(result.intent.fields[1].openingType, undefined)
  assert.ok(result.intent.fields[1].unresolved.includes('Тип отваряне на полето'))
  assert.ok(result.unresolved.some((item) => /Тип отваряне за поле 2/i.test(item)))
  assert.equal(result.intent.fields[2].role, 'UNRESOLVED')
  assert.equal(result.intent.hardwareDefaults.hingeQuantity, 2)
  assert.equal(result.recognized.some((item) => item.id === 'opening' && item.value === 'TURN'), false)
  assert.ok(result.recognized.some((item) => item.id === 'opening' && /тип неуточнен/i.test(item.value)))
  assert.ok(result.recognized.some((item) => item.id === 'hinge-quantity' && item.value === '2' && item.confidence === 'MEDIUM'))
})

test('AI01 human-audit hotfix still accepts explicit TURN semantics when the user actually says turn', () => {
  const result = interpretFacadeFlowPrompt('window 1200x1400, 1 field, turn, opening: right, inward, 2 hinges')
  assert.equal(result.intent.fields[0].role, 'OPENING_SASH')
  assert.equal(result.intent.fields[0].openingType, 'TURN')
  assert.equal(result.intent.fields[0].openingDirection, 'RIGHT')
  assert.equal(result.intent.fields[0].swing, 'INWARD')
  assert.equal(result.intent.hardwareDefaults.hingeQuantity, 2)
})
