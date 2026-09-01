import { interpretFacadeFlowPrompt, type FacadeFlowPromptRecognition } from './aiPromptInterpreter'
import { createFacadeFlowProductIntent, validateFacadeFlowProductIntent, type FacadeFlowProductIntent } from './aiProductIntent'
import { calculateSha256 } from './drawingImportHash'

export const AI02_DOCUMENT_LIMITS = {
  maximumFileBytes: 20 * 1024 * 1024,
  maximumFiles: 24,
  maximumPdfPages: 120,
  maximumTextCharactersPerFile: 400_000,
  maximumCandidatesPerFile: 120,
} as const

export type FacadeFlowProjectDocumentKind = 'PDF' | 'TEXT' | 'CSV' | 'XML' | 'JSON' | 'LTE' | 'DWG' | 'DXF' | 'XLSX' | 'DOCX' | 'IMAGE' | 'UNSUPPORTED'
export type FacadeFlowProjectDocumentExtractionStatus = 'EXTRACTED' | 'METADATA_ONLY' | 'FAILED' | 'UNSUPPORTED'

export interface FacadeFlowDocumentTextPage {
  pageNumber: number
  text: string
}

export interface FacadeFlowProjectDocumentSource {
  id: string
  fileName: string
  kind: FacadeFlowProjectDocumentKind
  mimeType: string
  sizeBytes: number
  sha256: string
  pageCount: number
  extractionStatus: FacadeFlowProjectDocumentExtractionStatus
  textPages: FacadeFlowDocumentTextPage[]
  warnings: string[]
  capturedAt: string
  humanReviewRequired: true
  readOnly: true
  simulationOnly: true
  machineReady: false
}

export interface FacadeFlowDocumentCandidate {
  id: string
  sourceId: string
  sourceName: string
  sourceSha256: string
  pageNumber: number
  excerpt: string
  intent: FacadeFlowProductIntent
  recognized: FacadeFlowPromptRecognition[]
  unresolved: string[]
  warnings: string[]
  validForHumanReview: boolean
  humanReviewRequired: true
  automaticGeometryAllowed: false
  rulesValidated: false
  simulationOnly: true
  machineReady: false
}

export interface FacadeFlowDocumentConflict {
  field: 'CATEGORY' | 'WIDTH' | 'HEIGHT' | 'QUANTITY' | 'SYSTEM' | 'FINISH' | 'GLAZING' | 'HANDLE' | 'FIELD_TOPOLOGY'
  label: string
  values: string[]
  candidateIds: string[]
}

export interface FacadeFlowDocumentCandidateGroup {
  id: string
  key: string
  mark?: string
  candidateIds: string[]
  sourceIds: string[]
  candidates: FacadeFlowDocumentCandidate[]
  conflicts: FacadeFlowDocumentConflict[]
  mergedIntent: FacadeFlowProductIntent
  status: 'SINGLE_SOURCE' | 'CORROBORATED' | 'CONFLICT'
  humanReviewRequired: true
  rulesValidated: false
  automaticGeometryAllowed: false
  simulationOnly: true
  machineReady: false
}

const compact = (value: string) => value.replace(/\s+/g, ' ').trim()
const extension = (fileName: string) => fileName.toLowerCase().split('.').pop() || ''

export function detectFacadeFlowProjectDocumentKind(fileName: string, bytes?: ArrayBuffer): FacadeFlowProjectDocumentKind {
  const ext = extension(fileName)
  const prefix = bytes ? new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes).slice(0, 32)) : ''
  if (prefix.startsWith('%PDF-') || ext === 'pdf') return 'PDF'
  if (/^AC10\d{2}/.test(prefix) || ext === 'dwg') return 'DWG'
  if (ext === 'dxf') return 'DXF'
  if (ext === 'csv') return 'CSV'
  if (ext === 'xml') return 'XML'
  if (ext === 'json') return 'JSON'
  if (ext === 'lte') return 'LTE'
  if (ext === 'txt' || ext === 'md' || ext === 'spec') return 'TEXT'
  if (ext === 'xlsx') return 'XLSX'
  if (ext === 'docx') return 'DOCX'
  if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) return 'IMAGE'
  return 'UNSUPPORTED'
}

