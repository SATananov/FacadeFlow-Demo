import assert from 'node:assert/strict'
import test from 'node:test'
import { extractNadezhdaDocumentPatterns } from '../src/realData/nadezhdaDocumentPatternExtractor'
import { analyzeNadezhdaGeometryOfferSeparation } from '../src/realData/nadezhdaGeometryOfferSeparation'
import {
  reviewNadezhdaOfferApplicability,
  type NadezhdaHumanOfferApplicabilityDecision,
} from '../src/realData/nadezhdaHumanOfferApplicability'
import {
  reviewNadezhdaModuleOverrides,
  type NadezhdaHumanModuleOverrideDecision,
} from '../src/realData/nadezhdaModuleOverrideReview'
import { bridgeNadezhdaExtractionToProjectDraft } from '../src/realData/nadezhdaProjectDraftBridge'

const source = [
  'обект : SYNTH-RD027',
  'Вариант 1: PVC дограма SYNTH-A',
  'Цвят: SYNTH-COLOR',
  'Стъклопакет: SYNTH-32',
  'Вариант 2: AL дограма SYNTH-B',
  'Цвят: SYNTH-COLOR',
  'Стъклопакет: SYNTH-44',
  'Спецификация:',
  'Модул: 1',
  'Брой: 1',
  'L =1000 mm',
  'H =1000 mm',
  'Модул: 2',
  'Брой: 1',
  'L =1200 mm',
  'H =1000 mm',
].join('\n')

function setup(ready = true) {
  const extraction = extractNadezhdaDocumentPatterns({
    sourceId: 'rd027',
    sourceKind: 'DOCX',
    sourceReference: 'SYNTHETIC_RD027.docx',
    text: source,
  })
  const bridge = bridgeNadezhdaExtractionToProjectDraft(extraction, 'draft-rd027')
  const separation = analyzeNadezhdaGeometryOfferSeparation(extraction, bridge.draft)
  const [variantA, variantB] = separation.variants
  const applicabilityDecisions: NadezhdaHumanOfferApplicabilityDecision[] = ready
    ? [
        {
          id: 'app-1',
          variantId: variantA!.variantId,
          decision: 'APPLIES',
          scope: 'SHARED_PROJECT_GEOMETRY',
          moduleIds: [],
          reviewerId: 'reviewer-01',
          reviewedAt: '2026-09-03T09:20:00+03:00',
          note: 'synthetic review',
        },
        {
          id: 'app-2',
          variantId: variantB!.variantId,
          decision: 'DOES_NOT_APPLY',
          scope: 'SHARED_PROJECT_GEOMETRY',
          moduleIds: [],
          reviewerId: 'reviewer-01',
          reviewedAt: '2026-09-03T09:20:00+03:00',
          note: 'synthetic review',
        },
      ]
    : []

  const applicability = reviewNadezhdaOfferApplicability(
    separation,
    bridge.draft,
    applicabilityDecisions,
  )

  return {
    draft: bridge.draft,
    applicability,
    variantId: variantA!.variantId,
    otherVariantId: variantB!.variantId,
    moduleIds: separation.projectGeometryModuleIds,
    evidenceId: bridge.draft.evidence[0]!.id,
  }
}

function overrideDecision(
  context: ReturnType<typeof setup>,
  overrides: Partial<NadezhdaHumanModuleOverrideDecision> = {},
): NadezhdaHumanModuleOverrideDecision {
  return {
    id: 'override-1',
    variantId: context.variantId,
    moduleId: context.moduleIds[0]!,
    field: 'GLAZING',
    value: 'SYNTH-SPECIAL-GLAZING',
    evidenceRefs: [context.evidenceId],
    reviewerId: 'reviewer-01',
    reviewedAt: '2026-09-03T09:25:00+03:00',
    note: 'explicit source-backed module exception',
    ...overrides,
  }
}

test('REAL DATA 02.7 model is versioned', () => {
  const context = setup()
  const result = reviewNadezhdaModuleOverrides(context.draft, context.applicability, [])
  assert.equal(result.version, 'REALDATA02.7')
})

