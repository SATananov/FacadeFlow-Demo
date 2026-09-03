import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { extractNadezhdaDocumentPatterns } from '../src/realData/nadezhdaDocumentPatternExtractor'
import { analyzeNadezhdaGeometryOfferSeparation } from '../src/realData/nadezhdaGeometryOfferSeparation'
import { bridgeNadezhdaExtractionToProjectDraft } from '../src/realData/nadezhdaProjectDraftBridge'
import { NADEZHDA_GOLDEN_PATTERN_FIXTURES } from '../test-fixtures/real-data/nadezhdaGoldenPatternFixtures'

function run(text: string) {
  const extraction = extractNadezhdaDocumentPatterns({
    sourceId: 'rd025',
    sourceKind: 'DOCX',
    sourceReference: 'SYNTHETIC_RD025.docx',
    text,
  })
  const bridge = bridgeNadezhdaExtractionToProjectDraft(extraction, 'draft-rd025')
  const separation = analyzeNadezhdaGeometryOfferSeparation(extraction, bridge.draft)
  return { extraction, bridge, separation }
}

const sharedGeometrySource = [
  'обект : SYNTH-SITE',
  'Вариант 1: PVC дограма SYNTH-A',
  'Цвят: SYNTH-COLOR',
  'Стъклопакет: SYNTH-32',
  'Вариант 2: AL дограма SYNTH-B',
  'Цвят: SYNTH-COLOR',
  'Стъклопакет: SYNTH-44',
  'Спецификация:',
  'Модул: 1',
  'Брой: 2',
  'L =2000 mm',
  'H =1700 mm',
  'Модул: 2',
  'Брой: 1',
  'L =800 mm',
  'H =2100 mm',
].join('\n')

test('REAL DATA 02.5 separation model is versioned', () => {
  assert.equal(analyzeNadezhdaGeometryOfferSeparation(run('').extraction, run('').bridge.draft).version, 'REALDATA02.5')
})

test('REAL DATA 02.5 extractor recognizes explicit specification heading', () => {
  const { extraction } = run(sharedGeometrySource)
  const candidate = extraction.candidates.find((item) => item.kind === 'SPECIFICATION_SECTION')
  assert.equal(candidate?.value, 'PROJECT_GEOMETRY')
  assert.ok(candidate?.evidence.id)
})

test('REAL DATA 02.5 specification heading clears stale offer/group context for following modules', () => {
  const { extraction } = run(sharedGeometrySource)
  const moduleCandidate = extraction.candidates.find((item) => item.kind === 'MODULE_REFERENCE')!
  assert.equal(moduleCandidate.context.offerVariantLabel, null)
  assert.equal(moduleCandidate.context.productGroupLabel, null)
  assert.equal(moduleCandidate.context.material, null)
})

test('REAL DATA 02.5 bridge keeps specification modules at project level instead of attaching them to the last variant', () => {
  const { bridge } = run(sharedGeometrySource)
  assert.equal(bridge.draft.modules.length, 2)
  assert.deepEqual(
    bridge.draft.offerVariants.map((variant) => variant.productGroups.flatMap((group) => group.moduleIds)),
    [[], []],
  )
})

test('REAL DATA 02.5 explicit shared geometry is reported as a separate project-level scope', () => {
  const { separation } = run(sharedGeometrySource)
  assert.equal(separation.state, 'EXPLICIT_SHARED_PROJECT_GEOMETRY')
  assert.equal(separation.projectGeometryModuleIds.length, 2)
  assert.equal(separation.variantScopedModuleIds.length, 0)
  assert.equal(separation.specificationEvidenceRefs.length, 1)
})

test('REAL DATA 02.5 does not automatically claim that any offer variant applies to shared geometry', () => {
  const { separation } = run(sharedGeometrySource)
  assert.deepEqual(
    separation.variants.map((variant) => variant.sharedProjectGeometryApplicability),
    ['REQUIRES_HUMAN_CONFIRMATION', 'REQUIRES_HUMAN_CONFIRMATION'],
  )
  assert.deepEqual(separation.variants.map((variant) => variant.explicitModuleIds), [[], []])
})

