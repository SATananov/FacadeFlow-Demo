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
import { buildProductionPatternCrossProjectCorroboration } from '../src/realProduction/skyGlazingCrossProjectCorroboration'

const sampleDir = join(process.cwd(), 'local-samples', 'phase05a')
const sampleNames = readdirSync(sampleDir)
const xmlName = sampleNames.find((name) => extname(name).toLowerCase() === '.xml')
const lteName = sampleNames.find((name) => extname(name).toLowerCase() === '.lte')
if (!xmlName || !lteName) throw new Error('RP01.5 requires the locked Vadim XML/LTE sample pair.')

const xml = readFileSync(join(sampleDir, xmlName), 'utf8')
const lte = readFileSync(join(sampleDir, lteName)).toString('latin1')
const vadimCandidateSet = buildProductionPatternCandidateSet(
  aggregateSkyGlazingObservationPatterns(
    extractSkyGlazingXmlObservations(xml),
    extractSkyGlazingLteObservations(lte),
  ),
  'Вадим-2',
)

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

function cloneCandidateForSyntheticProject(
  candidate: ProductionPatternCandidate,
  sourceProject: string,
  overrides: Partial<ProductionPatternCandidate> = {},
): ProductionPatternCandidate {
  return Object.freeze({
    ...candidate,
    sourceProject,
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
    ...overrides,
  })
}

const repeated7801Cut = vadimCandidateSet.candidates.find((candidate) =>
  candidate.profileCode === '78.01'
  && candidate.kind === 'CUT_TUPLE'
  && candidate.sourcePatternKey === 'sxB=135|dxB=135|sxC=90|dxC=90')
if (!repeated7801Cut) throw new Error('RP01.5 expected the repeated 78.01 cut candidate.')

test('RP01.5 reports the real locked Vadim corpus as single-project evidence only', () => {
  const result = buildProductionPatternCrossProjectCorroboration([vadimCandidateSet])

  assert.equal(result.inputProjectSetCount, 1)
  assert.equal(result.distinctInputProjectCount, 1)
  assert.deepEqual(result.sourceProjects, ['Вадим-2'])
  assert.equal(result.patternCount, 74)
  assert.equal(result.singleProjectOnlyCount, 74)
  assert.equal(result.crossProjectCorroboratedCount, 0)
  assert.ok(result.patterns.every((pattern) => pattern.state === 'SINGLE_PROJECT_ONLY'))
  assert.ok(result.patterns.every((pattern) => pattern.crossProjectCorroborated === false))
  assert.equal(result.realProjectInferencePerformed, false)
})

test('RP01.5 corroborates only the exact same pattern across distinct project labels', () => {
  const syntheticMatch = cloneCandidateForSyntheticProject(
    repeated7801Cut,
    'SYNTHETIC_TEST_PROJECT_B',
    { evidenceCount: 5 },
  )
  const result = buildProductionPatternCrossProjectCorroboration([
    vadimCandidateSet,
    syntheticProjectSet('SYNTHETIC_TEST_PROJECT_B', [syntheticMatch]),
  ])
  const match = result.patterns.find((pattern) =>
    pattern.profileCode === repeated7801Cut.profileCode
    && pattern.kind === repeated7801Cut.kind
    && pattern.sourcePatternKey === repeated7801Cut.sourcePatternKey)

  assert.ok(match)
  assert.equal(match.state, 'CROSS_PROJECT_CORROBORATED')
  assert.equal(match.distinctProjectCount, 2)
  assert.deepEqual(match.sourceProjects, ['SYNTHETIC_TEST_PROJECT_B', 'Вадим-2'])
  assert.equal(match.totalEvidenceCountAcrossProjects, 32)
  assert.equal(match.exactPatternIdentityRequired, true)
})

test('RP01.5 does not treat a near-match pattern as corroboration', () => {
  const nearMatch = cloneCandidateForSyntheticProject(
    repeated7801Cut,
    'SYNTHETIC_TEST_PROJECT_B',
    { sourcePatternKey: `${repeated7801Cut.sourcePatternKey}|different` },
  )
  const result = buildProductionPatternCrossProjectCorroboration([
    vadimCandidateSet,
    syntheticProjectSet('SYNTHETIC_TEST_PROJECT_B', [nearMatch]),
  ])
  const realPattern = result.patterns.find((pattern) =>
    pattern.profileCode === repeated7801Cut.profileCode
    && pattern.kind === repeated7801Cut.kind
    && pattern.sourcePatternKey === repeated7801Cut.sourcePatternKey)

  assert.ok(realPattern)
  assert.equal(realPattern.state, 'SINGLE_PROJECT_ONLY')
  assert.equal(realPattern.distinctProjectCount, 1)
})

