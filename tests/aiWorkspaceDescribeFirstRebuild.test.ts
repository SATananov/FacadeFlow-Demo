import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { interpretFacadeFlowPrompt } from '../src/aiPromptInterpreter'
import { buildFacadeFlowConstructionGraph } from '../src/aiConstructionGraph'
import { buildFacadeFlowConstructionDrawing } from '../src/aiConstructionDrawing'

const workspace = readFileSync('src/components/FacadeFlowAIWorkspace.tsx', 'utf8')
const promptPanel = readFileSync('src/components/PromptInterpretationPanel.tsx', 'utf8')

const sample = 'Прозорец PRELUDE 60, 1800 × 1400 mm, три полета. Средното е осово-откидно, лявото и дясното са фиксирани. Каса 482.30, крило 482.05, делители 482.21, двоен стъклопакет, черна дръжка, 2 панти.'

test('AI Workspace keeps product creation first and adds Quick Select beside Describe with AI', () => {
  const createIndex = workspace.indexOf('Създай изделието')
  const contextIndex = workspace.indexOf('Контекст и други входове')
  assert.ok(createIndex >= 0)
  assert.ok(contextIndex > createIndex)
  assert.match(workspace, /ff-ai-describe-first/)
  assert.match(workspace, /⚡ Бърз избор/)
  assert.match(workspace, /Опиши изделието с AI/)
  assert.match(workspace, /БЪРЗ ИЗБОР \/ AI<\/b><i>→<\/i><b>AI ЧЕРТЕЖ/)
  assert.match(workspace, /ИНСПЕКТОР НА ПРОФИЛ/)
  assert.match(workspace, /ИЗМЕРВАТЕЛНИ ОПОРИ/)
})

test('description-first sample resolves PRELUDE system and exact profile refs', () => {
  const result = interpretFacadeFlowPrompt(sample, 'describe-first-sample')
  assert.equal(result.intent.profiles.system, 'PRELUDE 60')
  assert.equal(result.intent.profiles.frame, '482.30')
  assert.equal(result.intent.profiles.sash, '482.05')
  assert.equal(result.intent.profiles.mullion, '482.21')
  assert.equal(result.intent.dimensions.widthMm, 1800)
  assert.equal(result.intent.dimensions.heightMm, 1400)
  assert.deepEqual(result.intent.fields.map((field) => field.role), ['FIXED', 'OPENING_SASH', 'FIXED'])
  assert.equal(result.intent.fields[1]?.openingType, 'TILT_TURN')
})

test('description-first sample reaches graph-driven conceptual AI drawing without production authority', () => {
  const result = interpretFacadeFlowPrompt(sample, 'describe-first-drawing')
  const graph = buildFacadeFlowConstructionGraph(result.intent)
  const drawing = buildFacadeFlowConstructionDrawing(result.intent, graph)
  assert.equal(graph.status, 'READY_FOR_HUMAN_REVIEW')
  assert.equal(drawing.status, 'READY_FOR_HUMAN_REVIEW')
  assert.equal(drawing.frame?.profileRef, '482.30')
  assert.deepEqual(drawing.fields.map((field) => field.semanticRole), ['FIXED_FIELD', 'OPENABLE_FIELD', 'FIXED_FIELD'])
  assert.deepEqual(drawing.mullions.map((item) => item.profileRef), ['482.21', '482.21'])
  assert.equal(drawing.automaticGeometryAllowed, false)
  assert.equal(drawing.exactProfileContourApplied, false)
  assert.equal(drawing.rulesValidated, false)
  assert.equal(drawing.machineReady, false)
  assert.equal(drawing.productionApproved, false)
})

test('prompt action explicitly couples interpretation to drawing while keeping local/no-network wording', () => {
  assert.match(promptPanel, /Разчети описанието и начертай/)
  assert.match(promptPanel, /ЛОКАЛНО РАЗЧИТАНЕ → AI ЧЕРТЕЖ/)
  assert.match(promptPanel, /без външен модел \/ без мрежа/)
  assert.match(promptPanel, /AUTOMATIC GEOMETRY: NO · RULES VALIDATED: NO · MACHINE READY: NO/)
})
