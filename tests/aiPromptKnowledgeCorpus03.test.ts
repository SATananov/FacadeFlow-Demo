import assert from 'node:assert/strict'
import test from 'node:test'
import { interpretFacadeFlowPrompt } from '../src/aiPromptInterpreter'
import {
  AI_PROMPT_KNOWLEDGE_CORPUS_03,
  AI_PROMPT_KNOWLEDGE_CORPUS_03_EXPECTED_COUNTS,
  type AiPromptKnowledgeCorpus03Case,
} from '../src/aiPromptKnowledgeCorpus03'

function includesFolded(value: string | undefined, expected: string) {
  return (value ?? '').toLocaleLowerCase('bg').includes(expected.toLocaleLowerCase('bg'))
}

function evaluateCase(item: AiPromptKnowledgeCorpus03Case) {
  const result = interpretFacadeFlowPrompt(item.prompt, item.id)
  const failures: string[] = []
  const expected = item.expected

  if (expected.category !== undefined && result.intent.category !== expected.category) failures.push(`category=${result.intent.category} expected ${expected.category}`)
  if (expected.mark !== undefined && result.intent.mark !== expected.mark) failures.push(`mark=${result.intent.mark} expected ${expected.mark}`)
  if (expected.quantity !== undefined && result.intent.quantity !== expected.quantity) failures.push(`quantity=${result.intent.quantity} expected ${expected.quantity}`)
  if (expected.widthMm !== undefined && result.intent.dimensions.widthMm !== expected.widthMm) failures.push(`width=${result.intent.dimensions.widthMm} expected ${expected.widthMm}`)
  if (expected.heightMm !== undefined && result.intent.dimensions.heightMm !== expected.heightMm) failures.push(`height=${result.intent.dimensions.heightMm} expected ${expected.heightMm}`)
  if (expected.fieldCount !== undefined && result.intent.fields.length !== expected.fieldCount) failures.push(`fields=${result.intent.fields.length} expected ${expected.fieldCount}`)
  if (expected.profileSystemIncludes !== undefined && !includesFolded(result.intent.profiles.system, expected.profileSystemIncludes)) failures.push(`system=${result.intent.profiles.system} missing ${expected.profileSystemIncludes}`)
  if (expected.frameProfile !== undefined && result.intent.profiles.frame !== expected.frameProfile) failures.push(`frame=${result.intent.profiles.frame} expected ${expected.frameProfile}`)
  if (expected.sashProfile !== undefined && result.intent.profiles.sash !== expected.sashProfile) failures.push(`sash=${result.intent.profiles.sash} expected ${expected.sashProfile}`)
  if (expected.mullionProfile !== undefined && result.intent.profiles.mullion !== expected.mullionProfile) failures.push(`mullion=${result.intent.profiles.mullion} expected ${expected.mullionProfile}`)
  if (expected.thresholdIncludes !== undefined && !includesFolded(result.intent.profiles.threshold, expected.thresholdIncludes)) failures.push(`threshold=${result.intent.profiles.threshold} missing ${expected.thresholdIncludes}`)
  if (expected.finishIncludes !== undefined && !includesFolded(result.intent.finish.exterior, expected.finishIncludes)) failures.push(`finish=${result.intent.finish.exterior} missing ${expected.finishIncludes}`)
  if (expected.glazingIncludes !== undefined && !includesFolded(result.intent.glazing.description, expected.glazingIncludes)) failures.push(`glazing=${result.intent.glazing.description} missing ${expected.glazingIncludes}`)
  if (expected.handleIncludes !== undefined && !includesFolded(result.intent.hardwareDefaults.handle, expected.handleIncludes)) failures.push(`handle=${result.intent.hardwareDefaults.handle} missing ${expected.handleIncludes}`)
  if (expected.hingeQuantity !== undefined && result.intent.hardwareDefaults.hingeQuantity !== expected.hingeQuantity) failures.push(`hinges=${result.intent.hardwareDefaults.hingeQuantity} expected ${expected.hingeQuantity}`)
  if (expected.hingesIncludes !== undefined && !includesFolded(result.intent.hardwareDefaults.hinges, expected.hingesIncludes)) failures.push(`hinge type=${result.intent.hardwareDefaults.hinges} missing ${expected.hingesIncludes}`)
  if (expected.handleHeightMm !== undefined && result.intent.hardwareDefaults.handleHeightMm !== expected.handleHeightMm) failures.push(`handleHeight=${result.intent.hardwareDefaults.handleHeightMm} expected ${expected.handleHeightMm}`)
  if (expected.hardwareMechanismIncludes !== undefined && !includesFolded(result.intent.hardwareDefaults.mechanism, expected.hardwareMechanismIncludes)) failures.push(`mechanism=${result.intent.hardwareDefaults.mechanism} missing ${expected.hardwareMechanismIncludes}`)
  if (expected.dimensionsUnresolved && (result.intent.dimensions.widthMm !== undefined || result.intent.dimensions.heightMm !== undefined)) failures.push('ambiguous dimensions were accepted instead of remaining unresolved')
  if (expected.frameProfileAbsent && result.intent.profiles.frame !== undefined) failures.push(`frame=${result.intent.profiles.frame} expected unresolved conflict`)
  if (expected.finishAbsent && result.intent.finish.exterior !== undefined) failures.push(`finish=${result.intent.finish.exterior} expected unresolved conflict`)
  if (expected.glazingAbsent && result.intent.glazing.description !== undefined) failures.push(`glazing=${result.intent.glazing.description} expected unresolved conflict`)
  if (expected.hingeQuantityAbsent && result.intent.hardwareDefaults.hingeQuantity !== undefined) failures.push(`hinges=${result.intent.hardwareDefaults.hingeQuantity} expected unresolved conflict`)

  for (const fieldExpected of expected.fields ?? []) {
    const field = result.intent.fields[fieldExpected.index]
    if (!field) {
      failures.push(`field ${fieldExpected.index + 1} missing`)
      continue
    }
    if (fieldExpected.role !== undefined && field.role !== fieldExpected.role) failures.push(`field ${fieldExpected.index + 1} role=${field.role} expected ${fieldExpected.role}`)
    if (fieldExpected.openingType !== undefined && field.openingType !== fieldExpected.openingType) failures.push(`field ${fieldExpected.index + 1} opening=${field.openingType} expected ${fieldExpected.openingType}`)
    if (fieldExpected.openingDirection !== undefined && field.openingDirection !== fieldExpected.openingDirection) failures.push(`field ${fieldExpected.index + 1} direction=${field.openingDirection} expected ${fieldExpected.openingDirection}`)
    if (fieldExpected.swing !== undefined && field.swing !== fieldExpected.swing) failures.push(`field ${fieldExpected.index + 1} swing=${field.swing} expected ${fieldExpected.swing}`)
    if (fieldExpected.lowerPanelHeightMm !== undefined && field.lowerPanel?.heightMm !== fieldExpected.lowerPanelHeightMm) failures.push(`field ${fieldExpected.index + 1} lowerPanel=${field.lowerPanel?.heightMm} expected ${fieldExpected.lowerPanelHeightMm}`)
    if (fieldExpected.lowerPanelUpperGlazed && field.lowerPanel?.upperZoneRole !== 'GLAZING') failures.push(`field ${fieldExpected.index + 1} lower panel upper zone=${field.lowerPanel?.upperZoneRole} expected GLAZING`)
  }

  for (const unresolvedExpected of expected.unresolvedIncludes ?? []) {
    if (!result.unresolved.some((value) => includesFolded(value, unresolvedExpected))) failures.push(`unresolved missing: ${unresolvedExpected}`)
  }
  for (const warningExpected of expected.warningsIncludes ?? []) {
    if (!result.warnings.some((value) => includesFolded(value, warningExpected))) failures.push(`warning missing: ${warningExpected}`)
  }
  if (expected.unresolvedCount !== undefined && result.unresolved.length !== expected.unresolvedCount) failures.push(`unresolvedCount=${result.unresolved.length} expected ${expected.unresolvedCount}`)

  if (result.humanReviewRequired !== true) failures.push('humanReviewRequired must stay true')
  if (result.rulesValidated !== false) failures.push('rulesValidated must stay false')
  if (result.automaticGeometryAllowed !== false) failures.push('automaticGeometryAllowed must stay false')
  if (result.simulationOnly !== true) failures.push('simulationOnly must stay true')
  if (result.machineReady !== false) failures.push('machineReady must stay false')
  if (result.productionApproved !== false) failures.push('productionApproved must stay false')

  return failures
}

