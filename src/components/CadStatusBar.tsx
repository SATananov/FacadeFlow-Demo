import type { CadTool } from '../cad/cadTypes'
import { formatCadStatusCoordinates } from '../cad/cadDrafting'
import type { CustomGridStep, ModelCoordinates } from '../customDrawingCoordinates'

interface Props {
  tool: CadTool
  gridVisible: boolean
  gridStep: CustomGridStep
  snappingEnabled: boolean
  cursorCoordinates: ModelCoordinates | null
  zoom: number
}

export function CadStatusBar({ tool, gridVisible, gridStep, snappingEnabled, cursorCoordinates, zoom }: Props) {
  return <div className="cad-status-bar" role="status" aria-live="polite">
    <span><b>ИНСТРУМЕНТ</b> {tool === 'LINE' ? 'ЛИНИЯ' : 'ИЗБОР'}</span>
    <span><b>МРЕЖА</b> {gridVisible ? `${gridStep} mm` : 'ИЗКЛ.'}</span>
    <span><b>SNAP</b> {snappingEnabled ? 'GRID' : 'ИЗКЛ.'}</span>
    <span className="cad-status-coordinates">{formatCadStatusCoordinates(cursorCoordinates)}</span>
    <span><b>ZOOM</b> {Math.round(zoom * 100)}%</span>
  </div>
}
