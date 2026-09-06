import assert from 'node:assert/strict'
import test from 'node:test'
import { interpretFacadeFlowPrompt } from '../src/aiPromptInterpreter'

function openingValue(prompt: string) {
  const result = interpretFacadeFlowPrompt(prompt, 'ai05-3-2-opening')
  return result.recognized.find((item) => item.id === 'opening')?.value
}

test('AI05.3.2 reports mixed product opening when fixed and openable fields coexist', () => {
  const result = interpretFacadeFlowPrompt(
    'Прозорец 1800 x 1400 mm, три полета, средното отваряемо, крайните фиксирани, система PRELUDE 60, каса 482.30, крило 482.05, делител 482.21.',
    'ai05-3-2-fix-open-fix',
  )

  assert.deepEqual(result.intent.fields.map((field) => field.role), ['FIXED', 'OPENING_SASH', 'FIXED'])
  assert.equal(result.recognized.find((item) => item.id === 'opening')?.value, 'Смесена конструкция')
  assert.equal(result.recognized.some((item) => item.id === 'opening' && item.value === 'Фиксирано'), false)
  assert.ok(result.unresolved.includes('Тип отваряне за поле 2'))
})

test('AI05.3.2 mixed summary is independent of phrase order and exact opening type', () => {
  assert.equal(openingValue('Прозорец 1600x1300, две полета, лявото фиксирано, дясното осово-откидно.'), 'Смесена конструкция')
  assert.equal(openingValue('Прозорец 1600x1300, две полета, лявото плъзгащо, дясното фиксирано.'), 'Смесена конструкция')
  assert.equal(openingValue('Прозорец 1800x1400, три полета, крайните отваряеми, средното фиксирано.'), 'Смесена конструкция')
})

test('AI05.3.2 preserves single-field opening summaries', () => {
  assert.equal(openingValue('Прозорец 900x1200, едно поле, фиксирано.'), 'Фиксирано')
  assert.equal(openingValue('Прозорец 900x1200, едно поле, осово-откидно.'), 'Осово-откидно')
})

test('AI05.3.2 does not change production authority', () => {
  const result = interpretFacadeFlowPrompt('Прозорец 1800x1400, три полета, средното отваряемо, крайните фиксирани.')
  assert.equal(result.humanReviewRequired, true)
  assert.equal(result.rulesValidated, false)
  assert.equal(result.automaticGeometryAllowed, false)
  assert.equal(result.machineReady, false)
  assert.equal(result.productionApproved, false)
})
