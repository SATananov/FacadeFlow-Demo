import type { CanonicalProfileAiConsumableKnowledgeContext } from './aiCanonicalProfileAiConsumableKnowledgeContext'
import type { CanonicalProfileHumanEvidenceRequestQueue } from './aiCanonicalProfileHumanEvidenceRequestQueue'

export const PROFILE_DATA_03_26_VERSION = 'PROFILE_DATA_03.26' as const

export type CanonicalProfileSafeResponseStatus =
  | 'BLOCKED_UPSTREAM'
  | 'STALE_REVIEW_RESPONSE_READY_PRODUCTION_LOCKED'
  | 'KNOWLEDGE_GAP_RESPONSE_READY_PRODUCTION_LOCKED'
  | 'KNOWLEDGE_COMPLETE_RESPONSE_READY_PRODUCTION_LOCKED'

export interface CanonicalProfileSafeAiResponse {
  version: typeof PROFILE_DATA_03_26_VERSION
  sourceIntentId: string
  systemId: CanonicalProfileAiConsumableKnowledgeContext['systemId']
  systemLabel: CanonicalProfileAiConsumableKnowledgeContext['systemLabel']
  status: CanonicalProfileSafeResponseStatus
  knownStatements: string[]
  unknownStatements: string[]
  humanEvidenceRequests: string[]
  messageBg: string
  mayPresentToHuman: boolean
  unknownRemainsExplicit: true
  mayGuessMissingTechnicalData: false
  mayAutoFetchEvidence: false
  mayAutoAcceptEvidence: false
  mayAutoResolveKnowledge: false
  mayClaimManufacturerApproval: false
  mayClaimExactJointGeometry: false
  mayClaimProductionCompatibility: false
  automaticProfileSelectionAllowed: false
  automaticGeometryAllowed: false
  productionRulesValidated: false
  productionUnlockAllowed: false
  machineReady: false
  conflicts: string[]
}

const labelRelation = (relation: string, leftProfileCode: string, rightProfileCode: string) =>
  `${relation} (${leftProfileCode} ↔ ${rightProfileCode})`

export function buildCanonicalProfileSafeAiResponse(input: {
  context: CanonicalProfileAiConsumableKnowledgeContext
  queue: CanonicalProfileHumanEvidenceRequestQueue
}): CanonicalProfileSafeAiResponse {
  const conflicts: string[] = []
  if (input.context.sourceIntentId !== input.queue.sourceIntentId) conflicts.push('PROFILE DATA 03.26 sourceIntentId mismatch between AI context and human evidence queue.')
  if (input.context.systemId !== input.queue.systemId) conflicts.push('PROFILE DATA 03.26 systemId mismatch between AI context and human evidence queue.')
  if (input.queue.status === 'BLOCKED_UPSTREAM') conflicts.push(...input.queue.conflicts)

  const blocked = input.context.status === 'BLOCKED_UPSTREAM' || conflicts.length > 0

  const knownStatements = blocked
    ? []
    : input.context.known.map((item) =>
        `Прегледан knowledge status: ${labelRelation(item.relation, item.leftProfileCode, item.rightProfileCode)} · ${item.requirementKind} е resolved for knowledge readiness.`,
      )

  const unknownStatements = blocked
    ? []
    : input.context.unknown.map((item) =>
        `Неизвестно: ${labelRelation(item.relation, item.leftProfileCode, item.rightProfileCode)} · ${item.requirementKind}. Необходим authority: ${item.authorityNeeded}.`,
      )

  const humanEvidenceRequests = blocked
    ? []
    : input.queue.items.map((item) =>
        `${item.action === 'RENEW_HUMAN_REVIEW' ? 'Поднови human review' : 'Осигури или посочи evidence'}: ${item.requestedEvidence}`,
      )

  let status: CanonicalProfileSafeResponseStatus
  if (blocked) status = 'BLOCKED_UPSTREAM'
  else if (input.context.status === 'STALE_HUMAN_REVIEW_REQUIRED') status = 'STALE_REVIEW_RESPONSE_READY_PRODUCTION_LOCKED'
  else if (input.context.unknown.length) status = 'KNOWLEDGE_GAP_RESPONSE_READY_PRODUCTION_LOCKED'
  else status = 'KNOWLEDGE_COMPLETE_RESPONSE_READY_PRODUCTION_LOCKED'

  let messageBg: string
  if (status === 'BLOCKED_UPSTREAM') {
    messageBg = 'Не мога безопасно да използвам текущия профилен knowledge context, защото има upstream конфликт. Нужна е human correction преди технически твърдения или evidence requests.'
  } else if (status === 'STALE_REVIEW_RESPONSE_READY_PRODUCTION_LOCKED') {
    messageBg = `Имам профилен knowledge context за ${input.context.systemLabel}, но human review е остарял. Не приемам старите review резултати като текущи. Нужни са ${humanEvidenceRequests.length} human review/evidence действия. Production остава заключен.`
  } else if (status === 'KNOWLEDGE_GAP_RESPONSE_READY_PRODUCTION_LOCKED') {
    messageBg = `За ${input.context.systemLabel} knowledge coverage е ${input.context.knowledgeCoveragePercent}%. Имам ${knownStatements.length} reviewed knowledge позиции и ${unknownStatements.length} неизвестни позиции. За неизвестните са нужни ${humanEvidenceRequests.length} конкретни human evidence действия. Няма да измислям липсващи технически данни. Production остава заключен.`
  } else {
    messageBg = `За ${input.context.systemLabel} knowledge coverage е ${input.context.knowledgeCoveragePercent}% и няма текущи unknown knowledge позиции. Това е knowledge readiness само по себе си и не означава manufacturer approval, exact joint geometry, production compatibility или machine-ready status.`
  }

  return {
    version: PROFILE_DATA_03_26_VERSION,
    sourceIntentId: input.context.sourceIntentId,
    systemId: input.context.systemId,
    systemLabel: input.context.systemLabel,
    status,
    knownStatements,
    unknownStatements,
    humanEvidenceRequests,
    messageBg,
    mayPresentToHuman: !blocked,
    unknownRemainsExplicit: true,
    mayGuessMissingTechnicalData: false,
    mayAutoFetchEvidence: false,
    mayAutoAcceptEvidence: false,
    mayAutoResolveKnowledge: false,
    mayClaimManufacturerApproval: false,
    mayClaimExactJointGeometry: false,
    mayClaimProductionCompatibility: false,
    automaticProfileSelectionAllowed: false,
    automaticGeometryAllowed: false,
    productionRulesValidated: false,
    productionUnlockAllowed: false,
    machineReady: false,
    conflicts: [...new Set(conflicts)],
  }
}

export const PROFILE_DATA_03_26_SAFETY = Object.freeze({
  safeResponseCompositionOnly: true,
  unknownRemainsExplicit: true,
  mayGuessMissingTechnicalData: false,
  mayAutoFetchEvidence: false,
  mayAutoAcceptEvidence: false,
  mayAutoResolveKnowledge: false,
  mayClaimManufacturerApproval: false,
  mayClaimExactJointGeometry: false,
  mayClaimProductionCompatibility: false,
  automaticProfileSelectionAllowed: false,
  automaticGeometryAllowed: false,
  productionRulesValidated: false,
  productionUnlockAllowed: false,
  machineReady: false,
})
