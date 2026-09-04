import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { applyComposerItemForExplicitTarget, PROFILE_DATA_01_2A_V4_FIELD_TARGET_SAFETY } from '../src/visualComposerExplicitFieldTarget'
import type { VisualComposition } from '../src/visualComposerTypes'

const safety = {
  sessionOnly: true,
  simulationOnly: true,
  machineReady: false,
  internalEvaluationOnly: true,
  productionApproved: false,
  sourceImmutable: true,
  exportAvailable: false,
  dwgWriteAvailable: false,
  machineConnectivityAvailable: false,
  geometryCreated: false,
} as const

function state(): VisualComposition {
  return {
    templateId: 'DOUBLE',
    fields: [
      {
        id: 'field-1',
        rect: { x: 0, y: 0, width: .5, height: 1 },
        fieldType: 'OPENABLE',
        openingDirection: 'LEFT',
        attachedHandleId: null,
        attachedHingeIds: [],
        humanReviewState: 'HUMAN_CONFIRMED',
      },
      {
        id: 'field-2',
        rect: { x: .5, y: 0, width: .5, height: 1 },
        fieldType: 'FIXED',
        openingDirection: null,
        attachedHandleId: null,
        attachedHingeIds: [],
        humanReviewState: 'HUMAN_CONFIRMED',
      },
    ],
    components: [],
    selectedFieldId: 'field-1',
    selectedComponentId: null,
    interiorColor: '',
    exteriorColor: '',
    interiorColorCustom: '',
    exteriorColorCustom: '',
    status: 'HUMAN_CONFIRMED',
    message: '',
    ...safety,
  }
}

test('left-field action changes only the explicit left field', () => {
  const before = state()
  const rightBefore = before.fields[1]
  const after = applyComposerItemForExplicitTarget(before, 'field-1', 'FIELD_FIXED', () => 'unused')
  assert.equal(after.fields[0].fieldType, 'FIXED')
  assert.equal(after.fields[0].humanReviewState, 'UNREVIEWED')
  assert.strictEqual(after.fields[1], rightBefore)
  assert.equal(after.fields[1].humanReviewState, 'HUMAN_CONFIRMED')
  assert.equal(after.selectedFieldId, 'field-1')
})

test('right-field action changes only the explicit right field', () => {
  const before = state()
  const leftBefore = before.fields[0]
  const after = applyComposerItemForExplicitTarget(before, 'field-2', 'FIELD_OPENING', () => 'unused')
  assert.strictEqual(after.fields[0], leftBefore)
  assert.equal(after.fields[0].humanReviewState, 'HUMAN_CONFIRMED')
  assert.equal(after.fields[1].fieldType, 'OPENABLE')
  assert.equal(after.fields[1].humanReviewState, 'UNREVIEWED')
  assert.equal(after.selectedFieldId, 'field-2')
})

test('missing explicit field id is a no-op and never guesses a different field', () => {
  const before = state()
  assert.strictEqual(applyComposerItemForExplicitTarget(before, 'missing', 'FIELD_FIXED', () => 'unused'), before)
})

test('composer sends every field-scoped apply through the explicit target helper', () => {
  const source = readFileSync('src/components/VisualTemplateComposer.tsx', 'utf8')
  assert.match(source, /const targetFieldId = fieldId \?\? state\.selectedFieldId/)
  assert.match(source, /applyComposerItemForExplicitTarget\(state, targetFieldId, item/)
  assert.match(source, /Активно поле:/)
})

test('side rails use stronger readable text contrast', () => {
  const css = readFileSync('src/visualComposer.css', 'utf8')
  assert.match(css, /PROFILE DATA 01\.2A V4/)
  assert.match(css, /\.visual-library/)
  assert.match(css, /\.visual-properties/)
  assert.match(css, /#20343a/)
  assert.match(css, /\.visual-field-target/)
})

test('safety keeps cross-field automation and production authority disabled', () => {
  assert.equal(PROFILE_DATA_01_2A_V4_FIELD_TARGET_SAFETY.explicitTargetRequired, true)
  assert.equal(PROFILE_DATA_01_2A_V4_FIELD_TARGET_SAFETY.automaticCrossFieldMutationAllowed, false)
  assert.equal(PROFILE_DATA_01_2A_V4_FIELD_TARGET_SAFETY.machineReady, false)
  assert.equal(PROFILE_DATA_01_2A_V4_FIELD_TARGET_SAFETY.productionApproved, false)
})
