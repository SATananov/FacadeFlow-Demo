import assert from 'node:assert/strict'
import test from 'node:test'
import { interpretFacadeFlowPrompt } from '../src/aiPromptInterpreter'
import {
  AI_PROMPT_KNOWLEDGE_CORPUS_01,
  AI_PROMPT_KNOWLEDGE_CORPUS_01_EXPECTED_COUNTS,
  type AiPromptKnowledgeCorpus01Case,
} from '../src/aiPromptKnowledgeCorpus01'

function includesFolded(value: string | undefined, expected: string) {
  return (value ?? '').toLocaleLowerCase('bg').includes(expected.toLocaleLowerCase('bg'))
}

function evaluateCase(item: AiPromptKnowledgeCorpus01Case) {
  const result = interpretFacadeFlowPrompt(item.prompt, item.id)
  const failures: string[] = []
  const expected = item.expected

  if (expected.category !== undefined && result.intent.category !== expected.category) failures.push(`category=${result.intent.category} expected ${expected.category}`)
  if (expected.widthMm !== undefined && result.intent.dimensions.widthMm !== expected.widthMm) failures.push(`width=${result.intent.dimensions.widthMm} expected ${expected.widthMm}`)
  if (expected.heightMm !== undefined && result.intent.dimensions.heightMm !== expected.heightMm) failures.push(`height=${result.intent.dimensions.heightMm} expected ${expected.heightMm}`)
  if (expected.quantity !== undefined && result.intent.quantity !== expected.quantity) failures.push(`quantity=${result.intent.quantity} expected ${expected.quantity}`)
  if (expected.fieldCount !== undefined && result.intent.fields.length !== expected.fieldCount) failures.push(`fields=${result.intent.fields.length} expected ${expected.fieldCount}`)
  if (expected.profileSystemIncludes !== undefined && !includesFolded(result.intent.profiles.system, expected.profileSystemIncludes)) failures.push(`system=${result.intent.profiles.system} missing ${expected.profileSystemIncludes}`)
  if (expected.frameProfile !== undefined && result.intent.profiles.frame !== expected.frameProfile) failures.push(`frame=${result.intent.profiles.frame} expected ${expected.frameProfile}`)
  if (expected.sashProfile !== undefined && result.intent.profiles.sash !== expected.sashProfile) failures.push(`sash=${result.intent.profiles.sash} expected ${expected.sashProfile}`)
  if (expected.mullionProfile !== undefined && result.intent.profiles.mullion !== expected.mullionProfile) failures.push(`mullion=${result.intent.profiles.mullion} expected ${expected.mullionProfile}`)
  if (expected.finishIncludes !== undefined && !includesFolded(result.intent.finish.exterior, expected.finishIncludes)) failures.push(`finish=${result.intent.finish.exterior} missing ${expected.finishIncludes}`)
  if (expected.glazingIncludes !== undefined && !includesFolded(result.intent.glazing.description, expected.glazingIncludes)) failures.push(`glazing=${result.intent.glazing.description} missing ${expected.glazingIncludes}`)
  if (expected.hingeQuantity !== undefined && result.intent.hardwareDefaults.hingeQuantity !== expected.hingeQuantity) failures.push(`hinges=${result.intent.hardwareDefaults.hingeQuantity} expected ${expected.hingeQuantity}`)
  if (expected.dimensionsUnresolved && (result.intent.dimensions.widthMm !== undefined || result.intent.dimensions.heightMm !== undefined)) failures.push('ambiguous dimensions were accepted instead of remaining unresolved')

  for (const fieldExpected of expected.fields ?? []) {
    const field = result.intent.fields[fieldExpected.index]
    if (!field) {
      failures.push(`field ${fieldExpected.index + 1} missing`)
      continue
    }
    if (fieldExpected.role !== undefined && field.role !== fieldExpected.role) failures.push(`field ${fieldExpected.index + 1} role=${field.role} expected ${fieldExpected.role}`)
    if (fieldExpected.openingType !== undefined && field.openingType !== fieldExpected.openingType) failures.push(`field ${fieldExpected.index + 1} opening=${field.openingType} expected ${fieldExpected.openingType}`)
    if (fieldExpected.openingDirection !== undefined && field.openingDirection !== fieldExpected.openingDirection) failures.push(`field ${fieldExpected.index + 1} direction=${field.openingDirection} expected ${fieldExpected.openingDirection}`)
    if (fieldExpected.lowerPanelHeightMm !== undefined && field.lowerPanel?.heightMm !== fieldExpected.lowerPanelHeightMm) failures.push(`field ${fieldExpected.index + 1} lowerPanel=${field.lowerPanel?.heightMm} expected ${fieldExpected.lowerPanelHeightMm}`)
  }

  for (const unresolvedExpected of expected.unresolvedIncludes ?? []) {
    if (!result.unresolved.some((value) => includesFolded(value, unresolvedExpected))) failures.push(`unresolved missing: ${unresolvedExpected}`)
  }

  if (result.humanReviewRequired !== true) failures.push('humanReviewRequired must stay true')
  if (result.rulesValidated !== false) failures.push('rulesValidated must stay false')
  if (result.automaticGeometryAllowed !== false) failures.push('automaticGeometryAllowed must stay false')
  if (result.simulationOnly !== true) failures.push('simulationOnly must stay true')
  if (result.machineReady !== false) failures.push('machineReady must stay false')
  if (result.productionApproved !== false) failures.push('productionApproved must stay false')

  return failures
}

