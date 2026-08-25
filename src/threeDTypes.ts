export type Component3DRole = 'FRAME' | 'DIVIDER' | 'SASH' | 'GLAZING' | 'PANEL' | 'PLACEHOLDER'
export type CameraPreset = 'FRONT' | 'BACK' | 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM' | 'ISOMETRIC'
export interface Vector3Value { x: number; y: number; z: number }
export interface Component3DNode {
  id: string
  role: Component3DRole
  sourcePath: string
  profileId?: string
  profileCode?: string
  dimensions: Vector3Value
  position: Vector3Value
  rotation: Vector3Value
  selectable: boolean
  openingGroupId?: string
  openingDirection?: 'left' | 'right'
  openingConfirmed?: boolean
  warning?: string
}
export interface SceneBounds3D { width: number; height: number; depth: number }
export interface Product3DScene {
  id: string
  sourceType: 'CUSTOM' | 'TEMPLATE' | 'VERIFIED_IMPORT'
  sourceReference: string
  bounds: SceneBounds3D
  nodes: Component3DNode[]
  conceptualDepthMm: number
  conceptualOnly: true
  productionGeometryApproved: false
  machineReady: false
}
export interface ThreeDVisibility {
  glazing: boolean; frame: boolean; dividers: boolean; sashes: boolean; labels: boolean; grid: boolean; wireframe: boolean; transparent: boolean
}
export const defaultThreeDVisibility: ThreeDVisibility = { glazing: true, frame: true, dividers: true, sashes: true, labels: false, grid: true, wireframe: false, transparent: false }
