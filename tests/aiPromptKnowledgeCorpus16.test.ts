import assert from 'node:assert/strict'
import test from 'node:test'
import {
  AI_PROMPT_KNOWLEDGE_CORPUS_16,
  evaluateFacadeFlowPromptKnowledgeCorpus16,
} from '../src/aiPromptKnowledgeCorpus16'
import {
  applyFacadeFlowOfferCompletenessReviewCommand,
  createFacadeFlowOfferCompletenessReviewRuntime,
} from '../src/aiPromptOfferCompletenessReviewRuntime'

test('AI PROMPT KNOWLEDGE CORPUS 16 contains exactly 200 unique prompts split 50/50/50/50', () => {
  assert.equal(AI_PROMPT_KNOWLEDGE_CORPUS_16.length, 200)
  assert.equal(new Set(AI_PROMPT_KNOWLEDGE_CORPUS_16.map((entry) => entry.id)).size, 200)
  assert.equal(new Set(AI_PROMPT_KNOWLEDGE_CORPUS_16.map((entry) => entry.prompt)).size, 200)
  const counts = AI_PROMPT_KNOWLEDGE_CORPUS_16.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.track] = (acc[entry.track] ?? 0) + 1
    return acc
  }, {})
  assert.deepEqual(counts, {
    COMPLETE_READY_FOR_REVIEW: 50,
    INCOMPLETE_FIELD_DISCOVERY: 50,
    HUMAN_CONFIRM_GATE: 50,
    CONFIRMATION_INVALIDATION_SAFETY: 50,
  })
})

test('Corpus 16 evaluates all 200 completeness and Human Review cases without production authority', () => {
  const result = evaluateFacadeFlowPromptKnowledgeCorpus16()
  assert.equal(result.total, 200)
  assert.equal(result.failed, 0, JSON.stringify(result.failures.slice(0, 8), null, 2))
  assert.equal(result.passed, 200)
})

test('Corpus 16 complete module becomes READY_FOR_HUMAN_REVIEW but is never production ready', () => {
  const runtime = createFacadeFlowOfferCompletenessReviewRuntime('Оферта за Клиент, система PRELUDE 60, цвят RAL 7016, двоен стъклопакет, обков ROTO NX | Модул 1, 2 броя, каса 1500 x 1400 mm, фикс')
  assert.equal(runtime.moduleReviews[0]?.status, 'READY_FOR_HUMAN_REVIEW')
  assert.deepEqual(runtime.moduleReviews[0]?.missingFields, [])
  assert.equal(runtime.rulesValidated, false)
  assert.equal(runtime.machineReady, false)
  assert.equal(runtime.productionApproved, false)
})

test('Corpus 16 refuses Human Confirm when a required field is missing', () => {
  const runtime = createFacadeFlowOfferCompletenessReviewRuntime('Оферта за Клиент, система PRELUDE 60, цвят RAL 7016, двоен стъклопакет, обков ROTO NX | Модул 1, 2 броя, каса 1500 x 1400 mm | Потвърди Модул 1')
  assert.equal(runtime.moduleReviews[0]?.status, 'INCOMPLETE')
  assert.deepEqual(runtime.moduleReviews[0]?.missingFields, ['openingDisposition'])
  assert.equal(runtime.lastCommandStatus, 'REVIEW_REQUIRED')
  assert.equal(runtime.summary.confirmedModules, 0)
})

test('Corpus 16 Human Confirm is invalidated when the confirmed module changes', () => {
  let runtime = createFacadeFlowOfferCompletenessReviewRuntime('Оферта за Клиент, система PRELUDE 60, цвят RAL 7016, двоен стъклопакет, обков ROTO NX | Модул 1, 2 броя, каса 1500 x 1400 mm, фикс | Потвърди Модул 1')
  assert.equal(runtime.moduleReviews[0]?.status, 'HUMAN_CONFIRMED')
  runtime = applyFacadeFlowOfferCompletenessReviewCommand(runtime, 'Модул 1 да стане 5 бр.')
  assert.equal(runtime.moduleReviews[0]?.status, 'READY_FOR_HUMAN_REVIEW')
  assert.deepEqual(runtime.events.at(-1)?.invalidatedConfirmations, [1])
})

test('Corpus 16 ambiguous no-mutation command does not erase a valid Human Confirm', () => {
  let runtime = createFacadeFlowOfferCompletenessReviewRuntime('Оферта за Клиент, система PRELUDE 60, цвят RAL 7016, двоен стъклопакет, обков ROTO NX | Модул 1, 2 броя, каса 1500 x 1400 mm, фикс | Потвърди Модул 1')
  const beforeKey = runtime.moduleReviews[0]?.stateKey
  runtime = applyFacadeFlowOfferCompletenessReviewCommand(runtime, 'Направи го 5 броя')
  assert.equal(runtime.lastCommandStatus, 'REVIEW_REQUIRED')
  assert.equal(runtime.moduleReviews[0]?.stateKey, beforeKey)
  assert.equal(runtime.moduleReviews[0]?.status, 'HUMAN_CONFIRMED')
})

test('Corpus 16 offer-wide revision invalidates only modules whose effective reviewed state changed', () => {
  let runtime = createFacadeFlowOfferCompletenessReviewRuntime('Оферта за Клиент, система PRELUDE 60, цвят RAL 7016, двоен стъклопакет, обков ROTO NX | Модул 1, 2 броя, каса 1500 x 1400 mm, фикс | Модул 2, 3 броя, каса 900 x 2100 mm, фикс | Модул 2, цвят RAL 9016 | Потвърди всички готови модули')
  assert.equal(runtime.summary.confirmedModules, 2)
  runtime = applyFacadeFlowOfferCompletenessReviewCommand(runtime, 'За цялата оферта цветът да е RAL 9005')
  assert.equal(runtime.moduleReviews.find((entry) => entry.moduleNumber === 1)?.status, 'READY_FOR_HUMAN_REVIEW')
  assert.equal(runtime.moduleReviews.find((entry) => entry.moduleNumber === 2)?.status, 'HUMAN_CONFIRMED')
  assert.deepEqual(runtime.events.at(-1)?.invalidatedConfirmations, [1])
})
