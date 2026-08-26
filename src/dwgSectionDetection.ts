import type { DwgBounds, DwgDrawableEntity, DwgPoint, DwgSection, DwgViewState } from './dwgViewerTypes'

export const DWG_SECTION_RULES = {
  endpointToleranceRatio: 1e-7,
  duplicateBoundsToleranceRatio: 1e-6,
  minimumWidthRatio: 0.2,
  minimumHeightRatio: 0.02,
  minimumAreaRatio: 0.02,
  minimumContentEntities: 8,
  clickMovementPixels: 5,
  fitPaddingPixels: 40,
} as const

interface RectangleCandidate {
  bounds: DwgBounds
  layer: string
  method: DwgSection['detectionMethod']
  sourceEntityIndices: number[]
  contentCount: number
}

const finiteEntityBounds = (bounds: DwgBounds) => Object.values(bounds).every(Number.isFinite) && bounds.maxX >= bounds.minX && bounds.maxY >= bounds.minY
const finiteBounds = (bounds: DwgBounds) => finiteEntityBounds(bounds) && bounds.maxX > bounds.minX && bounds.maxY > bounds.minY
const containsBounds = (outer: DwgBounds, inner: DwgBounds, tolerance = 0) => inner.minX >= outer.minX - tolerance && inner.maxX <= outer.maxX + tolerance && inner.minY >= outer.minY - tolerance && inner.maxY <= outer.maxY + tolerance
const boundsArea = (bounds: DwgBounds) => (bounds.maxX - bounds.minX) * (bounds.maxY - bounds.minY)

export function dwgEntityBounds(entity: DwgDrawableEntity): DwgBounds {
  if (entity.type === 'LINE') return { minX: Math.min(entity.start.x, entity.end.x), minY: Math.min(entity.start.y, entity.end.y), maxX: Math.max(entity.start.x, entity.end.x), maxY: Math.max(entity.start.y, entity.end.y) }
  if (entity.type === 'POLYLINE') return entity.points.reduce<DwgBounds>((bounds, point) => ({ minX: Math.min(bounds.minX, point.x), minY: Math.min(bounds.minY, point.y), maxX: Math.max(bounds.maxX, point.x), maxY: Math.max(bounds.maxY, point.y) }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity })
  if (entity.type === 'CIRCLE' || entity.type === 'ARC') return { minX: entity.center.x - entity.radius, minY: entity.center.y - entity.radius, maxX: entity.center.x + entity.radius, maxY: entity.center.y + entity.radius }
  if (entity.type === 'ELLIPSE') { const radius = Math.hypot(entity.major.x, entity.major.y); return { minX: entity.center.x - radius, minY: entity.center.y - radius, maxX: entity.center.x + radius, maxY: entity.center.y + radius } }
  return { minX: entity.position.x, minY: entity.position.y, maxX: entity.position.x, maxY: entity.position.y }
}

function closedPolylineCandidates(entities: DwgDrawableEntity[], tolerance: number): RectangleCandidate[] {
  return entities.flatMap((entity, index) => {
    if (entity.type !== 'POLYLINE' || !entity.closed || entity.points.length < 4) return []
    const bounds = dwgEntityBounds(entity)
    if (!finiteBounds(bounds)) return []
    const onRectangle = entity.points.every((point) => (Math.abs(point.x - bounds.minX) <= tolerance || Math.abs(point.x - bounds.maxX) <= tolerance) && (Math.abs(point.y - bounds.minY) <= tolerance || Math.abs(point.y - bounds.maxY) <= tolerance))
    const corners = [[bounds.minX, bounds.minY], [bounds.minX, bounds.maxY], [bounds.maxX, bounds.minY], [bounds.maxX, bounds.maxY]]
    if (!onRectangle || !corners.every(([x, y]) => entity.points.some((point) => Math.abs(point.x - x) <= tolerance && Math.abs(point.y - y) <= tolerance))) return []
    return [{ bounds, layer: entity.layer, method: 'CLOSED_POLYLINE_RECTANGLE' as const, sourceEntityIndices: [index], contentCount: 0 }]
  })
}

function lineLoopCandidates(entities: DwgDrawableEntity[], tolerance: number): RectangleCandidate[] {
  const quantize = (value: number) => Math.round(value / tolerance)
  const edgeKey = (layer: string, ax: number, ay: number, bx: number, by: number) => { const a = `${quantize(ax)},${quantize(ay)}`, b = `${quantize(bx)},${quantize(by)}`; return `${layer}|${a < b ? `${a}|${b}` : `${b}|${a}`}` }
  const lines = entities.flatMap((entity, index) => entity.type === 'LINE' ? [{ entity, index }] : [])
  const edgeMap = new Map<string, number>()
  for (const { entity, index } of lines) { const key = edgeKey(entity.layer, entity.start.x, entity.start.y, entity.end.x, entity.end.y); if (!edgeMap.has(key)) edgeMap.set(key, index) }
  const horizontal = lines.flatMap(({ entity, index }) => Math.abs(entity.start.y - entity.end.y) <= tolerance ? [{ layer: entity.layer, index, y: (entity.start.y + entity.end.y) / 2, minX: Math.min(entity.start.x, entity.end.x), maxX: Math.max(entity.start.x, entity.end.x) }] : [])
  const candidates: RectangleCandidate[] = []
  for (let first = 0; first < horizontal.length; first += 1) for (let second = first + 1; second < horizontal.length; second += 1) {
    const top = horizontal[first]!, bottom = horizontal[second]!
    if (top.layer !== bottom.layer || Math.abs(top.minX - bottom.minX) > tolerance || Math.abs(top.maxX - bottom.maxX) > tolerance || Math.abs(top.y - bottom.y) <= tolerance) continue
    const left = edgeMap.get(edgeKey(top.layer, top.minX, top.y, bottom.minX, bottom.y)), right = edgeMap.get(edgeKey(top.layer, top.maxX, top.y, bottom.maxX, bottom.y))
    if (left === undefined || right === undefined) continue
    candidates.push({ bounds: { minX: top.minX, minY: Math.min(top.y, bottom.y), maxX: top.maxX, maxY: Math.max(top.y, bottom.y) }, layer: top.layer, method: 'AXIS_ALIGNED_LINE_LOOP', sourceEntityIndices: [top.index, bottom.index, left, right].sort((a, b) => a - b), contentCount: 0 })
  }
  return candidates
}