test('REAL DATA 02.7 accepts no overrides when applicability is already human-reviewed', () => {
  const context = setup()
  const result = reviewNadezhdaModuleOverrides(context.draft, context.applicability, [])
  assert.equal(result.readyForDownstreamHumanReviewedUse, true)
})

test('REAL DATA 02.7 resolves one explicit source-backed module override', () => {
  const context = setup()
  const result = reviewNadezhdaModuleOverrides(
    context.draft,
    context.applicability,
    [overrideDecision(context)],
  )
  assert.equal(result.validationErrors.length, 0)
  assert.equal(result.overrides[0]!.state, 'RESOLVED')
  assert.equal(result.overrides[0]!.value, 'SYNTH-SPECIAL-GLAZING')
})

test('REAL DATA 02.7 trims the explicit override value', () => {
  const context = setup()
  const result = reviewNadezhdaModuleOverrides(
    context.draft,
    context.applicability,
    [overrideDecision(context, { value: '  SPECIAL  ' })],
  )
  assert.equal(result.overrides[0]!.value, 'SPECIAL')
})

test('REAL DATA 02.7 same-value repeated human decisions remain resolved', () => {
  const context = setup()
  const result = reviewNadezhdaModuleOverrides(context.draft, context.applicability, [
    overrideDecision(context, { id: 'override-a' }),
    overrideDecision(context, { id: 'override-b' }),
  ])
  assert.equal(result.overrides[0]!.state, 'RESOLVED')
  assert.equal(result.overrides[0]!.decisionIds.length, 2)
})

test('REAL DATA 02.7 conflicting values never use last-write-wins', () => {
  const context = setup()
  const result = reviewNadezhdaModuleOverrides(context.draft, context.applicability, [
    overrideDecision(context, { id: 'override-a', value: 'A' }),
    overrideDecision(context, { id: 'override-b', value: 'B' }),
  ])
  assert.equal(result.overrides[0]!.state, 'CONFLICT_REVIEW_REQUIRED')
  assert.equal(result.overrides[0]!.value, null)
  assert.equal(result.readyForDownstreamHumanReviewedUse, false)
})

test('REAL DATA 02.7 different override fields remain independent', () => {
  const context = setup()
  const result = reviewNadezhdaModuleOverrides(context.draft, context.applicability, [
    overrideDecision(context, { id: 'override-a', field: 'GLAZING' }),
    overrideDecision(context, { id: 'override-b', field: 'COLOR', value: 'SYNTH-COLOR-2' }),
  ])
  assert.equal(result.overrides.length, 2)
})

test('REAL DATA 02.7 different modules remain independent even with same field', () => {
  const context = setup()
  const result = reviewNadezhdaModuleOverrides(context.draft, context.applicability, [
    overrideDecision(context, { id: 'override-a' }),
    overrideDecision(context, { id: 'override-b', moduleId: context.moduleIds[1]! }),
  ])
  assert.equal(result.overrides.length, 2)
})

test('REAL DATA 02.7 rejects empty decision id', () => {
  const context = setup()
  const result = reviewNadezhdaModuleOverrides(
    context.draft,
    context.applicability,
    [overrideDecision(context, { id: ' ' })],
  )
  assert.ok(result.validationErrors.some((error) => error.includes('непразен id')))
})

test('REAL DATA 02.7 rejects missing offer variant', () => {
  const context = setup()
  const result = reviewNadezhdaModuleOverrides(
    context.draft,
    context.applicability,
    [overrideDecision(context, { variantId: 'missing-variant' })],
  )
  assert.ok(result.validationErrors.some((error) => error.includes('липсващ offer variant')))
})

test('REAL DATA 02.7 rejects missing module', () => {
  const context = setup()
  const result = reviewNadezhdaModuleOverrides(
    context.draft,
    context.applicability,
    [overrideDecision(context, { moduleId: 'missing-module' })],
  )
  assert.ok(result.validationErrors.some((error) => error.includes('липсващ module')))
})

