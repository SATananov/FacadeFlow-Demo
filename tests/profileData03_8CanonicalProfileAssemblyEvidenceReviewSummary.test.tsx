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
  createCanonicalProfileAssemblyEvidenceHumanReviewRecord,
} from '../src/aiCanonicalProfileAssemblyEvidenceHumanReview'
import {
  buildCanonicalProfileAssemblyEvidenceReviewSummary,
  canonicalProfileAssemblyEvidenceHumanReviewStateKey,
  PROFILE_DATA_03_8_REVIEW_SUMMARY_SAFETY,
  PROFILE_DATA_03_8_STATE,
} from '../src/aiCanonicalProfileAssemblyEvidenceReviewSummary'

function evidenceFixture() {
  const intent = createFacadeFlowProductIntent({
    id: 'profile-data03-8-review-summary',
    sourceKind: 'MANUAL',
    sourceText: 'Explicit PRELUDE 60 assembly evidence review summary fixture.',
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

function acceptedRecords(bridge: ReturnType<typeof evidenceFixture>) {
  return bridge.rows.map((row, index) => createCanonicalProfileAssemblyEvidenceHumanReviewRecord(bridge, {
    reviewId: `summary-accept-${index}`,
    relation: row.relation,
    reviewerRole: 'TECHNICAL_REVIEWER',
    reviewedAt: `2026-09-07T08:0${index}:00+03:00`,
    decision: 'ACCEPT_CURRENT_EVIDENCE',
  }))
}

test('PROFILE DATA 03.8 aggregates an unreviewed 03.7 gate without inventing approval', () => {
  const bridge = evidenceFixture()
  const gate = buildCanonicalProfileAssemblyEvidenceHumanReviewGate({ bridge })
  const summary = buildCanonicalProfileAssemblyEvidenceReviewSummary(gate)
  assert.equal(summary.status, 'HUMAN_REVIEW_INCOMPLETE')
  assert.equal(summary.disposition, 'PENDING_HUMAN_REVIEW')
  assert.equal(summary.relationCount, 3)
  assert.equal(summary.unreviewedCount, 3)
  assert.equal(summary.currentEvidenceClassificationReviewGatePassed, false)
  assert.equal(summary.productionUnlockAllowed, false)
})

test('PROFILE DATA 03.8 reports PASS only for accepted current evidence classification and keeps production locked', () => {
  const bridge = evidenceFixture()
  const gate = buildCanonicalProfileAssemblyEvidenceHumanReviewGate({ bridge, records: acceptedRecords(bridge) })
  const summary = buildCanonicalProfileAssemblyEvidenceReviewSummary(gate)
  assert.equal(summary.status, 'CURRENT_EVIDENCE_ACCEPTED_PRODUCTION_LOCKED')
  assert.equal(summary.disposition, 'ACCEPTED_CURRENT_EVIDENCE_CLASSIFICATION_ONLY')
  assert.equal(summary.acceptedCount, 3)
  assert.equal(summary.currentEvidenceClassificationReviewComplete, true)
  assert.equal(summary.currentEvidenceClassificationReviewAccepted, true)
  assert.equal(summary.currentEvidenceClassificationReviewGatePassed, true)
  assert.equal(summary.changesEvidenceMaturity, false)
  assert.equal(summary.createsManufacturerApproval, false)
  assert.equal(summary.createsVerifiedAssemblyNodeEvidence, false)
  assert.equal(summary.validatesExactJointGeometry, false)
  assert.equal(summary.productionCompatibilityValidated, false)
  assert.equal(summary.productionUnlockAllowed, false)
  assert.equal(summary.machineReady, false)
})

test('PROFILE DATA 03.8 aggregates request-more-evidence as human action required', () => {
  const bridge = evidenceFixture()
  const accepted = acceptedRecords(bridge).slice(1)
  const row = bridge.rows[0]!
  const request = createCanonicalProfileAssemblyEvidenceHumanReviewRecord(bridge, {
    reviewId: 'summary-request-more',
    relation: row.relation,
    reviewerRole: 'TECHNICAL_REVIEWER',
    reviewedAt: '2026-09-07T08:10:00+03:00',
    decision: 'REQUEST_MORE_EVIDENCE',
    note: 'Need explicit manufacturer assembly-node or equivalent relation evidence.',
  })
  const gate = buildCanonicalProfileAssemblyEvidenceHumanReviewGate({ bridge, records: [request, ...accepted] })
  const summary = buildCanonicalProfileAssemblyEvidenceReviewSummary(gate)
  assert.equal(summary.status, 'HUMAN_ACTION_REQUIRED')
  assert.equal(summary.disposition, 'ACTION_REQUIRED')
  assert.equal(summary.moreEvidenceRequiredCount, 1)
  assert.equal(summary.humanActionRequired, true)
  assert.equal(summary.currentEvidenceClassificationReviewGatePassed, false)
})

test('PROFILE DATA 03.8 aggregates rejection without turning it into automatic correction or approval', () => {
  const bridge = evidenceFixture()
  const accepted = acceptedRecords(bridge).slice(1)
  const row = bridge.rows[0]!
  const rejection = createCanonicalProfileAssemblyEvidenceHumanReviewRecord(bridge, {
    reviewId: 'summary-reject',
    relation: row.relation,
    reviewerRole: 'TECHNICAL_REVIEWER',
    reviewedAt: '2026-09-07T08:11:00+03:00',
    decision: 'REJECT_CURRENT_EVIDENCE',
    note: 'Current evidence classification is not acceptable for this relation.',
  })
  const gate = buildCanonicalProfileAssemblyEvidenceHumanReviewGate({ bridge, records: [rejection, ...accepted] })
  const summary = buildCanonicalProfileAssemblyEvidenceReviewSummary(gate)
  assert.equal(summary.status, 'HUMAN_ACTION_REQUIRED')
  assert.equal(summary.rejectedCount, 1)
  assert.equal(summary.automaticProfileSelectionAllowed, false)
  assert.equal(summary.automaticGeometryAllowed, false)
  assert.equal(summary.createsManufacturerApproval, false)
})

test('PROFILE DATA 03.8 exposes stale review instead of preserving an obsolete aggregate PASS', () => {
  const bridge = evidenceFixture()
  const records = acceptedRecords(bridge)
  bridge.rows[0]!.leftProfileCode = '482.30-CHANGED'
  const gate = buildCanonicalProfileAssemblyEvidenceHumanReviewGate({ bridge, records })
  const summary = buildCanonicalProfileAssemblyEvidenceReviewSummary(gate)
  assert.equal(summary.status, 'STALE_REVIEW_REQUIRED')
  assert.equal(summary.disposition, 'STALE')
  assert.ok(summary.staleCount > 0)
  assert.equal(summary.currentEvidenceClassificationReviewGatePassed, false)
})

test('PROFILE DATA 03.8 state key changes when the human-review aggregate changes', () => {
  const bridge = evidenceFixture()
  const pending = buildCanonicalProfileAssemblyEvidenceHumanReviewGate({ bridge })
  const accepted = buildCanonicalProfileAssemblyEvidenceHumanReviewGate({ bridge, records: acceptedRecords(bridge) })
  assert.notEqual(
    canonicalProfileAssemblyEvidenceHumanReviewStateKey(pending),
    canonicalProfileAssemblyEvidenceHumanReviewStateKey(accepted),
  )
})

test('PROFILE DATA 03.8 fails closed if upstream review data crosses a production safety boundary', () => {
  const bridge = evidenceFixture()
  const gate = buildCanonicalProfileAssemblyEvidenceHumanReviewGate({ bridge, records: acceptedRecords(bridge) })
  const tampered = { ...gate, productionUnlockAllowed: true as false }
  const summary = buildCanonicalProfileAssemblyEvidenceReviewSummary(tampered)
  assert.equal(summary.status, 'BLOCKED_REVIEW_CONFLICT')
  assert.match(summary.conflicts.join('\n'), /production safety boundary/)
  assert.equal(summary.currentEvidenceClassificationReviewGatePassed, false)
  assert.equal(summary.productionUnlockAllowed, false)
})

test('PROFILE DATA 03.8 UI is integrated into the live 03.7 review flow and states the narrow gate scope', () => {
  const humanReviewPanel = readFileSync('src/components/CanonicalProfileAssemblyEvidenceHumanReviewPanel.tsx', 'utf8')
  const summaryPanel = readFileSync('src/components/CanonicalProfileAssemblyEvidenceReviewSummaryPanel.tsx', 'utf8')
  assert.match(humanReviewPanel, /CanonicalProfileAssemblyEvidenceReviewSummaryPanel/)
  assert.match(humanReviewPanel, /<CanonicalProfileAssemblyEvidenceReviewSummaryPanel gate=\{gate\} \/>/)
  assert.match(summaryPanel, /ASSEMBLY EVIDENCE · REVIEW SUMMARY/)
  assert.match(summaryPanel, /current evidence classification/i)
  assert.match(summaryPanel, /HUMAN ACCEPTANCE ≠ MANUFACTURER APPROVAL/)
  assert.match(summaryPanel, /PRODUCTION UNLOCK: НЕ/)
})

test('PROFILE DATA 03.8 remains WORKING and preserves every production safety lock', () => {
  assert.equal(PROFILE_DATA_03_8_STATE.parentStatus, 'OPEN / WORKING')
  assert.equal(PROFILE_DATA_03_8_STATE.stepStatus, 'WORKING')
  assert.equal(PROFILE_DATA_03_8_REVIEW_SUMMARY_SAFETY.summaryOnly, true)
  assert.equal(PROFILE_DATA_03_8_REVIEW_SUMMARY_SAFETY.currentEvidenceClassificationOnly, true)
  assert.equal(PROFILE_DATA_03_8_REVIEW_SUMMARY_SAFETY.changesEvidenceMaturity, false)
  assert.equal(PROFILE_DATA_03_8_REVIEW_SUMMARY_SAFETY.humanAcceptanceIsManufacturerApproval, false)
  assert.equal(PROFILE_DATA_03_8_REVIEW_SUMMARY_SAFETY.createsVerifiedAssemblyNodeEvidence, false)
  assert.equal(PROFILE_DATA_03_8_REVIEW_SUMMARY_SAFETY.exactJointGeometryVerified, false)
  assert.equal(PROFILE_DATA_03_8_REVIEW_SUMMARY_SAFETY.automaticGeometryAllowed, false)
  assert.equal(PROFILE_DATA_03_8_REVIEW_SUMMARY_SAFETY.productionCompatibilityValidated, false)
  assert.equal(PROFILE_DATA_03_8_REVIEW_SUMMARY_SAFETY.productionUnlockAllowed, false)
  assert.equal(PROFILE_DATA_03_8_REVIEW_SUMMARY_SAFETY.machineReady, false)
  assert.equal(PROFILE_DATA_03_8_REVIEW_SUMMARY_SAFETY.productionApproved, false)
})
