import assert from 'node:assert/strict'
import test from 'node:test'
import { interpretFacadeFlowProjectPrompt } from '../src/aiPromptProjectInterpreter'
import {
  AI_PROMPT_KNOWLEDGE_CORPUS_06,
  AI_PROMPT_KNOWLEDGE_CORPUS_06_EXPECTED_COUNTS,
  type AiPromptKnowledgeCorpus06Case,
} from '../src/aiPromptKnowledgeCorpus06'

function foldedIncludes(value: string | undefined, expected: string) {
  return (value ?? '').toLocaleLowerCase('bg').includes(expected.toLocaleLowerCase('bg'))
}

function evaluate(item: AiPromptKnowledgeCorpus06Case) {
  const result = interpretFacadeFlowProjectPrompt(item.prompt, item.id)
  const failures: string[] = []

  if (result.projectReference !== item.projectReference) failures.push(`projectReference=${result.projectReference} expected ${item.projectReference}`)
  if (result.offer.offerReference !== item.offerReference) failures.push(`offerReference=${result.offer.offerReference} expected ${item.offerReference}`)
  if (result.offer.customerName !== item.customerName) failures.push(`customerName=${result.offer.customerName} expected ${item.customerName}`)
  if (result.modules.length !== item.expectedModules.length) failures.push(`modules=${result.modules.length} expected ${item.expectedModules.length}`)
  if (result.unresolvedProjectReferences.length !== item.unresolvedProjectReferenceCount) failures.push(`unresolvedProjectReferences=${result.unresolvedProjectReferences.length} expected ${item.unresolvedProjectReferenceCount}`)

  for (const expected of item.expectedModules) {
    const actual = result.modules.find((candidate) => candidate.moduleNumber === expected.moduleNumber)
    if (!actual) {
      failures.push(`module ${expected.moduleNumber} missing`)
      continue
    }
    if (actual.floor !== expected.floor) failures.push(`module ${expected.moduleNumber} floor=${actual.floor} expected ${expected.floor}`)
    if (actual.room !== expected.room) failures.push(`module ${expected.moduleNumber} room=${actual.room} expected ${expected.room}`)
    if (actual.mark !== expected.mark) failures.push(`module ${expected.moduleNumber} contextMark=${actual.mark} expected ${expected.mark}`)
    if (actual.contextualCorrectionsApplied.length !== expected.contextualCorrectionCount) failures.push(`module ${expected.moduleNumber} contextualCorrections=${actual.contextualCorrectionsApplied.length} expected ${expected.contextualCorrectionCount}`)

    const intent = actual.offerModule.effectiveInterpretation.intent
    if (intent.category !== expected.category) failures.push(`module ${expected.moduleNumber} category=${intent.category} expected ${expected.category}`)
    if (intent.mark !== expected.mark) failures.push(`module ${expected.moduleNumber} parsedMark=${intent.mark} expected ${expected.mark}`)
    if (!foldedIncludes(intent.finish.exterior, expected.finishIncludes)) failures.push(`module ${expected.moduleNumber} finish=${intent.finish.exterior} missing ${expected.finishIncludes}`)
    if (!foldedIncludes(intent.hardwareDefaults.mechanism, expected.hardwareIncludes)) failures.push(`module ${expected.moduleNumber} hardware=${intent.hardwareDefaults.mechanism} missing ${expected.hardwareIncludes}`)
    if (actual.offerModule.effectiveInterpretation.machineReady !== false || actual.offerModule.effectiveInterpretation.productionApproved !== false) failures.push(`module ${expected.moduleNumber} escaped safety boundary`)
  }

  if (result.humanReviewRequired !== true) failures.push('humanReviewRequired must stay true')
  if (result.rulesValidated !== false) failures.push('rulesValidated must stay false')
  if (result.automaticGeometryAllowed !== false) failures.push('automaticGeometryAllowed must stay false')
  if (result.simulationOnly !== true) failures.push('simulationOnly must stay true')
  if (result.machineReady !== false) failures.push('machineReady must stay false')
  if (result.productionApproved !== false) failures.push('productionApproved must stay false')

  return failures
}

