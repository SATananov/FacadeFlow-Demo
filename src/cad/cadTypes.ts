export type CadTool = 'SELECT' | 'LINE'

export interface CadDisplayState {
  showMajorGrid: boolean
  showAxes: boolean
  showRulers: boolean
  showCoordinates: boolean
}

export function createDefaultCadDisplayState(): CadDisplayState {
  return {
    showMajorGrid: true,
    showAxes: true,
    showRulers: true,
    showCoordinates: true,
  }
}
