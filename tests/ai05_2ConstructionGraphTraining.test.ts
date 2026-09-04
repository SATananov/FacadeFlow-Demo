import assert from 'node:assert/strict'
import test from 'node:test'
import { buildFacadeFlowConstructionGraph, facadeFlowConstructionGraphSignature } from '../src/aiConstructionGraph'
import { interpretFacadeFlowPrompt } from '../src/aiPromptInterpreter'
import { evaluateFacadeFlowConstructionGraphTraining } from '../src/aiTraining/evaluateConstructionGraphTraining'
import { FACADEFLOW_CONSTRUCTION_GRAPH_TRAINING_CASES } from '../src/aiTraining/constructionGraphTrainingCorpus'

test('AI05.2 tracked graph corpus is synthetic/private-safe', () => {
  assert.equal(FACADEFLOW_CONSTRUCTION_GRAPH_TRAINING_CASES.length, 10)
  for (const item of FACADEFLOW_CONSTRUCTION_GRAPH_TRAINING_CASES) {
    assert.equal(item.provenance.derivedFromRealWorkflowPatterns, true)
    assert.equal(item.provenance.containsOriginalPrivateDocumentText, false)
    assert.equal(item.provenance.containsClientIdentity, false)
    assert.equal(item.provenance.safeForTrackedRegressionFixture, true)
  }
})

test('AI05.2 converts three fields into alternating field/mullion semantics without production geometry', () => {
  const interpreted = interpretFacadeFlowPrompt('Прозорец 1800 x 1400 mm, три полета, средното отваряемо, крайните фиксирани, каса 482.30, крило 482.05, делител 482.21.', 'ai05-2-three')
  const graph = buildFacadeFlowConstructionGraph(interpreted.intent)
  assert.equal(graph.status, 'READY_FOR_HUMAN_REVIEW')
  assert.equal(graph.topologyBasis, 'PROPOSED_LINEAR_FIELD_SEQUENCE')
  assert.deepEqual(facadeFlowConstructionGraphSignature(graph), ['FIXED_FIELD', 'MULLION', 'OPENABLE_FIELD>SASH', 'MULLION', 'FIXED_FIELD'])
  assert.equal(graph.fieldCount, 3)
  assert.equal(graph.mullionCount, 2)
  assert.equal(graph.root?.profileRef, '482.30')
  assert.equal(graph.exactProductionGeometry, false)
  assert.equal(graph.automaticGeometryAllowed, false)
  assert.equal(graph.rulesValidated, false)
  assert.equal(graph.machineReady, false)
  assert.equal(graph.productionApproved, false)
})

test('AI05.2 does not infer exact PRELUDE profiles from system name alone', () => {
  const interpreted = interpretFacadeFlowPrompt('Прозорец 1600 x 1300 mm, две полета, лявото фиксирано, дясното отваряемо, система PRELUDE 60.', 'ai05-2-no-profile-inference')
  const graph = buildFacadeFlowConstructionGraph(interpreted.intent)
  assert.equal(graph.root?.profileRef, undefined)
  const sashProfiles = graph.root?.children.flatMap((child) => child.kind === 'FIELD' && child.sash?.profileRef ? [child.sash.profileRef] : []) ?? []
  const mullionProfiles = graph.root?.children.flatMap((child) => child.kind === 'MULLION' && child.profileRef ? [child.profileRef] : []) ?? []
  assert.deepEqual(sashProfiles, [])
  assert.deepEqual(mullionProfiles, [])
})

test('AI05.2 ordinal language maps four fields deterministically', () => {
  const interpreted = interpretFacadeFlowPrompt('Прозорец 2400 x 1400 mm, четири полета, първото фиксирано, второто отваряемо, третото фиксирано, четвъртото отваряемо.', 'ai05-2-ordinals')
  assert.deepEqual(interpreted.intent.fields.map((field) => field.role), ['FIXED', 'OPENING_SASH', 'FIXED', 'OPENING_SASH'])
  const graph = buildFacadeFlowConstructionGraph(interpreted.intent)
  assert.deepEqual(facadeFlowConstructionGraphSignature(graph), ['FIXED_FIELD', 'MULLION', 'OPENABLE_FIELD>SASH', 'MULLION', 'FIXED_FIELD', 'MULLION', 'OPENABLE_FIELD>SASH'])
})

test('AI05.2 construction graph training batch passes deterministic evaluation', () => {
  const evaluation = evaluateFacadeFlowConstructionGraphTraining()
  assert.equal(evaluation.total, 10)
  assert.equal(evaluation.passed, evaluation.total, evaluation.cases.filter((item) => !item.passed).map((item) => `${item.id}: ${item.failures.join('; ')}`).join('\n'))
  assert.equal(evaluation.humanReviewRequired, true)
  assert.equal(evaluation.rulesValidated, false)
  assert.equal(evaluation.automaticGeometryAllowed, false)
  assert.equal(evaluation.machineReady, false)
  assert.equal(evaluation.productionApproved, false)
})
