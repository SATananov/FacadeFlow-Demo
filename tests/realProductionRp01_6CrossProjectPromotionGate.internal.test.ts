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
  type ProductionPatternCandidate,
  type ProductionPatternCandidateSet,
} from '../src/realProduction/skyGlazingProductionPatternCandidates'
import {
  recordProductionPatternCandidateReview,
  type ProductionPatternCandidateReviewLedgerEntry,
} from '../src/realProduction/skyGlazingProductionPatternReviewLedger'
import {
  buildProductionPatternCrossProjectCorroboration,
} from '../src/realProduction/skyGlazingCrossProjectCorroboration'
import {
  assessCrossProjectHumanPromotionGate,
  buildCrossProjectHumanPromotionGateAssessmentSet,
} from '../src/realProduction/skyGlazingCrossProjectPromotionGate'

const sampleDir = join(process.cwd(), 'local-samples', 'phase05a')
const sampleNames = readdirSync(sampleDir)
const xmlName = sampleNames.find((name) => extname(name).toLowerCase() === '.xml')
const lteName = sampleNames.find((name) => extname(name).toLowerCase() === '.lte')
if (!xmlName || !lteName) throw new Error('RP01.6 requires the locked Vadim XML/LTE sample pair.')

const xml = readFileSync(join(sampleDir, xmlName), 'utf8')
const lte = readFileSync(join(sampleDir, lteName)).toString('latin1')
const vadimCandidateSet = buildProductionPatternCandidateSet(
  aggregateSkyGlazingObservationPatterns(
    extractSkyGlazingXmlObservations(xml),
    extractSkyGlazingLteObservations(lte),
  ),
  'Вадим-2',
)

const repeated7801Cut = vadimCandidateSet.candidates.find((candidate) =>
  candidate.profileCode === '78.01'
  && candidate.kind === 'CUT_TUPLE'
  && candidate.sourcePatternKey === 'sxB=135|dxB=135|sxC=90|dxC=90')
if (!repeated7801Cut) throw new Error('RP01.6 expected the repeated 78.01 cut candidate.')

function syntheticProjectSet(
  sourceProject: string,
  candidates: readonly ProductionPatternCandidate[],
): ProductionPatternCandidateSet {
  return Object.freeze({
    sourceProject,
    candidateCount: candidates.length,
    cutTupleCandidateCount: candidates.filter((candidate) => candidate.kind === 'CUT_TUPLE').length,
    exactOperationCandidateCount: candidates.filter((candidate) => candidate.kind === 'EXACT_OPERATION').length,
    candidates: Object.freeze([...candidates]),
    singleProjectOnly: true,
    crossProjectCorroborated: false,
    automaticRulePromotionAllowed: false,
    productionRuleCreated: false,
    machineReady: false,
    productionApproved: false,
  })
}

function syntheticCandidate(
  candidate: ProductionPatternCandidate,
  sourceProject: string,
  evidenceCount = candidate.evidenceCount,
): ProductionPatternCandidate {
  return Object.freeze({
    ...candidate,
    sourceProject,
    evidenceCount,
    reviewStatus: 'NOT_REVIEWED',
    reviewer: null,
    reviewedAt: null,
    reviewNote: '',
    humanConfirmedAsCandidate: false,
    humanRejectedAsCandidate: false,
    singleProjectOnly: true,
    crossProjectCorroborated: false,
    candidateIsProductionRule: false,
    universalRuleInferenceAllowed: false,
    productionRuleCreated: false,
    machineReady: false,
    productionApproved: false,
  })
}

