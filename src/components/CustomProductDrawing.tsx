import { useRef, type PointerEvent } from 'react'
import { projectGeometry } from '../customGeometryTree'
import {
  buildMullionVisibleBand,
  buildRectangularFrameVisibleBands,
  buildRectangularSashVisibleBands,
} from '../profileData/visibleProfileGeometry'
import {
  buildOverlapAwareFrameSegments,
  buildOverlapAwareMullionSegments,
  type StructuralLeafRegion,
} from '../profileData/sashOverlapGeometry'
import {
  CUSTOM_DRAWING_VIEW,
  drawingPointToModel,
  getCustomDrawingTransform,
  modelToDrawingPoint,
  type ModelCoordinates,
} from '../customDrawingCoordinates'
import type { CustomLeafNode, CustomProduct } from '../customGeometryTypes'
import type { CustomDrawingLine, CustomDrawingLineEndpoint } from '../customDrawingLines'
import type { DimensionAnnotation, DimensionVisibility } from '../dimensionTypes'
import { defaultDimensionVisibility } from '../dimensionTypes'
import { OpeningSymbol } from './OpeningSymbol'
import { ProductDimensions2D } from './ProductDimensions2D'
import { CustomSnapMarker } from './CustomSnapMarker'
import { CadCrosshair } from './CadCrosshair'

function openingNotationForLeaf(node: CustomLeafNode) {
  if (node.openingType === 'TILT') return 'TILT_PLACEHOLDER' as const
  if (node.openingType === 'TILT_TURN') return 'TILT_TURN_PLACEHOLDER' as const
  if (node.openingDirection === 'right') return 'SIDE_TRIANGLE_LEFT' as const
  if (node.openingDirection === 'left') return 'SIDE_TRIANGLE_RIGHT' as const
  return null
}

interface Props {
  product: CustomProduct
  selectedFieldId: string
  onSelectField: (id: string) => void
  onClearDrawingLineSelection?: () => void
  large?: boolean
  annotations?: DimensionAnnotation[]
  dimensionVisibility?: DimensionVisibility
  onCursorCoordinates?: (coordinates: ModelCoordinates | null) => void
  snapPoint?: ModelCoordinates | null
  snappingEnabled?: boolean
  zoom?: number
  drawingLines?: CustomDrawingLine[]
  selectedDrawingLineId?: string | null
  lineSelectionEnabled?: boolean
  onSelectDrawingLine?: (id: string) => void
  lineEndpointEditingEnabled?: boolean
  lineEndpointDrag?: { lineId: string; endpoint: CustomDrawingLineEndpoint; point: ModelCoordinates } | null
  onBeginLineEndpointDrag?: (id: string, endpoint: CustomDrawingLineEndpoint) => void
  onMoveLineEndpointDrag?: (id: string, endpoint: CustomDrawingLineEndpoint, coordinates: ModelCoordinates) => void
  onCommitLineEndpointDrag?: (id: string, endpoint: CustomDrawingLineEndpoint, coordinates: ModelCoordinates) => void
  onCancelLineEndpointDrag?: () => void
  lineBodyEditingEnabled?: boolean
  lineBodyDrag?: { lineId: string; delta: ModelCoordinates } | null
  onBeginLineBodyDrag?: (id: string, coordinates: ModelCoordinates) => void
  onMoveLineBodyDrag?: (id: string, coordinates: ModelCoordinates) => void
  onCommitLineBodyDrag?: (id: string, coordinates: ModelCoordinates) => void
  onCancelLineBodyDrag?: () => void
  lineStartPoint?: ModelCoordinates | null
  linePreviewPoint?: ModelCoordinates | null
  onCanvasPoint?: (coordinates: ModelCoordinates) => void
  cursorCoordinates?: ModelCoordinates | null
  showCoordinates?: boolean
  /** Human-confirmed sash visible widths by leaf id. No fallback is allowed. */
  sashVisibleWidthByFieldId?: Readonly<Record<string, number>>
  /** Explicit profile-system sash overlap. No global/default inference is allowed. */
  sashOverlapMm?: number | null
}

