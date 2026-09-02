import type { HybridGuidedAiHandoff } from '../hybridProductDesigner'

const productLabel = (type: HybridGuidedAiHandoff['productType']) => type === 'DOOR' ? 'Врата' : 'Прозорец'

export function GuidedHandoffPreview({ handoff }: { handoff: HybridGuidedAiHandoff }) {
  const width = Number(handoff.dimensions.width)
  const height = Number(handoff.dimensions.height)
  const safeWidth = Number.isFinite(width) && width > 0 ? width : 1
  const safeHeight = Number.isFinite(height) && height > 0 ? height : 1
  const maxWidth = 272
  const maxHeight = 158
  const scale = Math.min(maxWidth / safeWidth, maxHeight / safeHeight)
  const drawingWidth = Math.max(78, safeWidth * scale)
  const drawingHeight = Math.max(78, safeHeight * scale)
  const x = (390 - drawingWidth) / 2
  const y = 50 + (maxHeight - drawingHeight) / 2
  const direction = handoff.opening.direction
  const openingText = [handoff.opening.type, handoff.opening.direction, handoff.opening.inwardOutward].filter(Boolean).join(' · ')
  const hasMullionWithoutPosition = Boolean(handoff.profileEvidence.mullion)

  return <figure className="hybrid-handoff-preview" aria-label={`Концептуален преглед: ${productLabel(handoff.productType)} ${handoff.dimensions.width} на ${handoff.dimensions.height} милиметра`}>
    <div className="hybrid-handoff-preview-title"><span>КОНЦЕПТУАЛЕН ПРЕГЛЕД</span><b>{productLabel(handoff.productType)}</b></div>
    <svg viewBox="0 0 390 250" role="img" aria-label={`${productLabel(handoff.productType)} ${handoff.dimensions.width} × ${handoff.dimensions.height} mm`}>
      <defs><marker id="handoff-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z"/></marker></defs>
      <line className="handoff-dimension" x1={x} y1={y - 22} x2={x + drawingWidth} y2={y - 22}/>
      <line className="handoff-dimension-tick" x1={x} y1={y - 28} x2={x} y2={y - 16}/>
      <line className="handoff-dimension-tick" x1={x + drawingWidth} y1={y - 28} x2={x + drawingWidth} y2={y - 16}/>
      <text className="handoff-dimension-label" x={195} y={y - 28} textAnchor="middle">{handoff.dimensions.width} mm</text>
      <line className="handoff-dimension" x1={x + drawingWidth + 22} y1={y} x2={x + drawingWidth + 22} y2={y + drawingHeight}/>
      <line className="handoff-dimension-tick" x1={x + drawingWidth + 16} y1={y} x2={x + drawingWidth + 28} y2={y}/>
      <line className="handoff-dimension-tick" x1={x + drawingWidth + 16} y1={y + drawingHeight} x2={x + drawingWidth + 28} y2={y + drawingHeight}/>
      <text className="handoff-dimension-label" x={x + drawingWidth + 40} y={y + drawingHeight / 2} textAnchor="middle" transform={`rotate(90 ${x + drawingWidth + 40} ${y + drawingHeight / 2})`}>{handoff.dimensions.height} mm</text>
      <rect className="handoff-product-frame" x={x} y={y} width={drawingWidth} height={drawingHeight}/>
      <rect className="handoff-product-glass" x={x + 8} y={y + 8} width={Math.max(1, drawingWidth - 16)} height={Math.max(1, drawingHeight - 16)}/>
      {openingText && <g className="handoff-opening-symbol">
        <line x1={direction === 'Дясно' ? x + drawingWidth * .32 : x + drawingWidth * .68} y1={y + drawingHeight * .5} x2={direction === 'Дясно' ? x + drawingWidth * .68 : x + drawingWidth * .32} y2={y + drawingHeight * .5} markerEnd="url(#handoff-arrow)"/>
        <text x={x + drawingWidth / 2} y={y + drawingHeight / 2 - 10} textAnchor="middle">{handoff.opening.type || 'Отваряемост'}</text>
        <text x={x + drawingWidth / 2} y={y + drawingHeight / 2 + 24} textAnchor="middle">{[direction, handoff.opening.inwardOutward].filter(Boolean).join(' · ')}</text>
      </g>}
    </svg>
    <figcaption><span>Пропорцията, размерът и отваряемостта са само визуално отражение на данните, потвърдени от човек.</span>{hasMullionWithoutPosition && <strong>Делител {handoff.profileEvidence.mullion}: позицията е неуточнена и затова не е начертан.</strong>}</figcaption>
  </figure>
}