function matchingCrossProjectFixture() {
  const secondCandidate = syntheticCandidate(
    repeated7801Cut,
    'SYNTHETIC_TEST_PROJECT_B',
    5,
  )
  const secondSet = syntheticProjectSet('SYNTHETIC_TEST_PROJECT_B', [secondCandidate])
  const candidateSets = [vadimCandidateSet, secondSet] as const
  const corroborationSet = buildProductionPatternCrossProjectCorroboration(candidateSets)
  const corroboration = corroborationSet.patterns.find((pattern) =>
    pattern.profileCode === repeated7801Cut.profileCode
    && pattern.kind === repeated7801Cut.kind
    && pattern.sourcePatternKey === repeated7801Cut.sourcePatternKey)
  if (!corroboration) throw new Error('RP01.6 synthetic cross-project corroboration missing.')

  return {
    secondCandidate,
    secondSet,
    candidateSets,
    corroborationSet,
    corroboration,
  }
}

function confirmedReview(
  existing: readonly ProductionPatternCandidateReviewLedgerEntry[],
  currentCandidates: readonly ProductionPatternCandidate[],
  candidate: ProductionPatternCandidate,
  reviewedAt: string,
): ProductionPatternCandidateReviewLedgerEntry[] {
  const result = recordProductionPatternCandidateReview(
    existing,
    currentCandidates,
    candidate,
    'CONFIRM_CANDIDATE',
    'Human technologist',
    reviewedAt,
    'RP01.6 gate qualification review.',
  )
  assert.equal(result.status, 'RECORDED')
  assert.ok(result.entry)
  return [...result.ledger.entries]
}

function rejectedReview(
  existing: readonly ProductionPatternCandidateReviewLedgerEntry[],
  currentCandidates: readonly ProductionPatternCandidate[],
  candidate: ProductionPatternCandidate,
  reviewedAt: string,
): ProductionPatternCandidateReviewLedgerEntry[] {
  const result = recordProductionPatternCandidateReview(
    existing,
    currentCandidates,
    candidate,
    'REJECT_CANDIDATE',
    'Human technologist',
    reviewedAt,
    'RP01.6 negative candidate review.',
  )
  assert.equal(result.status, 'RECORDED')
  assert.ok(result.entry)
  return [...result.ledger.entries]
}

test('RP01.6 keeps every current real Vadim pattern blocked because no real cross-project evidence exists', () => {
  const corroborationSet = buildProductionPatternCrossProjectCorroboration([vadimCandidateSet])
  const result = buildCrossProjectHumanPromotionGateAssessmentSet(
    corroborationSet,
    [vadimCandidateSet],
    [],
  )

  assert.equal(result.assessmentCount, 74)
  assert.equal(result.blockedCount, 74)
  assert.equal(result.eligibleForHumanPromotionReviewCount, 0)
  assert.ok(result.assessments.every((assessment) => assessment.state === 'BLOCKED'))
  assert.ok(result.assessments.every((assessment) =>
    assessment.reasons.includes('NOT_CROSS_PROJECT_CORROBORATED')))
  assert.equal(result.realProjectInferencePerformed, false)
})

test('RP01.6 requires a current confirmed candidate review from every distinct corroborating project', () => {
  const fixture = matchingCrossProjectFixture()
  const currentCandidates = [
    ...vadimCandidateSet.candidates,
    ...fixture.secondSet.candidates,
  ]

  let reviews: ProductionPatternCandidateReviewLedgerEntry[] = []
  reviews = confirmedReview(
    reviews,
    currentCandidates,
    repeated7801Cut,
    '2026-09-01T08:20:00+03:00',
  )

  const blocked = assessCrossProjectHumanPromotionGate(
    fixture.corroboration,
    fixture.candidateSets,
    reviews,
  )
  assert.equal(blocked.state, 'BLOCKED')
  assert.ok(blocked.reasons.includes('CURRENT_CONFIRMED_REVIEW_MISSING_FOR_PROJECT'))

  reviews = confirmedReview(
    reviews,
    currentCandidates,
    fixture.secondCandidate,
    '2026-09-01T08:21:00+03:00',
  )
  const eligible = assessCrossProjectHumanPromotionGate(
    fixture.corroboration,
    fixture.candidateSets,
    reviews,
  )

  assert.equal(eligible.state, 'ELIGIBLE_FOR_HUMAN_PROMOTION_REVIEW')
  assert.deepEqual(eligible.reasons, [])
  assert.equal(eligible.allDistinctProjectsHaveCurrentConfirmedCandidateReview, true)
  assert.equal(eligible.humanPromotionReviewCanStart, true)
})

