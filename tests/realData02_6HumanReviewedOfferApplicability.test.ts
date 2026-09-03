import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { extractNadezhdaDocumentPatterns } from '../src/realData/nadezhdaDocumentPatternExtractor'
import { analyzeNadezhdaGeometryOfferSeparation } from '../src/realData/nadezhdaGeometryOfferSeparation'
import {
  reviewNadezhdaOfferApplicability,
  type NadezhdaHumanOfferApplicabilityDecision,
} from '../src/realData/nadezhdaHumanOfferApplicability'
import { bridgeNadezhdaExtractionToProjectDraft } from '../src/realData/nadezhdaProjectDraftBridge'

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
  'L =2000 mm',
  'H =1700 mm',
].join('\n')

function build(text = sharedGeometrySource) {
  const extraction = extractNadezhdaDocumentPatterns({
    sourceId: 'rd026',
    sourceKind: 'DOCX',
    sourceReference: 'SYNTHETIC_RD026.docx',
    text,
  })
  const bridge = bridgeNadezhdaExtractionToProjectDraft(extraction, 'draft-rd026')
  const separation = analyzeNadezhdaGeometryOfferSeparation(extraction, bridge.draft)
  return { extraction, bridge, separation }
}

function decision(
  id: string,
  variantId: string,
  value: 'APPLIES' | 'DOES_NOT_APPLY',
  overrides: Partial<NadezhdaHumanOfferApplicabilityDecision> = {},
): NadezhdaHumanOfferApplicabilityDecision {
  return {
    id,
    variantId,
    decision: value,
    scope: 'SHARED_PROJECT_GEOMETRY',
    moduleIds: [],
    reviewerId: 'human-reviewer-01',
    reviewedAt: '2026-09-03T08:15:00+03:00',
    note: 'explicit human review',
    ...overrides,
  }
}

test('REAL DATA 02.6 model is versioned', () => {
  const { bridge, separation } = build()
  const result = reviewNadezhdaOfferApplicability(separation, bridge.draft, [])
  assert.equal(result.version, 'REALDATA02.6')
})

test('REAL DATA 02.6 starts shared variants as NOT_REVIEWED without human decisions', () => {
  const { bridge, separation } = build()
  const result = reviewNadezhdaOfferApplicability(separation, bridge.draft, [])
  assert.ok(result.variants.length >= 2)
  assert.ok(result.variants.every((variant) => variant.state === 'NOT_REVIEWED'))
  assert.equal(result.readyForDownstreamHumanReviewedUse, false)
})

test('REAL DATA 02.6 explicit shared APPLIES confirms every shared module for one variant', () => {
  const { bridge, separation } = build()
  const variantId = separation.variants[0]!.variantId
  const result = reviewNadezhdaOfferApplicability(separation, bridge.draft, [decision('d1', variantId, 'APPLIES')])
  const reviewed = result.variants.find((variant) => variant.variantId === variantId)!
  assert.equal(reviewed.state, 'CONFIRMED_APPLIES')
  assert.deepEqual(reviewed.appliesModuleIds, separation.projectGeometryModuleIds)
  assert.deepEqual(reviewed.unreviewedModuleIds, [])
})

test('REAL DATA 02.6 explicit shared DOES_NOT_APPLY confirms every shared module for one variant', () => {
  const { bridge, separation } = build()
  const variantId = separation.variants[0]!.variantId
  const result = reviewNadezhdaOfferApplicability(separation, bridge.draft, [decision('d1', variantId, 'DOES_NOT_APPLY')])
  const reviewed = result.variants.find((variant) => variant.variantId === variantId)!
  assert.equal(reviewed.state, 'CONFIRMED_DOES_NOT_APPLY')
  assert.deepEqual(reviewed.doesNotApplyModuleIds, separation.projectGeometryModuleIds)
})

