import { getCadMajorGridStep } from '../cad/cadDrafting'
import {
  CUSTOM_DRAWING_VIEW,
  modelToDrawingPoint,
  type CustomGridStep,
  type DrawingTransform,
} from '../customDrawingCoordinates'

interface Props {
  transform: DrawingTransform
  step: CustomGridStep
  showMajorGrid?: boolean
}

function generateVisibleGridValues(min: number, max: number, step: number): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || !Number.isFinite(step) || step <= 0) return []
  const start = Math.floor(min / step) * step
  const values: number[] = []
  for (let value = start, guard = 0; value <= max + 1e-9 && guard < 1000; value += step, guard += 1) {
    values.push(Object.is(value, -0) ? 0 : value)
  }
  return values
}

function isMajorValue(value: number, majorStep: number): boolean {
  const ratio = value / majorStep
  return Math.abs(ratio - Math.round(ratio)) < 1e-9
}

export function CustomCoordinateGrid({ transform, step, showMajorGrid = true }: Props) {
  const { width: viewWidth, height: viewHeight } = CUSTOM_DRAWING_VIEW
  const majorStep = getCadMajorGridStep(step)
  const modelMinX = -transform.ox / transform.scale
  const modelMaxX = (viewWidth - transform.ox) / transform.scale
  const modelMinY = (transform.oy + transform.height - viewHeight) / transform.scale
  const modelMaxY = (transform.oy + transform.height) / transform.scale
  const xValues = generateVisibleGridValues(modelMinX, modelMaxX, step)
  const yValues = generateVisibleGridValues(modelMinY, modelMaxY, step)

  return <g className="custom-coordinate-grid" aria-hidden="true" pointerEvents="none" shapeRendering="crispEdges">
    {xValues.map((value) => {
      const point = modelToDrawingPoint({ x: value, y: 0 }, transform)
      const major = isMajorValue(value, majorStep)
      if (major && !showMajorGrid) return null
      return <line key={`grid-x-${value}`} data-grid-mm={value} x1={point.x} y1="0" x2={point.x} y2={viewHeight} className={major ? 'custom-coordinate-grid-major-line' : 'custom-coordinate-grid-minor-line'}/>
    })}
    {yValues.map((value) => {
      const point = modelToDrawingPoint({ x: 0, y: value }, transform)
      const major = isMajorValue(value, majorStep)
      if (major && !showMajorGrid) return null
      return <line key={`grid-y-${value}`} data-grid-mm={value} x1="0" y1={point.y} x2={viewWidth} y2={point.y} className={major ? 'custom-coordinate-grid-major-line' : 'custom-coordinate-grid-minor-line'}/>
    })}
  </g>
}
