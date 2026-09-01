import test from 'node:test'
import assert from 'node:assert/strict'
import { createFacadeFlowProductIntent } from '../src/aiProductIntent'
import { buildFacadeFlowParametricConstructionProposal, humanReviewFacadeFlowParametricProposal } from '../src/aiParametricConstructionProposal'
import { buildFacadeFlowAi04ConstructorHandoff } from '../src/ai04ConstructorHandoff'

function reviewedThreeFieldProposal() {
  const intent = createFacadeFlowProductIntent({ id: 'w31', sourceKind: 'DOCUMENT', sourceText: 'W-31 2400x1500 three fields' })
  intent.category = 'WINDOW'
  intent.mark = 'W-31'
  intent.dimensions = { widthMm: 2400, heightMm: 1500 }
  intent.fields = [
    { id: 'f1', order: 0, role: 'FIXED', evidenceIds: [], unresolved: [] },
    { id: 'f2', order: 1, role: 'OPENING_SASH', openingType: 'TURN', openingDirection: 'RIGHT', evidenceIds: [], unresolved: [] },
    { id: 'f3', order: 2, role: 'FIXED', evidenceIds: [], unresolved: [] },
  ]
  const proposal = buildFacadeFlowParametricConstructionProposal(intent)
  return humanReviewFacadeFlowParametricProposal(proposal, { topologyChecked: true, assumptionsAccepted: true })
}

test('AI04 blocks constructor geometry before explicit AI03 human review', () => {
  const intent = createFacadeFlowProductIntent({ id: 'blocked', sourceKind: 'PROMPT', sourceText: 'window 1200x1200' })
  intent.category = 'WINDOW'; intent.dimensions = { widthMm: 1200, heightMm: 1200 }; intent.fields = [{ id: 'f', order: 0, role: 'FIXED', evidenceIds: [], unresolved: [] }]
  const proposal = buildFacadeFlowParametricConstructionProposal(intent)
  const result = buildFacadeFlowAi04ConstructorHandoff(proposal, [], { productId: 'p', now: '2026-09-01T00:00:00.000Z' })
  assert.equal(result.status, 'BLOCKED')
  assert.equal(result.customProduct, null)
  assert.equal(result.automaticConstructorHandoff, false)
})

test('AI04 converts reviewed three-field equal proposal into editable nested custom geometry', () => {
  const result = buildFacadeFlowAi04ConstructorHandoff(reviewedThreeFieldProposal(), [], { productId: 'p-ai04', now: '2026-09-01T00:00:00.000Z' })
  assert.equal(result.status, 'READY')
  assert.ok(result.customProduct)
  assert.equal(result.customProduct.width, 2400)
  assert.equal(result.customProduct.height, 1500)
  assert.equal(result.customProduct.status, 'NEEDS_REVIEW')
  assert.equal(result.customProduct.humanReviewConfirmed, false)
  assert.equal(result.customProduct.machineReady, false)
  assert.equal(result.customProduct.frameCreated, true)
  const root = result.customProduct.geometry
  assert.equal(root.kind, 'SPLIT')
  if (root.kind !== 'SPLIT') return
  assert.equal(root.orientation, 'VERTICAL')
  assert.equal(root.position, 800)
  assert.equal(root.first.kind, 'LEAF')
  if (root.first.kind === 'LEAF') assert.equal(root.first.fieldType, 'FIXED')
  assert.equal(root.second.kind, 'SPLIT')
  if (root.second.kind !== 'SPLIT') return
  assert.equal(root.second.position, 800)
  assert.equal(root.second.first.kind, 'LEAF')
  if (root.second.first.kind === 'LEAF') {
    assert.equal(root.second.first.fieldType, 'OPENING_SASH')
    assert.equal(root.second.first.openingType, 'TURN')
    assert.equal(root.second.first.openingDirection, 'right')
  }
})
