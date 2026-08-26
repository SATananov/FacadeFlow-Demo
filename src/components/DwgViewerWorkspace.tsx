import { useEffect, useMemo, useRef, useState } from 'react'
import { calculateSha256 } from '../drawingImportHash'
import { LibreDwgWorkerDecoder } from '../libreDwgDecoder'
import { toggleDwgLayer } from '../dwgLayerState'
import { DWG_LIMITS, type DwgDecodeResult, type DwgSourceMetadata } from '../dwgViewerTypes'
import { deriveDwgApproximateTextAssignments, detectDwgVisualFields } from '../dwgVisualFieldDetection'
import { detectImportFormat } from '../importSignatureInspection'
import { DwgCanvas } from './DwgCanvas'
import { DwgLayersPanel } from './DwgLayersPanel'
import { DwgSectionsPanel } from './DwgSectionsPanel'
import { DwgViewerToolbar } from './DwgViewerToolbar'

export function DwgViewerWorkspace({ onBack }: { onBack: () => void }) {
  const decoder = useRef<LibreDwgWorkerDecoder | null>(null), input = useRef<HTMLInputElement>(null)
  const [drawing, setDrawing] = useState<DwgDecodeResult | null>(null), [metadata, setMetadata] = useState<DwgSourceMetadata | null>(null), [visibleLayers, setVisibleLayers] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false), [progress, setProgress] = useState(0), [status, setStatus] = useState('Изберете локален DWG файл.'), [error, setError] = useState('')
  const [dark, setDark] = useState(false), [showText, setShowText] = useState(true), [approximateText, setApproximateText] = useState(true), [fitToken, setFitToken] = useState(0), [resetToken, setResetToken] = useState(0), [layout, setLayout] = useState('MODEL')
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const selectedSection = useMemo(() => drawing?.sections.find((section) => section.sectionId === selectedSectionId) ?? null, [drawing, selectedSectionId])
  const visualFields = useMemo(() => drawing ? detectDwgVisualFields(drawing.entities, drawing.sections, drawing.bounds, visibleLayers) : [], [drawing, visibleLayers])
  const approximateDisplay = useMemo(() => drawing ? deriveDwgApproximateTextAssignments(drawing.entities, visualFields, drawing.sections) : null, [drawing, visualFields])
  useEffect(() => () => { void decoder.current?.dispose() }, [])
  useEffect(() => { if (!selectedSectionId) return; const escape = (event: KeyboardEvent) => { if (event.key !== 'Escape') return; event.preventDefault(); event.stopPropagation(); setSelectedSectionId(null) }; window.addEventListener('keydown', escape, true); return () => window.removeEventListener('keydown', escape, true) }, [selectedSectionId])
  const clear = () => { void decoder.current?.dispose(); decoder.current = null; setDrawing(null); setMetadata(null); setVisibleLayers(new Set()); setBusy(false); setProgress(0); setError(''); setStatus('Изберете локален DWG файл.'); setDark(false); setShowText(true); setApproximateText(true); setFitToken(0); setResetToken(0); setLayout('MODEL'); setSelectedSectionId(null); if (input.current) input.current.value = '' }
  const toggleLayer = (name: string) => { const next = toggleDwgLayer(visibleLayers, name); setVisibleLayers(next); if (selectedSection?.boundaryLayer === name && !next.has(name)) setSelectedSectionId(null) }
  const open = async (file?: File) => {
    if (!file) return
    clear(); setBusy(true); setStatus('Проверка на локалния файл…')
    try {
      if (file.size <= 0 || file.size > DWG_LIMITS.maximumFileBytes) throw new Error(`DWG файлът трябва да бъде между 1 byte и ${DWG_LIMITS.maximumFileBytes / 1024 / 1024} MB.`)
      const bytes = await file.arrayBuffer(), signature = detectImportFormat(bytes, file.name)
      if (signature.format !== 'DWG') throw new Error('Файлът няма валидна AC10xx DWG заглавна част.')
      const sha256 = await calculateSha256(bytes)
      setMetadata({ fileName: file.name, sizeBytes: file.size, sha256, version: signature.version ?? 'AC10xx' })
      const instance = new LibreDwgWorkerDecoder((next, message) => { setProgress(next); setStatus(message) }); decoder.current = instance
      const result = await instance.decode(bytes, { maximumEntities: DWG_LIMITS.maximumEntities, maximumBlockDepth: DWG_LIMITS.maximumBlockDepth, maximumTextLength: DWG_LIMITS.maximumTextLength, maximumCoordinateMagnitude: DWG_LIMITS.maximumCoordinateMagnitude })
      setDrawing(result); setVisibleLayers(new Set(result.layers.filter((item) => item.initiallyVisible).map((item) => item.name))); setLayout('MODEL'); setProgress(1); setStatus(`Декодирани ${result.entities.length.toLocaleString('bg-BG')} визуализируеми обекта.`)
    } catch (reason) { const message = reason instanceof Error ? reason.message : 'DWG файлът не може да бъде декодиран локално.'; if (message !== 'Декодирането е прекратено.') setError(message); setStatus('Декодирането не завърши.') }
    finally { setBusy(false) }
  }
  return <section className="dwg-workspace" aria-labelledby="dwg-workspace-title">
    <div className="dwg-internal-warning" role="note"><b>ВЪТРЕШЕН ПРОТОТИП · ЛИЦЕНЗЪТ НЕ Е ОДОБРЕН ЗА ВЪНШНО РАЗПРОСТРАНЕНИЕ</b><span>INTERNAL EVALUATION ONLY — EXTERNAL DISTRIBUTION NOT APPROVED</span></div>
    <header><div><span className="route-badge">DWG · READ ONLY · LOCAL</span><h3 id="dwg-workspace-title">Локален технически DWG преглед</h3><p>LibreDWG/WASM работи в изолиран browser worker. Файлът остава в паметта и не се изпраща.</p></div><button type="button" onClick={() => { clear(); onBack() }}>Назад към форматите</button></header>
    {!drawing ? <div className="dwg-file-start"><div className="drawing-drop-zone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void open(event.dataTransfer.files[0]) }}><b>Пуснете локален DWG файл тук</b><p>Максимум 20 MB · AC10xx · без upload, conversion или export.</p><input ref={input} type="file" accept=".dwg,.DWG,application/acad,application/x-dwg,image/vnd.dwg" disabled={busy} onChange={(event) => void open(event.target.files?.[0])}/></div>{busy && <div className="dwg-progress" aria-live="polite"><progress max="1" value={progress}/><span>{status}</span><button type="button" onClick={() => { decoder.current?.cancel(); setBusy(false); setStatus('Декодирането е прекратено.') }}>Прекрати</button></div>}{error && <p className="field-error" role="alert">{error}</p>}</div> : <>
      <div className="dwg-source-meta"><span><b>{metadata?.fileName}</b></span><span>{((metadata?.sizeBytes ?? 0) / 1024 / 1024).toFixed(2)} MB</span><span>{metadata?.version}</span><span title={metadata?.sha256}>SHA-256: {metadata?.sha256}</span><button type="button" onClick={clear}>Премахни файла</button></div>
      <DwgViewerToolbar dark={dark} showText={showText} approximateText={approximateText} layouts={drawing.layouts} selectedLayout={layout} onFit={() => { setSelectedSectionId(null); setFitToken((value) => value + 1) }} onReset={() => setResetToken((value) => value + 1)} onDark={() => setDark((value) => !value)} onText={() => setShowText((value) => !value)} onApproximateText={() => setApproximateText((value) => !value)} onLayout={setLayout}/>
      <div className="dwg-approximate-status" role="status"><span>Приблизителният режим използва рамките на чертежа само за по-четимо визуално подреждане. Не е източник на производствени данни.</span>{approximateDisplay && <small>Source width: {approximateDisplay.summary.sourceWidthTexts} · Приблизително ограничени: {approximateText ? approximateDisplay.summary.approximateContainedTexts : 0} · Неразрешени: {approximateDisplay.summary.unresolvedTexts}</small>}</div>
      {drawing.layouts.some((item) => !item.renderable) && <p id="dwg-layout-status" className="dwg-layout-status" role="status"><b>Model е активният поддържан изглед.</b> Открит е Paper Space layout, но текущият decoder не предоставя неговите entities и viewport данни. Файлът не се изпраща никъде и не се показва празен или симулиран лист.</p>}
      <DwgSectionsPanel sections={drawing.sections} selectedSectionId={selectedSectionId} onSelect={setSelectedSectionId} onBack={() => setSelectedSectionId(null)}/>
      {selectedSection && <p className="dwg-section-status" role="status"><b>Избрана секция:</b> {drawing.sections.indexOf(selectedSection) + 1}. Нулиране възстановява fit на секцията; Escape или „Назад към целия чертеж“ връща целия Model.</p>}
      <div className="dwg-view-grid"><DwgCanvas drawing={drawing} visibleLayers={visibleLayers} showText={showText} approximateText={approximateText} approximateAssignments={approximateDisplay?.assignments ?? new Map()} dark={dark} fitToken={fitToken} resetToken={resetToken} selectedSection={selectedSection} onSelectSection={setSelectedSectionId} onBackToDrawing={() => setSelectedSectionId(null)}/><DwgLayersPanel layers={drawing.layers} visible={visibleLayers} onToggle={toggleLayer}/></div>
      <div className="dwg-inspection-grid"><section><h4>Обекти</h4>{Object.entries(drawing.entityCounts).sort().map(([type, count]) => <span key={type}>{type}: <b>{count}</b></span>)}</section><section><h4>Неподдържани / ресурси</h4>{drawing.warnings.length ? drawing.warnings.map((warning, index) => <p key={`${warning.code}-${index}`}>{warning.message}</p>) : <p>Няма отчетени предупреждения.</p>}</section><section><h4>Граници на Model space</h4><code>X {drawing.bounds.minX.toFixed(2)}…{drawing.bounds.maxX.toFixed(2)}<br/>Y {drawing.bounds.minY.toFixed(2)}…{drawing.bounds.maxY.toFixed(2)}</code></section></div>
      <footer className="dwg-safety-footer"><b>READ ONLY · СИМУЛАЦИЯ · МАШИННА ГОТОВНОСТ: НЕ</b><span>Геометрията не е производствено одобрена. Няма редактиране, export, операции или машинна връзка.</span></footer>
    </>}
  </section>
}
