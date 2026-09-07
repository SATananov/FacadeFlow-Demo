import type {
  CanonicalProfileClarificationAnswerKind,
  CanonicalProfileClarificationQuestionPlan,
} from './aiCanonicalProfileClarificationQuestionPlanner'

export const PROFILE_DATA_03_28_VERSION = 'PROFILE_DATA_03.28' as const

export interface CanonicalProfileClarificationAnswerInput {
  questionKey: string
  answerKind: CanonicalProfileClarificationAnswerKind
  answeredByRole: 'TECHNICAL_USER'
  answeredAt: string
  answerText: string
  sourceLabel?: string
  sourceRef?: string
}

export type CanonicalProfileClarificationItemState =
  | 'WAITING_HUMAN_ANSWER'
  | 'ANSWER_CAPTURED_PENDING_INTAKE'
  | 'ANSWER_INVALID_HUMAN_CORRECTION_REQUIRED'

export interface CanonicalProfileClarificationSessionItem {
  questionKey: string
  requestKey: string
  relation: CanonicalProfileClarificationQuestionPlan['questions'][number]['relation']
  leftProfileCode: string
  rightProfileCode: string
  requirementKind: CanonicalProfileClarificationQuestionPlan['questions'][number]['requirementKind']
  authorityNeeded: CanonicalProfileClarificationQuestionPlan['questions'][number]['authorityNeeded']
  answerKind: CanonicalProfileClarificationAnswerKind
  questionBg: string
  state: CanonicalProfileClarificationItemState
  answerText: string
  sourceLabel: string
  sourceRef: string
  answeredAt: string
  answeredByRole: 'TECHNICAL_USER' | null
  validationIssue: string
  humanReviewStillRequired: true
  acceptedAsEvidence: false
  requirementSatisfied: false
}

export type CanonicalProfileClarificationSessionStatus =
  | 'BLOCKED_UPSTREAM'
  | 'WAITING_HUMAN_ANSWERS_PRODUCTION_LOCKED'
  | 'HUMAN_CORRECTION_REQUIRED_PRODUCTION_LOCKED'
  | 'ANSWERS_CAPTURED_PENDING_INTAKE_PRODUCTION_LOCKED'
  | 'NO_CLARIFICATION_REQUIRED_PRODUCTION_LOCKED'

export interface CanonicalProfileGuidedClarificationSession {
  version: typeof PROFILE_DATA_03_28_VERSION
  sourceIntentId: string
  systemId: CanonicalProfileClarificationQuestionPlan['systemId']
  systemLabel: CanonicalProfileClarificationQuestionPlan['systemLabel']
  status: CanonicalProfileClarificationSessionStatus
  items: CanonicalProfileClarificationSessionItem[]
  totalQuestionCount: number
  waitingAnswerCount: number
  capturedAnswerCount: number
  invalidAnswerCount: number
  conflicts: string[]
  humanActionRequired: boolean
  answerCaptureOnly: true
  automaticEvidenceRegistrationAllowed: false
  automaticEvidenceAcceptanceAllowed: false
  automaticKnowledgeResolutionAllowed: false
  productionUnlockAllowed: false
  machineReady: false
}

const clean = (value: string | undefined) => value?.trim() ?? ''

