import type { ImportSupportStatus } from './importFormatTypes'

export type SkyGlazingSourceFormat = 'SKYGLAZING_XML' | 'LTE'
export type SkyGlazingComparisonStatus = 'MATCHED' | 'XML_ONLY' | 'LTE_ONLY' | 'CONFLICT' | 'UNRESOLVED'

export interface SkyGlazingSourceEvidence {
  fileName: string
  extension: string
  detectedFormat: SkyGlazingSourceFormat
  sizeBytes: number
  sha256: string
  supportStatus: ImportSupportStatus
  importedAt: string
  warnings: string[]
  simulationOnly: true
  machineReady: false
}

export interface SkyGlazingXmlPiece {
  sourceFileName: string
  sourceSha256: string
  originalRecordIndex: number
  rawEvidence: string
  dxfProfileName: string
  maxY: string
  maxZ: string
  barcode: string
  normalizedBarcode: string
  length: string
  sxB: string
  dxB: string
  sxC: string
  dxC: string
  operationCount: number
  operationNames: string[]
  sourceStatus: 'OBSERVED'
  simulationOnly: true
  machineReady: false
}

export interface SkyGlazingXmlInspection {
  source: SkyGlazingSourceEvidence
  generator: string
  version: string
  unit: string
  projectName: string
  barCount: number
  pieceCount: number
  workCount: number
  uniqueBarcodeCount: number
  uniqueDxfProfileCount: number
  pieces: SkyGlazingXmlPiece[]
  rawStructuralText: string
}

export interface SkyGlazingLteRecord {
  sourceFileName: string
  sourceSha256: string
  originalRecordIndex: number
  lineNumber: number
  profileToken: string
  rawLengthToken: string
  barcode: string
  normalizedBarcode: string
  originalLine: string
  sourceStatus: 'OBSERVED'
  unresolvedFixedWidthRanges: true
  simulationOnly: true
  machineReady: false
}

export interface SkyGlazingLteInspection {
  source: SkyGlazingSourceEvidence
  recordCount: number
  fixedRecordWidth: number | null
  uniqueBarcodeCount: number
  profileGroupCount: number
  records: SkyGlazingLteRecord[]
}

export interface SkyGlazingComparisonRecord {
  normalizedBarcode: string
  status: SkyGlazingComparisonStatus
  xmlRecord?: SkyGlazingXmlPiece
  lteRecord?: SkyGlazingLteRecord
  explanation: string
  simulationOnly: true
  machineReady: false
}

export interface SkyGlazingComparison {
  records: SkyGlazingComparisonRecord[]
  counts: Record<SkyGlazingComparisonStatus, number>
  xmlRecordCount: number
  lteRecordCount: number
  matchingRule: 'EXACT_TRIMMED_BARCODE_ONLY'
  simulationOnly: true
  machineReady: false
}
