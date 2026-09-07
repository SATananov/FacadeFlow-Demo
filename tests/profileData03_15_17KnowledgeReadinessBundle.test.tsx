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
import { createCanonicalProfileAssemblyEvidenceIntakeHumanReviewRecord } from '../src/aiCanonicalProfileAssemblyEvidenceIntakeHumanReview'
import { createCanonicalProfileAssemblyEvidenceApplicationRecord } from '../src/aiCanonicalProfileAssemblyEvidenceApplicationGate'
import { buildCanonicalProfileCandidateEvidenceLedger } from '../src/aiCanonicalProfileCandidateEvidenceLedger'
import {
  createCanonicalProfileEvidenceRequirementReviewRecord,
} from '../src/aiCanonicalProfileEvidenceRequirementSatisfaction'
import {
  buildCanonicalProfileEvidenceResolutionGate,
  canonicalProfileEvidenceRequirementReviewSignature,
  createCanonicalProfileEvidenceResolutionRecord,
  PROFILE_DATA_03_15_SAFETY,
} from '../src/aiCanonicalProfileEvidenceResolutionDecision'
import {
  buildCanonicalProfileEvidenceResolutionAggregation,
  PROFILE_DATA_03_16_SAFETY,
} from '../src/aiCanonicalProfileEvidenceResolutionAggregation'
import {
  buildCanonicalProfileKnowledgeReadinessSummary,
  PROFILE_DATA_03_17_SAFETY,
} from '../src/aiCanonicalProfileKnowledgeReadinessSummary'

function knowledgeBundleFixture() {
  const intent = createFacadeFlowProductIntent({
    id: 'profile-data03-15-17-bundle',
    sourceKind: 'MANUAL',
    sourceText: 'PRELUDE 60 knowledge readiness bundle fixture.',
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
    reviewId: `knowledge-relation-review-${index}`,
    relation: row.relation,
    reviewerRole: 'TECHNICAL_REVIEWER',
    reviewedAt: `2026-09-07T11:0${index}:00+03:00`,
    decision: 'ACCEPT_CURRENT_EVIDENCE',
  }))
  const relationGate = buildCanonicalProfileAssemblyEvidenceHumanReviewGate({ bridge: evidence, records: relationReviews })
  const summary = buildCanonicalProfileAssemblyEvidenceReviewSummary(relationGate)
  const readiness = buildCanonicalProfileAssemblyEvidenceReadiness(summary)

  const row = readiness.rows.find((item) => item.relation === 'FRAME_SASH')!
  const requirement = row.requirements.find((item) => item.kind === 'MANUFACTURER_PAIR_RELATION_EVIDENCE')!
  const submission = createCanonicalProfileAssemblyEvidenceSubmissionRecord(readiness, {
    submissionId: 'knowledge-source-1',
    relation: row.relation,
    requirementKind: requirement.kind,
    authorityKind: requirement.authorityNeeded,
    sourceLabel: 'PRELUDE 60 manufacturer technical sheet',
    sourceRef: 'manufacturer-sheet.pdf#page=12',
    submittedByRole: 'TECHNICAL_USER',
    submittedAt: '2026-09-07T11:10:00+03:00',
  })
  const sourceReview = createCanonicalProfileAssemblyEvidenceIntakeHumanReviewRecord(readiness, [submission], {
    reviewId: 'knowledge-source-review-1',
    submissionId: submission.submissionId,
    reviewerRole: 'TECHNICAL_REVIEWER',
    reviewedAt: '2026-09-07T11:11:00+03:00',
    decision: 'ACCEPT_SOURCE',
  })
  const application = createCanonicalProfileAssemblyEvidenceApplicationRecord(readiness, [submission], [sourceReview], {
    applicationId: 'knowledge-application-1',
    submissionId: submission.submissionId,
    reviewerRole: 'TECHNICAL_REVIEWER',
    decidedAt: '2026-09-07T11:12:00+03:00',
    decision: 'APPLY_ACCEPTED_SOURCE',
  })
  const ledger = buildCanonicalProfileCandidateEvidenceLedger({
    readiness,
    submissions: [submission],
    sourceReviews: [sourceReview],
    applicationRecords: [application],
  })
  const requirementReview = createCanonicalProfileEvidenceRequirementReviewRecord(ledger, {
    reviewId: 'knowledge-requirement-review-1',
    candidateEvidenceId: ledger.entries[0]!.candidateEvidenceId,
    reviewerRole: 'TECHNICAL_REVIEWER',
    reviewedAt: '2026-09-07T11:13:00+03:00',
    decision: 'SATISFIES_KNOWLEDGE_REQUIREMENT',
  })

  return { readiness, ledger, requirementReview }
}

