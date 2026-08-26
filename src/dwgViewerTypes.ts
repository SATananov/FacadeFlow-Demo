export const DWG_LIMITS = {
  maximumFileBytes: 20 * 1024 * 1024,
  maximumEntities: 250_000,
  maximumBlockDepth: 32,
  maximumTextLength: 4_096,
  maximumCoordinateMagnitude: 1_000_000_000,
  workerTimeoutMs: 45_000,
} as const

export interface DwgPoint { x: number; y: number }
export interface DwgBounds { minX: number; minY: number; maxX: number; maxY: number }
interface EntityBase { type: string; handle: string; layer: string }
export interface DwgLine extends EntityBase { type: 'LINE'; start: DwgPoint; end: DwgPoint }
export interface DwgPolyline extends EntityBase { type: 'POLYLINE'; points: DwgPoint[]; closed: boolean }
export interface DwgCircle extends EntityBase { type: 'CIRCLE'; center: DwgPoint; radius: number }
export interface DwgArc extends EntityBase { type: 'ARC'; center: DwgPoint; radius: number; startAngle: number; endAngle: number }
export interface DwgEllipse extends EntityBase { type: 'ELLIPSE'; center: DwgPoint; major: DwgPoint; ratio: number; startAngle: number; endAngle: number }
export interface DwgText extends EntityBase {
  type: 'TEXT'
  textKind: 'TEXT' | 'MTEXT'
  position: DwgPoint
  rawText: string
  displayText: string
  textWarnings: string[]
  hadFormatting: boolean
  hadUnicodeEscapes: boolean
  runs: readonly import('./dwgTextNormalization').DwgTextRun[]
  height: number
  rotation: number
  widthFactor: number
  referenceWidth: number | null
  sourceExtentsWidth: number | null
  sourceExtentsHeight: number | null
  horizontalAlignment: number
  verticalAlignment: number
  attachmentPoint: number
  lineSpacing: number
  lineSpacingStyle: number
  drawingDirection: number
  styleName: string
  obliqueAngle: number
}
export type DwgDrawableEntity = DwgLine | DwgPolyline | DwgCircle | DwgArc | DwgEllipse | DwgText

export interface DwgLayer { name: string; initiallyVisible: boolean; entityCount: number }
export interface DwgLayout { id: string; name: string; modelSpace: boolean; renderable: boolean; unsupportedReason?: string }
export interface DwgSection {
  sectionId: string
  bounds: DwgBounds
  detectionMethod: 'CLOSED_POLYLINE_RECTANGLE' | 'AXIS_ALIGNED_LINE_LOOP'
  confidence: 'HIGH'
  reason: string
  sourceEntities: Array<{ sourceIndex: number; handle: string }>
  boundaryLayer: string
  simulationOnly: true
  machineReady: false
  internalEvaluationOnly: true
}
export interface DwgWarning { code: 'UNSUPPORTED_ENTITY' | 'MISSING_FONT' | 'EXTERNAL_REFERENCE' | 'TEXT_LAYOUT_LIMITATION' | 'LIMIT'; message: string; count?: number }
export interface DwgSafetyFlags { readOnly: true; simulationOnly: true; machineReady: false; productionGeometryApproved: false; internalEvaluationOnly: true; externalDistributionApproved: false }
export const DWG_SAFETY_FLAGS: DwgSafetyFlags = { readOnly: true, simulationOnly: true, machineReady: false, productionGeometryApproved: false, internalEvaluationOnly: true, externalDistributionApproved: false }

export interface DwgDecodeOptions { maximumEntities?: number; maximumBlockDepth?: number; maximumTextLength?: number; maximumCoordinateMagnitude?: number }
export interface DwgDecodeResult {
  version: string
  entities: DwgDrawableEntity[]
  layers: DwgLayer[]
  layouts: DwgLayout[]
  sections: DwgSection[]
  bounds: DwgBounds
  entityCounts: Record<string, number>
  unsupportedCounts: Record<string, number>
  warnings: DwgWarning[]
  safety: DwgSafetyFlags
}

export interface DwgSourceMetadata { fileName: string; sizeBytes: number; sha256: string; version: string }
export interface DwgViewState { scale: number; offsetX: number; offsetY: number }
