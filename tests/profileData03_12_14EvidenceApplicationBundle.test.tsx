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
  createCanonicalProfileAssemblyEvidenceIntakeHumanReviewRecord,
} from '../src/aiCanonicalProfileAssemblyEvidenceIntakeHumanReview'
import {
  buildCanonicalProfileAssemblyEvidenceApplicationGate,
  canonicalProfileAssemblyEvidenceHumanReviewSignature,
  createCanonicalProfileAssemblyEvidenceApplicationRecord,
  PROFILE_DATA_03_12_SAFETY,
} from '../src/aiCanonicalProfileAssemblyEvidenceApplicationGate'
import {
  buildCanonicalProfileCandidateEvidenceLedger,
  canonicalProfileCandidateEvidenceEntrySignature,
  PROFILE_DATA_03_13_SAFETY,
} from '../src/aiCanonicalProfileCandidateEvidenceLedger'
import {
  buildCanonicalProfileEvidenceRequirementSatisfactionGate,
  createCanonicalProfileEvidenceRequirementReviewRecord,
  PROFILE_DATA_03_14_SAFETY,
} from '../src/aiCanonicalProfileEvidenceRequirementSatisfaction'

function bundleFixture() {
  const intent = createFacadeFlowProductIntent({
    id: 'profile-data03-12-14-bundle',
    sourceKind: 'MANUAL',
    sourceText: 'Explicit PRELUDE 60 evidence application bundle fixture.',
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
  const relationReviews = evidence.rows.map((row, index) => createCanonicalProfileAssemblyEvidenceHumanReviewRecord(evidence, {
    reviewId: `bundle-relation-review-${index}`,
    relation: row.relation,
    reviewerRole: 'TECHNICAL_REVIEWER',
    reviewedAt: `2026-09-07T10:0${index}:00+03:00`,
    decision: 'ACCEPT_CURRENT_EVIDENCE',
  }))
  const relationGate = buildCanonicalProfileAssemblyEvidenceHumanReviewGate({ bridge: evidence, records: relationReviews })
  const summary = buildCanonicalProfileAssemblyEvidenceReviewSummary(relationGate)
  const readiness = buildCanonicalProfileAssemblyEvidenceReadiness(summary)

  const row = readiness.rows.find((item) => item.relation === 'FRAME_SASH')!
  const requirement = row.requirements.find((item) => item.kind === 'MANUFACTURER_PAIR_RELATION_EVIDENCE')!
  const submission = createCanonicalProfileAssemblyEvidenceSubmissionRecord(readiness, {
    submissionId: 'bundle-source-1',
    relation: row.relation,
    requirementKind: requirement.kind,
    authorityKind: requirement.authorityNeeded,
    sourceLabel: 'PRELUDE 60 manufacturer technical sheet',
    sourceRef: 'manufacturer-sheet.pdf#page=12',
    submittedByRole: 'TECHNICAL_USER',
    submittedAt: '2026-09-07T10:10:00+03:00',
  })
  const sourceReview = createCanonicalProfileAssemblyEvidenceIntakeHumanReviewRecord(readiness, [submission], {
    reviewId: 'bundle-source-review-1',
    submissionId: submission.submissionId,
    reviewerRole: 'TECHNICAL_REVIEWER',
    reviewedAt: '2026-09-07T10:11:00+03:00',
    decision: 'ACCEPT_SOURCE',
  })
  return { readiness, submission, sourceReview }
}

test('PROFILE DATA 03.12 explicitly applies an accepted source to candidate evidence only', () => {
  const { readiness, submission, sourceReview } = bundleFixture()
  const application = createCanonicalProfileAssemblyEvidenceApplicationRecord(readiness, [submission], [sourceReview], {
    applicationId: 'application-1',
    submissionId: submission.submissionId,
    reviewerRole: 'TECHNICAL_REVIEWER',
    decidedAt: '2026-09-07T10:12:00+03:00',
    decision: 'APPLY_ACCEPTED_SOURCE',
  })
  assert.equal(application.appliedToCandidateEvidenceLedger, true)
  assert.equal(application.appliedToValidatedEvidenceLedger, false)
  assert.equal(application.requirementSatisfied, false)
  assert.equal(application.productionUnlockAllowed, false)
})

test('PROFILE DATA 03.12 refuses application when the source is not human accepted', () => {
  const { readiness, submission } = bundleFixture()
  assert.throws(() => createCanonicalProfileAssemblyEvidenceApplicationRecord(readiness, [submission], [], {
    applicationId: 'application-no-review',
    submissionId: submission.submissionId,
    reviewerRole: 'TECHNICAL_REVIEWER',
    decidedAt: '2026-09-07T10:13:00+03:00',
    decision: 'APPLY_ACCEPTED_SOURCE',
  }), /not a current HUMAN_ACCEPTED_SOURCE/)
})

test('PROFILE DATA 03.12 HOLD and NEEDS_FURTHER_REVIEW require a human note', () => {
  const { readiness, submission, sourceReview } = bundleFixture()
  assert.throws(() => createCanonicalProfileAssemblyEvidenceApplicationRecord(readiness, [submission], [sourceReview], {
    applicationId: 'hold-no-note',
    submissionId: submission.submissionId,
    reviewerRole: 'TECHNICAL_REVIEWER',
    decidedAt: '2026-09-07T10:14:00+03:00',
    decision: 'HOLD_SOURCE',
  }), /requires a human note/)
})

test('PROFILE DATA 03.12 invalidates an old application when the accepted source review changes', () => {
  const { readiness, submission, sourceReview } = bundleFixture()
  const application = createCanonicalProfileAssemblyEvidenceApplicationRecord(readiness, [submission], [sourceReview], {
    applicationId: 'application-stale',
    submissionId: submission.submissionId,
    reviewerRole: 'TECHNICAL_REVIEWER',
    decidedAt: '2026-09-07T10:15:00+03:00',
    decision: 'APPLY_ACCEPTED_SOURCE',
  })
  const changedReview = { ...sourceReview, note: 'Changed review note.' }
  assert.notEqual(canonicalProfileAssemblyEvidenceHumanReviewSignature(changedReview), application.sourceReviewSignature)
  const gate = buildCanonicalProfileAssemblyEvidenceApplicationGate({
    readiness,
    submissions: [submission],
    sourceReviews: [changedReview],
    records: [application],
  })
  assert.equal(gate.status, 'STALE_APPLICATION_REQUIRED')
  assert.equal(gate.staleApplicationCount, 1)
})

test('PROFILE DATA 03.13 creates a candidate ledger entry without creating validated evidence', () => {
  const { readiness, submission, sourceReview } = bundleFixture()
  const application = createCanonicalProfileAssemblyEvidenceApplicationRecord(readiness, [submission], [sourceReview], {
    applicationId: 'application-candidate',
    submissionId: submission.submissionId,
    reviewerRole: 'TECHNICAL_REVIEWER',
    decidedAt: '2026-09-07T10:16:00+03:00',
    decision: 'APPLY_ACCEPTED_SOURCE',
  })
  const ledger = buildCanonicalProfileCandidateEvidenceLedger({
    readiness,
    submissions: [submission],
    sourceReviews: [sourceReview],
    applicationRecords: [application],
  })
  assert.equal(ledger.status, 'CANDIDATE_EVIDENCE_PENDING_REQUIREMENT_REVIEW_PRODUCTION_LOCKED')
  assert.equal(ledger.candidateEvidenceCount, 1)
  assert.equal(ledger.entries[0]!.requirementSatisfied, false)
  assert.equal(ledger.validatedEvidenceCreated, false)
  assert.equal(ledger.productionUnlockAllowed, false)
})

test('PROFILE DATA 03.14 records knowledge requirement satisfaction without mutating source readiness or unlocking production', () => {
  const { readiness, submission, sourceReview } = bundleFixture()
  const application = createCanonicalProfileAssemblyEvidenceApplicationRecord(readiness, [submission], [sourceReview], {
    applicationId: 'application-satisfaction',
    submissionId: submission.submissionId,
    reviewerRole: 'TECHNICAL_REVIEWER',
    decidedAt: '2026-09-07T10:17:00+03:00',
    decision: 'APPLY_ACCEPTED_SOURCE',
  })
  const ledger = buildCanonicalProfileCandidateEvidenceLedger({ readiness, submissions: [submission], sourceReviews: [sourceReview], applicationRecords: [application] })
  const review = createCanonicalProfileEvidenceRequirementReviewRecord(ledger, {
    reviewId: 'requirement-review-1',
    candidateEvidenceId: ledger.entries[0]!.candidateEvidenceId,
    reviewerRole: 'TECHNICAL_REVIEWER',
    reviewedAt: '2026-09-07T10:18:00+03:00',
    decision: 'SATISFIES_KNOWLEDGE_REQUIREMENT',
  })
  const gate = buildCanonicalProfileEvidenceRequirementSatisfactionGate({ readiness, ledger, records: [review] })
  assert.equal(gate.status, 'KNOWLEDGE_REQUIREMENT_SATISFACTION_RECORDED_PRODUCTION_LOCKED')
  assert.equal(gate.totalMissingRequirementCountAtSource, 10)
  assert.equal(gate.knowledgeRequirementSatisfiedCount, 1)
  assert.equal(gate.projectedRemainingKnowledgeRequirementCount, 9)
  assert.equal(gate.sourceReadinessMutated, false)
  assert.equal(readiness.totalMissingRequirementCount, 10)
  assert.equal(gate.productionCompatibilityValidated, false)
  assert.equal(gate.productionUnlockAllowed, false)
})

test('PROFILE DATA 03.14 negative requirement decisions require a note and remain human action required', () => {
  const { readiness, submission, sourceReview } = bundleFixture()
  const application = createCanonicalProfileAssemblyEvidenceApplicationRecord(readiness, [submission], [sourceReview], {
    applicationId: 'application-negative',
    submissionId: submission.submissionId,
    reviewerRole: 'TECHNICAL_REVIEWER',
    decidedAt: '2026-09-07T10:19:00+03:00',
    decision: 'APPLY_ACCEPTED_SOURCE',
  })
  const ledger = buildCanonicalProfileCandidateEvidenceLedger({ readiness, submissions: [submission], sourceReviews: [sourceReview], applicationRecords: [application] })
  assert.throws(() => createCanonicalProfileEvidenceRequirementReviewRecord(ledger, {
    reviewId: 'requirement-negative-no-note',
    candidateEvidenceId: ledger.entries[0]!.candidateEvidenceId,
    reviewerRole: 'TECHNICAL_REVIEWER',
    reviewedAt: '2026-09-07T10:20:00+03:00',
    decision: 'INSUFFICIENT_EVIDENCE',
  }), /requires a human note/)
  const review = createCanonicalProfileEvidenceRequirementReviewRecord(ledger, {
    reviewId: 'requirement-negative-note',
    candidateEvidenceId: ledger.entries[0]!.candidateEvidenceId,
    reviewerRole: 'TECHNICAL_REVIEWER',
    reviewedAt: '2026-09-07T10:21:00+03:00',
    decision: 'NEEDS_MORE_EVIDENCE',
    note: 'Need an additional page proving the exact relation.',
  })
  const gate = buildCanonicalProfileEvidenceRequirementSatisfactionGate({ readiness, ledger, records: [review] })
  assert.equal(gate.status, 'HUMAN_ACTION_REQUIRED')
})

test('PROFILE DATA 03.14 invalidates an old requirement review when candidate evidence changes', () => {
  const { readiness, submission, sourceReview } = bundleFixture()
  const application = createCanonicalProfileAssemblyEvidenceApplicationRecord(readiness, [submission], [sourceReview], {
    applicationId: 'application-review-stale',
    submissionId: submission.submissionId,
    reviewerRole: 'TECHNICAL_REVIEWER',
    decidedAt: '2026-09-07T10:22:00+03:00',
    decision: 'APPLY_ACCEPTED_SOURCE',
  })
  const ledger = buildCanonicalProfileCandidateEvidenceLedger({ readiness, submissions: [submission], sourceReviews: [sourceReview], applicationRecords: [application] })
  const review = createCanonicalProfileEvidenceRequirementReviewRecord(ledger, {
    reviewId: 'candidate-review-stale',
    candidateEvidenceId: ledger.entries[0]!.candidateEvidenceId,
    reviewerRole: 'TECHNICAL_REVIEWER',
    reviewedAt: '2026-09-07T10:23:00+03:00',
    decision: 'SATISFIES_KNOWLEDGE_REQUIREMENT',
  })
  const changedLedger = { ...ledger, entries: [{ ...ledger.entries[0]!, sourceRef: 'manufacturer-sheet-v2.pdf#page=12' }] }
  assert.notEqual(canonicalProfileCandidateEvidenceEntrySignature(changedLedger.entries[0]!), review.sourceCandidateEvidenceSignature)
  const gate = buildCanonicalProfileEvidenceRequirementSatisfactionGate({ readiness, ledger: changedLedger, records: [review] })
  assert.equal(gate.status, 'STALE_REVIEW_REQUIRED')
})

test('PROFILE DATA 03.12-03.14 UI is bundled under the 03.11 panel and all production locks remain explicit', () => {
  const parent = readFileSync('src/components/CanonicalProfileAssemblyEvidenceIntakeHumanReviewPanel.tsx', 'utf8')
  const bundle = readFileSync('src/components/CanonicalProfileEvidenceApplicationBundlePanel.tsx', 'utf8')
  assert.match(parent, /CanonicalProfileEvidenceApplicationBundlePanel/)
  assert.match(parent, /sourceReviews=\{records\}/)
  assert.match(bundle, /EVIDENCE APPLICATION BUNDLE · 03\.12–03\.14/)
  assert.match(bundle, /APPLY to candidate ledger/)
  assert.match(bundle, /SATISFIES knowledge requirement/)
  assert.match(bundle, /Source readiness mutated:<\/strong> NO/)
  assert.match(bundle, /Manufacturer approval:<\/strong> NO/)
  assert.match(bundle, /Production unlock:<\/strong> NO/)
  assert.equal(PROFILE_DATA_03_12_SAFETY.appliedToValidatedEvidenceLedger, false)
  assert.equal(PROFILE_DATA_03_13_SAFETY.validatedEvidenceCreated, false)
  assert.equal(PROFILE_DATA_03_14_SAFETY.sourceReadinessMutated, false)
  assert.equal(PROFILE_DATA_03_14_SAFETY.productionUnlockAllowed, false)
  assert.equal(PROFILE_DATA_03_14_SAFETY.machineReady, false)
})
