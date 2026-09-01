import test from 'node:test'
import assert from 'node:assert/strict'
import { createFacadeFlowProductIntent } from '../src/aiProductIntent'
import { buildFacadeFlowParametricConstructionProposal, humanReviewFacadeFlowParametricProposal } from '../src/aiParametricConstructionProposal'
import { buildFacadeFlowAi04ConstructorHandoff } from '../src/ai04ConstructorHandoff'
import type { CatalogueProfile } from '../src/profileCatalogueTypes'

const profiles: CatalogueProfile[] = [
  { id: 'frame-90', role: 'FRAME', system: 'SYS-90', code: 'F90', nameBg: 'Каса F90', dimensionA: 1, dimensionB: 1, status: 'EXPERT_CONFIRMED', createdAt: 'x', updatedAt: 'x', simulationOnly: true, requiresHumanApproval: true },
  { id: 'sash-90', role: 'SASH', system: 'SYS-90', code: 'S90', nameBg: 'Крило S90', dimensionA: 1, dimensionB: 1, status: 'EXPERT_CONFIRMED', createdAt: 'x', updatedAt: 'x', simulationOnly: true, requiresHumanApproval: true },
  { id: 'mul-90', role: 'MULLION', system: 'SYS-90', code: 'M90', nameBg: 'Делител M90', dimensionA: 1, dimensionB: 1, status: 'EXPERT_CONFIRMED', createdAt: 'x', updatedAt: 'x', simulationOnly: true, requiresHumanApproval: true },
]

function reviewed() {
  const intent = createFacadeFlowProductIntent({ id: 'exact', sourceKind: 'PROMPT', sourceText: 'window exact profiles' })
  intent.category = 'WINDOW'; intent.dimensions = { widthMm: 1800, heightMm: 1400 }
  intent.profiles = { system: 'SYS-90', frame: 'F90', sash: 'S90', mullion: 'M90' }
  intent.fields = [
    { id: 'a', order: 0, role: 'OPENING_SASH', openingType: 'TILT_TURN', openingDirection: 'LEFT', evidenceIds: [], unresolved: [] },
    { id: 'b', order: 1, role: 'FIXED', evidenceIds: [], unresolved: [] },
  ]
  const proposal = buildFacadeFlowParametricConstructionProposal(intent)
  return humanReviewFacadeFlowParametricProposal(proposal, { topologyChecked: true, assumptionsAccepted: true })
}

test('AI04 transfers only exact selectable profile evidence and preserves opening type/direction', () => {
  const result = buildFacadeFlowAi04ConstructorHandoff(reviewed(), profiles, { productId: 'exact-product', now: '2026-09-01T00:00:00.000Z' })
  assert.equal(result.status, 'READY')
  assert.ok(result.customProduct)
  assert.equal(result.customProduct.frameProfileId, 'frame-90')
  assert.equal(result.customProduct.mullionProfileId, 'mul-90')
  const root = result.customProduct.geometry
  assert.equal(root.kind, 'SPLIT')
  if (root.kind !== 'SPLIT' || root.first.kind !== 'LEAF') return
  assert.equal(root.first.sashProfileId, 'sash-90')
  assert.equal(root.first.openingType, 'TILT_TURN')
  assert.equal(root.first.openingDirection, 'left')
})

test('AI04 does not infer catalogue profiles from system name alone', () => {
  const proposal = reviewed()
  proposal.profileSummary = { system: 'SYS-90' }
  const result = buildFacadeFlowAi04ConstructorHandoff(proposal, profiles, { productId: 'no-infer', now: '2026-09-01T00:00:00.000Z' })
  assert.ok(result.customProduct)
  assert.equal(result.customProduct.frameProfileId, '')
  assert.equal(result.customProduct.mullionProfileId, undefined)
  assert.match(result.warnings.join(' '), /не избира профили само по име на система/i)
})
