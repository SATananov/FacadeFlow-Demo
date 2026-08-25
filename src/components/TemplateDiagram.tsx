import type { ProductTemplate } from '../productTypes'
import { OpeningSymbol } from './OpeningSymbol'
import { SlidingSymbol } from './SlidingSymbol'
import { getJunctionPanelFraction } from '../productTemplates'

interface Props { template: ProductTemplate; compact?: boolean }

export function TemplateDiagram({ template, compact = false }: Props) {
  const maxWidth = 136, maxHeight = 100, ratio = template.recommendedWidth / template.recommendedHeight
  const width = Math.min(maxWidth, maxHeight * ratio), height = Math.min(maxHeight, maxWidth / ratio)
  const x = 12 + (maxWidth - width) / 2, y = 10 + (maxHeight - height) / 2, inset = compact ? 7 : 8
  const innerX = x + inset, innerY = y + inset, innerWidth = width - inset * 2, innerHeight = height - inset * 2
  return <svg className="template-diagram" viewBox="0 0 160 120" role="img" aria-label={`Схема ${template.displayNumber}: ${template.name}`}>
    <rect x={x} y={y} width={width} height={height} className="template-frame"/>
    {template.fields.map((field) => {
      const fx = innerX + field.x * innerWidth, fy = innerY + field.y * innerHeight, fw = field.width * innerWidth, fh = field.height * innerHeight
      const symbol = field.symbolBounds ?? field
      const sx = innerX + symbol.x * innerWidth, sy = innerY + symbol.y * innerHeight, sw = symbol.width * innerWidth, sh = symbol.height * innerHeight
      return <g key={field.id}><rect x={fx} y={fy} width={fw} height={fh} className={`template-field ${field.state}`}/>{field.state !== 'fixed' && <rect x={fx + 2} y={fy + 2} width={Math.max(0, fw - 4)} height={Math.max(0, fh - 4)} className="template-leaf-outline"/>}{field.state === 'sliding' ? field.openingNotation.startsWith('SLIDING_') && <SlidingSymbol centerX={sx + sw / 2} centerY={sy + sh / 2} panelWidth={sw} availableWidth={sw} availableHeight={sh} drawingScale={compact ? .75 : 1} notation={field.openingNotation as 'SLIDING_LEFT' | 'SLIDING_RIGHT' | 'SLIDING_BIDIRECTIONAL'}/> : <OpeningSymbol x={sx} y={sy} width={sw} height={sh} notation={field.openingNotation} openingDirection={field.openingDirection} directionConfirmed={field.directionConfirmed}/>}</g>
    })}
    {template.dividers.map((divider) => <line key={divider.id} x1={innerX + divider.x1 * innerWidth} y1={innerY + divider.y1 * innerHeight} x2={innerX + divider.x2 * innerWidth} y2={innerY + divider.y2 * innerHeight} className={`template-divider ${divider.orientation}`}/>)}
    {template.slidingSymbols.map((symbol) => { const centerX = innerX + symbol.x * innerWidth, centerY = innerY + symbol.y * innerHeight; return <SlidingSymbol key={symbol.id} centerX={centerX} centerY={centerY} panelWidth={getJunctionPanelFraction(template, symbol.x) * innerWidth} availableWidth={Math.min(centerX - innerX, innerX + innerWidth - centerX) * 2} availableHeight={innerHeight} drawingScale={compact ? .75 : 1} notation={symbol.notation}/> })}
  </svg>
}