function decodeProjectText(bytes: ArrayBuffer) {
  const view = new Uint8Array(bytes)
  if (view.includes(0)) throw new Error('Текстовият източник съдържа бинарни данни и няма да бъде интерпретиран като спецификация.')
  return new TextDecoder('utf-8', { fatal: false }).decode(view).slice(0, AI02_DOCUMENT_LIMITS.maximumTextCharactersPerFile)
}

async function extractPdfTextPages(bytes: ArrayBuffer): Promise<FacadeFlowDocumentTextPage[]> {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
  const task = pdfjs.getDocument({ data: bytes.slice(0), disableFontFace: true, useSystemFonts: true, useWorkerFetch: false, useWasm: false, stopAtErrors: true })
  try {
    const pdf = await task.promise
    if (pdf.numPages > AI02_DOCUMENT_LIMITS.maximumPdfPages) throw new Error(`PDF надвишава лимита от ${AI02_DOCUMENT_LIMITS.maximumPdfPages} страници.`)
    const pages: FacadeFlowDocumentTextPage[] = []
    let remaining = AI02_DOCUMENT_LIMITS.maximumTextCharactersPerFile
    for (let pageNumber = 1; pageNumber <= pdf.numPages && remaining > 0; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber)
      const content = await page.getTextContent()
      const text = content.items.map((item) => 'str' in item && typeof item.str === 'string' ? `${item.str}${'hasEOL' in item && item.hasEOL ? '\n' : ' '}` : '').join('').trim()
      const limited = text.slice(0, remaining)
      remaining -= limited.length
      pages.push({ pageNumber, text: limited })
      page.cleanup()
    }
    return pages
  } finally {
    await task.destroy()
  }
}

export async function extractFacadeFlowProjectDocument(file: File, sourceId = `document-${crypto.randomUUID()}`): Promise<FacadeFlowProjectDocumentSource> {
  const capturedAt = new Date().toISOString()
  const bytes = await file.arrayBuffer()
  const kind = detectFacadeFlowProjectDocumentKind(file.name, bytes)
  const sha256 = await calculateSha256(bytes)
  const base = {
    id: sourceId,
    fileName: file.name,
    kind,
    mimeType: file.type || 'неуказан',
    sizeBytes: file.size,
    sha256,
    capturedAt,
    humanReviewRequired: true as const,
    readOnly: true as const,
    simulationOnly: true as const,
    machineReady: false as const,
  }
  if (file.size <= 0) return { ...base, pageCount: 0, extractionStatus: 'FAILED', textPages: [], warnings: ['Файлът е празен.'] }
  if (file.size > AI02_DOCUMENT_LIMITS.maximumFileBytes) return { ...base, pageCount: 0, extractionStatus: 'FAILED', textPages: [], warnings: [`Файлът надвишава лимита от ${AI02_DOCUMENT_LIMITS.maximumFileBytes / 1024 / 1024} MB.`] }

  try {
    if (kind === 'PDF') {
      const textPages = await extractPdfTextPages(bytes)
      const textLength = textPages.reduce((sum, page) => sum + page.text.trim().length, 0)
      return {
        ...base,
        pageCount: textPages.length,
        extractionStatus: textLength ? 'EXTRACTED' : 'METADATA_ONLY',
        textPages,
        warnings: textLength ? [] : ['PDF няма извлекаем текстов слой. Използвай Import Center/OCR за сканирани страници; AI02 не измисля липсващ текст.'],
      }
    }
    if (kind === 'TEXT' || kind === 'CSV' || kind === 'XML' || kind === 'JSON' || kind === 'LTE') {
      const text = decodeProjectText(bytes)
      return { ...base, pageCount: 1, extractionStatus: 'EXTRACTED', textPages: [{ pageNumber: 1, text }], warnings: [] }
    }
    if (kind === 'DWG') {
      const header = new TextDecoder('ascii', { fatal: false }).decode(new Uint8Array(bytes).slice(0, 8))
      const validHeader = /^AC10\d{2}/.test(header)
      return { ...base, pageCount: 1, extractionStatus: validHeader ? 'METADATA_ONLY' : 'FAILED', textPages: [], warnings: [validHeader ? `DWG ${header.slice(0, 6)} е регистриран като provenance. Текст/геометрия не се прехвърлят автоматично; използвай read-only DWG viewer.` : 'DWG заглавната част не е потвърдена.'] }
    }
    if (kind === 'DXF') return { ...base, pageCount: 1, extractionStatus: 'METADATA_ONLY', textPages: [], warnings: ['DXF е provenance-only в AI02 V1. Геометрични записи не се интерпретират като продуктови стойности.'] }
    if (kind === 'XLSX') return { ...base, pageCount: 1, extractionStatus: 'METADATA_ONLY', textPages: [], warnings: ['XLSX е регистриран като източник, но листовете не се четат в AI02 V1. За автоматично локално извличане използвай CSV export.'] }
    if (kind === 'DOCX') return { ...base, pageCount: 1, extractionStatus: 'METADATA_ONLY', textPages: [], warnings: ['DOCX е регистриран като източник, но текстът не се извлича в AI02 V1. Използвай PDF с текстов слой или TXT.'] }
    if (kind === 'IMAGE') return { ...base, pageCount: 1, extractionStatus: 'METADATA_ONLY', textPages: [], warnings: ['Изображението е регистрирано като provenance. OCR остава отделен Human Review workflow в Import Center.'] }
    return { ...base, pageCount: 0, extractionStatus: 'UNSUPPORTED', textPages: [], warnings: ['Форматът не е поддържан от AI02 V1.'] }
  } catch (reason) {
    return { ...base, pageCount: 0, extractionStatus: 'FAILED', textPages: [], warnings: [reason instanceof Error ? reason.message : 'Документът не може да бъде прочетен безопасно.'] }
  }
}

