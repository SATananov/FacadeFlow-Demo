import { calculateDwgBounds } from './dwgBounds'
import { extractDwgLayers } from './dwgLayerState'
import { detectDwgSections } from './dwgSectionDetection'
import { normalizeDwgDisplayText } from './dwgTextNormalization'
import { DWG_LIMITS, DWG_SAFETY_FLAGS, type DwgDecodeOptions, type DwgDecodeResult, type DwgDrawableEntity, type DwgPoint, type DwgWarning } from './dwgViewerTypes'

type RawEntity = Record<string, unknown> & { type?: string; handle?: string; layer?: string }
type RawDatabase = { entities?: RawEntity[]; tables?: { LAYER?: { entries?: Array<Record<string, unknown>> }; BLOCK_RECORD?: { entries?: Array<Record<string, unknown> & { entities?: RawEntity[] }> }; STYLE?: { entries?: Array<Record<string, unknown>> } }; objects?: { LAYOUT?: Array<Record<string, unknown>>; IMAGEDEF?: unknown[] }; header?: Record<string, unknown> }
interface Transform { a: number; b: number; c: number; d: number; e: number; f: number }
const identity: Transform = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }
const point = (value: unknown): DwgPoint | null => { const p = value as Record<string, unknown> | null; return p && typeof p.x === 'number' && typeof p.y === 'number' ? { x: p.x, y: p.y } : null }
const apply = (p: DwgPoint, t: Transform): DwgPoint => ({ x: p.x * t.a + p.y * t.c + t.e, y: p.x * t.b + p.y * t.d + t.f })
export const applyDwgTransform = (p: DwgPoint, transform: Transform) => apply(p, transform)
const compose = (parent: Transform, child: Transform): Transform => ({ a: parent.a * child.a + parent.c * child.b, b: parent.b * child.a + parent.d * child.b, c: parent.a * child.c + parent.c * child.d, d: parent.b * child.c + parent.d * child.d, e: parent.a * child.e + parent.c * child.f + parent.e, f: parent.b * child.e + parent.d * child.f + parent.f })
const safeNumber = (value: unknown, fallback = 0) => typeof value === 'number' && Number.isFinite(value) ? value : fallback
const safeText = (value: unknown, maximum: number) => typeof value === 'string' ? value.slice(0, maximum) : ''
const numericValues = (value: unknown): number[] => typeof value === 'number' ? [value] : Array.isArray(value) ? value.flatMap(numericValues) : value && typeof value === 'object' ? Object.values(value).flatMap(numericValues) : []

