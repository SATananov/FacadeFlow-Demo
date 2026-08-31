import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { applyFacadeFlowAiDemoScenario, completeFacadeFlowDemoHumanReview, createFacadeFlowAiSession, prepareFacadeFlowDemoReviewPacket, setFacadeFlowDemoReviewAccepted } from '../src/aiWorkspaceState'
import { sampleCatalogueProfiles } from '../src/profileCatalogueData'

void test('06C.3.2.1 localizes unified DEMO pipeline labels without changing review enums', () => {
  const component = readFileSync('src/components/UnifiedDemoPipeline.tsx', 'utf8')
  assert.match(component, /ОБЩ DEMO ПРОЦЕС/)
  assert.match(component, /НУЖЕН ЧОВЕШКИ ПРЕГЛЕД/)
  assert.match(component, /ЧОВЕШКИ ПРЕГЛЕД · ГОТОВ/)
  assert.match(component, /Преход към конструктора/)
  assert.match(component, /AI ГЕНЕРИРАНО: НЕ/)
  assert.match(component, /ПРОИЗВОДСТВО: ЗАКЛЮЧЕНО/)
  assert.doesNotMatch(component, />Human Review</)
  assert.doesNotMatch(component, />Handoff</)
})

void test('06C.3.2.1 localizes current-product and gate-copy while retaining internal HUMAN states', () => {
  const workspace = readFileSync('src/components/FacadeFlowAIWorkspace.tsx', 'utf8')
  assert.match(workspace, /НУЖЕН ЧОВЕШКИ ПРЕГЛЕД/)
  assert.match(workspace, /ПОТВЪРДЕНО ОТ ЧОВЕК/)
  assert.match(workspace, /Човешки преглед \/ потвърждение/)
  assert.match(workspace, /прегледан пакет ≠ потвърдено изделие/)
  assert.match(workspace, /СИМУЛАЦИЯ · ГОТОВО ЗА МАШИНА: НЕ/)
})

void test('06C.3.2.1 replaces raw job type and MANUAL evidence in visible unified summaries', () => {
  const review = readFileSync('src/aiUnifiedReview.ts', 'utf8')
  assert.match(review, /SINGLE_PRODUCT: 'Единично изделие'/)
  assert.match(review, /Формуляр „Стъпка по стъпка“ · ръчно въведена проследимост/)
  assert.match(review, /без AI автоматично извеждане/)
  assert.match(review, /запис за проследимост/)
})

void test('06C.3.2.1 is display-only: HUMAN_REVIEWED still does not confirm the product or unlock production', () => {
  let session = prepareFacadeFlowDemoReviewPacket(applyFacadeFlowAiDemoScenario(createFacadeFlowAiSession('localized-review'), 'GUIDED_WINDOW', sampleCatalogueProfiles), sampleCatalogueProfiles)
  session = setFacadeFlowDemoReviewAccepted(session, true)
  session = completeFacadeFlowDemoHumanReview(session)
  assert.equal(session.job.reviewPacket?.status, 'HUMAN_REVIEWED')
  assert.equal(session.job.guidedProduct.status, 'NEEDS_REVIEW')
  assert.equal(session.productionApproved, false)
  assert.equal(session.job.machineReady, false)
})

void test('06C.3.2.1 introduces no network, persistence, automatic geometry or approval path', () => {
  const combined = ['src/components/UnifiedDemoPipeline.tsx', 'src/components/FacadeFlowAIWorkspace.tsx', 'src/aiUnifiedReview.ts'].map((path) => readFileSync(path, 'utf8')).join('\n')
  assert.doesNotMatch(combined, /fetch\s*\(|WebSocket\s*\(|localStorage|sessionStorage/)
  assert.doesNotMatch(combined, /machineReady\s*:\s*true|rulesValidated\s*:\s*true|automaticGeometryAllowed\s*:\s*true|productionApproved\s*:\s*true/)
})