const dimensionsPattern = /\b\d{2,5}(?:[.,]\d+)?\s*(?:mm|мм|cm|см|m|м)?\s*[xх×]\s*\d{2,5}(?:[.,]\d+)?\s*(?:mm|мм|cm|см|m|м)?\b/i
const markPatternGlobal = /\b(?:W|D|WIN|DOOR)[-_ ]?\d{1,4}\b/gi
const productPattern = /(?:прозорец|врата|\bwindow\b|\bdoor\b)/i
const systemLabelTailPattern = /(?:система|профилна\s+система|профил|system|profile(?:\s+system)?)\s*[:=-]?\s*$/i

function productMarkMatches(text: string) {
  return [...text.matchAll(markPatternGlobal)].filter((match) => {
    const index = match.index ?? 0
    const prefix = text.slice(Math.max(0, index - 48), index)
    return !systemLabelTailPattern.test(prefix)
  })
}

function normalizeDocumentMark(value: string) {
  return value.replace(/\s+/g, '-').toUpperCase()
}

function explicitDocumentCategory(text: string) {
  const semanticText = text.replace(/(?:система|профилна\s+система|профил|system|profile(?:\s+system)?)\s*[:=-]?\s*(?:W|D|WIN|DOOR)[-_ ]?\d{1,4}\b/gi, ' ')
  const windowMatch = semanticText.match(/(?:прозорец|прозорци|\bwindow\b|\bwindows\b)/i)
  if (windowMatch) return { category: 'WINDOW' as const, excerpt: windowMatch[0] }
  const doorMatch = semanticText.match(/(?:врата|врати|\bdoor\b|\bdoors\b)/i)
  if (doorMatch) return { category: 'DOOR' as const, excerpt: doorMatch[0] }
  return null
}

