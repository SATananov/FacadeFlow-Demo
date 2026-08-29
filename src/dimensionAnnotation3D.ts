import type { DimensionAnnotation, DimensionPoint } from './dimensionTypes'

export const DIMENSION_3D_STYLE = {
  text: '#17323a',
  background: 'rgba(247, 251, 251, 0.96)',
  border: '#087b91',
  line: '#087b91',
  extensionLine: '#78919a',
  font: '700 18px system-ui, sans-serif',
  horizontalPadding: 14,
  verticalPadding: 9,
  borderWidth: 2,
  renderOrder: 1000,
} as const

export function dimensionTextureRatio(devicePixelRatio = 1) {
  return Math.min(3, Math.max(1, devicePixelRatio))
}

export function dimensionDepthClearance(width: number, height: number) {
  return Math.max(width, height) * 0.002
}

export function dimensionWorldPoint(point: DimensionPoint, width: number, height: number) {
  return { x: point.x - width / 2, y: height / 2 - point.y, z: point.z + dimensionDepthClearance(width, height) }
}

export function dimensionLabelIsOutsideProduct(annotation: DimensionAnnotation, width: number, height: number) {
  const point = annotation.labelPosition
  return point.x < 0 || point.x > width || point.y < 0 || point.y > height || point.z !== 0
}

export function dimensionExternalLabelPoint(annotation: DimensionAnnotation, width: number, height: number) {
  const result = dimensionWorldPoint(annotation.labelPosition, width, height)
  const offset = Math.max(width, height) * 0.25
  if (annotation.labelPosition.x < 0) result.x -= offset
  else if (annotation.labelPosition.x > width) result.x += offset
  if (annotation.labelPosition.y < 0) result.y += offset
  else if (annotation.labelPosition.y > height) result.y -= offset
  return result
}

export function dimensionLabelWorldScale(width: number, height: number, aspect: number) {
  const productScaleGuard = Math.max(width, height) > 0 ? 1 : 0
  const labelHeight = 0.055 * productScaleGuard
  return { width: labelHeight * aspect, height: labelHeight }
}
