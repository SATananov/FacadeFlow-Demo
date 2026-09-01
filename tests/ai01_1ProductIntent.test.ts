import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createFacadeFlowProductIntent,
  facadeFlowProductIntentAllowsAutomaticGeometry,
  facadeFlowProductIntentToSpecification,
  validateFacadeFlowProductIntent,
  type FacadeFlowProductIntent,
} from '../src/aiProductIntent'

const prompt = 'Направи прозорец 2400x1500 mm с три полета, средното отваряемо, профил X, черна дръжка и 2 панти.'

function completeIntent(): FacadeFlowProductIntent {
  return {
    ...createFacadeFlowProductIntent({ id: 'prompt-001', sourceKind: 'PROMPT', sourceText: prompt }),
    category: 'WINDOW',
    name: 'Prompt window',
    quantity: 1,
    dimensions: { widthMm: 2400, heightMm: 1500 },
    profiles: { system: 'X', frame: 'FRAME-X', sash: 'SASH-X', mullion: 'MULLION-X' },
    fields: [
      { id: 'field-1', order: 0, role: 'FIXED', openingType: 'FIXED', evidenceIds: ['ev-layout'], unresolved: [] },
      { id: 'field-2', order: 1, role: 'OPENING_SASH', openingType: 'TURN', openingDirection: 'UNRESOLVED', hardware: { handle: 'Черна дръжка', hingeQuantity: 2 }, evidenceIds: ['ev-layout', 'ev-hardware'], unresolved: ['Посока на отваряне'] },
      { id: 'field-3', order: 2, role: 'FIXED', openingType: 'FIXED', evidenceIds: ['ev-layout'], unresolved: [] },
    ],
    dividers: [
      { id: 'divider-1', orientation: 'VERTICAL', positionRatio: 1 / 3, profile: 'MULLION-X', evidenceIds: ['ev-layout'], unresolved: ['Точна позиция'] },
      { id: 'divider-2', orientation: 'VERTICAL', positionRatio: 2 / 3, profile: 'MULLION-X', evidenceIds: ['ev-layout'], unresolved: ['Точна позиция'] },
    ],
    hardwareDefaults: { handleHeightMm: 1050 },
    evidence: [
      { id: 'ev-layout', sourceKind: 'PROMPT', sourceName: 'User prompt', excerpt: '2400x1500 mm с три полета, средното отваряемо', strength: 'EXPLICIT' },
      { id: 'ev-hardware', sourceKind: 'PROMPT', sourceName: 'User prompt', excerpt: 'черна дръжка и 2 панти', strength: 'EXPLICIT' },
    ],
    unresolved: ['Посока на отваряне', 'Точни позиции на делителите'],
    status: 'NEEDS_REVIEW',
  }
}

test('AI01.1 empty prompt intent is review-only and production locked', () => {
  const intent = createFacadeFlowProductIntent({ id: 'prompt-empty', sourceKind: 'PROMPT', sourceText: 'Прозорец 1200x1400' })
  assert.equal(intent.schemaVersion, 'AI01.1')
  assert.equal(intent.status, 'AI_DRAFT')
  assert.equal(intent.aiGenerated, true)
  assert.equal(intent.humanReviewRequired, true)
  assert.equal(intent.rulesValidated, false)
  assert.equal(intent.automaticGeometryAllowed, false)
  assert.equal(intent.simulationOnly, true)
  assert.equal(intent.machineReady, false)
  assert.equal(intent.productionApproved, false)
  assert.equal(facadeFlowProductIntentAllowsAutomaticGeometry(intent), false)
})

test('AI01.1 canonical intent can represent dimensions, topology, profiles and hardware from one prompt', () => {
  const intent = completeIntent()
  assert.deepEqual(intent.dimensions, { widthMm: 2400, heightMm: 1500 })
  assert.equal(intent.fields.length, 3)
  assert.equal(intent.fields[1]?.role, 'OPENING_SASH')
  assert.equal(intent.fields[1]?.hardware?.handle, 'Черна дръжка')
  assert.equal(intent.fields[1]?.hardware?.hingeQuantity, 2)
  assert.equal(intent.dividers.length, 2)
  assert.equal(intent.profiles.system, 'X')
})

test('AI01.1 validation rejects broken evidence references and invalid dimensions', () => {
  const intent = completeIntent()
  intent.dimensions.widthMm = -10
  intent.fields[0] = { ...intent.fields[0]!, evidenceIds: ['missing-evidence'] }
  const validation = validateFacadeFlowProductIntent(intent)
  assert.equal(validation.validForHumanReview, false)
  assert.ok(validation.errors.some((item) => item.includes('Overall width')))
  assert.ok(validation.errors.some((item) => item.includes('missing evidence')))
})

test('AI01.1 unresolved information remains visible instead of being invented', () => {
  const intent = completeIntent()
  const validation = validateFacadeFlowProductIntent(intent)
  assert.equal(validation.validForHumanReview, true)
  assert.ok(validation.warnings.some((item) => item.includes('remain unresolved')))
  assert.ok(intent.fields[1]?.unresolved.includes('Посока на отваряне'))
})

test('AI01.1 conversion to existing product specification remains NEEDS_REVIEW and simulation-only', () => {
  const specification = facadeFlowProductIntentToSpecification(completeIntent())
  assert.equal(specification.status, 'NEEDS_REVIEW')
  assert.equal(specification.dimensions.width, 2400)
  assert.equal(specification.dimensions.height, 1500)
  assert.equal(specification.system, 'X')
  assert.equal(specification.simulationOnly, true)
  assert.equal(specification.machineReady, false)
  assert.equal(specification.hardware.handleHeight, 1050)
  assert.ok(specification.evidence.some((item) => item.sourceKind === 'DESCRIPTION'))
  assert.ok(specification.unresolved.includes('Посока на отваряне'))
})

test('AI01.1 document and prompt inputs share the same canonical contract', () => {
  const promptIntent = createFacadeFlowProductIntent({ id: 'p', sourceKind: 'PROMPT', sourceText: 'W01 1000x1200' })
  const documentIntent = createFacadeFlowProductIntent({ id: 'd', sourceKind: 'DOCUMENT', sourceText: 'W01 1000x1200' })
  assert.equal(promptIntent.schemaVersion, documentIntent.schemaVersion)
  assert.deepEqual(Object.keys(promptIntent).sort(), Object.keys(documentIntent).sort())
  assert.equal(promptIntent.automaticGeometryAllowed, false)
  assert.equal(documentIntent.automaticGeometryAllowed, false)
})
