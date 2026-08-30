import { CUSTOM_DRAWING_VIEW, getCustomDrawingTransform, type CustomGridStep } from '../customDrawingCoordinates'
import { CadAxisOverlay } from './CadAxisOverlay'
import { CadRulers } from './CadRulers'

interface Props {
  productWidth: number
  productHeight: number
  gridStep: CustomGridStep
  zoom: number
  showAxes: boolean
  showRulers: boolean
}

export function CadWorkbenchGuideLayer({ productWidth, productHeight, gridStep, zoom, showAxes, showRulers }: Props) {
  const transform = getCustomDrawingTransform(Math.max(productWidth, 1), Math.max(productHeight, 1))

  return <svg
    className="cad-workbench-guide-layer"
    viewBox={`0 0 ${CUSTOM_DRAWING_VIEW.width} ${CUSTOM_DRAWING_VIEW.height}`}
    preserveAspectRatio="xMidYMid meet"
    aria-hidden="true"
    pointerEvents="none"
  >
    {showAxes && <CadAxisOverlay transform={transform} zoom={zoom}/>}
    {showRulers && <CadRulers transform={transform} gridStep={gridStep} zoom={zoom}/>}
  </svg>
}