export function CustomProductDrawing({ product, selectedFieldId, onSelectField, onClearDrawingLineSelection, large = false, annotations = [], dimensionVisibility = defaultDimensionVisibility, onCursorCoordinates, snapPoint = null, snappingEnabled = false, zoom = 1, drawingLines = [], selectedDrawingLineId = null, lineSelectionEnabled = false, onSelectDrawingLine, lineEndpointEditingEnabled = false, lineEndpointDrag = null, onBeginLineEndpointDrag, onMoveLineEndpointDrag, onCommitLineEndpointDrag, onCancelLineEndpointDrag, lineBodyEditingEnabled = false, lineBodyDrag = null, onBeginLineBodyDrag, onMoveLineBodyDrag, onCommitLineBodyDrag, onCancelLineBodyDrag, lineStartPoint = null, linePreviewPoint = null, onCanvasPoint, cursorCoordinates = null, showCoordinates = true, sashVisibleWidthByFieldId = {}, sashOverlapMm = null }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const { width: viewWidth, height: viewHeight } = CUSTOM_DRAWING_VIEW
  const transform = getCustomDrawingTransform(Math.max(product.width, 1), Math.max(product.height, 1))
  const { scale, ox, oy } = transform
  const projectedModel = projectGeometry(product.geometry, { x: 0, y: 0, width: product.width, height: product.height })
  const projected = projectedModel.map(({ node, rect }) => ({ node, rect: { x: ox + rect.x * scale, y: oy + rect.y * scale, width: rect.width * scale, height: rect.height * scale } }))
  const leaves = projected.filter(({ node }) => node.kind === 'LEAF'), splits = projected.filter(({ node }) => node.kind === 'SPLIT')
  const structuralLeaves: StructuralLeafRegion[] = projectedModel.flatMap(({ node, rect }) => node.kind === 'LEAF' ? [{ id: node.id, fieldType: node.fieldType, rect }] : [])
  const explicitSashOverlapMm = typeof sashOverlapMm === 'number' && Number.isFinite(sashOverlapMm) && sashOverlapMm > 0 ? sashOverlapMm : null
  const frameVisibleBands = product.frameCreated
    ? buildRectangularFrameVisibleBands(product.width, product.height)
    : null
  const overlapAwareFrameSegments = product.frameCreated && explicitSashOverlapMm
    ? buildOverlapAwareFrameSegments(product.width, product.height, structuralLeaves, explicitSashOverlapMm)
    : null

  const clientToModelCoordinates = (clientX: number, clientY: number) => {
    const svg = svgRef.current
    if (!svg) return null
    const matrix = svg.getScreenCTM()
    if (!matrix) return null
    const point = svg.createSVGPoint()
    point.x = clientX
    point.y = clientY
    const drawingPoint = point.matrixTransform(matrix.inverse())
    const coordinates = drawingPointToModel(drawingPoint, transform)
    return { x: Math.round(coordinates.x), y: Math.round(coordinates.y) }
  }

  const pointerToModelCoordinates = (event: PointerEvent<SVGSVGElement>) => clientToModelCoordinates(event.clientX, event.clientY)

  const updateCursorCoordinates = (event: PointerEvent<SVGSVGElement>) => {
    if (!onCursorCoordinates) return
    onCursorCoordinates(pointerToModelCoordinates(event))
  }

  const chooseCanvasPoint = (event: PointerEvent<SVGSVGElement>) => {
    if (!onCanvasPoint) return
    const coordinates = pointerToModelCoordinates(event)
    if (coordinates) onCanvasPoint(coordinates)
  }

  const projectLinePoint = (point: ModelCoordinates) => modelToDrawingPoint(point, transform)

  const endpointDragHandlers = (lineId: string, endpoint: CustomDrawingLineEndpoint) => ({
    onPointerDown: (event: PointerEvent<SVGCircleElement>) => {
      if (!lineEndpointEditingEnabled) return
      event.preventDefault()
      event.stopPropagation()
      event.currentTarget.setPointerCapture(event.pointerId)
      onBeginLineEndpointDrag?.(lineId, endpoint)
    },
    onPointerMove: (event: PointerEvent<SVGCircleElement>) => {
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
      const coordinates = clientToModelCoordinates(event.clientX, event.clientY)
      if (coordinates) onMoveLineEndpointDrag?.(lineId, endpoint, coordinates)
    },
    onPointerUp: (event: PointerEvent<SVGCircleElement>) => {
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
      const coordinates = clientToModelCoordinates(event.clientX, event.clientY)
      event.currentTarget.releasePointerCapture(event.pointerId)
      if (coordinates) onCommitLineEndpointDrag?.(lineId, endpoint, coordinates)
      else onCancelLineEndpointDrag?.()
    },
    onPointerCancel: (event: PointerEvent<SVGCircleElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
      onCancelLineEndpointDrag?.()
    },
  })


  const lineBodyDragHandlers = (lineId: string, selected: boolean) => ({
    onPointerDown: (event: PointerEvent<SVGLineElement>) => {
      event.stopPropagation()
      if (!selected || !lineBodyEditingEnabled) return
      const coordinates = clientToModelCoordinates(event.clientX, event.clientY)
      if (!coordinates) return
      event.preventDefault()
      event.currentTarget.setPointerCapture(event.pointerId)
      onBeginLineBodyDrag?.(lineId, coordinates)
    },
    onPointerMove: (event: PointerEvent<SVGLineElement>) => {
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
      const coordinates = clientToModelCoordinates(event.clientX, event.clientY)
      if (coordinates) onMoveLineBodyDrag?.(lineId, coordinates)
    },
    onPointerUp: (event: PointerEvent<SVGLineElement>) => {
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
      const coordinates = clientToModelCoordinates(event.clientX, event.clientY)
      event.currentTarget.releasePointerCapture(event.pointerId)
      if (coordinates) onCommitLineBodyDrag?.(lineId, coordinates)
      else onCancelLineBodyDrag?.()
    },
    onPointerCancel: (event: PointerEvent<SVGLineElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
      onCancelLineBodyDrag?.()
    },
  })

  return <svg ref={svgRef} className={`custom-product-drawing ${large ? 'large' : ''}`} viewBox={`0 0 ${viewWidth} ${viewHeight}`} role="img" aria-label={`Нестандартен прозорец ${product.width} на ${product.height} милиметъра`} onPointerMove={updateCursorCoordinates} onPointerDown={chooseCanvasPoint} onPointerLeave={() => onCursorCoordinates?.(null)}>
    <defs><marker id="custom-dim-arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto-start-reverse"><path d="M8 0L0 4L8 8"/></marker></defs>
    {leaves.map(({ node, rect }) => node.kind === 'LEAF' && <g key={node.id} role="button" tabIndex={0} aria-label={`Поле ${node.id}, ${node.fieldType}`} onClick={() => { onClearDrawingLineSelection?.(); onSelectField(node.id) }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onClearDrawingLineSelection?.(); onSelectField(node.id) } }}>
      <rect x={rect.x + 5} y={rect.y + 5} width={Math.max(0, rect.width - 10)} height={Math.max(0, rect.height - 10)} className={`custom-field ${node.fieldType.toLowerCase()} ${selectedFieldId === node.id ? 'selected' : ''}`}/>
      {node.fieldType === 'OPENING_SASH' && (() => {
        const notation = openingNotationForLeaf(node)
        const humanConfirmedSashVisibleWidthMm = sashVisibleWidthByFieldId[node.id]
        const sashBands = Number.isFinite(humanConfirmedSashVisibleWidthMm) && humanConfirmedSashVisibleWidthMm > 0
          ? buildRectangularSashVisibleBands(rect.width / scale, rect.height / scale, humanConfirmedSashVisibleWidthMm)
          : null
        return <>
          {sashBands
            ? <g className="custom-structural-profile-layer custom-sash-profile-layer" data-profile-code={sashBands.profileCode} data-visible-width-mm={sashBands.visibleWidthMm} pointerEvents="none">
                {[sashBands.left, sashBands.right, sashBands.top, sashBands.bottom].map((band, index) => <rect key={`sash-band-${node.id}-${index}`} x={rect.x + band.x * scale} y={rect.y + band.y * scale} width={band.width * scale} height={band.height * scale} className="custom-structural-profile-band custom-sash-profile-band"/>)}
              </g>
            : <text x={rect.x + rect.width / 2} y={rect.y + 23} className="custom-sash-visible-width-pending" data-profile-code="482.05" data-visible-width-state="ASSEMBLY_EFFECTIVE_WIDTH_UNRESOLVED">Крило · ефективната ширина в сглобка не е зададена</text>}
          {notation && <OpeningSymbol x={rect.x + 13} y={rect.y + 13} width={Math.max(0, rect.width - 26)} height={Math.max(0, rect.height - 26)} notation={notation} openingDirection={node.openingDirection} directionConfirmed={Boolean(node.openingDirection)}/>}
        </>
      })()}
      <text x={rect.x + rect.width / 2} y={rect.y + rect.height / 2 + 4} className="custom-field-id">{node.id}</text>
    </g>)}
    {overlapAwareFrameSegments
      ? <g className="custom-structural-profile-layer custom-overlap-aware-frame-layer" data-profile-code="482.30" data-sash-overlap-mm={explicitSashOverlapMm ?? undefined} pointerEvents="none">
          {overlapAwareFrameSegments.map((segment) => <rect key={segment.id} x={ox + segment.rect.x * scale} y={oy + segment.rect.y * scale} width={segment.rect.width * scale} height={segment.rect.height * scale} className="custom-structural-profile-band custom-frame-profile-band" data-frame-side={segment.side} data-base-visible-width-mm={segment.baseVisibleWidthMm} data-effective-visible-width-mm={segment.effectiveVisibleWidthMm} data-overlap-applications={segment.overlapApplicationCount} data-adjacent-sash-ids={segment.adjacentSashIds.join(',')}/>)}
        </g>
      : frameVisibleBands && <g className="custom-structural-profile-layer" data-profile-code={frameVisibleBands.profileCode} pointerEvents="none">
          {[frameVisibleBands.left, frameVisibleBands.right, frameVisibleBands.top, frameVisibleBands.bottom].map((band, index) => <rect key={`frame-band-${index}`} x={ox + band.x * scale} y={oy + band.y * scale} width={band.width * scale} height={band.height * scale} className="custom-structural-profile-band custom-frame-profile-band"/>)}
        </g>}
    {splits.map(({ node, rect }) => {
      if (node.kind !== 'SPLIT') return null
      const modelProjection = projectedModel.find((item) => item.node.id === node.id)
      const parentSpanMm = node.orientation === 'VERTICAL' ? rect.height / scale : rect.width / scale
      const mullion = buildMullionVisibleBand(node.orientation, node.position, parentSpanMm)
      const band = mullion.rect
      const bandX = node.orientation === 'VERTICAL' ? rect.x + band.x * scale : rect.x
      const bandY = node.orientation === 'VERTICAL' ? rect.y : rect.y + band.y * scale
      const bandWidth = band.width * scale
      const bandHeight = band.height * scale
      const overlapSegments = explicitSashOverlapMm && modelProjection
        ? buildOverlapAwareMullionSegments(node.orientation, node.position, modelProjection.rect, structuralLeaves, explicitSashOverlapMm)
        : null
      return <g key={node.id} data-profile-code={mullion.profileCode} data-sash-overlap-mm={explicitSashOverlapMm ?? undefined}>
        {overlapSegments
          ? overlapSegments.map((segment) => <rect key={`${node.id}-${segment.id}`} x={ox + segment.rect.x * scale} y={oy + segment.rect.y * scale} width={segment.rect.width * scale} height={segment.rect.height * scale} className="custom-structural-profile-band custom-divider-profile-band" data-base-visible-width-mm={segment.baseVisibleWidthMm} data-effective-visible-width-mm={segment.effectiveVisibleWidthMm} data-overlap-applications={segment.overlapApplicationCount} data-side-a-has-sash={segment.sideAHasSash ? 'true' : 'false'} data-side-b-has-sash={segment.sideBHasSash ? 'true' : 'false'} data-adjacent-sash-ids={segment.adjacentSashIds.join(',')}/>)
          : <rect x={bandX} y={bandY} width={bandWidth} height={bandHeight} className="custom-structural-profile-band custom-divider-profile-band"/>}
        <text x={node.orientation === 'VERTICAL' ? bandX + bandWidth + 7 : rect.x + 7} y={node.orientation === 'VERTICAL' ? rect.y + 17 : bandY - 7} className="custom-divider-label">{Math.round(node.position)} mm</text>
      </g>
    })}
    <g className="custom-drawing-line-layer" pointerEvents="none">
      {drawingLines.map((line) => {
        const drag = lineEndpointDrag?.lineId === line.id ? lineEndpointDrag : null
        const bodyDrag = lineBodyDrag?.lineId === line.id ? lineBodyDrag : null
        const translatedStart = bodyDrag ? { x: line.start.x + bodyDrag.delta.x, y: line.start.y + bodyDrag.delta.y } : line.start
        const translatedEnd = bodyDrag ? { x: line.end.x + bodyDrag.delta.x, y: line.end.y + bodyDrag.delta.y } : line.end
        const displayStart = drag?.endpoint === 'start' ? drag.point : translatedStart
        const displayEnd = drag?.endpoint === 'end' ? drag.point : translatedEnd
        const start = projectLinePoint(displayStart), end = projectLinePoint(displayEnd), selected = selectedDrawingLineId === line.id
        const groupClassName = `custom-drawing-line-group${selected ? ' selected' : ''}${bodyDrag ? ' moving' : ''}`
        return <g key={line.id} data-line-id={line.id} className={groupClassName}>
          <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} className={selected ? 'custom-drawing-line selected' : 'custom-drawing-line'} pointerEvents="none"/>
          {lineSelectionEnabled && <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} className="custom-drawing-line-hit" pointerEvents="stroke" aria-label={selected ? `Премести цялата ${line.id}` : `Избери ${line.id}`} {...lineBodyDragHandlers(line.id, selected)} onClick={(event) => { event.stopPropagation(); onSelectDrawingLine?.(line.id) }}/>}
          {selected && <><circle cx={start.x} cy={start.y} r="5" className={`custom-drawing-line-grip${drag?.endpoint === 'start' ? ' dragging' : ''}`} pointerEvents={lineEndpointEditingEnabled ? 'all' : 'none'} aria-label={`Премести начало на ${line.id}`} {...endpointDragHandlers(line.id, 'start')}/><circle cx={end.x} cy={end.y} r="5" className={`custom-drawing-line-grip${drag?.endpoint === 'end' ? ' dragging' : ''}`} pointerEvents={lineEndpointEditingEnabled ? 'all' : 'none'} aria-label={`Премести край на ${line.id}`} {...endpointDragHandlers(line.id, 'end')}/></>}
        </g>
      })}
      {lineStartPoint && linePreviewPoint && (() => { const start = projectLinePoint(lineStartPoint), end = projectLinePoint(linePreviewPoint); return <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} className="custom-drawing-line-preview" pointerEvents="none"/> })()}
    </g>
    <ProductDimensions2D annotations={annotations} visibility={dimensionVisibility} project={(point) => ({ x: ox + point.x * scale, y: oy + point.y * scale })}/>
    {snappingEnabled && snapPoint && <CustomSnapMarker point={snapPoint} transform={transform} zoom={zoom}/>}
    {cursorCoordinates && <CadCrosshair point={cursorCoordinates} transform={transform} zoom={zoom} showCoordinates={showCoordinates}/>}
  </svg>
}
