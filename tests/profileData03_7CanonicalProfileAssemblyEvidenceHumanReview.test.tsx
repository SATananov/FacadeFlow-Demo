import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createFacadeFlowProductIntent } from '../src/aiProductIntent'
import { buildFacadeFlowConstructionGraph } from '../src/aiConstructionGraph'
import { buildFacadeFlowConstructionDrawing } from '../src/aiConstructionDrawing'
import { buildFacadeFlowCanonicalProfileAssignmentBridge } from '../src/aiCanonicalProfileAssignmentBridge'
import { buildCanonicalProfileTechnicalSemanticsBridge } from '../src/aiCanonicalProfileTechnicalSemanticsBridge'
import { buildCanonicalProfileCompatibilitySemanticsBridge } from '../src/aiCanonicalProfileCompatibilitySemanticsBridge'
import { buildCanonicalProfileAssemblyEvidenceBridge } from '../src/aiCanonicalProfileAssemblyEvidenceBridge'
import {
  buildCanonicalProfileAssemblyEvidenceHumanReviewGate,
  canonicalProfileAssemblyEvidenceStateKey,
  createCanonicalProfileAssemblyEvidenceHumanReviewRecord,
  PROFILE_DATA_03_7_HUMAN_REVIEW_SAFETY,
  PROFILE_DATA_03_7_STATE,
} from '../src/aiCanonicalProfileAssemblyEvidenceHumanReview'

function evidenceFixture() {
  const intent = createFacadeFlowProductIntent({
    id: 'profile-data03-7-assembly-evidence-review',
    sourceKind: 'MANUAL',
    sourceText: 'Explicit PRELUDE 60 assembly evidence human review fixture.',
    aiGenerated: false,
  })
  intent.category = 'WINDOW'
  intent.dimensions = { widthMm: 1800, heightMm: 1400 }
  intent.profiles = { system: 'PRELUDE 60', frame: '482.30', mullion: '482.21', sash: '482.05' }
  intent.fields = [
    { id: 'field-1', order: 0, role: 'FIXED', evidenceIds: [], unresolved: [] },
    { id: 'field-2', order: 1, role: 'OPENING_SASH', openingType: 'TILT_TURN', openingDirection: 'RIGHT', evidenceIds: [], unresolved: [] },
    { id: 'field-3', order: 2, role: 'FIXED', evidenceIds: [], unresolved: [] },
  ]
  intent.dividers = [
    { id: 'divider-1', orientation: 'VERTICAL', positionRatio: 0.33, evidenceIds: [], unresolved: [] },
    { id: 'divider-2', orientation: 'VERTICAL', positionRatio: 0.66, evidenceIds: [], unresolved: [] },
  ]
  intent.unresolved = []

  const graph = buildFacadeFlowConstructionGraph(intent)
  const drawing = buildFacadeFlowConstructionDrawing(intent, graph)
  const assignments = buildFacadeFlowCanonicalProfileAssignmentBridge(intent, graph, drawing)
  const technical = buildCanonicalProfileTechnicalSemanticsBridge(assignments)
  const compatibility = buildCanonicalProfileCompatibilitySemanticsBridge(technical)
  return buildCanonicalProfileAssemblyEvidenceBridge(compatibility)
}

function acceptRecord(bridge: ReturnType<typeof evidenceFixture>, index: number) {
  const row = bridge.rows[index]
  if (!row) throw new Error(`Missing assembly evidence row ${index}`)
  return createCanonicalProfileAssemblyEvidenceHumanReviewRecord(bridge, {
    reviewId: `evidence-review-${index}`,
    relation: row.relation,
    reviewerRole: 'TECHNICAL_REVIEWER',
    reviewedAt: `2026-09-07T07:3${index}:00+03:00`,
    decision: 'ACCEPT_CURRENT_EVIDENCE',
  })
}

test('PROFILE DATA 03.7 starts with every current assembly evidence relation explicitly unreviewed', () => {
  const bridge = evidenceFixture()
  const gate = buildCanonicalProfileAssemblyEvidenceHumanReviewGate({ bridge })
  assert.equal(gate.status, 'HUMAN_REVIEW_INCOMPLETE')
  assert.equal(gate.rows.length, 3)
  assert.equal(gate.unreviewedCount, 3)
  assert.ok(gate.rows.every((row) => row.state === 'UNREVIEWED'))
  assert.equal(gate.humanEvidenceReviewAccepted, false)
  assert.equal(gate.productionUnlockAllowed, false)
})

