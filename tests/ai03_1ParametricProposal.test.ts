import test from 'node:test'
import assert from 'node:assert/strict'
import { interpretFacadeFlowPrompt } from '../src/aiPromptInterpreter'
import { buildFacadeFlowParametricConstructionProposal } from '../src/aiParametricConstructionProposal'
import { createFacadeFlowProductIntent } from '../src/aiProductIntent'

test('AI03 proposes three equal fields when count is explicit but divider positions are not', () => {
  const interpreted = interpretFacadeFlowPrompt('Прозорец 2400x1500, три полета, средното отваряемо, черна дръжка, две панти')
  const proposal = buildFacadeFlowParametricConstructionProposal(interpreted.intent)
  assert.equal(proposal.status, 'NEEDS_REVIEW')
  assert.equal(proposal.geometryBasis, 'EQUAL_DISTRIBUTION_PROPOSAL')
  assert.equal(proposal.fields.length, 3)
  assert.equal(proposal.dividers.length, 2)
  assert.equal(proposal.fields[1]?.role, 'OPENING_SASH')
  assert.equal(proposal.fields[1]?.openingType, undefined)
  assert.equal(proposal.fields[0]?.rect.widthRatio, 1 / 3)
  assert.equal(proposal.dividers[0]?.positionRatio, 1 / 3)
  assert.equal(proposal.assumptions.length, 1)
  assert.ok(proposal.unresolved.includes('Точни позиции / размери на делителите'))
  assert.ok(proposal.unresolved.includes('Позиции на пантите'))
  assert.equal(proposal.automaticAcceptedGeometry, false)
  assert.equal(proposal.constructorHandoffAllowed, false)
  assert.equal(proposal.machineReady, false)
})

test('AI03 uses explicit divider ratios when evidence provides a simple linear topology', () => {
  const intent = createFacadeFlowProductIntent({ id: 'explicit', sourceKind: 'DOCUMENT', sourceText: 'W-40 explicit topology' })
  intent.category = 'WINDOW'
  intent.dimensions = { widthMm: 2000, heightMm: 1200 }
  intent.evidence = [{ id: 'e1', sourceKind: 'DOCUMENT', sourceName: 'schedule', excerpt: '33% / 70%', strength: 'EXPLICIT' }]
  intent.fields = [0, 1, 2].map((order) => ({ id: `f${order + 1}`, order, role: 'FIXED' as const, evidenceIds: ['e1'], unresolved: [] }))
  intent.dividers = [
    { id: 'd1', orientation: 'VERTICAL', positionRatio: .3, evidenceIds: ['e1'], unresolved: [] },
    { id: 'd2', orientation: 'VERTICAL', positionRatio: .7, evidenceIds: ['e1'], unresolved: [] },
  ]
  const proposal = buildFacadeFlowParametricConstructionProposal(intent)
  assert.equal(proposal.geometryBasis, 'EXPLICIT_DIVIDERS')
  assert.equal(proposal.assumptions.length, 0)
  assert.deepEqual(proposal.fields.map((field) => Number(field.rect.widthRatio.toFixed(4))), [.3, .4, .3])
  assert.deepEqual(proposal.dividers.map((divider) => divider.basis), ['EXPLICIT', 'EXPLICIT'])
})

test('AI03 blocks geometry rather than inventing a single field when topology is missing', () => {
  const intent = createFacadeFlowProductIntent({ id: 'missing-topology', sourceKind: 'DOCUMENT', sourceText: 'W-17 2400x1500' })
  intent.category = 'WINDOW'
  intent.dimensions = { widthMm: 2400, heightMm: 1500 }
  const proposal = buildFacadeFlowParametricConstructionProposal(intent)
  assert.equal(proposal.status, 'BLOCKED')
  assert.equal(proposal.fields.length, 0)
  assert.ok(proposal.blockers.some((item) => item.includes('Field topology is unresolved')))
})

test('AI03 blocks a proposal when a conflict has removed a required overall dimension', () => {
  const intent = createFacadeFlowProductIntent({ id: 'conflict-width', sourceKind: 'DOCUMENT', sourceText: 'W-22 conflicting widths' })
  intent.category = 'WINDOW'
  intent.dimensions = { heightMm: 1400 }
  intent.fields = [{ id: 'f1', order: 0, role: 'FIXED', evidenceIds: [], unresolved: [] }]
  const proposal = buildFacadeFlowParametricConstructionProposal(intent)
  assert.equal(proposal.status, 'BLOCKED')
  assert.ok(proposal.blockers.some((item) => item.includes('Overall width')))
})
