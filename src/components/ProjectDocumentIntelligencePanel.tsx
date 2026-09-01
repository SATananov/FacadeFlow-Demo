import { useMemo, useRef, useState } from 'react'
import { AI02_DOCUMENT_LIMITS, analyzeFacadeFlowDocumentSource, buildFacadeFlowDocumentCandidateGroups, extractFacadeFlowProjectDocument, type FacadeFlowProjectDocumentSource } from '../aiDocumentIntelligence'
import { facadeFlowDocumentIntentToGuidedPatch } from '../aiDocumentGuidedBridge'
import { updateFacadeFlowGuidedProduct } from '../aiWorkspaceState'
import type { FacadeFlowAiSession } from '../aiWorkspaceTypes'
import type { CatalogueProfile } from '../profileCatalogueTypes'
import { ParametricConstructionProposalPanel } from './ParametricConstructionProposalPanel'

interface Props {
  profiles: CatalogueProfile[]
  setSession: (updater: (current: FacadeFlowAiSession) => FacadeFlowAiSession) => void
  onOpenImportCenter: () => void
}

const statusLabel = {
  EXTRACTED: 'ТЕКСТЪТ Е ИЗВЛЕЧЕН',
  METADATA_ONLY: 'САМО PROVENANCE',
  FAILED: 'НЕУСПЕШНО',
  UNSUPPORTED: 'НЕПОДДЪРЖАНО',
} as const

const groupLabel = { SINGLE_SOURCE: '1 ИЗТОЧНИК', CORROBORATED: 'СЪВПАДА В НЯКОЛКО ИЗТОЧНИКА', CONFLICT: 'КОНФЛИКТ — HUMAN REVIEW' } as const

