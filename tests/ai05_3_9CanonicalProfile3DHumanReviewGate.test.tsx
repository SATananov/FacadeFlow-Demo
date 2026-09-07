import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { createFacadeFlowProductIntent } from '../src/aiProductIntent'
import { buildFacadeFlowConstructionGraph } from '../src/aiConstructionGraph'
import { buildFacadeFlowConstructionDrawing } from '../src/aiConstructionDrawing'
import {
  buildFacadeFlowParametricConstructionProposal,
  humanReviewFacadeFlowParametricProposal,
} from '../src/aiParametricConstructionProposal'
import { buildFacadeFlowCanonicalProfileAssignmentBridge } from '../src/aiCanonicalProfileAssignmentBridge'
import { buildCanonicalProfileRealConceptual3D } from '../src/aiCanonicalProfileRealConceptual3DScene'
import { buildCanonicalProfile3DInspectionEvidence } from '../src/aiCanonicalProfile3DInspectionEvidence'
import {
  AI05_3_9_HUMAN_REVIEW_GATE_SAFETY,
  AI05_3_9_STATE,
  buildCanonicalProfile3DHumanReviewGate,
  createCanonicalProfile3DHumanReviewRecord,
} from '../src/aiCanonicalProfile3DHumanReviewGate'
import { CanonicalProfile3DHumanReviewGatePanel } from '../src/components/CanonicalProfile3DHumanReviewGatePanel'

