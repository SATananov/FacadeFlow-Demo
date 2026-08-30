import { getCadRulerStep } from '../cad/cadDrafting'
import {
  CUSTOM_DRAWING_VIEW,
  modelToDrawingPoint,
  type CustomGridStep,
  type DrawingTransform,
} from '../customDrawingCoordinates'

interface Props {
  transform: DrawingTransform
  gridStep: CustomGridStep
  zoom: number
}

interface VisibleRulerTick {
  valueMm: number
  major: boolean
}

function isMultiple(value: number, step: number): boolean {
  const ratio = value / step
  return Math.abs(ratio - Math.round(ratio)) < 1e-9
}

function generateVisibleRulerTicks(min: number, max: number, minorStep: number, labelStep: number): VisibleRulerTick[] {
  if (![min, max, minorStep, labelStep].every(Number.isFinite) || minorStep <= 0 || labelStep <= 0) return []
  const start = Math.ceil(min / minorStep) * minorStep
  const ticks: VisibleRulerTick[] = []
  for (let value = start, guard = 0; value <= max + 1e-9 && guard < 1200; value += minorStep, guard += 1) {
    const normalized = Object.is(value, -0) ? 0 : Math.round(value * 1000) / 1000
    ticks.push({ valueMm: normalized, major: isMultiple(normalized, labelStep) })
  }
  return ticks
}

export function CadRulers({ transform, gridStep, zoom }: Props) {
  const safeZoom = Math.max(zoom, 0.1)
  const labelStep = getCadRulerStep(gridStep, transform, safeZoom)
  const modelMinX = -transform.ox / transform.scale
  const modelMaxX = (CUSTOM_DRAWING_VIEW.width - transform.ox) / transform.scale
  const modelMinY = (transform.oy + transform.height - CUSTOM_DRAWING_VIEW.height) / transform.scale
  const modelMaxY = (transform.oy + transform.height) / transform.scale
  const horizontalTicks = generateVisibleRulerTicks(modelMinX, modelMaxX, gridStep, labelStep)
  const verticalTicks = generateVisibleRulerTicks(modelMinY, modelMaxY, gridStep, labelStep)
  const topHeight = 30 / safeZoom
  const leftWidth = 52 / safeZoom
  const fontSize = 9.5 / safeZoom
  const minorTick = 5 / safeZoom
  const majorTick = 10 / safeZoom

  return <g className="cad-rulers cad-workbench-rulers" aria-hidden="true" pointerEvents="none">
    <rect x={leftWidth} y="0" width={CUSTOM_DRAWING_VIEW.width - leftWidth} height={topHeight} className="cad-ruler-band cad-ruler-band-x"/>
    <rect x="0" y={topHeight} width={leftWidth} height={CUSTOM_DRAWING_VIEW.height - topHeight} className="cad-ruler-band cad-ruler-band-y"/>
    <rect x="0" y="0" width={leftWidth} height={topHeight} className="cad-ruler-corner"/>
    <text x={leftWidth / 2} y={19 / safeZoom} textAnchor="middle" className="cad-ruler-unit" style={{ fontSize: `${fontSize}px` }}>mm</text>
    <text x={CUSTOM_DRAWING_VIEW.width - 8 / safeZoom} y={19 / safeZoom} textAnchor="end" className="cad-ruler-axis-name" style={{ fontSize: `${fontSize}px` }}>X</text>
    <text x={14 / safeZoom} y={topHeight + 17 / safeZoom} textAnchor="middle" className="cad-ruler-axis-name" style={{ fontSize: `${fontSize}px` }}>Y</text>

    {horizontalTicks.map((tick) => {
      const point = modelToDrawingPoint({ x: tick.valueMm, y: 0 }, transform)
      if (point.x < leftWidth || point.x > CUSTOM_DRAWING_VIEW.width) return null
      const length = tick.major ? majorTick : minorTick
      return <g key={`ruler-x-${tick.valueMm}`}>
        <line x1={point.x} y1={topHeight} x2={point.x} y2={topHeight - length} className={tick.major ? 'cad-ruler-tick major' : 'cad-ruler-tick'}/>
        {tick.major && <text x={point.x} y={11 / safeZoom} textAnchor="middle" className="cad-ruler-label" style={{ fontSize: `${fontSize}px` }}>{Math.round(tick.valueMm)}</text>}
      </g>
    })}

    {verticalTicks.map((tick) => {
      const point = modelToDrawingPoint({ x: 0, y: tick.valueMm }, transform)
      if (point.y < topHeight || point.y > CUSTOM_DRAWING_VIEW.height) return null
      const length = tick.major ? majorTick : minorTick
      return <g key={`ruler-y-${tick.valueMm}`}>
        <line x1={leftWidth} y1={point.y} x2={leftWidth - length} y2={point.y} className={tick.major ? 'cad-ruler-tick major' : 'cad-ruler-tick'}/>
        {tick.major && <text x={leftWidth - 13 / safeZoom} y={point.y + 3 / safeZoom} textAnchor="end" className="cad-ruler-label" style={{ fontSize: `${fontSize}px` }}>{Math.round(tick.valueMm)}</text>}
      </g>
    })}
  </g>
}
