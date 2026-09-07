import type { CanonicalProfileAssemblyEvidenceRequirementKind } from './aiCanonicalProfileAssemblyEvidenceReadiness'
import type { CanonicalProfileRelationKnowledgeReadinessMatrix } from './aiCanonicalProfileRelationKnowledgeReadiness'

export const PROFILE_DATA_03_19_VERSION = 'PROFILE_DATA_03.19' as const

export type CanonicalProfileSystemKnowledgeReadinessStatus =
  | 'BLOCKED_UPSTREAM'
  | 'STALE_REVIEW_REQUIRED'
  | 'SYSTEM_KNOWLEDGE_INCOMPLETE'
  | 'SYSTEM_KNOWLEDGE_PARTIAL_PRODUCTION_LOCKED'
  | 'SYSTEM_KNOWLEDGE_REQUIREMENTS_COMPLETE_PRODUCTION_LOCKED'

export interface CanonicalProfileSystemRequirementGapSummary {
  requirementKind: CanonicalProfileAssemblyEvidenceRequirementKind
  totalCount: number
  resolvedCount: number
  unresolvedCount: number
}

export interface CanonicalProfileSystemKnowledgeReadiness {
  version: typeof PROFILE_DATA_03_19_VERSION
  sourceIntentId: string
  systemId: CanonicalProfileRelationKnowledgeReadinessMatrix['systemId']
  systemLabel: CanonicalProfileRelationKnowledgeReadinessMatrix['systemLabel']
  status: CanonicalProfileSystemKnowledgeReadinessStatus
  relationCount: number
  completeRelationCount: number
  partialRelationCount: number
  incompleteRelationCount: number
  staleRelationCount: number
  totalKnowledgeRequirementCount: number
  resolvedKnowledgeRequirementCount: number
  unresolvedKnowledgeRequirementCount: number
  knowledgeCoveragePercent: number
  unresolvedByRequirementKind: CanonicalProfileSystemRequirementGapSummary[]
  allRelationKnowledgeComplete: boolean
  knowledgeDiagnosticAvailable: boolean
  knowledgeOnly: true
  manufacturerApproval: false
  verifiedAssemblyNodeEvidenceComplete: false
  exactJointGeometryVerified: false
  productionCompatibilityValidated: false
  rulesValidated: false
  automaticProfileSelectionAllowed: false
  automaticGeometryAllowed: false
  productionUnlockAllowed: false
  machineReady: false
}

const requirementOrder: readonly CanonicalProfileAssemblyEvidenceRequirementKind[] = [
  'HUMAN_WORKING_RELATION_EVIDENCE',
  'MANUFACTURER_PAIR_RELATION_EVIDENCE',
  'VERIFIED_ASSEMBLY_NODE_EVIDENCE',
  'EXACT_JOINT_DOCUMENTATION',
]

export function buildCanonicalProfileSystemKnowledgeReadiness(
  matrix: CanonicalProfileRelationKnowledgeReadinessMatrix,
): CanonicalProfileSystemKnowledgeReadiness {
  const allRequirements = matrix.rows.flatMap((row) => row.requirements)
  const totalKnowledgeRequirementCount = allRequirements.length
  const resolvedKnowledgeRequirementCount = allRequirements.filter((row) => row.resolvedForKnowledgeReadiness).length
  const unresolvedKnowledgeRequirementCount = totalKnowledgeRequirementCount - resolvedKnowledgeRequirementCount
  const knowledgeCoveragePercent = totalKnowledgeRequirementCount === 0
    ? 0
    : Math.round((resolvedKnowledgeRequirementCount / totalKnowledgeRequirementCount) * 100)
  const allRelationKnowledgeComplete = matrix.relationCount > 0 && matrix.completeRelationCount === matrix.relationCount

  const unresolvedByRequirementKind = requirementOrder.map((requirementKind) => {
    const rows = allRequirements.filter((row) => row.requirementKind === requirementKind)
    const resolvedCount = rows.filter((row) => row.resolvedForKnowledgeReadiness).length
    return {
      requirementKind,
      totalCount: rows.length,
      resolvedCount,
      unresolvedCount: rows.length - resolvedCount,
    }
  }).filter((row) => row.totalCount > 0)

  let status: CanonicalProfileSystemKnowledgeReadinessStatus
  if (matrix.status === 'BLOCKED_UPSTREAM' || matrix.conflicts.length) status = 'BLOCKED_UPSTREAM'
  else if (matrix.status === 'STALE_REVIEW_REQUIRED' || matrix.staleRelationCount) status = 'STALE_REVIEW_REQUIRED'
  else if (resolvedKnowledgeRequirementCount === 0) status = 'SYSTEM_KNOWLEDGE_INCOMPLETE'
  else if (!allRelationKnowledgeComplete) status = 'SYSTEM_KNOWLEDGE_PARTIAL_PRODUCTION_LOCKED'
  else status = 'SYSTEM_KNOWLEDGE_REQUIREMENTS_COMPLETE_PRODUCTION_LOCKED'

  return {
    version: PROFILE_DATA_03_19_VERSION,
    sourceIntentId: matrix.sourceIntentId,
    systemId: matrix.systemId,
    systemLabel: matrix.systemLabel,
    status,
    relationCount: matrix.relationCount,
    completeRelationCount: matrix.completeRelationCount,
    partialRelationCount: matrix.partialRelationCount,
    incompleteRelationCount: matrix.incompleteRelationCount,
    staleRelationCount: matrix.staleRelationCount,
    totalKnowledgeRequirementCount,
    resolvedKnowledgeRequirementCount,
    unresolvedKnowledgeRequirementCount,
    knowledgeCoveragePercent,
    unresolvedByRequirementKind,
    allRelationKnowledgeComplete,
    knowledgeDiagnosticAvailable: status !== 'BLOCKED_UPSTREAM' && status !== 'STALE_REVIEW_REQUIRED',
    knowledgeOnly: true,
    manufacturerApproval: false,
    verifiedAssemblyNodeEvidenceComplete: false,
    exactJointGeometryVerified: false,
    productionCompatibilityValidated: false,
    rulesValidated: false,
    automaticProfileSelectionAllowed: false,
    automaticGeometryAllowed: false,
    productionUnlockAllowed: false,
    machineReady: false,
  }
}

export const PROFILE_DATA_03_19_SAFETY = Object.freeze({
  knowledgeOnly: true,
  manufacturerApproval: false,
  verifiedAssemblyNodeEvidenceComplete: false,
  exactJointGeometryVerified: false,
  productionCompatibilityValidated: false,
  rulesValidated: false,
  automaticProfileSelectionAllowed: false,
  automaticGeometryAllowed: false,
  productionUnlockAllowed: false,
  machineReady: false,
})
