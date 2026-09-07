import type { CanonicalProfileAssemblyEvidenceReadiness } from './aiCanonicalProfileAssemblyEvidenceReadiness'
import type { CanonicalProfileEvidenceResolutionAggregation } from './aiCanonicalProfileEvidenceResolutionAggregation'
import type { CanonicalProfileKnowledgeReadinessSummary } from './aiCanonicalProfileKnowledgeReadinessSummary'
import { PRELUDE_60_SYSTEM_ID, PRELUDE_60_SYSTEM_LABEL } from './profileData/prelude60BaseProfiles'

export const PROFILE_DATA_03_18_VERSION = 'PROFILE_DATA_03.18' as const

export type CanonicalProfileRelationKnowledgeReadinessState =
  | 'BLOCKED_UPSTREAM'
  | 'STALE_REVIEW_REQUIRED'
  | 'RELATION_KNOWLEDGE_INCOMPLETE'
  | 'RELATION_KNOWLEDGE_PARTIAL_PRODUCTION_LOCKED'
  | 'RELATION_KNOWLEDGE_REQUIREMENTS_COMPLETE_PRODUCTION_LOCKED'

export interface CanonicalProfileRelationKnowledgeRequirementState {
  requirementKind: CanonicalProfileEvidenceResolutionAggregation['rows'][number]['requirementKind']
  authorityNeeded: CanonicalProfileEvidenceResolutionAggregation['rows'][number]['authorityNeeded']
  state: CanonicalProfileEvidenceResolutionAggregation['rows'][number]['state']
  resolvedForKnowledgeReadiness: boolean
}

export interface CanonicalProfileRelationKnowledgeReadinessRow {
  relation: CanonicalProfileAssemblyEvidenceReadiness['rows'][number]['relation']
  systemId: typeof PRELUDE_60_SYSTEM_ID
  systemLabel: typeof PRELUDE_60_SYSTEM_LABEL
  leftRole: CanonicalProfileAssemblyEvidenceReadiness['rows'][number]['leftRole']
  leftProfileCode: string
  rightRole: CanonicalProfileAssemblyEvidenceReadiness['rows'][number]['rightRole']
  rightProfileCode: string
  requirements: CanonicalProfileRelationKnowledgeRequirementState[]
  totalRequirementCount: number
  resolvedRequirementCount: number
  unresolvedRequirementCount: number
  knowledgeCoveragePercent: number
  state: CanonicalProfileRelationKnowledgeReadinessState
  knowledgeOnly: true
  manufacturerApproval: false
  exactJointGeometryVerified: false
  productionCompatibilityValidated: false
  automaticProfileSelectionAllowed: false
  automaticGeometryAllowed: false
  productionUnlockAllowed: false
  machineReady: false
}

export interface CanonicalProfileRelationKnowledgeReadinessMatrix {
  version: typeof PROFILE_DATA_03_18_VERSION
  sourceIntentId: string
  systemId: typeof PRELUDE_60_SYSTEM_ID
  systemLabel: typeof PRELUDE_60_SYSTEM_LABEL
  status: CanonicalProfileRelationKnowledgeReadinessState | 'RELATION_KNOWLEDGE_MIXED_PRODUCTION_LOCKED'
  rows: CanonicalProfileRelationKnowledgeReadinessRow[]
  conflicts: string[]
  warnings: string[]
  relationCount: number
  completeRelationCount: number
  partialRelationCount: number
  incompleteRelationCount: number
  staleRelationCount: number
  knowledgeOnly: true
  sourceReadinessMutated: false
  manufacturerApproval: false
  exactJointGeometryVerified: false
  productionCompatibilityValidated: false
  automaticProfileSelectionAllowed: false
  automaticGeometryAllowed: false
  productionUnlockAllowed: false
  machineReady: false
}

const unique = (items: string[]) => [...new Set(items)]

