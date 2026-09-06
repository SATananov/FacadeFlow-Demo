import assert from 'node:assert/strict'
import test from 'node:test'
import { interpretFacadeFlowPrompt } from '../src/aiPromptInterpreter'
import {
  AI_PROMPT_KNOWLEDGE_CORPUS_02,
  AI_PROMPT_KNOWLEDGE_CORPUS_02_EXPECTED_COUNTS,
  type AiPromptKnowledgeCorpus02Case,
} from '../src/aiPromptKnowledgeCorpus02'

function includesFolded(value: string | undefined, expected: string) {
  return (value ?? '').toLocaleLowerCase('bg').includes(expected.toLocaleLowerCase('bg'))
}

function evaluateCase(item: AiPromptKnowledgeCorpus02Case) {
  const result = interpretFacadeFlowPrompt(item.prompt, item.id)
  const failures: string[] = []
  const expected = item.expected

  if (expected.category !== undefined && result.intent.category !== expected.category) failures.push(`category=${result.intent.category} expected ${expected.category}`)
  if (expected.widthMm !== undefined && result.intent.dimensions.widthMm !== expected.widthMm) failures.push(`width=${result.intent.dimensions.widthMm} expected ${expected.widthMm}`)
  if (expected.heightMm !== undefined && result.intent.dimensions.heightMm !== expected.heightMm) failures.push(`height=${result.intent.dimensions.heightMm} expected ${expected.heightMm}`)
  if (expected.fieldCount !== undefined && result.intent.fields.length !== expected.fieldCount) failures.push(`fields=${result.intent.fields.length} expected ${expected.fieldCount}`)
  if (expected.profileSystemIncludes !== undefined && !includesFolded(result.intent.profiles.system, expected.profileSystemIncludes)) failures.push(`system=${result.intent.profiles.system} missing ${expected.profileSystemIncludes}`)
  if (expected.frameProfile !== undefined && result.intent.profiles.frame !== expected.frameProfile) failures.push(`frame=${result.intent.profiles.frame} expected ${expected.frameProfile}`)
  if (expected.sashProfile !== undefined && result.intent.profiles.sash !== expected.sashProfile) failures.push(`sash=${result.intent.profiles.sash} expected ${expected.sashProfile}`)
  if (expected.mullionProfile !== undefined && result.intent.profiles.mullion !== expected.mullionProfile) failures.push(`mullion=${result.intent.profiles.mullion} expected ${expected.mullionProfile}`)
  if (expected.frameProfileAbsent && result.intent.profiles.frame !== undefined) failures.push(`frame=${result.intent.profiles.frame} expected unresolved conflict`)
  if (expected.sashProfileAbsent && result.intent.profiles.sash !== undefined) failures.push(`sash=${result.intent.profiles.sash} expected unresolved conflict`)
  if (expected.mullionProfileAbsent && result.intent.profiles.mullion !== undefined) failures.push(`mullion=${result.intent.profiles.mullion} expected unresolved conflict`)
  if (expected.finishIncludes !== undefined && !includesFolded(result.intent.finish.exterior, expected.finishIncludes)) failures.push(`finish=${result.intent.finish.exterior} missing ${expected.finishIncludes}`)
  if (expected.glazingIncludes !== undefined && !includesFolded(result.intent.glazing.description, expected.glazingIncludes)) failures.push(`glazing=${result.intent.glazing.description} missing ${expected.glazingIncludes}`)
  if (expected.handleIncludes !== undefined && !includesFolded(result.intent.hardwareDefaults.handle, expected.handleIncludes)) failures.push(`handle=${result.intent.hardwareDefaults.handle} missing ${expected.handleIncludes}`)
  if (expected.hingeQuantity !== undefined && result.intent.hardwareDefaults.hingeQuantity !== expected.hingeQuantity) failures.push(`hinges=${result.intent.hardwareDefaults.hingeQuantity} expected ${expected.hingeQuantity}`)
  if (expected.hingesIncludes !== undefined && !includesFolded(result.intent.hardwareDefaults.hinges, expected.hingesIncludes)) failures.push(`hinge type=${result.intent.hardwareDefaults.hinges} missing ${expected.hingesIncludes}`)
  if (expected.handleHeightMm !== undefined && result.intent.hardwareDefaults.handleHeightMm !== expected.handleHeightMm) failures.push(`handleHeight=${result.intent.hardwareDefaults.handleHeightMm} expected ${expected.handleHeightMm}`)
  if (expected.hardwareMechanismIncludes !== undefined && !includesFolded(result.intent.hardwareDefaults.mechanism, expected.hardwareMechanismIncludes)) failures.push(`mechanism=${result.intent.hardwareDefaults.mechanism} missing ${expected.hardwareMechanismIncludes}`)
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
  for (const warningExpected of expected.warningsIncludes ?? []) {
    if (!result.warnings.some((value) => includesFolded(value, warningExpected))) failures.push(`warning missing: ${warningExpected}`)
  }

  if (result.humanReviewRequired !== true) failures.push('humanReviewRequired must stay true')
  if (result.rulesValidated !== false) failures.push('rulesValidated must stay false')
  if (result.automaticGeometryAllowed !== false) failures.push('automaticGeometryAllowed must stay false')
  if (result.simulationOnly !== true) failures.push('simulationOnly must stay true')
  if (result.machineReady !== false) failures.push('machineReady must stay false')
  if (result.productionApproved !== false) failures.push('productionApproved must stay false')

  return failures
}

