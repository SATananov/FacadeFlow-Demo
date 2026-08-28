import type { ComposerOpeningDirection } from './visualComposerTypes'

export interface OpeningGeometryDescriptor { direction: ComposerOpeningDirection; sidePath: string | null; tiltPath: string | null; bounds: { x: number; y: number; width: number; height: number } }
export function createOpeningGeometry(direction: ComposerOpeningDirection | null, x: number, y: number, width: number, height: number): OpeningGeometryDescriptor | null {
  if (!direction || direction === 'FIXED' || width <= 0 || height <= 0) return null
  const right = x + width, bottom = y + height, middleY = y + height / 2, middleX = x + width / 2
  const isLeft = direction === 'LEFT' || direction === 'TILT_LEFT', isRight = direction === 'RIGHT' || direction === 'TILT_RIGHT'
  return {
    direction,
    sidePath: isLeft ? `M ${x} ${y} L ${right} ${middleY} L ${x} ${bottom}` : isRight ? `M ${right} ${y} L ${x} ${middleY} L ${right} ${bottom}` : null,
    tiltPath: direction === 'TILT' || direction === 'TILT_LEFT' || direction === 'TILT_RIGHT' ? `M ${x} ${bottom} L ${middleX} ${y} L ${right} ${bottom}` : null,
    bounds: { x, y, width, height },
  }
}