test('REAL DATA 02.5 preserves same-size positions as distinct project geometry modules', () => {
  const { bridge, separation } = run([
    'Вариант 1: PVC дограма SYNTH-A',
    'Вариант 2: PVC дограма SYNTH-B',
    'Спецификация',
    'Модул: 4',
    'L =1900 mm',
    'H =2520 mm',
    'Модул: 6',
    'L =1900 mm',
    'H =2520 mm',
  ].join('\n'))
  assert.equal(bridge.draft.modules.length, 2)
  assert.notEqual(bridge.draft.modules[0]?.id, bridge.draft.modules[1]?.id)
  assert.equal(separation.projectGeometryModuleIds.length, 2)
})

test('REAL DATA 02.5 explicit product-group geometry without variants remains variant-scoped structural grouping', () => {
  const { separation } = run('PVC дограма\nМодул: 1\nL =1000 mm\nH =1200 mm')
  assert.equal(separation.state, 'VARIANT_SCOPED_GEOMETRY')
  assert.equal(separation.variantScopedModuleIds.length, 1)
  assert.equal(separation.projectGeometryModuleIds.length, 0)
})

test('REAL DATA 02.5 floor placement survives project-level specification separation', () => {
  const { bridge } = run('Вариант 1: PVC дограма SYNTH-A\nВариант 2: AL дограма SYNTH-B\nСпецификация:\nЕтаж 2\nМодул: 8\nL =2380 mm\nH =1900 mm')
  assert.equal(bridge.draft.modules[0]?.placement[0]?.label.value, 'Етаж 2')
  assert.equal(bridge.draft.modules[0]?.placement[0]?.kind, 'FLOOR')
})

test('REAL DATA 02.5 specification separation does not create a new offer variant', () => {
  const { bridge } = run(sharedGeometrySource)
  assert.equal(bridge.draft.offerVariants.length, 2)
  assert.deepEqual(bridge.draft.offerVariants.map((variant) => variant.label.value), ['Вариант 1', 'Вариант 2'])
})

test('REAL DATA 02.5 no-specification multi-variant geometry remains review-required rather than silently reclassified', () => {
  const { separation } = run('Вариант 1: PVC дограма SYNTH-A\nВариант 2: AL дограма SYNTH-B\nМодул: 1\nL =1000 mm\nH =1200 mm')
  assert.equal(separation.state, 'MIXED_SCOPES_REVIEW_REQUIRED')
  assert.ok(separation.warnings.some((warning) => warning.includes('неявен scope')))
})

test('REAL DATA 02.5 separation model never duplicates module ids into variants', () => {
  const { bridge, separation } = run(sharedGeometrySource)
  const allExplicit = separation.variants.flatMap((variant) => variant.explicitModuleIds)
  assert.equal(allExplicit.length, 0)
  assert.equal(bridge.draft.modules.length, 2)
})

test('REAL DATA 02.5 separation safety forbids ownership/applicability inference and production decisions', () => {
  const { separation } = run(sharedGeometrySource)
  assert.equal(separation.safety.geometryOwnershipInferenceAllowed, false)
  assert.equal(separation.safety.variantApplicabilityInferenceAllowed, false)
  assert.equal(separation.safety.automaticModuleDuplicationAllowed, false)
  assert.equal(separation.safety.automaticModuleMergeAllowed, false)
  assert.equal(separation.safety.createsLifecycleProject, false)
  assert.equal(separation.safety.machineReady, false)
  assert.equal(separation.safety.productionApproved, false)
})

