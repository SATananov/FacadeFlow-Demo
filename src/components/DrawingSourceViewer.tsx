import { useEffect, useRef, useState } from 'react'
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist'
import type { DrawingSourceFile } from '../drawingImportTypes'

interface Props {
  source: DrawingSourceFile
  page: number
  onPage: (page: number) => void
}

export function DrawingSourceViewer({ source, page, onPage }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null)
  const [zoom, setZoom] = useState(1)
  const [fit, setFit] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (source.metadata.kind !== 'PDF') return
    let active = true
    let document: PDFDocumentProxy | null = null
    void import('pdfjs-dist').then(async (pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
      const task = pdfjs.getDocument({
        data: source.bytes.slice(0),
        disableFontFace: true,
        useSystemFonts: true,
        useWorkerFetch: false,
        useWasm: false,
        stopAtErrors: true,
      })
      document = await task.promise
      if (active) setPdf(document)
      else await document.cleanup()
    }).catch(() => active && setError('PDF файлът не може да бъде визуализиран безопасно.'))
    return () => { active = false; if (document) void document.cleanup(); setPdf(null) }
  }, [source])

  useEffect(() => {
    if (!pdf || !canvas.current) return
    let cancelled = false
    let renderTask: RenderTask | undefined
    void pdf.getPage(page).then((pdfPage) => {
      if (cancelled || !canvas.current) return
      const viewport = pdfPage.getViewport({ scale: zoom * 1.35 })
      const context = canvas.current.getContext('2d')
      if (!context) return
      canvas.current.width = viewport.width
      canvas.current.height = viewport.height
      renderTask = pdfPage.render({ canvas: canvas.current, canvasContext: context, viewport })
      return renderTask.promise
    }).catch((reason: unknown) => {
      if (!cancelled && !(reason instanceof Error && reason.name === 'RenderingCancelledException')) setError('Страницата не може да бъде изобразена.')
    })
    return () => { cancelled = true; renderTask?.cancel() }
  }, [page, pdf, zoom])

  const setScale = (next: number) => { setFit(false); setZoom(Math.min(3, Math.max(.5, next))) }
  return <section className="drawing-source-viewer" aria-labelledby="source-viewer-title">
    <div className="drawing-viewer-toolbar">
      <h3 id="source-viewer-title">Оригинален източник</h3>
      <div role="group" aria-label="Управление на визуализацията">
        <button type="button" onClick={() => setScale(zoom - .25)} aria-label="Намали мащаба">−</button>
        <span>{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => setScale(zoom + .25)} aria-label="Увеличи мащаба">+</button>
        <button type="button" onClick={() => { setFit(true); setZoom(1) }}>Побери страницата</button>
        <button type="button" onClick={() => { setFit(false); setZoom(1) }}>Нулирай</button>
      </div>
    </div>
    {source.metadata.kind === 'PDF' && <div className="drawing-page-navigation"><button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}>← Предишна</button><label>Страница <input type="number" min="1" max={source.metadata.pageCount} value={page} onChange={(event) => onPage(Math.min(source.metadata.pageCount, Math.max(1, Number(event.target.value))))}/></label><span>от {source.metadata.pageCount}</span><button type="button" disabled={page >= source.metadata.pageCount} onClick={() => onPage(page + 1)}>Следваща →</button></div>}
    <div className={`drawing-source-stage ${fit ? 'fit' : ''}`}>
      {source.metadata.kind === 'PDF' ? <canvas ref={canvas} aria-label={`Локално изобразена PDF страница ${page}`}/> : <img src={source.objectUrl} alt={`Импортирана техническа скица ${source.metadata.fileName}`} style={{ width: `${zoom * 100}%` }}/>} 
    </div>
    {error && <p className="field-error" role="alert">{error}</p>}
    <p className="immutable-note">Оригиналът е само за преглед и не се променя.</p>
  </section>
}
