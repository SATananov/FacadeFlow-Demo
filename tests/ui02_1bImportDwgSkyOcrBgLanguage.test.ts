import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) => readFileSync(path, 'utf8')
const chooser = read('src/components/ImportFormatChooser.tsx')
const foundation = read('src/components/FoundationSourceInspection.tsx')
const routes = read('src/importFormatRoutes.ts')
const skyWorkspace = read('src/components/SkyGlazingImportWorkspace.tsx')
const skySummary = read('src/components/SkyGlazingSourceSummary.tsx')
const skyComparison = read('src/components/SkyGlazingComparisonTable.tsx')
const dwgWorkspace = read('src/components/DwgViewerWorkspace.tsx')
const dwgToolbar = read('src/components/DwgViewerToolbar.tsx')
const dwgEditor = read('src/components/DwgVisualTextEditorPanel.tsx')
const dwgManual = read('src/components/DwgManualCorrectionPanel.tsx')
const dwgPreparation = read('src/components/DwgSectionPreparationPanel.tsx')
const dwgDraft = read('src/components/DwgSectionDraftPanel.tsx')
const drawingImport = read('src/components/DrawingImportWorkspace.tsx')
const ocrPanel = read('src/components/OcrSuggestionsPanel.tsx')
const combined = read('src/components/CombinedAnalysisReview.tsx')
const provisional = read('src/components/ProvisionalProductDraft.tsx')
const combinedService = read('src/combinedAnalysisService.ts')
const labels = read('src/importUiLabels.ts')
const signatureInspection = read('src/importSignatureInspection.ts')
const importInspection = read('src/importInspection.ts')
const skyXml = read('src/skyGlazingXmlInspection.ts')
const skyLte = read('src/skyGlazingLteInspection.ts')
const dwgNormalization = read('src/dwgEntityNormalization.ts')
const dwgDecoder = read('src/libreDwgDecoder.ts')
const dwgWorker = read('src/workers/dwgDecodeWorker.ts')

const importPresentation = [chooser, foundation, routes, skyWorkspace, skySummary, skyComparison, dwgWorkspace, dwgToolbar, dwgEditor, dwgManual, dwgPreparation, dwgDraft, drawingImport, ocrPanel, combined, provisional].join('\n')

test('UI02.1B presents import route and source support labels in Bulgarian', () => {
  for (const marker of [
    'XML / LTE — САМО ЗА ПРЕГЛЕД',
    'DWG — ВЪТРЕШЕН ПРЕГЛЕД',
    'само за преглед',
    'Статус на поддръжка',
    'SkyGlazing XML',
    'Неразпознат формат',
  ]) assert.ok([routes, chooser, foundation, labels].join('\n').includes(marker), marker)
  assert.ok(foundation.includes('detectedImportFormatLabels[session.detectedFormat]'))
  assert.ok(foundation.includes('importSupportStatusLabels[session.supportStatus]'))
})

test('UI02.1B presents SkyGlazing review-only workflow without raw English status enums', () => {
  for (const marker of [
    'САМО ЗА ПРЕГЛЕД · ЛОКАЛНО',
    'безопасно извличане само за преглед',
    'Профилна стойност',
    'Сурова стойност за дължина',
    'Само проверка за преглед.',
    'СИМУЛАЦИЯ · локално доказателство само за преглед · без машинен изход',
    'Неразрешено',
  ]) assert.ok([skyWorkspace, skySummary, skyComparison, labels].join('\n').includes(marker), marker)
  assert.ok(skySummary.includes('detectedImportFormatLabels[source.detectedFormat]'))
  assert.ok(skyComparison.includes('skyComparisonStatusLabels[item.status]'))
  assert.equal(skyComparison.includes('>{item.status}<'), false)
})

test('UI02.1B presents DWG workspace and visual editor actions in Bulgarian', () => {
  for (const marker of [
    'DWG · САМО ЗА ЧЕТЕНЕ · ЛОКАЛНО',
    'изолиран работен процес в браузъра',
    'качване, преобразуване или експортиране',
    'Ширина от източника',
    'САМО ВИЗУАЛНО',
    'Отмени',
    'Възстанови изходния текст',
    'плъзгане',
    'ЧЕРНОВА · САМО В ТЕКУЩАТА СЕСИЯ',
  ]) assert.ok([dwgWorkspace, dwgEditor, dwgDraft].join('\n').includes(marker), marker)
  assert.ok(dwgToolbar.includes("layout.id === 'MODEL' ? 'Модел' : layout.name"))
  assert.ok(dwgWorker.includes('Зареждане на локалния DWG декодер…'))
  assert.ok(dwgDecoder.includes('Изолираният DWG работен процес приключи неочаквано.'))
  assert.equal(dwgEditor.includes('>Undo<'), false)
  assert.equal(dwgEditor.includes('VISUAL ONLY'), false)
})