function explicitPreludeIntent() {
  const intent = createFacadeFlowProductIntent({
    id: 'ai05-3-9-human-review',
    sourceKind: 'MANUAL',
    sourceText: 'Explicit PRELUDE 60 fixture for human 3D canonical profile review.',
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
  const evidence = buildCanonicalProfile3DInspectionEvidence({ bridge, scene: result.scene })
  assert.equal(evidence.status, 'READY_FOR_HUMAN_INSPECTION')
  return evidence
}

function acceptRecord(evidence: ReturnType<typeof fixture>, index: number) {
  const row = evidence.rows[index]
  if (!row) throw new Error(`Missing evidence row ${index}`)
  return createCanonicalProfile3DHumanReviewRecord(evidence, {
    reviewId: `review-${index}`,
    targetKind: row.targetKind,
    targetRef: row.targetRef,
    reviewerRole: 'TECHNICAL_REVIEWER',
    reviewedAt: `2026-09-07T06:3${index}:00+03:00`,
    decision: 'ACCEPT',
  })
}

test('AI05.3.9 starts fail-closed with every canonical 3D evidence row explicitly unreviewed', () => {
  const evidence = fixture()
  const gate = buildCanonicalProfile3DHumanReviewGate({ evidence })

  assert.equal(gate.status, 'HUMAN_REVIEW_INCOMPLETE')
  assert.equal(gate.rows.length, 4)
  assert.equal(gate.unreviewedCount, 4)
  assert.ok(gate.rows.every((row) => row.state === 'UNREVIEWED'))
  assert.equal(gate.humanProfileReviewComplete, false)
  assert.equal(gate.productionUnlockAllowed, false)
})

test('AI05.3.9 reaches HUMAN_ACCEPTED_PRODUCTION_LOCKED only after every current evidence row is explicitly accepted', () => {
  const evidence = fixture()
  const records = evidence.rows.map((_, index) => acceptRecord(evidence, index))
  const gate = buildCanonicalProfile3DHumanReviewGate({ evidence, records })

  assert.equal(gate.status, 'HUMAN_ACCEPTED_PRODUCTION_LOCKED')
  assert.equal(gate.reviewedCount, 4)
  assert.equal(gate.acceptedCount, 4)
  assert.equal(gate.humanProfileReviewComplete, true)
  assert.equal(gate.humanProfileReviewAccepted, true)
  assert.equal(gate.automaticGeometryAllowed, false)
  assert.equal(gate.exactProfileContourApplied, false)
  assert.equal(gate.rulesValidated, false)
  assert.equal(gate.productionUnlockAllowed, false)
  assert.equal(gate.machineReady, false)
})

test('AI05.3.9 correction request is a human blocking decision and requires an explicit note', () => {
  const evidence = fixture()
  const row = evidence.rows[0]!

  assert.throws(() => createCanonicalProfile3DHumanReviewRecord(evidence, {
    reviewId: 'correction-without-note',
    targetKind: row.targetKind,
    targetRef: row.targetRef,
    reviewerRole: 'TECHNICAL_REVIEWER',
    reviewedAt: '2026-09-07T06:40:00+03:00',
    decision: 'REQUEST_CORRECTION',
  }), /requires an explicit human review note/)

  const record = createCanonicalProfile3DHumanReviewRecord(evidence, {
    reviewId: 'correction-with-note',
    targetKind: row.targetKind,
    targetRef: row.targetRef,
    reviewerRole: 'TECHNICAL_REVIEWER',
    reviewedAt: '2026-09-07T06:41:00+03:00',
    decision: 'REQUEST_CORRECTION',
    note: 'Провери профилното назначение преди нов човешки преглед.',
  })
  const gate = buildCanonicalProfile3DHumanReviewGate({ evidence, records: [record] })

  assert.equal(gate.status, 'HUMAN_CHANGES_REQUIRED')
  assert.equal(gate.correctionRequestedCount, 1)
  assert.equal(gate.changesRequired, true)
  assert.equal(gate.humanProfileReviewComplete, false)
})

test('AI05.3.9 rejection never infers or substitutes another profile', () => {
  const evidence = fixture()
  const row = evidence.rows.find((item) => item.targetKind === 'SASH')!
  const record = createCanonicalProfile3DHumanReviewRecord(evidence, {
    reviewId: 'reject-sash',
    targetKind: row.targetKind,
    targetRef: row.targetRef,
    reviewerRole: 'TECHNICAL_REVIEWER',
    reviewedAt: '2026-09-07T06:42:00+03:00',
    decision: 'REJECT',
    note: 'Грешен профил или грешен елемент.',
  })
  const gate = buildCanonicalProfile3DHumanReviewGate({ evidence, records: [record] })

  assert.equal(gate.status, 'HUMAN_CHANGES_REQUIRED')
  assert.equal(gate.rejectedCount, 1)
  assert.equal(gate.rows.find((item) => item.targetRef === row.targetRef)?.profileCode, '482.05')
  assert.equal(gate.automaticProfileSelectionAllowed, false)
  assert.equal(gate.canEditProfileAssignmentHere, false)
})

test('AI05.3.9 invalidates a prior human acceptance when the canonical 3D evidence trace changes', () => {
  const evidence = fixture()
  const record = acceptRecord(evidence, 0)
  evidence.rows[0]!.nodeIds = [...evidence.rows[0]!.nodeIds, 'changed-node-id']

  const gate = buildCanonicalProfile3DHumanReviewGate({ evidence, records: [record] })
  assert.equal(gate.status, 'STALE_REVIEW_REQUIRED')
  assert.equal(gate.staleCount, 1)
  assert.equal(gate.rows[0]?.state, 'STALE_REVIEW_REQUIRED')
  assert.equal(gate.humanProfileReviewAccepted, false)
})

test('AI05.3.9 blocks ambiguous duplicate active review records instead of choosing one', () => {
  const evidence = fixture()
  const accepted = acceptRecord(evidence, 0)
  const row = evidence.rows[0]!
  const rejected = createCanonicalProfile3DHumanReviewRecord(evidence, {
    reviewId: 'duplicate-reject',
    targetKind: row.targetKind,
    targetRef: row.targetRef,
    reviewerRole: 'TECHNICAL_REVIEWER',
    reviewedAt: '2026-09-07T06:43:00+03:00',
    decision: 'REJECT',
    note: 'Second active decision must not silently override the first.',
  })

  const gate = buildCanonicalProfile3DHumanReviewGate({ evidence, records: [accepted, rejected] })
  assert.equal(gate.status, 'BLOCKED_CONFLICT')
  assert.match(gate.conflicts.join('\n'), /multiple active human review records/)
})

test('AI05.3.9 refuses to record a human decision on blocked AI05.3.8 evidence', () => {
  const evidence = fixture()
  const row = evidence.rows[0]!
  evidence.status = 'BLOCKED_CONFLICT'
  evidence.conflicts.push('Synthetic blocking conflict for test.')

  assert.throws(() => createCanonicalProfile3DHumanReviewRecord(evidence, {
    reviewId: 'blocked-review',
    targetKind: row.targetKind,
    targetRef: row.targetRef,
    reviewerRole: 'TECHNICAL_REVIEWER',
    reviewedAt: '2026-09-07T06:44:00+03:00',
    decision: 'ACCEPT',
  }), /human 3D profile review cannot be recorded/)

  const gate = buildCanonicalProfile3DHumanReviewGate({ evidence })
  assert.equal(gate.status, 'BLOCKED_CONFLICT')
  assert.equal(gate.productionUnlockAllowed, false)
})

test('AI05.3.9 UI exposes explicit human decisions but no profile edit, geometry edit or production action', () => {
  const evidence = fixture()
  const html = renderToStaticMarkup(<CanonicalProfile3DHumanReviewGatePanel evidence={evidence} />)

  assert.match(html, /REAL 3D PROFILE EVIDENCE · HUMAN REVIEW DECISION/)
  assert.match(html, /Приемам съответствието/)
  assert.match(html, /Иска корекция/)
  assert.match(html, /Грешен профил \/ елемент/)
  assert.match(html, /Задължителна при искане за корекция или отказ/)
  assert.match(html, /PRODUCTION UNLOCK: НЕ/)
  assert.doesNotMatch(html, /Избери нов профил/)
  assert.doesNotMatch(html, /Machine ready: YES/)

  const parent = readFileSync('src/components/CanonicalProfileRealConceptual3DPanel.tsx', 'utf8')
  assert.match(parent, /CanonicalProfile3DHumanReviewGatePanel/)
  assert.match(parent, /evidence=\{inspection\}/)
})

test('AI05.3.9 remains WORKING and preserves every production safety boundary', () => {
  assert.equal(AI05_3_9_STATE.parentStatus, 'OPEN / WORKING')
  assert.equal(AI05_3_9_STATE.stepStatus, 'WORKING')
  assert.equal(AI05_3_9_STATE.profileData03Status, 'OPEN / WORKING')
  assert.equal(AI05_3_9_STATE.rtp01Status, 'WORKING')
  assert.equal(AI05_3_9_HUMAN_REVIEW_GATE_SAFETY.explicitHumanDecisionRequired, true)
  assert.equal(AI05_3_9_HUMAN_REVIEW_GATE_SAFETY.staleReviewInvalidationRequired, true)
  assert.equal(AI05_3_9_HUMAN_REVIEW_GATE_SAFETY.negativeDecisionNoteRequired, true)
  assert.equal(AI05_3_9_HUMAN_REVIEW_GATE_SAFETY.noProfileInference, true)
  assert.equal(AI05_3_9_HUMAN_REVIEW_GATE_SAFETY.noAssignmentEditing, true)
  assert.equal(AI05_3_9_HUMAN_REVIEW_GATE_SAFETY.noGeometryEditing, true)
  assert.equal(AI05_3_9_HUMAN_REVIEW_GATE_SAFETY.automaticProfileSelectionAllowed, false)
  assert.equal(AI05_3_9_HUMAN_REVIEW_GATE_SAFETY.automaticGeometryAllowed, false)
  assert.equal(AI05_3_9_HUMAN_REVIEW_GATE_SAFETY.exactProfileContourApplied, false)
  assert.equal(AI05_3_9_HUMAN_REVIEW_GATE_SAFETY.rulesValidated, false)
  assert.equal(AI05_3_9_HUMAN_REVIEW_GATE_SAFETY.productionUnlockAllowed, false)
  assert.equal(AI05_3_9_HUMAN_REVIEW_GATE_SAFETY.machineReady, false)
  assert.equal(AI05_3_9_HUMAN_REVIEW_GATE_SAFETY.productionApproved, false)
})
