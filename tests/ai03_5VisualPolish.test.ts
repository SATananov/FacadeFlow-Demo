import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const css = readFileSync('src/aiWorkspace.css', 'utf8')
const proposalPanel = readFileSync('src/components/ParametricConstructionProposalPanel.tsx', 'utf8')

test('AI03.5 makes document intelligence span the full mode-panel width', () => {
  assert.match(css, /\.ff-ai-document-mode>\.ff-ai-document-intelligence\{grid-column:1\/-1/)
})

test('AI03.5 uses a compact Bulgarian proposal header and status labels', () => {
  assert.match(proposalPanel, /AI03 · ПАРАМЕТРИЧНО ПРЕДЛОЖЕНИЕ/)
  assert.match(proposalPanel, /Нуждае се от преглед/)
  assert.match(proposalPanel, /Прегледано от човек/)
  assert.match(proposalPanel, /ФИКСИРАНО/)
})

test('AI03.5 renders friendly geometry basis text instead of the internal enum', () => {
  assert.match(proposalPanel, /Равномерно разпределение \(предложение\)/)
  assert.match(proposalPanel, /Делители от доказателствата/)
  assert.match(proposalPanel, /Доказателства/)
})

test('AI03.5 keeps the AI03 authority boundary in source while presenting it in Bulgarian', () => {
  assert.match(proposalPanel, /AUTO-GENERATED PROPOSAL: YES/)
  assert.match(proposalPanel, /AUTOMATIC ACCEPTANCE: NO/)
  assert.match(proposalPanel, /CONSTRUCTOR HANDOFF: NO/)
  assert.match(proposalPanel, /Готово за машина: НЕ/)
})