test('PROFILE DATA 03.7 accepts only the current evidence classification and keeps production locked', () => {
  const bridge = evidenceFixture()
  const records = bridge.rows.map((_, index) => acceptRecord(bridge, index))
  const gate = buildCanonicalProfileAssemblyEvidenceHumanReviewGate({ bridge, records })

  assert.equal(gate.status, 'HUMAN_REVIEWED_PRODUCTION_LOCKED')
  assert.equal(gate.acceptedCount, 3)
  assert.equal(gate.humanEvidenceReviewComplete, true)
  assert.equal(gate.humanEvidenceReviewAccepted, true)
  assert.equal(gate.decisionScope, 'CURRENT_EVIDENCE_CLASSIFICATION_ONLY')
  assert.equal(gate.manufacturerAssemblyCompatibilityValidated, false)
  assert.equal(gate.verifiedAssemblyNodeEvidence, false)
  assert.equal(gate.exactJointGeometryVerified, false)
  assert.equal(gate.productionCompatibilityValidated, false)
  assert.equal(gate.productionUnlockAllowed, false)
  assert.equal(gate.machineReady, false)
})

test('PROFILE DATA 03.7 requires a human note when more evidence is requested', () => {
  const bridge = evidenceFixture()
  const relation = bridge.rows[0]!.relation
  assert.throws(() => createCanonicalProfileAssemblyEvidenceHumanReviewRecord(bridge, {
    reviewId: 'need-more-without-note',
    relation,
    reviewerRole: 'TECHNICAL_REVIEWER',
    reviewedAt: '2026-09-07T07:40:00+03:00',
    decision: 'REQUEST_MORE_EVIDENCE',
  }), /requires an explicit human review note/)

  const record = createCanonicalProfileAssemblyEvidenceHumanReviewRecord(bridge, {
    reviewId: 'need-more-with-note',
    relation,
    reviewerRole: 'TECHNICAL_REVIEWER',
    reviewedAt: '2026-09-07T07:41:00+03:00',
    decision: 'REQUEST_MORE_EVIDENCE',
    note: 'Need manufacturer assembly-node or equivalent explicit evidence.',
  })
  const gate = buildCanonicalProfileAssemblyEvidenceHumanReviewGate({ bridge, records: [record] })
  assert.equal(gate.status, 'HUMAN_MORE_EVIDENCE_REQUIRED')
  assert.equal(gate.moreEvidenceRequiredCount, 1)
  assert.equal(gate.changesRequired, true)
})

test('PROFILE DATA 03.7 rejection does not alter compatibility, infer a profile or create verified assembly evidence', () => {
  const bridge = evidenceFixture()
  const relation = bridge.rows.find((row) => row.relation === 'FRAME_SASH')!.relation
  const record = createCanonicalProfileAssemblyEvidenceHumanReviewRecord(bridge, {
    reviewId: 'reject-current-evidence',
    relation,
    reviewerRole: 'TECHNICAL_REVIEWER',
    reviewedAt: '2026-09-07T07:42:00+03:00',
    decision: 'REJECT_CURRENT_EVIDENCE',
    note: 'Current working evidence is not enough for this relation.',
  })
  const gate = buildCanonicalProfileAssemblyEvidenceHumanReviewGate({ bridge, records: [record] })
  assert.equal(gate.status, 'HUMAN_MORE_EVIDENCE_REQUIRED')
  assert.equal(gate.rejectedCount, 1)
  assert.equal(gate.automaticProfileSelectionAllowed, false)
  assert.equal(gate.verifiedAssemblyNodeEvidence, false)
  assert.equal(gate.manufacturerAssemblyCompatibilityValidated, false)
})

test('PROFILE DATA 03.7 invalidates prior human acceptance when the source assembly evidence fingerprint changes', () => {
  const bridge = evidenceFixture()
  const record = acceptRecord(bridge, 0)
  const oldStateKey = canonicalProfileAssemblyEvidenceStateKey(bridge)
  bridge.rows[0]!.leftProfileCode = '482.30-CHANGED'
  assert.notEqual(canonicalProfileAssemblyEvidenceStateKey(bridge), oldStateKey)

  const gate = buildCanonicalProfileAssemblyEvidenceHumanReviewGate({ bridge, records: [record] })
  assert.equal(gate.status, 'STALE_REVIEW_REQUIRED')
  assert.equal(gate.staleCount, 1)
  assert.equal(gate.rows[0]?.state, 'STALE_REVIEW_REQUIRED')
  assert.equal(gate.humanEvidenceReviewAccepted, false)
})

