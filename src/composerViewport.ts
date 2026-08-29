export interface ViewportRect { x: number; y: number; width: number; height: number }
export interface ViewportPadding { top: number; right: number; bottom: number; left: number }

export const DEFAULT_DRAWABLE_PADDING: ViewportPadding = { top: 12, right: 12, bottom: 12, left: 12 }

export function isValidDrawableSize(width: number, height: number) {
  return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0
}

export function fitVisualBounds(visual: ViewportRect, drawableWidth: number, drawableHeight: number, padding: ViewportPadding = DEFAULT_DRAWABLE_PADDING) {
  const availableWidth = Math.max(0, drawableWidth - padding.left - padding.right)
  const availableHeight = Math.max(0, drawableHeight - padding.top - padding.bottom)
  if (!isValidDrawableSize(availableWidth, availableHeight) || !isValidDrawableSize(visual.width, visual.height)) return null
  const scale = Math.min(availableWidth / visual.width, availableHeight / visual.height)
  const width = visual.width * scale, height = visual.height * scale
  return { scale, rect: { x: padding.left + (availableWidth - width) / 2, y: padding.top + (availableHeight - height) / 2, width, height } }
}

export function containsVisualBounds(drawableWidth: number, drawableHeight: number, rect: ViewportRect, padding: ViewportPadding = DEFAULT_DRAWABLE_PADDING) {
  const epsilon = .5
  return rect.x >= padding.left - epsilon && rect.y >= padding.top - epsilon && rect.x + rect.width <= drawableWidth - padding.right + epsilon && rect.y + rect.height <= drawableHeight - padding.bottom + epsilon
}
