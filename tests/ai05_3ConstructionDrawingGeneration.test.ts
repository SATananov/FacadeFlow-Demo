import assert from 'node:assert/strict'
import test from 'node:test'
import { buildFacadeFlowConstructionGraph } from '../src/aiConstructionGraph'
import { buildFacadeFlowConstructionDrawing, facadeFlowConstructionDrawingSignature } from '../src/aiConstructionDrawing'
import { interpretFacadeFlowPrompt } from '../src/aiPromptInterpreter'
import { FACADEFLOW_CONSTRUCTION_DRAWING_TRAINING_CASES } from '../src/aiTraining/constructionDrawingTrainingCorpus'
import { evaluateFacadeFlowConstructionDrawingTraining } from '../src/aiTraining/evaluateConstructionDrawingTraining'

function drawingFromPrompt(prompt: string, id: string) {
  const interpreted = interpretFacadeFlowPrompt(prompt, id)
  const graph = buildFacadeFlowConstructionGraph(interpreted.intent)
  return { interpreted, graph, drawing: buildFacadeFlowConstructionDrawing(interpreted.intent, graph) }
}

test('AI05.3 drawing corpus is synthetic/private-safe', () => {
  assert.equal(FACADEFLOW_CONSTRUCTION_DRAWING_TRAINING_CASES.length, 8)
  for (const item of FACADEFLOW_CONSTRUCTION_DRAWING_TRAINING_CASES) {
    assert.equal(item.provenance.derivedFromRealWorkflowPatterns, true)
    assert.equal(item.provenance.containsOriginalPrivateDocumentText, false)
    assert.equal(item.provenance.containsClientIdentity, false)
    assert.equal(item.provenance.safeForTrackedRegressionFixture, true)
  }
})

test('AI05.3 builds visible three-field drawing semantics from AI05.2 graph', () => {
  const { drawing } = drawingFromPrompt('Прозорец 1800 x 1400 mm, три полета, средното отваряемо, крайните фиксирани, каса 482.30, крило 482.05, делител 482.21.', 'ai05-3-main')
  assert.equal(drawing.status, 'READY_FOR_HUMAN_REVIEW')
  assert.equal(drawing.sourceOfTruth, 'AI05.2_CONSTRUCTION_GRAPH')
  assert.equal(drawing.basis, 'PROPOSED_EQUAL_FIELD_DISTRIBUTION')
  assert.deepEqual(facadeFlowConstructionDrawingSignature(drawing), ['FRAME:482.30', 'FIXED_FIELD', 'MULLION:482.21', 'OPENABLE_FIELD>SASH:482.05', 'MULLION:482.21', 'FIXED_FIELD'])
  assert.deepEqual(drawing.fields.map((field) => Number(field.rect.widthRatio.toFixed(6))), [0.333333, 0.333333, 0.333333])
  assert.deepEqual(drawing.mullions.map((item) => Number(item.positionRatio.toFixed(6))), [0.333333, 0.666667])
})

test('AI05.3 preserves exact semantic profile refs only when explicitly supplied', () => {
  const withoutRefs = drawingFromPrompt('Прозорец 1800 x 1400 mm, три полета, средното отваряемо, крайните фиксирани, система PRELUDE 60.', 'ai05-3-no-ref').drawing
  assert.equal(withoutRefs.frame?.profileRef, undefined)
  assert.deepEqual(withoutRefs.mullions.flatMap((item) => item.profileRef ? [item.profileRef] : []), [])
  assert.deepEqual(withoutRefs.fields.flatMap((item) => item.sash?.profileRef ? [item.sash.profileRef] : []), [])
})

test('AI05.3 blocks production claims and exact contour assumptions', () => {
  const { drawing } = drawingFromPrompt('Прозорец 1600 x 1300 mm, две полета, лявото фиксирано, дясното отваряемо.', 'ai05-3-safety')
  assert.equal(drawing.humanReviewRequired, true)
  assert.equal(drawing.automaticDrawingProposal, true)
  assert.equal(drawing.automaticGeometryAllowed, false)
  assert.equal(drawing.exactProfileContourApplied, false)
  assert.equal(drawing.productionDeductionsApplied, false)
  assert.equal(drawing.manufacturingToleranceApplied, false)
  assert.equal(drawing.exactProductionGeometry, false)
  assert.equal(drawing.rulesValidated, false)
  assert.equal(drawing.machineReady, false)
  assert.equal(drawing.productionApproved, false)
})

test('AI05.3 deterministic drawing evaluation passes all tracked cases', () => {
  const evaluation = evaluateFacadeFlowConstructionDrawingTraining()
  assert.equal(evaluation.total, 8)
  assert.equal(evaluation.passed, evaluation.total, evaluation.cases.filter((item) => !item.passed).map((item) => `${item.id}: ${item.failures.join('; ')}`).join('\n'))
  assert.equal(evaluation.automaticDrawingProposal, true)
  assert.equal(evaluation.automaticGeometryAllowed, false)
  assert.equal(evaluation.exactProfileContourApplied, false)
  assert.equal(evaluation.machineReady, false)
  assert.equal(evaluation.productionApproved, false)
})

test('AI05.3 proposal UI is wired to graph-driven drawing and keeps the safety marker visible', async () => {
  const fs = await import('node:fs/promises')
  const panel = await fs.readFile('src/components/ParametricConstructionProposalPanel.tsx', 'utf8')
  const grammar = await fs.readFile('src/aiDrawingVisualGrammar.ts', 'utf8')
  assert.match(panel, /buildFacadeFlowConstructionGraph/)
  assert.match(panel, /buildFacadeFlowConstructionDrawing/)
  assert.match(panel, /createOpeningGeometry/)
  assert.match(panel, /AI05\.3/)
  assert.match(panel, /НЕ Е ПРОИЗВОДСТВЕНА ГЕОМЕТРИЯ/)
  assert.match(grammar, /Ляво отваряне/)
  assert.match(grammar, /Посока ляво \/ дясно не е уточнена/)
})
