import assert from 'node:assert/strict'
import test from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  AI05_3_5_HUMAN_REVIEW_SAFETY,
  AI05_3_5_STATE,
  buildCanonicalProfileAssignmentHumanReview,
} from '../src/aiCanonicalProfileAssignmentHumanReview'
import type {
  FacadeFlowCanonicalProfileAssignment,
  FacadeFlowCanonicalProfileAssignmentBridge,
} from '../src/aiCanonicalProfileAssignmentBridge'
import { CanonicalProfileAssignmentReviewPanel } from '../src/components/CanonicalProfileAssignmentReviewPanel'
import type {
  Conceptual3DCanonicalProfileAssignment,
  Product3DScene,
} from '../src/threeDTypes'

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

function conceptual(item: FacadeFlowCanonicalProfileAssignment): Conceptual3DCanonicalProfileAssignment {
  return {
    targetKind: item.targetKind,
    targetRef: item.targetRef,
    systemId: item.canonicalIdentity.systemId,
    systemLabel: item.canonicalIdentity.systemLabel,
    role: item.role,
    profileCode: item.profileCode,
    source: 'AI05.3.4_EXPLICIT_PRODUCT_INTENT_PROPAGATION',
    explicit: true,
    automaticProfileSelectionAllowed: false,
    exactProfileContourApplied: false,
    productionGeometryApproved: false,
    machineReady: false,
    productionApproved: false,
  }
}

function fixture() {
  const assignments = [
    assignment('FRAME', 'frame-root', 'FRAME', '482.30'),
    assignment('MULLION', 'divider-1', 'MULLION', '482.21'),
    assignment('MULLION', 'divider-2', 'MULLION', '482.21'),
    assignment('SASH', 'field-2', 'SASH', '482.05'),
  ]

  const bridge: FacadeFlowCanonicalProfileAssignmentBridge = {
    version: 'AI05.3.4',
    sourceIntentId: 'review-fixture',
    sourceGraphVersion: 'AI05.2',
    status: 'READY_FOR_HUMAN_REVIEW',
    assignments,
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

  const scene: Product3DScene = {
    id: 'review-scene',
    sourceType: 'TEMPLATE',
    sourceReference: 'synthetic-review-fixture',
    bounds: { width: 1800, height: 1400, depth: 70 },
    nodes: [],
    conceptualDepthMm: 70,
    conceptualOnly: true,
    profileAssignmentBridge: {
      version: 'AI05.3.4',
      status: 'READY_FOR_HUMAN_REVIEW',
      assignments: assignments.map(conceptual),
      missingExplicitAssignments: [],
      conflicts: [],
      automaticProfileSelectionAllowed: false,
      exactProfileContourApplied: false,
      geometryMutatedByBridge: false,
      productionGeometryApproved: false,
      machineReady: false,
      productionApproved: false,
    },
    productionGeometryApproved: false,
    machineReady: false,
  }

  return { bridge, scene }
}

test('AI05.3.5 exposes FRAME 482.30, MULLION 482.21 and SASH 482.05 as read-only end-to-end review rows', () => {
  const { bridge, scene } = fixture()
  const review = buildCanonicalProfileAssignmentHumanReview({ bridge, scene })

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
    assert.equal(row.conceptual3DCode, row.profileCode)
    assert.equal(row.endToEndState, 'PRESERVED_END_TO_END')
    assert.equal(row.readOnly, true)
    assert.equal(row.productionUnlockAllowed, false)
  }
})

test('AI05.3.5 never invents a profile for a missing explicit assignment', () => {
  const { bridge, scene } = fixture()
  bridge.assignments = []
  bridge.status = 'NEEDS_EXPLICIT_PROFILE_ASSIGNMENT'
  bridge.missingExplicitAssignments = ['FRAME:frame-root', 'MULLION:divider-1', 'SASH:field-2']
  scene.profileAssignmentBridge!.assignments = []
  scene.profileAssignmentBridge!.status = 'NEEDS_EXPLICIT_PROFILE_ASSIGNMENT'
  scene.profileAssignmentBridge!.missingExplicitAssignments = [...bridge.missingExplicitAssignments]

  const review = buildCanonicalProfileAssignmentHumanReview({ bridge, scene })
  assert.equal(review.status, 'NEEDS_EXPLICIT_PROFILE_ASSIGNMENT')
  assert.equal(review.rows.length, 0)
  assert.deepEqual(review.missingExplicitAssignments, bridge.missingExplicitAssignments)
  assert.equal(review.automaticProfileSelectionAllowed, false)
})

