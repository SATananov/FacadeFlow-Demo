import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const workspace = readFileSync('src/components/FacadeFlowAIWorkspace.tsx', 'utf8')
const promptPanel = readFileSync('src/components/PromptInterpretationPanel.tsx', 'utf8')
const proposal = readFileSync('src/components/ParametricConstructionProposalPanel.tsx', 'utf8')
const inspector = readFileSync('src/components/TechnicalProfileInspector.tsx', 'utf8')
const zoomModal = readFileSync('src/components/TechnicalZoomModal.tsx', 'utf8')
const css = readFileSync('src/aiWorkspace.css', 'utf8')

test('AI and PRELUDE technical drawings share a CAD grid work surface and click-to-enlarge affordance', () => {
  assert.match(css, /\.ff-technical-grid/)
  assert.match(css, /background-size:20px 20px,20px 20px,100px 100px,100px 100px/)
  assert.match(proposal, /ff-ai03-drawing-stage ff-technical-grid/)
  assert.match(proposal, /Клик за увеличение/)
  assert.match(inspector, /ff-profile-catalogue-image ff-technical-grid/)
  assert.match(inspector, /Увеличи каталоговата скица/)
})

test('technical zoom modal provides zoom, fit, close and Escape controls without changing engineering data', () => {
  assert.match(zoomModal, /Управление на увеличението/)
  assert.match(zoomModal, /Побери/)
  assert.match(zoomModal, /Затвори/)
  assert.match(zoomModal, /event\.key === 'Escape'/)
  assert.match(proposal, /TechnicalZoomModal/)
  assert.match(inspector, /TechnicalZoomModal/)
})

test('profile inspector supports split/focus view and collapsible measurement anchors', () => {
  assert.match(inspector, /Разделен изглед/)
  assert.match(inspector, /Фокус върху скицата/)
  assert.match(inspector, /setAnchorsOpen/)
  assert.match(inspector, /Контурни точки: <b>НЕПОТВЪРДЕНИ<\/b>/)
  assert.match(inspector, /Координати: <b>НЯМА<\/b>/)
})

test('describe-first workspace compacts after analysis and keeps context/demo as collapsible secondary tools', () => {
  assert.match(workspace, /descriptionCollapsed/)
  assert.match(workspace, /Редактирай описанието/)
  assert.match(workspace, /setSecondaryOpen/)
  assert.match(workspace, /ff-ai-demo-collapsible-toggle/)
  assert.match(promptPanel, /onAnalysisComplete/)
})

test('right review panel can show a non-authoritative live preview directly from the current prompt interpretation', () => {
  assert.match(workspace, /interpretFacadeFlowPrompt/)
  assert.match(workspace, /ТЕКУЩ AI РАЗЧЕТ/)
  assert.match(workspace, /AI РАЗЧЕТ · ЗА ПРОВЕРКА/)
  assert.match(workspace, /Показано директно от текущия AI разчет/)
  assert.match(workspace, /Описание · основен AI вход/)
})

test('visible safety boundaries remain locked after visual polish', () => {
  assert.match(inspector, /data-safety="GEOMETRIC ANCHORS VALIDATED: NO · ASSEMBLY ANCHORS VALIDATED: NO · MACHINE READY: NO · PRODUCTION APPROVED: NO"/)
  assert.match(proposal, /НЕ Е ПРОИЗВОДСТВЕНА ГЕОМЕТРИЯ/)
  assert.match(workspace, /ГОТОВО ЗА МАШИНА: НЕ/)
})
