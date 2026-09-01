import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createFacadeFlowAiSession, selectFacadeFlowAiInputMode, selectFacadeFlowJobType } from '../src/aiWorkspaceState'

const workspace = () => readFileSync('src/components/FacadeFlowAIWorkspace.tsx', 'utf8')
const css = () => readFileSync('src/aiWorkspace.css', 'utf8')

test('06C.1.1 keeps every flexible job context including direct single-product work', () => {
  const source = workspace()
  assert.match(source, /Единично изделие/)
  assert.match(source, /ff-ai-context-strip/)
  assert.match(source, /jobTypes\.map/)
})

test('06C.1.1 selecting a context can enter the guided description mode immediately without changing state contracts', () => {
  const base = createFacadeFlowAiSession('phase06c1_1')
  const guided = selectFacadeFlowAiInputMode(selectFacadeFlowJobType(base, 'SINGLE_PRODUCT'), 'DESCRIPTION')
  assert.equal(guided.job.jobType, 'SINGLE_PRODUCT')
  assert.equal(guided.job.inputMode, 'DESCRIPTION')
  assert.equal(guided.aiModelStatus, 'NOT_CONNECTED')
  assert.equal(guided.automaticGeometryAllowed, false)
  assert.equal(guided.productionApproved, false)
})

test('06C.1.1 UI auto-opens the guided mode and preserves all four alternative input modes', () => {
  const source = workspace()
  assert.match(source, /selectFacadeFlowAiInputMode\(selectFacadeFlowJobType\(current, jobType\), 'DESCRIPTION'\)/)
  assert.match(source, /ff-ai-input-switcher/)
  for (const mode of ['DOCUMENTS', 'DESCRIPTION', 'SKETCH', 'MANUAL']) assert.match(source, new RegExp(mode))
})

test('06C.1.1 right inspector is a live product summary before proposal creation', () => {
  const source = workspace()
  for (const label of ['ТЕКУЩО ИЗДЕЛИЕ', 'Система', 'Каса', 'Крило', 'Делител', 'Отваряемост', 'Цвят', 'Стъкло / пълнеж']) assert.match(source, new RegExp(label))
  assert.match(source, /guidedProductCompletion/)
  assert.match(source, /guidedProductUnresolved/)
  assert.match(source, /НЕПОТВЪРДЕНО/)
  assert.match(source, /СИМУЛАЦИЯ · ГОТОВО ЗА МАШИНА: НЕ/)
})

test('06C.1.1 replaces oversized context cards with responsive compact controls', () => {
  const styles = css()
  assert.match(styles, /PHASE 06C\.1\.1 — DIRECT GUIDED PRODUCT UX/)
  assert.match(styles, /\.ff-ai-context-strip/)
  assert.match(styles, /\.ff-ai-input-switcher/)
  assert.match(styles, /\.ff-ai-live-product/)
  assert.match(styles, /@media\(max-width:720px\)/)
})

test('06C.1.1 preserves the locked 06B.2 visual contract while changing the layout', () => {
  const source = workspace()
  assert.match(source, /AiBlueprintPreview/)
  assert.match(source, /className={`ff-ai-job-card \$\{selected \? 'selected' : ''\}`}/)
  assert.match(source, /ff-ai-input-icon/)
})

test('06C.1.1 adds no network, persistence, AI inference or machine-output behavior', () => {
  const source = workspace()
  assert.doesNotMatch(source, /fetch\(|WebSocket|XMLHttpRequest|localStorage|indexedDB/i)
  assert.match(source, /AI моделът още не е свързан/)
  assert.match(source, /MACHINE READY: NO/)
})