export function ProjectDocumentIntelligencePanel({ profiles, setSession, onOpenImportCenter }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [sources, setSources] = useState<FacadeFlowProjectDocumentSource[]>([])
  const [candidates, setCandidates] = useState<ReturnType<typeof analyzeFacadeFlowDocumentSource>>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const groups = useMemo(() => buildFacadeFlowDocumentCandidateGroups(candidates), [candidates])
  const selectedGroup = groups.find((group) => group.id === selectedGroupId) ?? null

  const addFiles = async (list: FileList | File[]) => {
    const files = Array.from(list).slice(0, AI02_DOCUMENT_LIMITS.maximumFiles)
    if (!files.length) return
    setBusy(true)
    setMessage('Локално четене на проектните източници…')
    try {
      const extracted = [] as FacadeFlowProjectDocumentSource[]
      for (const file of files) extracted.push(await extractFacadeFlowProjectDocument(file))
      const existingHashes = new Set(sources.map((source) => source.sha256))
      const unique = extracted.filter((source) => !existingHashes.has(source.sha256))
      const newCandidates = unique.flatMap(analyzeFacadeFlowDocumentSource)
      setSources((current) => [...current, ...unique])
      setCandidates((current) => [...current, ...newCandidates])
      setSelectedGroupId(null)
      setMessage(`${unique.length} нови източника · ${newCandidates.length} продуктови кандидата. Нищо не е приложено автоматично.`)
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const removeSource = (sourceId: string) => {
    setSources((current) => current.filter((source) => source.id !== sourceId))
    setCandidates((current) => current.filter((candidate) => candidate.sourceId !== sourceId))
    setSelectedGroupId(null)
  }

  const clear = () => {
    setSources([])
    setCandidates([])
    setSelectedGroupId(null)
    setMessage('')
  }

  const transferSelected = () => {
    if (!selectedGroup) return
    const bridge = facadeFlowDocumentIntentToGuidedPatch(selectedGroup.mergedIntent, profiles)
    setSession((current) => updateFacadeFlowGuidedProduct(current, bridge.patch, profiles))
    setMessage(`Прехвърлени са само ${bridge.transferred.length} съвместими стойности към Human Review формуляра. Геометрия не е създадена.`)
  }

  return <section className="ff-ai-document-intelligence" aria-labelledby="ff-ai02-title">
    <div className="ff-ai02-head">
      <div><span>AI02 · PROJECT DOCUMENT INTELLIGENCE · LOCAL</span><h3 id="ff-ai02-title">Дай проектния пакет и намери позиции за човешка проверка</h3><p>PDF с текстов слой и текстови спецификации се четат локално. Всеки кандидат пази файл, SHA-256 и страница. Конфликтите между документи не се разрешават автоматично.</p></div>
      <div className="ff-ai02-safety"><b>AUTOMATIC GEOMETRY: NO</b><b>RULES VALIDATED: NO</b><b>MACHINE READY: NO</b></div>
    </div>

    <div className="ff-ai02-drop" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void addFiles(event.dataTransfer.files) }}>
      <div><strong>Пусни проектни документи тук</strong><span>PDF, CSV, TXT, XML, JSON · DWG/DXF/XLSX/DOCX/изображения се пазят provenance-only</span><small>До {AI02_DOCUMENT_LIMITS.maximumFiles} файла · максимум {AI02_DOCUMENT_LIMITS.maximumFileBytes / 1024 / 1024} MB на файл · без upload</small></div>
      <button type="button" disabled={busy} onClick={() => inputRef.current?.click()}>{busy ? 'Разчитане…' : 'Избери документи'}</button>
      <input ref={inputRef} className="sr-only" type="file" multiple accept=".pdf,.csv,.txt,.md,.spec,.xml,.json,.lte,.dwg,.dxf,.xlsx,.docx,.png,.jpg,.jpeg,.webp" onChange={(event) => event.target.files && void addFiles(event.target.files)}/>
    </div>
    {message && <p className="ff-ai02-message" aria-live="polite">{message}</p>}

    {sources.length > 0 && <section className="ff-ai02-sources"><div className="ff-ai02-section-title"><div><span>01</span><h4>Източници и provenance</h4></div><button type="button" onClick={clear}>Изчисти пакета</button></div><div className="ff-ai02-source-grid">{sources.map((source) => <article key={source.id} className={`status-${source.extractionStatus.toLowerCase()}`}><header><div><b>{source.fileName}</b><span>{source.kind} · {(source.sizeBytes / 1024 / 1024).toFixed(2)} MB</span></div><strong>{statusLabel[source.extractionStatus]}</strong></header><dl><div><dt>SHA-256</dt><dd title={source.sha256}>{source.sha256.slice(0, 18)}…</dd></div><div><dt>Страници</dt><dd>{source.pageCount}</dd></div><div><dt>Кандидати</dt><dd>{candidates.filter((candidate) => candidate.sourceId === source.id).length}</dd></div></dl>{source.warnings.map((warning) => <p key={warning}>{warning}</p>)}<button type="button" onClick={() => removeSource(source.id)}>Премахни източника</button></article>)}</div><div className="ff-ai02-import-link"><span>За PDF OCR, image evidence и read-only DWG визуализация използвай съществуващия Import Center.</span><button type="button" onClick={onOpenImportCenter}>Отвори Import Center</button></div></section>}

    {sources.length > 0 && <section className="ff-ai02-candidates"><div className="ff-ai02-section-title"><div><span>02</span><h4>Разпознати продуктови позиции</h4></div><em>{groups.length} групи · {candidates.length} evidence кандидата</em></div>{groups.length === 0 ? <div className="ff-ai02-empty"><b>Няма безопасно разпознати позиции.</b><p>AI02 V1 търси редове/текстови блокове с изделие или марка плюс общи размери. Не гадае по чертежа и не OCR-ва автоматично сканирани страници.</p></div> : <div className="ff-ai02-group-list">{groups.map((group) => { const intent = group.mergedIntent; const selected = group.id === selectedGroupId; return <article key={group.id} className={`${selected ? 'selected' : ''} ${group.status === 'CONFLICT' ? 'conflict' : ''}`}><header><div><span>{group.mark || 'Без марка'}</span><h5>{intent.category === 'WINDOW' ? 'Прозорец' : intent.category === 'DOOR' ? 'Врата' : 'Тип неуточнен'} · {intent.dimensions.widthMm ?? '—'} × {intent.dimensions.heightMm ?? '—'} mm</h5></div><b>{groupLabel[group.status]}</b></header><div className="ff-ai02-group-meta"><span>Източници: {group.sourceIds.length}</span><span>Evidence: {group.candidateIds.length}</span><span>Система: {intent.profiles.system || 'неуточнена'}</span><span>Количество: {intent.quantity || 'неуточнено'}</span></div>{group.conflicts.length > 0 && <div className="ff-ai02-conflicts"><strong>Конфликти — FacadeFlow не избира победител:</strong>{group.conflicts.map((conflict) => <span key={conflict.field}>{conflict.label}: {conflict.values.join(' ↔ ')}</span>)}</div>}<details><summary>Покажи source evidence</summary>{group.candidates.map((candidate) => <blockquote key={candidate.id}><b>{candidate.sourceName} · стр. {candidate.pageNumber}</b><span>{candidate.excerpt}</span><small>SHA-256 {candidate.sourceSha256.slice(0, 16)}…</small></blockquote>)}</details><button type="button" className={selected ? 'selected' : ''} onClick={() => setSelectedGroupId(selected ? null : group.id)}>{selected ? 'Избрано за Human Review' : 'Избери позицията'}</button></article> })}</div>}</section>}

    {selectedGroup && <ParametricConstructionProposalPanel intent={selectedGroup.mergedIntent} sourceLabel={`Документна позиция ${selectedGroup.mark || selectedGroup.key}`}/>}

    {selectedGroup && <section className="ff-ai02-transfer"><div><span>04 · SAFE HANDOFF</span><h4>{selectedGroup.mark || 'Избрана позиция'} → структурирания Human Review формуляр</h4><p>Прехвърлят се само съвместими стойности. Конфликтните полета остават неуточнени. AI03 proposal геометрията остава отделна и не се прехвърля автоматично към CAD.</p></div><button type="button" className="primary-button" onClick={transferSelected}>Прехвърли безопасните стойности</button></section>}

    <footer className="ff-ai02-footer">DOCUMENTS STAY LOCAL · SOURCE EVIDENCE REQUIRED · HUMAN REVIEW REQUIRED · AUTOMATIC GEOMETRY: NO · MACHINE READY: NO</footer>
  </section>
}
