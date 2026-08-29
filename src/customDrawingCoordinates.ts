export const CUSTOM_DRAWING_VIEW = {
  width: 820,
  height: 560,
  margin: 70,
} as const

export const CUSTOM_GRID_STEPS = [10, 25, 50, 100] as const
export type CustomGridStep = (typeof CUSTOM_GRID_STEPS)[number]

export const DEFAULT_CUSTOM_GRID_STEP: CustomGridStep = 50
export const CUSTOM_GRID_MAJOR_STEP = 500
export const CUSTOM_SNAP_MODE = 'GRID' as const

export interface DrawingTransform {
  scale: number
  width: number
  height: number
  ox: number
  oy: number
}

export interface ModelCoordinates {
  x: number
  y: number
}

export function getCustomDrawingTransform(productWidth: number, productHeight: number): DrawingTransform {
  const { width: viewWidth, height: viewHeight, margin } = CUSTOM_DRAWING_VIEW
  const scale = Math.min((viewWidth - margin * 2) / productWidth, (viewHeight - margin * 2) / productHeight)
  const width = productWidth * scale
  const height = productHeight * scale

  return {
    scale,
    width,
    height,
    ox: (viewWidth - width) / 2,
    oy: (viewHeight - height) / 2,
  }
}

export function modelToDrawingPoint(
  coordinates: ModelCoordinates,
  transform: DrawingTransform,
): ModelCoordinates {
  return {
    x: transform.ox + coordinates.x * transform.scale,
    y: transform.oy + transform.height - coordinates.y * transform.scale,
  }
}

export function drawingPointToModel(
  point: ModelCoordinates,
  transform: DrawingTransform,
): ModelCoordinates {
  return {
    x: (point.x - transform.ox) / transform.scale,
    y: (transform.oy + transform.height - point.y) / transform.scale,
  }
}

export function isPointInsideDrawingBounds(point: ModelCoordinates, transform: DrawingTransform): boolean {
  return (
    point.x >= transform.ox &&
    point.x <= transform.ox + transform.width &&
    point.y >= transform.oy &&
    point.y <= transform.oy + transform.height
  )
}

export function gridStepToPixels(step: number, transform: DrawingTransform): number {
  return step * transform.scale
}

export function formatCursorCoordinates(coordinates: ModelCoordinates | null): string {
  if (!coordinates) return 'X: — · Y: —'
  return `X: ${Math.round(coordinates.x)} mm · Y: ${Math.round(coordinates.y)} mm`
}

export function normalizeGridStep(value: number): CustomGridStep {
  return CUSTOM_GRID_STEPS.includes(value as CustomGridStep) ? value as CustomGridStep : DEFAULT_CUSTOM_GRID_STEP
}

/** Half-step ties resolve toward positive infinity, including negative coordinates. */
export function snapCoordinate(value: number, step: CustomGridStep): number {
  if (!Number.isFinite(value)) return value
  const snapped = Math.floor(value / step + 0.5) * step
  return Object.is(snapped, -0) ? 0 : snapped
}

export function snapModelPoint(point: ModelCoordinates, step: CustomGridStep, enabled: boolean): ModelCoordinates {
  if (!enabled) return { ...point }
  return { x: snapCoordinate(point.x, step), y: snapCoordinate(point.y, step) }
}

export function modelPointsDiffer(a: ModelCoordinates, b: ModelCoordinates): boolean {
  return a.x !== b.x || a.y !== b.y
}

export function formatSnapReadout(raw: ModelCoordinates | null, snapped: ModelCoordinates | null, enabled: boolean): string {
  if (!raw) return 'X: — · Y: —'
  const point = enabled && snapped ? snapped : raw
  return `X: ${point.x} mm · Y: ${point.y} mm · SNAP: ${enabled ? CUSTOM_SNAP_MODE : 'ИЗКЛ.'}`
}
