import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist'
import type { DrawingSourceFile } from '../drawingImportTypes'
import { clampOcrRectangle, displayPointToSource } from '../ocrCrop'
import type { OcrRectangle, OcrSelection } from '../ocrTypes'

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'
type Interaction = { pointerId: number; type: 'draw' | 'move' | 'resize'; start: { x: number; y: number }; origin: OcrRectangle | null; handle?: ResizeHandle }
interface Props { source: DrawingSourceFile; page: number; onPage: (page: number) => void; selection: OcrSelection | null; onSelection: (selection: OcrSelection | null) => void; combinedSelection: OcrSelection | null; onCombinedSelection: (selection: OcrSelection | null) => void }
export interface DrawingSourceViewerController { editSelection: () => void; clearSelection: () => void; editCombinedSelection: () => void; clearCombinedSelection: () => void }
const minimumSelectionSize = 12
const handles: ResizeHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']

export const DrawingSourceViewer = forwardRef<DrawingSourceViewerController, Props>(function DrawingSourceViewer({ source, page, onPage, selection, onSelection, combinedSelection, onCombinedSelection }, controllerRef) {
  const canvas = useRef<HTMLCanvasElement>(null), image = useRef<HTMLImageElement>(null), confirmedBackup = useRef<{ selection: OcrSelection; purpose: 'OCR' | 'COMBINED' } | null>(null)
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null)
  const [zoom, setZoom] = useState(1), [fit, setFit] = useState(true), [error, setError] = useState('')
  const [sourceDimensions, setSourceDimensions] = useState({ width: 0, height: 0 })
  const [selectionMode, setSelectionMode] = useState(false), [draftRectangle, setDraftRectangle] = useState<OcrRectangle | null>(null)
  const [purpose, setPurpose] = useState<'OCR' | 'COMBINED'>('OCR')
  const [interaction, setInteraction] = useState<Interaction | null>(null), [draftDirty, setDraftDirty] = useState(false)
  const [announcement, setAnnouncement] = useState('')

  useImperativeHandle(controllerRef, () => ({
    editSelection: () => { if (!selection) return; setPurpose('OCR'); confirmedBackup.current = { selection, purpose: 'OCR' }; setDraftRectangle(selection.rectangle); setDraftDirty(false); setSelectionMode(true); onSelection(null); setAnnouncement('Зоната е отворена за корекция. Потвърдете я отново преди OCR.') },
    clearSelection: () => { confirmedBackup.current = null; setDraftRectangle(null); setDraftDirty(false); setInteraction(null); setSelectionMode(false); onSelection(null); setAnnouncement('OCR зоната е изчистена.') },
    editCombinedSelection: () => { if (!combinedSelection) return; setPurpose('COMBINED'); confirmedBackup.current = { selection: combinedSelection, purpose: 'COMBINED' }; setDraftRectangle(combinedSelection.rectangle); setDraftDirty(false); setSelectionMode(true); onCombinedSelection(null); setAnnouncement('Комбинираната зона е отворена за корекция.') },
    clearCombinedSelection: () => { confirmedBackup.current = null; setDraftRectangle(null); setDraftDirty(false); setInteraction(null); setSelectionMode(false); onCombinedSelection(null); setAnnouncement('Комбинираната зона е изчистена.') },
  }), [combinedSelection, onCombinedSelection, onSelection, selection])

  useEffect(() => {
    if (source.metadata.kind !== 'PDF') return
    let active = true, document: PDFDocumentProxy | null = null
    void import('pdfjs-dist').then(async (pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
      const task = pdfjs.getDocument({ data: source.bytes.slice(0), disableFontFace: true, useSystemFonts: true, useWorkerFetch: false, useWasm: false, stopAtErrors: true })
      document = await task.promise; if (active) setPdf(document); else await document.cleanup()
    }).catch(() => active && setError('PDF файлът не може да бъде визуализиран безопасно.'))
    return () => { active = false; if (document) void document.cleanup(); setPdf(null) }
  }, [source])

  useEffect(() => {
    if (!pdf || !canvas.current) return
    let cancelled = false, renderTask: RenderTask | undefined
    void pdf.getPage(page).then((pdfPage) => {
      if (cancelled || !canvas.current) return
      const baseViewport = pdfPage.getViewport({ scale: 1 }), viewport = pdfPage.getViewport({ scale: zoom * 1.35 }), context = canvas.current.getContext('2d')
      if (!context) return
      setSourceDimensions({ width: baseViewport.width, height: baseViewport.height }); canvas.current.width = viewport.width; canvas.current.height = viewport.height
      renderTask = pdfPage.render({ canvas: canvas.current, canvasContext: context, viewport }); return renderTask.promise
    }).catch((reason: unknown) => { if (!cancelled && !(reason instanceof Error && reason.name === 'RenderingCancelledException')) setError('Страницата не може да бъде изобразена.') })
    return () => { cancelled = true; renderTask?.cancel() }
  }, [page, pdf, zoom])

  useEffect(() => {
    const cancelWithEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !selectionMode) return
      if (interaction) { setDraftRectangle(interaction.origin); setInteraction(null); setAnnouncement('Текущото преместване или оразмеряване е отменено.'); return }
      if (!draftDirty && confirmedBackup.current) { const backup = confirmedBackup.current; if (backup.purpose === 'OCR') onSelection(backup.selection); else onCombinedSelection(backup.selection); setDraftRectangle(backup.selection.rectangle); setSelectionMode(false); setAnnouncement('Възстановена е последната потвърдена зона.') }
      else { setSelectionMode(false); setAnnouncement('Маркирането е прекратено; черновата е запазена.') }
    }
    document.addEventListener('keydown', cancelWithEscape); return () => document.removeEventListener('keydown', cancelWithEscape)
  }, [draftDirty, interaction, onCombinedSelection, onSelection, selectionMode])

  const renderedElement = () => source.metadata.kind === 'PDF' ? canvas.current : image.current
  const pointerPosition = (event: React.PointerEvent) => { const element = renderedElement(); return element ? displayPointToSource(event.clientX, event.clientY, element.getBoundingClientRect(), sourceDimensions.width, sourceDimensions.height) : null }
  const activeConfirmed = purpose === 'OCR' ? selection : combinedSelection
  const invalidateConfirmation = () => { if (activeConfirmed) { confirmedBackup.current = { selection: activeConfirmed, purpose }; if (purpose === 'OCR') onSelection(null); else onCombinedSelection(null) }; setDraftDirty(true) }
  const begin = (event: React.PointerEvent<HTMLElement>, type: Interaction['type'], handle?: ResizeHandle) => {
    if (!selectionMode || !sourceDimensions.width) return
    const point = pointerPosition(event); if (!point) return
    event.preventDefault(); event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId)
    const origin = draftRectangle; setInteraction({ pointerId: event.pointerId, type, start: point, origin, handle })
    if (type === 'draw') { invalidateConfirmation(); setDraftRectangle({ x: point.x, y: point.y, width: 1, height: 1 }) }
  }
  const resize = (origin: OcrRectangle, point: { x: number; y: number }, start: { x: number; y: number }, handle: ResizeHandle) => {
    let left = origin.x, top = origin.y, right = origin.x + origin.width, bottom = origin.y + origin.height
    const dx = point.x - start.x, dy = point.y - start.y
    if (handle.includes('w')) left += dx; if (handle.includes('e')) right += dx; if (handle.includes('n')) top += dy; if (handle.includes('s')) bottom += dy
    if (right < left) [left, right] = [right, left]; if (bottom < top) [top, bottom] = [bottom, top]
    return clampOcrRectangle({ x: left, y: top, width: Math.max(minimumSelectionSize, right - left), height: Math.max(minimumSelectionSize, bottom - top) }, sourceDimensions.width, sourceDimensions.height)
  }
  const move = (event: React.PointerEvent<HTMLElement>) => {
    if (!interaction || interaction.pointerId !== event.pointerId) return
    const point = pointerPosition(event); if (!point) return
    const dx = point.x - interaction.start.x, dy = point.y - interaction.start.y
    let next: OcrRectangle
    if (interaction.type === 'draw') next = clampOcrRectangle({ x: Math.min(interaction.start.x, point.x), y: Math.min(interaction.start.y, point.y), width: Math.abs(dx), height: Math.abs(dy) }, sourceDimensions.width, sourceDimensions.height)
    else if (interaction.type === 'move' && interaction.origin) next = { ...interaction.origin, x: Math.max(0, Math.min(sourceDimensions.width - interaction.origin.width, interaction.origin.x + dx)), y: Math.max(0, Math.min(sourceDimensions.height - interaction.origin.height, interaction.origin.y + dy)) }
    else if (interaction.origin && interaction.handle) next = resize(interaction.origin, point, interaction.start, interaction.handle)
    else return
    invalidateConfirmation(); setDraftRectangle(next)
  }
  const end = (event: React.PointerEvent<HTMLElement>) => {
    if (!interaction || interaction.pointerId !== event.pointerId) return
    event.currentTarget.releasePointerCapture(event.pointerId); setInteraction(null)
    if (!draftRectangle || draftRectangle.width < minimumSelectionSize || draftRectangle.height < minimumSelectionSize) { setDraftRectangle(interaction.origin); setAnnouncement('Кликът е пренебрегнат — плъзнете, за да създадете реална зона.'); return }
    setAnnouncement(`${interaction.type === 'draw' ? 'Създадена' : interaction.type === 'move' ? 'Преместена' : 'Преоразмерена'} зона ${Math.round(draftRectangle.width)} на ${Math.round(draftRectangle.height)} пиксела.`)
  }
  const confirmSelection = () => {
    const element = renderedElement(); if (!draftRectangle || !element) return
    const safe = clampOcrRectangle(draftRectangle, sourceDimensions.width, sourceDimensions.height)
    const intrinsicWidth = element instanceof HTMLCanvasElement ? element.width : element.naturalWidth, intrinsicHeight = element instanceof HTMLCanvasElement ? element.height : element.naturalHeight
    const scaleX = intrinsicWidth / sourceDimensions.width, scaleY = intrinsicHeight / sourceDimensions.height
    const crop = document.createElement('canvas'); crop.width = Math.max(1, Math.round(safe.width * scaleX)); crop.height = Math.max(1, Math.round(safe.height * scaleY))
    crop.getContext('2d')?.drawImage(element, safe.x * scaleX, safe.y * scaleY, safe.width * scaleX, safe.height * scaleY, 0, 0, crop.width, crop.height)
    const confirmed = { rectangle: safe, page, imageDataUrl: crop.toDataURL('image/png') }; crop.width = 0; crop.height = 0
    confirmedBackup.current = { selection: confirmed, purpose }; setDraftRectangle(safe); setDraftDirty(false); setSelectionMode(false); if (purpose === 'OCR') onSelection(confirmed); else onCombinedSelection(confirmed); setAnnouncement(purpose === 'OCR' ? 'Зоната е потвърдена и е готова за локално OCR.' : 'Комбинираната зона е потвърдена и е готова за локален анализ.')
  }
  const clear = () => { confirmedBackup.current = null; setDraftRectangle(null); setDraftDirty(false); setInteraction(null); setSelectionMode(false); if (purpose === 'OCR') onSelection(null); else onCombinedSelection(null); setAnnouncement('Зоната е изчистена.') }
  const cancelMarking = () => { const backup = confirmedBackup.current; if (!draftDirty && backup) { if (backup.purpose === 'OCR') onSelection(backup.selection); else onCombinedSelection(backup.selection) }; setSelectionMode(false); setInteraction(null); setAnnouncement('Маркирането е отменено.') }
  const currentRectangle = draftRectangle ?? (activeConfirmed?.page === page ? activeConfirmed.rectangle : null)
  const setScale = (next: number) => { setFit(false); setZoom(Math.min(3, Math.max(.5, next))) }

  return <section className="drawing-source-viewer" data-help-id="source-viewer" aria-labelledby="source-viewer-title">
    <div className="drawing-viewer-toolbar"><h3 id="source-viewer-title">Оригинален източник</h3><div role="group" aria-label="Управление на визуализацията"><button type="button" onClick={() => setScale(zoom - .25)} aria-label="Намали мащаба">−</button><span>{Math.round(zoom * 100)}%</span><button type="button" onClick={() => setScale(zoom + .25)} aria-label="Увеличи мащаба">+</button><button type="button" onClick={() => { setFit(true); setZoom(1) }}>Побери страницата</button><button type="button" onClick={() => { setFit(false); setZoom(1) }}>Нулирай</button></div></div>
    {source.metadata.kind === 'PDF' && <div className="drawing-page-navigation"><button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}>← Предишна</button><label>Страница <input type="number" min="1" max={source.metadata.pageCount} value={page} onChange={(event) => onPage(Math.min(source.metadata.pageCount, Math.max(1, Number(event.target.value))))}/></label><span>от {source.metadata.pageCount}</span><button type="button" disabled={page >= source.metadata.pageCount} onClick={() => onPage(page + 1)}>Следваща →</button></div>}
    <div className="ocr-selection-toolbar"><button type="button" aria-pressed={selectionMode && purpose === 'OCR'} onClick={() => { setPurpose('OCR'); if (selection) confirmedBackup.current = { selection, purpose: 'OCR' }; setDraftRectangle(selection?.rectangle ?? null); setDraftDirty(false); setSelectionMode(true); if (selection) onSelection(null) }}>Избери зона за разпознаване</button><button type="button" aria-pressed={selectionMode && purpose === 'COMBINED'} onClick={() => { setPurpose('COMBINED'); if (combinedSelection) confirmedBackup.current = { selection: combinedSelection, purpose: 'COMBINED' }; setDraftRectangle(combinedSelection?.rectangle ?? null); setDraftDirty(false); setSelectionMode(true); if (combinedSelection) onCombinedSelection(null) }}>Избери изделие с размерите</button>{selectionMode && <button type="button" className="cancel-selection-button" onClick={cancelMarking}>Откажи маркирането</button>}<button type="button" onClick={() => { setSelectionMode(true); setDraftRectangle(null); setDraftDirty(true); if (purpose === 'OCR') onSelection(null); else onCombinedSelection(null) }}>Маркирай наново</button><button type="button" disabled={!currentRectangle} onClick={clear}>Изчисти зоната</button></div>
    {selectionMode && <div className="ocr-selection-banner" role="status">{purpose === 'OCR' ? 'Плъзнете върху чертежа, за да оградите текст или размер.' : 'Плъзнете около цялото изделие, размерните линии и близките означения.'}</div>}
    <div className={`drawing-source-stage ${fit ? 'fit' : ''} ${selectionMode ? 'selecting' : ''}`}><div className="drawing-rendered-page" onDragStart={(event) => event.preventDefault()} onPointerDown={(event) => begin(event, 'draw')} onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
      {source.metadata.kind === 'PDF'
        ? <canvas ref={canvas} aria-label={`Локално изобразена PDF страница ${page}`}/>
        : <img ref={image} draggable="false" src={source.objectUrl} alt={`Импортирана техническа скица ${source.metadata.fileName}`} style={{ width: `${zoom * 100}%` }} onLoad={(event) => setSourceDimensions({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}/>
      }
      {currentRectangle && sourceDimensions.width > 0 && <span className="ocr-selection-overlay" role="group" aria-label={`OCR зона ${Math.round(currentRectangle.width)} на ${Math.round(currentRectangle.height)} пиксела`} style={{ left: `${currentRectangle.x / sourceDimensions.width * 100}%`, top: `${currentRectangle.y / sourceDimensions.height * 100}%`, width: `${currentRectangle.width / sourceDimensions.width * 100}%`, height: `${currentRectangle.height / sourceDimensions.height * 100}%` }} onPointerDown={(event) => begin(event, 'move')} onPointerMove={move} onPointerUp={end} onPointerCancel={end}><span className="ocr-selection-size">{Math.round(currentRectangle.width)} × {Math.round(currentRectangle.height)} px</span>{selectionMode && handles.map((handle) => <button key={handle} type="button" className={`ocr-resize-handle ${handle}`} aria-label={`Преоразмери зона ${handle}`} onPointerDown={(event) => begin(event, 'resize', handle)} onPointerMove={move} onPointerUp={end} onPointerCancel={end}/>)}</span>}
    </div></div>
    <fieldset className="ocr-coordinate-fields"><legend>Клавиатурен избор в пиксели на оригиналното изображение</legend>{(['x', 'y', 'width', 'height'] as const).map((field) => <label key={field}>{field.toUpperCase()}<input type="number" min={field === 'x' || field === 'y' ? 0 : minimumSelectionSize} value={Math.round(currentRectangle?.[field] ?? 0)} onChange={(event) => { const next = clampOcrRectangle({ x: currentRectangle?.x ?? 0, y: currentRectangle?.y ?? 0, width: currentRectangle?.width ?? minimumSelectionSize, height: currentRectangle?.height ?? minimumSelectionSize, [field]: Number(event.target.value) }, sourceDimensions.width, sourceDimensions.height); invalidateConfirmation(); setSelectionMode(true); setDraftRectangle(next); setAnnouncement('Координатите на черновата са променени.') }}/></label>)}<button type="button" disabled={!draftRectangle || draftRectangle.width < minimumSelectionSize || draftRectangle.height < minimumSelectionSize} onClick={confirmSelection}>Потвърди избраната зона</button></fieldset>
    {draftRectangle && selectionMode && <p className="ocr-draft-guidance">Коригирайте рамката и потвърдете избраната зона. Режим: {purpose === 'OCR' ? 'OCR текст/размер' : 'изделие с размерите'}.</p>}
    <p className="sr-only" aria-live="polite">{announcement}</p>{error && <p className="field-error" role="alert">{error}</p>}<p className="immutable-note">Оригиналът е само за преглед и не се променя.</p>
  </section>
})
