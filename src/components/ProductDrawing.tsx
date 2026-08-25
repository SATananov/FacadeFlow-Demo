import type { ProductParameters, ProductTemplate } from '../productTypes'
import { OpeningSymbol } from './OpeningSymbol'

interface Props { product: ProductParameters; template: ProductTemplate; selectedComponentId: string | null; onSelectComponent: (componentId: string) => void }

export function ProductDrawing({ product, template, selectedComponentId, onSelectComponent }: Props) {
  const maxWidth = 560, maxHeight = 390
  const scale = Math.min(maxWidth / product.width, maxHeight / product.height)
  const width = product.width * scale, height = product.height * scale
  const x = 120 + (maxWidth - width) / 2, y = 90 + (maxHeight - height) / 2
  const face = product.frameFaceWidth * scale
  const innerX = x + face, innerY = y + face, innerWidth = width - face * 2, innerHeight = height - face * 2
  const selectableLine = (id: string, label: string, x1: number, y1: number, x2: number, y2: number) => <line x1={x1} y1={y1} x2={x2} y2={y2} role="button" tabIndex={0} aria-label={`Избери ${label}`} aria-pressed={selectedComponentId === id} className={`selectable-component ${selectedComponentId === id ? 'selected' : ''}`} onClick={() => onSelectComponent(id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelectComponent(id) } }}/>
  const sashSelection = (field: ProductTemplate['fields'][number], left: number, top: number, fieldWidth: number, fieldHeight: number) => {
    const prefix = `SASH-${field.componentKey}`
    return <>{selectableLine(`${prefix}-TOP-01`, `горен профил на ${field.id}`, left, top, left + fieldWidth, top)}{selectableLine(`${prefix}-BOTTOM-01`, `долен профил на ${field.id}`, left, top + fieldHeight, left + fieldWidth, top + fieldHeight)}{selectableLine(`${prefix}-LEFT-01`, `ляв профил на ${field.id}`, left, top, left, top + fieldHeight)}{selectableLine(`${prefix}-RIGHT-01`, `десен профил на ${field.id}`, left + fieldWidth, top, left + fieldWidth, top + fieldHeight)}</>
  }
  return <svg className="product-drawing" viewBox="0 0 800 580" role="img" aria-label={`Пропорционална демонстрационна визуализация, схема ${template.displayNumber} ${template.name}`}>
    <defs><marker id="product-arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto-start-reverse"><path d="M8 0L0 4L8 8" fill="#607078" /></marker></defs>
    <line x1={x} y1="42" x2={x + width} y2="42" className="product-dimension" markerStart="url(#product-arrow)" markerEnd="url(#product-arrow)"/><line x1={x} y1="55" x2={x} y2={y} className="product-guide"/><line x1={x + width} y1="55" x2={x + width} y2={y} className="product-guide"/><text x={x + width / 2} y="29" className="product-dimension-label">{product.width} mm</text>
    <line x1="75" y1={y} x2="75" y2={y + height} className="product-dimension" markerStart="url(#product-arrow)" markerEnd="url(#product-arrow)"/><line x1="88" y1={y} x2={x} y2={y} className="product-guide"/><line x1="88" y1={y + height} x2={x} y2={y + height} className="product-guide"/><text x="53" y={y + height / 2} className="product-dimension-label vertical">{product.height} mm</text>
    <rect x={x} y={y} width={width} height={height} className="product-frame"/><rect x={innerX} y={innerY} width={innerWidth} height={innerHeight} className="product-glass"/>
    {template.fields.map((field) => {
      const fx = innerX + field.x * innerWidth + 4, fy = innerY + field.y * innerHeight + 4, fw = field.width * innerWidth - 8, fh = field.height * innerHeight - 8
      return <g key={field.id}><rect x={fx} y={fy} width={fw} height={fh} className={`product-field ${field.state}`}/><OpeningSymbol x={fx} y={fy} width={fw} height={fh} notation={field.openingNotation} selected={selectedComponentId?.startsWith(`SASH-${field.componentKey}-`)}/>{field.state === 'opening' && sashSelection(field, fx, fy, fw, fh)}</g>
    })}
    {template.dividers.map((divider, index) => { const x1 = innerX + divider.x1 * innerWidth, y1 = innerY + divider.y1 * innerHeight, x2 = innerX + divider.x2 * innerWidth, y2 = innerY + divider.y2 * innerHeight; return <g key={divider.id}><line x1={x1} y1={y1} x2={x2} y2={y2} className="product-divider"/><text x={(x1 + x2) / 2 + (divider.orientation === 'vertical' ? 12 : 0)} y={(y1 + y2) / 2 - (divider.orientation === 'horizontal' ? 8 : 0)} className="divider-label">Делител {index + 1}</text>{selectableLine(divider.id, `делител ${index + 1}`, x1, y1, x2, y2)}</g> })}
    {selectableLine('FRAME-TOP-01', 'горен профил на рамката', x, y, x + width, y)}{selectableLine('FRAME-BOTTOM-01', 'долен профил на рамката', x, y + height, x + width, y + height)}{selectableLine('FRAME-LEFT-01', 'ляв профил на рамката', x, y, x, y + height)}{selectableLine('FRAME-RIGHT-01', 'десен профил на рамката', x + width, y, x + width, y + height)}
    <text x={x + width / 2} y={y - 12} className="product-part-label">Горен профил</text><text x={x + width / 2} y={y + height + 22} className="product-part-label">Долен профил</text><text x={x - 12} y={y + height / 2} className="product-part-label side" textAnchor="middle">Ляв профил</text><text x={x + width + 12} y={y + height / 2} className="product-part-label side" textAnchor="middle">Десен профил</text>
  </svg>
}
