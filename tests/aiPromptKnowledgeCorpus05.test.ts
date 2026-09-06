import assert from 'node:assert/strict'
import test from 'node:test'
import { interpretFacadeFlowOfferPrompt } from '../src/aiPromptOfferInterpreter'
import {
  AI_PROMPT_KNOWLEDGE_CORPUS_05,
  AI_PROMPT_KNOWLEDGE_CORPUS_05_EXPECTED_COUNTS,
  type AiPromptKnowledgeCorpus05Case,
} from '../src/aiPromptKnowledgeCorpus05'

function foldedIncludes(value: string | undefined, expected: string) {
  return (value ?? '').toLocaleLowerCase('bg').includes(expected.toLocaleLowerCase('bg'))
}

function sameSet(actual: string[], expected: string[]) {
  assert.deepEqual([...actual].sort(), [...expected].sort())
}

function evaluate(item: AiPromptKnowledgeCorpus05Case) {
  const result = interpretFacadeFlowOfferPrompt(item.prompt, item.id)
  const failures: string[] = []

  if (result.offerReference !== item.offerReference) failures.push(`offerReference=${result.offerReference} expected ${item.offerReference}`)
  if (result.customerName !== item.customerName) failures.push(`customerName=${result.customerName} expected ${item.customerName}`)
  if (result.modules.length !== item.expectedModules.length) failures.push(`modules=${result.modules.length} expected ${item.expectedModules.length}`)
  if (result.unresolvedOfferReferences.length !== item.unresolvedOfferReferenceCount) failures.push(`unresolvedOfferReferences=${result.unresolvedOfferReferences.length} expected ${item.unresolvedOfferReferenceCount}`)
  if (result.defaults.correctionsApplied.length !== item.offerCorrectionCount) failures.push(`offerCorrections=${result.defaults.correctionsApplied.length} expected ${item.offerCorrectionCount}`)

  for (const expected of item.expectedModules) {
    const actual = result.modules.find((candidate) => candidate.moduleNumber === expected.moduleNumber)
    if (!actual) {
      failures.push(`module ${expected.moduleNumber} missing`)
      continue
    }
    const intent = actual.effectiveInterpretation.intent
    if (intent.category !== expected.category) failures.push(`module ${expected.moduleNumber} category=${intent.category} expected ${expected.category}`)
    if (intent.mark !== expected.mark) failures.push(`module ${expected.moduleNumber} mark=${intent.mark} expected ${expected.mark}`)
    if (intent.dimensions.widthMm !== expected.widthMm) failures.push(`module ${expected.moduleNumber} width=${intent.dimensions.widthMm} expected ${expected.widthMm}`)
    if (intent.dimensions.heightMm !== expected.heightMm) failures.push(`module ${expected.moduleNumber} height=${intent.dimensions.heightMm} expected ${expected.heightMm}`)
    if (!foldedIncludes(intent.profiles.system, expected.systemIncludes)) failures.push(`module ${expected.moduleNumber} system=${intent.profiles.system} missing ${expected.systemIncludes}`)
    if (!foldedIncludes(intent.finish.exterior, expected.finishIncludes)) failures.push(`module ${expected.moduleNumber} finish=${intent.finish.exterior} missing ${expected.finishIncludes}`)
    if (!foldedIncludes(intent.glazing.description, expected.glazingIncludes)) failures.push(`module ${expected.moduleNumber} glazing=${intent.glazing.description} missing ${expected.glazingIncludes}`)
    if (!foldedIncludes(intent.hardwareDefaults.mechanism, expected.hardwareIncludes)) failures.push(`module ${expected.moduleNumber} hardware=${intent.hardwareDefaults.mechanism} missing ${expected.hardwareIncludes}`)
    if ([...actual.inheritedFields].sort().join('|') !== [...expected.inheritedFields].sort().join('|')) failures.push(`module ${expected.moduleNumber} inherited=${actual.inheritedFields.join(',')} expected ${expected.inheritedFields.join(',')}`)
    if ([...actual.explicitOverrideFields].sort().join('|') !== [...expected.explicitOverrideFields].sort().join('|')) failures.push(`module ${expected.moduleNumber} overrides=${actual.explicitOverrideFields.join(',')} expected ${expected.explicitOverrideFields.join(',')}`)
    if (actual.correctionsApplied.length !== expected.correctionCount) failures.push(`module ${expected.moduleNumber} corrections=${actual.correctionsApplied.length} expected ${expected.correctionCount}`)
    if (actual.effectiveInterpretation.machineReady !== false || actual.effectiveInterpretation.productionApproved !== false) failures.push(`module ${expected.moduleNumber} escaped safety boundary`)
  }

  if (result.humanReviewRequired !== true) failures.push('humanReviewRequired must stay true')
  if (result.rulesValidated !== false) failures.push('rulesValidated must stay false')
  if (result.automaticGeometryAllowed !== false) failures.push('automaticGeometryAllowed must stay false')
  if (result.simulationOnly !== true) failures.push('simulationOnly must stay true')
  if (result.machineReady !== false) failures.push('machineReady must stay false')
  if (result.productionApproved !== false) failures.push('productionApproved must stay false')

  return failures
}