test('PROFILE DATA 03.15 resolves only a current human-satisfied knowledge requirement', () => {
  const { readiness, ledger, requirementReview } = knowledgeBundleFixture()
  const resolution = createCanonicalProfileEvidenceResolutionRecord({
    readiness,
    ledger,
    requirementReviews: [requirementReview],
    resolution: {
      resolutionId: 'knowledge-resolution-1',
      candidateEvidenceId: ledger.entries[0]!.candidateEvidenceId,
      reviewerRole: 'TECHNICAL_REVIEWER',
      decidedAt: '2026-09-07T11:14:00+03:00',
      decision: 'RESOLVE_FOR_KNOWLEDGE_READINESS',
    },
  })
  assert.equal(resolution.resolvedForKnowledgeReadiness, true)
  assert.equal(resolution.validatedEvidenceCreated, false)
  assert.equal(resolution.createsManufacturerApproval, false)
  assert.equal(resolution.productionUnlockAllowed, false)
})

test('PROFILE DATA 03.15 refuses resolution when 03.14 did not satisfy the requirement', () => {
  const { readiness, ledger } = knowledgeBundleFixture()
  const negativeReview = createCanonicalProfileEvidenceRequirementReviewRecord(ledger, {
    reviewId: 'knowledge-negative-review',
    candidateEvidenceId: ledger.entries[0]!.candidateEvidenceId,
    reviewerRole: 'TECHNICAL_REVIEWER',
    reviewedAt: '2026-09-07T11:15:00+03:00',
    decision: 'NEEDS_MORE_EVIDENCE',
    note: 'Need stronger authority.',
  })
  assert.throws(() => createCanonicalProfileEvidenceResolutionRecord({
    readiness,
    ledger,
    requirementReviews: [negativeReview],
    resolution: {
      resolutionId: 'invalid-resolution',
      candidateEvidenceId: ledger.entries[0]!.candidateEvidenceId,
      reviewerRole: 'TECHNICAL_REVIEWER',
      decidedAt: '2026-09-07T11:16:00+03:00',
      decision: 'RESOLVE_FOR_KNOWLEDGE_READINESS',
    },
  }), /cannot be resolved for knowledge readiness/)
})

test('PROFILE DATA 03.15 KEEP_UNRESOLVED and REOPEN_FOR_EVIDENCE require a human note', () => {
  const { readiness, ledger, requirementReview } = knowledgeBundleFixture()
  assert.throws(() => createCanonicalProfileEvidenceResolutionRecord({
    readiness,
    ledger,
    requirementReviews: [requirementReview],
    resolution: {
      resolutionId: 'keep-no-note',
      candidateEvidenceId: ledger.entries[0]!.candidateEvidenceId,
      reviewerRole: 'TECHNICAL_REVIEWER',
      decidedAt: '2026-09-07T11:17:00+03:00',
      decision: 'KEEP_UNRESOLVED',
    },
  }), /requires a human note/)
})

test('PROFILE DATA 03.15 invalidates stale resolution when the 03.14 review changes', () => {
  const { readiness, ledger, requirementReview } = knowledgeBundleFixture()
  const resolution = createCanonicalProfileEvidenceResolutionRecord({
    readiness,
    ledger,
    requirementReviews: [requirementReview],
    resolution: {
      resolutionId: 'stale-resolution',
      candidateEvidenceId: ledger.entries[0]!.candidateEvidenceId,
      reviewerRole: 'TECHNICAL_REVIEWER',
      decidedAt: '2026-09-07T11:18:00+03:00',
      decision: 'RESOLVE_FOR_KNOWLEDGE_READINESS',
    },
  })
  const changedReview = { ...requirementReview, note: 'Changed after resolution.' }
  assert.notEqual(canonicalProfileEvidenceRequirementReviewSignature(changedReview), resolution.sourceRequirementReviewSignature)
  const gate = buildCanonicalProfileEvidenceResolutionGate({
    readiness,
    ledger,
    requirementReviews: [changedReview],
    records: [resolution],
  })
  assert.equal(gate.status, 'STALE_RESOLUTION_REQUIRED')
  assert.equal(gate.staleResolutionCount, 1)
})

test('PROFILE DATA 03.16 aggregates all original readiness requirements, not only submitted candidates', () => {
  const { readiness, ledger, requirementReview } = knowledgeBundleFixture()
  const resolution = createCanonicalProfileEvidenceResolutionRecord({
    readiness,
    ledger,
    requirementReviews: [requirementReview],
    resolution: {
      resolutionId: 'aggregate-resolution',
      candidateEvidenceId: ledger.entries[0]!.candidateEvidenceId,
      reviewerRole: 'TECHNICAL_REVIEWER',
      decidedAt: '2026-09-07T11:19:00+03:00',
      decision: 'RESOLVE_FOR_KNOWLEDGE_READINESS',
    },
  })
  const aggregation = buildCanonicalProfileEvidenceResolutionAggregation({
    readiness,
    ledger,
    requirementReviews: [requirementReview],
    resolutionRecords: [resolution],
  })
  assert.equal(readiness.totalMissingRequirementCount, 10)
  assert.equal(aggregation.totalKnowledgeRequirementCount, 10)
  assert.equal(aggregation.resolvedKnowledgeRequirementCount, 1)
  assert.equal(aggregation.unresolvedKnowledgeRequirementCount, 9)
  assert.equal(aggregation.knowledgeCoveragePercent, 10)
  assert.equal(aggregation.status, 'KNOWLEDGE_REQUIREMENTS_PARTIALLY_RESOLVED_PRODUCTION_LOCKED')
  assert.equal(aggregation.sourceReadinessMutated, false)
})