function looksLikeCandidate(context: string) {
  const hasDimensions = dimensionsPattern.test(context)
  const hasMark = productMarkMatches(context).length > 0
  const hasProductType = productPattern.test(context)
  const hasProductAttributes = /(?:профилна система|система|profile system|system|RAL|стъклопакет|glazing|панти|hinges?|дръжка|handle|количество|quantity|qty|полета|fields?|отваряем|opening|fixed|tilt|turn|sliding)/i.test(context)
  return (hasDimensions && (hasMark || hasProductType)) || (hasMark && hasProductAttributes)
}

function splitLineByProductMarks(line: string) {
  const marks = productMarkMatches(line)
  if (marks.length <= 1) return [line]
  return marks.map((match, index) => {
    const start = match.index ?? 0
    const end = marks[index + 1]?.index ?? line.length
    return compact(line.slice(start, end))
  })
}

function pageCandidateContexts(text: string) {
  const contexts: string[] = []
  const lines = text.split(/\r?\n|\f/).map(compact).filter(Boolean)
  const marksByLine = lines.map((line) => productMarkMatches(line))

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]!
    const marks = marksByLine[index]!
    if (marks.length > 1) {
      contexts.push(...splitLineByProductMarks(line))
      continue
    }
    if (marks.length === 1) {
      const bounded = [line]
      for (let next = index + 1; next < lines.length && next <= index + 3; next += 1) {
        if (marksByLine[next]!.length > 0) break
        bounded.push(lines[next]!)
      }
      contexts.push(compact(bounded.join('; ')))
      continue
    }
    if (looksLikeCandidate(line)) contexts.push(line)
  }

  if (lines.length === 1 && productMarkMatches(text).length > 1) contexts.push(...splitLineByProductMarks(text))
  return [...new Set(contexts.filter(looksLikeCandidate))]
}

function documentIntentFromPrompt(candidateId: string, source: FacadeFlowProjectDocumentSource, pageNumber: number, excerpt: string) {
  const interpreted = interpretFacadeFlowPrompt(excerpt, candidateId)
  const explicitMark = productMarkMatches(excerpt)[0]
  const explicitCategory = explicitDocumentCategory(excerpt)
  interpreted.intent.mark = explicitMark ? normalizeDocumentMark(explicitMark[0]) : undefined
  interpreted.intent.category = explicitCategory?.category ?? 'UNRESOLVED'
  interpreted.intent.unresolved = interpreted.intent.unresolved.filter((item) => item !== 'Тип изделие')
  if (!explicitCategory) interpreted.intent.unresolved.push('Тип изделие')
  interpreted.intent.unresolved = [...new Set(interpreted.intent.unresolved)]
  interpreted.recognized = interpreted.recognized.filter((item) => item.id !== 'mark' && item.id !== 'category')
  if (explicitMark) interpreted.recognized.unshift({ id: 'mark', label: 'Марка', value: interpreted.intent.mark!, confidence: 'HIGH', excerpt: explicitMark[0] })
  if (explicitCategory) interpreted.recognized.unshift({ id: 'category', label: 'Тип', value: explicitCategory.category === 'WINDOW' ? 'Прозорец' : 'Врата', confidence: 'HIGH', excerpt: explicitCategory.excerpt })
  const evidenceId = `${candidateId}-document-evidence`
  const intent: FacadeFlowProductIntent = {
    ...interpreted.intent,
    sourceKind: 'DOCUMENT',
    sourceText: excerpt,
    fields: interpreted.intent.fields.map((field) => ({ ...field, evidenceIds: [evidenceId] })),
    dividers: interpreted.intent.dividers.map((divider) => ({ ...divider, evidenceIds: [evidenceId] })),
    evidence: [{
      id: evidenceId,
      sourceKind: 'DOCUMENT',
      sourceName: source.fileName,
      excerpt,
      location: `стр. ${pageNumber} · SHA-256 ${source.sha256.slice(0, 16)}…`,
      strength: 'EXPLICIT',
    }],
    status: 'NEEDS_REVIEW',
    aiGenerated: true,
    humanReviewRequired: true,
    rulesValidated: false,
    automaticGeometryAllowed: false,
    simulationOnly: true,
    machineReady: false,
    productionApproved: false,
  }
  const validation = validateFacadeFlowProductIntent(intent)
  return { interpreted, intent, validation }
}

