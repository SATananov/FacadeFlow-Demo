import { buildFacadeFlowRuleApplicabilityFoundation } from './aiRuleApplicability'
import type {
  FacadeFlowAiSession,
  FacadeFlowRuleApplicabilityDecision,
  FacadeFlowRuleEvaluationFoundation,
  FacadeFlowRuleEvaluationInvalidationReason,
  FacadeFlowRuleEvaluationRecord,
  FacadeFlowRuleEvaluationResult,
  FacadeFlowRuleGateRequirementId,
} from './aiWorkspaceTypes'

export const RULE_EVALUATION_RESULTS: FacadeFlowRuleEvaluationResult[] = [
  'NEEDS_EVIDENCE',
  'PASS',
  'FAIL',
  'NOT_APPLICABLE',
]

export function createFacadeFlowRuleEvaluationDraft(
  id: string,
  requirementId: FacadeFlowRuleGateRequirementId,
  applicabilityRecordId = `applicability-${requirementId}`,
): FacadeFlowRuleEvaluationRecord {
  return {
    id,
    requirementId,
    ruleId: '',
    ruleRevision: '',
    applicabilityRecordId,
    applicabilityDecision: 'UNRESOLVED',
    sourceRecordIds: [],
    evidence: [],
    observationSummary: '',
    result: 'NEEDS_EVIDENCE',
    evaluator: '',
    evaluatedAt: null,
    reviewStatus: 'NEEDS_REVIEW',
    reviewNote: '',
    invalidationReasons: [],
    simulationOnly: true,
    machineReady: false,
  }
}

export function facadeFlowRuleEvaluationMissingFields(record: FacadeFlowRuleEvaluationRecord): string[] {
  const missing: string[] = []
  if (!record.ruleId.trim()) missing.push('Идентификатор на реалното правило')
  if (!record.ruleRevision.trim()) missing.push('Ревизия на правилото')
  if (!record.applicabilityRecordId.trim()) missing.push('Потвърдена приложимост')
  if (record.applicabilityDecision === 'UNRESOLVED') missing.push('Решение за приложимост')
  if (record.sourceRecordIds.length === 0) missing.push('Потвърден източник')
  if (record.evidence.length === 0) missing.push('Доказателство от проверката')
  if (record.result === 'NEEDS_EVIDENCE') missing.push('Резултат от проверката')
  if ((record.result === 'PASS' || record.result === 'FAIL') && !record.observationSummary.trim()) missing.push('Наблюдавана стойност / основание')
  return missing
}

const resultMatchesApplicability = (result: FacadeFlowRuleEvaluationResult, decision: FacadeFlowRuleApplicabilityDecision) => {
  if (result === 'NOT_APPLICABLE') return decision === 'DOES_NOT_APPLY'
  if (result === 'PASS' || result === 'FAIL') return decision === 'APPLIES' || decision === 'CONDITIONAL'
  return false
}

export function canHumanReviewFacadeFlowRuleEvaluation(
  record: FacadeFlowRuleEvaluationRecord,
  evaluator: string,
  humanConfirmedSourceIds: string[],
  humanConfirmedApplicabilityIds: string[],
): boolean {
  const sourcesConfirmed = record.sourceRecordIds.length > 0 && record.sourceRecordIds.every((id) => humanConfirmedSourceIds.includes(id))
  const applicabilityConfirmed = humanConfirmedApplicabilityIds.includes(record.applicabilityRecordId)
  return facadeFlowRuleEvaluationMissingFields(record).length === 0
    && evaluator.trim().length > 0
    && sourcesConfirmed
    && applicabilityConfirmed
    && resultMatchesApplicability(record.result, record.applicabilityDecision)
}

export function completeFacadeFlowRuleEvaluation(
  record: FacadeFlowRuleEvaluationRecord,
  evaluator: string,
  evaluatedAt: string,
  humanConfirmedSourceIds: string[],
  humanConfirmedApplicabilityIds: string[],
  reviewNote = '',
): FacadeFlowRuleEvaluationRecord {
  if (!evaluatedAt.trim() || !canHumanReviewFacadeFlowRuleEvaluation(record, evaluator, humanConfirmedSourceIds, humanConfirmedApplicabilityIds)) return record
  return {
    ...record,
    evaluator: evaluator.trim(),
    evaluatedAt,
    reviewStatus: 'HUMAN_REVIEWED',
    reviewNote,
    invalidationReasons: [],
    machineReady: false,
  }
}

const sameArray = <T,>(before: T[], after: T[]) => JSON.stringify(before) === JSON.stringify(after)

export function updateFacadeFlowRuleEvaluation(
  record: FacadeFlowRuleEvaluationRecord,
  patch: Partial<Pick<FacadeFlowRuleEvaluationRecord, 'ruleId' | 'ruleRevision' | 'applicabilityRecordId' | 'applicabilityDecision' | 'sourceRecordIds' | 'evidence' | 'observationSummary' | 'result' | 'reviewNote'>>,
): FacadeFlowRuleEvaluationRecord {
  const next = { ...record, ...patch }
  if (record.reviewStatus !== 'HUMAN_REVIEWED') return next

  const reasons: FacadeFlowRuleEvaluationInvalidationReason[] = []
  if (patch.ruleId !== undefined && patch.ruleId !== record.ruleId) reasons.push('RULE_REFERENCE_CHANGED')
  if (patch.ruleRevision !== undefined && patch.ruleRevision !== record.ruleRevision) reasons.push('RULE_REVISION_CHANGED')
  if ((patch.applicabilityRecordId !== undefined && patch.applicabilityRecordId !== record.applicabilityRecordId) || (patch.applicabilityDecision !== undefined && patch.applicabilityDecision !== record.applicabilityDecision)) reasons.push('APPLICABILITY_CHANGED')
  if (patch.sourceRecordIds !== undefined && !sameArray(patch.sourceRecordIds, record.sourceRecordIds)) reasons.push('SOURCE_SET_CHANGED')
  if (patch.evidence !== undefined && !sameArray(patch.evidence, record.evidence)) reasons.push('EVIDENCE_CHANGED')
  if (patch.observationSummary !== undefined && patch.observationSummary !== record.observationSummary) reasons.push('OBSERVATION_CHANGED')
  if (patch.result !== undefined && patch.result !== record.result) reasons.push('RESULT_CHANGED')
  if (reasons.length === 0) return next

  return {
    ...next,
    result: 'NEEDS_EVIDENCE',
    evaluator: '',
    evaluatedAt: null,
    reviewStatus: 'NEEDS_REVIEW',
    invalidationReasons: [...new Set(reasons)],
    machineReady: false,
  }
}

export function buildFacadeFlowRuleEvaluationFoundation(session: FacadeFlowAiSession): FacadeFlowRuleEvaluationFoundation | null {
  const gate = session.job.reviewPacket?.ruleGate
  if (!gate) return null
  const applicability = buildFacadeFlowRuleApplicabilityFoundation(session)
  if (!applicability) return null
  const rows = gate.requirements.map((item) => createFacadeFlowRuleEvaluationDraft(`evaluation-${item.id}`, item.id))
  return {
    status: 'FOUNDATION_READY',
    rows,
    resultVocabulary: [...RULE_EVALUATION_RESULTS],
    realEvaluationCount: 0,
    humanReviewedEvaluationCount: 0,
    passCount: 0,
    failCount: 0,
    notApplicableCount: 0,
    needsEvidenceCount: rows.length,
    rulesValidated: false,
    handoffLocked: true,
    simulationOnly: true,
    machineReady: false,
  }
}
