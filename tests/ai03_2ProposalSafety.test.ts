import test from 'node:test'
import assert from 'node:assert/strict'
import { interpretFacadeFlowPrompt } from '../src/aiPromptInterpreter'
import { buildFacadeFlowParametricConstructionProposal } from '../src/aiParametricConstructionProposal'

test('AI03 carries explicit semantics but never invents hardware placement or production authority', () => {
  const interpreted = interpretFacadeFlowPrompt('Window 1800x1400, three fields, left fixed, middle tilt-turn, right fixed, 2 hinges, black handle')
  const proposal = buildFacadeFlowParametricConstructionProposal(interpreted.intent)
  assert.equal(proposal.hardwareSummary.hingeQuantity, 2)
  assert.ok(proposal.unresolved.includes('Позиции на пантите'))
  assert.ok(proposal.unresolved.includes('Позиция / височина на дръжката'))
  assert.equal(proposal.proposalGenerated, true)
  assert.equal(proposal.humanReviewRequired, true)
  assert.equal(proposal.rulesValidated, false)
  assert.equal(proposal.automaticAcceptedGeometry, false)
  assert.equal(proposal.constructorHandoffAllowed, false)
  assert.equal(proposal.simulationOnly, true)
  assert.equal(proposal.machineReady, false)
  assert.equal(proposal.productionApproved, false)
})