export function buildCanonicalProfileGuidedClarificationSession(input: {
  plan: CanonicalProfileClarificationQuestionPlan
  answers?: readonly CanonicalProfileClarificationAnswerInput[]
}): CanonicalProfileGuidedClarificationSession {
  const answers = input.answers ?? []
  const conflicts = [...input.plan.conflicts]
  const answerMap = new Map<string, CanonicalProfileClarificationAnswerInput>()

  for (const answer of answers) {
    if (answerMap.has(answer.questionKey)) {
      conflicts.push(`${answer.questionKey} has multiple human clarification answers; PROFILE DATA 03.28 fails closed.`)
      continue
    }
    answerMap.set(answer.questionKey, answer)
  }

  for (const answer of answers) {
    if (!input.plan.questions.some((question) => question.questionKey === answer.questionKey)) {
      conflicts.push(`${answer.questionKey} does not match a current PROFILE DATA 03.27 clarification question.`)
    }
  }

  const items: CanonicalProfileClarificationSessionItem[] = input.plan.questions.map((question) => {
    const answer = answerMap.get(question.questionKey)
    if (!answer) {
      return {
        questionKey: question.questionKey,
        requestKey: question.requestKey,
        relation: question.relation,
        leftProfileCode: question.leftProfileCode,
        rightProfileCode: question.rightProfileCode,
        requirementKind: question.requirementKind,
        authorityNeeded: question.authorityNeeded,
        answerKind: question.answerKind,
        questionBg: question.questionBg,
        state: 'WAITING_HUMAN_ANSWER',
        answerText: '',
        sourceLabel: '',
        sourceRef: '',
        answeredAt: '',
        answeredByRole: null,
        validationIssue: '',
        humanReviewStillRequired: true,
        acceptedAsEvidence: false,
        requirementSatisfied: false,
      }
    }

    const answerText = clean(answer.answerText)
    const sourceLabel = clean(answer.sourceLabel)
    const sourceRef = clean(answer.sourceRef)
    const answeredAt = clean(answer.answeredAt)
    let validationIssue = ''

    if (answer.answerKind !== question.answerKind) validationIssue = `Expected ${question.answerKind}; received ${answer.answerKind}.`
    else if (!answeredAt) validationIssue = 'Human clarification answer requires answeredAt.'
    else if (!answerText) validationIssue = 'Human clarification answer requires answerText.'
    else if (question.answerKind === 'SOURCE_REFERENCE' && (!sourceLabel || !sourceRef)) {
      validationIssue = 'SOURCE_REFERENCE answer requires both sourceLabel and sourceRef.'
    }

    return {
      questionKey: question.questionKey,
      requestKey: question.requestKey,
      relation: question.relation,
      leftProfileCode: question.leftProfileCode,
      rightProfileCode: question.rightProfileCode,
      requirementKind: question.requirementKind,
      authorityNeeded: question.authorityNeeded,
      answerKind: question.answerKind,
      questionBg: question.questionBg,
      state: validationIssue ? 'ANSWER_INVALID_HUMAN_CORRECTION_REQUIRED' : 'ANSWER_CAPTURED_PENDING_INTAKE',
      answerText,
      sourceLabel,
      sourceRef,
      answeredAt,
      answeredByRole: answer.answeredByRole,
      validationIssue,
      humanReviewStillRequired: true,
      acceptedAsEvidence: false,
      requirementSatisfied: false,
    }
  })

  const waitingAnswerCount = items.filter((item) => item.state === 'WAITING_HUMAN_ANSWER').length
  const capturedAnswerCount = items.filter((item) => item.state === 'ANSWER_CAPTURED_PENDING_INTAKE').length
  const invalidAnswerCount = items.filter((item) => item.state === 'ANSWER_INVALID_HUMAN_CORRECTION_REQUIRED').length

  let status: CanonicalProfileClarificationSessionStatus
  if (input.plan.status === 'BLOCKED_UPSTREAM' || conflicts.length) status = 'BLOCKED_UPSTREAM'
  else if (!items.length) status = 'NO_CLARIFICATION_REQUIRED_PRODUCTION_LOCKED'
  else if (invalidAnswerCount) status = 'HUMAN_CORRECTION_REQUIRED_PRODUCTION_LOCKED'
  else if (waitingAnswerCount) status = 'WAITING_HUMAN_ANSWERS_PRODUCTION_LOCKED'
  else status = 'ANSWERS_CAPTURED_PENDING_INTAKE_PRODUCTION_LOCKED'

  return {
    version: PROFILE_DATA_03_28_VERSION,
    sourceIntentId: input.plan.sourceIntentId,
    systemId: input.plan.systemId,
    systemLabel: input.plan.systemLabel,
    status,
    items,
    totalQuestionCount: items.length,
    waitingAnswerCount,
    capturedAnswerCount,
    invalidAnswerCount,
    conflicts: [...new Set(conflicts)],
    humanActionRequired: status === 'BLOCKED_UPSTREAM' || waitingAnswerCount > 0 || invalidAnswerCount > 0,
    answerCaptureOnly: true,
    automaticEvidenceRegistrationAllowed: false,
    automaticEvidenceAcceptanceAllowed: false,
    automaticKnowledgeResolutionAllowed: false,
    productionUnlockAllowed: false,
    machineReady: false,
  }
}

export const PROFILE_DATA_03_28_SAFETY = Object.freeze({
  answerCaptureOnly: true,
  automaticEvidenceRegistrationAllowed: false,
  automaticEvidenceAcceptanceAllowed: false,
  automaticKnowledgeResolutionAllowed: false,
  productionUnlockAllowed: false,
  machineReady: false,
})
