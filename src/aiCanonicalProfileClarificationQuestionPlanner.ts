import type {
  CanonicalProfileHumanEvidenceRequestQueue,
  CanonicalProfileHumanEvidenceQueueStatus,
} from './aiCanonicalProfileHumanEvidenceRequestQueue'

export const PROFILE_DATA_03_27_VERSION = 'PROFILE_DATA_03.27' as const

export type CanonicalProfileClarificationQuestionStatus =
  | 'BLOCKED_UPSTREAM'
  | 'CLARIFICATION_QUESTIONS_READY_PRODUCTION_LOCKED'
  | 'NO_CLARIFICATION_REQUIRED_PRODUCTION_LOCKED'

export type CanonicalProfileClarificationAnswerKind =
  | 'SOURCE_REFERENCE'
  | 'HUMAN_REVIEW_CONFIRMATION'

export interface CanonicalProfileClarificationQuestion {
  questionKey: string
  requestKey: string
  relation: CanonicalProfileHumanEvidenceRequestQueue['items'][number]['relation']
  leftProfileCode: string
  rightProfileCode: string
  requirementKind: CanonicalProfileHumanEvidenceRequestQueue['items'][number]['requirementKind']
  authorityNeeded: CanonicalProfileHumanEvidenceRequestQueue['items'][number]['authorityNeeded']
  answerKind: CanonicalProfileClarificationAnswerKind
  questionBg: string
  evidenceNeeded: string
  humanAnswerRequired: true
  mayInferAnswer: false
  mayAutoFetchEvidence: false
  mayAutoAcceptAnswer: false
}

export interface CanonicalProfileClarificationQuestionPlan {
  version: typeof PROFILE_DATA_03_27_VERSION
  sourceIntentId: string
  systemId: CanonicalProfileHumanEvidenceRequestQueue['systemId']
  systemLabel: CanonicalProfileHumanEvidenceRequestQueue['systemLabel']
  sourceQueueStatus: CanonicalProfileHumanEvidenceQueueStatus
  status: CanonicalProfileClarificationQuestionStatus
  questions: CanonicalProfileClarificationQuestion[]
  questionCount: number
  conflicts: string[]
  humanAnswerRequired: boolean
  automaticQuestionAnsweringAllowed: false
  automaticEvidenceFetchAllowed: false
  automaticEvidenceAcceptanceAllowed: false
  automaticKnowledgeResolutionAllowed: false
  productionUnlockAllowed: false
  machineReady: false
}

const questionFor = (item: CanonicalProfileHumanEvidenceRequestQueue['items'][number]): CanonicalProfileClarificationQuestion => {
  const renewing = item.action === 'RENEW_HUMAN_REVIEW'
  return {
    questionKey: `CLARIFY:${item.requestKey}`,
    requestKey: item.requestKey,
    relation: item.relation,
    leftProfileCode: item.leftProfileCode,
    rightProfileCode: item.rightProfileCode,
    requirementKind: item.requirementKind,
    authorityNeeded: item.authorityNeeded,
    answerKind: renewing ? 'HUMAN_REVIEW_CONFIRMATION' : 'SOURCE_REFERENCE',
    questionBg: renewing
      ? `За ${item.relation} (${item.leftProfileCode} ↔ ${item.rightProfileCode}) human review за ${item.requirementKind} е остарял. Моля, извърши нов преглед и опиши резултата. Не приемам стария review като текущ.`
      : `За ${item.relation} (${item.leftProfileCode} ↔ ${item.rightProfileCode}) липсва ${item.requirementKind}. Моля, посочи конкретен източник от authority ${item.authorityNeeded} — име/описание на източника и референция към него.`,
    evidenceNeeded: item.requestedEvidence,
    humanAnswerRequired: true,
    mayInferAnswer: false,
    mayAutoFetchEvidence: false,
    mayAutoAcceptAnswer: false,
  }
}

export function buildCanonicalProfileClarificationQuestionPlan(
  queue: CanonicalProfileHumanEvidenceRequestQueue,
): CanonicalProfileClarificationQuestionPlan {
  const conflicts = [...queue.conflicts]
  const seen = new Set<string>()
  const questions: CanonicalProfileClarificationQuestion[] = []

  for (const item of queue.items) {
    if (seen.has(item.requestKey)) {
      conflicts.push(`${item.requestKey} appears more than once in PROFILE DATA 03.27 clarification input.`)
      continue
    }
    seen.add(item.requestKey)
    questions.push(questionFor(item))
  }

  questions.sort((a, b) => a.questionKey.localeCompare(b.questionKey))

  let status: CanonicalProfileClarificationQuestionStatus
  if (queue.status === 'BLOCKED_UPSTREAM' || conflicts.length) status = 'BLOCKED_UPSTREAM'
  else if (questions.length) status = 'CLARIFICATION_QUESTIONS_READY_PRODUCTION_LOCKED'
  else status = 'NO_CLARIFICATION_REQUIRED_PRODUCTION_LOCKED'

  return {
    version: PROFILE_DATA_03_27_VERSION,
    sourceIntentId: queue.sourceIntentId,
    systemId: queue.systemId,
    systemLabel: queue.systemLabel,
    sourceQueueStatus: queue.status,
    status,
    questions: status === 'BLOCKED_UPSTREAM' ? [] : questions,
    questionCount: status === 'BLOCKED_UPSTREAM' ? 0 : questions.length,
    conflicts: [...new Set(conflicts)],
    humanAnswerRequired: status === 'BLOCKED_UPSTREAM' || questions.length > 0,
    automaticQuestionAnsweringAllowed: false,
    automaticEvidenceFetchAllowed: false,
    automaticEvidenceAcceptanceAllowed: false,
    automaticKnowledgeResolutionAllowed: false,
    productionUnlockAllowed: false,
    machineReady: false,
  }
}

export const PROFILE_DATA_03_27_SAFETY = Object.freeze({
  clarificationPlanningOnly: true,
  automaticQuestionAnsweringAllowed: false,
  automaticEvidenceFetchAllowed: false,
  automaticEvidenceAcceptanceAllowed: false,
  automaticKnowledgeResolutionAllowed: false,
  productionUnlockAllowed: false,
  machineReady: false,
})