test('AI PROMPT KNOWLEDGE CORPUS 03 contains exactly 200 unique prompts split 50/50/50/50', () => {
  assert.equal(AI_PROMPT_KNOWLEDGE_CORPUS_03.length, AI_PROMPT_KNOWLEDGE_CORPUS_03_EXPECTED_COUNTS.TOTAL)
  assert.equal(new Set(AI_PROMPT_KNOWLEDGE_CORPUS_03.map((item) => item.id)).size, AI_PROMPT_KNOWLEDGE_CORPUS_03.length)
  assert.equal(new Set(AI_PROMPT_KNOWLEDGE_CORPUS_03.map((item) => item.prompt)).size, AI_PROMPT_KNOWLEDGE_CORPUS_03.length)
  for (const track of ['COMPOSITE_COMPLETE', 'DENSE_MIXED_LANGUAGE', 'DOOR_PANEL_COMPLETE', 'CONFLICT_AND_INCOMPLETE'] as const) {
    assert.equal(AI_PROMPT_KNOWLEDGE_CORPUS_03.filter((item) => item.track === track).length, AI_PROMPT_KNOWLEDGE_CORPUS_03_EXPECTED_COUNTS[track])
  }
})

test('AI PROMPT KNOWLEDGE CORPUS 03 evaluates all 200 dense prompts without production authority', () => {
  const failures = AI_PROMPT_KNOWLEDGE_CORPUS_03.flatMap((item) => evaluateCase(item).map((failure) => `${item.id}: ${failure}\n  ${item.prompt}`))
  assert.deepEqual(failures, [], failures.join('\n'))
})