function normalEntity(raw: RawEntity, transform: Transform, maximumTextLength: number): DwgDrawableEntity | null {
  const type = String(raw.type ?? '').toUpperCase(), handle = safeText(raw.handle, 128), layer = safeText(raw.layer, 512) || '0'
  if (type === 'LINE') { const start = point(raw.startPoint), end = point(raw.endPoint); return start && end ? { type, handle, layer, start: apply(start, transform), end: apply(end, transform) } : null }
  if (type === 'LWPOLYLINE' || type === 'POLYLINE2D' || type === 'POLYLINE3D' || type === 'POLYLINE') { const vertices = Array.isArray(raw.vertices) ? raw.vertices.map(point).filter((p): p is DwgPoint => Boolean(p)).map((p) => apply(p, transform)) : []; return vertices.length > 1 ? { type: 'POLYLINE', handle, layer, points: vertices, closed: (safeNumber(raw.flag) & 1) === 1 } : null }
  if (type === 'CIRCLE' || type === 'ARC') { const center = point(raw.center), radius = Math.abs(safeNumber(raw.radius)); if (!center || !radius) return null; return type === 'CIRCLE' ? { type, handle, layer, center: apply(center, transform), radius: radius * Math.hypot(transform.a, transform.b) } : { type, handle, layer, center: apply(center, transform), radius: radius * Math.hypot(transform.a, transform.b), startAngle: safeNumber(raw.startAngle), endAngle: safeNumber(raw.endAngle) } }
  if (type === 'ELLIPSE') { const center = point(raw.center), major = point(raw.majorAxisEndPoint); return center && major ? { type, handle, layer, center: apply(center, transform), major: apply(major, { ...transform, e: 0, f: 0 }), ratio: Math.abs(safeNumber(raw.axisRatio, 1)), startAngle: safeNumber(raw.startAngle), endAngle: safeNumber(raw.endAngle, Math.PI * 2) } : null }
  if (type === 'TEXT' || type === 'MTEXT') {
    if (raw.isVisible === false) return null
    const horizontalAlignment = safeNumber(raw.halign), verticalAlignment = safeNumber(raw.valign)
    const position = type === 'TEXT' && (horizontalAlignment !== 0 || verticalAlignment !== 0) ? point(raw.endPoint) ?? point(raw.startPoint) : point(type === 'TEXT' ? raw.startPoint : raw.insertionPoint)
    if (!position) return null
    const normalized = normalizeDwgDisplayText(safeText(raw.text, maximumTextLength))
    const transformScale = Math.hypot(transform.a, transform.b)
    return {
      type: 'TEXT', textKind: type, handle, layer, position: apply(position, transform),
      rawText: normalized.rawText, displayText: normalized.displayText,
      textWarnings: normalized.warnings, hadFormatting: normalized.hadFormatting,
      hadUnicodeEscapes: normalized.hadUnicodeEscapes,
      runs: normalized.runs,
      height: Math.abs(safeNumber(raw.textHeight, 1) * transformScale),
      rotation: safeNumber(raw.rotation) + Math.atan2(transform.b, transform.a),
      widthFactor: Math.abs(safeNumber(type === 'TEXT' ? raw.xScale : raw.widthFactor, 1)) || 1,
      referenceWidth: type === 'MTEXT' && safeNumber(raw.rectWidth) > 0 ? safeNumber(raw.rectWidth) * transformScale : null,
      sourceExtentsWidth: safeNumber(raw.extentsWidth) > 0 ? safeNumber(raw.extentsWidth) * transformScale : null,
      sourceExtentsHeight: safeNumber(raw.extentsHeight) > 0 ? safeNumber(raw.extentsHeight) * transformScale : null,
      horizontalAlignment, verticalAlignment,
      attachmentPoint: safeNumber(raw.attachmentPoint), lineSpacing: safeNumber(raw.lineSpacing, 1) || 1,
      lineSpacingStyle: safeNumber(raw.lineSpacingStyle, 1), drawingDirection: safeNumber(raw.drawingDirection, 5),
      styleName: safeText(raw.styleName, 256), obliqueAngle: safeNumber(raw.obliqueAngle),
    }
  }
  return null
}