test('AI PROMPT KNOWLEDGE CORPUS 05 contains exactly 200 unique prompts split 50/50/50/50', () => {
  assert.equal(AI_PROMPT_KNOWLEDGE_CORPUS_05.length, AI_PROMPT_KNOWLEDGE_CORPUS_05_EXPECTED_COUNTS.TOTAL)
  assert.equal(new Set(AI_PROMPT_KNOWLEDGE_CORPUS_05.map((item) => item.id)).size, AI_PROMPT_KNOWLEDGE_CORPUS_05.length)
  assert.equal(new Set(AI_PROMPT_KNOWLEDGE_CORPUS_05.map((item) => item.prompt)).size, AI_PROMPT_KNOWLEDGE_CORPUS_05.length)
  for (const track of ['OFFER_DEFAULTS_INHERITANCE', 'MODULE_LOCAL_OVERRIDE', 'OFFER_DEFAULT_REVISION', 'AMBIGUOUS_SCOPE_SAFETY'] as const) {
    assert.equal(AI_PROMPT_KNOWLEDGE_CORPUS_05.filter((item) => item.track === track).length, AI_PROMPT_KNOWLEDGE_CORPUS_05_EXPECTED_COUNTS[track])
  }
})

test('AI PROMPT KNOWLEDGE CORPUS 05 evaluates all 200 offer/module prompts without production authority', () => {
  const failures = AI_PROMPT_KNOWLEDGE_CORPUS_05.flatMap((item) => evaluate(item).map((failure) => `${item.id}: ${failure}\n  ${item.prompt}`))
  assert.deepEqual(failures, [], failures.join('\n'))
})

test('Corpus 05 offer defaults inherit into every module when the module has no explicit override', () => {
  const cases = AI_PROMPT_KNOWLEDGE_CORPUS_05.filter((item) => item.track === 'OFFER_DEFAULTS_INHERITANCE')
  assert.equal(cases.length, 50)
  for (const item of cases) {
    const result = interpretFacadeFlowOfferPrompt(item.prompt, `${item.id}-defaults`)
    for (const module of result.modules) {
      sameSet(module.inheritedFields, ['system', 'finish', 'glazing', 'hardware'])
      assert.deepEqual(module.explicitOverrideFields, [], item.id)
    }
  }
})

test('Corpus 05 module-local overrides never leak into sibling modules', () => {
  const cases = AI_PROMPT_KNOWLEDGE_CORPUS_05.filter((item) => item.track === 'MODULE_LOCAL_OVERRIDE')
  assert.equal(cases.length, 50)
  for (const item of cases) {
    const result = interpretFacadeFlowOfferPrompt(item.prompt, `${item.id}-override`)
    assert.ok(result.modules[0]?.effectiveInterpretation.intent.finish.exterior?.includes('7016'), item.id)
    assert.ok(result.modules[1]?.effectiveInterpretation.intent.finish.exterior?.includes('9016'), item.id)
    assert.ok(result.modules[2]?.effectiveInterpretation.intent.finish.exterior?.includes('7016'), item.id)
    assert.ok(result.modules[1]?.effectiveInterpretation.intent.hardwareDefaults.mechanism?.includes('HW-B'), item.id)
    assert.ok(result.modules[0]?.effectiveInterpretation.intent.hardwareDefaults.mechanism?.includes('HW-A'), item.id)
    assert.ok(result.modules[2]?.effectiveInterpretation.intent.hardwareDefaults.mechanism?.includes('HW-A'), item.id)
  }
})

test('Corpus 05 offer-wide default revisions preserve explicit module overrides', () => {
  const cases = AI_PROMPT_KNOWLEDGE_CORPUS_05.filter((item) => item.track === 'OFFER_DEFAULT_REVISION')
  assert.equal(cases.length, 50)
  for (const item of cases) {
    const result = interpretFacadeFlowOfferPrompt(item.prompt, `${item.id}-revision`)
    assert.equal(result.defaults.correctionsApplied.length, 1, item.id)
    assert.equal(result.unresolvedOfferReferences.length, 0, item.id)
    const expectedMiddle = item.expectedModules[1]
    const actualMiddle = result.modules[1]
    assert.ok(foldedIncludes(actualMiddle?.effectiveInterpretation.intent.finish.exterior, expectedMiddle.finishIncludes), item.id)
    assert.ok(foldedIncludes(actualMiddle?.effectiveInterpretation.intent.glazing.description, expectedMiddle.glazingIncludes), item.id)
    assert.ok(foldedIncludes(actualMiddle?.effectiveInterpretation.intent.hardwareDefaults.mechanism, expectedMiddle.hardwareIncludes), item.id)
  }
})

test('Corpus 05 corrections with no offer/module scope never guess where to apply', () => {
  const cases = AI_PROMPT_KNOWLEDGE_CORPUS_05.filter((item) => item.track === 'AMBIGUOUS_SCOPE_SAFETY')
  assert.equal(cases.length, 50)
  for (const item of cases) {
    const result = interpretFacadeFlowOfferPrompt(item.prompt, `${item.id}-ambiguous`)
    assert.equal(result.unresolvedOfferReferences.length, 1, item.id)
    assert.ok(result.unresolvedOfferReferences[0]?.includes('Нееднозначна корекция'), item.id)
    assert.equal(result.defaults.correctionsApplied.length, 0, item.id)
    assert.deepEqual(result.modules.map((module) => module.correctionsApplied.length), [0, 0, 0], item.id)
  }
})