test('REAL DATA 02.6 module subset review stays partial while some shared modules are untouched', () => {
  const { bridge, separation } = build()
  const variantId = separation.variants[0]!.variantId
  const firstModule = separation.projectGeometryModuleIds[0]!
  const result = reviewNadezhdaOfferApplicability(separation, bridge.draft, [decision('d1', variantId, 'APPLIES', {
    scope: 'MODULE_SUBSET',
    moduleIds: [firstModule],
  })])
  const reviewed = result.variants.find((variant) => variant.variantId === variantId)!
  assert.equal(reviewed.state, 'PARTIALLY_REVIEWED')
  assert.deepEqual(reviewed.appliesModuleIds, [firstModule])
  assert.equal(reviewed.unreviewedModuleIds.length, separation.projectGeometryModuleIds.length - 1)
})

test('REAL DATA 02.6 fully reviewed mixed module scope is explicit and human-confirmed', () => {
  const { bridge, separation } = build()
  const variantId = separation.variants[0]!.variantId
  const [m1, m2] = separation.projectGeometryModuleIds
  const result = reviewNadezhdaOfferApplicability(separation, bridge.draft, [
    decision('d1', variantId, 'APPLIES', { scope: 'MODULE_SUBSET', moduleIds: [m1!] }),
    decision('d2', variantId, 'DOES_NOT_APPLY', { scope: 'MODULE_SUBSET', moduleIds: [m2!] }),
  ])
  const reviewed = result.variants.find((variant) => variant.variantId === variantId)!
  assert.equal(reviewed.state, 'CONFIRMED_MIXED_SCOPE')
  assert.deepEqual(reviewed.unreviewedModuleIds, [])
})

test('REAL DATA 02.6 conflicting human decisions are not resolved by last-write-wins', () => {
  const { bridge, separation } = build()
  const variantId = separation.variants[0]!.variantId
  const moduleId = separation.projectGeometryModuleIds[0]!
  const result = reviewNadezhdaOfferApplicability(separation, bridge.draft, [
    decision('d1', variantId, 'APPLIES', { scope: 'MODULE_SUBSET', moduleIds: [moduleId] }),
    decision('d2', variantId, 'DOES_NOT_APPLY', { scope: 'MODULE_SUBSET', moduleIds: [moduleId] }),
  ])
  const reviewed = result.variants.find((variant) => variant.variantId === variantId)!
  assert.equal(reviewed.state, 'CONFLICT_REVIEW_REQUIRED')
  assert.deepEqual(reviewed.conflictingModuleIds, [moduleId])
  assert.ok(result.warnings.some((warning) => warning.includes('противоречиви')))
})

test('REAL DATA 02.6 rejects a missing offer variant id', () => {
  const { bridge, separation } = build()
  const result = reviewNadezhdaOfferApplicability(separation, bridge.draft, [decision('d1', 'missing-variant', 'APPLIES')])
  assert.ok(result.validationErrors.some((error) => error.includes('липсващ offer variant')))
  assert.equal(result.decisions.length, 0)
})

test('REAL DATA 02.6 rejects module subset ids outside shared project geometry', () => {
  const { bridge, separation } = build()
  const variantId = separation.variants[0]!.variantId
  const result = reviewNadezhdaOfferApplicability(separation, bridge.draft, [decision('d1', variantId, 'APPLIES', {
    scope: 'MODULE_SUBSET',
    moduleIds: ['missing-module'],
  })])
  assert.ok(result.validationErrors.some((error) => error.includes('не принадлежи към shared project geometry')))
})

test('REAL DATA 02.6 shared geometry decision must not carry module ids', () => {
  const { bridge, separation } = build()
  const variantId = separation.variants[0]!.variantId
  const result = reviewNadezhdaOfferApplicability(separation, bridge.draft, [decision('d1', variantId, 'APPLIES', {
    moduleIds: [separation.projectGeometryModuleIds[0]!],
  })])
  assert.ok(result.validationErrors.some((error) => error.includes('не трябва да носи moduleIds')))
})

