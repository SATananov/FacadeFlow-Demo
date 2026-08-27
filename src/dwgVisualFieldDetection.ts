import { dwgEntityBounds } from './dwgSectionDetection'
import type { DwgBounds, DwgDrawableEntity, DwgSection } from './dwgViewerTypes'

export const DWG_VISUAL_FIELD_RULES = { axisToleranceRatio: 1e-7, duplicateToleranceRatio: 1e-6, minimumTextHeightFactor: 2, paddingTextHeightFactor: 0.35, paddingFieldFactor: 0.02 } as const
export interface DwgVisualField { id: string; bounds: DwgBounds; sectionId: string; sourceEntities: ReadonlyArray<{ sourceIndex: number; handle: string }>; confidence: 'HIGH'; reason: string }
export interface DwgApproximateTextAssignment { entityIndex: number; mode: 'APPROXIMATE_FIELD'; fieldBounds: DwgBounds; innerBounds: DwgBounds; confidence: 'HIGH'; reason: string; sourceEntities: DwgVisualField['sourceEntities']; simulationOnly: true; machineReady: false; internalEvaluationOnly: true }
export interface DwgVisualTextSummary { sourceWidthTexts: number; approximateContainedTexts: number; unresolvedTexts: number }
export const resolveDwgTextDisplayMode = (enabled: boolean, assignment?: DwgApproximateTextAssignment) => enabled && assignment ? 'APPROXIMATE_FIELD' as const : 'SOURCE' as const
export function calculateDwgInnerFieldBounds(field: DwgBounds, textHeight: number): DwgBounds { const padding = Math.min(textHeight * DWG_VISUAL_FIELD_RULES.paddingTextHeightFactor, Math.min(field.maxX - field.minX, field.maxY - field.minY) * DWG_VISUAL_FIELD_RULES.paddingFieldFactor); return { minX: field.minX + padding, minY: field.minY + padding, maxX: field.maxX - padding, maxY: field.maxY - padding } }

const area = (bounds: DwgBounds) => (bounds.maxX - bounds.minX) * (bounds.maxY - bounds.minY)
const sameBounds = (a: DwgBounds, b: DwgBounds, tolerance: number) => Math.abs(a.minX - b.minX) <= tolerance && Math.abs(a.minY - b.minY) <= tolerance && Math.abs(a.maxX - b.maxX) <= tolerance && Math.abs(a.maxY - b.maxY) <= tolerance
const containsStrictly = (bounds: DwgBounds, x: number, y: number, tolerance: number) => x > bounds.minX + tolerance && x < bounds.maxX - tolerance && y > bounds.minY + tolerance && y < bounds.maxY - tolerance
const within = (value: number, start: number, end: number, tolerance: number) => value >= start - tolerance && value <= end + tolerance
type Segment = { fixed: number; start: number; end: number; index: number }

function mergedCoverage(segments: Segment[], fixed: number, start: number, end: number, tolerance: number) {
  const relevant = segments.filter((segment) => Math.abs(segment.fixed - fixed) <= tolerance && segment.end >= start - tolerance && segment.start <= end + tolerance).sort((a, b) => a.start - b.start || a.end - b.end || a.index - b.index)
  let covered = start
  const indices: number[] = []
  for (const segment of relevant) {
    if (segment.start > covered + tolerance) return null
    if (segment.end <= covered) continue
    covered = Math.max(covered, segment.end); indices.push(segment.index)
    if (covered >= end - tolerance) return [...new Set(indices)].sort((a, b) => a - b)
  }
  return null
}

