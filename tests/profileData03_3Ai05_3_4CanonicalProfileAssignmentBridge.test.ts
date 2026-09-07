import assert from 'node:assert/strict'
import test from 'node:test'
import { createFacadeFlowProductIntent } from '../src/aiProductIntent'
import { buildFacadeFlowConstructionGraph } from '../src/aiConstructionGraph'
import { buildFacadeFlowConstructionDrawing } from '../src/aiConstructionDrawing'
import {
  AI05_3_4_CANONICAL_PROFILE_ASSIGNMENT_BRIDGE_SAFETY,
  AI05_3_4_STATE,
  attachFacadeFlowCanonicalProfileAssignmentsToConceptual3D,
  buildFacadeFlowCanonicalProfileAssignmentBridge,
  type FacadeFlowProfileAssignmentDrawingLike,
} from '../src/aiCanonicalProfileAssignmentBridge'
import {
  PRELUDE_60_CANONICAL_PROFILE_IDENTITIES,
  PRELUDE_60_CANONICAL_PROFILE_IDENTITY_SAFETY,
  PROFILE_DATA_03_3_STATE,
  isExplicitPrelude60System,
  resolvePrelude60CanonicalProfileIdentity,
} from '../src/profileData/prelude60CanonicalProfileIdentity'
import { barNode, createScene } from '../src/threeDSceneBuilder'

