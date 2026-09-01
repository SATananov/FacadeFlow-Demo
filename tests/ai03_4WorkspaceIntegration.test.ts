import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const promptPanel = readFileSync('src/components/PromptInterpretationPanel.tsx', 'utf8')
const documentPanel = readFileSync('src/components/ProjectDocumentIntelligencePanel.tsx', 'utf8')
const proposalPanel = readFileSync('src/components/ParametricConstructionProposalPanel.tsx', 'utf8')
const workspace = readFileSync('src/components/FacadeFlowAIWorkspace.tsx', 'utf8')

test('AI03 proposal UI is integrated into both prompt and document intelligence routes', () => {
  assert.match(promptPanel, /ParametricConstructionProposalPanel/)
  assert.match(promptPanel, /intent=\{result\.intent\}/)
  assert.match(documentPanel, /ParametricConstructionProposalPanel/)
  assert.match(documentPanel, /intent=\{selectedGroup\.mergedIntent\}/)
})

test('AI03 UI states proposal authority boundaries visibly', () => {
  assert.match(proposalPanel, /AUTO-GENERATED PROPOSAL: YES/)
  assert.match(proposalPanel, /AUTOMATIC ACCEPTANCE: NO/)
  assert.match(proposalPanel, /CONSTRUCTOR HANDOFF: NO/)
  assert.match(proposalPanel, /RULES VALIDATED: NO/)
  assert.match(proposalPanel, /MACHINE READY: NO/)
  assert.match(workspace, /Няма автоматично приемане или handoff на геометрия/)
})
