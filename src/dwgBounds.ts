import type { DwgBounds, DwgDrawableEntity, DwgPoint, DwgViewState } from './dwgViewerTypes'

const include = (bounds: DwgBounds, point: DwgPoint) => ({ minX: Math.min(bounds.minX, point.x), minY: Math.min(bounds.minY, point.y), maxX: Math.max(bounds.maxX, point.x), maxY: Math.max(bounds.maxY, point.y) })
export function calculateDwgBounds(entities: DwgDrawableEntity[]): DwgBounds {
  let bounds: DwgBounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  for (const entity of entities) {
    if (entity.type === 'LINE') { bounds = include(include(bounds, entity.start), entity.end); continue }
    if (entity.type === 'POLYLINE') { for (const point of entity.points) bounds = include(bounds, point); continue }
    if (entity.type === 'CIRCLE' || entity.type === 'ARC') { bounds = include(include(bounds, { x: entity.center.x - entity.radius, y: entity.center.y - entity.radius }), { x: entity.center.x + entity.radius, y: entity.center.y + entity.radius }); continue }
    if (entity.type === 'ELLIPSE') { const radius = Math.hypot(entity.major.x, entity.major.y); bounds = include(include(bounds, { x: entity.center.x - radius, y: entity.center.y - radius }), { x: entity.center.x + radius, y: entity.center.y + radius }); continue }
    bounds = include(bounds, entity.position)
  }
  return Number.isFinite(bounds.minX) ? bounds : { minX: 0, minY: 0, maxX: 1, maxY: 1 }
}

export function fitDwgView(bounds: DwgBounds, width: number, height: number, padding = 32): DwgViewState {
  const drawingWidth = Math.max(bounds.maxX - bounds.minX, 1), drawingHeight = Math.max(bounds.maxY - bounds.minY, 1)
  const scale = Math.min((Math.max(width, 1) - padding * 2) / drawingWidth, (Math.max(height, 1) - padding * 2) / drawingHeight)
  return { scale: Math.max(0.000001, scale), offsetX: (width - drawingWidth * scale) / 2 - bounds.minX * scale, offsetY: (height - drawingHeight * scale) / 2 + bounds.maxY * scale }
}

export function zoomDwgView(view: DwgViewState, factor: number, anchorX: number, anchorY: number): DwgViewState {
  const scale = Math.min(1_000_000, Math.max(0.000001, view.scale * factor)), ratio = scale / view.scale
  return { scale, offsetX: anchorX - (anchorX - view.offsetX) * ratio, offsetY: anchorY - (anchorY - view.offsetY) * ratio }
}
