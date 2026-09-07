import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createFacadeFlowProductIntent } from '../src/aiProductIntent'
import { buildFacadeFlowConstructionGraph } from '../src/aiConstructionGraph'
import { buildFacadeFlowConstructionDrawing } from '../src/aiConstructionDrawing'
import { buildFacadeFlowCanonicalProfileAssignmentBridge } from '../src/aiCanonicalProfileAssignmentBridge'
import {
  buildCanonicalProfileTechnicalSemanticsBridge,
  PROFILE_DATA_03_4_AI_BRIDGE_SAFETY,
} from '../src/aiCanonicalProfileTechnicalSemanticsBridge'
import {
  PRELUDE_60_CANONICAL_TECHNICAL_SEMANTICS_SAFETY,
  PRELUDE_60_CANONICAL_TECHNICAL_SEMANTICS_VERSION,
  PROFILE_DATA_03_4_STATE,
  resolvePrelude60CanonicalTechnicalSemantics,
} from '../src/profileData/prelude60CanonicalTechnicalSemantics'

function explicitPreludeIntent() {
  const intent = createFacadeFlowProductIntent({
    id: 'profile-data03-4-technical-semantics',
    sourceKind: 'MANUAL',
    sourceText: 'Explicit PRELUDE 60 canonical technical semantics fixture.',
    aiGenerated: false,
  })
  intent.category = 'WINDOW'
  intent.dimensions = { widthMm: 1800, heightMm: 1400 }
  intent.profiles = {
    system: 'PRELUDE 60',
    frame: '482.30',
    mullion: '482.21',
    sash: '482.05',
  }
  intent.fields = [
    { id: 'field-1', order: 0, role: 'FIXED', evidenceIds: [], unresolved: [] },
    { id: 'field-2', order: 1, role: 'OPENING_SASH', openingType: 'TILT_TURN', openingDirection: 'RIGHT', evidenceIds: [], unresolved: [] },
    { id: 'field-3', order: 2, role: 'FIXED', evidenceIds: [], unresolved: [] },
  ]
  intent.dividers = [
    { id: 'divider-1', orientation: 'VERTICAL', positionRatio: 1 / 3, evidenceIds: [], unresolved: [] },
    { id: 'divider-2', orientation: 'VERTICAL', positionRatio: 2 / 3, evidenceIds: [], unresolved: [] },
  ]
  return intent
}

function bridgeFixture() {
  const intent = explicitPreludeIntent()
  const graph = buildFacadeFlowConstructionGraph(intent)
  const drawing = buildFacadeFlowConstructionDrawing(intent, graph)
  return buildFacadeFlowCanonicalProfileAssignmentBridge(intent, graph, drawing)
}

test('PROFILE DATA 03.4 resolves canonical PRELUDE identities to human-confirmed working semantics without claiming contour geometry', () => {
  assert.equal(PRELUDE_60_CANONICAL_TECHNICAL_SEMANTICS_VERSION, 'PROFILE_DATA_03.4')

  const frame = resolvePrelude60CanonicalTechnicalSemantics({ profileCode: '482.30', role: 'FRAME' })
  const mullion = resolvePrelude60CanonicalTechnicalSemantics({ profileCode: '482.21', role: 'MULLION' })
  const sash = resolvePrelude60CanonicalTechnicalSemantics({ profileCode: '482.05', role: 'SASH' })

  assert.equal(frame.state, 'RESOLVED_HUMAN_CONFIRMED')
  assert.equal(frame.semantics?.workingDimensions.fullWorkingDimensionMm, 64)
  assert.equal(frame.semantics?.workingDimensions.visibleWidthMm, 42)
  assert.equal(mullion.semantics?.workingDimensions.fullWorkingDimensionMm, 84)
  assert.equal(mullion.semantics?.workingDimensions.visibleWidthMm, 40)
  assert.equal(sash.semantics?.workingDimensions.fullWorkingDimensionMm, 78)
  assert.equal(sash.semantics?.workingDimensions.visibleWidthMm, 56)

  for (const result of [frame, mullion, sash]) {
    assert.equal(result.semantics?.technicalSemanticsAuthority, 'HUMAN_CONFIRMED_WORKING_SEMANTICS')
    assert.equal(result.semantics?.workingDimensions.interpretation, 'SEMANTIC_VALUES_ONLY_NOT_CONTOUR_GEOMETRY')
    assert.equal(result.semantics?.exactSectionContourAuthority, 'NOT_ESTABLISHED')
    assert.equal(result.semantics?.productionDeductionsApplied, false)
    assert.equal(result.semantics?.productionUnlockAllowed, false)
  }
})

test('PROFILE DATA 03.4 preserves separate catalogue provenance and does not mislabel the sash catalogue extent as visible width', () => {
  const frame = resolvePrelude60CanonicalTechnicalSemantics({ profileCode: '482.30', role: 'FRAME' }).semantics!
  const sash = resolvePrelude60CanonicalTechnicalSemantics({ profileCode: '482.05', role: 'SASH' }).semantics!

  assert.equal(frame.catalogueReference.labelledVisibleMm, 42)
  assert.equal(frame.catalogueReference.visibleWidthAgreement, true)
  assert.equal(frame.sourceMergeState, 'SEPARATE_SOURCES_NO_AUTO_MERGE')

  assert.equal(sash.catalogueReference.labelledOverallExtentMm, 56)
  assert.equal(sash.catalogueReference.labelledVisibleMm, null)
  assert.equal(sash.catalogueReference.comparisonState, 'NOT_DIRECTLY_COMPARABLE')
  assert.equal(sash.workingDimensions.visibleWidthMm, 56)
})

