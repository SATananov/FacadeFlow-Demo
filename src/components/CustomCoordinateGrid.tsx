import {
  CUSTOM_DRAWING_VIEW,
  CUSTOM_GRID_MAJOR_STEP,
  gridStepToPixels,
  modelToDrawingPoint,
  type CustomGridStep,
  type DrawingTransform,
} from '../customDrawingCoordinates'

interface Props {
  transform: DrawingTransform
  step: CustomGridStep
}

export function CustomCoordinateGrid({ transform, step }: Props) {
  const minorSize = gridStepToPixels(step, transform)
  const majorSize = gridStepToPixels(CUSTOM_GRID_MAJOR_STEP, transform)
  const origin = modelToDrawingPoint({ x: 0, y: 0 }, transform)
  const patternX = origin.x % minorSize
  const patternY = origin.y % minorSize
  const majorPatternX = origin.x % majorSize
  const majorPatternY = origin.y % majorSize
  const markerId = 'custom-coordinate-axis-arrow'

  return (
    <g className="custom-coordinate-grid" aria-hidden="true" pointerEvents="none">
      <defs>
        <pattern id="custom-coordinate-grid-minor" width={minorSize} height={minorSize} patternUnits="userSpaceOnUse" x={patternX} y={patternY}>
          <path d={`M ${minorSize} 0 L 0 0 0 ${minorSize}`} className="custom-coordinate-grid-minor-line" />
        </pattern>
        <pattern id="custom-coordinate-grid-major" width={majorSize} height={majorSize} patternUnits="userSpaceOnUse" x={majorPatternX} y={majorPatternY}>
          <path d={`M ${majorSize} 0 L 0 0 0 ${majorSize}`} className="custom-coordinate-grid-major-line" />
        </pattern>
        <marker id={markerId} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
          <path d="M 0 0 L 7 3.5 L 0 7 z" className="custom-coordinate-axis-arrow" />
        </marker>
      </defs>
      <rect x="0" y="0" width={CUSTOM_DRAWING_VIEW.width} height={CUSTOM_DRAWING_VIEW.height} fill="url(#custom-coordinate-grid-minor)" />
      <rect x="0" y="0" width={CUSTOM_DRAWING_VIEW.width} height={CUSTOM_DRAWING_VIEW.height} fill="url(#custom-coordinate-grid-major)" />
      <line x1="0" y1={origin.y} x2={CUSTOM_DRAWING_VIEW.width - 8} y2={origin.y} className="custom-coordinate-axis" markerEnd={`url(#${markerId})`} />
      <line x1={origin.x} y1={CUSTOM_DRAWING_VIEW.height} x2={origin.x} y2="8" className="custom-coordinate-axis" markerEnd={`url(#${markerId})`} />
      <text x={CUSTOM_DRAWING_VIEW.width - 22} y={origin.y - 8} className="custom-coordinate-axis-label">X</text>
      <text x={origin.x + 9} y="20" className="custom-coordinate-axis-label">Y</text>
      <text x={origin.x - 7} y={origin.y + 15} textAnchor="end" className="custom-coordinate-origin-label">0,0</text>
    </g>
  )
}
