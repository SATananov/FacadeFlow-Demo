import type { CanonicalProfileAiDecisionContext } from './aiCanonicalProfileAiDecisionContext'

export const PROFILE_DATA_03_22_VERSION = 'PROFILE_DATA_03.22' as const

export type CanonicalProfileAiClaimCategory =
  | 'KNOWN_KNOWLEDGE_COVERAGE'
  | 'KNOWLEDGE_GAP'
  | 'HUMAN_EVIDENCE_REQUEST'
  | 'MANUFACTURER_APPROVAL'
  | 'EXACT_JOINT_GEOMETRY'
  | 'PRODUCTION_COMPATIBILITY'
  | 'AUTOMATIC_PROFILE_SELECTION'
  | 'AUTOMATIC_GEOMETRY'
  | 'PRODUCTION_RULE_VALIDATION'
  | 'PRODUCTION_UNLOCK'
  | 'MACHINE_READY'

export interface CanonicalProfileAiClaimDecision {
  category: CanonicalProfileAiClaimCategory
  allowed: boolean
  reason: string
  productionLocked: true
}

export interface CanonicalProfileAiClaimBoundary {
  version: typeof PROFILE_DATA_03_22_VERSION
  sourceIntentId: string
  contextStatus: CanonicalProfileAiDecisionContext['status']
  mayStateKnownKnowledgeCoverage: boolean
  mayStateKnowledgeGap: boolean
  mayRequestHumanEvidence: boolean
  mustLabelUnknownAsUnknown: true
  mustNameRequiredAuthorityWhenAvailable: true
  mayInferMissingTechnicalData: false
  mayClaimManufacturerApproval: false
  mayClaimExactJointGeometry: false
  mayClaimProductionCompatibility: false
  mayClaimAutomaticProfileSelection: false
  mayClaimAutomaticGeometry: false
  mayClaimProductionRuleValidation: false
  mayClaimProductionUnlock: false
  mayClaimMachineReady: false
  productionLocked: true
}

export function buildCanonicalProfileAiClaimBoundary(
  context: CanonicalProfileAiDecisionContext,
): CanonicalProfileAiClaimBoundary {
  const currentDiagnostic = context.status === 'HUMAN_EVIDENCE_REQUIRED_PRODUCTION_LOCKED'
    || context.status === 'KNOWLEDGE_CONTEXT_COMPLETE_PRODUCTION_LOCKED'

  return {
    version: PROFILE_DATA_03_22_VERSION,
    sourceIntentId: context.sourceIntentId,
    contextStatus: context.status,
    mayStateKnownKnowledgeCoverage: currentDiagnostic && context.mayDescribeKnownKnowledge,
    mayStateKnowledgeGap: currentDiagnostic && context.mayDescribeKnowledgeGaps,
    mayRequestHumanEvidence: context.status !== 'BLOCKED_UPSTREAM' && context.mayRequestHumanEvidence,
    mustLabelUnknownAsUnknown: true,
    mustNameRequiredAuthorityWhenAvailable: true,
    mayInferMissingTechnicalData: false,
    mayClaimManufacturerApproval: false,
    mayClaimExactJointGeometry: false,
    mayClaimProductionCompatibility: false,
    mayClaimAutomaticProfileSelection: false,
    mayClaimAutomaticGeometry: false,
    mayClaimProductionRuleValidation: false,
    mayClaimProductionUnlock: false,
    mayClaimMachineReady: false,
    productionLocked: true,
  }
}

export function evaluateCanonicalProfileAiClaim(
  boundary: CanonicalProfileAiClaimBoundary,
  category: CanonicalProfileAiClaimCategory,
): CanonicalProfileAiClaimDecision {
  switch (category) {
    case 'KNOWN_KNOWLEDGE_COVERAGE':
      return {
        category,
        allowed: boundary.mayStateKnownKnowledgeCoverage,
        reason: boundary.mayStateKnownKnowledgeCoverage
          ? 'Current reviewed knowledge coverage may be described as knowledge-only context.'
          : 'Known-coverage claims are blocked because the knowledge context is blocked or stale.',
        productionLocked: true,
      }
    case 'KNOWLEDGE_GAP':
      return {
        category,
        allowed: boundary.mayStateKnowledgeGap,
        reason: boundary.mayStateKnowledgeGap
          ? 'Current unresolved knowledge gaps may be stated explicitly.'
          : 'Gap diagnostics are blocked because the knowledge context is blocked or stale.',
        productionLocked: true,
      }
    case 'HUMAN_EVIDENCE_REQUEST':
      return {
        category,
        allowed: boundary.mayRequestHumanEvidence,
        reason: boundary.mayRequestHumanEvidence
          ? 'The AI may request human evidence or review for unresolved/stale knowledge.'
          : 'Human-evidence requests are blocked by an upstream context conflict.',
        productionLocked: true,
      }
    default:
      return {
        category,
        allowed: false,
        reason: 'PROFILE DATA 03.22 forbids production, geometry, manufacturer-approval, and machine-ready claims.',
        productionLocked: true,
      }
  }
}

export const PROFILE_DATA_03_22_SAFETY = Object.freeze({
  mustLabelUnknownAsUnknown: true,
  mayInferMissingTechnicalData: false,
  mayClaimManufacturerApproval: false,
  mayClaimExactJointGeometry: false,
  mayClaimProductionCompatibility: false,
  mayClaimAutomaticProfileSelection: false,
  mayClaimAutomaticGeometry: false,
  mayClaimProductionRuleValidation: false,
  mayClaimProductionUnlock: false,
  mayClaimMachineReady: false,
})