test('UI02.1B keeps Paper Space and model identifiers technical but explains them in Bulgarian', () => {
  assert.ok(dwgWorkspace.includes('листово пространство (Paper Space)'))
  assert.ok(dwgNormalization.includes('Липсват обекти и данни за изгледа на Paper Space от текущия декодер.'))
  assert.ok(dwgNormalization.includes("{ id: 'MODEL', name: 'Model', modelSpace: true"))
})

test('UI02.1B presents OCR job, candidate, target-field and audit labels through Bulgarian mappings', () => {
  for (const marker of ['Журнал на OCR проверките', 'структурен анализ', 'Потвърдено от човек:', 'Английски / латиница / числа']) assert.ok(ocrPanel.includes(marker), marker)
  for (const mapping of ['ocrJobStateLabels[job.state]', 'ocrCandidateTypeLabels[candidate.type]', 'ocrCandidateStatusLabels[candidate.status]', 'ocrTargetFieldLabels[entry.appliedField]']) assert.ok(ocrPanel.includes(mapping), mapping)
  assert.ok(drawingImport.includes('ocrTargetFieldLabels[field]'))
  assert.ok(drawingImport.includes('ocrProgressStatusBg(message)'))
  assert.equal(drawingImport.includes("useState('READY')"), false)
  assert.ok(combinedService.includes('Извличане на демонстрационни геометрични признаци…'))
  assert.ok(combinedService.includes('ocrProgressStatusBg(status)'))
  assert.ok(drawingImport.includes("source.metadata.kind === 'PDF' ? 'PDF' : 'Изображение'"))
  assert.equal(ocrPanel.includes('<dd>{job.state}</dd>'), false)
})

test('UI02.1B presents captured-import workflow statuses and actions in Bulgarian', () => {
  for (const marker of ['ГРЕШКА:', 'ОБРАБОТКА:', 'ЗАВЪРШЕНО:', 'ПРЕКРАТЕНО:', 'Изисква проверка', 'Зареди в работния поток', 'Експортирай симулационен JSON']) assert.ok(drawingImport.includes(marker), marker)
  for (const oldPhrase of ['FAILED:', 'PROCESSING:', 'COMPLETED:', 'CANCELLED:', 'import simulation JSON']) assert.equal(drawingImport.includes(oldPhrase), false, oldPhrase)
  assert.ok(drawingImport.includes('statusLabels[item.status]'))
})

test('UI02.1B presents combined analysis and provisional draft review terminology in Bulgarian', () => {
  for (const marker of [
    'Доказателство от източника',
    'Суров OCR резултат',
    'Предложено изделие',
    'Разбивка на оценката',
    'Предложени данни',
    'Увереност на OCR',
    'Журнал на комбинирания анализ',
    'за преглед',
    'Получено от разпознаване: ДА',
    'Автоматично попълнено: ДА',
    'Проверено от човек: НЕ',
  ]) assert.ok([combined, provisional].join('\n').includes(marker), marker)
  for (const oldPhrase of ['Source evidence', 'Raw OCR evidence', 'Proposed product', 'Feature breakdown', 'Proposed data', 'OCR confidence', 'Combined audit']) assert.equal([combined, provisional].join('\n').includes(oldPhrase), false, oldPhrase)
})

test('UI02.1B returns Bulgarian safe-inspection warnings while retaining technical format names', () => {
  for (const marker of [
    'само за преглед',
    'неразрешено',
    'Полето Generator не е SkyGlazing',
  ]) assert.ok([signatureInspection, importInspection, skyXml, skyLte].join('\n').toLocaleLowerCase('bg-BG').includes(marker.toLocaleLowerCase('bg-BG')), marker)
  for (const technical of ['DWG', 'DXF', 'XML', 'LTE', 'PDF', 'OCR', 'SHA-256']) assert.ok(importPresentation.includes(technical) || [signatureInspection, importInspection, skyXml, skyLte].join('\n').includes(technical), technical)
})

test('UI02.1B changes presentation only and keeps import/OCR/DWG safety contracts locked', () => {
  const contracts = [
    read('src/importFormatTypes.ts'),
    read('src/ocrTypes.ts'),
    read('src/combinedAnalysisTypes.ts'),
    read('src/dwgViewerTypes.ts'),
    read('src/dwgSectionDraft.ts'),
    read('src/drawingImportTypes.ts'),
    labels,
  ].join('\n')
  for (const required of ['SUPPORTED_FOR_VIEW_ONLY', 'NEEDS_REVIEW', 'VERIFIED', 'SUGGESTED', 'ACCEPTED', 'REJECTED', 'machineReady: false']) assert.ok(contracts.includes(required), required)
  for (const forbidden of ['machineReady: true', 'productionApproved: true', 'productionExecutable: true']) assert.equal(importPresentation.includes(forbidden), false, forbidden)
  for (const network of ['fetch(', 'XMLHttpRequest', 'WebSocket(', 'localStorage.', 'indexedDB']) assert.equal(importPresentation.includes(network), false, network)
})