test('AI PROMPT KNOWLEDGE CORPUS 01 contains exactly 200 unique prompts split 50/50/50/50', () => {
  assert.equal(AI_PROMPT_KNOWLEDGE_CORPUS_01.length, AI_PROMPT_KNOWLEDGE_CORPUS_01_EXPECTED_COUNTS.TOTAL)
  assert.equal(new Set(AI_PROMPT_KNOWLEDGE_CORPUS_01.map((item) => item.id)).size, AI_PROMPT_KNOWLEDGE_CORPUS_01.length)
  assert.equal(new Set(AI_PROMPT_KNOWLEDGE_CORPUS_01.map((item) => item.prompt)).size, AI_PROMPT_KNOWLEDGE_CORPUS_01.length)
  for (const style of ['CONVERSATIONAL', 'TECHNICAL', 'MIXED', 'INCOMPLETE'] as const) {
    assert.equal(AI_PROMPT_KNOWLEDGE_CORPUS_01.filter((item) => item.style === style).length, AI_PROMPT_KNOWLEDGE_CORPUS_01_EXPECTED_COUNTS[style])
  }
})

test('AI PROMPT KNOWLEDGE CORPUS 01 evaluates all 200 prompts without production authority', () => {
  const failures = AI_PROMPT_KNOWLEDGE_CORPUS_01.flatMap((item) => evaluateCase(item).map((failure) => `${item.id}: ${failure}\n  ${item.prompt}`))
  assert.deepEqual(failures, [], failures.join('\n'))
})

test('AI PROMPT KNOWLEDGE CORPUS 01 locks dimensional ambiguity as unresolved', () => {
  for (const id of ['CP-INC-002', 'CP-INC-003', 'CP-INC-004']) {
    const item = AI_PROMPT_KNOWLEDGE_CORPUS_01.find((candidate) => candidate.id === id)
    assert.ok(item)
    const result = interpretFacadeFlowPrompt(item.prompt, `${id}-safety`)
    assert.equal(result.intent.dimensions.widthMm, undefined)
    assert.equal(result.intent.dimensions.heightMm, undefined)
    assert.ok(result.unresolved.includes('Единици на общите размери'))
    assert.ok(result.warnings.some((warning) => /двусмислени|липсващи единици/i.test(warning)))
  }
})
