export type Component3DRole = 'FRAME' | 'DIVIDER' | 'SASH' | 'GLAZING' | 'PANEL' | 'PLACEHOLDER'
export type CameraPreset = 'FRONT' | 'BACK' | 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM' | 'ISOMETRIC'
export type Conceptual3DCanonicalProfileRole = 'FRAME' | 'MULLION' | 'SASH'
export interface Vector3Value { x: number; y: number; z: number }
export interface Conceptual3DCanonicalProfileAssignment {
  targetKind: 'FRAME' | 'MULLION' | 'SASH'
  targetRef: string
  systemId: string
  systemLabel: string
  role: Conceptual3DCanonicalProfileRole
  profileCode: string
  source: 'AI05.3.4_EXPLICIT_PRODUCT_INTENT_PROPAGATION'
  explicit: true
  automaticProfileSelectionAllowed: false
  exactProfileContourApplied: false
  productionGeometryApproved: false
  machineReady: false
  productionApproved: false
}
export interface Product3DProfileAssignmentBridge {
  version: 'AI05.3.4'
  status: 'READY_FOR_HUMAN_REVIEW' | 'NEEDS_EXPLICIT_PROFILE_ASSIGNMENT' | 'BLOCKED_CONFLICT'
  assignments: Conceptual3DCanonicalProfileAssignment[]
  missingExplicitAssignments: string[]
  conflicts: string[]
  automaticProfileSelectionAllowed: false
  exactProfileContourApplied: false
  geometryMutatedByBridge: false
  productionGeometryApproved: false
  machineReady: false
  productionApproved: false
}
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
  sourceType: 'CUSTOM' | 'TEMPLATE' | 'VERIFIED_IMPORT' | 'HUMAN_REVIEWED_AI'
  sourceReference: string
  bounds: SceneBounds3D
  nodes: Component3DNode[]
  conceptualDepthMm: number
  conceptualOnly: true
  profileAssignmentBridge?: Product3DProfileAssignmentBridge
  productionGeometryApproved: false
  machineReady: false
}
export interface ThreeDVisibility {
  glazing: boolean; frame: boolean; dividers: boolean; sashes: boolean; labels: boolean; grid: boolean; wireframe: boolean; transparent: boolean
}
export const defaultThreeDVisibility: ThreeDVisibility = { glazing: true, frame: true, dividers: true, sashes: true, labels: false, grid: true, wireframe: false, transparent: false }
