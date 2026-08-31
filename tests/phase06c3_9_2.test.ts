import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const dryRun = readFileSync('src/components/RealDataDryRun.tsx', 'utf8')
const aiWorkspace = readFileSync('src/components/FacadeFlowAIWorkspace.tsx', 'utf8')
const app = readFileSync('src/App.tsx', 'utf8')

test('06C.3.9.2 dry-run visible labels are Bulgarian while internal enums stay untouched', () => {
  for (const label of ['СТАТУС НА ВХОДА', 'КАРАНТИНА', 'АКТИВНИ ДАННИ', 'КОНТРОЛЕН ТЕСТ · УСПЕШЕН', 'ОСНОВА ЗА ДАННИТЕ · ГОТОВА ЗА ФИНАЛНА ПРОВЕРКА']) assert.match(dryRun, new RegExp(label))
  for (const raw of ['<span>INTAKE STATUS</span>', '<span>STAGING</span>', '<span>ACTIVE DATA</span>', '<span>DRY RUN PASS</span>', 'DATA FOUNDATION · ГОТОВА ЗА ФИНАЛЕН ACCEPTANCE']) assert.equal(dryRun.includes(raw), false)
})

test('06C.3.9.2 raw DEMO enum values are localized for human display without changing stored source values', () => {
  assert.match(dryRun, /recordKind.*PRODUCT.*ИЗДЕЛИЕ/s)
  assert.match(dryRun, /productType.*WINDOW.*ПРОЗОРЕЦ/s)
  assert.match(dryRun, /localizedDryRunValue\(mapping\.fieldId, mapping\.sourceValue\)/)
})

test('06C.3.9.2 AI header uses contextual Back label instead of claiming a fixed FacadeFlow home destination', () => {
  assert.match(aiWorkspace, /backLabel="Назад"/)
})

test('06C.3.9.2 closing top-level AI restores the previous main workspace scroll position', () => {
  assert.match(app, /aiReturnScrollYRef/)
  assert.match(app, /openAiWorkspaceFromMain/)
  assert.match(app, /window\.scrollTo\(\{ top: aiReturnScrollYRef\.current, behavior: 'auto' \}\)/)
  assert.match(app, /onClose=\{closeAiWorkspaceToPrevious\}/)
})

test('06C.3.9.2 child workspaces opened from AI return to AI instead of falling through to the main start screen', () => {
  assert.match(app, /drawingImportOrigin === 'AI'\) setShowAiWorkspace\(true\)/)
  assert.match(app, /profileCatalogueOrigin === 'AI'\) setShowAiWorkspace\(true\)/)
  assert.match(app, /customDesignerOrigin === 'AI'\) setShowAiWorkspace\(true\)/)
  assert.match(app, /setDrawingImportOrigin\('AI'\)/)
  assert.match(app, /setProfileCatalogueOrigin\('AI'\)/)
  assert.match(app, /setCustomDesignerOrigin\('AI'\)/)
})

test('06C.3.9.2 navigation cleanup does not add persistence or machine activation paths', () => {
  assert.doesNotMatch(app, /localStorage|sessionStorage|fetch\(|XMLHttpRequest|WebSocket/)
  assert.match(dryRun, /АКТИВНИ ДАННИ: 0/)
  assert.match(dryRun, /ГОТОВО ЗА МАШИНА: НЕ/)
})
