import test from 'node:test'
import assert from 'node:assert/strict'
import { interpretFacadeFlowPrompt } from '../src/aiPromptInterpreter'
import { buildFacadeFlowParametricConstructionProposal, humanReviewFacadeFlowParametricProposal } from '../src/aiParametricConstructionProposal'

test('AI03 requires explicit human acceptance of proposal assumptions', () => {
  const intent = interpretFacadeFlowPrompt('Прозорец 2400x1500, три полета, средното отваряемо').intent
  const base = buildFacadeFlowParametricConstructionProposal(intent)
  assert.equal(base.assumptions.length, 1)
  assert.equal(humanReviewFacadeFlowParametricProposal(base, { topologyChecked: false, assumptionsAccepted: false }).status, 'NEEDS_REVIEW')
  assert.equal(humanReviewFacadeFlowParametricProposal(base, { topologyChecked: true, assumptionsAccepted: false }).status, 'NEEDS_REVIEW')
  const reviewed = humanReviewFacadeFlowParametricProposal(base, { topologyChecked: true, assumptionsAccepted: true })
  assert.equal(reviewed.status, 'HUMAN_REVIEWED')
  assert.equal(reviewed.proposalGeometryHumanReviewed, true)
  assert.equal(reviewed.automaticAcceptedGeometry, false)
  assert.equal(reviewed.constructorHandoffAllowed, false)
  assert.equal(reviewed.rulesValidated, false)
  assert.equal(reviewed.machineReady, false)
})

test('AI03 cannot human-review a proposal that is structurally blocked', () => {
  const intent = interpretFacadeFlowPrompt('Прозорец 2400x1500').intent
  const base = buildFacadeFlowParametricConstructionProposal(intent)
  const reviewed = humanReviewFacadeFlowParametricProposal(base, { topologyChecked: true, assumptionsAccepted: true })
  assert.equal(reviewed.status, 'BLOCKED')
  assert.equal(reviewed.proposalGeometryHumanReviewed, false)
})
