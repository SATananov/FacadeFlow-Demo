import type { CanonicalProfileEvidenceResolutionAggregation } from './aiCanonicalProfileEvidenceResolutionAggregation'

export const PROFILE_DATA_03_17_VERSION = 'PROFILE_DATA_03.17' as const

export type CanonicalProfileKnowledgeReadinessRelationState =
  | 'NO_KNOWLEDGE_COVERAGE'
  | 'PARTIAL_KNOWLEDGE_COVERAGE_PRODUCTION_LOCKED'
  | 'KNOWLEDGE_REQUIREMENTS_COMPLETE_PRODUCTION_LOCKED'

export type CanonicalProfileKnowledgeReadinessStatus =
  | 'BLOCKED_UPSTREAM'
  | 'STALE_REVIEW_REQUIRED'
  | 'PROFILE_KNOWLEDGE_INCOMPLETE'
  | 'PROFILE_KNOWLEDGE_PARTIAL_PRODUCTION_LOCKED'
  | 'PROFILE_KNOWLEDGE_REQUIREMENTS_COMPLETE_PRODUCTION_LOCKED'

export interface CanonicalProfileKnowledgeReadinessRelationSummary {
  relation: CanonicalProfileEvidenceResolutionAggregation['rows'][number]['relation']
  totalRequirementCount: number
  resolvedRequirementCount: number
  unresolvedRequirementCount: number
  knowledgeCoveragePercent: number
  state: CanonicalProfileKnowledgeReadinessRelationState
}

export interface CanonicalProfileKnowledgeReadinessSummary {
  version: typeof PROFILE_DATA_03_17_VERSION
  sourceIntentId: string
  status: CanonicalProfileKnowledgeReadinessStatus
  relations: CanonicalProfileKnowledgeReadinessRelationSummary[]
  totalKnowledgeRequirementCount: number
  resolvedKnowledgeRequirementCount: number
  unresolvedKnowledgeRequirementCount: number
  knowledgeCoveragePercent: number
  knowledgeRequirementCoverageComplete: boolean
  knowledgeOnly: true
  manufacturerApproval: false
  verifiedAssemblyNodeEvidenceComplete: false
  exactJointGeometryVerified: false
  productionCompatibilityValidated: false
  productionRulesValidated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

export function buildCanonicalProfileKnowledgeReadinessSummary(
  aggregation: CanonicalProfileEvidenceResolutionAggregation,
): CanonicalProfileKnowledgeReadinessSummary {
  const relationOrder = [...new Set(aggregation.rows.map((row) => row.relation))]
  const relations = relationOrder.map((relation) => {
    const rows = aggregation.rows.filter((row) => row.relation === relation)
    const totalRequirementCount = rows.length
    const resolvedRequirementCount = rows.filter((row) => row.resolvedForKnowledgeReadiness).length
    const unresolvedRequirementCount = totalRequirementCount - resolvedRequirementCount
    const knowledgeCoveragePercent = totalRequirementCount === 0
      ? 0
      : Math.round((resolvedRequirementCount / totalRequirementCount) * 100)
    let state: CanonicalProfileKnowledgeReadinessRelationState
    if (resolvedRequirementCount === 0) state = 'NO_KNOWLEDGE_COVERAGE'
    else if (resolvedRequirementCount < totalRequirementCount) state = 'PARTIAL_KNOWLEDGE_COVERAGE_PRODUCTION_LOCKED'
    else state = 'KNOWLEDGE_REQUIREMENTS_COMPLETE_PRODUCTION_LOCKED'
    return {
      relation,
      totalRequirementCount,
      resolvedRequirementCount,
      unresolvedRequirementCount,
      knowledgeCoveragePercent,
      state,
    }
  })

  const knowledgeRequirementCoverageComplete = aggregation.totalKnowledgeRequirementCount > 0
    && aggregation.unresolvedKnowledgeRequirementCount === 0

  let status: CanonicalProfileKnowledgeReadinessStatus
  if (aggregation.status === 'BLOCKED_UPSTREAM') status = 'BLOCKED_UPSTREAM'
  else if (aggregation.status === 'STALE_REVIEW_REQUIRED') status = 'STALE_REVIEW_REQUIRED'
  else if (aggregation.resolvedKnowledgeRequirementCount === 0) status = 'PROFILE_KNOWLEDGE_INCOMPLETE'
  else if (!knowledgeRequirementCoverageComplete) status = 'PROFILE_KNOWLEDGE_PARTIAL_PRODUCTION_LOCKED'
  else status = 'PROFILE_KNOWLEDGE_REQUIREMENTS_COMPLETE_PRODUCTION_LOCKED'

  return {
    version: PROFILE_DATA_03_17_VERSION,
    sourceIntentId: aggregation.sourceIntentId,
    status,
    relations,
    totalKnowledgeRequirementCount: aggregation.totalKnowledgeRequirementCount,
    resolvedKnowledgeRequirementCount: aggregation.resolvedKnowledgeRequirementCount,
    unresolvedKnowledgeRequirementCount: aggregation.unresolvedKnowledgeRequirementCount,
    knowledgeCoveragePercent: aggregation.knowledgeCoveragePercent,
    knowledgeRequirementCoverageComplete,
    knowledgeOnly: true,
    manufacturerApproval: false,
    verifiedAssemblyNodeEvidenceComplete: false,
    exactJointGeometryVerified: false,
    productionCompatibilityValidated: false,
    productionRulesValidated: false,
    productionUnlockAllowed: false,
    machineReady: false,
    productionApproved: false,
  }
}

export const PROFILE_DATA_03_17_SAFETY = Object.freeze({
  knowledgeOnly: true,
  manufacturerApproval: false,
  verifiedAssemblyNodeEvidenceComplete: false,
  exactJointGeometryVerified: false,
  productionCompatibilityValidated: false,
  productionRulesValidated: false,
  productionUnlockAllowed: false,
  machineReady: false,
  productionApproved: false,
})