test('AI05.3.5 blocks review if conceptual 3D loses a canonical assignment', () => {
  const { bridge, scene } = fixture()
  scene.profileAssignmentBridge!.assignments = scene.profileAssignmentBridge!.assignments.filter(
    (item) => item.targetRef !== 'divider-1',
  )

  const review = buildCanonicalProfileAssignmentHumanReview({ bridge, scene })
  assert.equal(review.status, 'BLOCKED_CONFLICT')
  assert.equal(
    review.rows.find((row) => row.targetRef === 'divider-1')?.endToEndState,
    'CONCEPTUAL_3D_ASSIGNMENT_MISSING',
  )
  assert.match(review.conflicts.join('\n'), /missing from conceptual 3D metadata/)
})

test('AI05.3.5 blocks review if conceptual 3D changes canonical identity', () => {
  const { bridge, scene } = fixture()
  const frame = scene.profileAssignmentBridge!.assignments.find((item) => item.targetRef === 'frame-root')!
  frame.profileCode = '482.05'
  frame.role = 'SASH'

  const review = buildCanonicalProfileAssignmentHumanReview({ bridge, scene })
  assert.equal(review.status, 'BLOCKED_CONFLICT')
  assert.equal(
    review.rows.find((row) => row.targetRef === 'frame-root')?.endToEndState,
    'CONCEPTUAL_3D_ASSIGNMENT_MISMATCH',
  )
  assert.match(review.conflicts.join('\n'), /does not match the AI05\.3\.4 bridge/)
})


test('AI05.3.5 fails closed when the AI05.3.4 source trace is missing instead of visually filling it from the canonical code', () => {
  const { bridge, scene } = fixture()
  bridge.assignments[0]!.layerTrace.drawing = undefined

  const review = buildCanonicalProfileAssignmentHumanReview({ bridge, scene })
  const frame = review.rows.find((row) => row.targetRef === 'frame-root')!
  assert.equal(review.status, 'BLOCKED_CONFLICT')
  assert.equal(frame.drawingCode, undefined)
  assert.equal(frame.endToEndState, 'SOURCE_TRACE_MISSING_OR_MISMATCH')
  assert.match(review.conflicts.join('\n'), /source trace is missing/)
})

test('AI05.3.5 blocks a conceptual 3D assignment that has no AI05.3.4 source assignment', () => {
  const { bridge, scene } = fixture()
  scene.profileAssignmentBridge!.assignments.push({
    ...scene.profileAssignmentBridge!.assignments[0]!,
    targetKind: 'SASH',
    targetRef: 'invented-downstream-target',
    role: 'SASH',
    profileCode: '482.05',
  })

  const review = buildCanonicalProfileAssignmentHumanReview({ bridge, scene })
  assert.equal(review.status, 'BLOCKED_CONFLICT')
  assert.match(review.conflicts.join('\n'), /without an AI05\.3\.4 source assignment/)
})

test('AI05.3.5 review panel renders canonical codes and exposes no edit or production action controls', () => {
  const { bridge, scene } = fixture()
  const review = buildCanonicalProfileAssignmentHumanReview({ bridge, scene })
  const html = renderToStaticMarkup(<CanonicalProfileAssignmentReviewPanel review={review} />)

  assert.match(html, /482\.30/)
  assert.match(html, /482\.21/)
  assert.match(html, /482\.05/)
  assert.match(html, /Само за преглед/)
  assert.match(html, /Machine ready: NO/)
  assert.doesNotMatch(html, /<button/)
  assert.doesNotMatch(html, /<input/)
  assert.doesNotMatch(html, /<select/)
  assert.doesNotMatch(html, /<form/)
})

test('AI05.3.5 remains WORKING and keeps every production boundary locked', () => {
  assert.equal(AI05_3_5_STATE.parentStatus, 'OPEN / WORKING')
  assert.equal(AI05_3_5_STATE.stepStatus, 'WORKING')
  assert.equal(AI05_3_5_STATE.profileData03Status, 'OPEN / WORKING')
  assert.equal(AI05_3_5_STATE.rtp01Status, 'WORKING')
  assert.equal(AI05_3_5_HUMAN_REVIEW_SAFETY.readOnlyReviewOnly, true)
  assert.equal(AI05_3_5_HUMAN_REVIEW_SAFETY.noProfileInference, true)
  assert.equal(AI05_3_5_HUMAN_REVIEW_SAFETY.automaticProfileSelectionAllowed, false)
  assert.equal(AI05_3_5_HUMAN_REVIEW_SAFETY.automaticGeometryAllowed, false)
  assert.equal(AI05_3_5_HUMAN_REVIEW_SAFETY.productionUnlockAllowed, false)
  assert.equal(AI05_3_5_HUMAN_REVIEW_SAFETY.machineReady, false)
  assert.equal(AI05_3_5_HUMAN_REVIEW_SAFETY.productionApproved, false)
})
