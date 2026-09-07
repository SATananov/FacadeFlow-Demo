import { useMemo } from 'react'
import type { CanonicalProfileHumanEvidenceRequestQueue } from '../aiCanonicalProfileHumanEvidenceRequestQueue'
import { buildCanonicalProfileClarificationQuestionPlan } from '../aiCanonicalProfileClarificationQuestionPlanner'
import { buildCanonicalProfileGuidedClarificationSession } from '../aiCanonicalProfileGuidedClarificationSession'
import { buildCanonicalProfileClarificationKnowledgeIntakeBridge } from '../aiCanonicalProfileClarificationKnowledgeIntakeBridge'

interface Props {
  queue: CanonicalProfileHumanEvidenceRequestQueue
}

export function CanonicalProfileClarificationIntakePanel({ queue }: Props) {
  const questionPlan = useMemo(() => buildCanonicalProfileClarificationQuestionPlan(queue), [queue])
  const session = useMemo(() => buildCanonicalProfileGuidedClarificationSession({ plan: questionPlan }), [questionPlan])
  const intakeBridge = useMemo(() => buildCanonicalProfileClarificationKnowledgeIntakeBridge(session), [session])

  return (
    <section
      className="ff-ai03-facts"
      aria-label="PROFILE DATA 03.27 to 03.29 clarification and intake bridge bundle"
      data-profile-data-bundle="PROFILE DATA 03.27-03.29"
    >
      <div className="ff-ai03-card-heading">
        <span>AI CLARIFICATION + INTAKE BRIDGE · 03.27–03.29</span>
        <b>{intakeBridge.status}</b>
      </div>

      <p>
        Това е последният PROFILE DATA clarification слой: AI формулира точния human question, пази отговора като pending,
        и го превръща само в candidate intake. Няма automatic evidence registration, acceptance или knowledge resolution.
      </p>

      <h4>03.27 · Clarification question planner</h4>
      <p><strong>Status:</strong> {questionPlan.status}</p>
      <p><strong>Questions:</strong> {questionPlan.questionCount}</p>
      {questionPlan.questions.map((question) => (
        <p key={question.questionKey} data-clarification-question={question.questionKey}>
          <strong>{question.answerKind}</strong> · {question.questionBg}
        </p>
      ))}

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
      <p><strong>Automatic requirement satisfaction:</strong> NO</p>
      <p><strong>Automatic knowledge resolution:</strong> NO</p>
      <p><strong>Manufacturer approval:</strong> NO</p>
      <p><strong>Exact joint geometry verified:</strong> NO</p>
      <p><strong>Production compatibility validated:</strong> NO</p>
      <p><strong>Production unlock:</strong> NO</p>
      <p><strong>Machine ready:</strong> NO</p>

      <footer data-safety="BUNDLE 03.27-03.29: CLARIFICATION ONLY · HUMAN ANSWERS PENDING · CANDIDATE INTAKE ONLY · NO AUTO REGISTER · NO AUTO ACCEPT · NO AUTO RESOLVE · PRODUCTION UNLOCK NO · MACHINE READY NO">
        03.27–03.29 BUNDLE · AI ПИТА ТОЧНО · ЧОВЕКЪТ ОТГОВАРЯ · ОТГОВОРЪТ ОСТАВА CANDIDATE ДО ОТДЕЛЕН HUMAN INTAKE/REVIEW
      </footer>
    </section>
  )
}
