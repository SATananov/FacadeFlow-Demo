import type { ProductType } from './productTypes'
import type { ImportedDimensionEvidence } from './dimensionTypes'

export type DrawingFileKind = 'PDF' | 'PNG' | 'JPEG'
export type DrawingReviewStatus = 'DRAFT' | 'NEEDS_REVIEW' | 'VERIFIED'

export interface DrawingImportLimits {
  maximumFileBytes: number
  maximumPdfPages: number
}

export interface DrawingSourceMetadata {
  fileName: string
  mimeType: string
  kind: DrawingFileKind
  sizeBytes: number
  sha256: string
  pageCount: number
}

export interface DrawingProductDraft {
  projectReference: string
  sourcePage: number
  productReference: string
  productCategory: ProductType
  templateId: string
  width: number
  height: number
  quantity: number
  notes: string
  drawingPosition: string
  status: DrawingReviewStatus
}

export interface CapturedDrawingProduct extends DrawingProductDraft {
  id: string
  sourceFileName: string
  sourceSha256: string
  createdAt: string
  updatedAt: string
  recognitionDerived?: boolean
  automaticallyPopulated?: boolean
  humanVerified?: boolean
  machineReady?: false
  simulationOnly?: true
  sourceCrop?: { x: number; y: number; width: number; height: number }
  dimensionEvidence?: ImportedDimensionEvidence[]
}

export interface DrawingImportValidation {
  valid: boolean
  errors: string[]
}

export interface DrawingSourceFile {
  file: File
  bytes: ArrayBuffer
  metadata: DrawingSourceMetadata
  objectUrl?: string
}
