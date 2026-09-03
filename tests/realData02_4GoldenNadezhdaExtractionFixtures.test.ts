import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { extractNadezhdaDocumentPatterns } from '../src/realData/nadezhdaDocumentPatternExtractor'
import { bridgeNadezhdaExtractionToProjectDraft } from '../src/realData/nadezhdaProjectDraftBridge'
import {
  NADEZHDA_GOLDEN_PATTERN_FIXTURES,
  NADEZHDA_GOLDEN_PATTERN_FIXTURES_VERSION,
  type NadezhdaGoldenPatternFixture,
} from '../test-fixtures/real-data/nadezhdaGoldenPatternFixtures'

function runFixture(fixture: NadezhdaGoldenPatternFixture) {
  const extraction = extractNadezhdaDocumentPatterns({
    sourceId: fixture.id.toLowerCase(),
    sourceKind: 'DOCX',
    sourceReference: fixture.sourceReference,
    text: fixture.sourceText,
  })
  const bridge = bridgeNadezhdaExtractionToProjectDraft(extraction, `draft-${fixture.id.toLowerCase()}`)
  return { extraction, bridge }
}

function allGroups(fixture: NadezhdaGoldenPatternFixture) {
  return runFixture(fixture).bridge.draft.offerVariants.flatMap((variant) => variant.productGroups)
}

test('REAL DATA 02.4 fixture registry is versioned and contains seven anonymized pattern families', () => {
  assert.equal(NADEZHDA_GOLDEN_PATTERN_FIXTURES_VERSION, 'REALDATA02.4')
  assert.equal(NADEZHDA_GOLDEN_PATTERN_FIXTURES.length, 7)
  assert.equal(new Set(NADEZHDA_GOLDEN_PATTERN_FIXTURES.map((fixture) => fixture.patternFamily)).size, 7)
})

test('REAL DATA 02.4 tracked fixtures are synthetic reductions, not private source documents', () => {
  for (const fixture of NADEZHDA_GOLDEN_PATTERN_FIXTURES) {
    assert.equal(fixture.provenance.derivedFromPrivateReferencePattern, true)
    assert.equal(fixture.provenance.containsOriginalPrivateDocumentText, false)
    assert.equal(fixture.provenance.containsClientIdentity, false)
    assert.equal(fixture.provenance.safeForTrackedRegressionFixture, true)
    assert.match(fixture.sourceReference, /^SYNTHETIC_GOLDEN_[A-G]\.docx$/)
    assert.match(fixture.sourceText, /SYNTH/)
  }
})

test('REAL DATA 02.4 every fixture preserves the global safety boundary', () => {
  for (const fixture of NADEZHDA_GOLDEN_PATTERN_FIXTURES) {
    const { extraction, bridge } = runFixture(fixture)
    assert.equal(extraction.safety.privateSource, true)
    assert.equal(extraction.safety.machineReady, false)
    assert.equal(extraction.safety.productionApproved, false)
    assert.equal(bridge.safety.createsLifecycleProject, false)
    assert.equal(bridge.safety.machineReady, false)
    assert.equal(bridge.safety.productionApproved, false)
    assert.equal(bridge.draft.safety.automaticReuseAllowed, false)
    assert.equal(bridge.draft.safety.automaticModuleMergeAllowed, false)
  }
})

test('REAL DATA 02.4 all fixture outcomes preserve exact module-position count', () => {
  for (const fixture of NADEZHDA_GOLDEN_PATTERN_FIXTURES) {
    const { bridge } = runFixture(fixture)
    assert.equal(bridge.draft.modules.length, fixture.expectation.moduleCount, fixture.id)
  }
})

test('REAL DATA 02.4 all fixture outcomes preserve explicit offer-container count', () => {
  for (const fixture of NADEZHDA_GOLDEN_PATTERN_FIXTURES) {
    const { bridge } = runFixture(fixture)
    assert.equal(bridge.draft.offerVariants.length, fixture.expectation.variantCount, fixture.id)
  }
})

test('REAL DATA 02.4 all fixture outcomes preserve explicit product-group count', () => {
  for (const fixture of NADEZHDA_GOLDEN_PATTERN_FIXTURES) {
    const groups = allGroups(fixture)
    assert.equal(groups.length, fixture.expectation.totalProductGroupCount, fixture.id)
  }
})

test('REAL DATA 02.4 all material classifications come only from explicit product-group text', () => {
  for (const fixture of NADEZHDA_GOLDEN_PATTERN_FIXTURES) {
    const expected = fixture.expectation.materials
    if (!expected) continue
    assert.deepEqual(allGroups(fixture).map((group) => group.material.value), expected, fixture.id)
  }
})

