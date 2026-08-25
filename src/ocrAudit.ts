import type { OcrAuditEntry, OcrCandidate, OcrTargetField } from './ocrTypes'
export function createOcrAudit(jobId: string, candidate: OcrCandidate, action: OcrAuditEntry['action'], details: { field?: OcrTargetField; previousValue?: string; newValue?: string; confirmed?: boolean } = {}): OcrAuditEntry {
  return { id: crypto.randomUUID(), jobId, candidateId: candidate.id, action, appliedField: details.field, previousValue: details.previousValue, newValue: details.newValue, timestamp: new Date().toISOString(), humanConfirmed: details.confirmed ?? true }
}