test('AI PROMPT KNOWLEDGE CORPUS 03 complete tracks preserve whole-construction extraction', () => {
  const completeCases = AI_PROMPT_KNOWLEDGE_CORPUS_03.filter((item) => item.tags.includes('complete') || item.track === 'DOOR_PANEL_COMPLETE' || item.track === 'DENSE_MIXED_LANGUAGE')
  assert.equal(completeCases.length, 150)
  for (const item of completeCases) {
    const result = interpretFacadeFlowPrompt(item.prompt, `${item.id}-complete-check`)
    assert.equal(result.unresolved.length, 0, `${item.id}: ${result.unresolved.join(' | ')}`)
    assert.equal(result.rulesValidated, false)
    assert.equal(result.machineReady, false)
  }
})

test('AI PROMPT KNOWLEDGE CORPUS 03 semantic conflicts stay unresolved instead of first-value wins', () => {
  const semanticConflictCases = AI_PROMPT_KNOWLEDGE_CORPUS_03.filter((item) => item.tags.includes('semantic-conflict'))
  assert.equal(semanticConflictCases.length, 30)
  for (const item of semanticConflictCases) {
    const result = interpretFacadeFlowPrompt(item.prompt, `${item.id}-semantic-conflict-check`)
    assert.ok(result.unresolved.some((value) => /Конфликт за/i.test(value)), item.id)
    assert.ok(result.warnings.some((value) => /противоречиви стойности/i.test(value)), item.id)
    assert.equal(result.productionApproved, false)
  }
})

test('AI PROMPT KNOWLEDGE CORPUS 03 door punctuation keeps one-leaf lower-panel topology', () => {
  const doorCases = AI_PROMPT_KNOWLEDGE_CORPUS_03.filter((item) => item.track === 'DOOR_PANEL_COMPLETE')
  assert.equal(doorCases.length, 50)
  for (const item of doorCases) {
    const result = interpretFacadeFlowPrompt(item.prompt, `${item.id}-door-check`)
    assert.equal(result.intent.fields.length, 1, item.id)
    assert.ok(result.intent.fields[0]?.lowerPanel?.heightMm, item.id)
    assert.equal(result.intent.fields[0]?.lowerPanel?.upperZoneRole, 'GLAZING', item.id)
  }
})
