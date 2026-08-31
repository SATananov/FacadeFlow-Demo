import './RuleEvaluationFoundation.css'
import { buildFacadeFlowRuleEvaluationFoundation } from '../aiRuleEvaluation'
import type { FacadeFlowAiSession, FacadeFlowRuleEvaluationResult, FacadeFlowRuleGate } from '../aiWorkspaceTypes'

interface Props { session: FacadeFlowAiSession; gate: FacadeFlowRuleGate }

const resultLabels: Record<FacadeFlowRuleEvaluationResult, string> = {
  NEEDS_EVIDENCE: 'НУЖНО Е ДОКАЗАТЕЛСТВО',
  PASS: 'PASS · ИЗИСКВА ДОКАЗАНА ПРОВЕРКА',
  FAIL: 'FAIL · ИЗИСКВА ДОКАЗАНА ПРОВЕРКА',
  NOT_APPLICABLE: 'НЕ Е ПРИЛОЖИМО · САМО С ПОТВЪРДЕНА ПРИЛОЖИМОСТ',
}

export function RuleEvaluationFoundation({ session, gate }: Props) {
  const foundation = buildFacadeFlowRuleEvaluationFoundation(session)
  if (!foundation) return null
  const requirementById = new Map(gate.requirements.map((item) => [item.id, item]))
  return <section className="ff-ai-rule-evaluation-foundation" aria-label="Модел за резултат от проверка на бъдещи правила">
    <div className="ff-ai-rule-evaluation-head"><div><span>06C.3.6 · РЕЗУЛТАТ ОТ ПРОВЕРКА</span><h4>Как завършва бъдещата проверка — без фалшив PASS</h4><p>Резултат се приема само след реално правило с ревизия, потвърдена приложимост, потвърдени източници, конкретно доказателство и човешки преглед.</p></div><div><b>РЕАЛНИ ОЦЕНКИ: {foundation.realEvaluationCount}</b><small>ПРЕГЛЕДАНИ ОТ ЧОВЕК: {foundation.humanReviewedEvaluationCount}</small><em>ПРАВИЛА ПРОВЕРЕНИ: НЕ</em></div></div>
    <div className="ff-ai-rule-evaluation-vocabulary"><b>ПОДГОТВЕНИ РЕЗУЛТАТИ</b><div>{foundation.resultVocabulary.map((result) => <span key={result}>{resultLabels[result]}</span>)}</div><small>Това е речник на бъдещите резултати. Нито един PASS / FAIL / НЕ Е ПРИЛОЖИМО не се генерира автоматично.</small></div>
    <div className="ff-ai-rule-evaluation-grid">{foundation.rows.map((row) => { const requirement = requirementById.get(row.requirementId); return <article key={row.id}><span>НУЖНО Е ДОКАЗАТЕЛСТВО</span><b>{requirement?.label ?? row.requirementId}</b><small>Правило: — · Ревизия: — · Приложимост: НЕУТОЧНЕНА</small><em>Източници: 0 · Доказателства: 0 · Проверил: —</em></article> })}</div>
    <div className="ff-ai-rule-evaluation-policy"><div><b>PASS / FAIL</b><span>Изискват реално правило + ревизия + HUMAN CONFIRMED приложимост + HUMAN CONFIRMED източници + конкретно доказателство + човешки преглед.</span></div><div><b>НЕ Е ПРИЛОЖИМО</b><span>Допуска се само когато потвърдената приложимост изрично е DOES_NOT_APPLY. Не се извежда от липсващи данни.</span></div><div><b>Промяна = повторна проверка</b><span>Промяна на правило, ревизия, приложимост, източници, доказателство, наблюдение или резултат анулира стария човешки преглед и връща НУЖНО Е ДОКАЗАТЕЛСТВО.</span></div><div><b>Няма общо отключване</b><span>Дори човешки прегледан единичен резултат не означава, че целият набор правила е валидиран, че handoff е разрешен или че изделието е machine-ready.</span></div></div>
    <footer>ОЦЕНКИ: 0 · PASS: 0 · FAIL: 0 · НЕ Е ПРИЛОЖИМО: 0 · НУЖНО ДОКАЗАТЕЛСТВО: {foundation.needsEvidenceCount} · RULES VALIDATED: NO · HANDOFF: LOCKED · MACHINE READY: NO</footer>
  </section>
}
