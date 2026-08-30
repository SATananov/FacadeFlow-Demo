import { CUSTOM_DRAWING_VIEW, modelToDrawingPoint, type DrawingTransform } from '../customDrawingCoordinates'

interface Props {
  transform: DrawingTransform
  zoom: number
}

export function CadAxisOverlay({ transform, zoom }: Props) {
  const origin = modelToDrawingPoint({ x: 0, y: 0 }, transform)
  const safeZoom = Math.max(zoom, 0.1)
  const labelOffset = 11 / safeZoom
  const originRadius = 5 / safeZoom
  const originBadgeWidth = 36 / safeZoom
  const originBadgeHeight = 18 / safeZoom
  const markerId = 'cad-coordinate-axis-arrow'

  return <g className="cad-axis-overlay" aria-hidden="true" pointerEvents="none">
    <defs>
      <marker id={markerId} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
        <path d="M 0 0 L 7 3.5 L 0 7 z" className="custom-coordinate-axis-arrow"/>
      </marker>
    </defs>
    <line x1={origin.x} y1={origin.y} x2={CUSTOM_DRAWING_VIEW.width - 10} y2={origin.y} className="custom-coordinate-axis cad-axis-x" markerEnd={`url(#${markerId})`}/>
    <line x1={origin.x} y1={origin.y} x2={origin.x} y2="10" className="custom-coordinate-axis cad-axis-y" markerEnd={`url(#${markerId})`}/>
    <circle cx={origin.x} cy={origin.y} r={originRadius} className="cad-origin-marker"/>
    <path d={`M ${origin.x - 8 / safeZoom} ${origin.y} H ${origin.x + 8 / safeZoom} M ${origin.x} ${origin.y - 8 / safeZoom} V ${origin.y + 8 / safeZoom}`} className="cad-origin-cross"/>
    <text x={CUSTOM_DRAWING_VIEW.width - 25} y={origin.y - labelOffset} className="custom-coordinate-axis-label cad-axis-x-label" style={{ fontSize: `${12 / safeZoom}px` }}>X</text>
    <text x={origin.x + labelOffset} y={20 / safeZoom} className="custom-coordinate-axis-label cad-axis-y-label" style={{ fontSize: `${12 / safeZoom}px` }}>Y</text>
    <g className="cad-origin-badge">
      <rect x={origin.x - originBadgeWidth - 8 / safeZoom} y={origin.y + 7 / safeZoom} width={originBadgeWidth} height={originBadgeHeight} rx={3 / safeZoom}/>
      <text x={origin.x - originBadgeWidth / 2 - 8 / safeZoom} y={origin.y + 20 / safeZoom} textAnchor="middle" className="custom-coordinate-origin-label" style={{ fontSize: `${10 / safeZoom}px` }}>0,0</text>
    </g>
  </g>
}
