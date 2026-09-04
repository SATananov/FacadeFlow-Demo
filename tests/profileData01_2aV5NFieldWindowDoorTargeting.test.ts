import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { applyComposerItemForExplicitTarget } from '../src/visualComposerExplicitFieldTarget'
import { composerFieldDisplayName, createEmptyComposition, applyComposerTemplate } from '../src/visualComposerState'
import { VISUAL_COMPOSER_TEMPLATES } from '../src/visualComposerTemplates'
import { applyDoorTemplate, doorFieldDisplayName, emptyDoorComposition } from '../src/doorComposerState'
import { addDoorHardwareForExplicitTarget, N_FIELD_DOOR_TARGET_SAFETY, setDoorInfillForExplicitTarget, setDoorOpeningForExplicitTarget } from '../src/doorComposerExplicitFieldTarget'
import { DOOR_TEMPLATES } from '../src/doorComposerTemplates'

test('window templates expose real 3-field and 4-field compositions', () => {
  assert.equal(VISUAL_COMPOSER_TEMPLATES.find((item) => item.id === 'DEMO-WINDOW-TRIPLE')?.fields.length, 3)
  assert.equal(VISUAL_COMPOSER_TEMPLATES.find((item) => item.id === 'DEMO-WINDOW-QUADRUPLE')?.fields.length, 4)
})

test('third window field can change without mutating the other three', () => {
  const before = applyComposerTemplate(createEmptyComposition(), 'DEMO-WINDOW-QUADRUPLE')
  const snapshots = before.fields.map((field) => field)
  const after = applyComposerItemForExplicitTarget(before, 'field-3', 'FIELD_FIXED', () => 'unused')
  assert.strictEqual(after.fields[0], snapshots[0])
  assert.strictEqual(after.fields[1], snapshots[1])
  assert.equal(after.fields[2]?.fieldType, 'FIXED')
  assert.strictEqual(after.fields[3], snapshots[3])
  assert.equal(after.selectedFieldId, 'field-3')
})

test('3+ window labels are positional and do not depend on left/right special cases', () => {
  const triple = applyComposerTemplate(createEmptyComposition(), 'DEMO-WINDOW-TRIPLE').fields
  const quad = applyComposerTemplate(createEmptyComposition(), 'DEMO-WINDOW-QUADRUPLE').fields
  assert.equal(composerFieldDisplayName(triple, 'field-2'), 'Поле 2 от 3')
  assert.equal(composerFieldDisplayName(quad, 'field-4'), 'Поле 4 от 4')
})

test('door templates expose real 3-leaf and 4-leaf conceptual compositions', () => {
  assert.equal(DOOR_TEMPLATES.find((item) => item.id === 'DEMO-DOOR-TRIPLE-SOLID')?.fields.length, 3)
  assert.equal(DOOR_TEMPLATES.find((item) => item.id === 'DEMO-DOOR-QUADRUPLE-SOLID')?.fields.length, 4)
})

test('door opening targets only the explicit third leaf', () => {
  const before = applyDoorTemplate(emptyDoorComposition(), 'DEMO-DOOR-QUADRUPLE-SOLID')
  const snapshots = before.fields.map((field) => field)
  const after = setDoorOpeningForExplicitTarget(before, 'leaf-3', 'RIGHT', 'OUTWARD')
  assert.strictEqual(after.fields[0], snapshots[0])
  assert.strictEqual(after.fields[1], snapshots[1])
  assert.equal(after.fields[2]?.hingeSide, 'RIGHT')
  assert.equal(after.fields[2]?.swing, 'OUTWARD')
  assert.strictEqual(after.fields[3], snapshots[3])
  assert.equal(after.selectedFieldId, 'leaf-3')
})

test('door infill and hardware stay attached to the explicit leaf', () => {
  let state = applyDoorTemplate(emptyDoorComposition(), 'DEMO-DOOR-TRIPLE-SOLID')
  const first = state.fields[0], third = state.fields[2]
  state = setDoorInfillForExplicitTarget(state, 'leaf-2', 'GLAZED')
  assert.strictEqual(state.fields[0], first)
  assert.strictEqual(state.fields[2], third)
  state = setDoorOpeningForExplicitTarget(state, 'leaf-2', 'LEFT', 'INWARD')
  state = addDoorHardwareForExplicitTarget(state, 'leaf-2', 'HINGE', () => 'hinge-2', .25)
  assert.equal(state.hardware.length, 1)
  assert.equal(state.hardware[0]?.parentFieldId, 'leaf-2')
  assert.equal(state.fields[1]?.hingeIds.includes('hinge-2'), true)
  assert.equal(state.fields[0]?.hingeIds.length, 0)
  assert.equal(state.fields[2]?.hingeIds.length, 0)
})

test('missing door field id is a no-op and never guesses another leaf', () => {
  const before = applyDoorTemplate(emptyDoorComposition(), 'DEMO-DOOR-TRIPLE-SOLID')
  assert.strictEqual(setDoorOpeningForExplicitTarget(before, 'missing', 'LEFT', 'INWARD'), before)
  assert.strictEqual(setDoorInfillForExplicitTarget(before, 'missing', 'GLAZED'), before)
  assert.strictEqual(addDoorHardwareForExplicitTarget(before, 'missing', 'HINGE', () => 'unused'), before)
})

test('3+ door labels use stable positional naming while 2-field doors keep left/right', () => {
  const double = applyDoorTemplate(emptyDoorComposition(), 'DEMO-DOOR-DOUBLE-SOLID').fields
  const triple = applyDoorTemplate(emptyDoorComposition(), 'DEMO-DOOR-TRIPLE-SOLID').fields
  const quad = applyDoorTemplate(emptyDoorComposition(), 'DEMO-DOOR-QUADRUPLE-SOLID').fields
  assert.equal(doorFieldDisplayName(double, 'leaf-1'), 'Ляво поле')
  assert.equal(doorFieldDisplayName(double, 'leaf-2'), 'Дясно поле')
  assert.equal(doorFieldDisplayName(triple, 'leaf-2'), 'Поле 2 от 3')
  assert.equal(doorFieldDisplayName(quad, 'leaf-4'), 'Поле 4 от 4')
})

test('door composer routes field-scoped controls through explicit target helpers', () => {
  const source = readFileSync('src/components/DoorVisualComposer.tsx', 'utf8')
  for (const marker of ['const targetFieldId=id', 'setDoorOpeningForExplicitTarget', 'setDoorInfillForExplicitTarget', 'addDoorHardwareForExplicitTarget', 'Активно поле:']) assert.equal(source.includes(marker), true)
})

test('N-field door safety forbids automatic cross-field mutation and production authority', () => {
  assert.equal(N_FIELD_DOOR_TARGET_SAFETY.explicitTargetRequired, true)
  assert.equal(N_FIELD_DOOR_TARGET_SAFETY.automaticCrossFieldMutationAllowed, false)
  assert.equal(N_FIELD_DOOR_TARGET_SAFETY.automaticLeafSelectionAllowed, false)
  assert.equal(N_FIELD_DOOR_TARGET_SAFETY.machineReady, false)
  assert.equal(N_FIELD_DOOR_TARGET_SAFETY.productionApproved, false)
})
