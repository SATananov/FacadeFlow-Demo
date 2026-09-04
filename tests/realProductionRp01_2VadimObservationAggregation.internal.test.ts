import assert from 'node:assert/strict'
import { extname, join } from 'node:path'
import { readdirSync, readFileSync } from 'node:fs'
import test from 'node:test'
import {
  extractSkyGlazingLteObservations,
  extractSkyGlazingXmlObservations,
} from '../src/realProduction/skyGlazingObservationExtraction'
import {
  aggregateSkyGlazingObservationPatterns,
  exactOperationFingerprint,
} from '../src/realProduction/skyGlazingObservationAggregation'

const sampleDir = join(process.cwd(), 'local-samples', 'phase05a')
const sampleNames = readdirSync(sampleDir)
const xmlName = sampleNames.find((name) => extname(name).toLowerCase() === '.xml')
const lteName = sampleNames.find((name) => extname(name).toLowerCase() === '.lte')
if (!xmlName || !lteName) throw new Error('RP01.2 requires the locked Vadim XML/LTE sample pair.')

const xml = readFileSync(join(sampleDir, xmlName), 'utf8')
const lte = readFileSync(join(sampleDir, lteName)).toString('latin1')
const xmlObservations = extractSkyGlazingXmlObservations(xml)
const lteObservations = extractSkyGlazingLteObservations(lte)
const aggregation = aggregateSkyGlazingObservationPatterns(xmlObservations, lteObservations)
const profile = (code: string) => {
  const result = aggregation.profiles.find((item) => item.profileCode === code)
  if (!result) throw new Error(`Missing profile aggregation ${code}`)
  return result
}
const frequencyMap = (patterns: readonly { key: string; count: number }[]) =>
  Object.fromEntries(patterns.map((pattern) => [pattern.key, pattern.count]))

test('RP01.2 aggregates the locked Vadim observation corpus without creating production rules', () => {
  assert.equal(aggregation.profileCount, 4)
  assert.equal(aggregation.xmlObservationCount, 46)
  assert.equal(aggregation.lteObservationCount, 84)
  assert.equal(aggregation.correlatedObservationCount, 46)
  assert.equal(aggregation.lteOnlyObservationCount, 38)
  assert.equal(aggregation.aggregationStatus, 'OBSERVATION_AGGREGATION_ONLY')
  assert.equal(aggregation.repeatedObservationIsProductionRule, false)
  assert.equal(aggregation.universalRuleInferenceAllowed, false)
  assert.equal(aggregation.profileRoleInferenceAllowed, false)
  assert.equal(aggregation.systemInferenceAllowed, false)
  assert.equal(aggregation.productionRuleCreated, false)
  assert.equal(aggregation.machineReady, false)
  assert.equal(aggregation.productionApproved, false)
})

test('RP01.2 keeps real per-profile XML/LTE/correlation counts', () => {
  assert.deepEqual(
    aggregation.profiles.map((item) => ({
      code: item.profileCode,
      xml: item.xmlObservationCount,
      lte: item.lteObservationCount,
      correlated: item.correlatedObservationCount,
      lteOnly: item.lteOnlyObservationCount,
    })),
    [
      { code: '78.01', xml: 29, lte: 49, correlated: 29, lteOnly: 20 },
      { code: '78.27', xml: 6, lte: 24, correlated: 6, lteOnly: 18 },
      { code: '78.33', xml: 8, lte: 8, correlated: 8, lteOnly: 0 },
      { code: '78.51', xml: 3, lte: 3, correlated: 3, lteOnly: 0 },
    ],
  )
})

test('RP01.2 counts only explicit LTE position words and preserves unlabeled evidence', () => {
  assert.deepEqual(profile('78.01').correlatedPositionCounts, {
    Left: 9,
    Right: 9,
    Upper: 5,
    Bottom: 6,
    UNLABELED: 0,
  })
  assert.deepEqual(profile('78.27').correlatedPositionCounts, {
    Left: 3,
    Right: 3,
    Upper: 0,
    Bottom: 0,
    UNLABELED: 0,
  })
  assert.deepEqual(profile('78.33').correlatedPositionCounts, {
    Left: 0,
    Right: 0,
    Upper: 0,
    Bottom: 0,
    UNLABELED: 8,
  })
  assert.deepEqual(profile('78.51').ltePositionCounts, {
    Left: 0,
    Right: 0,
    Upper: 0,
    Bottom: 0,
    UNLABELED: 3,
  })
})

