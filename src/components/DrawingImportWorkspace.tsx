import { useEffect, useMemo, useRef, useState } from 'react'
import { exportDrawingImportSimulation } from '../drawingImportExport'
import { prepareDrawingSource, releaseDrawingSource } from '../drawingImportFile'
import type { CapturedDrawingProduct, DrawingImportLimits, DrawingProductDraft, DrawingReviewStatus, DrawingSourceFile } from '../drawingImportTypes'
import { defaultDrawingImportLimits, validateDrawingDraft } from '../drawingImportValidation'
import type { ProductParameters, ProductType } from '../productTypes'
import { getProductTemplate, productTemplates, templateCategoryLabels } from '../productTemplates'
import { DrawingSourceViewer, type DrawingSourceViewerController } from './DrawingSourceViewer'
import { OcrSuggestionsPanel } from './OcrSuggestionsPanel'
import { createOcrAudit } from '../ocrAudit'
import { parseDimensionCandidates } from '../ocrCandidates'
import { ocrLimits } from '../ocrLimits'
import { runLocalOcr, type OcrRunControl } from '../ocrService'
import type { OcrAuditEntry, OcrCandidate, OcrJob, OcrSelection, OcrTargetField } from '../ocrTypes'
import { CombinedAnalysisReview, type CombinedApplication } from './CombinedAnalysisReview'
import { runCombinedAnalysis } from '../combinedAnalysisService'
import type { CombinedAnalysisJob, CombinedAuditEntry, CombinedCandidate } from '../combinedAnalysisTypes'
import { combinedAudit } from '../combinedAudit'
import { generateProvisionalDraft, type RecognitionDerivedDraft } from '../combinedProvisionalDraft'
import { ProvisionalProductDraft } from './ProvisionalProductDraft'
import { ImportFormatChooser } from './ImportFormatChooser'
import { FoundationSourceInspection } from './FoundationSourceInspection'
import { formatCardFor } from '../importFormatRoutes'
import type { ImportRoute, UnifiedSourceSession } from '../importFormatTypes'
import { inspectImportFile } from '../importInspection'
import { dispatchInspectedSource } from '../importRouteDispatch'
import { createSourceSession } from '../sourceSession'
import { ContextHelp } from './ContextHelp'

interface Props {
  baseProduct: ProductParameters
  onPreview: (product: ProductParameters, project: string) => void
  onLoadVerified: (product: CapturedDrawingProduct) => boolean
  onClose: () => void
}

const statusLabels: Record<DrawingReviewStatus, string> = { DRAFT: 'Чернова', NEEDS_REVIEW: 'Изисква проверка', VERIFIED: 'Проверено' }
const productCategoryLabels: Record<ProductType, string> = { fixed: 'Фиксирано', single: 'Еднокрилно', double: 'Двукрилно', mixed: 'Смесено', triple: 'Триполно', 'four-field': 'Четириполно' }
const blankDraft = (page = 1): DrawingProductDraft => ({ projectReference: '', sourcePage: page, productReference: '', productCategory: 'fixed', templateId: 'REF-01', width: 1400, height: 1200, quantity: 1, notes: '', drawingPosition: '', status: 'DRAFT' })
const toProduct = (draft: DrawingProductDraft, base: ProductParameters): ProductParameters => ({ ...base, templateId: draft.templateId, type: getProductTemplate(draft.templateId).category, width: draft.width, height: draft.height })

