import type { CanonicalProfileRelationKnowledgeReadinessMatrix } from './aiCanonicalProfileRelationKnowledgeReadiness'
import type { CanonicalProfileSystemKnowledgeReadiness } from './aiCanonicalProfileSystemKnowledgeReadiness'
import type { CanonicalProfileSystemKnowledgeGate } from './aiCanonicalProfileSystemKnowledgeGate'

export const PROFILE_DATA_03_21_VERSION = 'PROFILE_DATA_03.21' as const

export type CanonicalProfileAiDecisionContextStatus =
  | 'BLOCKED_UPSTREAM'
  | 'STALE_REVIEW_REQUIRED'
  | 'HUMAN_EVIDENCE_REQUIRED_PRODUCTION_LOCKED'
  | 'KNOWLEDGE_CONTEXT_COMPLETE_PRODUCTION_LOCKED'

export interface CanonicalProfileAiKnownKnowledgeItem {
  relation: CanonicalProfileRelationKnowledgeReadinessMatrix['rows'][number]['relation']
  leftProfileCode: string
  rightProfileCode: string
  requirementKind: CanonicalProfileRelationKnowledgeReadinessMatrix['rows'][number]['requirements'][number]['requirementKind']
  state: CanonicalProfileRelationKnowledgeReadinessMatrix['rows'][number]['requirements'][number]['state']
  resolvedForKnowledgeReadiness: true
}

export interface CanonicalProfileAiUnknownKnowledgeItem {
  relation: CanonicalProfileRelationKnowledgeReadinessMatrix['rows'][number]['relation']
  leftProfileCode: string
  rightProfileCode: string
  requirementKind: CanonicalProfileRelationKnowledgeReadinessMatrix['rows'][number]['requirements'][number]['requirementKind']
  authorityNeeded: CanonicalProfileRelationKnowledgeReadinessMatrix['rows'][number]['requirements'][number]['authorityNeeded']
  state: CanonicalProfileRelationKnowledgeReadinessMatrix['rows'][number]['requirements'][number]['state']
  humanEvidenceRequired: true
  mayInferMissingValue: false
}

export interface CanonicalProfileAiDecisionContext {
  version: typeof PROFILE_DATA_03_21_VERSION
  sourceIntentId: string
  systemId: CanonicalProfileSystemKnowledgeReadiness['systemId']
  systemLabel: CanonicalProfileSystemKnowledgeReadiness['systemLabel']
  status: CanonicalProfileAiDecisionContextStatus
  knownItems: CanonicalProfileAiKnownKnowledgeItem[]
  unknownItems: CanonicalProfileAiUnknownKnowledgeItem[]
  humanEvidenceRequiredCount: number
  knowledgeCoveragePercent: number
  mayDescribeKnownKnowledge: boolean
  mayDescribeKnowledgeGaps: boolean
  mayRequestHumanEvidence: boolean
  mayInferMissingTechnicalData: false
  mayTransformUnknownIntoKnown: false
  manufacturerApproval: false
  exactJointGeometryVerified: false
  productionCompatibilityValidated: false
  automaticProfileSelectionAllowed: false
  automaticGeometryAllowed: false
  productionUnlockAllowed: false
  machineReady: false
  conflicts: string[]
}

const unique = (items: string[]) => [...new Set(items)]

export function buildCanonicalProfileAiDecisionContext(input: {
  relationMatrix: CanonicalProfileRelationKnowledgeReadinessMatrix
  systemReadiness: CanonicalProfileSystemKnowledgeReadiness
  gate: CanonicalProfileSystemKnowledgeGate
}): CanonicalProfileAiDecisionContext {
  const conflicts: string[] = []

  if (input.relationMatrix.sourceIntentId !== input.systemReadiness.sourceIntentId || input.systemReadiness.sourceIntentId !== input.gate.sourceIntentId) {
    conflicts.push('PROFILE DATA 03.21 sourceIntentId mismatch across relation matrix, system readiness, and system gate.')
  }
  if (input.relationMatrix.systemId !== input.systemReadiness.systemId || input.systemReadiness.systemId !== input.gate.systemId) {
    conflicts.push('PROFILE DATA 03.21 systemId mismatch across relation matrix, system readiness, and system gate.')
  }

  const knownItems: CanonicalProfileAiKnownKnowledgeItem[] = []
  const unknownItems: CanonicalProfileAiUnknownKnowledgeItem[] = []

  for (const relation of input.relationMatrix.rows) {
    for (const requirement of relation.requirements) {
      if (requirement.resolvedForKnowledgeReadiness) {
        knownItems.push({
          relation: relation.relation,
          leftProfileCode: relation.leftProfileCode,
          rightProfileCode: relation.rightProfileCode,
          requirementKind: requirement.requirementKind,
          state: requirement.state,
          resolvedForKnowledgeReadiness: true,
        })
      } else {
        unknownItems.push({
          relation: relation.relation,
          leftProfileCode: relation.leftProfileCode,
          rightProfileCode: relation.rightProfileCode,
          requirementKind: requirement.requirementKind,
          authorityNeeded: requirement.authorityNeeded,
          state: requirement.state,
          humanEvidenceRequired: true,
          mayInferMissingValue: false,
        })
      }
    }
  }

  let status: CanonicalProfileAiDecisionContextStatus
  if (conflicts.length || input.gate.status === 'BLOCKED_UPSTREAM') status = 'BLOCKED_UPSTREAM'
  else if (input.gate.status === 'STALE_REVIEW_REQUIRED') status = 'STALE_REVIEW_REQUIRED'
  else if (unknownItems.length) status = 'HUMAN_EVIDENCE_REQUIRED_PRODUCTION_LOCKED'
  else status = 'KNOWLEDGE_CONTEXT_COMPLETE_PRODUCTION_LOCKED'

  const diagnosticAllowed = status === 'HUMAN_EVIDENCE_REQUIRED_PRODUCTION_LOCKED'
    || status === 'KNOWLEDGE_CONTEXT_COMPLETE_PRODUCTION_LOCKED'

  return {
    version: PROFILE_DATA_03_21_VERSION,
    sourceIntentId: input.gate.sourceIntentId,
    systemId: input.gate.systemId,
    systemLabel: input.gate.systemLabel,
    status,
    knownItems,
    unknownItems,
    humanEvidenceRequiredCount: unknownItems.length,
    knowledgeCoveragePercent: input.gate.knowledgeCoveragePercent,
    mayDescribeKnownKnowledge: diagnosticAllowed && input.gate.aiMayDescribeKnownCoverage,
    mayDescribeKnowledgeGaps: diagnosticAllowed && input.gate.aiMayDescribeKnowledgeGaps,
    mayRequestHumanEvidence: status !== 'BLOCKED_UPSTREAM',
    mayInferMissingTechnicalData: false,
    mayTransformUnknownIntoKnown: false,
    manufacturerApproval: false,
    exactJointGeometryVerified: false,
    productionCompatibilityValidated: false,
    automaticProfileSelectionAllowed: false,
    automaticGeometryAllowed: false,
    productionUnlockAllowed: false,
    machineReady: false,
    conflicts: unique(conflicts),
  }
}

export const PROFILE_DATA_03_21_SAFETY = Object.freeze({
  aiDecisionContextOnly: true,
  mayInferMissingTechnicalData: false,
  mayTransformUnknownIntoKnown: false,
  manufacturerApproval: false,
  exactJointGeometryVerified: false,
  productionCompatibilityValidated: false,
  automaticProfileSelectionAllowed: false,
  automaticGeometryAllowed: false,
  productionUnlockAllowed: false,
  machineReady: false,
})
