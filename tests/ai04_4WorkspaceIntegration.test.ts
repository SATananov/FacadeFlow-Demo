import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const read = (filePath: string) => fs.readFileSync(path.resolve(process.cwd(), filePath), 'utf8')

test('AI04 UI exposes handoff only from HUMAN_REVIEWED proposal with a separate acknowledgement', () => {
  const panel = read('src/components/ParametricConstructionProposalPanel.tsx')
  assert.match(panel, /proposal\.status === 'HUMAN_REVIEWED'/)
  assert.match(panel, /ЕКСПЛИЦИТЕН ПРЕХОД КЪМ РЕДАКТИРУЕМА ГЕОМЕТРИЯ/)
  assert.match(panel, /handoffAcknowledged/)
  assert.match(panel, /AUTOMATIC CONSTRUCTOR HANDOFF: NO/)
})

test('AI04 is wired from AI workspace to App and opens Custom Product Designer draft', () => {
  const workspace = read('src/components/FacadeFlowAIWorkspace.tsx')
  const app = read('src/App.tsx')
  assert.match(workspace, /onOpenAi04Constructor/)
  assert.match(app, /buildFacadeFlowAi04ConstructorHandoff/)
  assert.match(app, /setCustomProduct\(handoff\.customProduct\)/)
  assert.match(app, /setShowCustomDesigner\(true\)/)
})

test('Custom Product Designer visibly preserves AI04 provenance and safety status', () => {
  const designer = read('src/components/CustomProductDesigner.tsx')
  assert.match(designer, /AI04 · РЕДАКТИРУЕМА ГЕОМЕТРИЯ ОТ ЧОВЕШКИ ПРЕГЛЕДАНО ПРЕДЛОЖЕНИЕ/)
  assert.match(designer, /Правила валидирани/)
  assert.match(designer, /Готово за машина/)
})
