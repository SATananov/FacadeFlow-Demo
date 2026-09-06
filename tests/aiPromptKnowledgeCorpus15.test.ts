import assert from 'node:assert/strict'
import test from 'node:test'
import {
  AI_PROMPT_KNOWLEDGE_CORPUS_15,
  evaluateFacadeFlowPromptKnowledgeCorpus15,
} from '../src/aiPromptKnowledgeCorpus15'
import {
  applyFacadeFlowOfferCommercialSummaryCommand,
  createFacadeFlowOfferCommercialSummaryRuntime,
} from '../src/aiPromptOfferCommercialSummaryRuntime'

test('AI PROMPT KNOWLEDGE CORPUS 15 contains exactly 200 unique prompts split 50/50/50/50', () => {
  assert.equal(AI_PROMPT_KNOWLEDGE_CORPUS_15.length, 200)
  assert.equal(new Set(AI_PROMPT_KNOWLEDGE_CORPUS_15.map((entry) => entry.id)).size, 200)
  assert.equal(new Set(AI_PROMPT_KNOWLEDGE_CORPUS_15.map((entry) => entry.prompt)).size, 200)
  const counts = AI_PROMPT_KNOWLEDGE_CORPUS_15.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.track] = (acc[entry.track] ?? 0) + 1
    return acc
  }, {})
  assert.deepEqual(counts, {
    INITIAL_MODULE_QUANTITIES: 50,
    QUANTITY_REVISION: 50,
    COPY_WITH_QUANTITY: 50,
    COMMERCIAL_SUMMARY_SAFETY: 50,
  })
})

test('Corpus 15 evaluates all 200 commercial quantity prompts without production authority', () => {
  const result = evaluateFacadeFlowPromptKnowledgeCorpus15()
  assert.equal(result.total, 200)
  assert.equal(result.failed, 0, JSON.stringify(result.failures.slice(0, 5), null, 2))
  assert.equal(result.passed, 200)
})

test('Corpus 15 quantity revision changes commercial quantity without confusing module ID or frame geometry', () => {
  let runtime = createFacadeFlowOfferCommercialSummaryRuntime('Оферта за Тест | Модул 12, 2 броя, каса 1600 x 1400 mm')
  runtime = applyFacadeFlowOfferCommercialSummaryCommand(runtime, 'Модул 12 да стане 3 бр.')
  const module = runtime.moduleQuantities.find((entry) => entry.moduleNumber === 12)
  assert.equal(module?.effectiveQuantity, 3)
  assert.equal(module?.geometryQuantity, 2)
  assert.equal(runtime.summary.totalQuantity, 3)
  assert.equal(runtime.lastCommandStatus, 'APPLIED')
})

test('Corpus 15 copied module can receive an independent quantity and source quantity stays unchanged', () => {
  const runtime = createFacadeFlowOfferCommercialSummaryRuntime('Оферта за Тест | Модул 1, 2 броя, каса 1800 x 1400 mm | Копирай Модул 1 като Модул 3, 6 броя')
  assert.equal(runtime.moduleQuantities.find((entry) => entry.moduleNumber === 1)?.effectiveQuantity, 2)
  assert.equal(runtime.moduleQuantities.find((entry) => entry.moduleNumber === 3)?.effectiveQuantity, 6)
  assert.equal(runtime.summary.totalQuantity, 8)
})

test('Corpus 15 refuses to claim a complete total when any module quantity is missing', () => {
  const runtime = createFacadeFlowOfferCommercialSummaryRuntime('Оферта за Тест | Модул 1, 3 броя, каса 1400 x 1400 mm | Модул 2, каса 900 x 2100 mm')
  assert.equal(runtime.summary.complete, false)
  assert.equal(runtime.summary.totalQuantity, null)
  assert.equal(runtime.summary.totalKnownQuantity, 3)
  assert.deepEqual(runtime.summary.modulesWithoutQuantity, [2])
})

test('Corpus 15 ambiguous or invalid quantity commands never mutate the commercial total', () => {
  let runtime = createFacadeFlowOfferCommercialSummaryRuntime('Оферта за Тест | Модул 1, 2 броя, каса 1200 x 1400 mm')
  const beforeKey = runtime.visibleStateKey
  runtime = applyFacadeFlowOfferCommercialSummaryCommand(runtime, 'Направи го 5 броя')
  assert.equal(runtime.lastCommandStatus, 'REVIEW_REQUIRED')
  assert.equal(runtime.visibleStateKey, beforeKey)
  runtime = applyFacadeFlowOfferCommercialSummaryCommand(runtime, 'Модул 1 да стане 0 бр.')
  assert.equal(runtime.lastCommandStatus, 'REVIEW_REQUIRED')
  assert.equal(runtime.summary.totalQuantity, 2)
})
