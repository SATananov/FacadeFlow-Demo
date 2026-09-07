import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import {
  AI05_3_6_STATE,
  AI05_3_6_WORKSPACE_REVIEW_SAFETY,
  buildCanonicalProfileAssignmentWorkspaceReview,
} from '../src/aiCanonicalProfileAssignmentWorkspaceReview'
import type {
  FacadeFlowCanonicalProfileAssignment,
  FacadeFlowCanonicalProfileAssignmentBridge,
} from '../src/aiCanonicalProfileAssignmentBridge'

function assignment(
  targetKind: 'FRAME' | 'MULLION' | 'SASH',
  targetRef: string,
  role: 'FRAME' | 'MULLION' | 'SASH',
  profileCode: '482.30' | '482.21' | '482.05',
): FacadeFlowCanonicalProfileAssignment {
  return {
    targetKind,
    targetRef,
    role,
    profileCode,
    canonicalIdentity: {
      systemId: 'PRELUDE_60',
      systemLabel: 'PRELUDE 60',
      role,
      profileCode,
      identityAuthority: 'PROFILE_IDENTITY_ONLY',
      exactContourAuthority: 'NOT_ESTABLISHED',
      geometryAuthority: 'NONE',
      automaticProfileAssignmentAllowed: false,
      automaticSystemAssignmentAllowed: false,
      machineReady: false,
      productionApproved: false,
    },
    layerTrace: {
      productIntent: profileCode,
      constructionGraph: profileCode,
      drawing: profileCode,
    },
    assignmentAuthority: 'EXPLICIT_PRODUCT_INTENT_PROPAGATION_ONLY',
    automaticProfileSelectionAllowed: false,
    exactProfileContourApplied: false,
    geometryMutatedByBridge: false,
    machineReady: false,
    productionApproved: false,
  }
}

function bridgeFixture(): FacadeFlowCanonicalProfileAssignmentBridge {
  return {
    version: 'AI05.3.4',
    sourceIntentId: 'ai05-3-6-fixture',
    sourceGraphVersion: 'AI05.2',
    status: 'READY_FOR_HUMAN_REVIEW',
    assignments: [
      assignment('FRAME', 'frame-root', 'FRAME', '482.30'),
      assignment('MULLION', 'divider-1', 'MULLION', '482.21'),
      assignment('MULLION', 'divider-2', 'MULLION', '482.21'),
      assignment('SASH', 'field-2', 'SASH', '482.05'),
    ],
    missingExplicitAssignments: [],
    conflicts: [],
    warnings: [],
    humanReviewRequired: true,
    automaticProfileSelectionAllowed: false,
    automaticGeometryAllowed: false,
    exactProfileContourApplied: false,
    geometryMutatedByBridge: false,
    rulesValidated: false,
    simulationOnly: true,
    machineReady: false,
    productionApproved: false,
  }
}

test('AI05.3.6 preserves FRAME 482.30, MULLION 482.21 and SASH 482.05 as read-only workspace trace rows', () => {
  const review = buildCanonicalProfileAssignmentWorkspaceReview(bridgeFixture())

  assert.equal(review.status, 'READY_FOR_HUMAN_REVIEW')
  assert.deepEqual(review.rows.map((row) => [row.role, row.targetRef, row.profileCode]), [
    ['FRAME', 'frame-root', '482.30'],
    ['MULLION', 'divider-1', '482.21'],
    ['MULLION', 'divider-2', '482.21'],
    ['SASH', 'field-2', '482.05'],
  ])
  for (const row of review.rows) {
    assert.equal(row.productIntentCode, row.profileCode)
    assert.equal(row.constructionGraphCode, row.profileCode)
    assert.equal(row.drawingCode, row.profileCode)
    assert.equal(row.traceState, 'PRESERVED_TO_DRAWING')
    assert.equal(row.conceptual3DReviewState, 'PENDING_REAL_CONCEPTUAL_3D_SCENE')
    assert.equal(row.readOnly, true)
    assert.equal(row.productionUnlockAllowed, false)
  }
})

