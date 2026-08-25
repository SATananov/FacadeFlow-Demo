import { useId } from 'react'
import type { OpeningDirection, OpeningNotation } from '../productTypes'
import { HandleMarker } from './HandleMarker'

interface Props {
  x: number
  y: number
  width: number
  height: number
  notation: OpeningNotation
  selected?: boolean
  openingDirection?: OpeningDirection
  directionConfirmed?: boolean
}

const descriptions: Record<OpeningNotation, string> = {
  FIXED: 'Фиксирано поле без символ за отваряне',
  SIDE_TRIANGLE_LEFT: 'Отваряемо поле — символ наляво, демонстрационна посока',
  SIDE_TRIANGLE_RIGHT: 'Отваряемо поле — символ надясно, демонстрационна посока',
  TILT_PLACEHOLDER: 'Непотвърден placeholder за накланяне — не се визуализира',
  TILT_TURN_PLACEHOLDER: 'Непотвърден placeholder за комбинирано отваряне — не се визуализира',
  SLIDING_LEFT: 'Плъзгаща нотация наляво — използва се отделен символ',
  SLIDING_RIGHT: 'Плъзгаща нотация надясно — използва се отделен символ',
  SLIDING_BIDIRECTIONAL: 'Двупосочна плъзгаща нотация — използва се отделен символ',
  JUNCTION_BIDIRECTIONAL: 'Двупосочна плъзгаща нотация при среща — използва се отделен символ',
  JUNCTION_OPPOSED_STACKED: 'Противоположни плъзгащи нотации при среща — използва се отделен символ',
}

export function OpeningSymbol({ x, y, width, height, notation, selected = false, openingDirection, directionConfirmed = false }: Props) {
  const clipId = `opening-clip-${useId().replaceAll(':', '')}`
  const description = directionConfirmed && openingDirection
    ? `Отваряемо поле — ${openingDirection === 'right' ? 'дясно отваряне' : 'ляво отваряне'}, експертно потвърдена конвенция`
    : descriptions[notation]
  if (notation !== 'SIDE_TRIANGLE_LEFT' && notation !== 'SIDE_TRIANGLE_RIGHT') return <g role="img" aria-label={description}/>
  const padding = Math.max(2, Math.min(width, height) * .06)
  const left = x + padding, right = x + width - padding, top = y + padding, bottom = y + height - padding, middle = y + height / 2
  const meetingX = notation === 'SIDE_TRIANGLE_LEFT' ? left : right
  const oppositeX = notation === 'SIDE_TRIANGLE_LEFT' ? right : left
  return <g role="img" aria-label={description} className={`opening-symbol-renderer ${selected ? 'highlighted' : ''}`}>
    <defs><clipPath id={clipId}><rect x={x} y={y} width={width} height={height}/></clipPath></defs>
    <g clipPath={`url(#${clipId})`}><line x1={oppositeX} y1={top} x2={meetingX} y2={middle}/><line x1={oppositeX} y1={bottom} x2={meetingX} y2={middle}/></g>
    <HandleMarker x={x} y={y} width={width} height={height} notation={notation} selected={selected}/>
  </g>
}
