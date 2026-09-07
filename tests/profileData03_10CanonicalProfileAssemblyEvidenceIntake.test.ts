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
import {
  buildCanonicalProfileAssemblyEvidenceIntakeLedger,
  canonicalProfileAssemblyEvidenceReadinessStateKey,
  createCanonicalProfileAssemblyEvidenceSubmissionRecord,
  PROFILE_DATA_03_10_EVIDENCE_INTAKE_SAFETY,
  PROFILE_DATA_03_10_STATE,
} from '../src/aiCanonicalProfileAssemblyEvidenceIntake'

function readinessFixture() {
  const intent = createFacadeFlowProductIntent({
    id: 'profile-data03-10-intake',
    sourceKind: 'MANUAL',
    sourceText: 'Explicit PRELUDE 60 manual evidence intake fixture.',
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
    reviewId: `intake-accept-${index}`,
    relation: row.relation,
    reviewerRole: 'TECHNICAL_REVIEWER',
    reviewedAt: `2026-09-07T08:5${index}:00+03:00`,
    decision: 'ACCEPT_CURRENT_EVIDENCE',
  }))
  const gate = buildCanonicalProfileAssemblyEvidenceHumanReviewGate({ bridge: evidence, records: reviews })
  const summary = buildCanonicalProfileAssemblyEvidenceReviewSummary(gate)
  return buildCanonicalProfileAssemblyEvidenceReadiness(summary)
}

function manufacturerPairRegistration() {
  const readiness = readinessFixture()
  const row = readiness.rows.find((item) => item.relation === 'FRAME_SASH')!
  const requirement = row.requirements.find((item) => item.kind === 'MANUFACTURER_PAIR_RELATION_EVIDENCE')!
  const record = createCanonicalProfileAssemblyEvidenceSubmissionRecord(readiness, {
    submissionId: 'manual-evidence-manufacturer-pair-1',
    relation: row.relation,
    requirementKind: requirement.kind,
    authorityKind: requirement.authorityNeeded,
    sourceLabel: 'PRELUDE 60 manufacturer technical sheet',
    sourceRef: 'manufacturer-sheet.pdf#page=12',
    submittedByRole: 'TECHNICAL_USER',
    submittedAt: '2026-09-07T09:00:00+03:00',
    note: 'Registered for later human evidence review.',
  })
  return { readiness, record }
}

test('PROFILE DATA 03.10 registers a current missing requirement but leaves it pending human review', () => {
  const { readiness, record } = manufacturerPairRegistration()
  const ledger = buildCanonicalProfileAssemblyEvidenceIntakeLedger({ readiness, records: [record] })
  assert.equal(ledger.status, 'MANUAL_EVIDENCE_REGISTERED_PENDING_REVIEW')
  assert.equal(ledger.registeredCount, 1)
  assert.equal(ledger.pendingHumanReviewCount, 1)
  assert.equal(ledger.missingRequirementCountPreserved, 10)
  assert.equal(ledger.rows[0]!.acceptedAsEvidence, false)
  assert.equal(ledger.rows[0]!.requirementSatisfied, false)
  assert.equal(ledger.productionUnlockAllowed, false)
})

test('PROFILE DATA 03.10 enforces the authority class required by the missing requirement', () => {
  const readiness = readinessFixture()
  assert.throws(() => createCanonicalProfileAssemblyEvidenceSubmissionRecord(readiness, {
    submissionId: 'wrong-authority',
    relation: 'FRAME_SASH',
    requirementKind: 'MANUFACTURER_PAIR_RELATION_EVIDENCE',
    authorityKind: 'HUMAN_TECHNICAL_CONFIRMATION',
    sourceLabel: 'Human note',
    sourceRef: 'note-1',
    submittedByRole: 'TECHNICAL_USER',
    submittedAt: '2026-09-07T09:01:00+03:00',
  }), /requires authority MANUFACTURER_CATALOGUE_OR_TECHNICAL_DOCUMENT/)
})

test('PROFILE DATA 03.10 refuses registration while current evidence human review is not accepted', () => {
  const readiness = readinessFixture()
  const blocked = { ...readiness, status: 'HUMAN_REVIEW_REQUIRED' as const, currentEvidenceHumanReviewGatePassed: false }
  assert.throws(() => createCanonicalProfileAssemblyEvidenceSubmissionRecord(blocked, {
    submissionId: 'blocked-registration',
    relation: 'FRAME_SASH',
    requirementKind: 'MANUFACTURER_PAIR_RELATION_EVIDENCE',
    authorityKind: 'MANUFACTURER_CATALOGUE_OR_TECHNICAL_DOCUMENT',
    sourceLabel: 'Sheet',
    sourceRef: 'sheet.pdf',
    submittedByRole: 'TECHNICAL_USER',
    submittedAt: '2026-09-07T09:02:00+03:00',
  }), /manual evidence registration requires accepted current evidence/)
})

test('PROFILE DATA 03.10 marks an old registration stale when readiness fingerprint changes', () => {
  const { readiness, record } = manufacturerPairRegistration()
  const changed = { ...readiness, sourceHumanReviewStateKey: `${readiness.sourceHumanReviewStateKey}:changed` }
  assert.notEqual(canonicalProfileAssemblyEvidenceReadinessStateKey(changed), record.sourceReadinessStateKey)
  const ledger = buildCanonicalProfileAssemblyEvidenceIntakeLedger({ readiness: changed, records: [record] })
  assert.equal(ledger.status, 'STALE_REGISTRATION_REVIEW_REQUIRED')
  assert.equal(ledger.staleRegistrationCount, 1)
  assert.equal(ledger.rows[0]!.state, 'STALE_REGISTRATION_REVIEW_REQUIRED')
  assert.equal(ledger.rows[0]!.acceptedAsEvidence, false)
})

