export type OcrJobState = 'READY' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
export type OcrCandidateType = 'WIDTH' | 'HEIGHT' | 'WIDTH_HEIGHT_PAIR' | 'DIAMETER' | 'RADIUS' | 'GENERIC_DIMENSION' | 'TEXT_ONLY'
export type OcrCandidateStatus = 'SUGGESTED' | 'ACCEPTED' | 'REJECTED'
export type OcrTargetField = 'projectReference' | 'productReference' | 'width' | 'height' | 'drawingPosition' | 'notes'
export interface OcrRectangle { x: number; y: number; width: number; height: number }
export interface OcrSelection { rectangle: OcrRectangle; page: number; imageDataUrl: string }
export interface OcrTextItem { text: string; confidence: number; bbox?: OcrRectangle }
export interface OcrCandidate {
  id: string; rawSourceText: string; normalizedValue: string; type: OcrCandidateType; unit: string
  ocrConfidence: number; parserConfidence: number; sourcePage: number; selection: OcrRectangle
  status: OcrCandidateStatus; createdAt: string
}
export interface OcrJob {
  id: string; state: OcrJobState; sourceSha256: string; sourcePage: number; selection: OcrRectangle
  language: 'eng'; rawText: string; normalizedText: string; confidence: number; items: OcrTextItem[]
  candidates: OcrCandidate[]; progress: number; createdAt: string; completedAt?: string; error?: string
}
export interface OcrAuditEntry {
  id: string; jobId: string; action: 'ACCEPT' | 'REJECT' | 'EDIT' | 'APPLY'; candidateId: string
  appliedField?: OcrTargetField; previousValue?: string; newValue?: string; timestamp: string; humanConfirmed: boolean
}