test('REAL DATA 02.6 module subset decision requires at least one module id', () => {
  const { bridge, separation } = build()
  const variantId = separation.variants[0]!.variantId
  const result = reviewNadezhdaOfferApplicability(separation, bridge.draft, [decision('d1', variantId, 'APPLIES', {
    scope: 'MODULE_SUBSET',
    moduleIds: [],
  })])
  assert.ok(result.validationErrors.some((error) => error.includes('изисква поне един module id')))
})

test('REAL DATA 02.6 module subset decision rejects duplicate module ids', () => {
  const { bridge, separation } = build()
  const variantId = separation.variants[0]!.variantId
  const moduleId = separation.projectGeometryModuleIds[0]!
  const result = reviewNadezhdaOfferApplicability(separation, bridge.draft, [decision('d1', variantId, 'APPLIES', {
    scope: 'MODULE_SUBSET',
    moduleIds: [moduleId, moduleId],
  })])
  assert.ok(result.validationErrors.some((error) => error.includes('повтарящи се module ids')))
})

test('REAL DATA 02.6 reviewer id is mandatory', () => {
  const { bridge, separation } = build()
  const variantId = separation.variants[0]!.variantId
  const result = reviewNadezhdaOfferApplicability(separation, bridge.draft, [decision('d1', variantId, 'APPLIES', { reviewerId: ' ' })])
  assert.ok(result.validationErrors.some((error) => error.includes('reviewerId')))
})

test('REAL DATA 02.6 reviewed timestamp is mandatory and parseable', () => {
  const { bridge, separation } = build()
  const variantId = separation.variants[0]!.variantId
  const result = reviewNadezhdaOfferApplicability(separation, bridge.draft, [decision('d1', variantId, 'APPLIES', { reviewedAt: 'not-a-date' })])
  assert.ok(result.validationErrors.some((error) => error.includes('reviewedAt')))
})

test('REAL DATA 02.6 duplicate human decision ids are validation errors', () => {
  const { bridge, separation } = build()
  const [v1, v2] = separation.variants
  const result = reviewNadezhdaOfferApplicability(separation, bridge.draft, [
    decision('same-id', v1!.variantId, 'APPLIES'),
    decision('same-id', v2!.variantId, 'APPLIES'),
  ])
  assert.ok(result.validationErrors.some((error) => error.includes('Повтарящ се human applicability decision id')))
})

test('REAL DATA 02.6 does not accept shared applicability decisions when 02.5 says NOT_APPLICABLE', () => {
  const singleVariantSource = [
    'Вариант 1: PVC дограма SYNTH-A',
    'Спецификация:',
    'Модул: 1',
    'Брой: 1',
    'L =1000 mm',
    'H =1000 mm',
  ].join('\n')
  const { bridge, separation } = build(singleVariantSource)
  const variantId = separation.variants[0]!.variantId
  assert.equal(separation.variants[0]!.sharedProjectGeometryApplicability, 'NOT_APPLICABLE')
  const result = reviewNadezhdaOfferApplicability(separation, bridge.draft, [decision('d1', variantId, 'APPLIES')])
  assert.ok(result.validationErrors.some((error) => error.includes('няма shared geometry applicability')))
})

test('REAL DATA 02.6 reviews each offer variant independently without choosing a winning offer', () => {
  const { bridge, separation } = build()
  const [v1, v2] = separation.variants
  const result = reviewNadezhdaOfferApplicability(separation, bridge.draft, [
    decision('d1', v1!.variantId, 'APPLIES'),
    decision('d2', v2!.variantId, 'APPLIES'),
  ])
  assert.equal(result.variants.find((variant) => variant.variantId === v1!.variantId)!.state, 'CONFIRMED_APPLIES')
  assert.equal(result.variants.find((variant) => variant.variantId === v2!.variantId)!.state, 'CONFIRMED_APPLIES')
  assert.equal(result.safety.automaticOfferSelectionAllowed, false)
})