test('PROFILE DATA 03.17 summarizes relation and overall knowledge coverage while production remains locked', () => {
  const { readiness, ledger, requirementReview } = knowledgeBundleFixture()
  const resolution = createCanonicalProfileEvidenceResolutionRecord({
    readiness,
    ledger,
    requirementReviews: [requirementReview],
    resolution: {
      resolutionId: 'summary-resolution',
      candidateEvidenceId: ledger.entries[0]!.candidateEvidenceId,
      reviewerRole: 'TECHNICAL_REVIEWER',
      decidedAt: '2026-09-07T11:20:00+03:00',
      decision: 'RESOLVE_FOR_KNOWLEDGE_READINESS',
    },
  })
  const aggregation = buildCanonicalProfileEvidenceResolutionAggregation({ readiness, ledger, requirementReviews: [requirementReview], resolutionRecords: [resolution] })
  const summary = buildCanonicalProfileKnowledgeReadinessSummary(aggregation)
  assert.equal(summary.status, 'PROFILE_KNOWLEDGE_PARTIAL_PRODUCTION_LOCKED')
  assert.equal(summary.knowledgeCoveragePercent, 10)
  assert.equal(summary.knowledgeRequirementCoverageComplete, false)
  assert.equal(summary.manufacturerApproval, false)
  assert.equal(summary.exactJointGeometryVerified, false)
  assert.equal(summary.productionCompatibilityValidated, false)
  assert.equal(summary.productionUnlockAllowed, false)
  assert.equal(summary.machineReady, false)
})

test('PROFILE DATA 03.17 all-resolved knowledge coverage still does not imply production readiness', () => {
  const { readiness, ledger, requirementReview } = knowledgeBundleFixture()
  const aggregation = buildCanonicalProfileEvidenceResolutionAggregation({ readiness, ledger, requirementReviews: [requirementReview] })
  const resolvedRows = aggregation.rows.map((row) => ({ ...row, state: 'RESOLVED_FOR_KNOWLEDGE_READINESS' as const, resolvedForKnowledgeReadiness: true }))
  const allResolvedAggregation = {
    ...aggregation,
    status: 'ALL_KNOWLEDGE_REQUIREMENTS_RESOLVED_PRODUCTION_LOCKED' as const,
    rows: resolvedRows,
    resolvedKnowledgeRequirementCount: resolvedRows.length,
    unresolvedKnowledgeRequirementCount: 0,
    knowledgeCoveragePercent: 100,
  }
  const summary = buildCanonicalProfileKnowledgeReadinessSummary(allResolvedAggregation)
  assert.equal(summary.status, 'PROFILE_KNOWLEDGE_REQUIREMENTS_COMPLETE_PRODUCTION_LOCKED')
  assert.equal(summary.knowledgeRequirementCoverageComplete, true)
  assert.equal(summary.knowledgeCoveragePercent, 100)
  assert.equal(summary.productionCompatibilityValidated, false)
  assert.equal(summary.productionRulesValidated, false)
  assert.equal(summary.productionUnlockAllowed, false)
  assert.equal(summary.machineReady, false)
})

test('PROFILE DATA 03.15-03.17 UI is integrated under 03.12-03.14 and safety boundaries are explicit', () => {
  const parent = readFileSync('src/components/CanonicalProfileEvidenceApplicationBundlePanel.tsx', 'utf8')
  const bundle = readFileSync('src/components/CanonicalProfileKnowledgeReadinessBundlePanel.tsx', 'utf8')
  assert.match(parent, /CanonicalProfileKnowledgeReadinessBundlePanel/)
  assert.match(parent, /requirementReviews=\{requirementReviews\}/)
  assert.match(bundle, /KNOWLEDGE READINESS BUNDLE · 03\.15–03\.17/)
  assert.match(bundle, /RESOLVE for knowledge readiness/)
  assert.match(bundle, /Overall knowledge coverage complete:/)
  assert.match(bundle, /Manufacturer approval:<\/strong> NO/)
  assert.match(bundle, /Production compatibility validated:<\/strong> NO/)
  assert.match(bundle, /Production unlock:<\/strong> NO/)
  assert.match(bundle, /Machine ready:<\/strong> NO/)
  assert.equal(PROFILE_DATA_03_15_SAFETY.validatedEvidenceCreated, false)
  assert.equal(PROFILE_DATA_03_16_SAFETY.productionCompatibilityValidated, false)
  assert.equal(PROFILE_DATA_03_17_SAFETY.productionUnlockAllowed, false)
  assert.equal(PROFILE_DATA_03_17_SAFETY.machineReady, false)
})