export function detectDwgSections(entities: DwgDrawableEntity[], drawingBounds: DwgBounds): DwgSection[] {
  if (!finiteBounds(drawingBounds)) return []
  const drawingWidth = drawingBounds.maxX - drawingBounds.minX, drawingHeight = drawingBounds.maxY - drawingBounds.minY, drawingArea = drawingWidth * drawingHeight
  const diagonal = Math.hypot(drawingWidth, drawingHeight), tolerance = Math.max(diagonal * DWG_SECTION_RULES.endpointToleranceRatio, Number.EPSILON), duplicateTolerance = diagonal * DWG_SECTION_RULES.duplicateBoundsToleranceRatio
  const entityBounds = entities.map(dwgEntityBounds)
  const candidates = [...closedPolylineCandidates(entities, tolerance), ...lineLoopCandidates(entities, tolerance)].map((candidate) => ({ ...candidate, contentCount: entityBounds.filter((bounds, index) => !candidate.sourceEntityIndices.includes(index) && finiteEntityBounds(bounds) && containsBounds(candidate.bounds, bounds, tolerance)).length })).filter((candidate) => {
    const width = candidate.bounds.maxX - candidate.bounds.minX, height = candidate.bounds.maxY - candidate.bounds.minY
    return finiteBounds(candidate.bounds) && width / drawingWidth >= DWG_SECTION_RULES.minimumWidthRatio && height / drawingHeight >= DWG_SECTION_RULES.minimumHeightRatio && boundsArea(candidate.bounds) / drawingArea >= DWG_SECTION_RULES.minimumAreaRatio && candidate.contentCount >= DWG_SECTION_RULES.minimumContentEntities
  }).sort((a, b) => boundsArea(b.bounds) - boundsArea(a.bounds) || a.sourceEntityIndices[0]! - b.sourceEntityIndices[0]!)
  const deduplicated = candidates.filter((candidate, index) => !candidates.slice(0, index).some((other) => Math.abs(candidate.bounds.minX - other.bounds.minX) <= duplicateTolerance && Math.abs(candidate.bounds.minY - other.bounds.minY) <= duplicateTolerance && Math.abs(candidate.bounds.maxX - other.bounds.maxX) <= duplicateTolerance && Math.abs(candidate.bounds.maxY - other.bounds.maxY) <= duplicateTolerance))
  const outer = deduplicated.filter((candidate) => !deduplicated.some((other) => other !== candidate && boundsArea(other.bounds) > boundsArea(candidate.bounds) * 1.01 && containsBounds(other.bounds, candidate.bounds, tolerance)))
  return outer.sort((a, b) => b.bounds.maxY - a.bounds.maxY || a.bounds.minX - b.bounds.minX).map((candidate, index) => ({
    sectionId: `model-section-${String(index + 1).padStart(3, '0')}`,
    bounds: { ...candidate.bounds }, detectionMethod: candidate.method, confidence: 'HIGH',
    reason: `Доказана външна правоъгълна рамка с ${candidate.contentCount} съдържащи се обекта.`,
    sourceEntities: candidate.sourceEntityIndices.map((sourceIndex) => ({ sourceIndex, handle: entities[sourceIndex]?.handle ?? '' })),
    boundaryLayer: candidate.layer, simulationOnly: true, machineReady: false, internalEvaluationOnly: true,
  }))
}

export function hitTestDwgSection(sections: readonly DwgSection[], point: DwgPoint) {
  return sections.filter((section) => containsBounds(section.bounds, { minX: point.x, minY: point.y, maxX: point.x, maxY: point.y })).sort((a, b) => boundsArea(b.bounds) - boundsArea(a.bounds) || a.sectionId.localeCompare(b.sectionId))[0] ?? null
}

export function canvasPointToDwgWorld(point: DwgPoint, view: DwgViewState): DwgPoint {
  return { x: (point.x - view.offsetX) / view.scale, y: (view.offsetY - point.y) / view.scale }
}

export function isDwgSectionClick(start: DwgPoint, end: DwgPoint, threshold = DWG_SECTION_RULES.clickMovementPixels) {
  return Math.hypot(end.x - start.x, end.y - start.y) <= threshold
}

export function resolveDwgSectionSelection(sections: readonly DwgSection[], sectionId: string | null) {
  return sectionId ? sections.find((section) => section.sectionId === sectionId) ?? null : null
}

export function resolveDwgFocusBounds(drawingBounds: DwgBounds, sections: readonly DwgSection[], sectionId: string | null) {
  return resolveDwgSectionSelection(sections, sectionId)?.bounds ?? drawingBounds
}