export function detectDwgVisualFields(entities: readonly DwgDrawableEntity[], sections: readonly DwgSection[], drawingBounds: DwgBounds, visibleLayers?: ReadonlySet<string>): DwgVisualField[] {
  const diagonal = Math.hypot(drawingBounds.maxX - drawingBounds.minX, drawingBounds.maxY - drawingBounds.minY)
  const tolerance = Math.max(diagonal * DWG_VISUAL_FIELD_RULES.axisToleranceRatio, Number.EPSILON), duplicateTolerance = diagonal * DWG_VISUAL_FIELD_RULES.duplicateToleranceRatio
  const candidates: Array<{ bounds: DwgBounds; sectionId: string; indices: number[] }> = []
  for (const section of sections) {
    const horizontal: Segment[] = [], vertical: Segment[] = [], xs = new Set<number>(), ys = new Set<number>()
    entities.forEach((entity, index) => {
      if (visibleLayers && !visibleLayers.has(entity.layer)) return
      if (entity.type === 'POLYLINE' && entity.closed && entity.points.length >= 4) {
        const bounds = dwgEntityBounds(entity)
        if (sameBounds(bounds, section.bounds, tolerance)) return
        if (containsStrictly(section.bounds, (bounds.minX + bounds.maxX) / 2, (bounds.minY + bounds.maxY) / 2, -tolerance)) candidates.push({ bounds, sectionId: section.sectionId, indices: [index] })
        return
      }
      if (entity.type !== 'LINE') return
      const centerX = (entity.start.x + entity.end.x) / 2, centerY = (entity.start.y + entity.end.y) / 2
      if (!within(centerX, section.bounds.minX, section.bounds.maxX, tolerance) || !within(centerY, section.bounds.minY, section.bounds.maxY, tolerance)) return
      if (Math.abs(entity.start.y - entity.end.y) <= tolerance) { const fixed = (entity.start.y + entity.end.y) / 2; horizontal.push({ fixed, start: Math.min(entity.start.x, entity.end.x), end: Math.max(entity.start.x, entity.end.x), index }); ys.add(fixed) }
      else if (Math.abs(entity.start.x - entity.end.x) <= tolerance) { const fixed = (entity.start.x + entity.end.x) / 2; vertical.push({ fixed, start: Math.min(entity.start.y, entity.end.y), end: Math.max(entity.start.y, entity.end.y), index }); xs.add(fixed) }
    })
    const sortedX = [...xs].sort((a, b) => a - b), sortedY = [...ys].sort((a, b) => a - b)
    for (let xi = 0; xi < sortedX.length - 1; xi += 1) for (let yi = 0; yi < sortedY.length - 1; yi += 1) {
      const minX = sortedX[xi]!, maxX = sortedX[xi + 1]!, minY = sortedY[yi]!, maxY = sortedY[yi + 1]!
      if (maxX - minX <= tolerance || maxY - minY <= tolerance) continue
      const bottom = mergedCoverage(horizontal, minY, minX, maxX, tolerance), top = mergedCoverage(horizontal, maxY, minX, maxX, tolerance), left = mergedCoverage(vertical, minX, minY, maxY, tolerance), right = mergedCoverage(vertical, maxX, minY, maxY, tolerance)
      if (bottom && top && left && right) candidates.push({ bounds: { minX, minY, maxX, maxY }, sectionId: section.sectionId, indices: [...new Set([...bottom, ...top, ...left, ...right])].sort((a, b) => a - b) })
    }
  }
  const ordered = candidates.filter((candidate) => !sections.some((section) => section.sectionId === candidate.sectionId && sameBounds(candidate.bounds, section.bounds, duplicateTolerance))).sort((a, b) => area(a.bounds) - area(b.bounds) || a.sectionId.localeCompare(b.sectionId) || a.indices[0]! - b.indices[0]!)
  return ordered.filter((candidate, index) => !ordered.slice(0, index).some((other) => candidate.sectionId === other.sectionId && sameBounds(candidate.bounds, other.bounds, duplicateTolerance))).map((candidate, index) => ({ id: `visual-field-${String(index + 1).padStart(4, '0')}`, bounds: { ...candidate.bounds }, sectionId: candidate.sectionId, sourceEntities: Object.freeze(candidate.indices.map((sourceIndex) => Object.freeze({ sourceIndex, handle: entities[sourceIndex]?.handle ?? '' }))), confidence: 'HIGH', reason: 'Затворено правоъгълно поле с непрекъснато доказани source edges.' }))
}

export function deriveDwgApproximateTextAssignments(entities: readonly DwgDrawableEntity[], fields: readonly DwgVisualField[], sections: readonly DwgSection[]) {
  const assignments = new Map<number, DwgApproximateTextAssignment>()
  let sourceWidthTexts = 0, unresolvedTexts = 0
  entities.forEach((entity, entityIndex) => {
    if (entity.type !== 'TEXT' || entity.textKind !== 'MTEXT') return
    if (entity.referenceWidth !== null) { sourceWidthTexts += 1; return }
    const sectionMatches = sections.filter((section) => containsStrictly(section.bounds, entity.position.x, entity.position.y, 0))
    if (sectionMatches.length !== 1) { unresolvedTexts += 1; return }
    const section = sectionMatches[0]!, diagonal = Math.hypot(section.bounds.maxX - section.bounds.minX, section.bounds.maxY - section.bounds.minY), tolerance = diagonal * DWG_VISUAL_FIELD_RULES.axisToleranceRatio
    const matches = fields.filter((field) => field.sectionId === section.sectionId && containsStrictly(field.bounds, entity.position.x, entity.position.y, tolerance) && field.bounds.maxX - field.bounds.minX >= entity.height * DWG_VISUAL_FIELD_RULES.minimumTextHeightFactor && field.bounds.maxY - field.bounds.minY >= entity.height * DWG_VISUAL_FIELD_RULES.minimumTextHeightFactor && !sameBounds(field.bounds, section.bounds, tolerance))
    if (!matches.length) { unresolvedTexts += 1; return }
    const field = [...matches].sort((a, b) => area(a.bounds) - area(b.bounds) || a.id.localeCompare(b.id))[0]!
    assignments.set(entityIndex, { entityIndex, mode: 'APPROXIMATE_FIELD', fieldBounds: { ...field.bounds }, innerBounds: calculateDwgInnerFieldBounds(field.bounds, entity.height), confidence: 'HIGH', reason: field.reason, sourceEntities: field.sourceEntities, simulationOnly: true, machineReady: false, internalEvaluationOnly: true })
  })
  return { assignments, summary: { sourceWidthTexts, approximateContainedTexts: assignments.size, unresolvedTexts } satisfies DwgVisualTextSummary }
}