export function analyzeFacadeFlowDocumentSource(source: FacadeFlowProjectDocumentSource): FacadeFlowDocumentCandidate[] {
  if (source.extractionStatus !== 'EXTRACTED') return []
  const candidates: FacadeFlowDocumentCandidate[] = []
  const seen = new Set<string>()
  for (const page of source.textPages) {
    for (const context of pageCandidateContexts(page.text)) {
      const id = `${source.id}-p${page.pageNumber}-c${candidates.length + 1}`
      const { interpreted, intent, validation } = documentIntentFromPrompt(id, source, page.pageNumber, context)
      const key = [page.pageNumber, intent.mark || '', intent.category, intent.dimensions.widthMm || '', intent.dimensions.heightMm || '', intent.quantity || '', intent.profiles.system || '', intent.finish.exterior || '', intent.glazing.description || '', topologySignature(intent)].join(':').toLocaleLowerCase('bg')
      if (seen.has(key)) continue
      seen.add(key)
      candidates.push({
        id,
        sourceId: source.id,
        sourceName: source.fileName,
        sourceSha256: source.sha256,
        pageNumber: page.pageNumber,
        excerpt: context,
        intent,
        recognized: interpreted.recognized,
        unresolved: intent.unresolved,
        warnings: interpreted.warnings,
        validForHumanReview: validation.validForHumanReview,
        humanReviewRequired: true,
        automaticGeometryAllowed: false,
        rulesValidated: false,
        simulationOnly: true,
        machineReady: false,
      })
      if (candidates.length >= AI02_DOCUMENT_LIMITS.maximumCandidatesPerFile) return candidates
    }
  }
  return candidates
}

function distinct(values: Array<string | number | undefined>, serialize: (value: string | number) => string = (value) => String(value)) {
  const unique = new Map<string, string>()
  for (const value of values) {
    if (value === undefined || value === '') continue
    const display = String(value)
    const key = serialize(value)
    if (!unique.has(key)) unique.set(key, display)
  }
  return [...unique.values()]
}

function canonicalGlazingKey(value: string | number) {
  const normalized = compact(String(value)).toLocaleLowerCase('bg').replace(/[–—]/g, '-')
  if (/(?:троен\s+стъклопакет|triple\s+glaz(?:ing|ed\s+unit)|3\s*[- ]?pane|three\s*[- ]?pane)/i.test(normalized)) return 'GLAZING:TRIPLE'
  if (/(?:двоен\s+стъклопакет|double\s+glaz(?:ing|ed\s+unit)|2\s*[- ]?pane|two\s*[- ]?pane)/i.test(normalized)) return 'GLAZING:DOUBLE'
  if (/(?:единич(?:но|ен)\s+(?:стъкло|остъкляване)|single\s+glaz(?:ing|ed)|1\s*[- ]?pane|one\s*[- ]?pane)/i.test(normalized)) return 'GLAZING:SINGLE'
  return `GLAZING:RAW:${normalized}`
}

function canonicalHandleKey(value: string | number) {
  const normalized = compact(String(value)).toLocaleLowerCase('bg').replace(/[–—]/g, '-')
  const color = /(?:черн(?:а|о|и)|black)/i.test(normalized) ? 'BLACK'
    : /(?:бял(?:а|о|и)|white)/i.test(normalized) ? 'WHITE'
    : /(?:сив(?:а|о|и)|gr[ae]y)/i.test(normalized) ? 'GREY'
    : /(?:сребрист(?:а|о|и)|silver)/i.test(normalized) ? 'SILVER'
    : undefined
  const keyed = /(?:с\s*ключ|ключалк|keyed|with\s+key)/i.test(normalized) ? 'KEYED' : undefined
  if (color || keyed) return `HANDLE:${color || 'UNSPECIFIED'}:${keyed || 'STANDARD'}`
  if (/(?:дръжка|handle)/i.test(normalized)) return `HANDLE:RAW:${normalized.replace(/(?:дръжка|handle)/gi, '').trim() || 'GENERIC'}`
  return `HANDLE:RAW:${normalized}`
}