test('RP01.6 current candidate rejection blocks the gate even when another project is confirmed', () => {
  const fixture = matchingCrossProjectFixture()
  const currentCandidates = [
    ...vadimCandidateSet.candidates,
    ...fixture.secondSet.candidates,
  ]

  let reviews: ProductionPatternCandidateReviewLedgerEntry[] = []
  reviews = confirmedReview(
    reviews,
    currentCandidates,
    repeated7801Cut,
    '2026-09-01T08:22:00+03:00',
  )
  reviews = rejectedReview(
    reviews,
    currentCandidates,
    fixture.secondCandidate,
    '2026-09-01T08:23:00+03:00',
  )

  const result = assessCrossProjectHumanPromotionGate(
    fixture.corroboration,
    fixture.candidateSets,
    reviews,
  )

  assert.equal(result.state, 'BLOCKED')
  assert.ok(result.reasons.includes('CURRENT_CONFIRMED_REVIEW_MISSING_FOR_PROJECT'))
  assert.ok(result.reasons.includes('CURRENT_REJECTION_PRESENT'))
  assert.equal(result.anyCurrentCandidateRejectionPresent, true)
})

test('RP01.6 stale review evidence does not satisfy the current-confirmation requirement', () => {
  const fixture = matchingCrossProjectFixture()
  const originalCandidates = [
    ...vadimCandidateSet.candidates,
    ...fixture.secondSet.candidates,
  ]

  let reviews: ProductionPatternCandidateReviewLedgerEntry[] = []
  reviews = confirmedReview(
    reviews,
    originalCandidates,
    repeated7801Cut,
    '2026-09-01T08:24:00+03:00',
  )
  reviews = confirmedReview(
    reviews,
    originalCandidates,
    fixture.secondCandidate,
    '2026-09-01T08:25:00+03:00',
  )

  const changedSecondCandidate = syntheticCandidate(
    fixture.secondCandidate,
    'SYNTHETIC_TEST_PROJECT_B',
    fixture.secondCandidate.evidenceCount + 1,
  )
  const changedSecondSet = syntheticProjectSet(
    'SYNTHETIC_TEST_PROJECT_B',
    [changedSecondCandidate],
  )

  const result = assessCrossProjectHumanPromotionGate(
    fixture.corroboration,
    [vadimCandidateSet, changedSecondSet],
    reviews,
  )

  assert.equal(result.state, 'BLOCKED')
  assert.ok(result.reasons.includes('CURRENT_CONFIRMED_REVIEW_MISSING_FOR_PROJECT'))
  const projectB = result.projectQualifications.find(
    (project) => project.sourceProject === 'SYNTHETIC_TEST_PROJECT_B',
  )
  assert.ok(projectB)
  assert.equal(projectB.staleReviewEntryCount, 1)
  assert.equal(projectB.currentConfirmedReviewPresent, false)
})

test('RP01.6 blocks when corroboration references a project candidate missing from the current candidate sets', () => {
  const fixture = matchingCrossProjectFixture()
  const currentCandidates = [...vadimCandidateSet.candidates]

  let reviews: ProductionPatternCandidateReviewLedgerEntry[] = []
  reviews = confirmedReview(
    reviews,
    currentCandidates,
    repeated7801Cut,
    '2026-09-01T08:26:00+03:00',
  )

  const result = assessCrossProjectHumanPromotionGate(
    fixture.corroboration,
    [vadimCandidateSet],
    reviews,
  )

  assert.equal(result.state, 'BLOCKED')
  assert.ok(result.reasons.includes('CURRENT_CANDIDATE_MISSING_FOR_PROJECT'))
  assert.ok(result.reasons.includes('CURRENT_CONFIRMED_REVIEW_MISSING_FOR_PROJECT'))
})

