import type { OcrRectangle } from './ocrTypes'

export function clampOcrRectangle(rectangle: OcrRectangle, sourceWidth: number, sourceHeight: number): OcrRectangle {
  const x = Math.max(0, Math.min(sourceWidth - 1, rectangle.x))
  const y = Math.max(0, Math.min(sourceHeight - 1, rectangle.y))
  return { x, y, width: Math.max(1, Math.min(sourceWidth - x, rectangle.width)), height: Math.max(1, Math.min(sourceHeight - y, rectangle.height)) }
}

export function displayPointToSource(clientX: number, clientY: number, bounds: DOMRect, sourceWidth: number, sourceHeight: number) {
  return { x: (clientX - bounds.left) * sourceWidth / bounds.width, y: (clientY - bounds.top) * sourceHeight / bounds.height }
}
