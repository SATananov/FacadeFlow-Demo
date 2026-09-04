import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync('src/components/DoorVisualComposer.tsx', 'utf8')
const css = readFileSync('src/doorComposerFieldFocus.css', 'utf8')

test('door canvas uses one clear active field target without browser focus rectangle', () => {
  for (const marker of ['door-field-group', "${selected?'active':'inactive'}", 'door-field-selection-wash', 'door-field-outline']) assert.equal(source.includes(marker), true)
  assert.equal(css.includes('.door-composer .door-field-group:focus'), true)
  assert.equal(css.includes('outline: none'), true)
})

test('three and four field door labels stay compact on the canvas', () => {
  assert.equal(source.includes('doorCanvasFieldLabel'), true)
  assert.equal(source.includes("fields.length>2?label.replace(/ от \\d+$/,''):label"), true)
  assert.equal(source.includes("compact=state.fields.length>2"), true)
  assert.equal(css.includes('.door-composer .door-field-label.compact'), true)
})

test('unassigned opening warnings are removed from the drawing and moved to focused controls', () => {
  assert.equal(source.includes('Отварянето не е зададено'), false)
  for (const marker of ['door-active-field-context', 'Настройки на активното крило', 'Страна на пантите:', 'Посока:', 'door-focused-status']) assert.equal(source.includes(marker), true)
})

test('right rail summarizes remaining work instead of stacking every field error', () => {
  assert.equal(source.includes('door-review-summary'), true)
  assert.equal(source.includes('Остава за настройване'), true)
  assert.equal(source.includes('errors.map'), false)
})

test('visual polish preserves working-configuration and production safety wording', () => {
  for (const marker of ['Праг: НЕРАЗРЕШЕН', 'Работна 2D композиция', 'Готово за машина</dt><dd>Не', 'Статусът остава NEEDS_REVIEW']) assert.equal(source.includes(marker), true)
})
