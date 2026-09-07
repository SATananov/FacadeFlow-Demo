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
import { buildCanonicalProfileAssemblyEvidenceReviewSummary } from '../src/aiCanonicalProfileAssemblyEvidenceReviewSummary'
import {
  buildCanonicalProfileAssemblyEvidenceReadiness,
  PROFILE_DATA_03_9_EVIDENCE_READINESS_SAFETY,
  PROFILE_DATA_03_9_STATE,
} from '../src/aiCanonicalProfileAssemblyEvidenceReadiness'

function evidenceFixture() {
  const intent = createFacadeFlowProductIntent({
    id: 'profile-data03-9-readiness',
    sourceKind: 'MANUAL',
    sourceText: 'Explicit PRELUDE 60 evidence readiness fixture.',
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

function acceptedSummary() {
  const bridge = evidenceFixture()
  const records = bridge.rows.map((row, index) => createCanonicalProfileAssemblyEvidenceHumanReviewRecord(bridge, {
    reviewId: `readiness-accept-${index}`,
    relation: row.relation,
    reviewerRole: 'TECHNICAL_REVIEWER',
    reviewedAt: `2026-09-07T08:3${index}:00+03:00`,
    decision: 'ACCEPT_CURRENT_EVIDENCE',
  }))
  const gate = buildCanonicalProfileAssemblyEvidenceHumanReviewGate({ bridge, records })
  return buildCanonicalProfileAssemblyEvidenceReviewSummary(gate)
}

test('PROFILE DATA 03.9 identifies missing requirements after current evidence is human accepted and keeps production locked', () => {
  const readiness = buildCanonicalProfileAssemblyEvidenceReadiness(acceptedSummary())
  assert.equal(readiness.status, 'MISSING_EVIDENCE_REQUIREMENTS_IDENTIFIED_PRODUCTION_LOCKED')
  assert.equal(readiness.relationCount, 3)
  assert.equal(readiness.totalMissingRequirementCount, 10)
  assert.equal(readiness.humanWorkingRelationEvidenceMissingCount, 1)
  assert.equal(readiness.manufacturerPairRelationEvidenceMissingCount, 3)
  assert.equal(readiness.verifiedAssemblyNodeEvidenceMissingCount, 3)
  assert.equal(readiness.exactJointDocumentationMissingCount, 3)
  assert.equal(readiness.productionUnlockAllowed, false)
  assert.equal(readiness.machineReady, false)
})

test('PROFILE DATA 03.9 requires human working relation evidence only for FRAME_MULLION current maturity', () => {
  const readiness = buildCanonicalProfileAssemblyEvidenceReadiness(acceptedSummary())
  const frameMullion = readiness.rows.find((row) => row.relation === 'FRAME_MULLION')!
  const frameSash = readiness.rows.find((row) => row.relation === 'FRAME_SASH')!
  const mullionSash = readiness.rows.find((row) => row.relation === 'MULLION_SASH')!
  assert.equal(frameMullion.evidenceMaturity, 'CONCEPTUAL_AND_CATALOGUE_SYSTEM_ONLY')
  assert.ok(frameMullion.requirements.some((item) => item.kind === 'HUMAN_WORKING_RELATION_EVIDENCE'))
  assert.equal(frameSash.requirements.some((item) => item.kind === 'HUMAN_WORKING_RELATION_EVIDENCE'), false)
  assert.equal(mullionSash.requirements.some((item) => item.kind === 'HUMAN_WORKING_RELATION_EVIDENCE'), false)
})

test('PROFILE DATA 03.9 never treats same-system or human working rules as manufacturer pair, assembly-node, or exact-joint evidence', () => {
  const readiness = buildCanonicalProfileAssemblyEvidenceReadiness(acceptedSummary())
  for (const row of readiness.rows) {
    assert.equal(row.manufacturerPairRelationEvidencePresent, false)
    assert.equal(row.verifiedAssemblyNodeEvidencePresent, false)
    assert.equal(row.exactJointDocumentationPresent, false)
    assert.ok(row.requirements.some((item) => item.kind === 'MANUFACTURER_PAIR_RELATION_EVIDENCE'))
    assert.ok(row.requirements.some((item) => item.kind === 'VERIFIED_ASSEMBLY_NODE_EVIDENCE'))
    assert.ok(row.requirements.some((item) => item.kind === 'EXACT_JOINT_DOCUMENTATION'))
  }
})

test('PROFILE DATA 03.9 preserves incomplete human review as a readiness blocker while still exposing missing evidence', () => {
  const bridge = evidenceFixture()
  const gate = buildCanonicalProfileAssemblyEvidenceHumanReviewGate({ bridge })
  const summary = buildCanonicalProfileAssemblyEvidenceReviewSummary(gate)
  const readiness = buildCanonicalProfileAssemblyEvidenceReadiness(summary)
  assert.equal(readiness.status, 'HUMAN_REVIEW_REQUIRED')
  assert.equal(readiness.currentEvidenceHumanReviewGatePassed, false)
  assert.equal(readiness.totalMissingRequirementCount, 10)
  assert.equal(readiness.createsEvidence, false)
})

test('PROFILE DATA 03.9 preserves request-more-evidence as human action required without generating evidence', () => {
  const bridge = evidenceFixture()
  const target = bridge.rows[0]!
  const request = createCanonicalProfileAssemblyEvidenceHumanReviewRecord(bridge, {
    reviewId: 'readiness-request-more',
    relation: target.relation,
    reviewerRole: 'TECHNICAL_REVIEWER',
    reviewedAt: '2026-09-07T08:40:00+03:00',
    decision: 'REQUEST_MORE_EVIDENCE',
    note: 'Need manufacturer pair evidence or a verified real assembly node.',
  })
  const gate = buildCanonicalProfileAssemblyEvidenceHumanReviewGate({ bridge, records: [request] })
  const summary = buildCanonicalProfileAssemblyEvidenceReviewSummary(gate)
  const readiness = buildCanonicalProfileAssemblyEvidenceReadiness(summary)
  assert.equal(readiness.status, 'HUMAN_ACTION_REQUIRED')
  assert.equal(readiness.createsEvidence, false)
  assert.equal(readiness.upgradesEvidenceMaturityAutomatically, false)
})

test('PROFILE DATA 03.9 fails closed if upstream summary crosses a production safety boundary', () => {
  const summary = acceptedSummary()
  const tampered = { ...summary, productionUnlockAllowed: true as false }
  const readiness = buildCanonicalProfileAssemblyEvidenceReadiness(tampered)
  assert.equal(readiness.status, 'BLOCKED_REVIEW_CONFLICT')
  assert.match(readiness.conflicts.join('\n'), /production safety boundary/)
  assert.equal(readiness.productionUnlockAllowed, false)
})

test('PROFILE DATA 03.9 UI is integrated below 03.8 and clearly states that requirements are not evidence', () => {
  const summaryPanel = readFileSync('src/components/CanonicalProfileAssemblyEvidenceReviewSummaryPanel.tsx', 'utf8')
  const readinessPanel = readFileSync('src/components/CanonicalProfileAssemblyEvidenceReadinessPanel.tsx', 'utf8')
  assert.match(summaryPanel, /CanonicalProfileAssemblyEvidenceReadinessPanel/)
  assert.match(summaryPanel, /<CanonicalProfileAssemblyEvidenceReadinessPanel summary=\{summary\} \/>/)
  assert.match(readinessPanel, /ASSEMBLY EVIDENCE · READINESS REQUIREMENTS/)
  assert.match(readinessPanel, /не създава доказателства/i)
  assert.match(readinessPanel, /PRODUCTION UNLOCK: НЕ/)
})

test('PROFILE DATA 03.9 remains WORKING and preserves every production safety lock', () => {
  assert.equal(PROFILE_DATA_03_9_STATE.parentStatus, 'OPEN / WORKING')
  assert.equal(PROFILE_DATA_03_9_STATE.stepStatus, 'WORKING')
  assert.equal(PROFILE_DATA_03_9_EVIDENCE_READINESS_SAFETY.requirementsOnly, true)
  assert.equal(PROFILE_DATA_03_9_EVIDENCE_READINESS_SAFETY.createsEvidence, false)
  assert.equal(PROFILE_DATA_03_9_EVIDENCE_READINESS_SAFETY.createsManufacturerApproval, false)
  assert.equal(PROFILE_DATA_03_9_EVIDENCE_READINESS_SAFETY.createsVerifiedAssemblyNodeEvidence, false)
  assert.equal(PROFILE_DATA_03_9_EVIDENCE_READINESS_SAFETY.exactJointGeometryVerified, false)
  assert.equal(PROFILE_DATA_03_9_EVIDENCE_READINESS_SAFETY.upgradesEvidenceMaturityAutomatically, false)
  assert.equal(PROFILE_DATA_03_9_EVIDENCE_READINESS_SAFETY.automaticGeometryAllowed, false)
  assert.equal(PROFILE_DATA_03_9_EVIDENCE_READINESS_SAFETY.productionCompatibilityValidated, false)
  assert.equal(PROFILE_DATA_03_9_EVIDENCE_READINESS_SAFETY.productionUnlockAllowed, false)
  assert.equal(PROFILE_DATA_03_9_EVIDENCE_READINESS_SAFETY.machineReady, false)
  assert.equal(PROFILE_DATA_03_9_EVIDENCE_READINESS_SAFETY.productionApproved, false)
})
