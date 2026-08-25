import { useEffect, useMemo, useRef, useState } from 'react'
import { exportDrawingImportSimulation } from '../drawingImportExport'
import { prepareDrawingSource, releaseDrawingSource } from '../drawingImportFile'
import type { CapturedDrawingProduct, DrawingImportLimits, DrawingProductDraft, DrawingReviewStatus, DrawingSourceFile } from '../drawingImportTypes'
import { defaultDrawingImportLimits, validateDrawingDraft } from '../drawingImportValidation'
import type { ProductParameters, ProductType } from '../productTypes'
import { getProductTemplate, productTemplates, templateCategoryLabels } from '../productTemplates'
import { DrawingSourceViewer } from './DrawingSourceViewer'

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
  const [limits, setLimits] = useState<DrawingImportLimits>(defaultDrawingImportLimits)
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
  const validation = useMemo(() => validateDrawingDraft(draft, source?.metadata.pageCount ?? 1), [draft, source])
  const visibleProducts = products.filter((item) => (pageFilter === 'ALL' || item.sourcePage === Number(pageFilter)) && (statusFilter === 'ALL' || item.status === statusFilter))

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
    return () => { document.removeEventListener('keydown', key); previous?.focus() }
  }, [onClose])
  useEffect(() => () => releaseDrawingSource(source), [source])

  const clearSource = () => {
    releaseDrawingSource(source)
    setSource(null); setProducts([]); setPage(1); setDraft(blankDraft()); setEditingId(null); setErrors([]); setFileError('')
    if (fileInput.current) fileInput.current.value = ''
  }
  const acceptFile = async (file?: File) => {
    if (!file) return
    setBusy(true); setFileError('')
    try {
      const next = await prepareDrawingSource(file, limits)
      releaseDrawingSource(source)
      setSource(next); setProducts([]); setPage(1); setDraft(blankDraft()); setEditingId(null); setErrors([])
    } catch (reason) { setFileError(reason instanceof Error ? reason.message : 'Файлът не може да бъде обработен.') }
    finally { setBusy(false) }
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
    else setProducts((items) => [...items, { ...draft, id: crypto.randomUUID(), sourceFileName: source.metadata.fileName, sourceSha256: source.metadata.sha256, createdAt: now, updatedAt: now }])
    setDraft(blankDraft(page)); setEditingId(null); setErrors([])
  }
  const edit = (item: CapturedDrawingProduct) => { const { id, sourceFileName: _file, sourceSha256: _hash, createdAt: _created, updatedAt: _updated, ...values } = item; void _file; void _hash; void _created; void _updated; setEditingId(id); setDraft(values); setErrors([]) }
  const duplicate = (item: CapturedDrawingProduct) => { const now = new Date().toISOString(); setProducts((items) => [...items, { ...item, id: crypto.randomUUID(), productReference: `${item.productReference} — копие`, status: 'NEEDS_REVIEW', createdAt: now, updatedAt: now }]) }
  const selectTemplate = (templateId: string) => { const template = getProductTemplate(templateId); changeDraft({ templateId, productCategory: template.category }) }
  const selectCategory = (productCategory: ProductType) => {
    const firstTemplate = productTemplates.find((template) => template.category === productCategory)
    changeDraft({ productCategory, ...(firstTemplate ? { templateId: firstTemplate.id } : {}) })
  }

  return <div className="preview-overlay drawing-import-overlay" role="presentation"><section ref={modal} className="drawing-import-modal" role="dialog" aria-modal="true" aria-labelledby="drawing-import-title" aria-describedby="drawing-import-safety">
    <header className="drawing-import-header"><div><span className="preview-badge">СИМУЛАЦИЯ · ЛОКАЛНА ОБРАБОТКА</span><h2 id="drawing-import-title">Импорт на техническа скица</h2><p id="drawing-import-safety">Файлът остава в паметта на браузъра. Няма upload, OCR, автоматично измерване или машинен export.</p></div><button type="button" className="preview-close" aria-label="Затвори импорта" onClick={onClose}>×</button></header>
    {!source ? <section className="drawing-file-start"><div className="drawing-limits"><label>Максимален размер (MB)<input type="number" min="1" max="100" value={Math.round(limits.maximumFileBytes / 1024 / 1024)} onChange={(event) => setLimits({ ...limits, maximumFileBytes: Number(event.target.value) * 1024 * 1024 })}/></label><label>Максимум PDF страници<input type="number" min="1" max="500" value={limits.maximumPdfPages} onChange={(event) => setLimits({ ...limits, maximumPdfPages: Number(event.target.value) })}/></label></div><div className="drawing-drop-zone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void acceptFile(event.dataTransfer.files[0]) }}><p><b>Пуснете PDF, PNG, JPG или JPEG тук</b></p><p>или изберете локален файл. Вградено PDF съдържание, скриптове, връзки и прикачени файлове не се изпълняват.</p><input ref={fileInput} type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" onChange={(event) => void acceptFile(event.target.files?.[0])}/>{busy && <p aria-live="polite">Проверка и локално хеширане…</p>}</div>{fileError && <p className="field-error" role="alert">{fileError}</p>}</section> : <>
      <div className="drawing-source-meta"><span><b>{source.metadata.fileName}</b></span><span>{source.metadata.kind} · {(source.metadata.sizeBytes / 1024 / 1024).toFixed(2)} MB</span><span>{source.metadata.pageCount} стр.</span><span title={source.metadata.sha256}>SHA-256: {source.metadata.sha256.slice(0, 16)}…</span><button type="button" onClick={clearSource}>Премахни файла</button></div>
      <div className="drawing-workspace-grid"><DrawingSourceViewer source={source} page={page} onPage={(next) => { setPage(next); changeDraft({ sourcePage: next }) }}/><section className="drawing-draft" aria-labelledby="drawing-draft-title"><h3 id="drawing-draft-title">Ръчно структурирана чернова</h3><p className="manual-only">Препишете данните ръчно от скицата. Не се извършва автоматично разпознаване или измерване.</p>
        <div className="drawing-form-grid"><label>Проект / референция<input required value={draft.projectReference} onChange={(event) => changeDraft({ projectReference: event.target.value })}/></label><label>Страница<input type="number" min="1" max={source.metadata.pageCount} value={draft.sourcePage} onChange={(event) => changeDraft({ sourcePage: Number(event.target.value) })}/></label><label>Референция на изделието<input required value={draft.productReference} onChange={(event) => changeDraft({ productReference: event.target.value })}/></label><label>Категория<select value={draft.productCategory} onChange={(event) => selectCategory(event.target.value as ProductType)}>{Object.entries(productCategoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="full">Референтна схема<select value={draft.templateId} onChange={(event) => selectTemplate(event.target.value)}>{productTemplates.map((template) => <option key={template.id} value={template.id}>{template.id} — {template.name} · {templateCategoryLabels[template.libraryCategory]}</option>)}</select></label><label>Ширина (mm)<input type="number" min="1" value={draft.width} onChange={(event) => changeDraft({ width: Number(event.target.value) })}/></label><label>Височина (mm)<input type="number" min="1" value={draft.height} onChange={(event) => changeDraft({ height: Number(event.target.value) })}/></label><label>Количество<input type="number" min="1" step="1" value={draft.quantity} onChange={(event) => changeDraft({ quantity: Number(event.target.value) })}/></label><label>Статус<select value={draft.status} onChange={(event) => changeDraft({ status: event.target.value as DrawingReviewStatus })}><option value="DRAFT">DRAFT — Чернова</option><option value="NEEDS_REVIEW">NEEDS_REVIEW — Изисква проверка</option><option value="VERIFIED">VERIFIED — Проверено</option></select></label><label className="full">Позиция / бележка върху чертежа<input value={draft.drawingPosition} onChange={(event) => changeDraft({ drawingPosition: event.target.value })}/></label><label className="full">Бележки<textarea value={draft.notes} onChange={(event) => changeDraft({ notes: event.target.value })}/></label></div>
        {errors.length > 0 && <ul className="form-errors" role="alert">{errors.map((error) => <li key={error}>{error}</li>)}</ul>}<div className="drawing-draft-actions"><button type="button" className="primary-button" onClick={saveDraft}>{editingId ? 'Запази промените' : 'Добави изделие от скицата'}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setDraft(blankDraft(page)); setErrors([]) }}>Откажи редакцията</button>}<button type="button" onClick={() => onPreview(toProduct(draft, baseProduct), draft.projectReference)} disabled={!validation.valid}>Визуален преглед</button></div>
      </section></div>
      <section className="captured-products" aria-labelledby="captured-products-title"><div className="captured-products-heading"><div><h3 id="captured-products-title">Заснети изделия</h3><p>{products.length} ръчно въведени записа</p></div><div><label>Страница<select value={pageFilter} onChange={(event) => setPageFilter(event.target.value)}><option value="ALL">Всички</option>{Array.from({ length: source.metadata.pageCount }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}</select></label><label>Статус<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}><option value="ALL">Всички</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div></div>
        {visibleProducts.length ? <div className="captured-product-list">{visibleProducts.map((item) => <article key={item.id}><div><b>{item.productReference}</b><small>{item.id}</small><span>{item.templateId} · {item.width} × {item.height} mm · {item.quantity} бр. · стр. {item.sourcePage}</span><span className={`review-status ${item.status.toLowerCase()}`}>{item.status} — {statusLabels[item.status]}</span></div><div><button type="button" onClick={() => onPreview(toProduct(item, baseProduct), item.projectReference)}>Преглед</button><button type="button" onClick={() => edit(item)}>Редактирай</button><button type="button" onClick={() => duplicate(item)}>Дублирай</button><button type="button" disabled={item.status !== 'VERIFIED'} title={item.status !== 'VERIFIED' ? 'Само VERIFIED запис може да бъде зареден.' : undefined} onClick={() => onLoadVerified(item)}>Зареди във workflow</button><button type="button" className="danger-button" onClick={() => { if (window.confirm(`Да се изтрие ли ${item.productReference}?`)) setProducts((items) => items.filter(({ id }) => id !== item.id)) }}>Изтрий</button></div></article>)}</div> : <p className="empty-captured">Няма записи за избраните филтри.</p>}
      </section>
      <footer className="drawing-import-footer"><p><b>Само симулация.</b> Данните изискват човешка проверка и не са готови за машина.</p><button type="button" className="export" disabled={!products.length} onClick={() => exportDrawingImportSimulation({ source: source.metadata, products, validation: { valid: products.length > 0, errors: products.length ? [] : ['Няма заснети изделия.'] } })}>Експортирай import simulation JSON</button></footer>
    </>}
  </section></div>
}
