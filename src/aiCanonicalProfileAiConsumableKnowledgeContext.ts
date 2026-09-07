import type { CanonicalProfileAiDecisionContext } from './aiCanonicalProfileAiDecisionContext'
import type { CanonicalProfileAiClaimBoundary } from './aiCanonicalProfileAiClaimBoundary'

export const PROFILE_DATA_03_23_VERSION = 'PROFILE_DATA_03.23' as const

export type CanonicalProfileAiConsumableKnowledgeContextStatus =
  | 'BLOCKED_UPSTREAM'
  | 'STALE_HUMAN_REVIEW_REQUIRED'
  | 'AI_CONTEXT_READY_WITH_GAPS_PRODUCTION_LOCKED'
  | 'AI_CONTEXT_READY_COMPLETE_PRODUCTION_LOCKED'

export interface CanonicalProfileAiHumanEvidenceRequest {
  relation: CanonicalProfileAiDecisionContext['unknownItems'][number]['relation']
  requirementKind: CanonicalProfileAiDecisionContext['unknownItems'][number]['requirementKind']
  authorityNeeded: CanonicalProfileAiDecisionContext['unknownItems'][number]['authorityNeeded']
  reason: string
}

export interface CanonicalProfileAiConsumableKnowledgeContext {
  version: typeof PROFILE_DATA_03_23_VERSION
  sourceIntentId: string
  systemId: CanonicalProfileAiDecisionContext['systemId']
  systemLabel: CanonicalProfileAiDecisionContext['systemLabel']
  status: CanonicalProfileAiConsumableKnowledgeContextStatus
  knowledgeCoveragePercent: number
  known: CanonicalProfileAiDecisionContext['knownItems']
  unknown: CanonicalProfileAiDecisionContext['unknownItems']
  humanEvidenceRequests: CanonicalProfileAiHumanEvidenceRequest[]
  responsePolicy: {
    maySayWhatIsKnown: boolean
    maySayWhatIsUnknown: boolean
    mayAskForHumanEvidence: boolean
    mustKeepUnknownExplicit: true
    mayGuessMissingTechnicalData: false
    mayPromoteKnowledgeToProductionFact: false
  }
  hardSafetyLocks: {
    manufacturerApproval: false
    exactJointGeometryVerified: false
    productionCompatibilityValidated: false
    automaticProfileSelectionAllowed: false
    automaticGeometryAllowed: false
    productionRulesValidated: false
    productionUnlockAllowed: false
    machineReady: false
  }
  aiInstruction: string
}

export function buildCanonicalProfileAiConsumableKnowledgeContext(input: {
  context: CanonicalProfileAiDecisionContext
  boundary: CanonicalProfileAiClaimBoundary
}): CanonicalProfileAiConsumableKnowledgeContext {
  let status: CanonicalProfileAiConsumableKnowledgeContextStatus
  if (input.context.status === 'BLOCKED_UPSTREAM') status = 'BLOCKED_UPSTREAM'
  else if (input.context.status === 'STALE_REVIEW_REQUIRED') status = 'STALE_HUMAN_REVIEW_REQUIRED'
  else if (input.context.unknownItems.length) status = 'AI_CONTEXT_READY_WITH_GAPS_PRODUCTION_LOCKED'
  else status = 'AI_CONTEXT_READY_COMPLETE_PRODUCTION_LOCKED'

  const humanEvidenceRequests = input.context.unknownItems.map((item) => ({
    relation: item.relation,
    requirementKind: item.requirementKind,
    authorityNeeded: item.authorityNeeded,
    reason: `${item.requirementKind} for ${item.relation} is unresolved. Human evidence/review from ${item.authorityNeeded} is required before it can become known for knowledge readiness.`,
  }))

  const aiInstruction = status === 'BLOCKED_UPSTREAM'
    ? 'Do not use this profile knowledge context for technical claims. Report the upstream conflict and request human correction.'
    : status === 'STALE_HUMAN_REVIEW_REQUIRED'
      ? 'Treat reviewed profile knowledge as stale. Do not restate it as current; request renewed human review/evidence.'
      : 'State only reviewed knowledge that appears in known[]. State every missing item in unknown[] as unknown. Request the listed human evidence where needed. Never guess missing technical data and never convert knowledge coverage into manufacturer approval, exact geometry, production compatibility, automatic geometry, production unlock, or machine-ready status.'

  return {
    version: PROFILE_DATA_03_23_VERSION,
    sourceIntentId: input.context.sourceIntentId,
    systemId: input.context.systemId,
    systemLabel: input.context.systemLabel,
    status,
    knowledgeCoveragePercent: input.context.knowledgeCoveragePercent,
    known: input.context.knownItems,
    unknown: input.context.unknownItems,
    humanEvidenceRequests,
    responsePolicy: {
      maySayWhatIsKnown: input.boundary.mayStateKnownKnowledgeCoverage,
      maySayWhatIsUnknown: input.boundary.mayStateKnowledgeGap,
      mayAskForHumanEvidence: input.boundary.mayRequestHumanEvidence,
      mustKeepUnknownExplicit: true,
      mayGuessMissingTechnicalData: false,
      mayPromoteKnowledgeToProductionFact: false,
    },
    hardSafetyLocks: {
      manufacturerApproval: false,
      exactJointGeometryVerified: false,
      productionCompatibilityValidated: false,
      automaticProfileSelectionAllowed: false,
      automaticGeometryAllowed: false,
      productionRulesValidated: false,
      productionUnlockAllowed: false,
      machineReady: false,
    },
    aiInstruction,
  }
}

export const PROFILE_DATA_03_23_SAFETY = Object.freeze({
  aiConsumableKnowledgeContextOnly: true,
  unknownMustRemainExplicit: true,
  mayGuessMissingTechnicalData: false,
  mayPromoteKnowledgeToProductionFact: false,
  manufacturerApproval: false,
  exactJointGeometryVerified: false,
  productionCompatibilityValidated: false,
  automaticProfileSelectionAllowed: false,
  automaticGeometryAllowed: false,
  productionRulesValidated: false,
  productionUnlockAllowed: false,
  machineReady: false,
})