test('REAL DATA 02.6 downstream reviewed use requires all review-required variants to be fully reviewed', () => {
  const { bridge, separation } = build()
  const [v1, v2] = separation.variants
  const partial = reviewNadezhdaOfferApplicability(separation, bridge.draft, [decision('d1', v1!.variantId, 'APPLIES')])
  assert.equal(partial.readyForDownstreamHumanReviewedUse, false)
  const complete = reviewNadezhdaOfferApplicability(separation, bridge.draft, [
    decision('d1', v1!.variantId, 'APPLIES'),
    decision('d2', v2!.variantId, 'DOES_NOT_APPLY'),
  ])
  assert.equal(complete.readyForDownstreamHumanReviewedUse, true)
})

test('REAL DATA 02.6 source draft is not mutated by applicability review', () => {
  const { bridge, separation } = build()
  const before = JSON.stringify(bridge.draft)
  reviewNadezhdaOfferApplicability(separation, bridge.draft, [decision('d1', separation.variants[0]!.variantId, 'APPLIES')])
  assert.equal(JSON.stringify(bridge.draft), before)
})

test('REAL DATA 02.6 same-size module positions remain distinct during review', () => {
  const { bridge, separation } = build()
  assert.equal(separation.projectGeometryModuleIds.length, 2)
  assert.notEqual(separation.projectGeometryModuleIds[0], separation.projectGeometryModuleIds[1])
  const result = reviewNadezhdaOfferApplicability(separation, bridge.draft, [decision('d1', separation.variants[0]!.variantId, 'APPLIES')])
  assert.equal(result.variants[0]!.appliesModuleIds.length, 2)
})

test('REAL DATA 02.6 retains explicit human decision audit metadata', () => {
  const { bridge, separation } = build()
  const input = decision('audit-1', separation.variants[0]!.variantId, 'APPLIES', {
    reviewerId: 'reviewer-b',
    reviewedAt: '2026-09-03T08:30:00+03:00',
    note: 'checked against source offer',
  })
  const result = reviewNadezhdaOfferApplicability(separation, bridge.draft, [input])
  assert.deepEqual(result.decisions[0], input)
})

test('REAL DATA 02.6 safety keeps lifecycle, reuse, machine and production boundaries locked', () => {
  const { bridge, separation } = build()
  const result = reviewNadezhdaOfferApplicability(separation, bridge.draft, [])
  assert.equal(result.safety.humanDecisionRequired, true)
  assert.equal(result.safety.automaticApplicabilityInferenceAllowed, false)
  assert.equal(result.safety.automaticOfferSelectionAllowed, false)
  assert.equal(result.safety.automaticModuleDuplicationAllowed, false)
  assert.equal(result.safety.automaticModuleMergeAllowed, false)
  assert.equal(result.safety.mutatesSourceDraft, false)
  assert.equal(result.safety.createsLifecycleProject, false)
  assert.equal(result.safety.automaticReuseAllowed, false)
  assert.equal(result.safety.productionLocked, true)
  assert.equal(result.safety.machineReady, false)
  assert.equal(result.safety.productionApproved, false)
})

test('REAL DATA 02.6 does not introduce construction inference fields', () => {
  const { bridge, separation } = build()
  const result = reviewNadezhdaOfferApplicability(separation, bridge.draft, [])
  const serialized = JSON.stringify(result)
  assert.equal(/openingDirection|sash|divider|machineCode|frameProfile/i.test(serialized), false)
})


test('REAL DATA 02.6 tracked phase files contain no private client/project identifiers', () => {
  const tracked = [
    readFileSync('src/realData/nadezhdaHumanOfferApplicability.ts', 'utf8'),
    readFileSync('tests/realData02_6HumanReviewedOfferApplicability.test.ts', 'utf8'),
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