test('AI PROMPT KNOWLEDGE CORPUS 02 contains exactly 200 unique prompts split 50/50/50/50', () => {
  assert.equal(AI_PROMPT_KNOWLEDGE_CORPUS_02.length, AI_PROMPT_KNOWLEDGE_CORPUS_02_EXPECTED_COUNTS.TOTAL)
  assert.equal(new Set(AI_PROMPT_KNOWLEDGE_CORPUS_02.map((item) => item.id)).size, AI_PROMPT_KNOWLEDGE_CORPUS_02.length)
  assert.equal(new Set(AI_PROMPT_KNOWLEDGE_CORPUS_02.map((item) => item.prompt)).size, AI_PROMPT_KNOWLEDGE_CORPUS_02.length)
  for (const track of ['PROFILE_ROLES', 'PROFILE_TOPOLOGY', 'MATERIAL_HARDWARE', 'REVIEW_BOUNDARY'] as const) {
    assert.equal(AI_PROMPT_KNOWLEDGE_CORPUS_02.filter((item) => item.track === track).length, AI_PROMPT_KNOWLEDGE_CORPUS_02_EXPECTED_COUNTS[track])
  }
})

test('AI PROMPT KNOWLEDGE CORPUS 02 evaluates all 200 prompts without production authority', () => {
  const failures = AI_PROMPT_KNOWLEDGE_CORPUS_02.flatMap((item) => evaluateCase(item).map((failure) => `${item.id}: ${failure}\n  ${item.prompt}`))
  assert.deepEqual(failures, [], failures.join('\n'))
})

test('AI PROMPT KNOWLEDGE CORPUS 02 refuses silent profile-role conflict resolution', () => {
  const conflictCases = AI_PROMPT_KNOWLEDGE_CORPUS_02.filter((item) => item.tags.includes('profile-conflict'))
  assert.equal(conflictCases.length, 20)
  for (const item of conflictCases) {
    const result = interpretFacadeFlowPrompt(item.prompt, `${item.id}-conflict-check`)
    assert.ok(result.unresolved.some((value) => /Конфликт за профил/i.test(value)))
    assert.ok(result.warnings.some((value) => /противоречиви профилни референции/i.test(value)))
    assert.equal(result.rulesValidated, false)
    assert.equal(result.machineReady, false)
  }
})

test('AI PROMPT KNOWLEDGE CORPUS 02 keeps explicit unknown profile references as evidence, never as catalogue validation', () => {
  const unknownCases = AI_PROMPT_KNOWLEDGE_CORPUS_02.filter((item) => item.tags.includes('unknown-explicit-profile'))
  assert.equal(unknownCases.length, 10)
  for (const item of unknownCases) {
    const result = interpretFacadeFlowPrompt(item.prompt, `${item.id}-unknown-check`)
    assert.equal(result.intent.profiles.frame, item.expected.frameProfile)
    assert.equal(result.rulesValidated, false)
    assert.equal(result.automaticGeometryAllowed, false)
    assert.equal(result.machineReady, false)
    assert.equal(result.productionApproved, false)
  }
})
