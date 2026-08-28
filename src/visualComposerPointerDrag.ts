import { clampPositionRatio, moveComposerHandle, moveComposerHinge } from './visualComposerState'
import type { VisualComposition } from './visualComposerTypes'

export interface HardwareDragSession { componentId: string; pointerId: number; startRatio: number; previewRatio: number }
export const positionRatioFromSvgY = (svgY: number, fieldY: number, fieldHeight: number) => fieldHeight > 0 && Number.isFinite(svgY) ? clampPositionRatio((svgY - fieldY) / fieldHeight) : 0.5
export const scaledClientYToPositionRatio = (clientY: number, viewportTop: number, viewportHeight: number, viewBoxHeight: number, fieldY: number, fieldHeight: number) => positionRatioFromSvgY((clientY - viewportTop) * viewBoxHeight / viewportHeight, fieldY, fieldHeight)
export const beginHardwareDrag = (componentId: string, pointerId: number, startRatio: number): HardwareDragSession => ({ componentId, pointerId, startRatio: clampPositionRatio(startRatio), previewRatio: clampPositionRatio(startRatio) })
export const previewHardwareDrag = (session: HardwareDragSession, ratio: number): HardwareDragSession => ({ ...session, previewRatio: clampPositionRatio(ratio) })
export const hardwareDragChanged = (session: HardwareDragSession) => Math.abs(session.previewRatio - session.startRatio) > 0.0001
export const moveHardwareComponent = (state: VisualComposition, componentId: string, ratio: number) => state.components.find(({ id }) => id === componentId)?.type === 'HANDLE' ? moveComposerHandle(state, componentId, ratio) : moveComposerHinge(state, componentId, ratio)
