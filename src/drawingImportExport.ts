import type { CapturedDrawingProduct, DrawingImportValidation, DrawingSourceMetadata } from './drawingImportTypes'
import type { OcrAuditEntry, OcrJob } from './ocrTypes'
import type { CombinedAnalysisJob, CombinedAuditEntry } from './combinedAnalysisTypes'
import type { RecognitionDerivedDraft } from './combinedProvisionalDraft'

interface Input {
  source: DrawingSourceMetadata
  products: CapturedDrawingProduct[]
  validation: DrawingImportValidation
  ocrJobs?: OcrJob[]
  ocrAudit?: OcrAuditEntry[]
  combinedAnalysis?: CombinedAnalysisJob
  combinedAudit?: CombinedAuditEntry[]
  provisionalDraft?: RecognitionDerivedDraft
}

export function exportDrawingImportSimulation({ source, products, validation, ocrJobs = [], ocrAudit = [], combinedAnalysis, combinedAudit = [], provisionalDraft }: Input): void {
  const payload = {
    schemaVersion: '3.0',
    simulationOnly: true,
    machineReady: false,
    requiresHumanApproval: true,
    source,
    capturedProducts: products,
    reviewStatuses: products.map(({ id, status }) => ({ id, status })),
    validation,
    ...(ocrJobs.length ? { ocr: { ocrAssisted: true, ocrAutomaticallyApplied: false, simulationOnly: true, machineReady: false, requiresHumanApproval: true, jobs: ocrJobs, applicationAuditTrail: ocrAudit } } : {}),
    ...(combinedAnalysis ? { combinedAnalysis: { combinedRecognitionAssisted: true, automaticallyApplied: false, trainedGeometryModelUsed: false, simulationOnly: true, machineReady: false, requiresHumanApproval: true, evidence: combinedAnalysis, provisionalDraft, humanDecisions: combinedAudit } } : {}),
    generatedAt: new Date().toISOString(),
  }
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  const baseName = source.fileName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9а-яА-Я_-]+/g, '-') || 'drawing-import'
  link.download = `${baseName}.drawing-import.simulation.json`
  link.click()
  URL.revokeObjectURL(url)
}