test('RP01.6 does not let repeated evidence from one project pass the promotion gate', () => {
  const singleProjectSet = buildProductionPatternCrossProjectCorroboration([vadimCandidateSet])
  const corroboration = singleProjectSet.patterns.find((pattern) =>
    pattern.profileCode === repeated7801Cut.profileCode
    && pattern.kind === repeated7801Cut.kind
    && pattern.sourcePatternKey === repeated7801Cut.sourcePatternKey)
  if (!corroboration) throw new Error('RP01.6 single-project corroboration missing.')

  const currentCandidates = [...vadimCandidateSet.candidates]
  const reviews = confirmedReview(
    [],
    currentCandidates,
    repeated7801Cut,
    '2026-09-01T08:27:00+03:00',
  )

  const result = assessCrossProjectHumanPromotionGate(
    corroboration,
    [vadimCandidateSet],
    reviews,
  )

  assert.equal(result.state, 'BLOCKED')
  assert.ok(result.reasons.includes('NOT_CROSS_PROJECT_CORROBORATED'))
  assert.ok(result.reasons.includes('DISTINCT_PROJECT_COUNT_BELOW_MINIMUM'))
  assert.equal(result.humanPromotionReviewCanStart, false)
})

test('RP01.6 synthetic second-project evidence remains test-only and never changes real-corpus truth', () => {
  const fixture = matchingCrossProjectFixture()

  assert.equal(fixture.corroboration.crossProjectCorroborated, true)

  const realOnly = buildProductionPatternCrossProjectCorroboration([vadimCandidateSet])
  assert.equal(realOnly.crossProjectCorroboratedCount, 0)

  const acceptance = readFileSync(
    'docs/REAL_PRODUCTION_DATA_RP01_6_CROSS_PROJECT_PROMOTION_GATE_ACCEPTANCE.md',
    'utf8',
  )
  assert.match(acceptance, /SYNTHETIC_TEST_PROJECT_B/)
  assert.match(acceptance, /test-only/)
  assert.match(acceptance, /does not create a second real project/)
})

test('RP01.6 eligibility only opens human promotion review and never creates or validates a production rule', () => {
  const fixture = matchingCrossProjectFixture()
  const currentCandidates = [
    ...vadimCandidateSet.candidates,
    ...fixture.secondSet.candidates,
  ]

  let reviews: ProductionPatternCandidateReviewLedgerEntry[] = []
  reviews = confirmedReview(
    reviews,
    currentCandidates,
    repeated7801Cut,
    '2026-09-01T08:28:00+03:00',
  )
  reviews = confirmedReview(
    reviews,
    currentCandidates,
    fixture.secondCandidate,
    '2026-09-01T08:29:00+03:00',
  )

  const result = assessCrossProjectHumanPromotionGate(
    fixture.corroboration,
    fixture.candidateSets,
    reviews,
  )

  assert.equal(result.state, 'ELIGIBLE_FOR_HUMAN_PROMOTION_REVIEW')
  assert.equal(result.humanPromotionReviewCanStart, true)
  assert.equal(result.humanPromotionReviewCompleted, false)
  assert.equal(result.ruleDraftCreated, false)
  assert.equal(result.engineeringRuleValidated, false)
  assert.equal(result.automaticRulePromotionAllowed, false)
  assert.equal(result.productionRuleCreated, false)
  assert.equal(result.productionUnlockAllowed, false)
  assert.equal(result.machineReady, false)
  assert.equal(result.productionApproved, false)

  const source = readFileSync(
    'src/realProduction/skyGlazingCrossProjectPromotionGate.ts',
    'utf8',
  )
  assert.doesNotMatch(source, /productionRuleCreated:\s*true/)
  assert.doesNotMatch(source, /machineReady:\s*true/)
  assert.doesNotMatch(source, /productionApproved:\s*true/)
  assert.doesNotMatch(source, /productionUnlockAllowed:\s*true/)
})

