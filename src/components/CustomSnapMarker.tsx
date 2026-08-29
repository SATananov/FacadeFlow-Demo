import { modelToDrawingPoint, type DrawingTransform, type ModelCoordinates } from '../customDrawingCoordinates'

interface Props { point: ModelCoordinates; transform: DrawingTransform; zoom: number }

export function CustomSnapMarker({ point, transform, zoom }: Props) {
  const target = modelToDrawingPoint(point, transform)
  const radius = 7 / Math.max(zoom, .1)
  const arm = 11 / Math.max(zoom, .1)
  return <g className="custom-snap-marker" transform={`translate(${target.x} ${target.y})`} pointerEvents="none" aria-hidden="true">
    <circle r={radius}/><path d={`M ${-arm} 0 H ${arm} M 0 ${-arm} V ${arm}`}/>
  </g>
}
