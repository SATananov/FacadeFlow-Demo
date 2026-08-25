import type { ProductTemplate } from '../productTypes'
import { OpeningSymbol } from './OpeningSymbol'

interface Props { template: ProductTemplate; compact?: boolean }

export function TemplateDiagram({ template, compact = false }: Props) {
  const x = 12, y = 10, width = 136, height = 100, inset = compact ? 7 : 8
  const innerX = x + inset, innerY = y + inset, innerWidth = width - inset * 2, innerHeight = height - inset * 2
  return <svg className="template-diagram" viewBox="0 0 160 120" role="img" aria-label={`Схема ${template.displayNumber}: ${template.name}`}>
    <rect x={x} y={y} width={width} height={height} className="template-frame"/>
    {template.fields.map((field) => {
      const fx = innerX + field.x * innerWidth, fy = innerY + field.y * innerHeight, fw = field.width * innerWidth, fh = field.height * innerHeight
      return <g key={field.id}><rect x={fx} y={fy} width={fw} height={fh} className={`template-field ${field.state}`}/><OpeningSymbol x={fx} y={fy} width={fw} height={fh} notation={field.openingNotation}/></g>
    })}
    {template.dividers.map((divider) => <line key={divider.id} x1={innerX + divider.x1 * innerWidth} y1={innerY + divider.y1 * innerHeight} x2={innerX + divider.x2 * innerWidth} y2={innerY + divider.y2 * innerHeight} className="template-divider"/>)}
  </svg>
}
