import { useState } from 'react'
import type { FacadeFlowRealUserWorkflowV1State } from '../aiWorkspaceTypes'

interface Props {
  workflow: FacadeFlowRealUserWorkflowV1State
  onAnswer: (questionId: string, answerText: string, defer: boolean) => void
  onRemoveAnswer: (target: string) => void
}

const statusLabel: Record<FacadeFlowRealUserWorkflowV1State['status'], string> = {
  BLOCKED: 'НУЖНА Е КОРЕКЦИЯ',
  NEEDS_HUMAN_CLARIFICATION: 'AI ЧАКА УТОЧНЕНИЕ',
  READY_FOR_HUMAN_REVIEW_WITH_GAPS: 'ГОТОВО ЗА ПРЕГЛЕД · ИМА НЕУТОЧНЕНО',
  READY_FOR_HUMAN_REVIEW: 'ГОТОВО ЗА ЧОВЕШКИ ПРЕГЛЕД',
}

export function RealUserWorkflowV1Panel({ workflow, onAnswer, onRemoveAnswer }: Props) {
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const answersByTarget = new Map(workflow.answers.map((answer) => [answer.target, answer]))

  return (
    <section className="ff-real-user-workflow" aria-label="Real User Workflow Integration V1" data-real-user-workflow="V1">
      <div className="ff-real-user-workflow-head">
        <div>
          <span>REAL USER WORKFLOW V1</span>
          <h4>AI разбра → проверява знанията → пита само за липсващото</h4>
        </div>
        <b>{statusLabel[workflow.status]}</b>
      </div>

      <div className="ff-real-user-workflow-summary">
        <span><small>Разпознато</small><strong>{workflow.currentInterpretation.recognized.length}</strong></span>
        <span><small>Задължителни въпроси</small><strong>{workflow.requiredQuestionCount}</strong></span>
        <span><small>Допълнителни въпроси</small><strong>{workflow.optionalQuestionCount}</strong></span>
        <span><small>Потвърдени уточнения</small><strong>{workflow.answers.filter((answer) => !answer.deferred).length}</strong></span>
      </div>

      {workflow.knowledgeFacts.length > 0 && <div className="ff-real-user-workflow-known">
        <h5>Какво може да използва FacadeFlow сега</h5>
        {workflow.knowledgeFacts.map((fact) => <article key={fact.id}>
          <div><strong>{fact.label}</strong><span>{fact.authority}</span></div>
          <p>{fact.value}</p>
          <small>{fact.safetyNote}</small>
        </article>)}
      </div>}

      {workflow.knowledgeGaps.length > 0 && <div className="ff-real-user-workflow-gaps">
        <h5>Knowledge gaps — AI няма право да ги измисля</h5>
        {workflow.knowledgeGaps.map((gap) => <p key={gap.id}><strong>{gap.label}</strong> · {gap.message}<br/><small>Нужен authority: {gap.authorityNeeded}</small></p>)}
      </div>}

      {workflow.questions.length > 0 ? <div className="ff-real-user-workflow-questions">
        <h5>Кажи само липсващото</h5>
        {workflow.questions.map((item) => {
          const saved = answersByTarget.get(item.target)
          const value = drafts[item.id] ?? saved?.answerText ?? ''
          return <article key={item.id} className={item.priority === 'REQUIRED' ? 'required' : 'optional'} data-question-target={item.target}>
            <div className="ff-real-user-question-title"><span>{item.priority === 'REQUIRED' ? 'НУЖНО' : 'ПО ЖЕЛАНИЕ'}</span><strong>{item.label}</strong></div>
            <p>{item.questionBg}</p>
            {item.suggestionReason && <small className="ff-real-user-suggestion-reason">{item.suggestionReason}</small>}
            {saved?.deferred && item.priority === 'REQUIRED' && <small className="ff-real-user-required-deferred">Оставено е неуточнено, но това е задължителен structural въпрос. AI чертежът остава заключен, докато не дадеш отговор.</small>}
            <div className="ff-real-user-answer-row">
              <input
                value={value}
                onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: event.target.value }))}
                placeholder={item.answerHint ?? 'Напиши отговора тук'}
              />
              <button type="button" className="primary-button" disabled={!value.trim()} onClick={() => onAnswer(item.id, value, false)}>Запази отговора</button>
            </div>
            <div className="ff-real-user-answer-actions">
              {item.suggestedAnswer && <button type="button" onClick={() => onAnswer(item.id, item.suggestedAnswer!, false)}>Потвърди предложението: {item.suggestedAnswer}</button>}
              <button type="button" onClick={() => onAnswer(item.id, '', true)}>Не знам / остави неуточнено</button>
            </div>
          </article>
        })}
      </div> : <div className="ff-real-user-workflow-ready"><strong>Няма задължителни уточняващи въпроси.</strong><span>Текущият structured intent може да продължи към човешки преглед.</span></div>}

      {workflow.answers.length > 0 && <details className="ff-real-user-workflow-history">
        <summary>Човешки уточнения в тази сесия ({workflow.answers.length})</summary>
        {workflow.answers.map((answer) => <div key={answer.target}>
          <span>{answer.target}</span>
          <strong>{answer.deferred ? 'ОСТАВЕНО НЕУТОЧНЕНО' : answer.answerText}</strong>
          <button type="button" onClick={() => onRemoveAnswer(answer.target)}>Отмени</button>
        </div>)}
      </details>}

      {workflow.augmentedSourceText !== workflow.sourceText && <details className="ff-real-user-workflow-source">
        <summary>Работен prompt след човешките уточнения</summary>
        <p>{workflow.augmentedSourceText}</p>
      </details>}

      <footer data-safety="REAL USER WORKFLOW V1 · HUMAN CLARIFICATION ONLY · PROFILE SUGGESTIONS REQUIRE HUMAN CONFIRMATION · NO AUTO PROFILE SELECT · NO AUTO GEOMETRY · NO RULE VALIDATION · NO PRODUCTION UNLOCK · MACHINE READY NO">
        HUMAN CLARIFICATION: ДА · АВТОМАТИЧЕН ИЗБОР НА ПРОФИЛ: НЕ · АВТОМАТИЧНА ГЕОМЕТРИЯ: НЕ · PRODUCTION UNLOCK: НЕ · MACHINE READY: НЕ
      </footer>
    </section>
  )
}
