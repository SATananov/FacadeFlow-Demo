import assert from 'node:assert/strict'
import { extname, join } from 'node:path'
import { readdirSync, readFileSync } from 'node:fs'
import test from 'node:test'
import {
  extractSkyGlazingLteObservations,
  extractSkyGlazingXmlObservations,
} from '../src/realProduction/skyGlazingObservationExtraction'
import { aggregateSkyGlazingObservationPatterns } from '../src/realProduction/skyGlazingObservationAggregation'
import {
  buildProductionPatternCandidateSet,
  reviewProductionPatternCandidate,
} from '../src/realProduction/skyGlazingProductionPatternCandidates'

const sampleDir = join(process.cwd(), 'local-samples', 'phase05a')
const sampleNames = readdirSync(sampleDir)
const xmlName = sampleNames.find((name) => extname(name).toLowerCase() === '.xml')
const lteName = sampleNames.find((name) => extname(name).toLowerCase() === '.lte')
if (!xmlName || !lteName) throw new Error('RP01.3 requires the locked Vadim XML/LTE sample pair.')

const xml = readFileSync(join(sampleDir, xmlName), 'utf8')
const lte = readFileSync(join(sampleDir, lteName)).toString('latin1')
const aggregation = aggregateSkyGlazingObservationPatterns(
  extractSkyGlazingXmlObservations(xml),
  extractSkyGlazingLteObservations(lte),
)
const candidateSet = buildProductionPatternCandidateSet(aggregation, 'Вадим-2')

const candidatesFor = (profileCode: string) =>
  candidateSet.candidates.filter((candidate) => candidate.profileCode === profileCode)

test('RP01.3 promotes only repeated RP01.2 observations into review candidates, never rules', () => {
  assert.equal(candidateSet.candidateCount, 74)
  assert.equal(candidateSet.cutTupleCandidateCount, 4)
  assert.equal(candidateSet.exactOperationCandidateCount, 70)
  assert.ok(candidateSet.candidates.every((candidate) => candidate.evidenceCount >= 2))
  assert.ok(candidateSet.candidates.every((candidate) => candidate.sourceMultiplicity === 'REPEATED_OBSERVATION'))
  assert.ok(candidateSet.candidates.every((candidate) => candidate.status === 'CANDIDATE_PRODUCTION_PATTERN'))
  assert.ok(candidateSet.candidates.every((candidate) => candidate.reviewStatus === 'NOT_REVIEWED'))
})

test('RP01.3 candidate counts stay tied to the real Vadim repeated-pattern corpus', () => {
  assert.deepEqual(
    ['78.01', '78.27', '78.33', '78.51'].map((code) => ({ code, candidates: candidatesFor(code).length })),
    [
      { code: '78.01', candidates: 19 },
      { code: '78.27', candidates: 6 },
      { code: '78.33', candidates: 48 },
      { code: '78.51', candidates: 1 },
    ],
  )
})

test('RP01.3 intentionally excludes single cut observations and broad operation-name frequency as candidate types', () => {
  assert.deepEqual(new Set(candidateSet.candidates.map((candidate) => candidate.kind)), new Set(['CUT_TUPLE', 'EXACT_OPERATION']))
  assert.equal(
    candidateSet.candidates.some((candidate) =>
      candidate.profileCode === '78.01'
      && candidate.kind === 'CUT_TUPLE'
      && candidate.sourcePatternKey === 'sxB=135|dxB=90|sxC=90|dxC=90'),
    false,
  )
  assert.equal(
    candidateSet.candidates.some((candidate) => candidate.sourcePatternKey === 'STD_HOLE'),
    false,
  )
})

test('RP01.3 preserves the strongest repeated cut tuple as evidence without universalizing it', () => {
  const candidate = candidateSet.candidates.find((item) =>
    item.profileCode === '78.01'
    && item.kind === 'CUT_TUPLE'
    && item.sourcePatternKey === 'sxB=135|dxB=135|sxC=90|dxC=90')
  assert.ok(candidate)
  assert.equal(candidate.evidenceCount, 27)
  assert.equal(candidate.singleProjectOnly, true)
  assert.equal(candidate.crossProjectCorroborated, false)
  assert.equal(candidate.universalRuleInferenceAllowed, false)
  assert.equal(candidate.productionRuleCreated, false)
})

