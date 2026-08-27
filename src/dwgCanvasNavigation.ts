export type DwgCanvasEditorMode = 'IDLE' | 'SELECT_SOURCE' | 'MOVE_SOURCE' | 'DRAW_BOX' | 'PLACE_NOTE'
export type DwgCanvasCorrectionMode = 'IDLE' | 'SELECT_TEXT' | 'SELECT_FIELD'

export function isDwgCanvasNavigationAvailable(editorMode: DwgCanvasEditorMode, correctionMode: DwgCanvasCorrectionMode) {
  return editorMode === 'IDLE' && correctionMode === 'IDLE'
}

export function shouldDwgCanvasCaptureWheel(navigationActive: boolean, editorMode: DwgCanvasEditorMode, correctionMode: DwgCanvasCorrectionMode) {
  return navigationActive && isDwgCanvasNavigationAvailable(editorMode, correctionMode)
}

export const DWG_CANVAS_NAVIGATION_SAFETY = Object.freeze({ viewportOnly: true, mutatesDwg: false, machineReady: false, internalEvaluationOnly: true })