test('REAL DATA 02.5 alternative-variant golden fixture now has explicit specification scope and closes the common-geometry gap', () => {
  const fixture = NADEZHDA_GOLDEN_PATTERN_FIXTURES.find((item) => item.patternFamily === 'ALTERNATIVE_VARIANTS_SHARED_GEOMETRY')!
  assert.equal(fixture.knownGaps.includes('COMMON_GEOMETRY_AFTER_VARIANTS_REQUIRES_EXPLICIT_SCOPE'), false)
  const { extraction, bridge } = run(fixture.sourceText)
  const separation = analyzeNadezhdaGeometryOfferSeparation(extraction, bridge.draft)
  assert.equal(separation.state, 'EXPLICIT_SHARED_PROJECT_GEOMETRY')
  assert.equal(separation.projectGeometryModuleIds.length, fixture.expectation.moduleCount)
})

test('REAL DATA 02.5 multiple-offer-variants golden fixture now separates all common modules from every variant', () => {
  const fixture = NADEZHDA_GOLDEN_PATTERN_FIXTURES.find((item) => item.patternFamily === 'MULTIPLE_OFFER_VARIANTS')!
  const { extraction, bridge } = run(fixture.sourceText)
  const separation = analyzeNadezhdaGeometryOfferSeparation(extraction, bridge.draft)
  assert.equal(separation.state, 'EXPLICIT_SHARED_PROJECT_GEOMETRY')
  assert.equal(separation.projectGeometryModuleIds.length, fixture.expectation.moduleCount)
  assert.ok(separation.variants.every((variant) => variant.explicitModuleIds.length === 0))
})

test('REAL DATA 02.5 ambiguous multi-system fixture intentionally retains the shared-geometry known gap when no specification heading exists', () => {
  const fixture = NADEZHDA_GOLDEN_PATTERN_FIXTURES.find((item) => item.patternFamily === 'MULTI_SYSTEM_VARIANT_AND_COMMERCIAL_SECTIONS')!
  assert.ok(fixture.knownGaps.includes('COMMON_GEOMETRY_AFTER_VARIANTS_REQUIRES_EXPLICIT_SCOPE'))
  const { extraction, bridge } = run(fixture.sourceText)
  const separation = analyzeNadezhdaGeometryOfferSeparation(extraction, bridge.draft)
  assert.equal(separation.state, 'MIXED_SCOPES_REVIEW_REQUIRED')
})

test('REAL DATA 02.5 leaves unrelated known gaps intact', () => {
  const gaps = NADEZHDA_GOLDEN_PATTERN_FIXTURES.flatMap((fixture) => fixture.knownGaps)
  assert.ok(gaps.includes('MULTI_BASIS_PRICING_REMAINS_TEXT_EVIDENCE'))
  assert.ok(gaps.includes('COMMERCIAL_SCOPE_AFTER_MULTIPLE_VARIANTS_REQUIRES_REVIEW'))
  assert.ok(gaps.includes('BARE_PRE_MODULE_GLAZING_REQUIRES_HARDENING'))
})

test('REAL DATA 02.5 source evidence remains private and resolved geometry remains evidence-backed', () => {
  const { bridge } = run(sharedGeometrySource)
  assert.ok(bridge.draft.evidence.every((item) => item.privateSource))
  for (const module of bridge.draft.modules) {
    assert.ok(module.externalReference.evidenceRefs.length > 0)
    assert.ok(module.widthMm.evidenceRefs.length > 0)
    assert.ok(module.heightMm.evidenceRefs.length > 0)
  }
})

test('REAL DATA 02.5 does not infer opening, sash, divider, machine code or production profile geometry', () => {
  const { bridge, separation } = run(sharedGeometrySource)
  const serialized = JSON.stringify({ bridge: bridge.draft, separation })
  assert.equal(/openingDirection|sash|divider|machineCode|frameProfile/i.test(serialized), false)
})

test('REAL DATA 02.5 tracked phase files contain no private client/project identifiers', () => {
  const tracked = [
    readFileSync('src/realData/nadezhdaGeometryOfferSeparation.ts', 'utf8'),
    readFileSync('tests/realData02_5SharedProjectGeometryOfferSeparation.test.ts', 'utf8'),
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
