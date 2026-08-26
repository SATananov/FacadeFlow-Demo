import { useMemo, useRef, useState } from 'react'
import { compareSkyGlazingSources } from '../skyGlazingComparison'
import { DEFAULT_SKYGLAZING_MAXIMUM_BYTES, prepareSkyGlazingLte, prepareSkyGlazingXml, type PreparedSkyGlazingLte, type PreparedSkyGlazingXml } from '../skyGlazingFileInspection'
import { SkyGlazingComparisonTable } from './SkyGlazingComparisonTable'
import { SkyGlazingSourceSummary } from './SkyGlazingSourceSummary'

export function SkyGlazingImportWorkspace({ onBack }: { onBack: () => void }) {
  const xmlInput = useRef<HTMLInputElement>(null), lteInput = useRef<HTMLInputElement>(null)
  const [xml, setXml] = useState<PreparedSkyGlazingXml | null>(null), [lte, setLte] = useState<PreparedSkyGlazingLte | null>(null)
  const [maximumBytes, setMaximumBytes] = useState(DEFAULT_SKYGLAZING_MAXIMUM_BYTES), [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const comparison = useMemo(() => xml && lte ? compareSkyGlazingSources(xml.inspection, lte.inspection) : null, [xml, lte])
  const choose = async (file?: File, expected?: 'XML' | 'LTE') => {
    if (!file) return
    const extension = file.name.split('.').pop()?.toUpperCase()
    if (extension !== 'XML' && extension !== 'LTE') { setError('Допускат се само изрично избрани .XML и .LTE файлове.'); return }
    if (expected && extension !== expected) { setError(`Избраното поле очаква ${expected} файл.`); return }
    setBusy(true); setError('')
    try { if (extension === 'XML') setXml(await prepareSkyGlazingXml(file, maximumBytes)); else setLte(await prepareSkyGlazingLte(file, maximumBytes)) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Файлът не може да бъде проверен безопасно.') }
    finally { setBusy(false) }
  }
  return <section className="sky-workspace" aria-labelledby="sky-workspace-title">
    <header><div><span className="route-badge">READ ONLY · LOCAL</span><h3 id="sky-workspace-title">SkyGlazing XML / LTE сравнение</h3><p>Източниците остават само в паметта на браузъра. Няма upload, запис, machine interpretation или export.</p></div><button type="button" onClick={onBack}>Назад към форматите</button></header>
    <div className="sky-limit"><label>Максимален размер на файл (MB)<input type="number" min="1" max="50" value={Math.round(maximumBytes / 1024 / 1024)} onChange={(event) => setMaximumBytes(Number(event.target.value) * 1024 * 1024)} /></label><span>Машинна готовност: <b>НЕ</b></span></div>
    <div className="sky-drop-grid">
      <div className="drawing-drop-zone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void choose(event.dataTransfer.files[0], 'XML') }}><b>SkyGlazing XML</b><p>Пуснете един локален XML или го изберете ръчно.</p><input ref={xmlInput} type="file" accept=".xml,.XML,application/xml,text/xml" onChange={(event) => void choose(event.target.files?.[0], 'XML')} /></div>
      <div className="drawing-drop-zone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void choose(event.dataTransfer.files[0], 'LTE') }}><b>LTE</b><p>Пуснете един локален LTE или го изберете ръчно.</p><input ref={lteInput} type="file" accept=".lte,.LTE,text/plain" onChange={(event) => void choose(event.target.files?.[0], 'LTE')} /></div>
    </div>
    {busy && <p aria-live="polite">Локална проверка, SHA-256 и inert read-only parsing…</p>}
    {error && <p className="field-error" role="alert">{error}</p>}
    <div className="sky-source-grid">{xml && <SkyGlazingSourceSummary source={xml.inspection.source} onClear={() => { setXml(null); if (xmlInput.current) xmlInput.current.value = '' }} />}{lte && <SkyGlazingSourceSummary source={lte.inspection.source} onClear={() => { setLte(null); if (lteInput.current) lteInput.current.value = '' }} />}</div>
    {xml && <section className="sky-section" aria-labelledby="xml-summary-title"><h3 id="xml-summary-title">XML обобщение</h3><div className="sky-counts"><span>Generator: {xml.inspection.generator || '—'}</span><span>Version: {xml.inspection.version || '—'}</span><span>Unit: {xml.inspection.unit || '—'}</span><span>Проект: {xml.inspection.projectName || '—'}</span><span>Bar: {xml.inspection.barCount}</span><span>Piece: {xml.inspection.pieceCount}</span><span>Work: {xml.inspection.workCount}</span><span>Уникални баркодове: {xml.inspection.uniqueBarcodeCount}</span><span>Уникални DXF профили: {xml.inspection.uniqueDxfProfileCount}</span></div><div className="sky-table-wrap"><table><thead><tr><th>№</th><th>DXF профил</th><th>MaxY</th><th>MaxZ</th><th>Баркод</th><th>Дължина</th><th>sxB</th><th>dxB</th><th>sxC</th><th>dxC</th><th>Операции</th><th>Наблюдавани имена</th></tr></thead><tbody>{xml.inspection.pieces.map((piece) => <tr key={`${piece.normalizedBarcode}-${piece.originalRecordIndex}`}><td>{piece.originalRecordIndex + 1}</td><td>{piece.dxfProfileName}</td><td>{piece.maxY}</td><td>{piece.maxZ}</td><td>{piece.barcode}</td><td>{piece.length}</td><td>{piece.sxB}</td><td>{piece.dxB}</td><td>{piece.sxC}</td><td>{piece.dxC}</td><td>{piece.operationCount}</td><td>{piece.operationNames.join(', ') || '—'}</td></tr>)}</tbody></table></div><p className="sky-boundary-note">Параметрите са показани като наблюдавана структура, без потвърдена машинна семантика.</p><details><summary>Сурова XML структура — escaped text</summary><pre>{xml.inspection.rawStructuralText}</pre></details></section>}
    {lte && <section className="sky-section" aria-labelledby="lte-summary-title"><h3 id="lte-summary-title">LTE обобщение</h3><div className="sky-counts"><span>Записи: {lte.inspection.recordCount}</span><span>Фиксирана ширина: {lte.inspection.fixedRecordWidth ?? 'нееднаква'}</span><span>Уникални баркодове: {lte.inspection.uniqueBarcodeCount}</span><span>Профилни групи: {lte.inspection.profileGroupCount}</span></div><p className="sky-boundary-note">Всички други fixed-width диапазони са UNRESOLVED до потвърждение от домейн експерт.</p><div className="sky-table-wrap"><table><thead><tr><th>Ред</th><th>Профилен token</th><th>Raw length token</th><th>Баркод</th><th>Оригинален неизменен ред</th></tr></thead><tbody>{lte.inspection.records.map((record) => <tr key={`${record.lineNumber}-${record.normalizedBarcode}`}><td>{record.lineNumber}</td><td>{record.profileToken}</td><td><code>{record.rawLengthToken}</code></td><td>{record.barcode}</td><td><code className="sky-raw-line">{record.originalLine}</code></td></tr>)}</tbody></table></div></section>}
    {comparison ? <SkyGlazingComparisonTable comparison={comparison} /> : <p className="sky-pair-prompt">Изберете и двата файла за barcode-only сравнение.</p>}
    <footer className="sky-readonly-footer"><b>Само read-only проверка.</b> Не се създават, редактират или експортират XML/LTE/DWG файлове и Work записите не създават операции.</footer>
  </section>
}