test('RP01.3 human confirmation confirms candidate status only and cannot create a production rule', () => {
  const candidate = candidateSet.candidates.find((item) => item.kind === 'EXACT_OPERATION')!
  const result = reviewProductionPatternCandidate(
    candidate,
    'CONFIRM_CANDIDATE',
    'Human technologist',
    '2026-09-01T07:30:00+03:00',
    'Worth comparing against future projects.',
  )
  assert.equal(result.status, 'RECORDED')
  assert.equal(result.candidate.reviewStatus, 'CONFIRMED_AS_CANDIDATE')
  assert.equal(result.candidate.humanConfirmedAsCandidate, true)
  assert.equal(result.candidate.candidateIsProductionRule, false)
  assert.equal(result.candidate.productionRuleCreated, false)
  assert.equal(result.candidate.machineReady, false)
  assert.equal(result.candidate.productionApproved, false)
})

test('RP01.3 records an explicit human candidate rejection without deleting source evidence', () => {
  const candidate = candidateSet.candidates[0]!
  const result = reviewProductionPatternCandidate(
    candidate,
    'REJECT_CANDIDATE',
    'Human technologist',
    '2026-09-01T07:31:00+03:00',
    'Observed repetition is not considered a reusable candidate.',
  )
  assert.equal(result.status, 'RECORDED')
  assert.equal(result.candidate.reviewStatus, 'REJECTED_AS_CANDIDATE')
  assert.equal(result.candidate.humanRejectedAsCandidate, true)
  assert.equal(result.candidate.sourcePatternKey, candidate.sourcePatternKey)
  assert.equal(result.candidate.evidenceCount, candidate.evidenceCount)
})

test('RP01.3 refuses anonymous, undated, or repeated review recording', () => {
  const candidate = candidateSet.candidates[0]!
  const missingMetadata = reviewProductionPatternCandidate(candidate, 'CONFIRM_CANDIDATE', '', '')
  assert.equal(missingMetadata.status, 'NOT_RECORDED')
  assert.deepEqual(missingMetadata.reasons, ['REVIEWER_REQUIRED', 'REVIEW_TIMESTAMP_REQUIRED'])
  assert.equal(missingMetadata.candidate.reviewStatus, 'NOT_REVIEWED')

  const first = reviewProductionPatternCandidate(
    candidate,
    'CONFIRM_CANDIDATE',
    'Human technologist',
    '2026-09-01T07:32:00+03:00',
  )
  const second = reviewProductionPatternCandidate(
    first.candidate,
    'REJECT_CANDIDATE',
    'Another reviewer',
    '2026-09-01T07:33:00+03:00',
  )
  assert.equal(second.status, 'NOT_RECORDED')
  assert.deepEqual(second.reasons, ['CANDIDATE_ALREADY_REVIEWED'])
})

test('RP01.3 stays single-project, non-automatic, non-machine and non-production', () => {
  assert.equal(candidateSet.sourceProject, 'Вадим-2')
  assert.equal(candidateSet.singleProjectOnly, true)
  assert.equal(candidateSet.crossProjectCorroborated, false)
  assert.equal(candidateSet.automaticRulePromotionAllowed, false)
  assert.equal(candidateSet.productionRuleCreated, false)
  assert.equal(candidateSet.machineReady, false)
  assert.equal(candidateSet.productionApproved, false)

  const source = readFileSync('src/realProduction/skyGlazingProductionPatternCandidates.ts', 'utf8')
  assert.doesNotMatch(source, /productionRuleCreated:\s*true/)
  assert.doesNotMatch(source, /machineReady:\s*true/)
  assert.doesNotMatch(source, /productionApproved:\s*true/)
})
