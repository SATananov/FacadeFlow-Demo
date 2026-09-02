import test from 'node:test'
import assert from 'node:assert/strict'
import { createFacadeFlowProductIntent } from '../src/aiProductIntent'
import { buildFacadeFlowParametricConstructionProposal, humanReviewFacadeFlowParametricProposal } from '../src/aiParametricConstructionProposal'
import { buildFacadeFlowAi04ConstructorHandoff } from '../src/ai04ConstructorHandoff'

test('AI04 blocks semantic roles that current editable constructor cannot represent safely', () => {
  const intent = createFacadeFlowProductIntent({ id: 'sliding', sourceKind: 'DOCUMENT', sourceText: 'sliding window' })
  intent.category = 'WINDOW'; intent.dimensions = { widthMm: 2000, heightMm: 1500 }
  intent.fields = [{ id: 's', order: 0, role: 'SLIDING_SASH', openingType: 'SLIDING', evidenceIds: [], unresolved: [] }]
  const proposal = humanReviewFacadeFlowParametricProposal(buildFacadeFlowParametricConstructionProposal(intent), { topologyChecked: true, assumptionsAccepted: true })
  const result = buildFacadeFlowAi04ConstructorHandoff(proposal, [])
  assert.equal(result.status, 'BLOCKED')
  assert.match(result.blockers.join(' '), /плъзгащо крило/)
})

test('AI04 output remains simulation-only and never production-approved', () => {
  const intent = createFacadeFlowProductIntent({ id: 'safe', sourceKind: 'PROMPT', sourceText: 'fixed window' })
  intent.category = 'WINDOW'; intent.dimensions = { widthMm: 1000, heightMm: 1000 }
  intent.fields = [{ id: 'f', order: 0, role: 'FIXED', evidenceIds: [], unresolved: [] }]
  const proposal = humanReviewFacadeFlowParametricProposal(buildFacadeFlowParametricConstructionProposal(intent), { topologyChecked: true, assumptionsAccepted: true })
  const result = buildFacadeFlowAi04ConstructorHandoff(proposal, [], { productId: 'safe-product', now: '2026-09-01T00:00:00.000Z' })
  assert.equal(result.explicitHumanHandoffRequired, true)
  assert.equal(result.automaticConstructorHandoff, false)
  assert.equal(result.rulesValidated, false)
  assert.equal(result.machineReady, false)
  assert.equal(result.productionApproved, false)
  assert.equal(result.customProduct?.machineReady, false)
  assert.equal(result.customProduct?.humanReviewConfirmed, false)
  assert.equal(result.customProduct?.ai04Handoff?.explicitConstructorHandoff, true)
})


test('AI04 V5 narrows nullable geometryBasis before editable metadata creation', async () => {
  const fs = await import('node:fs')
  const path = await import('node:path')
  const source = fs.readFileSync(path.join(process.cwd(), 'src', 'ai04ConstructorHandoff.ts'), 'utf8')
  assert.match(source, /const geometryBasis = proposal\.geometryBasis/)
  assert.match(source, /blockers\.length \|\| !geometry \|\| !geometryBasis/)
  assert.match(source, /geometryBasis,\s*\n\s*evidenceCount:/)
  assert.doesNotMatch(source, /geometryBasis:\s*proposal\.geometryBasis/)
})
