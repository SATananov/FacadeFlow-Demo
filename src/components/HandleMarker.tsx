import { useId } from 'react'
import type { OpeningNotation } from '../productTypes'

type HandleNotation = Extract<OpeningNotation, 'SIDE_TRIANGLE_LEFT' | 'SIDE_TRIANGLE_RIGHT'>
interface Props { x: number; y: number; width: number; height: number; notation: HandleNotation; selected?: boolean }

export function HandleMarker({ x, y, width, height, notation, selected = false }: Props) {
  const clipId = `handle-clip-${useId().replaceAll(':', '')}`
  const padding = Math.max(2, Math.min(width, height) * .06)
  const markerX = notation === 'SIDE_TRIANGLE_LEFT' ? x + padding : x + width - padding
  const markerHalfHeight = Math.max(2.5, Math.min(width, height) * .08)
  const middle = y + height / 2
  return <g role="img" aria-label="Демонстрационно положение на дръжка" className={`handle-marker ${selected ? 'highlighted' : ''}`}>
    <defs><clipPath id={clipId}><rect x={x} y={y} width={width} height={height}/></clipPath></defs>
    <line clipPath={`url(#${clipId})`} x1={markerX} y1={middle - markerHalfHeight} x2={markerX} y2={middle + markerHalfHeight}/>
  </g>
}
