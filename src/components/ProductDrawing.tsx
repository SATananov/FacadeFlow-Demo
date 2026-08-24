import type { ProductParameters } from '../productTypes'

interface Props { product: ProductParameters }

export function ProductDrawing({ product }: Props) {
  const maxWidth = 560, maxHeight = 390
  const scale = Math.min(maxWidth / product.width, maxHeight / product.height)
  const width = product.width * scale, height = product.height * scale
  const x = 120 + (maxWidth - width) / 2, y = 90 + (maxHeight - height) / 2
  const face = product.frameFaceWidth * scale
  const innerX = x + face, innerY = y + face, innerWidth = width - face * 2, innerHeight = height - face * 2
  const mullion = product.mullionWidth * scale
  const diagonal = (left: number, areaWidth: number, direction: 'left' | 'right') => direction === 'left' ? `M${left + areaWidth},${innerY} L${left},${innerY + innerHeight} L${left + areaWidth},${innerY + innerHeight}` : `M${left},${innerY} L${left + areaWidth},${innerY + innerHeight} L${left},${innerY + innerHeight}`
  return <svg className="product-drawing" viewBox="0 0 800 580" role="img" aria-label="Пропорционална демонстрационна визуализация на цялото изделие">
    <defs><marker id="product-arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto-start-reverse"><path d="M8 0L0 4L8 8" fill="#607078" /></marker></defs>
    <line x1={x} y1="42" x2={x + width} y2="42" className="product-dimension" markerStart="url(#product-arrow)" markerEnd="url(#product-arrow)"/><line x1={x} y1="55" x2={x} y2={y} className="product-guide"/><line x1={x + width} y1="55" x2={x + width} y2={y} className="product-guide"/><text x={x + width / 2} y="29" className="product-dimension-label">{product.width} mm</text>
    <line x1="75" y1={y} x2="75" y2={y + height} className="product-dimension" markerStart="url(#product-arrow)" markerEnd="url(#product-arrow)"/><line x1="88" y1={y} x2={x} y2={y} className="product-guide"/><line x1="88" y1={y + height} x2={x} y2={y + height} className="product-guide"/><text x="53" y={y + height / 2} className="product-dimension-label vertical">{product.height} mm</text>
    <rect x={x} y={y} width={width} height={height} className="product-frame"/><rect x={innerX} y={innerY} width={innerWidth} height={innerHeight} className="product-glass"/>
    {product.type === 'single' && <><rect x={innerX + 5} y={innerY + 5} width={innerWidth - 10} height={innerHeight - 10} className="product-sash"/><path d={diagonal(innerX + 5, innerWidth - 10, product.openingDirection)} className="opening-symbol"/></>}
    {product.type === 'double' && <><rect x={innerX + 5} y={innerY + 5} width={innerWidth / 2 - mullion / 2 - 10} height={innerHeight - 10} className="product-sash"/><rect x={innerX + innerWidth / 2 + mullion / 2 + 5} y={innerY + 5} width={innerWidth / 2 - mullion / 2 - 10} height={innerHeight - 10} className="product-sash"/><rect x={innerX + innerWidth / 2 - mullion / 2} y={innerY} width={mullion} height={innerHeight} className="product-mullion"/><path d={diagonal(innerX + 5, innerWidth / 2 - mullion / 2 - 10, 'left')} className="opening-symbol"/><path d={diagonal(innerX + innerWidth / 2 + mullion / 2 + 5, innerWidth / 2 - mullion / 2 - 10, 'right')} className="opening-symbol"/><text x={innerX + innerWidth / 2} y={y + height + 48} className="product-part-label">Централен делител</text></>}
    <text x={x + width / 2} y={y - 12} className="product-part-label">Горен профил</text><text x={x + width / 2} y={y + height + 22} className="product-part-label">Долен профил</text><text x={x - 12} y={y + height / 2} className="product-part-label side" textAnchor="middle">Ляв профил</text><text x={x + width + 12} y={y + height / 2} className="product-part-label side" textAnchor="middle">Десен профил</text>
  </svg>
}