test('AI05.3.6 keeps missing explicit assignments unresolved instead of inventing defaults', () => {
  const bridge = bridgeFixture()
  bridge.assignments = []
  bridge.status = 'NEEDS_EXPLICIT_PROFILE_ASSIGNMENT'
  bridge.missingExplicitAssignments = ['FRAME:frame-root', 'MULLION:divider-1', 'SASH:field-2']

  const review = buildCanonicalProfileAssignmentWorkspaceReview(bridge)
  assert.equal(review.status, 'NEEDS_EXPLICIT_PROFILE_ASSIGNMENT')
  assert.equal(review.rows.length, 0)
  assert.deepEqual(review.missingExplicitAssignments, bridge.missingExplicitAssignments)
  assert.equal(review.automaticProfileSelectionAllowed, false)
})

test('AI05.3.6 fails closed if the source trace is missing or changed before Drawing', () => {
  const bridge = bridgeFixture()
  bridge.assignments[0]!.layerTrace.drawing = undefined

  const review = buildCanonicalProfileAssignmentWorkspaceReview(bridge)
  assert.equal(review.status, 'BLOCKED_CONFLICT')
  assert.equal(review.rows[0]!.traceState, 'SOURCE_TRACE_MISSING_OR_MISMATCH')
  assert.match(review.conflicts.join('\n'), /source trace is missing or changed/)
})

test('AI05.3.6 integration mounts in ParametricConstructionProposalPanel where Intent, Graph and Drawing already exist', () => {
  const source = readFileSync('src/components/ParametricConstructionProposalPanel.tsx', 'utf8')
  assert.match(source, /buildFacadeFlowCanonicalProfileAssignmentBridge\(intent, constructionGraph, constructionDrawing\)/)
  assert.match(source, /buildCanonicalProfileAssignmentWorkspaceReview\(canonicalProfileBridge\)/)
  assert.match(source, /CanonicalProfileAssignmentWorkspaceTracePanel review=\{canonicalProfileWorkspaceReview\}/)
})

test('AI05.3.6 workspace panel is read-only and explicitly refuses synthetic 3D completion', () => {
  const source = readFileSync('src/components/CanonicalProfileAssignmentWorkspaceTracePanel.tsx', 'utf8')
  assert.match(source, /Conceptual 3D end-to-end review: ЧАКА РЕАЛНА 3D SCENE/)
  assert.match(source, /SYNTHETIC 3D SCENE: НЕ/)
  assert.doesNotMatch(source, /<input/)
  assert.doesNotMatch(source, /<select/)
  assert.doesNotMatch(source, /<textarea/)
  assert.doesNotMatch(source, /<button/)
  assert.doesNotMatch(source, /onChange=/)
  assert.doesNotMatch(source, /onClick=/)
})

test('AI05.3.6 does not weaken AI05.3.5 end-to-end conceptual 3D review semantics', () => {
  const source = readFileSync('src/aiCanonicalProfileAssignmentHumanReview.ts', 'utf8')
  assert.match(source, /Conceptual 3D profileAssignmentBridge metadata is missing; end-to-end profile preservation cannot be reviewed\./)
  assert.match(source, /BLOCKED_CONFLICT/)
  assert.doesNotMatch(source, /PENDING_REAL_CONCEPTUAL_3D_SCENE/)
})

test('AI05.3.6 remains WORKING and leaves every production boundary locked', () => {
  assert.equal(AI05_3_6_STATE.parentStatus, 'OPEN / WORKING')
  assert.equal(AI05_3_6_STATE.stepStatus, 'WORKING')
  assert.equal(AI05_3_6_STATE.profileData03Status, 'OPEN / WORKING')
  assert.equal(AI05_3_6_STATE.rtp01Status, 'WORKING')
  assert.equal(AI05_3_6_WORKSPACE_REVIEW_SAFETY.readOnlyReviewOnly, true)
  assert.equal(AI05_3_6_WORKSPACE_REVIEW_SAFETY.conceptual3DReviewRequiresRealScene, true)
  assert.equal(AI05_3_6_WORKSPACE_REVIEW_SAFETY.syntheticConceptual3DSceneAllowed, false)
  assert.equal(AI05_3_6_WORKSPACE_REVIEW_SAFETY.automaticProfileSelectionAllowed, false)
  assert.equal(AI05_3_6_WORKSPACE_REVIEW_SAFETY.automaticGeometryAllowed, false)
  assert.equal(AI05_3_6_WORKSPACE_REVIEW_SAFETY.productionUnlockAllowed, false)
  assert.equal(AI05_3_6_WORKSPACE_REVIEW_SAFETY.machineReady, false)
  assert.equal(AI05_3_6_WORKSPACE_REVIEW_SAFETY.productionApproved, false)
})
