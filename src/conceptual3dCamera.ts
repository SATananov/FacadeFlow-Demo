import type { CameraDragState, ConceptualBounds, ConceptualPoint3, ConceptualViewPreset, ConceptualViewState, ProjectedPoint } from './conceptual3dTypes'

export const CONCEPTUAL_3D_INITIAL_VIEW: ConceptualViewState = { yaw: -.55, pitch: .32, zoom: .82, preset: 'ISOMETRIC' }
export const clampPitch = (value: number) => Math.max(-1.15, Math.min(1.15, value))
export const clampConceptualZoom = (value: number) => Math.max(.35, Math.min(2.4, value))
export const presetView = (preset: Exclude<ConceptualViewPreset, 'CUSTOM'>): ConceptualViewState => ({
  FRONT: { yaw: 0, pitch: 0, zoom: .9, preset }, BACK: { yaw: Math.PI, pitch: 0, zoom: .9, preset }, LEFT: { yaw: -Math.PI / 2, pitch: 0, zoom: .9, preset }, RIGHT: { yaw: Math.PI / 2, pitch: 0, zoom: .9, preset }, ISOMETRIC: { ...CONCEPTUAL_3D_INITIAL_VIEW },
}[preset])
export const fitConceptualView = (view: ConceptualViewState, bounds: Pick<ConceptualBounds, 'width'|'height'> = {width:1,height:1}): ConceptualViewState => ({ ...view, zoom: clampConceptualZoom(.82/Math.max(bounds.width,bounds.height,.01)), preset: 'CUSTOM' })
export const beginCameraDrag = (pointerId: number, x: number, y: number, view: ConceptualViewState): CameraDragState => ({ pointerId, startX: x, startY: y, initial: view, preview: view })
export const updateCameraDrag = (drag: CameraDragState, x: number, y: number): CameraDragState => ({ ...drag, preview: { yaw: drag.initial.yaw + (x - drag.startX) * .008, pitch: clampPitch(drag.initial.pitch + (y - drag.startY) * .008), zoom: drag.initial.zoom, preset: 'CUSTOM' } })
export const cameraKey = (view: ConceptualViewState, key: string): ConceptualViewState => key === 'ArrowLeft' ? { ...view, yaw: view.yaw - .12, preset: 'CUSTOM' } : key === 'ArrowRight' ? { ...view, yaw: view.yaw + .12, preset: 'CUSTOM' } : key === 'ArrowUp' ? { ...view, pitch: clampPitch(view.pitch - .1), preset: 'CUSTOM' } : key === 'ArrowDown' ? { ...view, pitch: clampPitch(view.pitch + .1), preset: 'CUSTOM' } : key === '+' || key === '=' ? { ...view, zoom: clampConceptualZoom(view.zoom * 1.12), preset: 'CUSTOM' } : key === '-' ? { ...view, zoom: clampConceptualZoom(view.zoom / 1.12), preset: 'CUSTOM' } : key === '0' ? { ...CONCEPTUAL_3D_INITIAL_VIEW } : key.toLowerCase() === 'f' ? fitConceptualView(view) : view
export function projectConceptualPoint(point: ConceptualPoint3, view: ConceptualViewState, width: number, height: number): ProjectedPoint {
  const cy = Math.cos(view.yaw), sy = Math.sin(view.yaw), cp = Math.cos(view.pitch), sp = Math.sin(view.pitch)
  const x1 = point.x * cy + point.z * sy, z1 = -point.x * sy + point.z * cy, y1 = point.y * cp - z1 * sp, z2 = point.y * sp + z1 * cp
  const scale = Math.min(width, height) * .72 * view.zoom
  return { x: width / 2 + x1 * scale, y: height / 2 - y1 * scale, depth: z2 }
}
