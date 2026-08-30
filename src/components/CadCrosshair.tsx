import { CUSTOM_DRAWING_VIEW, modelToDrawingPoint, type DrawingTransform, type ModelCoordinates } from '../customDrawingCoordinates'

interface Props {
  point: ModelCoordinates
  transform: DrawingTransform
  zoom: number
  showCoordinates: boolean
}

export function CadCrosshair({ point, transform, zoom, showCoordinates }: Props) {
  const safeZoom = Math.max(zoom, 0.1)
  const target = modelToDrawingPoint(point, transform)
  const arm = 24 / safeZoom
  const gap = 4 / safeZoom
  const badgeWidth = 112 / safeZoom
  const badgeHeight = 23 / safeZoom
  const badgeX = target.x + badgeWidth + 16 / safeZoom > CUSTOM_DRAWING_VIEW.width ? target.x - badgeWidth - 10 / safeZoom : target.x + 10 / safeZoom
  const badgeY = target.y - badgeHeight - 9 / safeZoom < 0 ? target.y + 10 / safeZoom : target.y - badgeHeight - 9 / safeZoom

  return <g className="cad-crosshair" aria-hidden="true" pointerEvents="none">
    <path className="cad-crosshair-guide" d={`M 0 ${target.y} H ${CUSTOM_DRAWING_VIEW.width} M ${target.x} 0 V ${CUSTOM_DRAWING_VIEW.height}`}/>
    <path className="cad-crosshair-arms" d={`M ${target.x - arm} ${target.y} H ${target.x - gap} M ${target.x + gap} ${target.y} H ${target.x + arm} M ${target.x} ${target.y - arm} V ${target.y - gap} M ${target.x} ${target.y + gap} V ${target.y + arm}`}/>
    <circle cx={target.x} cy={target.y} r={2.2 / safeZoom}/>
    {showCoordinates && <g className="cad-crosshair-readout">
      <rect x={badgeX} y={badgeY} width={badgeWidth} height={badgeHeight} rx={3 / safeZoom}/>
      <text x={badgeX + 7 / safeZoom} y={badgeY + 15 / safeZoom} style={{ fontSize: `${9 / safeZoom}px` }}>X {Math.round(point.x)} · Y {Math.round(point.y)}</text>
    </g>}
  </g>
}
