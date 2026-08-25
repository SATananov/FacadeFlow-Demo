import type { CombinedAuditEntry } from './combinedAnalysisTypes'
export function combinedAudit(jobId: string, action: CombinedAuditEntry['action'], target: string, previousValue?: string, newValue?: string, humanConfirmed = true): CombinedAuditEntry { return { id: crypto.randomUUID(), jobId, action, target, previousValue, newValue, humanConfirmed, timestamp: new Date().toISOString() } }
