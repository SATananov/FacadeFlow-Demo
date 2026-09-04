import assert from 'node:assert/strict'
import { extname, join } from 'node:path'
import { readdirSync, readFileSync } from 'node:fs'
import test from 'node:test'
import {
  extractSkyGlazingLteObservations,
  extractSkyGlazingXmlObservations,
} from '../src/realProduction/skyGlazingObservationExtraction'
import { aggregateSkyGlazingObservationPatterns } from '../src/realProduction/skyGlazingObservationAggregation'
import { buildProductionPatternCandidateSet } from '../src/realProduction/skyGlazingProductionPatternCandidates'
import {
  assessProductionPatternCandidateReviewEntry,
  buildProductionPatternCandidateReviewLedger,
  productionPatternCandidateEvidenceFingerprint,
  recordProductionPatternCandidateReview,
} from '../src/realProduction/skyGlazingProductionPatternReviewLedger'

const sampleDir = join(process.cwd(), 'local-samples', 'phase05a')
const sampleNames = readdirSync(sampleDir)
const xmlName = sampleNames.find((name) => extname(name).toLowerCase() === '.xml')
const lteName = sampleNames.find((name) => extname(name).toLowerCase() === '.lte')
if (!xmlName || !lteName) throw new Error('RP01.4 requires the locked Vadim XML/LTE sample pair.')

const xml = readFileSync(join(sampleDir, xmlName), 'utf8')
const lte = readFileSync(join(sampleDir, lteName)).toString('latin1')
const aggregation = aggregateSkyGlazingObservationPatterns(
  extractSkyGlazingXmlObservations(xml),
  extractSkyGlazingLteObservations(lte),
)
const candidateSet = buildProductionPatternCandidateSet(aggregation, 'Вадим-2')
const candidate = candidateSet.candidates.find((item) =>
  item.profileCode === '78.01'
  && item.kind === 'CUT_TUPLE'
  && item.sourcePatternKey === 'sxB=135|dxB=135|sxC=90|dxC=90')
if (!candidate) throw new Error('RP01.4 expected the repeated 78.01 cut-tuple candidate.')

test('RP01.4 records an append-only human candidate review with exact evidence fingerprint provenance', () => {
  const result = recordProductionPatternCandidateReview(
    [],
    candidateSet.candidates,
    candidate,
    'CONFIRM_CANDIDATE',
    'Human technologist',
    '2026-09-01T07:40:00+03:00',
    'Keep as candidate for later cross-project comparison.',
  )

  assert.equal(result.status, 'RECORDED')
  assert.ok(result.entry)
  assert.equal(result.entry.decision, 'CONFIRMED_AS_CANDIDATE')
  assert.equal(result.entry.reviewer, 'Human technologist')
  assert.equal(result.entry.sourceEvidenceCountAtReview, 27)
  assert.equal(result.entry.evidenceFingerprint.version, 'RP01.4-EVIDENCE-V1')
  assert.deepEqual(
    result.entry.evidenceFingerprint,
    productionPatternCandidateEvidenceFingerprint(candidate),
  )
  assert.equal(result.ledger.appendOnly, true)
})

test('RP01.4 records explicit rejection as candidate-review history without deleting the candidate evidence', () => {
  const result = recordProductionPatternCandidateReview(
    [],
    candidateSet.candidates,
    candidate,
    'REJECT_CANDIDATE',
    'Human technologist',
    '2026-09-01T07:41:00+03:00',
    'Do not carry this candidate forward.',
  )

  assert.equal(result.status, 'RECORDED')
  assert.equal(result.entry?.decision, 'REJECTED_AS_CANDIDATE')
  assert.equal(result.entry?.sourcePatternKeyAtReview, candidate.sourcePatternKey)
  assert.equal(result.entry?.sourceEvidenceCountAtReview, candidate.evidenceCount)
  assert.equal(result.ledger.currentRejectedCount, 1)
})

test('RP01.4 refuses anonymous, undated, or duplicate review of the same current evidence fingerprint', () => {
  const missing = recordProductionPatternCandidateReview(
    [],
    candidateSet.candidates,
    candidate,
    'CONFIRM_CANDIDATE',
    '',
    '',
  )
  assert.equal(missing.status, 'NOT_RECORDED')
  assert.deepEqual(missing.reasons, ['REVIEWER_REQUIRED', 'REVIEW_TIMESTAMP_REQUIRED'])

  const first = recordProductionPatternCandidateReview(
    [],
    candidateSet.candidates,
    candidate,
    'CONFIRM_CANDIDATE',
    'Human technologist',
    '2026-09-01T07:42:00+03:00',
  )
  const second = recordProductionPatternCandidateReview(
    first.ledger.entries,
    candidateSet.candidates,
    candidate,
    'REJECT_CANDIDATE',
    'Another technologist',
    '2026-09-01T07:43:00+03:00',
  )
  assert.equal(second.status, 'NOT_RECORDED')
  assert.deepEqual(second.reasons, ['CURRENT_REVIEW_ALREADY_RECORDED'])
})