test('PROFILE DATA 03.4 rejects role mismatch instead of borrowing dimensions from another canonical role', () => {
  const mismatch = resolvePrelude60CanonicalTechnicalSemantics({ profileCode: '482.05', role: 'FRAME' })
  assert.equal(mismatch.state, 'ROLE_MISMATCH')
  assert.equal(mismatch.semantics, undefined)
  assert.equal(mismatch.automaticProfileSelectionAllowed, false)
  assert.equal(mismatch.automaticGeometryAllowed, false)
})

test('PROFILE DATA 03.4 bridge binds semantics only to explicit canonical assignments and preserves target trace', () => {
  const bridge = bridgeFixture()
  const technical = buildCanonicalProfileTechnicalSemanticsBridge(bridge)

  assert.equal(technical.status, 'READY_FOR_HUMAN_REVIEW')
  assert.deepEqual(technical.rows.map((row) => [
    row.targetKind,
    row.targetRef,
    row.profileCode,
    row.semantics.workingDimensions.fullWorkingDimensionMm,
    row.semantics.workingDimensions.visibleWidthMm,
  ]), [
    ['FRAME', 'frame-root', '482.30', 64, 42],
    ['MULLION', 'divider-1', '482.21', 84, 40],
    ['MULLION', 'divider-2', '482.21', 84, 40],
    ['SASH', 'field-2', '482.05', 78, 56],
  ])
  assert.equal(technical.geometryMutatedBySemantics, false)
  assert.equal(technical.productionDeductionsApplied, false)
  assert.equal(technical.productionUnlockAllowed, false)
})

test('PROFILE DATA 03.4 bridge fails closed when the upstream canonical assignment bridge is not ready', () => {
  const intent = explicitPreludeIntent()
  intent.profiles = { system: 'PRELUDE 60' }
  const graph = buildFacadeFlowConstructionGraph(intent)
  const drawing = buildFacadeFlowConstructionDrawing(intent, graph)
  const bridge = buildFacadeFlowCanonicalProfileAssignmentBridge(intent, graph, drawing)
  const technical = buildCanonicalProfileTechnicalSemanticsBridge(bridge)

  assert.equal(bridge.status, 'NEEDS_EXPLICIT_PROFILE_ASSIGNMENT')
  assert.equal(technical.status, 'BLOCKED_UPSTREAM')
  assert.equal(technical.rows.length, 0)
  assert.match(technical.conflicts.join('\n'), /technical semantics are blocked/)
})

test('PROFILE DATA 03.4 UI exposes technical semantics next to the real canonical 3D workflow without production claims', () => {
  const parent = readFileSync('src/components/CanonicalProfileRealConceptual3DPanel.tsx', 'utf8')
  const panel = readFileSync('src/components/CanonicalProfileTechnicalSemanticsPanel.tsx', 'utf8')

  assert.match(parent, /CanonicalProfileTechnicalSemanticsPanel/)
  assert.match(parent, /bridge=\{bridge\}/)
  assert.match(panel, /PROFILE TECHNICAL SEMANTICS · CANONICAL TRACE/)
  assert.match(panel, /Пълен работен размер/)
  assert.match(panel, /Видима ширина/)
  assert.match(panel, /exact contour authority/)
  assert.match(panel, /PRODUCTION DEDUCTIONS: НЕ/)
  assert.match(panel, /PRODUCTION UNLOCK: НЕ/)
})

test('PROFILE DATA 03.4 remains OPEN / WORKING and preserves all production safety boundaries', () => {
  assert.equal(PROFILE_DATA_03_4_STATE.parentStatus, 'OPEN / WORKING')
  assert.equal(PROFILE_DATA_03_4_STATE.stepStatus, 'WORKING')

  assert.equal(PRELUDE_60_CANONICAL_TECHNICAL_SEMANTICS_SAFETY.humanWorkingSemanticsOnly, true)
  assert.equal(PRELUDE_60_CANONICAL_TECHNICAL_SEMANTICS_SAFETY.valuesAreNotExactContourGeometry, true)
  assert.equal(PRELUDE_60_CANONICAL_TECHNICAL_SEMANTICS_SAFETY.measurementAnchorsBoundToContour, false)
  assert.equal(PRELUDE_60_CANONICAL_TECHNICAL_SEMANTICS_SAFETY.productionDeductionsApplied, false)
  assert.equal(PRELUDE_60_CANONICAL_TECHNICAL_SEMANTICS_SAFETY.manufacturingToleranceApplied, false)
  assert.equal(PRELUDE_60_CANONICAL_TECHNICAL_SEMANTICS_SAFETY.productionUnlockAllowed, false)
  assert.equal(PRELUDE_60_CANONICAL_TECHNICAL_SEMANTICS_SAFETY.machineReady, false)

  assert.equal(PROFILE_DATA_03_4_AI_BRIDGE_SAFETY.readOnlyTechnicalSemantics, true)
  assert.equal(PROFILE_DATA_03_4_AI_BRIDGE_SAFETY.noProfileInference, true)
  assert.equal(PROFILE_DATA_03_4_AI_BRIDGE_SAFETY.geometryMutatedBySemantics, false)
  assert.equal(PROFILE_DATA_03_4_AI_BRIDGE_SAFETY.productionDeductionsApplied, false)
  assert.equal(PROFILE_DATA_03_4_AI_BRIDGE_SAFETY.automaticGeometryAllowed, false)
  assert.equal(PROFILE_DATA_03_4_AI_BRIDGE_SAFETY.productionUnlockAllowed, false)
  assert.equal(PROFILE_DATA_03_4_AI_BRIDGE_SAFETY.machineReady, false)
  assert.equal(PROFILE_DATA_03_4_AI_BRIDGE_SAFETY.productionApproved, false)
})
