import { effectiveGuidedProfileSystem } from './aiGuidedProduct'
import type {
  FacadeFlowAiSession,
  FacadeFlowRuleApplicabilityFoundation,
  FacadeFlowRuleApplicabilityProductTarget,
  FacadeFlowRuleApplicabilityRecord,
  FacadeFlowRuleGateRequirementId,
} from './aiWorkspaceTypes'

export const RULE_APPLICABILITY_PRODUCT_TARGETS: FacadeFlowRuleApplicabilityProductTarget[] = [
  'WINDOW',
  'DOOR',
  'SLIDING_SYSTEM',
  'FACADE',
  'TECHNICAL_DETAIL',
]

export function createFacadeFlowRuleApplicabilityDraft(
  id: string,
  requirementId: FacadeFlowRuleGateRequirementId,
): FacadeFlowRuleApplicabilityRecord {
  return {
    id,
    requirementId,
    productTargets: [],
    systemScopeMode: 'UNRESOLVED',
    systemScope: '',
    projectScopeMode: 'UNRESOLVED',
    projectScope: '',
    decision: 'UNRESOLVED',
    conditionSummary: '',
    sourceRecordIds: [],
    reviewer: '',
    reviewedAt: null,
    reviewStatus: 'NEEDS_REVIEW',
    reviewNote: '',
    simulationOnly: true,
    machineReady: false,
  }
}

export function facadeFlowRuleApplicabilityMissingFields(record: FacadeFlowRuleApplicabilityRecord): string[] {
  const missing: string[] = []
  if (record.productTargets.length === 0) missing.push('Тип изделие / продуктова цел')
  if (record.systemScopeMode === 'UNRESOLVED') missing.push('Обхват по система')
  if ((record.systemScopeMode === 'EXACT_SYSTEM' || record.systemScopeMode === 'SYSTEM_FAMILY') && !record.systemScope.trim()) missing.push('Система / семейство')
  if (record.projectScopeMode === 'UNRESOLVED') missing.push('Проектен обхват')
  if (record.projectScopeMode === 'STRUCTURED_POSITION' && !record.projectScope.trim()) missing.push('Проектна позиция')
  if (record.decision === 'UNRESOLVED') missing.push('Решение за приложимост')
  if (record.decision === 'CONDITIONAL' && !record.conditionSummary.trim()) missing.push('Условие за приложимост')
  if (record.sourceRecordIds.length === 0) missing.push('Потвърден източник')
  return missing
}

export function canHumanConfirmFacadeFlowRuleApplicability(
  record: FacadeFlowRuleApplicabilityRecord,
  reviewer: string,
  humanConfirmedSourceIds: string[],
): boolean {
  const sourcesConfirmed = record.sourceRecordIds.length > 0 && record.sourceRecordIds.every((id) => humanConfirmedSourceIds.includes(id))
  return facadeFlowRuleApplicabilityMissingFields(record).length === 0 && reviewer.trim().length > 0 && sourcesConfirmed
}

export function confirmFacadeFlowRuleApplicability(
  record: FacadeFlowRuleApplicabilityRecord,
  reviewer: string,
  reviewedAt: string,
  humanConfirmedSourceIds: string[],
  reviewNote = '',
): FacadeFlowRuleApplicabilityRecord {
  if (!canHumanConfirmFacadeFlowRuleApplicability(record, reviewer, humanConfirmedSourceIds) || !reviewedAt.trim()) return record
  return { ...record, reviewer: reviewer.trim(), reviewedAt, reviewStatus: 'HUMAN_CONFIRMED', reviewNote, machineReady: false }
}

export function updateFacadeFlowRuleApplicability(
  record: FacadeFlowRuleApplicabilityRecord,
  patch: Partial<Pick<FacadeFlowRuleApplicabilityRecord, 'productTargets' | 'systemScopeMode' | 'systemScope' | 'projectScopeMode' | 'projectScope' | 'decision' | 'conditionSummary' | 'sourceRecordIds' | 'reviewNote'>>,
): FacadeFlowRuleApplicabilityRecord {
  const next = { ...record, ...patch }
  if (record.reviewStatus !== 'HUMAN_CONFIRMED') return next
  const changed =
    (patch.productTargets !== undefined && JSON.stringify(patch.productTargets) !== JSON.stringify(record.productTargets)) ||
    (patch.systemScopeMode !== undefined && patch.systemScopeMode !== record.systemScopeMode) ||
    (patch.systemScope !== undefined && patch.systemScope !== record.systemScope) ||
    (patch.projectScopeMode !== undefined && patch.projectScopeMode !== record.projectScopeMode) ||
    (patch.projectScope !== undefined && patch.projectScope !== record.projectScope) ||
    (patch.decision !== undefined && patch.decision !== record.decision) ||
    (patch.conditionSummary !== undefined && patch.conditionSummary !== record.conditionSummary) ||
    (patch.sourceRecordIds !== undefined && JSON.stringify(patch.sourceRecordIds) !== JSON.stringify(record.sourceRecordIds))
  if (!changed) return next
  return { ...next, reviewer: '', reviewedAt: null, reviewStatus: 'NEEDS_REVIEW', machineReady: false }
}

const currentProductTarget = (session: FacadeFlowAiSession): FacadeFlowRuleApplicabilityProductTarget | null => {
  if (session.job.demoScenario === 'GUIDED_WINDOW') return session.job.guidedProduct.openingType === 'SLIDING' ? 'SLIDING_SYSTEM' : 'WINDOW'
  if (session.job.demoScenario === 'GUIDED_DOOR') return session.job.guidedProduct.openingType === 'SLIDING' ? 'SLIDING_SYSTEM' : 'DOOR'
  if (session.job.jobType === 'TECHNICAL_DETAIL') return 'TECHNICAL_DETAIL'
  return null
}

export function buildFacadeFlowRuleApplicabilityFoundation(session: FacadeFlowAiSession): FacadeFlowRuleApplicabilityFoundation | null {
  const gate = session.job.reviewPacket?.ruleGate
  if (!gate) return null
  const path = session.job.reviewPacket?.groupPath ?? []
  const projectScopeMode = path.length > 0 ? 'STRUCTURED_POSITION' : session.job.jobType === 'SINGLE_PRODUCT' ? 'SINGLE_PRODUCT' : 'UNRESOLVED'
  return {
    status: 'FOUNDATION_READY',
    currentProductTarget: currentProductTarget(session),
    currentSystemLabel: effectiveGuidedProfileSystem(session.job.guidedProduct).trim(),
    currentProjectScopeMode: projectScopeMode,
    currentProjectScopeLabel: path.length > 0 ? path.join(' → ') : projectScopeMode === 'SINGLE_PRODUCT' ? 'Единично изделие' : '',
    supportedProductTargets: [...RULE_APPLICABILITY_PRODUCT_TARGETS],
    rows: gate.requirements.map((item) => createFacadeFlowRuleApplicabilityDraft(`applicability-${item.id}`, item.id)),
    realApplicabilityDecisionCount: 0,
    humanConfirmedDecisionCount: 0,
    validated: false,
    simulationOnly: true,
    machineReady: false,
  }
}