test('PROFILE DATA 03.10 fails closed on duplicate active registrations for one relation requirement', () => {
  const { readiness, record } = manufacturerPairRegistration()
  const duplicate = { ...record, submissionId: 'manual-evidence-manufacturer-pair-2' }
  const ledger = buildCanonicalProfileAssemblyEvidenceIntakeLedger({ readiness, records: [record, duplicate] })
  assert.equal(ledger.status, 'BLOCKED_INTAKE_CONFLICT')
  assert.match(ledger.conflicts.join('\n'), /multiple active manual evidence registrations/)
  assert.equal(ledger.productionUnlockAllowed, false)
})

test('PROFILE DATA 03.10 registration of assembly-node authority does not create verified assembly-node evidence', () => {
  const readiness = readinessFixture()
  const row = readiness.rows.find((item) => item.relation === 'FRAME_SASH')!
  const requirement = row.requirements.find((item) => item.kind === 'VERIFIED_ASSEMBLY_NODE_EVIDENCE')!
  const record = createCanonicalProfileAssemblyEvidenceSubmissionRecord(readiness, {
    submissionId: 'assembly-node-registration',
    relation: row.relation,
    requirementKind: requirement.kind,
    authorityKind: requirement.authorityNeeded,
    sourceLabel: 'Real sample node A-17',
    sourceRef: 'assembly-node:A-17',
    submittedByRole: 'TECHNICAL_USER',
    submittedAt: '2026-09-07T09:03:00+03:00',
  })
  assert.equal(record.createsVerifiedAssemblyNodeEvidence, false)
  assert.equal(record.sourceVerified, false)
  assert.equal(record.acceptedAsEvidence, false)
  assert.equal(record.satisfiesRequirement, false)
})

test('PROFILE DATA 03.10 UI is integrated below 03.9 and explicitly says registration is not acceptance', () => {
  const readinessPanel = readFileSync('src/components/CanonicalProfileAssemblyEvidenceReadinessPanel.tsx', 'utf8')
  const intakePanel = readFileSync('src/components/CanonicalProfileAssemblyEvidenceIntakePanel.tsx', 'utf8')
  assert.match(readinessPanel, /CanonicalProfileAssemblyEvidenceIntakePanel/)
  assert.match(readinessPanel, /<CanonicalProfileAssemblyEvidenceIntakePanel readiness=\{readiness\} \/>/)
  assert.match(intakePanel, /ASSEMBLY EVIDENCE · MANUAL INTAKE/)
  assert.match(intakePanel, /не удовлетворява requirement-а/i)
  assert.match(intakePanel, /Registered submission is accepted evidence:<\/strong> NO/)
  assert.match(intakePanel, /PRODUCTION UNLOCK: НЕ/)
})

test('PROFILE DATA 03.10 remains WORKING and preserves every production safety lock', () => {
  assert.equal(PROFILE_DATA_03_10_STATE.parentStatus, 'OPEN / WORKING')
  assert.equal(PROFILE_DATA_03_10_STATE.stepStatus, 'WORKING')
  assert.equal(PROFILE_DATA_03_10_EVIDENCE_INTAKE_SAFETY.registrationOnly, true)
  assert.equal(PROFILE_DATA_03_10_EVIDENCE_INTAKE_SAFETY.humanReviewRequired, true)
  assert.equal(PROFILE_DATA_03_10_EVIDENCE_INTAKE_SAFETY.registeredSubmissionIsAcceptedEvidence, false)
  assert.equal(PROFILE_DATA_03_10_EVIDENCE_INTAKE_SAFETY.registeredSubmissionSatisfiesRequirement, false)
  assert.equal(PROFILE_DATA_03_10_EVIDENCE_INTAKE_SAFETY.createsValidatedEvidence, false)
  assert.equal(PROFILE_DATA_03_10_EVIDENCE_INTAKE_SAFETY.createsManufacturerApproval, false)
  assert.equal(PROFILE_DATA_03_10_EVIDENCE_INTAKE_SAFETY.createsVerifiedAssemblyNodeEvidence, false)
  assert.equal(PROFILE_DATA_03_10_EVIDENCE_INTAKE_SAFETY.exactJointGeometryVerified, false)
  assert.equal(PROFILE_DATA_03_10_EVIDENCE_INTAKE_SAFETY.upgradesEvidenceMaturityAutomatically, false)
  assert.equal(PROFILE_DATA_03_10_EVIDENCE_INTAKE_SAFETY.automaticGeometryAllowed, false)
  assert.equal(PROFILE_DATA_03_10_EVIDENCE_INTAKE_SAFETY.productionCompatibilityValidated, false)
  assert.equal(PROFILE_DATA_03_10_EVIDENCE_INTAKE_SAFETY.productionUnlockAllowed, false)
  assert.equal(PROFILE_DATA_03_10_EVIDENCE_INTAKE_SAFETY.machineReady, false)
  assert.equal(PROFILE_DATA_03_10_EVIDENCE_INTAKE_SAFETY.productionApproved, false)
})
