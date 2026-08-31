import type { FacadeFlowRuleGateRequirementId, FacadeFlowRuleSourceRecord, FacadeFlowRuleSourceReReviewReason } from './aiWorkspaceTypes'

export const RULE_SOURCE_REVIEW_INVALIDATORS: FacadeFlowRuleSourceReReviewReason[] = [
  'SOURCE_KIND_CHANGED',
  'SOURCE_REFERENCE_CHANGED',
  'SOURCE_LOCATION_CHANGED',
  'REVISION_CHANGED',
  'SCOPE_CHANGED',
  'SOURCE_DATE_CHANGED',
]

export function createFacadeFlowRuleSourceDraft(id: string, requirementId: FacadeFlowRuleGateRequirementId): FacadeFlowRuleSourceRecord {
  return {
    id,
    requirementId,
    sourceKind: 'OTHER',
    sourceTitle: '',
    sourceReference: '',
    sourceLocation: '',
    revision: '',
    scope: '',
    sourceDate: '',
    reviewer: '',
    reviewedAt: null,
    reviewStatus: 'NEEDS_REVIEW',
    reviewNote: '',
    reReviewReasons: [],
    evidence: [],
    simulationOnly: true,
    machineReady: false,
  }
}

export function facadeFlowRuleSourceMissingFields(record: FacadeFlowRuleSourceRecord): string[] {
  const missing: string[] = []
  if (!record.sourceTitle.trim()) missing.push('Източник / заглавие')
  if (!record.sourceReference.trim()) missing.push('Документ / референция')
  if (!record.sourceLocation.trim()) missing.push('Страница / ред / място')
  if (!record.revision.trim()) missing.push('Ревизия')
  if (!record.scope.trim()) missing.push('Система / обхват')
  if (!record.sourceDate.trim()) missing.push('Дата на източника')
  return missing
}

export function canHumanConfirmFacadeFlowRuleSource(record: FacadeFlowRuleSourceRecord, reviewer: string): boolean {
  return facadeFlowRuleSourceMissingFields(record).length === 0 && reviewer.trim().length > 0
}

export function confirmFacadeFlowRuleSource(record: FacadeFlowRuleSourceRecord, reviewer: string, reviewedAt: string, reviewNote = ''): FacadeFlowRuleSourceRecord {
  if (!canHumanConfirmFacadeFlowRuleSource(record, reviewer) || !reviewedAt.trim()) return record
  return { ...record, reviewer: reviewer.trim(), reviewedAt, reviewStatus: 'HUMAN_CONFIRMED', reviewNote, reReviewReasons: [], machineReady: false }
}

const changed = (before: string | undefined, after: string | undefined) => (before ?? '') !== (after ?? '')

export function updateFacadeFlowRuleSource(
  record: FacadeFlowRuleSourceRecord,
  patch: Partial<Pick<FacadeFlowRuleSourceRecord, 'sourceKind' | 'sourceTitle' | 'sourceReference' | 'sourceLocation' | 'revision' | 'scope' | 'sourceDate' | 'reviewNote' | 'supersedesSourceId'>>,
): FacadeFlowRuleSourceRecord {
  const next = { ...record, ...patch }
  if (record.reviewStatus !== 'HUMAN_CONFIRMED') return next

  const reasons: FacadeFlowRuleSourceReReviewReason[] = []
  if (patch.sourceKind !== undefined && patch.sourceKind !== record.sourceKind) reasons.push('SOURCE_KIND_CHANGED')
  if ((patch.sourceTitle !== undefined && changed(record.sourceTitle, patch.sourceTitle)) || (patch.sourceReference !== undefined && changed(record.sourceReference, patch.sourceReference)) || (patch.supersedesSourceId !== undefined && changed(record.supersedesSourceId, patch.supersedesSourceId))) reasons.push('SOURCE_REFERENCE_CHANGED')
  if (patch.sourceLocation !== undefined && changed(record.sourceLocation, patch.sourceLocation)) reasons.push('SOURCE_LOCATION_CHANGED')
  if (patch.revision !== undefined && changed(record.revision, patch.revision)) reasons.push('REVISION_CHANGED')
  if (patch.scope !== undefined && changed(record.scope, patch.scope)) reasons.push('SCOPE_CHANGED')
  if (patch.sourceDate !== undefined && changed(record.sourceDate, patch.sourceDate)) reasons.push('SOURCE_DATE_CHANGED')
  if (reasons.length === 0) return next

  return { ...next, reviewStatus: 'NEEDS_REVIEW', reviewer: '', reviewedAt: null, reReviewReasons: [...new Set(reasons)], machineReady: false }
}