test('REAL DATA 02.4 repeated L/H geometry remains separate module records', () => {
  for (const fixture of NADEZHDA_GOLDEN_PATTERN_FIXTURES) {
    const { bridge } = runFixture(fixture)
    const groups = new Map<string, string[]>()
    for (const module of bridge.draft.modules) {
      if (module.widthMm.value === null || module.heightMm.value === null) continue
      const key = `${module.widthMm.value}x${module.heightMm.value}`
      groups.set(key, [...(groups.get(key) ?? []), module.id])
    }
    const repeated = [...groups.values()].filter((ids) => ids.length > 1)
    assert.equal(repeated.length, fixture.expectation.sameGeometryGroupCount, fixture.id)
    for (const ids of repeated) assert.equal(new Set(ids).size, ids.length)
  }
})

test('REAL DATA 02.4 floor hierarchy fixture preserves floor placement without requiring a building hierarchy', () => {
  const fixture = NADEZHDA_GOLDEN_PATTERN_FIXTURES.find((item) => item.patternFamily === 'FLOOR_HIERARCHY')!
  const { bridge } = runFixture(fixture)
  const labels = [...new Set(bridge.draft.modules.flatMap((module) => module.placement.map((placement) => placement.label.value)).filter(Boolean))]
  assert.deepEqual(labels, fixture.expectation.floorPlacementLabels)
})

test('REAL DATA 02.4 mixed-product fixture keeps PVC, thermal aluminium and aluminium-door groups distinct', () => {
  const fixture = NADEZHDA_GOLDEN_PATTERN_FIXTURES.find((item) => item.patternFamily === 'MIXED_PRODUCT_GROUPS')!
  const { bridge } = runFixture(fixture)
  const groups = bridge.draft.offerVariants[0]?.productGroups ?? []
  assert.equal(groups.length, 3)
  assert.equal(groups[0]?.moduleIds.length, 2)
  assert.equal(groups[1]?.moduleIds.length, 2)
  assert.equal(groups[2]?.moduleIds.length, 1)
})

test('REAL DATA 02.4 alternative-variant fixture records common-geometry scoping as an explicit known gap', () => {
  const fixture = NADEZHDA_GOLDEN_PATTERN_FIXTURES.find((item) => item.patternFamily === 'ALTERNATIVE_VARIANTS_SHARED_GEOMETRY')!
  assert.ok(fixture.knownGaps.includes('COMMON_GEOMETRY_AFTER_VARIANTS_REQUIRES_EXPLICIT_SCOPE'))
  const { bridge } = runFixture(fixture)
  assert.equal(bridge.draft.offerVariants[0]?.productGroups[0]?.moduleIds.length, 0)
  assert.equal(bridge.draft.offerVariants[1]?.productGroups[0]?.moduleIds.length, fixture.expectation.moduleCount)
})

test('REAL DATA 02.4 four-variant fixture does not duplicate shared geometry across variants', () => {
  const fixture = NADEZHDA_GOLDEN_PATTERN_FIXTURES.find((item) => item.patternFamily === 'MULTIPLE_OFFER_VARIANTS')!
  const { bridge } = runFixture(fixture)
  assert.equal(bridge.draft.modules.length, fixture.expectation.moduleCount)
  assert.deepEqual(
    bridge.draft.offerVariants.map((variant) => variant.productGroups.reduce((sum, group) => sum + group.moduleIds.length, 0)),
    [0, 0, 0, fixture.expectation.moduleCount],
  )
})

test('REAL DATA 02.4 multi-basis pricing fixture keeps numeric pricing unresolved in canonical draft', () => {
  const fixture = NADEZHDA_GOLDEN_PATTERN_FIXTURES.find((item) => item.patternFamily === 'MULTI_BASIS_PRICING')!
  assert.ok(fixture.knownGaps.includes('MULTI_BASIS_PRICING_REMAINS_TEXT_EVIDENCE'))
  const { bridge } = runFixture(fixture)
  const variant = bridge.draft.offerVariants[0]!
  assert.equal(variant.priceComponents.length, 0)
  assert.equal(variant.totalPrice.state, 'UNRESOLVED')
  assert.equal(variant.currency.state, 'UNRESOLVED')
  assert.equal(variant.vatIncluded.value, fixture.expectation.vatIncluded)
  assert.ok(bridge.warnings.some((warning) => warning.includes('не извлича автоматично числова цена/валута')))
})

