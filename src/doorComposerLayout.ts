import type { DoorField } from './doorComposerTypes'

export interface LayoutBounds { x: number; y: number; width: number; height: number }
export interface DoorHardwareAnchor { x: number; y: number; bounds: LayoutBounds }
export interface DoorDrawingLayout {
  frame: LayoutBounds
  scale: number
  horizontalDimension: { x1: number; y1: number; x2: number; y2: number }
  verticalDimension: { x1: number; y1: number; x2: number; y2: number }
  threshold: { x1: number; y1: number; x2: number; y2: number }
}

export function calculateProportionalProductBounds(productWidth: number, productHeight: number, available: LayoutBounds, padding = 0): LayoutBounds & { scale: number } {
  const innerWidth = Math.max(0, available.width - padding * 2)
  const innerHeight = Math.max(0, available.height - padding * 2)
  if (![productWidth, productHeight, innerWidth, innerHeight].every(Number.isFinite) || productWidth <= 0 || productHeight <= 0 || innerWidth <= 0 || innerHeight <= 0) {
    return { x: available.x + available.width / 2, y: available.y + available.height / 2, width: 0, height: 0, scale: 0 }
  }
  const scale = Math.min(innerWidth / productWidth, innerHeight / productHeight)
  const width = productWidth * scale, height = productHeight * scale
  return { x: available.x + (available.width - width) / 2, y: available.y + (available.height - height) / 2, width, height, scale }
}

export const calculateDoorFieldBounds = (frame: LayoutBounds, field: Pick<DoorField, 'rect'>): LayoutBounds => ({
  x: frame.x + field.rect.x * frame.width,
  y: frame.y + field.rect.y * frame.height,
  width: field.rect.width * frame.width,
  height: field.rect.height * frame.height,
})

/** Leaf-local conceptual anchor. The marker touches the selected leaf edge and stays inside its bounds. */
export function calculateDoorHingeAnchor(leaf: LayoutBounds, side: 'LEFT' | 'RIGHT', positionRatio: number, markerWidth: number, markerHeight: number, verticalAxis: 'DOWN' | 'UP' = 'DOWN'): DoorHardwareAnchor {
  const width = Math.min(Math.max(0, markerWidth), Math.max(0, leaf.width))
  const height = Math.min(Math.max(0, markerHeight), Math.max(0, leaf.height))
  const ratio = Math.max(0, Math.min(1, positionRatio))
  const centerY = verticalAxis === 'DOWN' ? leaf.y + ratio * leaf.height : leaf.y + (1 - ratio) * leaf.height
  const x = side === 'LEFT' ? leaf.x : leaf.x + leaf.width - width
  const y = Math.max(leaf.y, Math.min(leaf.y + leaf.height - height, centerY - height / 2))
  return { x: side === 'LEFT' ? leaf.x : leaf.x + leaf.width, y: centerY, bounds: { x, y, width, height } }
}

export function findDoorDropTarget(fields: readonly DoorField[], frame: LayoutBounds, svgX: number, svgY: number): string | null {
  if (!Number.isFinite(svgX) || !Number.isFinite(svgY)) return null
  const field = fields.find(candidate => {
    const bounds = calculateDoorFieldBounds(frame, candidate)
    return svgX >= bounds.x && svgX <= bounds.x + bounds.width && svgY >= bounds.y && svgY <= bounds.y + bounds.height
  })
  return field?.role === 'DOOR_LEAF' ? field.id : null
}

export function calculateDoorDrawingLayout(productWidth: number, productHeight: number): DoorDrawingLayout {
  const frame = calculateProportionalProductBounds(productWidth, productHeight, { x: 78, y: 48, width: 644, height: 410 })
  return {
    frame,
    scale: frame.scale,
    horizontalDimension: { x1: frame.x, y1: frame.y - 22, x2: frame.x + frame.width, y2: frame.y - 22 },
    verticalDimension: { x1: frame.x - 28, y1: frame.y, x2: frame.x - 28, y2: frame.y + frame.height },
    threshold: { x1: frame.x, y1: frame.y + frame.height, x2: frame.x + frame.width, y2: frame.y + frame.height },
  }
}

export function calculateDoorThumbnailFieldBounds(field: Pick<DoorField, 'rect'>): LayoutBounds {
  return calculateDoorFieldBounds({ x: 35, y: 5, width: 50, height: 112 }, field)
}