function topologySignature(intent: FacadeFlowProductIntent) {
  if (!intent.fields.length) return undefined
  return intent.fields.map((field) => `${field.order}:${field.role}:${field.openingType || ''}:${field.openingDirection || ''}:${field.swing || ''}`).join('|')
}

function conflictsFor(candidates: FacadeFlowDocumentCandidate[]): FacadeFlowDocumentConflict[] {
  const definitions: Array<[FacadeFlowDocumentConflict['field'], string, (candidate: FacadeFlowDocumentCandidate) => string | number | undefined, ((value: string | number) => string)?]> = [
    ['CATEGORY', 'Тип изделие', (candidate) => candidate.intent.category === 'UNRESOLVED' ? undefined : candidate.intent.category],
    ['WIDTH', 'Ширина', (candidate) => candidate.intent.dimensions.widthMm],
    ['HEIGHT', 'Височина', (candidate) => candidate.intent.dimensions.heightMm],
    ['QUANTITY', 'Количество', (candidate) => candidate.intent.quantity],
    ['SYSTEM', 'Профилна система', (candidate) => candidate.intent.profiles.system],
    ['FINISH', 'Цвят / покритие', (candidate) => candidate.intent.finish.exterior],
    ['GLAZING', 'Стъкло / пълнеж', (candidate) => candidate.intent.glazing.description, canonicalGlazingKey],
    ['HANDLE', 'Дръжка', (candidate) => candidate.intent.hardwareDefaults.handle, canonicalHandleKey],
    ['FIELD_TOPOLOGY', 'Полета / отваряемост', (candidate) => topologySignature(candidate.intent)],
  ]
  return definitions.flatMap(([field, label, getter, serialize]) => {
    const values = distinct(candidates.map(getter), serialize)
    return values.length > 1 ? [{ field, label, values, candidateIds: candidates.filter((candidate) => getter(candidate) !== undefined).map((candidate) => candidate.id) }] : []
  })
}

function consensus<T>(values: Array<T | undefined>, serialize: (value: T) => string = (value) => String(value)) {
  const present = values.filter((value): value is T => value !== undefined)
  if (!present.length) return undefined
  const unique = new Map(present.map((value) => [serialize(value), value]))
  return unique.size === 1 ? [...unique.values()][0] : undefined
}