test('AI PROMPT KNOWLEDGE CORPUS 06 contains exactly 200 unique prompts split 50/50/50/50', () => {
  assert.equal(AI_PROMPT_KNOWLEDGE_CORPUS_06.length, AI_PROMPT_KNOWLEDGE_CORPUS_06_EXPECTED_COUNTS.TOTAL)
  assert.equal(new Set(AI_PROMPT_KNOWLEDGE_CORPUS_06.map((item) => item.id)).size, AI_PROMPT_KNOWLEDGE_CORPUS_06.length)
  assert.equal(new Set(AI_PROMPT_KNOWLEDGE_CORPUS_06.map((item) => item.prompt)).size, AI_PROMPT_KNOWLEDGE_CORPUS_06.length)
  for (const track of ['PROJECT_CONTEXT_INHERITANCE', 'EXACT_CONTEXT_OVERRIDE', 'FLOOR_GROUP_SCOPE', 'AMBIGUOUS_CONTEXT_SAFETY'] as const) {
    assert.equal(AI_PROMPT_KNOWLEDGE_CORPUS_06.filter((item) => item.track === track).length, AI_PROMPT_KNOWLEDGE_CORPUS_06_EXPECTED_COUNTS[track])
  }
})

test('AI PROMPT KNOWLEDGE CORPUS 06 evaluates all 200 project-context prompts without production authority', () => {
  const failures = AI_PROMPT_KNOWLEDGE_CORPUS_06.flatMap((item) => evaluate(item).map((failure) => `${item.id}: ${failure}\n  ${item.prompt}`))
  assert.deepEqual(failures, [], failures.join('\n'))
})

test('Corpus 06 preserves Offer defaults through Project / Floor / Room / Mark context', () => {
  const cases = AI_PROMPT_KNOWLEDGE_CORPUS_06.filter((item) => item.track === 'PROJECT_CONTEXT_INHERITANCE')
  assert.equal(cases.length, 50)
  for (const item of cases) {
    const result = interpretFacadeFlowProjectPrompt(item.prompt, `${item.id}-inheritance`)
    assert.equal(result.unresolvedProjectReferences.length, 0, item.id)
    assert.ok(result.modules.every((module) => module.offerModule.inheritedFields.includes('finish')), item.id)
    assert.ok(result.modules.every((module) => module.offerModule.inheritedFields.includes('hardware')), item.id)
  }
})

test('Corpus 06 exact floor/room/mark overrides never leak to sibling modules', () => {
  const cases = AI_PROMPT_KNOWLEDGE_CORPUS_06.filter((item) => item.track === 'EXACT_CONTEXT_OVERRIDE')
  assert.equal(cases.length, 50)
  for (const item of cases) {
    const result = interpretFacadeFlowProjectPrompt(item.prompt, `${item.id}-exact`)
    assert.ok(result.modules[2]?.offerModule.effectiveInterpretation.intent.finish.exterior?.includes('9016'), item.id)
    assert.ok(result.modules[0]?.offerModule.effectiveInterpretation.intent.finish.exterior?.includes('7016'), item.id)
    assert.ok(result.modules[1]?.offerModule.effectiveInterpretation.intent.finish.exterior?.includes('7016'), item.id)
    assert.ok(result.modules[3]?.offerModule.effectiveInterpretation.intent.finish.exterior?.includes('7016'), item.id)
  }
})

test('Corpus 06 explicit all-modules floor scope changes only that floor', () => {
  const cases = AI_PROMPT_KNOWLEDGE_CORPUS_06.filter((item) => item.track === 'FLOOR_GROUP_SCOPE')
  assert.equal(cases.length, 50)
  for (const item of cases) {
    const result = interpretFacadeFlowProjectPrompt(item.prompt, `${item.id}-floor`)
    const floor1 = result.modules.filter((module) => module.floor === '1')
    const floor2 = result.modules.filter((module) => module.floor === '2')
    assert.ok(floor1.every((module) => module.offerModule.effectiveInterpretation.intent.hardwareDefaults.mechanism?.includes('HW-A')), item.id)
    assert.ok(floor2.every((module) => module.offerModule.effectiveInterpretation.intent.hardwareDefaults.mechanism?.includes('HW-B')), item.id)
  }
})

test('Corpus 06 ambiguous room-only corrections across floors never guess a target', () => {
  const cases = AI_PROMPT_KNOWLEDGE_CORPUS_06.filter((item) => item.track === 'AMBIGUOUS_CONTEXT_SAFETY')
  assert.equal(cases.length, 50)
  for (const item of cases) {
    const result = interpretFacadeFlowProjectPrompt(item.prompt, `${item.id}-ambiguous`)
    assert.equal(result.unresolvedProjectReferences.length, 1, item.id)
    assert.ok(result.unresolvedProjectReferences[0]?.includes('повече от един модул'), item.id)
    assert.ok(result.modules.every((module) => module.contextualCorrectionsApplied.length === 0), item.id)
    assert.ok(result.modules.every((module) => module.offerModule.effectiveInterpretation.intent.finish.exterior?.includes('7016')), item.id)
  }
})
