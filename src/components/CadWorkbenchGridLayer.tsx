import { CUSTOM_DRAWING_VIEW, getCustomDrawingTransform, type CustomGridStep } from '../customDrawingCoordinates'
import { CustomCoordinateGrid } from './CustomCoordinateGrid'

interface Props {
  productWidth: number
  productHeight: number
  gridVisible: boolean
  gridStep: CustomGridStep
  showMajorGrid: boolean
}

export function CadWorkbenchGridLayer({ productWidth, productHeight, gridVisible, gridStep, showMajorGrid }: Props) {
  const transform = getCustomDrawingTransform(Math.max(productWidth, 1), Math.max(productHeight, 1))

  return <svg
    className="cad-workbench-grid-layer"
    viewBox={`0 0 ${CUSTOM_DRAWING_VIEW.width} ${CUSTOM_DRAWING_VIEW.height}`}
    preserveAspectRatio="xMidYMid meet"
    aria-hidden="true"
    pointerEvents="none"
  >
    <rect x="0" y="0" width={CUSTOM_DRAWING_VIEW.width} height={CUSTOM_DRAWING_VIEW.height} className="cad-workbench-grid-background"/>
    {gridVisible && <CustomCoordinateGrid transform={transform} step={gridStep} showMajorGrid={showMajorGrid}/>}
  </svg>
}
