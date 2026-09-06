import assert from 'node:assert/strict'
import test from 'node:test'
import { buildFacadeFlowConstructionGraph } from '../src/aiConstructionGraph'
import { buildFacadeFlowConstructionDrawing } from '../src/aiConstructionDrawing'
import { resolveFacadeFlowAiDrawingVisualGrammar } from '../src/aiDrawingVisualGrammar'
import { buildFacadeFlowParametricConstructionProposal } from '../src/aiParametricConstructionProposal'
import { interpretFacadeFlowPrompt } from '../src/aiPromptInterpreter'

const slidingConstruction = 'Плъзгаща конструкция, общ размер 2400 x 1400 mm, две вертикални полета. Лявото поле се плъзга надясно, дясното поле се плъзга наляво. Изобрази конструкцията като две плъзгащи се крила с противоположни стрелки. Не използвай символи за стандартно ляво/дясно отваряне с триъгълници.'

test('generic sliding construction is normalized without inventing window or door family', () => {
  const result = interpretFacadeFlowPrompt(slidingConstruction, 'sliding-combined')
  assert.equal(result.intent.category, 'COMBINED')
  assert.equal(result.intent.fields.length, 2)
  assert.deepEqual(result.intent.fields.map((field) => field.role), ['SLIDING_SASH', 'SLIDING_SASH'])
  assert.deepEqual(result.intent.fields.map((field) => field.openingType), ['SLIDING', 'SLIDING'])
  assert.deepEqual(result.intent.fields.map((field) => field.openingDirection), ['RIGHT', 'LEFT'])
})

test('sliding combined family passes AI03 proposal gate as conceptual human-review geometry', () => {
  const intent = interpretFacadeFlowPrompt(slidingConstruction, 'sliding-proposal').intent
  const proposal = buildFacadeFlowParametricConstructionProposal(intent)
  assert.equal(proposal.status, 'NEEDS_REVIEW')
  assert.equal(proposal.blockers.some((item) => /само за прозорец|прозорец или врата/i.test(item)), false)
  assert.equal(proposal.machineReady, false)
  assert.equal(proposal.productionApproved, false)
})

test('sliding drawing uses arrows with field-bound opposite directions', () => {
  const intent = interpretFacadeFlowPrompt(slidingConstruction, 'sliding-drawing').intent
  const graph = buildFacadeFlowConstructionGraph(intent)
  const drawing = buildFacadeFlowConstructionDrawing(intent, graph)
  assert.equal(drawing.status, 'READY_FOR_HUMAN_REVIEW')
  assert.deepEqual(drawing.fields.map((field) => field.semanticRole), ['SLIDING_FIELD', 'SLIDING_FIELD'])
  assert.deepEqual(drawing.fields.map((field) => resolveFacadeFlowAiDrawingVisualGrammar(field).sideDirection), ['RIGHT', 'LEFT'])
  assert.ok(drawing.fields.every((field) => resolveFacadeFlowAiDrawingVisualGrammar(field).showSlidingArrow))
  assert.ok(drawing.fields.every((field) => !resolveFacadeFlowAiDrawingVisualGrammar(field).composerDirection))
})

test('explicit sliding window and sliding door keep their base family while using sliding semantics', () => {
  const windowIntent = interpretFacadeFlowPrompt('Плъзгащ прозорец 2000 x 1300 mm, две полета. Лявото поле се плъзга надясно, дясното поле се плъзга наляво.', 'slide-window').intent
  const doorIntent = interpretFacadeFlowPrompt('Плъзгаща врата 2200 x 2200 mm, две полета. Лявото поле се плъзга надясно, дясното поле се плъзга наляво.', 'slide-door').intent
  assert.equal(windowIntent.category, 'WINDOW')
  assert.equal(doorIntent.category, 'DOOR')
  assert.deepEqual(windowIntent.fields.map((field) => field.role), ['SLIDING_SASH', 'SLIDING_SASH'])
  assert.deepEqual(doorIntent.fields.map((field) => field.role), ['SLIDING_SASH', 'SLIDING_SASH'])
})

test('sliding direction is not invented when the prompt omits it', () => {
  const intent = interpretFacadeFlowPrompt('Плъзгаща конструкция 2400 x 1400 mm, две вертикални полета. Лявото поле е плъзгащо. Дясното поле е плъзгащо.', 'slide-unresolved').intent
  assert.deepEqual(intent.fields.map((field) => field.role), ['SLIDING_SASH', 'SLIDING_SASH'])
  assert.deepEqual(intent.fields.map((field) => field.openingDirection), [undefined, undefined])
  const proposal = buildFacadeFlowParametricConstructionProposal(intent)
  assert.equal(proposal.status, 'NEEDS_REVIEW')
  assert.ok(proposal.warnings.some((item) => /Посоката на плъзгане за поле 1/i.test(item)))
  assert.ok(proposal.warnings.some((item) => /Посоката на плъзгане за поле 2/i.test(item)))
})

test('AI drawing UI keeps sliding arrows separate from turn triangles', async () => {
  const fs = await import('node:fs/promises')
  const source = await fs.readFile('src/components/ParametricConstructionProposalPanel.tsx', 'utf8')
  assert.match(source, /ff-ai03-sliding-arrow/)
  assert.match(source, /visual\.showSlidingArrow/)
  assert.match(source, /resolveFacadeFlowAiDrawingVisualGrammar/)
})
