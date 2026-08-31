import './RuleValidationAggregationFoundation.css'
import { buildFacadeFlowRuleEvaluationFoundation } from '../aiRuleEvaluation'
import { aggregateFacadeFlowRuleEvaluations, type FacadeFlowRuleGateAggregateState } from '../aiRuleValidationAggregation'
import type { FacadeFlowAiSession, FacadeFlowRuleGate } from '../aiWorkspaceTypes'

interface Props { session: FacadeFlowAiSession; gate: FacadeFlowRuleGate }

const stateLabels: Record<FacadeFlowRuleGateAggregateState, string> = {
  INCOMPLETE: 'НЕПЪЛЕН GATE',
  BLOCKED_BY_FAIL: 'БЛОКИРАН ОТ FAIL',
  REVIEWED_COMPLETE: 'ВСИЧКИ ПРОВЕРКИ СА ПРЕГЛЕДАНИ',
}

export function RuleValidationAggregationFoundation({ session, gate: _gate }: Props) {
  const evaluation = buildFacadeFlowRuleEvaluationFoundation(session)
  if (!evaluation) return null
  const aggregate = aggregateFacadeFlowRuleEvaluations(evaluation.rows)
  const stateCards: Array<{ state: FacadeFlowRuleGateAggregateState; title: string; text: string }> = [
    { state: 'INCOMPLETE', title: 'НЕПЪЛЕН', text: 'Има резултати без човешки преглед или липсва доказателство. Няма общо решение.' },
    { state: 'BLOCKED_BY_FAIL', title: 'БЛОКИРАН ОТ FAIL', text: 'Поне един човешки прегледан резултат е FAIL. FAIL блокира целия gate.' },
    { state: 'REVIEWED_COMPLETE', title: 'ПРЕГЛЕДАН НАБОР', text: 'Всички индивидуални резултати са прегледани и няма FAIL. Това още не е финална валидация.' },
  ]
  return <section className="ff-ai-rule-validation-aggregation" aria-label="Обобщаване на резултатите от проверка по правила">
    <div className="ff-ai-rule-validation-aggregation-head"><div><span>06C.3.7 · ОБОБЩАВАНЕ НА GATE</span><h4>Много индивидуални резултати → един общ статус</h4><p>Агрегирането показва дали наборът е непълен, блокиран от FAIL или изцяло прегледан. То не създава финално инженерно одобрение и не отключва производство.</p></div><div><b>{stateLabels[aggregate.state]}</b><small>ПРЕГЛЕДАНИ: {aggregate.humanReviewedCount} / {aggregate.totalEvaluationCount}</small><em>ФИНАЛНО РЕШЕНИЕ: НЕ Е СЪЗДАДЕНО</em></div></div>
    <div className="ff-ai-rule-validation-aggregation-states">{stateCards.map((item) => <article key={item.state} className={aggregate.state === item.state ? 'current' : ''}><b>{item.title}</b><span>{item.text}</span></article>)}</div>
    <div className="ff-ai-rule-validation-aggregation-counts"><div><span>PASS</span><b>{aggregate.passCount}</b></div><div><span>FAIL</span><b>{aggregate.failCount}</b></div><div><span>НЕ Е ПРИЛОЖИМО</span><b>{aggregate.notApplicableCount}</b></div><div><span>НУЖНО ДОКАЗАТЕЛСТВО / ПРЕГЛЕД</span><b>{aggregate.needsEvidenceCount}</b></div><div><span>БЛОКИРАЩИ FAIL</span><b>{aggregate.blockerRequirementIds.length}</b></div></div>
    <div className="ff-ai-rule-validation-aggregation-lock"><div><b>Общ статус ≠ валидирани правила</b><span>Дори „ПРЕГЛЕДАН НАБОР“ означава само, че всички индивидуални резултати са HUMAN REVIEWED и няма FAIL. rulesValidated остава НЕ.</span></div><div><b>Отключване за производство не съществува в 06C.3.7</b><span>Преходът към конструктора, финалното одобрение и machine-ready остават заключени независимо от агрегирания статус.</span></div></div>
    <footer>ОБОБЩЕН СТАТУС: {aggregate.state} · ПРАВИЛА ВАЛИДИРАНИ: НЕ · ФИНАЛНО ОДОБРЕНИЕ: НЕ · ПРЕХОД: ЗАКЛЮЧЕН · ПРОИЗВОДСТВО: ЗАКЛЮЧЕНО · ГОТОВО ЗА МАШИНА: НЕ</footer>
  </section>
}
