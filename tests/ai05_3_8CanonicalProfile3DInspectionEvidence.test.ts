import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createFacadeFlowProductIntent } from '../src/aiProductIntent'
import { buildFacadeFlowConstructionGraph } from '../src/aiConstructionGraph'
import { buildFacadeFlowConstructionDrawing } from '../src/aiConstructionDrawing'
import {
  buildFacadeFlowParametricConstructionProposal,
  humanReviewFacadeFlowParametricProposal,
} from '../src/aiParametricConstructionProposal'
import { buildFacadeFlowCanonicalProfileAssignmentBridge } from '../src/aiCanonicalProfileAssignmentBridge'
import { buildCanonicalProfileRealConceptual3D } from '../src/aiCanonicalProfileRealConceptual3DScene'
import {
  AI05_3_8_3D_INSPECTION_SAFETY,
  AI05_3_8_STATE,
  buildCanonicalProfile3DInspectionEvidence,
  canonicalProfile3DInspectionRowForNode,
} from '../src/aiCanonicalProfile3DInspectionEvidence'

function explicitPreludeIntent() {
  const intent = createFacadeFlowProductIntent({
    id: 'ai05-3-8-inspection',
    sourceKind: 'MANUAL',
    sourceText: 'Explicit PRELUDE 60 fixture for real conceptual 3D inspection evidence.',
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

function fixture() {
  const intent = explicitPreludeIntent()
  const graph = buildFacadeFlowConstructionGraph(intent)
  const drawing = buildFacadeFlowConstructionDrawing(intent, graph)
  const bridge = buildFacadeFlowCanonicalProfileAssignmentBridge(intent, graph, drawing)
  const proposal = humanReviewFacadeFlowParametricProposal(
    buildFacadeFlowParametricConstructionProposal(intent),
    { topologyChecked: true, assumptionsAccepted: true },
  )
  const result = buildCanonicalProfileRealConceptual3D({
    proposal,
    drawing,
    bridge,
    conceptualDepthMm: 70,
  })
  assert.equal(result.status, 'READY_FOR_HUMAN_REVIEW')
  assert.ok(result.scene)
  if (!result.scene) throw new Error('Expected AI05.3.7 real conceptual scene.')
  return { bridge, scene: result.scene }
}

test('AI05.3.8 exposes read-only evidence rows for every canonical assignment on the real conceptual 3D scene', () => {
  const { bridge, scene } = fixture()
  const evidence = buildCanonicalProfile3DInspectionEvidence({ bridge, scene })

  assert.equal(evidence.status, 'READY_FOR_HUMAN_INSPECTION')
  assert.equal(evidence.rows.length, 4)
  assert.deepEqual(evidence.rows.map((row) => [row.targetKind, row.targetRef, row.profileCode, row.nodeCount]), [
    ['FRAME', 'frame-root', '482.30', 4],
    ['MULLION', 'divider-1', '482.21', 1],
    ['MULLION', 'divider-2', '482.21', 1],
    ['SASH', 'field-2', '482.05', 4],
  ])
  assert.ok(evidence.rows.every((row) => row.preservationState === 'PRESERVED_ON_REAL_SCENE_NODES'))
  assert.ok(evidence.rows.flatMap((row) => row.nodes).every((node) => node.visualBoundsOnly))
  assert.ok(evidence.rows.flatMap((row) => row.nodes).every((node) => !node.productionDimensionAvailable))
  assert.ok(evidence.rows.flatMap((row) => row.nodes).every((node) => !node.exactProfileContourAvailable))
  assert.equal(evidence.productionUnlockAllowed, false)
})

test('AI05.3.8 maps an actually selected WebGL node back to its canonical assignment trace', () => {
  const { bridge, scene } = fixture()
  const evidence = buildCanonicalProfile3DInspectionEvidence({ bridge, scene })
  const frameNodeId = evidence.rows.find((row) => row.targetKind === 'FRAME')?.nodeIds[0]
  assert.ok(frameNodeId)
  if (!frameNodeId) throw new Error('Expected frame node id.')

  const row = canonicalProfile3DInspectionRowForNode(evidence, frameNodeId)
  assert.equal(row?.targetKind, 'FRAME')
  assert.equal(row?.targetRef, 'frame-root')
  assert.equal(row?.profileCode, '482.30')

  const glazingNode = scene.nodes.find((node) => node.role === 'GLAZING')
  assert.ok(glazingNode)
  assert.equal(canonicalProfile3DInspectionRowForNode(evidence, glazingNode?.id ?? null), null)
})

test('AI05.3.8 fails closed if a real scene node loses its canonical sourcePath trace', () => {
  const { bridge, scene } = fixture()
  const node = scene.nodes.find((item) => item.role === 'DIVIDER' && item.sourcePath === 'divider-1')
  assert.ok(node)
  if (!node) throw new Error('Expected divider node.')
  node.sourcePath = 'changed-divider-path'

  const evidence = buildCanonicalProfile3DInspectionEvidence({ bridge, scene })
  assert.equal(evidence.status, 'BLOCKED_CONFLICT')
  assert.match(evidence.conflicts.join('\n'), /MULLION:divider-1 has no inspectable real 3D scene node/)
  assert.match(evidence.conflicts.join('\n'), /not covered by a canonical 3D inspection trace/)
})

test('AI05.3.8 fails closed if a real scene node profile code no longer preserves the canonical assignment', () => {
  const { bridge, scene } = fixture()
  const node = scene.nodes.find((item) => item.role === 'SASH' && item.sourcePath === 'field-2')
  assert.ok(node)
  if (!node) throw new Error('Expected sash node.')
  node.profileCode = '482.30'

  const evidence = buildCanonicalProfile3DInspectionEvidence({ bridge, scene })
  assert.equal(evidence.status, 'BLOCKED_CONFLICT')
  assert.match(evidence.conflicts.join('\n'), /SASH:field-2 real 3D node profile trace does not preserve 482\.05/)
})

test('AI05.3.8 rejects an untraced profile-bearing real scene node instead of inferring an assignment', () => {
  const { bridge, scene } = fixture()
  const frameNode = scene.nodes.find((item) => item.role === 'FRAME')
  assert.ok(frameNode)
  if (!frameNode) throw new Error('Expected frame node.')
  scene.nodes.push({
    ...frameNode,
    id: 'AI0538-ROGUE-PROFILE-NODE',
    sourcePath: 'rogue-source',
    profileCode: '999.99',
  })

  const evidence = buildCanonicalProfile3DInspectionEvidence({ bridge, scene })
  assert.equal(evidence.status, 'BLOCKED_CONFLICT')
  assert.match(evidence.conflicts.join('\n'), /AI0538-ROGUE-PROFILE-NODE carries profile code 999\.99 but is not covered/)
  assert.equal(evidence.automaticProfileSelectionAllowed, false)
})

test('AI05.3.8 UI binds evidence selection to the existing real WebGL selectedId without changing geometry', () => {
  const parent = readFileSync('src/components/CanonicalProfileRealConceptual3DPanel.tsx', 'utf8')
  assert.match(parent, /buildCanonicalProfile3DInspectionEvidence/)
  assert.match(parent, /<CanonicalProfile3DInspectionPanel/)
  assert.match(parent, /selectedNodeId=\{selectedId\}/)
  assert.match(parent, /onSelectNode=\{setSelectedId\}/)

  const panel = readFileSync('src/components/CanonicalProfile3DInspectionPanel.tsx', 'utf8')
  assert.match(panel, /REAL 3D PROFILE EVIDENCE · HUMAN INSPECTION/)
  assert.match(panel, /Покажи в 3D/)
  assert.match(panel, /visual bounds/)
  assert.match(panel, /AUTOMATIC GEOMETRY: NO/)
  assert.match(panel, /EXACT PROFILE CONTOUR: NO/)
  assert.match(panel, /PRODUCTION UNLOCK: NO/)
})

test('AI05.3.8 remains OPEN / WORKING and preserves every production safety boundary', () => {
  assert.equal(AI05_3_8_STATE.parentStatus, 'OPEN / WORKING')
  assert.equal(AI05_3_8_STATE.stepStatus, 'WORKING')
  assert.equal(AI05_3_8_STATE.profileData03Status, 'OPEN / WORKING')
  assert.equal(AI05_3_8_STATE.rtp01Status, 'WORKING')
  assert.equal(AI05_3_8_3D_INSPECTION_SAFETY.readOnlyInspectionOnly, true)
  assert.equal(AI05_3_8_3D_INSPECTION_SAFETY.realWebGlSceneOnly, true)
  assert.equal(AI05_3_8_3D_INSPECTION_SAFETY.visualBoundsOnly, true)
  assert.equal(AI05_3_8_3D_INSPECTION_SAFETY.noProfileInference, true)
  assert.equal(AI05_3_8_3D_INSPECTION_SAFETY.noGeometryEditing, true)
  assert.equal(AI05_3_8_3D_INSPECTION_SAFETY.automaticProfileSelectionAllowed, false)
  assert.equal(AI05_3_8_3D_INSPECTION_SAFETY.automaticGeometryAllowed, false)
  assert.equal(AI05_3_8_3D_INSPECTION_SAFETY.exactProfileContourApplied, false)
  assert.equal(AI05_3_8_3D_INSPECTION_SAFETY.rulesValidated, false)
  assert.equal(AI05_3_8_3D_INSPECTION_SAFETY.productionUnlockAllowed, false)
  assert.equal(AI05_3_8_3D_INSPECTION_SAFETY.machineReady, false)
  assert.equal(AI05_3_8_3D_INSPECTION_SAFETY.productionApproved, false)
})