test('REAL DATA 02.4 multi-system variant fixture keeps two explicit systems inside each variant', () => {
  const fixture = NADEZHDA_GOLDEN_PATTERN_FIXTURES.find((item) => item.patternFamily === 'MULTI_SYSTEM_VARIANT_AND_COMMERCIAL_SECTIONS')!
  const { bridge } = runFixture(fixture)
  assert.deepEqual(bridge.draft.offerVariants.map((variant) => variant.productGroups.length), [2, 2])
  assert.deepEqual(bridge.draft.offerVariants.flatMap((variant) => variant.productGroups.map((group) => group.hardware.value)), [
    'SYNTH-HW-F1',
    'SYNTH-HW-SLIDE',
    'SYNTH-HW-F2',
    'SYNTH-HW-SLIDE',
  ])
})

test('REAL DATA 02.4 commercial include/exclude counts remain explicit and review-scoped', () => {
  const fixture = NADEZHDA_GOLDEN_PATTERN_FIXTURES.find((item) => item.patternFamily === 'MULTI_SYSTEM_VARIANT_AND_COMMERCIAL_SECTIONS')!
  assert.ok(fixture.knownGaps.includes('COMMERCIAL_SCOPE_AFTER_MULTIPLE_VARIANTS_REQUIRES_REVIEW'))
  const { bridge } = runFixture(fixture)
  const lastVariant = bridge.draft.offerVariants.at(-1)!
  assert.equal(lastVariant.includedItems.length, fixture.expectation.includedItemCount)
  assert.equal(lastVariant.excludedItems.length, fixture.expectation.excludedItemCount)
})

test('REAL DATA 02.4 bare pre-module glazing fixture exposes the current parser limitation instead of inventing an override', () => {
  const fixture = NADEZHDA_GOLDEN_PATTERN_FIXTURES.find((item) => item.patternFamily === 'MIXED_GROUPS_WITH_PRE_MODULE_ATTRIBUTE')!
  assert.ok(fixture.knownGaps.includes('BARE_PRE_MODULE_GLAZING_REQUIRES_HARDENING'))
  const { extraction, bridge } = runFixture(fixture)
  assert.equal(extraction.candidates.some((candidate) => String(candidate.value).includes('SYNTH-SPECIAL-ARMORED-GLASS')), false)
  const alGroup = bridge.draft.offerVariants[0]?.productGroups[1]
  assert.equal(alGroup?.moduleOverrides.length, 0)
  assert.equal(alGroup?.glazing.value, 'SYNTH-DEFAULT-22')
})

test('REAL DATA 02.4 every resolved canonical value remains evidence-backed', () => {
  for (const fixture of NADEZHDA_GOLDEN_PATTERN_FIXTURES) {
    const { bridge } = runFixture(fixture)
    const serialized = JSON.stringify(bridge.draft)
    assert.ok(serialized.includes('e-'))
    assert.equal(bridge.validationErrors.some((error) => error.includes('няма evidence ref')), false, fixture.id)
  }
})

test('REAL DATA 02.4 known gaps are finite explicit contracts, not silent parser assumptions', () => {
  const allGaps = NADEZHDA_GOLDEN_PATTERN_FIXTURES.flatMap((fixture) => fixture.knownGaps)
  assert.ok(allGaps.length >= 4)
  assert.ok(allGaps.includes('COMMON_GEOMETRY_AFTER_VARIANTS_REQUIRES_EXPLICIT_SCOPE'))
  assert.ok(allGaps.includes('MULTI_BASIS_PRICING_REMAINS_TEXT_EVIDENCE'))
  assert.ok(allGaps.includes('COMMERCIAL_SCOPE_AFTER_MULTIPLE_VARIANTS_REQUIRES_REVIEW'))
  assert.ok(allGaps.includes('BARE_PRE_MODULE_GLAZING_REQUIRES_HARDENING'))
})

test('REAL DATA 02.4 tracked files contain no private client/project identifiers', () => {
  const tracked = [
    readFileSync('test-fixtures/real-data/nadezhdaGoldenPatternFixtures.ts', 'utf8'),
    readFileSync('tests/realData02_4GoldenNadezhdaExtractionFixtures.test.ts', 'utf8'),
  ].join('\n')
  const privateMarkers = [
    'Крум' + 'овград',
    'Де' + 'вин',
    'Яго' + 'дово',
    'Мо' + 'нек',
    'Пламен' + ' Данев',
    'Момин' + 'ско',
    'ВЕНИ' + ' 97',
    'ГЕРТ' + ' ГРУП',
    'ЕЛ ЛУКС' + ' ПРО',
  ]
  for (const marker of privateMarkers) assert.equal(tracked.includes(marker), false, marker)
})