test('RP01.5 never counts duplicate evidence from one project as cross-project support', () => {
  const duplicateSameProject = cloneCandidateForSyntheticProject(
    repeated7801Cut,
    'Вадим-2',
    { evidenceCount: 9 },
  )
  const result = buildProductionPatternCrossProjectCorroboration([
    vadimCandidateSet,
    syntheticProjectSet('Вадим-2', [duplicateSameProject]),
  ])
  const pattern = result.patterns.find((item) =>
    item.profileCode === repeated7801Cut.profileCode
    && item.kind === repeated7801Cut.kind
    && item.sourcePatternKey === repeated7801Cut.sourcePatternKey)

  assert.ok(pattern)
  assert.equal(pattern.distinctProjectCount, 1)
  assert.equal(pattern.crossProjectCorroborated, false)
  assert.equal(pattern.repeatedWithinOneProjectDoesNotCreateCrossProjectCorroboration, true)
  assert.equal(pattern.projectEvidence[0].candidateOccurrenceCount, 2)
})

test('RP01.5 preserves per-project evidence counts', () => {
  const syntheticMatch = cloneCandidateForSyntheticProject(
    repeated7801Cut,
    'SYNTHETIC_TEST_PROJECT_B',
    { evidenceCount: 5 },
  )
  const result = buildProductionPatternCrossProjectCorroboration([
    vadimCandidateSet,
    syntheticProjectSet('SYNTHETIC_TEST_PROJECT_B', [syntheticMatch]),
  ])
  const pattern = result.patterns.find((item) =>
    item.profileCode === repeated7801Cut.profileCode
    && item.kind === repeated7801Cut.kind
    && item.sourcePatternKey === repeated7801Cut.sourcePatternKey)

  assert.ok(pattern)
  assert.deepEqual(
    pattern.projectEvidence.map((project) => ({
      project: project.sourceProject,
      evidenceCounts: project.evidenceCounts,
    })),
    [
      { project: 'SYNTHETIC_TEST_PROJECT_B', evidenceCounts: [5] },
      { project: 'Вадим-2', evidenceCounts: [27] },
    ],
  )
})

test('RP01.5 allows evidence count to differ between projects without changing pattern identity', () => {
  const syntheticMatch = cloneCandidateForSyntheticProject(
    repeated7801Cut,
    'SYNTHETIC_TEST_PROJECT_B',
    { evidenceCount: 2 },
  )
  const result = buildProductionPatternCrossProjectCorroboration([
    vadimCandidateSet,
    syntheticProjectSet('SYNTHETIC_TEST_PROJECT_B', [syntheticMatch]),
  ])
  const pattern = result.patterns.find((item) =>
    item.profileCode === repeated7801Cut.profileCode
    && item.kind === repeated7801Cut.kind
    && item.sourcePatternKey === repeated7801Cut.sourcePatternKey)

  assert.ok(pattern)
  assert.equal(pattern.crossProjectCorroborated, true)
  assert.equal(pattern.totalEvidenceCountAcrossProjects, 29)
})

test('RP01.5 synthetic test project is algorithm-only evidence, not a claimed real project', () => {
  const syntheticMatch = cloneCandidateForSyntheticProject(
    repeated7801Cut,
    'SYNTHETIC_TEST_PROJECT_B',
  )
  const result = buildProductionPatternCrossProjectCorroboration([
    vadimCandidateSet,
    syntheticProjectSet('SYNTHETIC_TEST_PROJECT_B', [syntheticMatch]),
  ])

  assert.equal(result.realProjectInferencePerformed, false)
  assert.ok(result.sourceProjects.includes('SYNTHETIC_TEST_PROJECT_B'))

  const acceptance = readFileSync(
    'docs/REAL_PRODUCTION_DATA_RP01_5_CROSS_PROJECT_CORROBORATION_ACCEPTANCE.md',
    'utf8',
  )
  assert.match(acceptance, /test evidence only/)
  assert.match(acceptance, /does not invent or infer any additional real project/)
})

test('RP01.5 corroboration never becomes a production rule or machine/production approval', () => {
  const syntheticMatch = cloneCandidateForSyntheticProject(
    repeated7801Cut,
    'SYNTHETIC_TEST_PROJECT_B',
  )
  const result = buildProductionPatternCrossProjectCorroboration([
    vadimCandidateSet,
    syntheticProjectSet('SYNTHETIC_TEST_PROJECT_B', [syntheticMatch]),
  ])
  const corroborated = result.patterns.find((pattern) => pattern.crossProjectCorroborated)

  assert.ok(corroborated)
  assert.equal(corroborated.humanReviewStillRequired, true)
  assert.equal(corroborated.automaticRulePromotionAllowed, false)
  assert.equal(corroborated.candidateIsProductionRule, false)
  assert.equal(corroborated.productionRuleCreated, false)
  assert.equal(corroborated.machineReady, false)
  assert.equal(corroborated.productionApproved, false)
  assert.equal(result.automaticRulePromotionAllowed, false)
  assert.equal(result.productionRuleCreated, false)
  assert.equal(result.machineReady, false)
  assert.equal(result.productionApproved, false)

  const source = readFileSync(
    'src/realProduction/skyGlazingCrossProjectCorroboration.ts',
    'utf8',
  )
  assert.doesNotMatch(source, /productionRuleCreated:\s*true/)
  assert.doesNotMatch(source, /machineReady:\s*true/)
  assert.doesNotMatch(source, /productionApproved:\s*true/)
})
