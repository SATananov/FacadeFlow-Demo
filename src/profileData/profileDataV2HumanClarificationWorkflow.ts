import type { CanonicalProfileClarificationQuestion } from '../aiCanonicalProfileClarificationQuestionPlanner'
import type { CanonicalProfileClarificationAnswerInput } from '../aiCanonicalProfileGuidedClarificationSession'

export const PROFILE_DATA_V2_1_VERSION = 'PROFILE_DATA_V2.1' as const

export interface ProfileDataV2HumanClarificationDraft {
  answerText: string
  sourceLabel: string
  sourceRef: string
}

export const EMPTY_PROFILE_DATA_V2_HUMAN_CLARIFICATION_DRAFT: Readonly<ProfileDataV2HumanClarificationDraft> = Object.freeze({
  answerText: '',
  sourceLabel: '',
  sourceRef: '',
})

const clean = (value: string | undefined) => value?.trim() ?? ''

export function buildProfileDataV2HumanClarificationAnswer(input: {
  question: CanonicalProfileClarificationQuestion
  draft: ProfileDataV2HumanClarificationDraft
  answeredAt: string
}): CanonicalProfileClarificationAnswerInput {
  const answerText = clean(input.draft.answerText)
  const sourceLabel = clean(input.draft.sourceLabel)
  const sourceRef = clean(input.draft.sourceRef)
  const answeredAt = clean(input.answeredAt)

  if (!answeredAt) {
    throw new Error('PROFILE DATA V2.1 human clarification capture requires answeredAt.')
  }
  if (!answerText) {
    throw new Error('PROFILE DATA V2.1 human clarification capture requires a human answer.')
  }
  if (input.question.answerKind === 'SOURCE_REFERENCE' && (!sourceLabel || !sourceRef)) {
    throw new Error('PROFILE DATA V2.1 SOURCE_REFERENCE capture requires both sourceLabel and sourceRef.')
  }

  return Object.freeze({
    questionKey: input.question.questionKey,
    answerKind: input.question.answerKind,
    answeredByRole: 'TECHNICAL_USER',
    answeredAt,
    answerText,
    ...(input.question.answerKind === 'SOURCE_REFERENCE'
      ? { sourceLabel, sourceRef }
      : {}),
  })
}

export function upsertProfileDataV2HumanClarificationAnswer(
  answers: readonly CanonicalProfileClarificationAnswerInput[],
  answer: CanonicalProfileClarificationAnswerInput,
): CanonicalProfileClarificationAnswerInput[] {
  return [
    ...answers.filter((item) => item.questionKey !== answer.questionKey),
    answer,
  ].sort((a, b) => a.questionKey.localeCompare(b.questionKey))
}

export function removeProfileDataV2HumanClarificationAnswer(
  answers: readonly CanonicalProfileClarificationAnswerInput[],
  questionKey: string,
): CanonicalProfileClarificationAnswerInput[] {
  return answers.filter((item) => item.questionKey !== questionKey)
}

export const PROFILE_DATA_V2_1_SAFETY = Object.freeze({
  humanAnswerCaptureOnly: true,
  humanActionRequired: true,
  candidateIntakeOnly: true,
  automaticQuestionAnsweringAllowed: false,
  automaticEvidenceFetchAllowed: false,
  automaticEvidenceRegistrationAllowed: false,
  automaticEvidenceAcceptanceAllowed: false,
  automaticRequirementSatisfactionAllowed: false,
  automaticKnowledgeResolutionAllowed: false,
  manufacturerApproval: false,
  exactJointGeometryVerified: false,
  productionCompatibilityValidated: false,
  automaticProfileSelectionAllowed: false,
  automaticGeometryAllowed: false,
  rulesValidated: false,
  productionUnlockAllowed: false,
  machineReady: false,
  productionApproved: false,
})
