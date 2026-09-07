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
import { buildCanonicalProfileAssemblyEvidenceReadiness } from '../src/aiCanonicalProfileAssemblyEvidenceReadiness'
import { createCanonicalProfileAssemblyEvidenceSubmissionRecord } from '../src/aiCanonicalProfileAssemblyEvidenceIntake'
import {
  buildCanonicalProfileAssemblyEvidenceIntakeHumanReviewGate,
  canonicalProfileAssemblyEvidenceSubmissionSignature,
  createCanonicalProfileAssemblyEvidenceIntakeHumanReviewRecord,
  PROFILE_DATA_03_11_INTAKE_HUMAN_REVIEW_SAFETY,
  PROFILE_DATA_03_11_STATE,
} from '../src/aiCanonicalProfileAssemblyEvidenceIntakeHumanReview'

function readinessFixture() {
  const intent = createFacadeFlowProductIntent({
    id: 'profile-data03-11-source-review',
    sourceKind: 'MANUAL',
    sourceText: 'Explicit PRELUDE 60 manual evidence source review fixture.',
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
  const evidence = buildCanonicalProfileAssemblyEvidenceBridge(compatibility)
  const reviews = evidence.rows.map((row, index) => createCanonicalProfileAssemblyEvidenceHumanReviewRecord(evidence, {
    reviewId: `source-review-accept-${index}`,
    relation: row.relation,
    reviewerRole: 'TECHNICAL_REVIEWER',
    reviewedAt: `2026-09-07T09:2${index}:00+03:00`,
    decision: 'ACCEPT_CURRENT_EVIDENCE',
  }))
  const gate = buildCanonicalProfileAssemblyEvidenceHumanReviewGate({ bridge: evidence, records: reviews })
  const summary = buildCanonicalProfileAssemblyEvidenceReviewSummary(gate)
  return buildCanonicalProfileAssemblyEvidenceReadiness(summary)
}

function registeredManufacturerPair() {
  const readiness = readinessFixture()
  const row = readiness.rows.find((item) => item.relation === 'FRAME_SASH')!
  const requirement = row.requirements.find((item) => item.kind === 'MANUFACTURER_PAIR_RELATION_EVIDENCE')!
  const submission = createCanonicalProfileAssemblyEvidenceSubmissionRecord(readiness, {
    submissionId: 'manual-source-review-1',
    relation: row.relation,
    requirementKind: requirement.kind,
    authorityKind: requirement.authorityNeeded,
    sourceLabel: 'PRELUDE 60 manufacturer technical sheet',
    sourceRef: 'manufacturer-sheet.pdf#page=12',
    submittedByRole: 'TECHNICAL_USER',
    submittedAt: '2026-09-07T09:30:00+03:00',
    note: 'Registered for source-level review only.',
  })
  return { readiness, submission }
}

test('PROFILE DATA 03.11 ACCEPT_SOURCE accepts the source only at human review level and does not satisfy the requirement', () => {
  const { readiness, submission } = registeredManufacturerPair()
  const record = createCanonicalProfileAssemblyEvidenceIntakeHumanReviewRecord(readiness, [submission], {
    reviewId: 'source-accept-1',
    submissionId: submission.submissionId,
    reviewerRole: 'TECHNICAL_REVIEWER',
    reviewedAt: '2026-09-07T09:31:00+03:00',
    decision: 'ACCEPT_SOURCE',
  })
  const gate = buildCanonicalProfileAssemblyEvidenceIntakeHumanReviewGate({ readiness, submissions: [submission], records: [record] })
  assert.equal(gate.status, 'SOURCES_HUMAN_REVIEWED_NOT_APPLIED')
  assert.equal(gate.acceptedSourceCount, 1)
  assert.equal(gate.rows[0]!.acceptedSourceForCurrentRequirementReview, true)
  assert.equal(gate.rows[0]!.appliedToEvidenceLedger, false)
  assert.equal(gate.rows[0]!.requirementSatisfied, false)
  assert.equal(gate.rows[0]!.evidenceMaturityUpgraded, false)
  assert.equal(gate.productionUnlockAllowed, false)
})

test('PROFILE DATA 03.11 REJECT_SOURCE requires a human note and produces HUMAN_ACTION_REQUIRED', () => {
  const { readiness, submission } = registeredManufacturerPair()
  assert.throws(() => createCanonicalProfileAssemblyEvidenceIntakeHumanReviewRecord(readiness, [submission], {
    reviewId: 'source-reject-no-note',
    submissionId: submission.submissionId,
    reviewerRole: 'TECHNICAL_REVIEWER',
    reviewedAt: '2026-09-07T09:32:00+03:00',
    decision: 'REJECT_SOURCE',
  }), /requires a human review note/)
  const record = createCanonicalProfileAssemblyEvidenceIntakeHumanReviewRecord(readiness, [submission], {
    reviewId: 'source-reject-with-note',
    submissionId: submission.submissionId,
    reviewerRole: 'TECHNICAL_REVIEWER',
    reviewedAt: '2026-09-07T09:33:00+03:00',
    decision: 'REJECT_SOURCE',
    note: 'Document does not show this profile pair.',
  })
  const gate = buildCanonicalProfileAssemblyEvidenceIntakeHumanReviewGate({ readiness, submissions: [submission], records: [record] })
  assert.equal(gate.status, 'HUMAN_ACTION_REQUIRED')
  assert.equal(gate.rejectedSourceCount, 1)
})

test('PROFILE DATA 03.11 NEEDS_MORE_EVIDENCE requires a note and remains production locked', () => {
  const { readiness, submission } = registeredManufacturerPair()
  const record = createCanonicalProfileAssemblyEvidenceIntakeHumanReviewRecord(readiness, [submission], {
    reviewId: 'source-more-evidence',
    submissionId: submission.submissionId,
    reviewerRole: 'CONSTRUCTOR',
    reviewedAt: '2026-09-07T09:34:00+03:00',
    decision: 'NEEDS_MORE_EVIDENCE',
    note: 'Need a manufacturer section detail for the joint.',
  })
  const gate = buildCanonicalProfileAssemblyEvidenceIntakeHumanReviewGate({ readiness, submissions: [submission], records: [record] })
  assert.equal(gate.status, 'HUMAN_ACTION_REQUIRED')
  assert.equal(gate.needsMoreEvidenceCount, 1)
  assert.equal(gate.productionCompatibilityValidated, false)
  assert.equal(gate.machineReady, false)
})

test('PROFILE DATA 03.11 marks an old human review stale when the registered submission fingerprint changes', () => {
  const { readiness, submission } = registeredManufacturerPair()
  const record = createCanonicalProfileAssemblyEvidenceIntakeHumanReviewRecord(readiness, [submission], {
    reviewId: 'source-review-stale',
    submissionId: submission.submissionId,
    reviewerRole: 'TECHNICAL_REVIEWER',
    reviewedAt: '2026-09-07T09:35:00+03:00',
    decision: 'ACCEPT_SOURCE',
  })
  const changed = { ...submission, sourceRef: 'manufacturer-sheet-v2.pdf#page=12' }
  assert.notEqual(canonicalProfileAssemblyEvidenceSubmissionSignature(changed), record.sourceSubmissionSignature)
  const gate = buildCanonicalProfileAssemblyEvidenceIntakeHumanReviewGate({ readiness, submissions: [changed], records: [record] })
  assert.equal(gate.status, 'STALE_REVIEW_REQUIRED')
  assert.equal(gate.staleReviewCount, 1)
  assert.equal(gate.rows[0]!.state, 'STALE_REVIEW_REQUIRED')
})

test('PROFILE DATA 03.11 leaves a registered source UNREVIEWED until an explicit human decision exists', () => {
  const { readiness, submission } = registeredManufacturerPair()
  const gate = buildCanonicalProfileAssemblyEvidenceIntakeHumanReviewGate({ readiness, submissions: [submission], records: [] })
  assert.equal(gate.status, 'HUMAN_REVIEW_INCOMPLETE')
  assert.equal(gate.unreviewedCount, 1)
  assert.equal(gate.rows[0]!.state, 'UNREVIEWED')
})

test('PROFILE DATA 03.11 fails closed when one submission has multiple active review records', () => {
  const { readiness, submission } = registeredManufacturerPair()
  const first = createCanonicalProfileAssemblyEvidenceIntakeHumanReviewRecord(readiness, [submission], {
    reviewId: 'duplicate-review-1',
    submissionId: submission.submissionId,
    reviewerRole: 'TECHNICAL_REVIEWER',
    reviewedAt: '2026-09-07T09:36:00+03:00',
    decision: 'ACCEPT_SOURCE',
  })
  const second = { ...first, reviewId: 'duplicate-review-2' }
  const gate = buildCanonicalProfileAssemblyEvidenceIntakeHumanReviewGate({ readiness, submissions: [submission], records: [first, second] })
  assert.equal(gate.status, 'BLOCKED_REVIEW_CONFLICT')
  assert.match(gate.conflicts.join('\n'), /multiple active human review records/)
  assert.equal(gate.productionUnlockAllowed, false)
})

test('PROFILE DATA 03.11 UI is integrated under manual intake and explicitly separates ACCEPT from evidence application', () => {
  const intakePanel = readFileSync('src/components/CanonicalProfileAssemblyEvidenceIntakePanel.tsx', 'utf8')
  const reviewPanel = readFileSync('src/components/CanonicalProfileAssemblyEvidenceIntakeHumanReviewPanel.tsx', 'utf8')
  assert.match(intakePanel, /CanonicalProfileAssemblyEvidenceIntakeHumanReviewPanel/)
  assert.match(intakePanel, /submissions=\{records\}/)
  assert.match(reviewPanel, /ASSEMBLY EVIDENCE · SOURCE HUMAN REVIEW/)
  assert.match(reviewPanel, /ACCEPT source/)
  assert.match(reviewPanel, /NEEDS MORE EVIDENCE/)
  assert.match(reviewPanel, /REJECT source/)
  assert.match(reviewPanel, /Accepted source applied to evidence ledger:<\/strong> NO/)
  assert.match(reviewPanel, /Requirement satisfied:<\/strong> NO/)
  assert.match(reviewPanel, /PRODUCTION UNLOCK: НЕ/)
})

test('PROFILE DATA 03.11 remains WORKING and preserves every production safety lock', () => {
  assert.equal(PROFILE_DATA_03_11_STATE.parentStatus, 'OPEN / WORKING')
  assert.equal(PROFILE_DATA_03_11_STATE.stepStatus, 'WORKING')
  assert.equal(PROFILE_DATA_03_11_INTAKE_HUMAN_REVIEW_SAFETY.sourceReviewOnly, true)
  assert.equal(PROFILE_DATA_03_11_INTAKE_HUMAN_REVIEW_SAFETY.acceptedSourceIsAppliedEvidence, false)
  assert.equal(PROFILE_DATA_03_11_INTAKE_HUMAN_REVIEW_SAFETY.acceptedSourceSatisfiesRequirement, false)
  assert.equal(PROFILE_DATA_03_11_INTAKE_HUMAN_REVIEW_SAFETY.createsValidatedEvidence, false)
  assert.equal(PROFILE_DATA_03_11_INTAKE_HUMAN_REVIEW_SAFETY.createsManufacturerApproval, false)
  assert.equal(PROFILE_DATA_03_11_INTAKE_HUMAN_REVIEW_SAFETY.createsVerifiedAssemblyNodeEvidence, false)
  assert.equal(PROFILE_DATA_03_11_INTAKE_HUMAN_REVIEW_SAFETY.exactJointGeometryVerified, false)
  assert.equal(PROFILE_DATA_03_11_INTAKE_HUMAN_REVIEW_SAFETY.upgradesEvidenceMaturityAutomatically, false)
  assert.equal(PROFILE_DATA_03_11_INTAKE_HUMAN_REVIEW_SAFETY.automaticGeometryAllowed, false)
  assert.equal(PROFILE_DATA_03_11_INTAKE_HUMAN_REVIEW_SAFETY.productionCompatibilityValidated, false)
  assert.equal(PROFILE_DATA_03_11_INTAKE_HUMAN_REVIEW_SAFETY.productionUnlockAllowed, false)
  assert.equal(PROFILE_DATA_03_11_INTAKE_HUMAN_REVIEW_SAFETY.machineReady, false)
  assert.equal(PROFILE_DATA_03_11_INTAKE_HUMAN_REVIEW_SAFETY.productionApproved, false)
})
