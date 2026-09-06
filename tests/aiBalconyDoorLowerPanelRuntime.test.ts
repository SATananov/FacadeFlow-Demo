import assert from 'node:assert/strict'
import test from 'node:test'
import { interpretFacadeFlowPrompt } from '../src/aiPromptInterpreter'
import { buildFacadeFlowConstructionGraph } from '../src/aiConstructionGraph'
import { buildFacadeFlowConstructionDrawing } from '../src/aiConstructionDrawing'
import { buildFacadeFlowParametricConstructionProposal, humanReviewFacadeFlowParametricProposal } from '../src/aiParametricConstructionProposal'
import { buildFacadeFlowAi04ConstructorHandoff } from '../src/ai04ConstructorHandoff'

const prompt = 'Балконска врата, общ размер 900 x 2200 mm, едно високо отваряемо крило с ляво отваряне. В долната част има хоризонтален делител и долен непрозрачен панел с височина 500 mm. Горната част е остъклена. Изобрази лявото отваряне с правилния символ, хоризонталния делител и отделната долна панелна зона. Не измисляй непосочени профили или производствени размери.'

test('explicit single leaf is accepted as one-field topology without guessing from the door category', () => {
  const result = interpretFacadeFlowPrompt(prompt, 'balcony-lower-panel')
  assert.equal(result.intent.category, 'DOOR')
  assert.equal(result.intent.fields.length, 1)
  const field = result.intent.fields[0]!
  assert.equal(field.role, 'OPENING_SASH')
  assert.equal(field.openingType, 'TURN')
  assert.equal(field.openingDirection, 'LEFT')
})

test('lower panel semantics are bound inside the single door leaf', () => {
  const result = interpretFacadeFlowPrompt(prompt, 'balcony-lower-panel')
  const lowerPanel = result.intent.fields[0]!.lowerPanel
  assert.ok(lowerPanel)
  assert.equal(lowerPanel.semanticRole, 'LOWER_PANEL_ZONE')
  assert.equal(lowerPanel.dividerOrientation, 'HORIZONTAL')
  assert.equal(lowerPanel.heightMm, 500)
  assert.equal(lowerPanel.upperZoneRole, 'GLAZING')
  assert.equal(lowerPanel.lowerZoneRole, 'PANEL')
  assert.deepEqual(lowerPanel.unresolved, [])
})

test('construction graph and AI drawing preserve lower panel without converting it into a second top-level field', () => {
  const result = interpretFacadeFlowPrompt(prompt, 'balcony-lower-panel')
  const graph = buildFacadeFlowConstructionGraph(result.intent)
  assert.equal(graph.status, 'READY_FOR_HUMAN_REVIEW')
  assert.equal(graph.fieldCount, 1)
  assert.equal(graph.mullionCount, 0)
  const graphField = graph.root?.children.find((child) => child.kind === 'FIELD')
  assert.ok(graphField && graphField.kind === 'FIELD')
  assert.equal(graphField.lowerPanel?.heightMm, 500)

  const drawing = buildFacadeFlowConstructionDrawing(result.intent, graph)
  assert.equal(drawing.status, 'READY_FOR_HUMAN_REVIEW')
  assert.equal(drawing.fields.length, 1)
  assert.equal(drawing.fields[0]!.lowerPanel?.heightMm, 500)
  assert.equal(Number(drawing.fields[0]!.lowerPanel?.heightRatio?.toFixed(6)), 0.227273)
  assert.equal(drawing.automaticGeometryAllowed, false)
  assert.equal(drawing.machineReady, false)
  assert.equal(drawing.productionApproved, false)
})

test('AI03 proposal is visible but AI04 handoff blocks loss of the nested lower-panel geometry', () => {
  const result = interpretFacadeFlowPrompt(prompt, 'balcony-lower-panel')
  const proposal = buildFacadeFlowParametricConstructionProposal(result.intent)
  assert.deepEqual(proposal.blockers, [])
  assert.equal(proposal.fields.length, 1)
  assert.equal(proposal.fields[0]!.lowerPanel?.heightMm, 500)
  const reviewed = humanReviewFacadeFlowParametricProposal(proposal, { topologyChecked: true, assumptionsAccepted: true })
  const handoff = buildFacadeFlowAi04ConstructorHandoff(reviewed, [])
  assert.equal(handoff.status, 'BLOCKED')
  assert.equal(handoff.customProduct, null)
  assert.ok(handoff.blockers.some((item) => /долна панелна зона|хоризонтален делител/i.test(item)))
})

test('AI proposal renderer draws the internal divider and lower panel as nested visual semantics', async () => {
  const fs = await import('node:fs/promises')
  const panel = await fs.readFile('src/components/ParametricConstructionProposalPanel.tsx', 'utf8')
  assert.match(panel, /ff-ai03-lower-panel-zone/)
  assert.match(panel, /ff-ai03-internal-divider/)
  assert.match(panel, /ДОЛЕН ПАНЕЛ/)
  assert.doesNotMatch(panel, /REF-11|REF-15|productTemplates|getProductTemplate/)
})