export function buildCanonicalProfileRelationKnowledgeReadiness(input: {
  readiness: CanonicalProfileAssemblyEvidenceReadiness
  aggregation: CanonicalProfileEvidenceResolutionAggregation
  summary: CanonicalProfileKnowledgeReadinessSummary
}): CanonicalProfileRelationKnowledgeReadinessMatrix {
  const conflicts: string[] = []
  const warnings = [...input.readiness.warnings]

  if (input.readiness.sourceIntentId !== input.aggregation.sourceIntentId || input.aggregation.sourceIntentId !== input.summary.sourceIntentId) {
    conflicts.push('PROFILE DATA 03.18 sourceIntentId mismatch across readiness, aggregation, and summary.')
  }

  const rows = input.readiness.rows.map((readinessRow) => {
    const aggregationRows = input.aggregation.rows.filter((row) => row.relation === readinessRow.relation)
    const summaryRow = input.summary.relations.find((row) => row.relation === readinessRow.relation)
    if (!summaryRow) conflicts.push(`${readinessRow.relation} is missing from PROFILE DATA 03.17 relation summary.`)
    if (aggregationRows.length !== readinessRow.requirements.length) {
      conflicts.push(`${readinessRow.relation} requirement count mismatch between PROFILE DATA 03.9 and 03.16.`)
    }

    const requirements = aggregationRows.map((row) => ({
      requirementKind: row.requirementKind,
      authorityNeeded: row.authorityNeeded,
      state: row.state,
      resolvedForKnowledgeReadiness: row.resolvedForKnowledgeReadiness,
    }))
    const totalRequirementCount = requirements.length
    const resolvedRequirementCount = requirements.filter((row) => row.resolvedForKnowledgeReadiness).length
    const unresolvedRequirementCount = totalRequirementCount - resolvedRequirementCount
    const knowledgeCoveragePercent = totalRequirementCount === 0 ? 0 : Math.round((resolvedRequirementCount / totalRequirementCount) * 100)
    const stale = requirements.some((row) => row.state === 'STALE_REVIEW_REQUIRED')

    let state: CanonicalProfileRelationKnowledgeReadinessState
    if (input.summary.status === 'BLOCKED_UPSTREAM' || input.aggregation.status === 'BLOCKED_UPSTREAM' || conflicts.length) {
      state = 'BLOCKED_UPSTREAM'
    } else if (input.summary.status === 'STALE_REVIEW_REQUIRED' || input.aggregation.status === 'STALE_REVIEW_REQUIRED' || stale) {
      state = 'STALE_REVIEW_REQUIRED'
    } else if (resolvedRequirementCount === 0) {
      state = 'RELATION_KNOWLEDGE_INCOMPLETE'
    } else if (resolvedRequirementCount < totalRequirementCount) {
      state = 'RELATION_KNOWLEDGE_PARTIAL_PRODUCTION_LOCKED'
    } else {
      state = 'RELATION_KNOWLEDGE_REQUIREMENTS_COMPLETE_PRODUCTION_LOCKED'
    }

    return {
      relation: readinessRow.relation,
      systemId: PRELUDE_60_SYSTEM_ID,
      systemLabel: PRELUDE_60_SYSTEM_LABEL,
      leftRole: readinessRow.leftRole,
      leftProfileCode: readinessRow.leftProfileCode,
      rightRole: readinessRow.rightRole,
      rightProfileCode: readinessRow.rightProfileCode,
      requirements,
      totalRequirementCount,
      resolvedRequirementCount,
      unresolvedRequirementCount,
      knowledgeCoveragePercent,
      state,
      knowledgeOnly: true as const,
      manufacturerApproval: false as const,
      exactJointGeometryVerified: false as const,
      productionCompatibilityValidated: false as const,
      automaticProfileSelectionAllowed: false as const,
      automaticGeometryAllowed: false as const,
      productionUnlockAllowed: false as const,
      machineReady: false as const,
    }
  })

  const completeRelationCount = rows.filter((row) => row.state === 'RELATION_KNOWLEDGE_REQUIREMENTS_COMPLETE_PRODUCTION_LOCKED').length
  const partialRelationCount = rows.filter((row) => row.state === 'RELATION_KNOWLEDGE_PARTIAL_PRODUCTION_LOCKED').length
  const incompleteRelationCount = rows.filter((row) => row.state === 'RELATION_KNOWLEDGE_INCOMPLETE').length
  const staleRelationCount = rows.filter((row) => row.state === 'STALE_REVIEW_REQUIRED').length

  let status: CanonicalProfileRelationKnowledgeReadinessMatrix['status']
  if (conflicts.length || rows.some((row) => row.state === 'BLOCKED_UPSTREAM')) status = 'BLOCKED_UPSTREAM'
  else if (staleRelationCount) status = 'STALE_REVIEW_REQUIRED'
  else if (completeRelationCount === rows.length && rows.length > 0) status = 'RELATION_KNOWLEDGE_REQUIREMENTS_COMPLETE_PRODUCTION_LOCKED'
  else if (partialRelationCount || completeRelationCount) status = 'RELATION_KNOWLEDGE_MIXED_PRODUCTION_LOCKED'
  else status = 'RELATION_KNOWLEDGE_INCOMPLETE'

  return {
    version: PROFILE_DATA_03_18_VERSION,
    sourceIntentId: input.readiness.sourceIntentId,
    systemId: PRELUDE_60_SYSTEM_ID,
    systemLabel: PRELUDE_60_SYSTEM_LABEL,
    status,
    rows,
    conflicts: unique(conflicts),
    warnings: unique(warnings),
    relationCount: rows.length,
    completeRelationCount,
    partialRelationCount,
    incompleteRelationCount,
    staleRelationCount,
    knowledgeOnly: true,
    sourceReadinessMutated: false,
    manufacturerApproval: false,
    exactJointGeometryVerified: false,
    productionCompatibilityValidated: false,
    automaticProfileSelectionAllowed: false,
    automaticGeometryAllowed: false,
    productionUnlockAllowed: false,
    machineReady: false,
  }
}

export const PROFILE_DATA_03_18_SAFETY = Object.freeze({
  knowledgeOnly: true,
  sourceReadinessMutated: false,
  manufacturerApproval: false,
  exactJointGeometryVerified: false,
  productionCompatibilityValidated: false,
  automaticProfileSelectionAllowed: false,
  automaticGeometryAllowed: false,
  productionUnlockAllowed: false,
  machineReady: false,
})
