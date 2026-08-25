import { projectGeometry } from '../customGeometryTree'
import type { CustomProduct } from '../customGeometryTypes'
import { OpeningSymbol } from './OpeningSymbol'
import type { DimensionAnnotation, DimensionVisibility } from '../dimensionTypes'
import { defaultDimensionVisibility } from '../dimensionTypes'
import { ProductDimensions2D } from './ProductDimensions2D'

interface Props { product: CustomProduct; selectedFieldId: string; onSelectField: (id: string) => void; large?: boolean; annotations?: DimensionAnnotation[]; dimensionVisibility?: DimensionVisibility }

export function CustomProductDrawing({ product, selectedFieldId, onSelectField, large = false, annotations = [], dimensionVisibility = defaultDimensionVisibility }: Props) {
  const viewWidth = 820, viewHeight = 560, margin = 70
  const scale = Math.min((viewWidth - margin * 2) / Math.max(product.width, 1), (viewHeight - margin * 2) / Math.max(product.height, 1))
  const width = product.width * scale, height = product.height * scale, ox = (viewWidth - width) / 2, oy = (viewHeight - height) / 2
  const projected = projectGeometry(product.geometry, { x: 0, y: 0, width: product.width, height: product.height }).map(({ node, rect }) => ({ node, rect: { x: ox + rect.x * scale, y: oy + rect.y * scale, width: rect.width * scale, height: rect.height * scale } }))
  const leaves = projected.filter(({ node }) => node.kind === 'LEAF'), splits = projected.filter(({ node }) => node.kind === 'SPLIT')
  return <svg className={`custom-product-drawing ${large ? 'large' : ''}`} viewBox={`0 0 ${viewWidth} ${viewHeight}`} role="img" aria-label={`Нестандартен прозорец ${product.width} на ${product.height} милиметра`}>
    <defs><marker id="custom-dim-arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto-start-reverse"><path d="M8 0L0 4L8 8"/></marker></defs>
    {product.frameCreated && <rect x={ox} y={oy} width={width} height={height} className="custom-frame"/>}
    {leaves.map(({ node, rect }) => node.kind === 'LEAF' && <g key={node.id} role="button" tabIndex={0} aria-label={`Поле ${node.id}, ${node.fieldType}`} onClick={() => onSelectField(node.id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelectField(node.id) } }}>
      <rect x={rect.x + 5} y={rect.y + 5} width={Math.max(0, rect.width - 10)} height={Math.max(0, rect.height - 10)} className={`custom-field ${node.fieldType.toLowerCase()} ${selectedFieldId === node.id ? 'selected' : ''}`}/>
      {node.fieldType === 'OPENING_SASH' && <><rect x={rect.x + 12} y={rect.y + 12} width={Math.max(0, rect.width - 24)} height={Math.max(0, rect.height - 24)} className="custom-sash-outline"/>{node.openingDirection && <OpeningSymbol x={rect.x + 13} y={rect.y + 13} width={Math.max(0, rect.width - 26)} height={Math.max(0, rect.height - 26)} notation={node.openingDirection === 'right' ? 'SIDE_TRIANGLE_LEFT' : 'SIDE_TRIANGLE_RIGHT'} openingDirection={node.openingDirection} directionConfirmed/>}</>}
      <text x={rect.x + rect.width / 2} y={rect.y + rect.height / 2 + 4} className="custom-field-id">{node.id}</text>
    </g>)}
    {splits.map(({ node, rect }) => node.kind === 'SPLIT' && <g key={node.id}>{node.orientation === 'VERTICAL' ? <line x1={rect.x + node.position * scale} y1={rect.y} x2={rect.x + node.position * scale} y2={rect.y + rect.height} className="custom-divider"/> : <line x1={rect.x} y1={rect.y + node.position * scale} x2={rect.x + rect.width} y2={rect.y + node.position * scale} className="custom-divider"/>}<text x={node.orientation === 'VERTICAL' ? rect.x + node.position * scale + 7 : rect.x + 7} y={node.orientation === 'VERTICAL' ? rect.y + 17 : rect.y + node.position * scale - 7} className="custom-divider-label">{Math.round(node.position)} mm</text></g>)}
    <ProductDimensions2D annotations={annotations} visibility={dimensionVisibility} project={(point) => ({ x: ox + point.x * scale, y: oy + point.y * scale })}/>
  </svg>
}
