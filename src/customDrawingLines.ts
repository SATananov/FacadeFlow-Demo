import { modelPointsDiffer, type ModelCoordinates } from './customDrawingCoordinates'

export interface CustomDrawingLine {
  id: string
  start: ModelCoordinates
  end: ModelCoordinates
}

export interface CustomDrawingLineLayer {
  nextId: number
  lines: CustomDrawingLine[]
}

export interface CustomDrawingLineMetrics {
  lengthMm: number
  angleDeg: number
}

export type CustomDrawingLineEndpoint = 'start' | 'end'

export function createCustomDrawingLineLayer(): CustomDrawingLineLayer {
  return { nextId: 1, lines: [] }
}

export function appendCustomDrawingLine(
  layer: CustomDrawingLineLayer,
  start: ModelCoordinates,
  end: ModelCoordinates,
): CustomDrawingLineLayer {
  if (!modelPointsDiffer(start, end)) return layer

  const line: CustomDrawingLine = {
    id: `line-${String(layer.nextId).padStart(4, '0')}`,
    start: { ...start },
    end: { ...end },
  }

  return {
    nextId: layer.nextId + 1,
    lines: [...layer.lines, line],
  }
}

export function findCustomDrawingLine(layer: CustomDrawingLineLayer, id: string | null): CustomDrawingLine | undefined {
  return id ? layer.lines.find((line) => line.id === id) : undefined
}

export function updateCustomDrawingLine(
  layer: CustomDrawingLineLayer,
  id: string,
  start: ModelCoordinates,
  end: ModelCoordinates,
): CustomDrawingLineLayer {
  if (!modelPointsDiffer(start, end)) return layer
  const index = layer.lines.findIndex((line) => line.id === id)
  if (index < 0) return layer
  const current = layer.lines[index]
  if (current.start.x === start.x && current.start.y === start.y && current.end.x === end.x && current.end.y === end.y) return layer
  const lines = [...layer.lines]
  lines[index] = { ...current, start: { ...start }, end: { ...end } }
  return { ...layer, lines }
}

export function updateCustomDrawingLineEndpoint(
  layer: CustomDrawingLineLayer,
  id: string,
  endpoint: CustomDrawingLineEndpoint,
  point: ModelCoordinates,
): CustomDrawingLineLayer {
  const line = findCustomDrawingLine(layer, id)
  if (!line) return layer
  return endpoint === 'start'
    ? updateCustomDrawingLine(layer, id, point, line.end)
    : updateCustomDrawingLine(layer, id, line.start, point)
}

export function getCustomDrawingLineTranslation(
  pointerStart: ModelCoordinates,
  pointerCurrent: ModelCoordinates,
  gridStep: number,
  snappingEnabled: boolean,
): ModelCoordinates {
  const raw = { x: pointerCurrent.x - pointerStart.x, y: pointerCurrent.y - pointerStart.y }
  if (!snappingEnabled || !Number.isFinite(gridStep) || gridStep <= 0) return raw
  return {
    x: Math.round(raw.x / gridStep) * gridStep,
    y: Math.round(raw.y / gridStep) * gridStep,
  }
}

export function translateCustomDrawingLine(
  layer: CustomDrawingLineLayer,
  id: string,
  delta: ModelCoordinates,
): CustomDrawingLineLayer {
  if (delta.x === 0 && delta.y === 0) return layer
  const line = findCustomDrawingLine(layer, id)
  if (!line) return layer
  return updateCustomDrawingLine(
    layer,
    id,
    { x: line.start.x + delta.x, y: line.start.y + delta.y },
    { x: line.end.x + delta.x, y: line.end.y + delta.y },
  )
}

export function removeCustomDrawingLine(layer: CustomDrawingLineLayer, id: string): CustomDrawingLineLayer {
  if (!layer.lines.some((line) => line.id === id)) return layer
  return { ...layer, lines: layer.lines.filter((line) => line.id !== id) }
}

export function getCustomDrawingLineMetrics(line: CustomDrawingLine): CustomDrawingLineMetrics {
  const dx = line.end.x - line.start.x
  const dy = line.end.y - line.start.y
  return {
    lengthMm: Math.hypot(dx, dy),
    angleDeg: Math.atan2(dy, dx) * 180 / Math.PI,
  }
}
