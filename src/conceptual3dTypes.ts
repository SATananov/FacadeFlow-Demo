export type ConceptualNodeKind = 'FRAME' | 'SASH' | 'MULLION' | 'GLASS' | 'SOLID_PANEL' | 'HANDLE_MARKER' | 'HINGE_MARKER' | 'THRESHOLD_WARNING'
export interface ConceptualPoint3 { x: number; y: number; z: number }
export interface ConceptualBounds { x: number; y: number; z: number; width: number; height: number; depth: number }
export interface ConceptualMaterial { front: string; back: string; opacity: number; edge: string }
export interface ConceptualSceneNode { nodeId: string; semanticSourceId: string; kind: ConceptualNodeKind; bounds: ConceptualBounds; material: ConceptualMaterial; selectable: boolean; label: string; openingLabel?: string; conceptualPreviewOnly: true; productionGeometry: false }
export interface ConceptualScene { nodes: ConceptualSceneNode[]; bounds: ConceptualBounds; category: 'WINDOW' | 'DOOR'; overallWidth: number; overallHeight: number; thresholdUnresolved: boolean; sessionOnly: true; simulationOnly: true; machineReady: false; internalEvaluationOnly: true; productionApproved: false; sourceImmutable: true; geometryCreated: false; exportAvailable: false; dwgWriteAvailable: false; machineConnectivityAvailable: false; conceptualPreviewOnly: true; productionGeometry: false }
export interface ConceptualViewState { yaw: number; pitch: number; zoom: number; preset: ConceptualViewPreset }
export type ConceptualViewPreset = 'FRONT' | 'BACK' | 'LEFT' | 'RIGHT' | 'ISOMETRIC' | 'CUSTOM'
export interface ProjectedPoint { x: number; y: number; depth: number }
export interface ProjectedNode { node: ConceptualSceneNode; polygon: ProjectedPoint[]; depth: number }
export interface CameraDragState { pointerId: number; startX: number; startY: number; initial: ConceptualViewState; preview: ConceptualViewState }
