import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const promptPanel = readFileSync('src/components/PromptInterpretationPanel.tsx', 'utf8')
const documentPanel = readFileSync('src/components/ProjectDocumentIntelligencePanel.tsx', 'utf8')
const proposalPanel = readFileSync('src/components/ParametricConstructionProposalPanel.tsx', 'utf8')
const workspace = readFileSync('src/components/FacadeFlowAIWorkspace.tsx', 'utf8')

test('AI03 workspace integration respects the QA02 single-workflow routing contract', () => {
  // Normal free-text prompt route is now canonical REAL USER WORKFLOW V1 -> V2-V6.
  assert.match(promptPanel, /RealUserWorkflowV2ToV6Panel/)
  assert.doesNotMatch(promptPanel, /intent=\{result\.intent\}/)

  // Direct structured quick input intentionally retains the explicit AI03 proposal panel.
  assert.match(promptPanel, /ParametricConstructionProposalPanel/)
  assert.match(promptPanel, /intent=\{quickIntent\}/)

  // Document intelligence remains an explicit AI03 proposal route.
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
