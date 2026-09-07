import type { CanonicalProfileSystemKnowledgeReadiness } from './aiCanonicalProfileSystemKnowledgeReadiness'

export const PROFILE_DATA_03_20_VERSION = 'PROFILE_DATA_03.20' as const

export type CanonicalProfileSystemKnowledgeGateStatus =
  | 'BLOCKED_UPSTREAM'
  | 'STALE_REVIEW_REQUIRED'
  | 'KNOWLEDGE_GAPS_REMAIN_PRODUCTION_LOCKED'
  | 'KNOWLEDGE_COVERAGE_COMPLETE_PRODUCTION_LOCKED'

export interface CanonicalProfileSystemKnowledgeGate {
  version: typeof PROFILE_DATA_03_20_VERSION
  sourceIntentId: string
  systemId: CanonicalProfileSystemKnowledgeReadiness['systemId']
  systemLabel: CanonicalProfileSystemKnowledgeReadiness['systemLabel']
  status: CanonicalProfileSystemKnowledgeGateStatus
  knowledgeCoveragePercent: number
  totalKnowledgeRequirementCount: number
  resolvedKnowledgeRequirementCount: number
  unresolvedKnowledgeRequirementCount: number
  allRelationKnowledgeComplete: boolean
  aiKnowledgeDiagnosticAllowed: boolean
  aiMayDescribeKnownCoverage: boolean
  aiMayDescribeKnowledgeGaps: boolean
  aiMayClaimManufacturerApproval: false
  aiMayClaimExactJointGeometry: false
  aiMayClaimProductionCompatibility: false
  automaticProfileSelectionAllowed: false
  automaticGeometryAllowed: false
  productionRulesValidated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

export function buildCanonicalProfileSystemKnowledgeGate(
  systemReadiness: CanonicalProfileSystemKnowledgeReadiness,
): CanonicalProfileSystemKnowledgeGate {
  let status: CanonicalProfileSystemKnowledgeGateStatus
  if (systemReadiness.status === 'BLOCKED_UPSTREAM') status = 'BLOCKED_UPSTREAM'
  else if (systemReadiness.status === 'STALE_REVIEW_REQUIRED') status = 'STALE_REVIEW_REQUIRED'
  else if (systemReadiness.allRelationKnowledgeComplete) status = 'KNOWLEDGE_COVERAGE_COMPLETE_PRODUCTION_LOCKED'
  else status = 'KNOWLEDGE_GAPS_REMAIN_PRODUCTION_LOCKED'

  const diagnosticAllowed = status === 'KNOWLEDGE_GAPS_REMAIN_PRODUCTION_LOCKED'
    || status === 'KNOWLEDGE_COVERAGE_COMPLETE_PRODUCTION_LOCKED'

  return {
    version: PROFILE_DATA_03_20_VERSION,
    sourceIntentId: systemReadiness.sourceIntentId,
    systemId: systemReadiness.systemId,
    systemLabel: systemReadiness.systemLabel,
    status,
    knowledgeCoveragePercent: systemReadiness.knowledgeCoveragePercent,
    totalKnowledgeRequirementCount: systemReadiness.totalKnowledgeRequirementCount,
    resolvedKnowledgeRequirementCount: systemReadiness.resolvedKnowledgeRequirementCount,
    unresolvedKnowledgeRequirementCount: systemReadiness.unresolvedKnowledgeRequirementCount,
    allRelationKnowledgeComplete: systemReadiness.allRelationKnowledgeComplete,
    aiKnowledgeDiagnosticAllowed: diagnosticAllowed,
    aiMayDescribeKnownCoverage: diagnosticAllowed,
    aiMayDescribeKnowledgeGaps: diagnosticAllowed,
    aiMayClaimManufacturerApproval: false,
    aiMayClaimExactJointGeometry: false,
    aiMayClaimProductionCompatibility: false,
    automaticProfileSelectionAllowed: false,
    automaticGeometryAllowed: false,
    productionRulesValidated: false,
    productionUnlockAllowed: false,
    machineReady: false,
    productionApproved: false,
  }
}

export const PROFILE_DATA_03_20_SAFETY = Object.freeze({
  aiKnowledgeDiagnosticOnly: true,
  aiMayClaimManufacturerApproval: false,
  aiMayClaimExactJointGeometry: false,
  aiMayClaimProductionCompatibility: false,
  automaticProfileSelectionAllowed: false,
  automaticGeometryAllowed: false,
  productionRulesValidated: false,
  productionUnlockAllowed: false,
  machineReady: false,
  productionApproved: false,
})