test('RP01.4 keeps an unchanged candidate review CURRENT', () => {
  const recorded = recordProductionPatternCandidateReview(
    [],
    candidateSet.candidates,
    candidate,
    'CONFIRM_CANDIDATE',
    'Human technologist',
    '2026-09-01T07:44:00+03:00',
  )
  const assessment = assessProductionPatternCandidateReviewEntry(recorded.entry!, candidate)

  assert.equal(assessment.state, 'CURRENT')
  assert.deepEqual(assessment.reasons, [])
  assert.equal(assessment.decisionCurrentlyUsableAsCandidateReview, true)
})

test('RP01.4 marks the old decision stale when the underlying evidence count changes', () => {
  const recorded = recordProductionPatternCandidateReview(
    [],
    candidateSet.candidates,
    candidate,
    'CONFIRM_CANDIDATE',
    'Human technologist',
    '2026-09-01T07:45:00+03:00',
  )
  const changedCandidate = Object.freeze({
    ...candidate,
    evidenceCount: candidate.evidenceCount + 1,
  })
  const assessment = assessProductionPatternCandidateReviewEntry(recorded.entry!, changedCandidate)

  assert.equal(assessment.state, 'STALE_REQUIRES_REVIEW')
  assert.deepEqual(assessment.reasons, ['EVIDENCE_FINGERPRINT_CHANGED'])
  assert.equal(assessment.decisionCurrentlyUsableAsCandidateReview, false)
})

test('RP01.4 marks the old decision stale when the candidate disappears from current evidence', () => {
  const recorded = recordProductionPatternCandidateReview(
    [],
    candidateSet.candidates,
    candidate,
    'CONFIRM_CANDIDATE',
    'Human technologist',
    '2026-09-01T07:46:00+03:00',
  )
  const assessment = assessProductionPatternCandidateReviewEntry(recorded.entry!, null)

  assert.equal(assessment.state, 'STALE_REQUIRES_REVIEW')
  assert.deepEqual(assessment.reasons, ['CANDIDATE_MISSING'])
  assert.equal(assessment.currentEvidenceFingerprint, null)
})

test('RP01.4 preserves stale history and allows a new review only for changed current evidence', () => {
  const first = recordProductionPatternCandidateReview(
    [],
    candidateSet.candidates,
    candidate,
    'CONFIRM_CANDIDATE',
    'Human technologist',
    '2026-09-01T07:47:00+03:00',
  )
  const changedCandidate = Object.freeze({
    ...candidate,
    evidenceCount: candidate.evidenceCount + 1,
  })
  const currentCandidates = candidateSet.candidates.map((item) =>
    item.id === changedCandidate.id ? changedCandidate : item)
  const second = recordProductionPatternCandidateReview(
    first.ledger.entries,
    currentCandidates,
    changedCandidate,
    'REJECT_CANDIDATE',
    'Senior technologist',
    '2026-09-01T07:48:00+03:00',
    'Evidence changed; review repeated.',
  )

  assert.equal(second.status, 'RECORDED')
  assert.equal(second.ledger.entryCount, 2)
  assert.equal(second.ledger.currentEntryCount, 1)
  assert.equal(second.ledger.staleEntryCount, 1)
  assert.equal(second.ledger.currentRejectedCount, 1)
  assert.deepEqual(second.ledger.staleCandidateIds, [candidate.id])
})

test('RP01.4 ledger never promotes a candidate review to a production rule or machine/production approval', () => {
  const recorded = recordProductionPatternCandidateReview(
    [],
    candidateSet.candidates,
    candidate,
    'CONFIRM_CANDIDATE',
    'Human technologist',
    '2026-09-01T07:49:00+03:00',
  )
  const ledger = buildProductionPatternCandidateReviewLedger(
    recorded.ledger.entries,
    candidateSet.candidates,
  )

  assert.equal(ledger.automaticRulePromotionAllowed, false)
  assert.equal(ledger.productionRuleCreated, false)
  assert.equal(ledger.machineReady, false)
  assert.equal(ledger.productionApproved, false)
  assert.equal(recorded.entry?.candidateIsProductionRule, false)
  assert.equal(recorded.entry?.productionRuleCreated, false)
  assert.equal(recorded.entry?.machineReady, false)
  assert.equal(recorded.entry?.productionApproved, false)

  const source = readFileSync('src/realProduction/skyGlazingProductionPatternReviewLedger.ts', 'utf8')
  assert.doesNotMatch(source, /productionRuleCreated:\s*true/)
  assert.doesNotMatch(source, /machineReady:\s*true/)
  assert.doesNotMatch(source, /productionApproved:\s*true/)
})
