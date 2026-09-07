import { useMemo, useState } from 'react'
import type { CanonicalProfileHumanEvidenceRequestQueue } from '../aiCanonicalProfileHumanEvidenceRequestQueue'
import {
  buildCanonicalProfileClarificationQuestionPlan,
  type CanonicalProfileClarificationQuestion,
} from '../aiCanonicalProfileClarificationQuestionPlanner'
import {
  buildCanonicalProfileGuidedClarificationSession,
  type CanonicalProfileClarificationAnswerInput,
} from '../aiCanonicalProfileGuidedClarificationSession'
import { buildCanonicalProfileClarificationKnowledgeIntakeBridge } from '../aiCanonicalProfileClarificationKnowledgeIntakeBridge'
import {
  buildProfileDataV2HumanClarificationAnswer,
  EMPTY_PROFILE_DATA_V2_HUMAN_CLARIFICATION_DRAFT,
  removeProfileDataV2HumanClarificationAnswer,
  upsertProfileDataV2HumanClarificationAnswer,
  type ProfileDataV2HumanClarificationDraft,
} from '../profileData/profileDataV2HumanClarificationWorkflow'

interface Props {
  queue: CanonicalProfileHumanEvidenceRequestQueue
}

export function CanonicalProfileClarificationIntakePanel({ queue }: Props) {
  const questionPlan = useMemo(() => buildCanonicalProfileClarificationQuestionPlan(queue), [queue])
  const [drafts, setDrafts] = useState<Record<string, ProfileDataV2HumanClarificationDraft>>({})
  const [answers, setAnswers] = useState<CanonicalProfileClarificationAnswerInput[]>([])
  const [captureErrors, setCaptureErrors] = useState<Record<string, string>>({})
  const session = useMemo(
    () => buildCanonicalProfileGuidedClarificationSession({ plan: questionPlan, answers }),
    [questionPlan, answers],
  )
  const intakeBridge = useMemo(() => buildCanonicalProfileClarificationKnowledgeIntakeBridge(session), [session])

  const draftFor = (questionKey: string): ProfileDataV2HumanClarificationDraft => (
    drafts[questionKey] ?? EMPTY_PROFILE_DATA_V2_HUMAN_CLARIFICATION_DRAFT
  )

  const updateDraft = (
    questionKey: string,
    patch: Partial<ProfileDataV2HumanClarificationDraft>,
  ) => {
    setDrafts((current) => ({
      ...current,
      [questionKey]: {
        ...(current[questionKey] ?? EMPTY_PROFILE_DATA_V2_HUMAN_CLARIFICATION_DRAFT),
        ...patch,
      },
    }))
  }

  const captureAnswer = (question: CanonicalProfileClarificationQuestion) => {
    try {
      const answer = buildProfileDataV2HumanClarificationAnswer({
        question,
        draft: draftFor(question.questionKey),
        answeredAt: new Date().toISOString(),
      })
      setAnswers((current) => upsertProfileDataV2HumanClarificationAnswer(current, answer))
      setCaptureErrors((current) => ({ ...current, [question.questionKey]: '' }))
    } catch (error) {
      setCaptureErrors((current) => ({
        ...current,
        [question.questionKey]: error instanceof Error ? error.message : String(error),
      }))
    }
  }

  const removeAnswer = (questionKey: string) => {
    setAnswers((current) => removeProfileDataV2HumanClarificationAnswer(current, questionKey))
    setCaptureErrors((current) => ({ ...current, [questionKey]: '' }))
  }

  return (
    <section
      className="ff-ai03-facts"
      aria-label="PROFILE DATA V2.1 real human clarification capture"
      data-profile-data-bundle="PROFILE DATA V2.1"
      data-profile-data-v2-status={intakeBridge.status}
    >
      <div className="ff-ai03-card-heading">
        <span>PROFILE DATA V2 · HUMAN CLARIFICATION WORKFLOW</span>
        <b>{intakeBridge.status}</b>
      </div>

      <p>
        V2.1 свързва съществуващите 03.27–03.29 knowledge gaps с реален human input. AI задава точния въпрос,
        човекът въвежда отговора, а приложението го пази само като pending clarification/candidate intake.
        Capture не регистрира и не приема evidence.
      </p>

      <h4>03.27 · Clarification question planner</h4>
      <p><strong>Status:</strong> {questionPlan.status}</p>
      <p><strong>Questions:</strong> {questionPlan.questionCount}</p>

      {questionPlan.questions.map((question) => {
        const draft = draftFor(question.questionKey)
        const sessionItem = session.items.find((item) => item.questionKey === question.questionKey)
        const captured = answers.some((answer) => answer.questionKey === question.questionKey)

        return (
          <article
            key={question.questionKey}
            data-clarification-question={question.questionKey}
            data-clarification-answer-state={sessionItem?.state ?? 'WAITING_HUMAN_ANSWER'}
          >
            <p><strong>{question.answerKind}</strong> · {question.questionBg}</p>
            <p><strong>Required authority:</strong> {question.authorityNeeded}</p>

            <label>
              Human answer
              <textarea
                value={draft.answerText}
                onChange={(event) => updateDraft(question.questionKey, { answerText: event.target.value })}
                placeholder={question.answerKind === 'SOURCE_REFERENCE'
                  ? 'Опиши какво предоставяш и защо този source е релевантен.'
                  : 'Опиши резултата от новия human review.'}
              />
            </label>

            {question.answerKind === 'SOURCE_REFERENCE' && (
              <>
                <label>
                  Source label
                  <input
                    value={draft.sourceLabel}
                    onChange={(event) => updateDraft(question.questionKey, { sourceLabel: event.target.value })}
                    placeholder="Напр. PRELUDE 60 technical catalogue"
                  />
                </label>
                <label>
                  Source reference
                  <input
                    value={draft.sourceRef}
                    onChange={(event) => updateDraft(question.questionKey, { sourceRef: event.target.value })}
                    placeholder="Файл / страница / документ / exact source reference"
                  />
                </label>
              </>
            )}

            <div>
              <button type="button" onClick={() => captureAnswer(question)}>
                {captured ? 'Обнови human answer · pending intake' : 'Запази human answer · pending intake'}
              </button>
              {captured && (
                <button type="button" onClick={() => removeAnswer(question.questionKey)}>
                  Премахни captured answer
                </button>
              )}
            </div>

            {captureErrors[question.questionKey] && (
              <p role="alert">{captureErrors[question.questionKey]}</p>
            )}
            {sessionItem?.validationIssue && (
              <p role="alert">{sessionItem.validationIssue}</p>
            )}
            <p><strong>Answer state:</strong> {sessionItem?.state ?? 'WAITING_HUMAN_ANSWER'}</p>
            <p><strong>Accepted as evidence:</strong> NO</p>
            <p><strong>Requirement satisfied:</strong> NO</p>
          </article>
        )
      })}

      <h4>03.28 · Guided clarification session</h4>
      <p><strong>Status:</strong> {session.status}</p>
      <p><strong>Waiting answers:</strong> {session.waitingAnswerCount}</p>
      <p><strong>Captured answers:</strong> {session.capturedAnswerCount}</p>
      <p><strong>Invalid answers:</strong> {session.invalidAnswerCount}</p>
      <p><strong>Automatic evidence registration:</strong> NO</p>
      <p><strong>Automatic evidence acceptance:</strong> NO</p>

      <h4>03.29 · Clarification → knowledge intake bridge</h4>
      <p><strong>Status:</strong> {intakeBridge.status}</p>
      <p><strong>Candidate intake rows:</strong> {intakeBridge.candidateCount}</p>

      {intakeBridge.candidates.map((candidate) => (
        <article key={candidate.candidateKey} data-profile-data-v2-candidate={candidate.candidateKey}>
          <p>
            <strong>{candidate.candidateKind}</strong> · {candidate.relation} · {candidate.leftProfileCode} ↔ {candidate.rightProfileCode}
          </p>
          <p><strong>Requirement:</strong> {candidate.requirementKind}</p>
          <p><strong>Human answer:</strong> {candidate.humanAnswerText}</p>
          {candidate.candidateKind === 'EVIDENCE_SOURCE_REFERENCE_CANDIDATE' && (
            <p><strong>Source:</strong> {candidate.sourceLabel} · {candidate.sourceRef}</p>
          )}
          <p><strong>State:</strong> {candidate.state}</p>
          <p><strong>May create manual evidence registration later:</strong> {candidate.mayCreateManualEvidenceRegistration ? 'YES' : 'NO'}</p>
          <p><strong>Automatically registered:</strong> NO</p>
          <p><strong>Human intake/review required:</strong> YES</p>
        </article>
      ))}

      <p><strong>Automatic requirement satisfaction:</strong> NO</p>
      <p><strong>Automatic knowledge resolution:</strong> NO</p>
      <p><strong>Manufacturer approval:</strong> NO</p>
      <p><strong>Exact joint geometry verified:</strong> NO</p>
      <p><strong>Production compatibility validated:</strong> NO</p>
      <p><strong>Automatic profile selection:</strong> NO</p>
      <p><strong>Automatic geometry:</strong> NO</p>
      <p><strong>Rules validated:</strong> NO</p>
      <p><strong>Production unlock:</strong> NO</p>
      <p><strong>Machine ready:</strong> NO</p>

      <footer data-safety="PROFILE DATA V2.1: REAL HUMAN ANSWER CAPTURE YES · CANDIDATE INTAKE ONLY · NO AUTO FETCH · NO AUTO REGISTER · NO AUTO ACCEPT · NO AUTO SATISFY · NO AUTO RESOLVE · MANUFACTURER APPROVAL NO · EXACT JOINT GEOMETRY NO · PRODUCTION COMPATIBILITY NO · AUTOMATIC PROFILE SELECTION NO · AUTOMATIC GEOMETRY NO · RULES VALIDATED NO · PRODUCTION UNLOCK NO · MACHINE READY NO">
        PROFILE DATA V2.1 · AI ПИТА · ЧОВЕКЪТ ОТГОВАРЯ · ОТГОВОРЪТ СТАВА САМО PENDING CANDIDATE · HUMAN INTAKE/REVIEW ОСТАВА ЗАДЪЛЖИТЕЛЕН
      </footer>
    </section>
  )
}
