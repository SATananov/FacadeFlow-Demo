import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const aiSource = read('src/components/FacadeFlowAIWorkspace.tsx')
const aiCss = read('src/aiWorkspace.css')
const headerSource = read('src/components/FacadeFlowWorkspaceHeader.tsx')
const workspaceCss = read('src/workspaceShell.css')
const aiStateSource = read('src/aiWorkspaceState.ts')
const aiTypesSource = read('src/aiWorkspaceTypes.ts')

test('06B.2 polish keeps the AI safety rail compact, technical and horizontally accessible', () => {
  assert.match(aiSource, /className="ff-ai-status-rail"/)
  assert.match(aiSource, /AI модел:\s*<b>НЕ Е СВЪРЗАН<\/b>/)
  assert.match(aiSource, /Източници:\s*<b>ЗАДЪЛЖИТЕЛНИ<\/b>/)
  assert.match(aiSource, /Човешка проверка:\s*<b>ЗАДЪЛЖИТЕЛНА<\/b>/)
  assert.match(aiSource, /Проверка по правила:\s*<b>ЗАДЪЛЖИТЕЛНА<\/b>/)
  assert.match(aiSource, /Готово за машина:\s*<b>\{session\.productionApproved \? 'ДА' : 'НЕ'\}<\/b>/)
  assert.match(aiCss, /\.ff-ai-status-rail\{[^}]*grid-template-columns:repeat\(5,minmax\(150px,1fr\)\)[^}]*overflow-x:auto/)
  assert.match(aiCss, /@media\(max-width:980px\)/)
  assert.match(aiCss, /\.ff-ai-status-rail\{display:flex\}/)
  assert.match(aiCss, /\.ff-ai-status-rail span\{min-width:165px;flex:0 0 auto\}/)
})

test('06B.2 polish integrates the Human Gate as a dark CAD inspector', () => {
  assert.match(aiSource, /<aside className="ff-ai-review-column">/)
  assert.match(aiSource, /AI → ЧОВЕШКА ПРОВЕРКА/)
  assert.match(aiSource, /Човешко потвърждение/)
  assert.match(aiSource, /Проверка по правила/)
  assert.match(aiCss, /\.ff-ai-review-column\{[^}]*background:linear-gradient\(180deg,#0d232b 0%,#0a1d24 100%\)[^}]*border-left:1px solid #31515b/)
  assert.match(aiCss, /\.ff-ai-gate-list li\.done\{[^}]*border-color:#2e6e68[^}]*background:#102f34/)
  assert.match(aiCss, /\.ff-ai-review-rules\{[^}]*border-left:3px solid #e57a31/)
})

test('06B.2 polish preserves readable job cards and the FacadeFlow cyan plus orange selected language', () => {
  assert.match(aiSource, /className={`ff-ai-job-card \$\{selected \? 'selected' : ''\}`}/)
  assert.match(aiCss, /\.ff-ai-job-grid p\{color:#a2b7bc\}/)
  assert.match(aiCss, /\.ff-ai-job-grid small\{color:#a4b7bc\}/)
  assert.match(aiCss, /button\.ff-ai-job-card\.selected\{[^}]*border-color:#35bdcd!important[^}]*box-shadow:inset 0 -3px #e87329/)
})

test('06B.2 polish keeps the supplied Nadezhda logo asset unchanged and visually subordinate', () => {
  assert.match(headerSource, /src="\/branding\/nadezhda-header\.png"/)
  assert.match(headerSource, /className="ff-workspace-company-logo"/)
  assert.match(workspaceCss, /\.ff-workspace-company-logo\{width:126px;height:54px;object-fit:contain/)
  assert.doesNotMatch(headerSource, /canvas|filter:|transform:|data:image/i)
})

test('06B.2 polish moves the review inspector below intake instead of hiding it at narrower widths', () => {
  assert.match(aiCss, /@media\(max-width:980px\)\{\.ff-ai-main\{grid-template-columns:1fr\}/)
  assert.match(aiCss, /\.ff-ai-review-column\{border-left:0;border-top:1px solid #31515b/)
  assert.match(aiCss, /@media\(max-width:980px\)\{\.ff-ai-review-column\{position:static;top:auto;align-self:stretch\}\}/)
  assert.doesNotMatch(aiCss, /@media\(max-width:980px\)[^{]*\{[^}]*\.ff-ai-review-column\{[^}]*display:none/)
})

test('06B.2 visual polish does not relax AI or production safety boundaries', () => {
  assert.match(aiStateSource, /aiModelStatus:\s*'NOT_CONNECTED'/)
  assert.match(aiStateSource, /humanReviewRequired:\s*true/)
  assert.match(aiStateSource, /rulesValidationRequired:\s*true/)
  assert.match(aiStateSource, /automaticGeometryAllowed:\s*false/)
  assert.match(aiStateSource, /sourceEvidenceRequired:\s*true/)
  assert.match(aiStateSource, /productionApproved:\s*false/)
  assert.match(aiStateSource, /machineReady:\s*false/)
  assert.match(aiTypesSource, /machineReady:\s*false/)
  assert.match(aiTypesSource, /automaticGeometryAllowed:\s*false/)
  assert.match(aiTypesSource, /productionApproved:\s*false/)
})
