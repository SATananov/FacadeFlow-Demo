import assert from 'node:assert/strict'
import test from 'node:test'
import { FACADEFLOW_CONSTRUCTION_SEMANTICS } from '../src/aiConstructionSemantics'
import { evaluateFacadeFlowConstructionLanguageTraining } from '../src/aiTraining/evaluateConstructionLanguageTraining'
import { FACADEFLOW_CONSTRUCTION_LANGUAGE_TRAINING_CASES } from '../src/aiTraining/constructionLanguageTrainingCorpus'

test('AI05.1 construction semantics define frame, sash and mullion as different functional roles', () => {
  assert.equal(FACADEFLOW_CONSTRUCTION_SEMANTICS.FRAME.profileRole, 'FRAME')
  assert.equal(FACADEFLOW_CONSTRUCTION_SEMANTICS.SASH.profileRole, 'SASH')
  assert.equal(FACADEFLOW_CONSTRUCTION_SEMANTICS.MULLION.profileRole, 'MULLION')
  assert.match(FACADEFLOW_CONSTRUCTION_SEMANTICS.MULLION.meaningBg, /разделя две съседни полета/i)
  assert.match(FACADEFLOW_CONSTRUCTION_SEMANTICS.SASH.meaningBg, /подвижната част/i)
  assert.match(FACADEFLOW_CONSTRUCTION_SEMANTICS.FRAME.meaningBg, /външният/i)
})

test('AI05.1 tracked training corpus is synthetic/private-safe and not production truth', () => {
  for (const item of FACADEFLOW_CONSTRUCTION_LANGUAGE_TRAINING_CASES) {
    assert.equal(item.provenance.derivedFromRealWorkflowPatterns, true)
    assert.equal(item.provenance.containsOriginalPrivateDocumentText, false)
    assert.equal(item.provenance.containsClientIdentity, false)
    assert.equal(item.provenance.safeForTrackedRegressionFixture, true)
  }
})

test('AI05.1 construction language training batch passes its deterministic evaluation', () => {
  const evaluation = evaluateFacadeFlowConstructionLanguageTraining()
  assert.equal(evaluation.total, 4)
  assert.equal(evaluation.passed, evaluation.total, evaluation.cases.filter((item) => !item.passed).map((item) => `${item.id}: ${item.failures.join('; ')}`).join('\n'))
  assert.equal(evaluation.humanReviewRequired, true)
  assert.equal(evaluation.rulesValidated, false)
  assert.equal(evaluation.machineReady, false)
  assert.equal(evaluation.productionApproved, false)
})
