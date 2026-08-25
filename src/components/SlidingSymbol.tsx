import { useId } from 'react'
import type { OpeningNotation } from '../productTypes'

type SlidingNotation = Extract<OpeningNotation, 'SLIDING_LEFT' | 'SLIDING_RIGHT' | 'SLIDING_BIDIRECTIONAL' | 'JUNCTION_BIDIRECTIONAL' | 'JUNCTION_OPPOSED_STACKED'>
interface Props { centerX: number; centerY: number; panelWidth: number; availableWidth: number; availableHeight: number; drawingScale: number; notation: SlidingNotation; selected?: boolean }

const clamp = (value: number, minimum: number, maximum: number) => Math.min(Math.max(value, minimum), maximum)

export function SlidingSymbol({ centerX, centerY, panelWidth, availableWidth, availableHeight, drawingScale, notation, selected = false }: Props) {
  const clipId = `sliding-clip-${useId().replaceAll(':', '')}`
  const stacked = notation === 'JUNCTION_OPPOSED_STACKED'
  const junctionBidirectional = notation === 'JUNCTION_BIDIRECTIONAL'
  const minimumLength = 9 * drawingScale
  const maximumLength = 36 * drawingScale
  const halfLength = junctionBidirectional
    ? Math.min(panelWidth * .56, availableWidth * .9) / 2
    : stacked
    ? clamp(panelWidth * .3, minimumLength, Math.min(maximumLength, availableWidth / 2))
    : clamp(panelWidth * .16, minimumLength / 2, Math.min(maximumLength / 2, availableWidth / 2))
  const left = centerX - halfLength, right = centerX + halfLength
  const separation = stacked ? clamp(availableHeight * .055, 5 * drawingScale, 11 * drawingScale) : 0
  const arrowSize = clamp(halfLength * .24, 3 * drawingScale, 7 * drawingScale)
  const clipX = centerX - availableWidth / 2, clipY = centerY - availableHeight / 2
  const leftArrow = notation === 'SLIDING_LEFT' || notation === 'SLIDING_BIDIRECTIONAL' || notation === 'JUNCTION_BIDIRECTIONAL'
  const rightArrow = notation === 'SLIDING_RIGHT' || notation === 'SLIDING_BIDIRECTIONAL' || notation === 'JUNCTION_BIDIRECTIONAL'
  const description = notation === 'SLIDING_LEFT' ? 'Плъзгане — демонстрационна посока наляво' : notation === 'SLIDING_RIGHT' ? 'Плъзгане — демонстрационна посока надясно' : stacked ? 'Плъзгане — две противоположни демонстрационни посоки при срещата' : 'Плъзгане — двупосочна демонстрационна посока при срещата'
  const bidirectionalGeometry = <><line x1={left} y1={centerY} x2={right} y2={centerY}/>{leftArrow && <path d={`M${left + arrowSize},${centerY - arrowSize} L${left},${centerY} L${left + arrowSize},${centerY + arrowSize}`}/>} {rightArrow && <path d={`M${right - arrowSize},${centerY - arrowSize} L${right},${centerY} L${right - arrowSize},${centerY + arrowSize}`}/>}</>
  return <g role="img" aria-label={description} className={`sliding-symbol-renderer ${selected ? 'highlighted' : ''}`}>
    <defs><clipPath id={clipId}><rect x={clipX} y={clipY} width={availableWidth} height={availableHeight}/></clipPath></defs>
    {stacked ? <g clipPath={`url(#${clipId})`}><line x1={left} y1={centerY - separation} x2={centerX} y2={centerY - separation}/><path d={`M${left + arrowSize},${centerY - separation - arrowSize} L${left},${centerY - separation} L${left + arrowSize},${centerY - separation + arrowSize}`}/><line x1={centerX} y1={centerY + separation} x2={right} y2={centerY + separation}/><path d={`M${right - arrowSize},${centerY + separation - arrowSize} L${right},${centerY + separation} L${right - arrowSize},${centerY + separation + arrowSize}`}/></g> : <>{junctionBidirectional && <g clipPath={`url(#${clipId})`} className="sliding-symbol-halo">{bidirectionalGeometry}</g>}<g clipPath={`url(#${clipId})`}>{bidirectionalGeometry}</g></>}
  </g>
}