function mergeCandidateGroup(groupId: string, candidates: FacadeFlowDocumentCandidate[], conflicts: FacadeFlowDocumentConflict[]) {
  const evidence = candidates.flatMap((candidate) => candidate.intent.evidence)
  const merged = createFacadeFlowProductIntent({ id: `${groupId}-merged`, sourceKind: 'DOCUMENT', sourceText: candidates.map((candidate) => `[${candidate.sourceName} · стр. ${candidate.pageNumber}] ${candidate.excerpt}`).join('\n'), aiGenerated: true })
  merged.mark = consensus(candidates.map((candidate) => candidate.intent.mark), (value) => value.toUpperCase())
  merged.name = consensus(candidates.map((candidate) => candidate.intent.name))
  merged.category = consensus(candidates.map((candidate) => candidate.intent.category === 'UNRESOLVED' ? undefined : candidate.intent.category)) ?? 'UNRESOLVED'
  merged.quantity = consensus(candidates.map((candidate) => candidate.intent.quantity))
  merged.dimensions.widthMm = consensus(candidates.map((candidate) => candidate.intent.dimensions.widthMm))
  merged.dimensions.heightMm = consensus(candidates.map((candidate) => candidate.intent.dimensions.heightMm))
  merged.profiles.system = consensus(candidates.map((candidate) => candidate.intent.profiles.system), (value) => value.toLocaleLowerCase('bg'))
  merged.profiles.frame = consensus(candidates.map((candidate) => candidate.intent.profiles.frame), (value) => value.toLocaleLowerCase('bg'))
  merged.profiles.sash = consensus(candidates.map((candidate) => candidate.intent.profiles.sash), (value) => value.toLocaleLowerCase('bg'))
  merged.profiles.mullion = consensus(candidates.map((candidate) => candidate.intent.profiles.mullion), (value) => value.toLocaleLowerCase('bg'))
  merged.profiles.threshold = consensus(candidates.map((candidate) => candidate.intent.profiles.threshold), (value) => value.toLocaleLowerCase('bg'))
  merged.finish.exterior = consensus(candidates.map((candidate) => candidate.intent.finish.exterior), (value) => value.toLocaleLowerCase('bg'))
  merged.finish.interior = consensus(candidates.map((candidate) => candidate.intent.finish.interior), (value) => value.toLocaleLowerCase('bg'))
  merged.glazing.description = consensus(candidates.map((candidate) => candidate.intent.glazing.description), canonicalGlazingKey)
  merged.glazing.thicknessMm = consensus(candidates.map((candidate) => candidate.intent.glazing.thicknessMm))
  merged.hardwareDefaults.handle = consensus(candidates.map((candidate) => candidate.intent.hardwareDefaults.handle), canonicalHandleKey)
  merged.hardwareDefaults.hinges = consensus(candidates.map((candidate) => candidate.intent.hardwareDefaults.hinges), (value) => value.toLocaleLowerCase('bg'))
  merged.hardwareDefaults.hingeQuantity = consensus(candidates.map((candidate) => candidate.intent.hardwareDefaults.hingeQuantity))
  merged.hardwareDefaults.mechanism = consensus(candidates.map((candidate) => candidate.intent.hardwareDefaults.mechanism), (value) => value.toLocaleLowerCase('bg'))
  merged.hardwareDefaults.lock = consensus(candidates.map((candidate) => candidate.intent.hardwareDefaults.lock), (value) => value.toLocaleLowerCase('bg'))
  const fields = consensus(candidates.map((candidate) => candidate.intent.fields.length ? candidate.intent.fields : undefined), (value) => JSON.stringify(value.map((field) => ({ order: field.order, role: field.role, openingType: field.openingType, openingDirection: field.openingDirection, swing: field.swing }))))
  merged.fields = fields ? fields.map((field) => ({ ...field })) : []
  merged.evidence = evidence
  merged.unresolved = [...new Set([
    ...candidates.flatMap((candidate) => candidate.intent.unresolved),
    ...conflicts.map((conflict) => `КОНФЛИКТ: ${conflict.label} (${conflict.values.join(' ↔ ')})`),
  ])]
  merged.status = 'NEEDS_REVIEW'
  return merged
}

export function buildFacadeFlowDocumentCandidateGroups(candidates: FacadeFlowDocumentCandidate[]): FacadeFlowDocumentCandidateGroup[] {
  const buckets = new Map<string, FacadeFlowDocumentCandidate[]>()
  for (const candidate of candidates) {
    const mark = candidate.intent.mark?.trim().toUpperCase()
    const key = mark ? `MARK:${mark}` : `CANDIDATE:${candidate.id}`
    buckets.set(key, [...(buckets.get(key) || []), candidate])
  }
  return [...buckets.entries()].map(([key, items], index) => {
    const conflicts = conflictsFor(items)
    const sourceIds = [...new Set(items.map((item) => item.sourceId))]
    const status: FacadeFlowDocumentCandidateGroup['status'] = conflicts.length ? 'CONFLICT' : sourceIds.length > 1 ? 'CORROBORATED' : 'SINGLE_SOURCE'
    const id = `document-group-${index + 1}`
    return {
      id,
      key,
      mark: items[0]?.intent.mark,
      candidateIds: items.map((item) => item.id),
      sourceIds,
      candidates: items,
      conflicts,
      mergedIntent: mergeCandidateGroup(id, items, conflicts),
      status,
      humanReviewRequired: true,
      rulesValidated: false,
      automaticGeometryAllowed: false,
      simulationOnly: true,
      machineReady: false,
    }
  })
}