export function normalizeDwgDatabase(database: RawDatabase, options: DwgDecodeOptions = {}): DwgDecodeResult {
  const maximumEntities = options.maximumEntities ?? DWG_LIMITS.maximumEntities, maximumTextLength = options.maximumTextLength ?? DWG_LIMITS.maximumTextLength, maximumCoordinate = options.maximumCoordinateMagnitude ?? DWG_LIMITS.maximumCoordinateMagnitude
  const rawEntities = database.entities ?? [], maximumDepth = options.maximumBlockDepth ?? DWG_LIMITS.maximumBlockDepth
  if (rawEntities.length > maximumEntities) throw new Error(`LIMIT_ENTITIES:${rawEntities.length}`)
  const entities: DwgDrawableEntity[] = [], unsupportedCounts: Record<string, number> = {}, entityCounts: Record<string, number> = {}
  const blockRecords = database.tables?.BLOCK_RECORD?.entries ?? [], blocks = new Map(blockRecords.map((entry) => [String(entry.name ?? ''), entry]))
  const process = (raw: RawEntity, transform: Transform, depth: number, path: ReadonlySet<string>) => {
    const rawType = String(raw.type ?? 'UNKNOWN').toUpperCase(); entityCounts[rawType] = (entityCounts[rawType] ?? 0) + 1
    if (rawType === 'INSERT') {
      const name = String(raw.name ?? ''), block = blocks.get(name)
      if (!block) { unsupportedCounts.INSERT_MISSING_BLOCK = (unsupportedCounts.INSERT_MISSING_BLOCK ?? 0) + 1; return }
      if (depth >= maximumDepth) throw new Error('LIMIT_BLOCK_DEPTH')
      if (path.has(name)) throw new Error('RECURSIVE_BLOCK')
      const insertion = point(raw.insertionPoint) ?? { x: 0, y: 0 }, base = point(block.basePoint) ?? { x: 0, y: 0 }, rotation = safeNumber(raw.rotation), xScale = safeNumber(raw.xScale, 1), yScale = safeNumber(raw.yScale, 1), cosine = Math.cos(rotation), sine = Math.sin(rotation)
      const a = cosine * xScale, b = sine * xScale, c = -sine * yScale, d = cosine * yScale
      const local: Transform = { a, b, c, d, e: insertion.x - a * base.x - c * base.y, f: insertion.y - b * base.x - d * base.y }, nextTransform = compose(transform, local), nextPath = new Set(path); nextPath.add(name)
      for (const child of block.entities ?? []) process(child, nextTransform, depth + 1, nextPath)
      return
    }
    const transformed = normalEntity(raw, transform, maximumTextLength)
    if (!transformed) { unsupportedCounts[rawType] = (unsupportedCounts[rawType] ?? 0) + 1; return }
    const numbers = numericValues(transformed)
    if (numbers.some((value) => !Number.isFinite(value) || Math.abs(value) > maximumCoordinate)) { unsupportedCounts.INVALID_NUMERIC = (unsupportedCounts.INVALID_NUMERIC ?? 0) + 1; return }
    if (entities.length >= maximumEntities) throw new Error(`LIMIT_ENTITIES:${entities.length + 1}`)
    entities.push(transformed)
  }
  for (const raw of rawEntities) process(raw, identity, 0, new Set())
  const layerEntries = database.tables?.LAYER?.entries ?? [], off = new Set(layerEntries.filter((entry) => entry.off === true).map((entry) => String(entry.name)))
  const warnings: DwgWarning[] = Object.entries(unsupportedCounts).map(([type, count]) => ({ code: 'UNSUPPORTED_ENTITY', message: `${type}: ${count} непрочетени обекта.`, count }))
  const xrefs = blockRecords.filter((entry) => (Number(entry.flags ?? 0) & (4 | 8 | 16)) !== 0).length
  if (xrefs) warnings.push({ code: 'EXTERNAL_REFERENCE', message: `${xrefs} външни зависимости не са заредени.`, count: xrefs })
  if ((database.objects?.IMAGEDEF?.length ?? 0) > 0) warnings.push({ code: 'EXTERNAL_REFERENCE', message: 'Външни растерни ресурси не се зареждат.', count: database.objects?.IMAGEDEF?.length })
  const sourceFonts = new Set((database.tables?.STYLE?.entries ?? []).map((entry) => String(entry.font ?? '').trim()).filter(Boolean))
  if (sourceFonts.size) warnings.push({ code: 'MISSING_FONT', message: `${sourceFonts.size} шрифтови дефиниции от източника използват локален резервен шрифт; външни файлове с шрифтове не се зареждат.`, count: sourceFonts.size })
  const longMTextWithoutWidth = entities.filter((entity) => entity.type === 'TEXT' && entity.textKind === 'MTEXT' && entity.referenceWidth === null && entity.rawText.length >= 80).length
  if (longMTextWithoutWidth) warnings.push({ code: 'TEXT_LAYOUT_LIMITATION', message: `${longMTextWithoutWidth} дълги MTEXT записа нямат надеждна ширина от източника и остават без автоматично пренасяне.`, count: longMTextWithoutWidth })
  const appliedInlineOverrides = entities.filter((entity) => entity.type === 'TEXT' && entity.runs.some((run) => run.heightScale !== 1 || run.widthScale !== 1)).length
  if (appliedInlineOverrides) warnings.push({ code: 'TEXT_LAYOUT_LIMITATION', message: `${appliedInlineOverrides} MTEXT записа съдържат локално приложени вградени метрики за височина/ширина; оригиналното сурово доказателство е запазено.`, count: appliedInlineOverrides })
  const bounds = calculateDwgBounds(entities)
  return { version: String(database.header?.version ?? database.header?.acadVersion ?? 'AC10xx'), entities, layers: extractDwgLayers(entities, off), layouts: [{ id: 'MODEL', name: 'Model', modelSpace: true, renderable: true }, ...(database.objects?.LAYOUT ?? []).filter((layout) => String(layout.layoutName ?? '').toUpperCase() !== 'MODEL').map((layout, index) => ({ id: String(layout.handle ?? index), name: String(layout.layoutName ?? `Layout ${index + 1}`), modelSpace: false, renderable: false, unsupportedReason: 'Липсват обекти и данни за изгледа на Paper Space от текущия декодер.' }))], sections: detectDwgSections(entities, bounds), bounds, entityCounts, unsupportedCounts, warnings, safety: DWG_SAFETY_FLAGS }
}

export function assertSafeBlockGraph(blocks: Record<string, string[]>, maximumDepth = DWG_LIMITS.maximumBlockDepth) {
  const visit = (name: string, path: Set<string>, depth: number) => { if (depth > maximumDepth) throw new Error('LIMIT_BLOCK_DEPTH'); if (path.has(name)) throw new Error('RECURSIVE_BLOCK'); const next = new Set(path); next.add(name); for (const child of blocks[name] ?? []) visit(child, next, depth + 1) }
  for (const name of Object.keys(blocks)) visit(name, new Set(), 0)
}
