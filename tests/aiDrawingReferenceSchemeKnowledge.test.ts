import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { buildFacadeFlowConstructionGraph } from '../src/aiConstructionGraph'
import { buildFacadeFlowConstructionDrawing } from '../src/aiConstructionDrawing'
import { facadeFlowAiDrawingVisualToken, resolveFacadeFlowAiDrawingVisualGrammar } from '../src/aiDrawingVisualGrammar'
import { interpretFacadeFlowPrompt } from '../src/aiPromptInterpreter'
import { evaluateFacadeFlowReferenceSchemeVisualGrammar } from '../src/aiTraining/evaluateReferenceSchemeVisualGrammar'
import { FACADEFLOW_REFERENCE_SCHEME_VISUAL_GRAMMAR_CASES } from '../src/aiTraining/referenceSchemeVisualGrammarCorpus'

test('reference knowledge covers all 17 type schemes without becoming runtime template selection', () => {
  assert.equal(FACADEFLOW_REFERENCE_SCHEME_VISUAL_GRAMMAR_CASES.length, 17)
  assert.deepEqual(FACADEFLOW_REFERENCE_SCHEME_VISUAL_GRAMMAR_CASES.map((item) => item.sourceRef), Array.from({ length: 17 }, (_, index) => `REF-${String(index + 1).padStart(2, '0')}`))
  for (const item of FACADEFLOW_REFERENCE_SCHEME_VISUAL_GRAMMAR_CASES) {
    assert.equal(item.safety.runtimeTemplateDependency, false)
    assert.equal(item.safety.demoDirectionIsProductionTruth, false)
    assert.equal(item.safety.humanDirectionOverridesDemo, true)
  }
})

test('reference training corpus and current type library stay structurally aligned', () => {
  const evaluation = evaluateFacadeFlowReferenceSchemeVisualGrammar()
  assert.equal(evaluation.total, 18)
  assert.equal(evaluation.passed, evaluation.total, evaluation.cases.filter((item) => !item.passed).map((item) => `${item.id}: ${item.failures.join('; ')}`).join('\n'))
  assert.equal(evaluation.runtimeTemplateDependency, false)
  assert.equal(evaluation.automaticDirectionInference, false)
  assert.equal(evaluation.machineReady, false)
  assert.equal(evaluation.productionApproved, false)
})

test('AI drawing runtime does not import or select productTemplates / REF schemes', () => {
  const grammar = readFileSync('src/aiDrawingVisualGrammar.ts', 'utf8')
  const panel = readFileSync('src/components/ParametricConstructionProposalPanel.tsx', 'utf8')
  assert.doesNotMatch(grammar, /productTemplates|getProductTemplate|REF-0[1-9]|REF-1[0-7]/)
  assert.doesNotMatch(panel, /productTemplates|getProductTemplate|REF-0[1-9]|REF-1[0-7]/)
  assert.match(panel, /resolveFacadeFlowAiDrawingVisualGrammar/)
})

test('explicit human direction controls canonical AI symbol semantics', () => {
  const base = { sourceFieldId: 'x', order: 0, semanticRole: 'OPENABLE_FIELD' as const, rect: { xRatio: 0, yRatio: 0, widthRatio: 1, heightRatio: 1 } }
  const left = resolveFacadeFlowAiDrawingVisualGrammar({ ...base, sash: { semanticRole: 'SASH', openingType: 'TURN', openingDirection: 'LEFT', conceptualInsetRatio: 0.06 } })
  const right = resolveFacadeFlowAiDrawingVisualGrammar({ ...base, sash: { semanticRole: 'SASH', openingType: 'TURN', openingDirection: 'RIGHT', conceptualInsetRatio: 0.06 } })
  const unresolved = resolveFacadeFlowAiDrawingVisualGrammar({ ...base, sash: { semanticRole: 'SASH', openingType: 'TILT_TURN', conceptualInsetRatio: 0.06 } })
  assert.equal(left.composerDirection, 'LEFT')
  assert.equal(left.labelBg, 'Ляво отваряне')
  assert.equal(right.composerDirection, 'RIGHT')
  assert.equal(right.labelBg, 'Дясно отваряне')
  assert.equal(unresolved.composerDirection, null)
  assert.equal(unresolved.sideDirectionKnown, false)
  assert.equal(unresolved.safety.inferredMissingDirection, false)
})

test('describe-first prompt generalizes learned grammar to a specific three-field assignment', () => {
  const prompt = 'Прозорец KMG PRELUDE 60, 1800 x 1400 mm, три вертикални полета. Лявото поле е фиксирано. Средното поле е осово-откидно с ляво отваряне. Дясното поле е фиксирано. Каса 482.30, крило 482.05, два вертикални делителя 482.21.'
  const intent = interpretFacadeFlowPrompt(prompt, 'reference-knowledge-three').intent
  const drawing = buildFacadeFlowConstructionDrawing(intent, buildFacadeFlowConstructionGraph(intent))
  assert.deepEqual(drawing.fields.map(facadeFlowAiDrawingVisualToken), ['FIXED', 'TILT_TURN:LEFT', 'FIXED'])
})

test('grammar generalizes beyond REF library to five fields and keeps unknown direction unresolved', () => {
  const prompt = 'Прозорец 3000 x 1500 mm, пет вертикални полета. Първото поле е фиксирано. Второто поле е отваряемо с ляво отваряне. Третото поле е фиксирано. Четвъртото поле е отваряемо с дясно отваряне. Петото поле е фиксирано.'
  const intent = interpretFacadeFlowPrompt(prompt, 'reference-knowledge-five').intent
  const drawing = buildFacadeFlowConstructionDrawing(intent, buildFacadeFlowConstructionGraph(intent))
  assert.deepEqual(drawing.fields.map(facadeFlowAiDrawingVisualToken), ['FIXED', 'TURN:LEFT', 'FIXED', 'TURN:RIGHT', 'FIXED'])

  const unresolvedIntent = interpretFacadeFlowPrompt('Прозорец 1000 x 1200 mm, едно поле, осово-откидно.', 'reference-knowledge-unresolved').intent
  const unresolvedDrawing = buildFacadeFlowConstructionDrawing(unresolvedIntent, buildFacadeFlowConstructionGraph(unresolvedIntent))
  assert.equal(unresolvedDrawing.fields.length, 1)
  assert.equal(facadeFlowAiDrawingVisualToken(unresolvedDrawing.fields[0]!), 'TILT_TURN:UNRESOLVED')
})