test('RP01.2 detects repeated exact cut tuples but deliberately excludes length from the pattern key', () => {
  const p7801 = profile('78.01')
  assert.deepEqual(
    p7801.cutTuplePatterns.map((pattern) => ({
      sxB: pattern.sxB,
      dxB: pattern.dxB,
      sxC: pattern.sxC,
      dxC: pattern.dxC,
      count: pattern.count,
      multiplicity: pattern.multiplicity,
      lengthIncludedInPattern: pattern.lengthIncludedInPattern,
    })),
    [
      { sxB: 135, dxB: 135, sxC: 90, dxC: 90, count: 27, multiplicity: 'REPEATED_OBSERVATION', lengthIncludedInPattern: false },
      { sxB: 135, dxB: 90, sxC: 90, dxC: 90, count: 1, multiplicity: 'SINGLE_OBSERVATION', lengthIncludedInPattern: false },
      { sxB: 90, dxB: 135, sxC: 90, dxC: 90, count: 1, multiplicity: 'SINGLE_OBSERVATION', lengthIncludedInPattern: false },
    ],
  )
  assert.equal(p7801.cutTuplePatterns.every((pattern) => pattern.productionRuleCreated === false), true)
})

test('RP01.2 aggregates operation-name frequency by profile without treating frequency as a rule', () => {
  assert.deepEqual(frequencyMap(profile('78.01').operationNamePatterns), {
    STD_HOLE: 70,
    STD_SLOT: 13,
  })
  assert.deepEqual(frequencyMap(profile('78.27').operationNamePatterns), {
    STD_HOLE: 6,
    STD_KEYHOLE: 6,
    STD_POCKET: 3,
  })
  assert.deepEqual(frequencyMap(profile('78.33').operationNamePatterns), {
    STD_NOTCH: 112,
    STD_DRILL: 6,
    STD_SLOT: 4,
  })
  assert.deepEqual(profile('78.51').operationNamePatterns, [])
  assert.equal(
    aggregation.profiles.every((item) => item.repeatedObservationIsProductionRule === false),
    true,
  )
})

test('RP01.2 exact operation fingerprint includes raw coordinates, face, angles, tool, and sorted parameters', () => {
  const operation = xmlObservations
    .flatMap((record) => record.operations)
    .find((item) => item.name === 'STD_HOLE')
  assert.ok(operation)
  const fingerprint = exactOperationFingerprint(operation)
  assert.match(fingerprint, /^name=STD_HOLE\|positionX=/)
  assert.match(fingerprint, /\|faceX=/)
  assert.match(fingerprint, /\|angleA=/)
  assert.match(fingerprint, /\|toolT=/)
  assert.match(fingerprint, /\|parameters=/)
})

test('RP01.2 real corpus exposes repeated exact-operation fingerprints as evidence only', () => {
  assert.deepEqual(
    aggregation.profiles.map((item) => ({
      code: item.profileCode,
      exactPatterns: item.exactOperationPatternCount,
      repeatedExactPatterns: item.repeatedExactOperationPatternCount,
    })),
    [
      { code: '78.01', exactPatterns: 23, repeatedExactPatterns: 18 },
      { code: '78.27', exactPatterns: 5, repeatedExactPatterns: 5 },
      { code: '78.33', exactPatterns: 47, repeatedExactPatterns: 47 },
      { code: '78.51', exactPatterns: 0, repeatedExactPatterns: 0 },
    ],
  )
  for (const item of aggregation.profiles) {
    assert.equal(item.universalRuleInferenceAllowed, false)
    assert.equal(item.productionRuleCreated, false)
    assert.equal(item.machineReady, false)
    assert.equal(item.productionApproved, false)
  }
})

test('RP01.2 does not infer profile role, system identity, production approval, or machine readiness', () => {
  const source = readFileSync('src/realProduction/skyGlazingObservationAggregation.ts', 'utf8')
  assert.doesNotMatch(source, /role:\s*['"](FRAME|SASH|MULLION)['"]/)
  assert.doesNotMatch(source, /productionApproved:\s*true/)
  assert.doesNotMatch(source, /machineReady:\s*true/)
  assert.doesNotMatch(source, /productionRuleCreated:\s*true/)
})
