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
import { buildCanonicalProfileAssignmentHumanReview } from '../src/aiCanonicalProfileAssignmentHumanReview'
import {
  AI05_3_7_REAL_CONCEPTUAL_3D_SAFETY,
  AI05_3_7_STATE,
  buildCanonicalProfileRealConceptual3D,
} from '../src/aiCanonicalProfileRealConceptual3DScene'

function explicitPreludeIntent() {
  const intent = createFacadeFlowProductIntent({
    id: 'ai05-3-7-real-scene',
    sourceKind: 'MANUAL',
    sourceText: 'Explicit PRELUDE 60 profile assignment fixture for real conceptual 3D.',
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
  const baseProposal = buildFacadeFlowParametricConstructionProposal(intent)
  const proposal = humanReviewFacadeFlowParametricProposal(baseProposal, {
    topologyChecked: true,
    assumptionsAccepted: true,
  })
  return { intent, graph, drawing, bridge, baseProposal, proposal }
}

test('AI05.3.7 withholds the real conceptual 3D scene until topology is explicitly human-reviewed', () => {
  const { drawing, bridge, baseProposal } = fixture()
  const result = buildCanonicalProfileRealConceptual3D({
    proposal: baseProposal,
    drawing,
    bridge,
    conceptualDepthMm: 70,
  })

  assert.equal(result.status, 'WAITING_FOR_HUMAN_REVIEW')
  assert.equal(result.scene, null)
  assert.equal(result.bindings.length, 0)
  assert.equal(result.automaticGeometryAllowed, false)
  assert.equal(result.productionUnlockAllowed, false)
})

test('AI05.3.7 creates a real Product3DScene only from human-reviewed conceptual topology and preserves canonical profile codes on scene nodes', () => {
  const { drawing, bridge, proposal } = fixture()
  assert.equal(proposal.status, 'HUMAN_REVIEWED')
  const result = buildCanonicalProfileRealConceptual3D({
    proposal,
    drawing,
    bridge,
    conceptualDepthMm: 70,
  })

  assert.equal(result.status, 'READY_FOR_HUMAN_REVIEW')
  const scene = result.scene
  assert.ok(scene)
  if (!scene) throw new Error('Expected real conceptual 3D scene.')
  assert.equal(scene.sourceType, 'HUMAN_REVIEWED_AI')
  assert.equal(scene.conceptualOnly, true)
  assert.equal(scene.productionGeometryApproved, false)
  assert.equal(scene.machineReady, false)
  assert.deepEqual(scene.profileAssignmentBridge?.assignments.map((item) => [item.role, item.targetRef, item.profileCode]), [
    ['FRAME', 'frame-root', '482.30'],
    ['MULLION', 'divider-1', '482.21'],
    ['MULLION', 'divider-2', '482.21'],
    ['SASH', 'field-2', '482.05'],
  ])

  assert.equal(result.bindings.length, 4)
  assert.ok(result.bindings.every((item) => item.sceneProfilePreserved))
  assert.equal(result.bindings.find((item) => item.targetKind === 'FRAME')?.nodeIds.length, 4)
  assert.equal(result.bindings.find((item) => item.targetRef === 'divider-1')?.nodeIds.length, 1)
  assert.equal(result.bindings.find((item) => item.targetRef === 'field-2')?.nodeIds.length, 4)

  const frameNodes = scene.nodes.filter((node) => node.role === 'FRAME' && node.sourcePath === 'frame-root')
  const mullionNodes = scene.nodes.filter((node) => node.role === 'DIVIDER')
  const sashNodes = scene.nodes.filter((node) => node.role === 'SASH' && node.sourcePath === 'field-2')
  assert.ok(frameNodes.every((node) => node.profileCode === '482.30'))
  assert.ok(mullionNodes.every((node) => node.profileCode === '482.21'))
  assert.ok(sashNodes.every((node) => node.profileCode === '482.05'))
})

test('AI05.3.7 reuses AI05.3.5 for true bridge-vs-real-scene end-to-end review', () => {
  const { drawing, bridge, proposal } = fixture()
  const result = buildCanonicalProfileRealConceptual3D({ proposal, drawing, bridge, conceptualDepthMm: 70 })
  const scene = result.scene
  assert.ok(scene)
  if (!scene) throw new Error('Expected real conceptual 3D scene.')
  const review = buildCanonicalProfileAssignmentHumanReview({ bridge, scene })

  assert.equal(review.status, 'READY_FOR_HUMAN_REVIEW')
  assert.ok(review.rows.every((row) => row.endToEndState === 'PRESERVED_END_TO_END'))
  assert.deepEqual(review.rows.map((row) => row.conceptual3DCode), ['482.30', '482.21', '482.21', '482.05'])
  assert.equal(review.productionUnlockAllowed, false)
})

test('AI05.3.7 fails closed if a real scene node would carry a profile code different from the canonical assignment', () => {
  const { drawing, bridge, proposal } = fixture()
  drawing.mullions[0]!.profileRef = '482.30'
  const result = buildCanonicalProfileRealConceptual3D({ proposal, drawing, bridge, conceptualDepthMm: 70 })

  assert.equal(result.status, 'BLOCKED_CONFLICT')
  assert.equal(result.scene, null)
  assert.match(result.conflicts.join('\n'), /node profile code does not preserve canonical assignment 482\.21/)
})

test('AI05.3.7 fails closed if human-reviewed topology and Drawing no longer describe the same geometry', () => {
  const { drawing, bridge, proposal } = fixture()
  drawing.fields[0]!.rect.widthRatio += 0.05
  const result = buildCanonicalProfileRealConceptual3D({ proposal, drawing, bridge, conceptualDepthMm: 70 })

  assert.equal(result.status, 'BLOCKED_CONFLICT')
  assert.equal(result.scene, null)
  assert.match(result.conflicts.join('\n'), /geometry differs between the human-reviewed proposal and AI05\.3 Drawing/)
})

test('AI05.3.7 integration replaces the pending trace with real conceptual 3D only after HUMAN_REVIEWED', () => {
  const source = readFileSync('src/components/ParametricConstructionProposalPanel.tsx', 'utf8')
  assert.match(source, /proposal\.status !== 'HUMAN_REVIEWED' && <CanonicalProfileAssignmentWorkspaceTracePanel/)
  assert.match(source, /proposal\.status === 'HUMAN_REVIEWED' && <CanonicalProfileRealConceptual3DPanel/)

  const panel = readFileSync('src/components/CanonicalProfileRealConceptual3DPanel.tsx', 'utf8')
  assert.match(panel, /REAL CONCEPTUAL 3D · CANONICAL PROFILE BINDING/)
  assert.match(panel, /<Product3DPreview/)
  assert.match(panel, /buildCanonicalProfileAssignmentHumanReview/)
  assert.match(panel, /AUTOMATIC GEOMETRY: NO/)
  assert.match(panel, /EXACT PROFILE CONTOUR: NO/)
  assert.match(panel, /PRODUCTION UNLOCK: NO/)
})

test('AI05.3.7 remains OPEN / WORKING and preserves every production safety boundary', () => {
  assert.equal(AI05_3_7_STATE.parentStatus, 'OPEN / WORKING')
  assert.equal(AI05_3_7_STATE.stepStatus, 'WORKING')
  assert.equal(AI05_3_7_STATE.profileData03Status, 'OPEN / WORKING')
  assert.equal(AI05_3_7_STATE.rtp01Status, 'WORKING')
  assert.equal(AI05_3_7_REAL_CONCEPTUAL_3D_SAFETY.realWebGlSceneFromHumanReviewedTopologyOnly, true)
  assert.equal(AI05_3_7_REAL_CONCEPTUAL_3D_SAFETY.syntheticSceneStubAllowed, false)
  assert.equal(AI05_3_7_REAL_CONCEPTUAL_3D_SAFETY.noNewTopology, true)
  assert.equal(AI05_3_7_REAL_CONCEPTUAL_3D_SAFETY.automaticProfileSelectionAllowed, false)
  assert.equal(AI05_3_7_REAL_CONCEPTUAL_3D_SAFETY.automaticGeometryAllowed, false)
  assert.equal(AI05_3_7_REAL_CONCEPTUAL_3D_SAFETY.exactProfileContourApplied, false)
  assert.equal(AI05_3_7_REAL_CONCEPTUAL_3D_SAFETY.rulesValidated, false)
  assert.equal(AI05_3_7_REAL_CONCEPTUAL_3D_SAFETY.productionUnlockAllowed, false)
  assert.equal(AI05_3_7_REAL_CONCEPTUAL_3D_SAFETY.machineReady, false)
  assert.equal(AI05_3_7_REAL_CONCEPTUAL_3D_SAFETY.productionApproved, false)
})
