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
