import assert from 'node:assert/strict'
import test from 'node:test'
import { interpretFacadeFlowOrderPrompt } from '../src/aiPromptOrderInterpreter'
import {
  AI_PROMPT_KNOWLEDGE_CORPUS_04,
  AI_PROMPT_KNOWLEDGE_CORPUS_04_EXPECTED_COUNTS,
  type AiPromptKnowledgeCorpus04Case,
} from '../src/aiPromptKnowledgeCorpus04'

function foldedIncludes(value: string | undefined, expected: string) {
  return (value ?? '').toLocaleLowerCase('bg').includes(expected.toLocaleLowerCase('bg'))
}

function evaluate(item: AiPromptKnowledgeCorpus04Case) {
  const result = interpretFacadeFlowOrderPrompt(item.prompt, item.id)
  const failures: string[] = []
  if (result.items.length !== item.expectedItems.length) failures.push(`items=${result.items.length} expected ${item.expectedItems.length}`)
  if (result.unresolvedOrderReferences.length !== item.unresolvedOrderReferenceCount) failures.push(`unresolvedOrderReferences=${result.unresolvedOrderReferences.length} expected ${item.unresolvedOrderReferenceCount}`)

  for (const expected of item.expectedItems) {
    const actual = result.items.find((candidate) => candidate.order === expected.order)
    if (!actual) {
      failures.push(`item ${expected.order} missing`)
      continue
    }
    const intent = actual.interpretation.intent
    if (intent.category !== expected.category) failures.push(`item ${expected.order} category=${intent.category} expected ${expected.category}`)
    if (intent.mark !== expected.mark) failures.push(`item ${expected.order} mark=${intent.mark} expected ${expected.mark}`)
    if (intent.quantity !== expected.quantity) failures.push(`item ${expected.order} qty=${intent.quantity} expected ${expected.quantity}`)
    if (intent.dimensions.widthMm !== expected.widthMm) failures.push(`item ${expected.order} width=${intent.dimensions.widthMm} expected ${expected.widthMm}`)
    if (intent.dimensions.heightMm !== expected.heightMm) failures.push(`item ${expected.order} height=${intent.dimensions.heightMm} expected ${expected.heightMm}`)
    if (!foldedIncludes(intent.finish.exterior, expected.finishIncludes)) failures.push(`item ${expected.order} finish=${intent.finish.exterior} missing ${expected.finishIncludes}`)
    if (!foldedIncludes(intent.glazing.description, expected.glazingIncludes)) failures.push(`item ${expected.order} glazing=${intent.glazing.description} missing ${expected.glazingIncludes}`)
    if (expected.correctionCount !== undefined && actual.correctionsApplied.length !== expected.correctionCount) failures.push(`item ${expected.order} corrections=${actual.correctionsApplied.length} expected ${expected.correctionCount}`)
  }

  if (result.humanReviewRequired !== true) failures.push('humanReviewRequired must stay true')
  if (result.rulesValidated !== false) failures.push('rulesValidated must stay false')
  if (result.automaticGeometryAllowed !== false) failures.push('automaticGeometryAllowed must stay false')
  if (result.simulationOnly !== true) failures.push('simulationOnly must stay true')
  if (result.machineReady !== false) failures.push('machineReady must stay false')
  if (result.productionApproved !== false) failures.push('productionApproved must stay false')
  for (const orderItem of result.items) {
    if (orderItem.interpretation.machineReady !== false || orderItem.interpretation.productionApproved !== false) failures.push(`item ${orderItem.order} escaped safety boundary`)
  }
  return failures
}

test('AI PROMPT KNOWLEDGE CORPUS 04 contains exactly 200 unique prompts split 50/50/50/50', () => {
  assert.equal(AI_PROMPT_KNOWLEDGE_CORPUS_04.length, AI_PROMPT_KNOWLEDGE_CORPUS_04_EXPECTED_COUNTS.TOTAL)
  assert.equal(new Set(AI_PROMPT_KNOWLEDGE_CORPUS_04.map((item) => item.id)).size, AI_PROMPT_KNOWLEDGE_CORPUS_04.length)
  assert.equal(new Set(AI_PROMPT_KNOWLEDGE_CORPUS_04.map((item) => item.prompt)).size, AI_PROMPT_KNOWLEDGE_CORPUS_04.length)
  for (const track of ['MULTI_PRODUCT_EXPLICIT', 'ORDINAL_CORRECTION', 'GROUP_REFERENCE_OVERRIDE', 'AMBIGUOUS_REFERENCE_SAFETY'] as const) {
    assert.equal(AI_PROMPT_KNOWLEDGE_CORPUS_04.filter((item) => item.track === track).length, AI_PROMPT_KNOWLEDGE_CORPUS_04_EXPECTED_COUNTS[track])
  }
})

test('AI PROMPT KNOWLEDGE CORPUS 04 evaluates all 200 order prompts without production authority', () => {
  const failures = AI_PROMPT_KNOWLEDGE_CORPUS_04.flatMap((item) => evaluate(item).map((failure) => `${item.id}: ${failure}\n  ${item.prompt}`))
  assert.deepEqual(failures, [], failures.join('\n'))
})

test('Corpus 04 ordinal corrections update only their explicit target', () => {
  const cases = AI_PROMPT_KNOWLEDGE_CORPUS_04.filter((item) => item.track === 'ORDINAL_CORRECTION')
  assert.equal(cases.length, 50)
  for (const item of cases) {
    const result = interpretFacadeFlowOrderPrompt(item.prompt, `${item.id}-ordinal`)
    assert.equal(result.items[0]?.correctionsApplied.length, 0, item.id)
    assert.equal(result.items[1]?.correctionsApplied.length, 1, item.id)
    assert.equal(result.items[2]?.correctionsApplied.length, 0, item.id)
  }
})

test('Corpus 04 group references propagate only across the explicitly bounded group', () => {
  const cases = AI_PROMPT_KNOWLEDGE_CORPUS_04.filter((item) => item.track === 'GROUP_REFERENCE_OVERRIDE')
  assert.equal(cases.length, 50)
  for (const item of cases) {
    const result = interpretFacadeFlowOrderPrompt(item.prompt, `${item.id}-group`)
    assert.deepEqual(result.items.map((entry) => entry.correctionsApplied.length), [0, 0, 1, 1], item.id)
  }
})

test('Corpus 04 ambiguous pronoun corrections never guess a target', () => {
  const cases = AI_PROMPT_KNOWLEDGE_CORPUS_04.filter((item) => item.track === 'AMBIGUOUS_REFERENCE_SAFETY')
  assert.equal(cases.length, 50)
  for (const item of cases) {
    const result = interpretFacadeFlowOrderPrompt(item.prompt, `${item.id}-ambiguous`)
    assert.equal(result.unresolvedOrderReferences.length, 1, item.id)
    assert.ok(result.unresolvedOrderReferences[0]?.includes('Нееднозначна корекция'), item.id)
    assert.deepEqual(result.items.map((entry) => entry.correctionsApplied.length), [0, 0, 0], item.id)
  }
})