export function DrawingImportWorkspace({ baseProduct, onPreview, onLoadVerified, onClose }: Props) {
  const modal = useRef<HTMLElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const ocrControl = useRef<OcrRunControl | null>(null)
  const drawingViewer = useRef<DrawingSourceViewerController>(null)
  const currentOcrJobId = useRef<string | null>(null)
  const cancelledOcrJobs = useRef(new Set<string>())
  const [limits, setLimits] = useState<DrawingImportLimits>(defaultDrawingImportLimits)
  const [selectedRoute, setSelectedRoute] = useState<ImportRoute | null>(null)
  const [sourceSession, setSourceSession] = useState<UnifiedSourceSession | null>(null)
  const [foundationSession, setFoundationSession] = useState<UnifiedSourceSession | null>(null)
  const [source, setSource] = useState<DrawingSourceFile | null>(null)
  const [page, setPage] = useState(1)
  const [draft, setDraft] = useState<DrawingProductDraft>(blankDraft())
  const [products, setProducts] = useState<CapturedDrawingProduct[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [fileError, setFileError] = useState('')
  const [busy, setBusy] = useState(false)
  const [pageFilter, setPageFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | DrawingReviewStatus>('ALL')
  const [ocrSelection, setOcrSelection] = useState<OcrSelection | null>(null)
  const [ocrJobs, setOcrJobs] = useState<OcrJob[]>([])
  const [ocrAudit, setOcrAudit] = useState<OcrAuditEntry[]>([])
  const [activeOcrJobId, setActiveOcrJobId] = useState<string | null>(null)
  const [ocrMessage, setOcrMessage] = useState('READY')
  const [combinedSelection, setCombinedSelection] = useState<OcrSelection | null>(null)
  const [combinedJob, setCombinedJob] = useState<CombinedAnalysisJob | null>(null)
  const [combinedAuditEntries, setCombinedAuditEntries] = useState<CombinedAuditEntry[]>([])
  const [combinedMessage, setCombinedMessage] = useState('READY')
  const [combinedProcessing, setCombinedProcessing] = useState(false)
  const [provisionalDraft, setProvisionalDraft] = useState<RecognitionDerivedDraft | null>(null)
  const validation = useMemo(() => validateDrawingDraft(draft, source?.metadata.pageCount ?? 1), [draft, source])
  const visibleProducts = products.filter((item) => (pageFilter === 'ALL' || item.sourcePage === Number(pageFilter)) && (statusFilter === 'ALL' || item.status === statusFilter))
  const ocrProcessing = ocrJobs.some((job) => job.state === 'PROCESSING')

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    fileInput.current?.focus()
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab') return
      const focusable = modal.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')
      if (!focusable?.length) return
      const first = focusable[0], last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('keydown', key); void ocrControl.current?.cancel(); previous?.focus() }
  }, [onClose])
  useEffect(() => () => releaseDrawingSource(source), [source])

  const clearSource = () => {
    releaseDrawingSource(source)
    void ocrControl.current?.cancel(); ocrControl.current = null
    setSource(null); setSourceSession(null); setFoundationSession(null); setProducts([]); setPage(1); setDraft(blankDraft()); setEditingId(null); setErrors([]); setFileError(''); setOcrSelection(null); setOcrJobs([]); setOcrAudit([]); setActiveOcrJobId(null); setOcrMessage('READY'); setCombinedSelection(null); setCombinedJob(null); setCombinedAuditEntries([]); setCombinedMessage('READY'); setCombinedProcessing(false); setProvisionalDraft(null)
    if (fileInput.current) fileInput.current.value = ''
  }
  const acceptFile = async (file?: File) => {
    if (!file || !selectedRoute) return
    setBusy(true); setFileError('')
    try {
      const { inspection } = await inspectImportFile(file, selectedRoute, limits.maximumFileBytes), target = dispatchInspectedSource(selectedRoute, inspection)
      if (target === 'REJECT') throw new Error(inspection.warnings.join(' ') || 'Файлът не съответства на избрания маршрут.')
      releaseDrawingSource(source); setProducts([]); setPage(1); setDraft(blankDraft()); setEditingId(null); setErrors([]); setOcrSelection(null); setOcrJobs([]); setOcrAudit([]); setActiveOcrJobId(null); setOcrMessage('READY'); setCombinedSelection(null); setCombinedJob(null); setCombinedAuditEntries([]); setCombinedMessage('READY'); setCombinedProcessing(false); setProvisionalDraft(null)
      if (target === 'DRAWING_WORKSPACE') { const next = await prepareDrawingSource(file, limits), session = createSourceSession({ ...inspection, pageCount: next.metadata.pageCount }); setSource(next); setSourceSession(session); setFoundationSession(null) }
      else { setSource(null); setSourceSession(null); setFoundationSession(createSourceSession(inspection)) }
    } catch (reason) { setFileError(reason instanceof Error ? reason.message : 'Файлът не може да бъде обработен.') }
    finally { setBusy(false) }
  }
  const backToFormatChoice = () => {
    if ((source || foundationSession) && !window.confirm('Смяната на формата ще премахне текущия локален източник и непотвърдените данни от import сесията. Да продължа ли?')) return
    clearSource(); setSelectedRoute(null)
  }
  const changeDraft = (patch: Partial<DrawingProductDraft>) => {
    setDraft((current) => {
      const geometryChanged = ('width' in patch && patch.width !== current.width) || ('height' in patch && patch.height !== current.height) || ('templateId' in patch && patch.templateId !== current.templateId)
      return { ...current, ...patch, status: geometryChanged && current.status === 'VERIFIED' ? 'NEEDS_REVIEW' : patch.status ?? current.status }
    })
    if (errors.length) setErrors([])
  }
  const saveDraft = () => {
    if (!source) { setErrors(['Първо изберете източник.']); return }
    const result = validateDrawingDraft(draft, source.metadata.pageCount)
    setErrors(result.errors)
    if (!result.valid) return
    const now = new Date().toISOString()
    if (editingId) setProducts((items) => items.map((item) => item.id === editingId ? { ...item, ...draft, updatedAt: now } : item))
    else {
      const id = crypto.randomUUID()
      setProducts((items) => [...items, { ...draft, id, sourceFileName: source.metadata.fileName, sourceSha256: source.metadata.sha256, createdAt: now, updatedAt: now }])
      setSourceSession((session) => session ? { ...session, linkedDraftIds: [...session.linkedDraftIds, id] } : session)
    }
    setDraft(blankDraft(page)); setEditingId(null); setErrors([])
  }
  const edit = (item: CapturedDrawingProduct) => { const { id, sourceFileName: _file, sourceSha256: _hash, createdAt: _created, updatedAt: _updated, ...values } = item; void _file; void _hash; void _created; void _updated; setEditingId(id); setDraft(values); setErrors([]) }
  const duplicate = (item: CapturedDrawingProduct) => { const now = new Date().toISOString(); setProducts((items) => [...items, { ...item, id: crypto.randomUUID(), productReference: `${item.productReference} — копие`, status: 'NEEDS_REVIEW', createdAt: now, updatedAt: now }]) }
  const selectTemplate = (templateId: string) => { const template = getProductTemplate(templateId); changeDraft({ templateId, productCategory: template.category }) }
  const selectCategory = (productCategory: ProductType) => {
    const firstTemplate = productTemplates.find((template) => template.category === productCategory)
    changeDraft({ productCategory, ...(firstTemplate ? { templateId: firstTemplate.id } : {}) })
  }
  const startOcr = async () => {
    if (!source || !ocrSelection || ocrProcessing) return
    if (ocrSelection.rectangle.width * ocrSelection.rectangle.height > ocrLimits.maximumCropPixelArea) { setOcrMessage(`FAILED: зоната надвишава ${ocrLimits.maximumCropPixelArea.toLocaleString('bg-BG')} пиксела.`); return }
    const id = crypto.randomUUID(), createdAt = new Date().toISOString()
    const initial: OcrJob = { id, state: 'PROCESSING', sourceSha256: source.metadata.sha256, sourcePage: ocrSelection.page, selection: ocrSelection.rectangle, language: 'eng', rawText: '', normalizedText: '', confidence: 0, items: [], candidates: [], progress: 0, createdAt }
    currentOcrJobId.current = id
    setOcrJobs((items) => [initial, ...items].slice(0, ocrLimits.maximumRetainedJobs)); setActiveOcrJobId(id); setOcrMessage('PROCESSING: локалното OCR работи…')
    try {
      const result = await runLocalOcr(ocrSelection.imageDataUrl, (progress, message) => { setOcrMessage(`PROCESSING: ${message} ${Math.round(progress * 100)}%`); setOcrJobs((items) => items.map((item) => item.id === id ? { ...item, progress } : item)) }, (control) => { ocrControl.current = control })
      const candidates = parseDimensionCandidates(result.normalizedText, result.confidence, ocrSelection.page, ocrSelection.rectangle)
      setOcrJobs((items) => items.map((item) => item.id === id ? { ...item, ...result, candidates, state: 'COMPLETED', progress: 1, completedAt: new Date().toISOString() } : item))
      setOcrMessage(result.normalizedText ? 'COMPLETED: резултатът е само предложение за човешка проверка.' : 'COMPLETED: не е разпознат текст в избраната зона.')
    } catch (reason) {
      const cancelled = cancelledOcrJobs.current.has(id)
      setOcrJobs((items) => items.map((item) => item.id === id ? { ...item, state: cancelled ? 'CANCELLED' : 'FAILED', error: reason instanceof Error ? reason.message : 'OCR worker failure', completedAt: new Date().toISOString() } : item))
      setOcrMessage(cancelled ? 'CANCELLED: разпознаването е прекратено.' : 'FAILED: локалното OCR не завърши успешно.')
    } finally { ocrControl.current = null; currentOcrJobId.current = null; cancelledOcrJobs.current.delete(id) }
  }
  const cancelOcr = async () => { const control = ocrControl.current; if (currentOcrJobId.current) cancelledOcrJobs.current.add(currentOcrJobId.current); ocrControl.current = null; await control?.cancel(); setOcrMessage('CANCELLED: разпознаването е прекратено.') }
  const reviewCandidate = (jobId: string, candidate: OcrCandidate, action: 'ACCEPT' | 'REJECT' | 'EDIT') => {
    const status = action === 'REJECT' ? 'REJECTED' : 'ACCEPTED'
    setOcrJobs((items) => items.map((job) => job.id === jobId ? { ...job, candidates: job.candidates.map((item) => item.id === candidate.id ? { ...candidate, status } : item) } : job))
    setOcrAudit((items) => [...items, createOcrAudit(jobId, candidate, action)])
  }
  const applyCandidate = (jobId: string, candidate: OcrCandidate, field: OcrTargetField, proposed: string) => {
    const pair = proposed.split(/[×x]/).map((part) => part.trim())
    const value = field === 'width' && pair.length === 2 ? pair[0] ?? proposed : field === 'height' && pair.length === 2 ? pair[1] ?? proposed : proposed
    const previous = String(draft[field])
    if (!window.confirm(`Да се приложи ли OCR предложението?\nПоле: ${field}\nСтара стойност: ${previous}\nПредложена стойност: ${value}\n\nПотвърдете само след сравнение с оригиналния чертеж.`)) return
    if (field === 'width' || field === 'height') { const numeric = Number(value.replace(',', '.')); if (!Number.isFinite(numeric) || numeric < ocrLimits.minimumDimension || numeric > ocrLimits.maximumDimension) { setOcrMessage('FAILED: предложената размерна стойност е извън допустимите демонстрационни граници.'); return }; changeDraft({ [field]: numeric }) }
    else changeDraft({ [field]: value })
    setOcrAudit((items) => [...items, createOcrAudit(jobId, candidate, 'APPLY', { field, previousValue: previous, newValue: value, confirmed: true })])
  }
  const analyzeCombined = async () => {
    if (!source || !combinedSelection || combinedProcessing || ocrProcessing) return
    if (combinedSelection.rectangle.width * combinedSelection.rectangle.height > ocrLimits.maximumCropPixelArea) { setCombinedMessage(`FAILED: зоната надвишава ${ocrLimits.maximumCropPixelArea.toLocaleString('bg-BG')} пиксела.`); return }
    setCombinedProcessing(true); setCombinedMessage('PROCESSING: локален geometry и annotation анализ…')
    try { const job = await runCombinedAnalysis(combinedSelection, source.metadata.sha256, setCombinedMessage, (control) => { ocrControl.current = control }); setCombinedJob(job); setCombinedAuditEntries([]); setProvisionalDraft(generateProvisionalDraft(job, source.metadata.fileName)); setCombinedMessage('COMPLETED: създадена е автоматична NEEDS_REVIEW чернова за човешка проверка.') }
    catch (reason) { setCombinedMessage(`FAILED: ${reason instanceof Error ? reason.message : 'Комбинираният анализ не завърши.'}`) }
    finally { ocrControl.current = null; setCombinedProcessing(false) }
  }
  const decideCombined = (candidate: CombinedCandidate, status: 'ACCEPTED' | 'REJECTED', value: string) => {
    if (!combinedJob) return
    setCombinedJob({ ...combinedJob, candidates: combinedJob.candidates.map((item) => item.id === candidate.id ? { ...item, normalizedValue: value, status } : item) })
    setCombinedAuditEntries((items) => [...items, combinedAudit(combinedJob.id, value === candidate.normalizedValue ? (status === 'ACCEPTED' ? 'ACCEPT' : 'REJECT') : 'EDIT', candidate.id, candidate.normalizedValue, value)])
  }
  const selectCombinedScheme = (templateId: string) => { if (combinedJob) setCombinedAuditEntries((items) => [...items, combinedAudit(combinedJob.id, 'SELECT_SCHEME', 'templateId', undefined, templateId)]) }
  const applyCombined = (values: CombinedApplication) => {
    if (!combinedJob) return
    const next: Partial<DrawingProductDraft> = {}
    if (values.templateId) { const template = getProductTemplate(values.templateId); next.templateId = values.templateId; next.productCategory = template.category }
    if (values.width) next.width = values.width; if (values.height) next.height = values.height; if (values.quantity) next.quantity = values.quantity; if (values.productReference) next.productReference = values.productReference
    changeDraft(next)
    setCombinedAuditEntries((items) => [...items, combinedAudit(combinedJob.id, 'APPLY', 'draftProduct', JSON.stringify({ templateId: draft.templateId, width: draft.width, height: draft.height, quantity: draft.quantity, productReference: draft.productReference }), JSON.stringify(next), true)])
    setCombinedMessage('Приложени са само изрично приетите стойности; записът остава симулационна чернова.')
  }
  const verifyProvisionalDraft = (verified: RecognitionDerivedDraft) => {
    if (!source) return
    const template = getProductTemplate(verified.templateId)
    const record: CapturedDrawingProduct = { id: verified.id, projectReference: verified.projectReference, sourcePage: verified.sourcePage, productReference: verified.productReference, productCategory: template.category, templateId: verified.templateId, width: verified.width ?? 0, height: verified.height ?? 0, quantity: verified.quantity, notes: 'Автоматично генерирана чернова, потвърдена от човек.', drawingPosition: `Crop X ${Math.round(verified.sourceCrop.x)}, Y ${Math.round(verified.sourceCrop.y)}`, status: 'VERIFIED', sourceFileName: verified.sourceFileName, sourceSha256: verified.sourceSha256, createdAt: verified.createdAt, updatedAt: verified.updatedAt, recognitionDerived: true, automaticallyPopulated: true, humanVerified: true, machineReady: false, simulationOnly: true, sourceCrop: verified.sourceCrop }
    if (!onLoadVerified(record)) return
    setProducts((items) => [...items.filter((item) => item.id !== record.id), record])
    setSourceSession((session) => session && !session.linkedDraftIds.includes(record.id) ? { ...session, linkedDraftIds: [...session.linkedDraftIds, record.id] } : session)
    setProvisionalDraft(null)
  }

  return <div className="preview-overlay drawing-import-overlay" role="presentation"><section ref={modal} className="drawing-import-modal" data-help-id="import-workspace" role="dialog" aria-modal="true" aria-labelledby="drawing-import-title" aria-describedby="drawing-import-safety">
    <header className="drawing-import-header"><div><span className="preview-badge">СИМУЛАЦИЯ · ЛОКАЛНА ОБРАБОТКА</span><h2 id="drawing-import-title">Избери източник на проекта</h2><p id="drawing-import-safety">Файлът остава в паметта на браузъра. Няма сървърно качване, автоматично производствено тълкуване или машинен export.</p></div><button type="button" className="preview-close" aria-label="Затвори импортния център" onClick={onClose}>×</button></header>
    {!selectedRoute ? <ImportFormatChooser onSelect={setSelectedRoute}/> : foundationSession ? <FoundationSourceInspection session={foundationSession} onClear={clearSource} onBack={backToFormatChoice}/> : !source ? <section className="drawing-file-start">
      <div className="selected-import-route"><span className="route-badge">{formatCardFor(selectedRoute).badge}</span><div><b>{formatCardFor(selectedRoute).title}</b><p>{formatCardFor(selectedRoute).description}</p></div><button type="button" onClick={backToFormatChoice}>Назад към избор на формат</button></div>
      <div className="drawing-limits"><label>Максимален размер (MB)<input type="number" min="1" max="100" value={Math.round(limits.maximumFileBytes / 1024 / 1024)} onChange={(event) => setLimits({ ...limits, maximumFileBytes: Number(event.target.value) * 1024 * 1024 })}/></label>{selectedRoute === 'PDF' && <label>Максимум PDF страници<input type="number" min="1" max="500" value={limits.maximumPdfPages} onChange={(event) => setLimits({ ...limits, maximumPdfPages: Number(event.target.value) })}/></label>}</div>
      <div className="drawing-drop-zone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void acceptFile(event.dataTransfer.files[0]) }}><p><b>Пуснете файл за избрания маршрут тук</b></p><p>или изберете локален файл. Съдържанието не се изпълнява и не се изпраща по мрежа.</p><input ref={fileInput} type="file" accept={formatCardFor(selectedRoute).accept} onChange={(event) => void acceptFile(event.target.files?.[0])}/>{busy && <p aria-live="polite">Проверка на формат, подпис и локално SHA-256 хеширане…</p>}</div>{fileError && <p className="field-error" role="alert">{fileError}</p>}
    </section> : <>
      <div className="drawing-source-meta"><span className="route-badge">{formatCardFor(selectedRoute).badge}</span><span><b>{source.metadata.fileName}</b></span><span>{source.metadata.kind} · {(source.metadata.sizeBytes / 1024 / 1024).toFixed(2)} MB</span><span>{source.metadata.pageCount} стр.</span><span title={source.metadata.sha256}>SHA-256: {source.metadata.sha256.slice(0, 16)}… <ContextHelp helpId="sha256"/></span><button type="button" onClick={clearSource}>Премахни файла</button><button type="button" onClick={backToFormatChoice}>Друг формат</button></div>
      {sourceSession && <div className="source-state-grid" aria-label="Състояние на локалния източник"><span>Файл приет: ДА</span><span>Визуализируем: ДА</span><span>Анализ наличен: {combinedJob || ocrJobs.length ? 'ДА' : 'НЕ'}</span><span>Чернова генерирана: {products.length || provisionalDraft ? 'ДА' : 'НЕ'}</span><span>Човешка проверка: {products.some((item) => item.status === 'VERIFIED') ? 'ДА' : 'НЕ'}</span><span>Машинна готовност: НЕ</span></div>}
      <div className="drawing-workspace-grid"><div><DrawingSourceViewer key={`${source.metadata.sha256}-${page}`} ref={drawingViewer} source={source} page={page} selection={ocrSelection} onSelection={setOcrSelection} combinedSelection={combinedSelection} onCombinedSelection={(next) => { setCombinedSelection(next); setCombinedJob(null); setCombinedAuditEntries([]); setProvisionalDraft(null) }} onPage={(next) => { setPage(next); setOcrSelection(null); setCombinedSelection(null); setCombinedJob(null); setProvisionalDraft(null); changeDraft({ sourcePage: next }) }}/>{ocrSelection && <section className="confirmed-ocr-selection" aria-labelledby="confirmed-ocr-selection-title"><div><h3 id="confirmed-ocr-selection-title">Избрана зона за OCR</h3><p>Страница {ocrSelection.page} · X {Math.round(ocrSelection.rectangle.x)}, Y {Math.round(ocrSelection.rectangle.y)} · {Math.round(ocrSelection.rectangle.width)} × {Math.round(ocrSelection.rectangle.height)} px</p><img src={ocrSelection.imageDataUrl} alt="Увеличен преглед на потвърдената OCR зона"/></div><div className="confirmed-ocr-actions"><p><b>Локално OCR предложение — не е технологично одобрение.</b><br/>Проверете визуално извадката преди разпознаване.</p><button type="button" className="primary-button" disabled={ocrProcessing || combinedProcessing} onClick={() => void startOcr()}>Разпознай избраната зона локално</button><button type="button" onClick={() => drawingViewer.current?.editSelection()}>Промени зоната</button><button type="button" onClick={() => drawingViewer.current?.clearSelection()}>Изчисти зоната</button>{ocrProcessing && <button type="button" onClick={() => void cancelOcr()}>Прекрати</button>}<span aria-live="polite">{ocrMessage}</span></div></section>}{combinedSelection && <section className="confirmed-ocr-selection combined-confirmed-crop" aria-labelledby="combined-crop-title"><div><h3 id="combined-crop-title">Избрано изделие с размерите</h3><p>Страница {combinedSelection.page} · X {Math.round(combinedSelection.rectangle.x)}, Y {Math.round(combinedSelection.rectangle.y)} · {Math.round(combinedSelection.rectangle.width)} × {Math.round(combinedSelection.rectangle.height)} px</p><img src={combinedSelection.imageDataUrl} alt="Потвърдена зона с изделие и размери"/></div><div className="confirmed-ocr-actions"><p><b>Комбинирано локално предложение — изисква човешко одобрение.</b></p><button type="button" className="primary-button" disabled={combinedProcessing || ocrProcessing} onClick={() => void analyzeCombined()}>Анализирай изделието и размерите локално</button><button type="button" onClick={() => drawingViewer.current?.editCombinedSelection()}>Промени зоната</button><button type="button" onClick={() => drawingViewer.current?.clearCombinedSelection()}>Изчисти зоната</button>{combinedProcessing && <button type="button" onClick={() => void cancelOcr()}>Прекрати</button>}<span aria-live="polite">{combinedMessage}</span></div></section>}{!ocrSelection && !combinedSelection && <div className="ocr-unconfirmed-status"><b>Изберете OCR зона или цяло изделие с размерите и я потвърдете.</b><span aria-live="polite">{combinedMessage}</span></div>}</div><section className="drawing-draft" aria-labelledby="drawing-draft-title"><h3 id="drawing-draft-title">Ръчно структурирана чернова</h3><p className="manual-only">Препишете данните ръчно от скицата. OCR и комбинираният анализ създават само предложения и никога не попълват полета автоматично.</p>
        <div className="drawing-form-grid"><label>Проект / референция<input required value={draft.projectReference} onChange={(event) => changeDraft({ projectReference: event.target.value })}/></label><label>Страница<input type="number" min="1" max={source.metadata.pageCount} value={draft.sourcePage} onChange={(event) => changeDraft({ sourcePage: Number(event.target.value) })}/></label><label>Референция на изделието<input required value={draft.productReference} onChange={(event) => changeDraft({ productReference: event.target.value })}/></label><label>Категория<select value={draft.productCategory} onChange={(event) => selectCategory(event.target.value as ProductType)}>{Object.entries(productCategoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="full">Референтна схема<select value={draft.templateId} onChange={(event) => selectTemplate(event.target.value)}>{productTemplates.map((template) => <option key={template.id} value={template.id}>{template.id} — {template.name} · {templateCategoryLabels[template.libraryCategory]}</option>)}</select></label><label>Ширина (mm)<input type="number" min="1" value={draft.width} onChange={(event) => changeDraft({ width: Number(event.target.value) })}/></label><label>Височина (mm)<input type="number" min="1" value={draft.height} onChange={(event) => changeDraft({ height: Number(event.target.value) })}/></label><label>Количество<input type="number" min="1" step="1" value={draft.quantity} onChange={(event) => changeDraft({ quantity: Number(event.target.value) })}/></label><label>Статус<select value={draft.status} onChange={(event) => changeDraft({ status: event.target.value as DrawingReviewStatus })}><option value="DRAFT">DRAFT — Чернова</option><option value="NEEDS_REVIEW">NEEDS_REVIEW — Изисква проверка</option><option value="VERIFIED">VERIFIED — Проверено</option></select></label><label className="full">Позиция / бележка върху чертежа<input value={draft.drawingPosition} onChange={(event) => changeDraft({ drawingPosition: event.target.value })}/></label><label className="full">Бележки<textarea value={draft.notes} onChange={(event) => changeDraft({ notes: event.target.value })}/></label></div>
        {errors.length > 0 && <ul className="form-errors" role="alert">{errors.map((error) => <li key={error}>{error}</li>)}</ul>}<div className="drawing-draft-actions"><button type="button" className="primary-button" onClick={saveDraft}>{editingId ? 'Запази промените' : 'Добави изделие от скицата'}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setDraft(blankDraft(page)); setErrors([]) }}>Откажи редакцията</button>}<button type="button" onClick={() => onPreview(toProduct(draft, baseProduct), draft.projectReference)} disabled={!validation.valid}>Визуален преглед</button></div>
      </section></div>{provisionalDraft && combinedJob && <ProvisionalProductDraft draft={provisionalDraft} analysis={combinedJob} baseProduct={baseProduct} onDraft={setProvisionalDraft} onReject={() => setProvisionalDraft(null)} onVerify={verifyProvisionalDraft}/>} {combinedJob && combinedSelection && <CombinedAnalysisReview job={combinedJob} cropDataUrl={combinedSelection.imageDataUrl} audit={combinedAuditEntries} onDecision={decideCombined} onScheme={selectCombinedScheme} onApply={applyCombined}/>}<OcrSuggestionsPanel jobs={ocrJobs} activeJobId={activeOcrJobId} audit={ocrAudit} cropDataUrl={ocrSelection?.imageDataUrl} onCandidate={reviewCandidate} onApply={applyCandidate}/>
      <section className="captured-products" aria-labelledby="captured-products-title"><div className="captured-products-heading"><div><h3 id="captured-products-title">Заснети изделия</h3><p>{products.length} ръчно въведени записа</p></div><div><label>Страница<select value={pageFilter} onChange={(event) => setPageFilter(event.target.value)}><option value="ALL">Всички</option>{Array.from({ length: source.metadata.pageCount }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}</select></label><label>Статус<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}><option value="ALL">Всички</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div></div>
        {visibleProducts.length ? <div className="captured-product-list">{visibleProducts.map((item) => <article key={item.id}><div><b>{item.productReference}</b><small>{item.id}</small><span>{item.templateId} · {item.width} × {item.height} mm · {item.quantity} бр. · стр. {item.sourcePage}</span><span className={`review-status ${item.status.toLowerCase()}`}>{item.status} — {statusLabels[item.status]}</span></div><div><button type="button" onClick={() => onPreview(toProduct(item, baseProduct), item.projectReference)}>Преглед</button><button type="button" onClick={() => edit(item)}>Редактирай</button><button type="button" onClick={() => duplicate(item)}>Дублирай</button><button type="button" disabled={item.status !== 'VERIFIED'} title={item.status !== 'VERIFIED' ? 'Само VERIFIED запис може да бъде зареден.' : undefined} onClick={() => onLoadVerified(item)}>Зареди във workflow</button><button type="button" className="danger-button" onClick={() => { if (window.confirm(`Да се изтрие ли ${item.productReference}?`)) setProducts((items) => items.filter(({ id }) => id !== item.id)) }}>Изтрий</button></div></article>)}</div> : <p className="empty-captured">Няма записи за избраните филтри.</p>}
      </section>
      <footer className="drawing-import-footer"><p><b>Само симулация.</b> Данните изискват човешка проверка и не са готови за машина.</p><button type="button" className="export" disabled={!products.length && !provisionalDraft} onClick={() => exportDrawingImportSimulation({ source: source.metadata, products, validation: { valid: products.length > 0 || Boolean(provisionalDraft), errors: products.length || provisionalDraft ? [] : ['Няма заснети изделия или автоматична чернова.'] }, ocrJobs, ocrAudit, combinedAnalysis: combinedJob ?? undefined, combinedAudit: combinedAuditEntries, provisionalDraft: provisionalDraft ?? undefined })}>Експортирай import simulation JSON</button></footer>
    </>}
  </section></div>
}