test('REAL DATA 02.7 rejects override on variant confirmed DOES_NOT_APPLY', () => {
  const context = setup()
  const result = reviewNadezhdaModuleOverrides(
    context.draft,
    context.applicability,
    [overrideDecision(context, { variantId: context.otherVariantId })],
  )
  assert.ok(result.validationErrors.some((error) => error.includes('APPLIES')))
})

test('REAL DATA 02.7 rejects empty override value', () => {
  const context = setup()
  const result = reviewNadezhdaModuleOverrides(
    context.draft,
    context.applicability,
    [overrideDecision(context, { value: ' ' })],
  )
  assert.ok(result.validationErrors.some((error) => error.includes('непразна стойност')))
})

test('REAL DATA 02.7 requires source evidence', () => {
  const context = setup()
  const result = reviewNadezhdaModuleOverrides(
    context.draft,
    context.applicability,
    [overrideDecision(context, { evidenceRefs: [] })],
  )
  assert.ok(result.validationErrors.some((error) => error.includes('поне един evidence ref')))
})

test('REAL DATA 02.7 rejects duplicate evidence refs', () => {
  const context = setup()
  const result = reviewNadezhdaModuleOverrides(
    context.draft,
    context.applicability,
    [overrideDecision(context, { evidenceRefs: [context.evidenceId, context.evidenceId] })],
  )
  assert.ok(result.validationErrors.some((error) => error.includes('повтарящи се evidence refs')))
})

test('REAL DATA 02.7 rejects unknown evidence ref', () => {
  const context = setup()
  const result = reviewNadezhdaModuleOverrides(
    context.draft,
    context.applicability,
    [overrideDecision(context, { evidenceRefs: ['missing-evidence'] })],
  )
  assert.ok(result.validationErrors.some((error) => error.includes('липсващ evidence ref')))
})

test('REAL DATA 02.7 requires reviewer id', () => {
  const context = setup()
  const result = reviewNadezhdaModuleOverrides(
    context.draft,
    context.applicability,
    [overrideDecision(context, { reviewerId: ' ' })],
  )
  assert.ok(result.validationErrors.some((error) => error.includes('reviewerId')))
})

test('REAL DATA 02.7 requires a parseable reviewedAt timestamp', () => {
  const context = setup()
  const result = reviewNadezhdaModuleOverrides(
    context.draft,
    context.applicability,
    [overrideDecision(context, { reviewedAt: 'not-a-date' })],
  )
  assert.ok(result.validationErrors.some((error) => error.includes('reviewedAt')))
})

test('REAL DATA 02.7 duplicate decision ids are validation errors', () => {
  const context = setup()
  const result = reviewNadezhdaModuleOverrides(context.draft, context.applicability, [
    overrideDecision(context, { id: 'same-id' }),
    overrideDecision(context, { id: 'same-id', moduleId: context.moduleIds[1]! }),
  ])
  assert.ok(result.validationErrors.some((error) => error.includes('Повтарящ се')))
})

test('REAL DATA 02.7 incomplete offer applicability blocks downstream readiness', () => {
  const context = setup(false)
  const result = reviewNadezhdaModuleOverrides(context.draft, context.applicability, [])
  assert.equal(result.readyForDownstreamHumanReviewedUse, false)
  assert.ok(result.warnings.some((warning) => warning.includes('Offer applicability')))
})

test('REAL DATA 02.7 keeps production and automatic inference locked', () => {
  const context = setup()
  const result = reviewNadezhdaModuleOverrides(context.draft, context.applicability, [])
  assert.equal(result.safety.machineReady, false)
  assert.equal(result.safety.productionApproved, false)
  assert.equal(result.safety.automaticOverrideInferenceAllowed, false)
  assert.equal(result.safety.automaticLastWriteWinsAllowed, false)
  assert.equal(result.safety.mutatesSourceDraft, false)
})