test('PROFILE DATA 03.7 blocks duplicate active decisions instead of silently choosing one', () => {
  const bridge = evidenceFixture()
  const accepted = acceptRecord(bridge, 0)
  const relation = bridge.rows[0]!.relation
  const rejected = createCanonicalProfileAssemblyEvidenceHumanReviewRecord(bridge, {
    reviewId: 'duplicate-review',
    relation,
    reviewerRole: 'TECHNICAL_REVIEWER',
    reviewedAt: '2026-09-07T07:43:00+03:00',
    decision: 'REJECT_CURRENT_EVIDENCE',
    note: 'Second active decision must not override the first.',
  })
  const gate = buildCanonicalProfileAssemblyEvidenceHumanReviewGate({ bridge, records: [accepted, rejected] })
  assert.equal(gate.status, 'BLOCKED_REVIEW_CONFLICT')
  assert.match(gate.conflicts.join('\n'), /multiple active human evidence-review records/)
})

test('PROFILE DATA 03.7 refuses to record decisions on blocked PROFILE DATA 03.6 evidence', () => {
  const bridge = evidenceFixture()
  const relation = bridge.rows[0]!.relation
  bridge.status = 'BLOCKED_EVIDENCE_CONFLICT'
  bridge.conflicts.push('Synthetic evidence conflict.')
  assert.throws(() => createCanonicalProfileAssemblyEvidenceHumanReviewRecord(bridge, {
    reviewId: 'blocked-review',
    relation,
    reviewerRole: 'TECHNICAL_REVIEWER',
    reviewedAt: '2026-09-07T07:44:00+03:00',
    decision: 'ACCEPT_CURRENT_EVIDENCE',
  }), /human evidence review cannot be recorded/)
  const gate = buildCanonicalProfileAssemblyEvidenceHumanReviewGate({ bridge })
  assert.equal(gate.status, 'BLOCKED_UPSTREAM')
  assert.equal(gate.productionUnlockAllowed, false)
})

test('PROFILE DATA 03.7 UI is integrated and explicitly says human acceptance is not manufacturer approval', () => {
  const parent = readFileSync('src/components/CanonicalProfileRealConceptual3DPanel.tsx', 'utf8')
  const panel = readFileSync('src/components/CanonicalProfileAssemblyEvidenceHumanReviewPanel.tsx', 'utf8')
  assert.match(parent, /CanonicalProfileAssemblyEvidenceHumanReviewPanel/)
  assert.match(parent, /<CanonicalProfileAssemblyEvidenceHumanReviewPanel bridge=\{bridge\} \/>/)
  assert.match(panel, /ASSEMBLY EVIDENCE · HUMAN REVIEW/)
  assert.match(panel, /Приемам текущото ниво на доказателство/)
  assert.match(panel, /Искам още доказателство/)
  assert.match(panel, /HUMAN ACCEPTANCE ≠ MANUFACTURER APPROVAL/)
  assert.match(panel, /PRODUCTION UNLOCK: НЕ/)
})

test('PROFILE DATA 03.7 remains WORKING and preserves all production safety boundaries', () => {
  assert.equal(PROFILE_DATA_03_7_STATE.parentStatus, 'OPEN / WORKING')
  assert.equal(PROFILE_DATA_03_7_STATE.stepStatus, 'WORKING')
  assert.equal(PROFILE_DATA_03_7_HUMAN_REVIEW_SAFETY.humanDecisionRequired, true)
  assert.equal(PROFILE_DATA_03_7_HUMAN_REVIEW_SAFETY.staleReviewInvalidationRequired, true)
  assert.equal(PROFILE_DATA_03_7_HUMAN_REVIEW_SAFETY.humanAcceptanceIsManufacturerApproval, false)
  assert.equal(PROFILE_DATA_03_7_HUMAN_REVIEW_SAFETY.humanAcceptanceCreatesVerifiedAssemblyNodeEvidence, false)
  assert.equal(PROFILE_DATA_03_7_HUMAN_REVIEW_SAFETY.manufacturerAssemblyCompatibilityValidated, false)
  assert.equal(PROFILE_DATA_03_7_HUMAN_REVIEW_SAFETY.verifiedAssemblyNodeEvidence, false)
  assert.equal(PROFILE_DATA_03_7_HUMAN_REVIEW_SAFETY.exactJointGeometryVerified, false)
  assert.equal(PROFILE_DATA_03_7_HUMAN_REVIEW_SAFETY.productionUnlockAllowed, false)
  assert.equal(PROFILE_DATA_03_7_HUMAN_REVIEW_SAFETY.machineReady, false)
  assert.equal(PROFILE_DATA_03_7_HUMAN_REVIEW_SAFETY.productionApproved, false)
})