function explicitPreludeIntent() {
  const intent = createFacadeFlowProductIntent({
    id: 'profile-bridge-explicit',
    sourceKind: 'MANUAL',
    sourceText: 'Synthetic explicit PRELUDE assignment fixture.',
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
    { id: 'field-2', order: 1, role: 'OPENING_SASH', openingType: 'TILT_TURN', evidenceIds: [], unresolved: [] },
    { id: 'field-3', order: 2, role: 'FIXED', evidenceIds: [], unresolved: [] },
  ]
  intent.dividers = [
    { id: 'divider-1', orientation: 'VERTICAL', positionRatio: 1 / 3, evidenceIds: [], unresolved: [] },
    { id: 'divider-2', orientation: 'VERTICAL', positionRatio: 2 / 3, evidenceIds: [], unresolved: [] },
  ]
  return intent
}

function drawingLikeFromGraph(graph: ReturnType<typeof buildFacadeFlowConstructionGraph>): FacadeFlowProfileAssignmentDrawingLike {
  assert.ok(graph.root)
  return {
    frame: { profileRef: graph.root.profileRef },
    mullions: graph.root.children.flatMap((child) => child.kind === 'MULLION'
      ? [{ order: child.order, profileRef: child.profileRef }]
      : []),
    fields: graph.root.children.flatMap((child) => child.kind === 'FIELD'
      ? [{ sourceFieldId: child.sourceFieldId, order: child.order, sash: child.sash ? { profileRef: child.sash.profileRef } : undefined }]
      : []),
  }
}

test('PROFILE DATA 03.3 exposes only canonical PRELUDE identity mappings for frame, mullion and sash', () => {
  assert.deepEqual(PRELUDE_60_CANONICAL_PROFILE_IDENTITIES.map((item) => [item.role, item.profileCode]), [
    ['FRAME', '482.30'],
    ['MULLION', '482.21'],
    ['SASH', '482.05'],
  ])
  for (const item of PRELUDE_60_CANONICAL_PROFILE_IDENTITIES) {
    assert.equal(item.identityAuthority, 'PROFILE_IDENTITY_ONLY')
    assert.equal(item.geometryAuthority, 'NONE')
    assert.equal(item.automaticProfileAssignmentAllowed, false)
    assert.equal(item.machineReady, false)
    assert.equal(item.productionApproved, false)
  }
})

test('PROFILE DATA 03.3 recognizes PRELUDE 60 only as complete normalized tokens', () => {
  assert.equal(isExplicitPrelude60System('PRELUDE 60'), true)
  assert.equal(isExplicitPrelude60System('KMG PRELUDE 60'), true)
  assert.equal(isExplicitPrelude60System('PRELUDE_60'), true)
  assert.equal(isExplicitPrelude60System('PRELUDE 600'), false)
  assert.equal(isExplicitPrelude60System('PRELUDE 160'), false)

  const wrongSystem = resolvePrelude60CanonicalProfileIdentity({
    system: 'PRELUDE 600',
    role: 'FRAME',
    explicitCode: '482.30',
  })
  assert.equal(wrongSystem.state, 'UNSUPPORTED_OR_MISSING_SYSTEM')
  assert.equal(wrongSystem.identity, undefined)
})

test('PROFILE DATA 03.3 never turns PRELUDE 60 system selection into default profile assignment', () => {
  const missing = resolvePrelude60CanonicalProfileIdentity({ system: 'PRELUDE 60', role: 'FRAME' })
  assert.equal(missing.state, 'MISSING_EXPLICIT_CODE')
  assert.equal(missing.identity, undefined)

  const mismatch = resolvePrelude60CanonicalProfileIdentity({ system: 'PRELUDE 60', role: 'FRAME', explicitCode: '482.05' })
  assert.equal(mismatch.state, 'ROLE_MISMATCH')
  assert.equal(mismatch.identity, undefined)

  const explicit = resolvePrelude60CanonicalProfileIdentity({ system: 'KMG PRELUDE 60', role: 'FRAME', explicitCode: '482.30' })
  assert.equal(explicit.state, 'RESOLVED_EXPLICIT')
  assert.equal(explicit.identity?.profileCode, '482.30')
  assert.equal(explicit.automaticProfileAssignmentAllowed, false)
})

test('AI05.3.4 preserves explicit PRELUDE assignments across Product Intent -> Graph -> Drawing', () => {
  const intent = explicitPreludeIntent()
  const graph = buildFacadeFlowConstructionGraph(intent)
  const drawing = drawingLikeFromGraph(graph)
  const bridge = buildFacadeFlowCanonicalProfileAssignmentBridge(intent, graph, drawing)

  assert.equal(bridge.status, 'READY_FOR_HUMAN_REVIEW')
  assert.deepEqual(bridge.assignments.map((item) => [item.targetKind, item.targetRef, item.profileCode]), [
    ['FRAME', 'frame-root', '482.30'],
    ['MULLION', 'divider-1', '482.21'],
    ['MULLION', 'divider-2', '482.21'],
    ['SASH', 'field-2', '482.05'],
  ])
  for (const assignment of bridge.assignments) {
    assert.equal(assignment.layerTrace.productIntent, assignment.profileCode)
    assert.equal(assignment.layerTrace.constructionGraph, assignment.profileCode)
    assert.equal(assignment.layerTrace.drawing, assignment.profileCode)
    assert.equal(assignment.assignmentAuthority, 'EXPLICIT_PRODUCT_INTENT_PROPAGATION_ONLY')
    assert.equal(assignment.automaticProfileSelectionAllowed, false)
    assert.equal(assignment.geometryMutatedByBridge, false)
    assert.equal(assignment.productionApproved, false)
  }
})


test('AI05.3.4 accepts the real AI05.3 construction drawing shape and preserves the same canonical codes', () => {
  const intent = explicitPreludeIntent()
  const graph = buildFacadeFlowConstructionGraph(intent)
  const drawing = buildFacadeFlowConstructionDrawing(intent, graph)
  const bridge = buildFacadeFlowCanonicalProfileAssignmentBridge(intent, graph, drawing)

  assert.equal(bridge.status, 'READY_FOR_HUMAN_REVIEW')
  assert.deepEqual(bridge.assignments.map((item) => item.profileCode), ['482.30', '482.21', '482.21', '482.05'])
  assert.equal(bridge.conflicts.length, 0)
  assert.equal(bridge.automaticProfileSelectionAllowed, false)
})

test('AI05.3.4 keeps system-only intent unresolved instead of inventing 482.30 / 482.21 / 482.05', () => {
  const intent = explicitPreludeIntent()
  intent.profiles = { system: 'PRELUDE 60' }
  const graph = buildFacadeFlowConstructionGraph(intent)
  const drawing = drawingLikeFromGraph(graph)
  const bridge = buildFacadeFlowCanonicalProfileAssignmentBridge(intent, graph, drawing)

  assert.equal(bridge.status, 'NEEDS_EXPLICIT_PROFILE_ASSIGNMENT')
  assert.equal(bridge.assignments.length, 0)
  assert.deepEqual(bridge.missingExplicitAssignments, [
    'FRAME:frame-root',
    'MULLION:divider-1',
    'MULLION:divider-2',
    'SASH:field-2',
  ])
  assert.equal(bridge.automaticProfileSelectionAllowed, false)
})

test('AI05.3.4 blocks role mismatch or downstream assignment drift', () => {
  const roleMismatchIntent = explicitPreludeIntent()
  roleMismatchIntent.profiles.frame = '482.05'
  const mismatchGraph = buildFacadeFlowConstructionGraph(roleMismatchIntent)
  const mismatchBridge = buildFacadeFlowCanonicalProfileAssignmentBridge(
    roleMismatchIntent,
    mismatchGraph,
    drawingLikeFromGraph(mismatchGraph),
  )
  assert.equal(mismatchBridge.status, 'BLOCKED_CONFLICT')
  assert.match(mismatchBridge.conflicts.join('\n'), /ROLE_MISMATCH/)

  const driftIntent = explicitPreludeIntent()
  const driftGraph = buildFacadeFlowConstructionGraph(driftIntent)
  const driftDrawing = drawingLikeFromGraph(driftGraph)
  driftDrawing.mullions[0]!.profileRef = '482.30'
  const driftBridge = buildFacadeFlowCanonicalProfileAssignmentBridge(driftIntent, driftGraph, driftDrawing)
  assert.equal(driftBridge.status, 'BLOCKED_CONFLICT')
  assert.match(driftBridge.conflicts.join('\n'), /assignment drift/)
})

test('AI05.3.4 fails closed when a drawing target is missing instead of positionally guessing', () => {
  const intent = explicitPreludeIntent()
  const graph = buildFacadeFlowConstructionGraph(intent)
  const completeDrawing = drawingLikeFromGraph(graph)
  const drawing: FacadeFlowProfileAssignmentDrawingLike = {
    ...completeDrawing,
    mullions: completeDrawing.mullions.slice(1),
  }
  const bridge = buildFacadeFlowCanonicalProfileAssignmentBridge(intent, graph, drawing)

  assert.equal(bridge.status, 'BLOCKED_CONFLICT')
  assert.match(bridge.conflicts.join('\n'), /MULLION:divider-1 lost explicit profile 482\.21/)
  assert.equal(bridge.automaticProfileSelectionAllowed, false)
})

test('AI05.3.4 carries canonical assignments into conceptual 3D metadata without changing geometry or unlocking production', () => {
  const intent = explicitPreludeIntent()
  const graph = buildFacadeFlowConstructionGraph(intent)
  const bridge = buildFacadeFlowCanonicalProfileAssignmentBridge(intent, graph, drawingLikeFromGraph(graph))
  const scene = createScene('conceptual-profile-bridge', 'TEMPLATE', 'synthetic', 1800, 1400, 70, [
    barNode('frame-top', 'FRAME', 'frame-root', undefined, 1800, 42, 70, 0, 0),
    barNode('divider-1', 'DIVIDER', 'divider-1', undefined, 40, 1400, 63, -300, 0),
    barNode('divider-2', 'DIVIDER', 'divider-2', undefined, 40, 1400, 63, 300, 0),
    barNode('sash-field-2', 'SASH', 'field-2', undefined, 500, 1200, 52, 0, 0),
  ])
  const result = attachFacadeFlowCanonicalProfileAssignmentsToConceptual3D(scene, bridge)

  assert.deepEqual(result.nodes, scene.nodes)
  assert.deepEqual(result.profileAssignmentBridge?.assignments.map((item) => [item.role, item.targetRef, item.profileCode]), [
    ['FRAME', 'frame-root', '482.30'],
    ['MULLION', 'divider-1', '482.21'],
    ['MULLION', 'divider-2', '482.21'],
    ['SASH', 'field-2', '482.05'],
  ])
  assert.equal(result.profileAssignmentBridge?.automaticProfileSelectionAllowed, false)
  assert.equal(result.profileAssignmentBridge?.geometryMutatedByBridge, false)
  assert.equal(result.conceptualOnly, true)
  assert.equal(result.productionGeometryApproved, false)
  assert.equal(result.machineReady, false)
})

test('phase state and safety boundaries remain OPEN / WORKING with no production unlock', () => {
  assert.equal(PROFILE_DATA_03_3_STATE.parentStatus, 'OPEN / WORKING')
  assert.equal(PROFILE_DATA_03_3_STATE.stepStatus, 'WORKING')
  assert.equal(AI05_3_4_STATE.parentStatus, 'OPEN / WORKING')
  assert.equal(AI05_3_4_STATE.stepStatus, 'WORKING')
  assert.equal(AI05_3_4_STATE.rtp01Status, 'WORKING')

  assert.equal(PRELUDE_60_CANONICAL_PROFILE_IDENTITY_SAFETY.automaticProfileAssignmentAllowed, false)
  assert.equal(PRELUDE_60_CANONICAL_PROFILE_IDENTITY_SAFETY.automaticGeometryAllowed, false)
  assert.equal(PRELUDE_60_CANONICAL_PROFILE_IDENTITY_SAFETY.machineReady, false)
  assert.equal(PRELUDE_60_CANONICAL_PROFILE_IDENTITY_SAFETY.productionApproved, false)

  assert.equal(AI05_3_4_CANONICAL_PROFILE_ASSIGNMENT_BRIDGE_SAFETY.automaticProfileSelectionAllowed, false)
  assert.equal(AI05_3_4_CANONICAL_PROFILE_ASSIGNMENT_BRIDGE_SAFETY.productionUnlockAllowed, false)
  assert.equal(AI05_3_4_CANONICAL_PROFILE_ASSIGNMENT_BRIDGE_SAFETY.machineReady, false)
  assert.equal(AI05_3_4_CANONICAL_PROFILE_ASSIGNMENT_BRIDGE_SAFETY.productionApproved, false)
})
