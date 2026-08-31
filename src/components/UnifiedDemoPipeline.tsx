import type { CatalogueProfile } from '../profileCatalogueTypes'
import { completeFacadeFlowDemoHumanReview, prepareFacadeFlowDemoReviewPacket, prepareFacadeFlowDemoRulesGate, setFacadeFlowDemoReviewAccepted } from '../aiWorkspaceState'
import type { FacadeFlowAiSession, FacadeFlowRuleGateRequirement } from '../aiWorkspaceTypes'
import { RuleSourceRevisionFoundation } from './RuleSourceRevisionFoundation'
import { RuleApplicabilityFoundation } from './RuleApplicabilityFoundation'
import { RuleEvaluationFoundation } from './RuleEvaluationFoundation'
import { RealDataIntakeContractFoundation } from './RealDataIntakeContractFoundation'
import { RealDataStagingHumanMappingFoundation } from './RealDataStagingHumanMappingFoundation'
import { RuleValidationAggregationFoundation } from './RuleValidationAggregationFoundation'

interface Props {
  session: FacadeFlowAiSession
  profiles: CatalogueProfile[]
  setSession: (updater: (current: FacadeFlowAiSession) => FacadeFlowAiSession) => void
  compact?: boolean
}

const kindLabels = {
  PRODUCT: 'ИЗДЕЛИЕ',
  PROJECT_SOURCE: 'ПРОЕКТЕН ИЗТОЧНИК',
  SKETCH_SOURCE: 'СКИЦА / ИЗТОЧНИК',
  MANUAL_ROUTE: 'РЪЧЕН МАРШРУТ',
  KNOWLEDGE_CONTEXT: 'БАЗА ЗНАНИЯ',
} as const

const ruleStateLabel = (item: FacadeFlowRuleGateRequirement) => item.state === 'SOURCE_REQUIRED'
  ? 'НУЖЕН РЕАЛЕН ИЗТОЧНИК'
  : item.state === 'DEFERRED'
    ? 'ИЗЧАКВА РЕАЛНИ ДАННИ'
    : 'НЕ Е ПРИЛОЖИМО'

export function UnifiedDemoPipeline({ session, profiles, setSession, compact = false }: Props) {
  if (!session.job.demoScenario) return null
  const packet = session.job.reviewPacket
  const reviewed = packet?.status === 'HUMAN_REVIEWED'
  const rulesReady = packet?.ruleGate?.status === 'FRAMEWORK_READY'
  return <section className={`ff-ai-unified-demo-pipeline ${compact ? 'compact' : ''}`} aria-label="Обща DEMO спецификация, човешки преглед и рамка за правила">
    <div className="ff-ai-unified-pipeline-head"><div><span>06C.3.3 · ОБЩ DEMO ПРОЦЕС</span><h3>Един формат за всеки AI режим</h3><p>DEMO входът се нормализира в общ структуриран пакет. Човешкият преглед не потвърждава изделието. Рамката за правила само показва какво ще трябва да се проверява, без да измисля реални инженерни правила.</p></div><div><b>{rulesReady ? 'РАМКА ЗА ПРАВИЛА · ПОДГОТВЕНА' : packet ? (reviewed ? 'ЧОВЕШКИ ПРЕГЛЕД · ГОТОВ' : 'НУЖЕН ЧОВЕШКИ ПРЕГЛЕД') : 'НЕ Е ПОДГОТВЕН'}</b><small>AI ГЕНЕРИРАНО: НЕ · ПРАВИЛА ПРОВЕРЕНИ: НЕ · ГОТОВО ЗА МАШИНА: НЕ</small></div></div>
    <ol className="ff-ai-unified-pipeline-steps"><li className="done"><b>1</b><span>DEMO вход</span></li><li className={packet ? 'done' : ''}><b>2</b><span>Обща спецификация</span></li><li className={reviewed ? 'done' : packet ? 'active' : ''}><b>3</b><span>Човешки преглед</span></li><li className={rulesReady ? 'framework' : reviewed ? 'active' : ''}><b>4</b><span>Правила</span></li><li><b>5</b><span>Преход към конструктора</span></li></ol>
    {!packet ? <div className="ff-ai-unified-pipeline-action"><div><b>Готово за нормализиране</b><span>Ще се използват само наличните DEMO стойности. Липсващото остава НЕУТОЧНЕНО.</span></div><button type="button" onClick={() => setSession((current) => prepareFacadeFlowDemoReviewPacket(current, profiles))}>Подготви обща DEMO спецификация</button></div> : <>
      <div className="ff-ai-unified-packet-meta"><div><span>ТИП ПАКЕТ</span><b>{kindLabels[packet.kind]}</b></div><div><span>РЕФЕРЕНЦИЯ</span><b>{packet.reference || '—'}</b></div><div><span>АКТИВЕН ПЪТ</span><b>{packet.groupPath.length ? packet.groupPath.join(' → ') : 'Без структура'}</b></div><div><span>НЕУТОЧНЕНИ</span><b>{packet.unresolved.length}</b></div></div>
      <div className="ff-ai-unified-sections">{packet.sections.map((item) => <article key={item.id} className={item.state.toLowerCase().replace('_', '-')}><span>{item.state === 'CAPTURED' ? 'ГОТОВО' : item.state === 'NOT_APPLICABLE' ? 'НЕ Е ПРИЛОЖИМО' : 'НЕУТОЧНЕНО'}</span><b>{item.label}</b><small>{item.summary}</small></article>)}</div>
      {packet.unresolved.length > 0 && <div className="ff-ai-unified-unresolved"><b>Остава за реални данни / проверка</b>{packet.unresolved.map((item) => <span key={item}>• {item}</span>)}</div>}
      <div className="ff-ai-unified-review-actions"><label><input type="checkbox" checked={packet.reviewAccepted} disabled={reviewed} onChange={(event) => setSession((current) => setFacadeFlowDemoReviewAccepted(current, event.target.checked))}/><span>Прегледах DEMO пакета и разбирам, че това не е инженерно потвърждение.</span></label><button type="button" disabled={!packet.reviewAccepted || reviewed} onClick={() => setSession((current) => completeFacadeFlowDemoHumanReview(current))}>{reviewed ? '✓ ЧОВЕШКИ ПРЕГЛЕД · ГОТОВ' : 'Отбележи човешки преглед'}</button></div>
      {reviewed && !rulesReady && <div className="ff-ai-rules-gate-action"><div><span>06C.3.3 · ПРАВИЛА</span><b>Подготви само рамката — без реални правила</b><small>FacadeFlow ще покаже категориите, източниците и приложимостта, които трябва да бъдат попълнени по-късно. Нищо няма да бъде маркирано като проверено.</small></div><button type="button" onClick={() => setSession((current) => prepareFacadeFlowDemoRulesGate(current))}>Подготви рамка за правила</button></div>}
      {packet.ruleGate && <section className="ff-ai-rules-gate" aria-label="Рамка за проверка по правила"><div className="ff-ai-rules-gate-head"><div><span>RULES GATE FOUNDATION</span><h4>Какво трябва да бъде проверено преди преход</h4><p>Това са категории за бъдеща проверка, не инженерни правила. Няма числови ограничения, автоматична валидация или производствено одобрение.</p></div><div><b>РЕАЛНИ ПРАВИЛА: {packet.ruleGate.realRuleCount}</b><small>ИЗТОЧНИКЪТ Е ЗАДЪЛЖИТЕЛЕН · РЕВИЗИЯТА Е ЗАДЪЛЖИТЕЛНА</small></div></div><div className="ff-ai-rules-gate-grid">{packet.ruleGate.requirements.map((item) => <article key={item.id} className={item.state.toLowerCase().replace('_', '-')}><span>{ruleStateLabel(item)}</span><b>{item.label}</b><small>{item.summary}</small><em>Нужен източник: {item.sourceRequirement}</em></article>)}</div><div className="ff-ai-rules-gate-lock"><b>ПРОВЕРКА ПО ПРАВИЛА: НЕ Е ИЗПЪЛНЕНА</b><span>Рамката е готова за бъдещи реални правила. Стъпка 5 остава заключена.</span></div></section>}
      {packet.ruleGate && <RuleSourceRevisionFoundation gate={packet.ruleGate}/>}
      {packet.ruleGate && <RuleApplicabilityFoundation session={session} gate={packet.ruleGate}/>}
      {packet.ruleGate && <RuleEvaluationFoundation session={session} gate={packet.ruleGate}/>}
      {packet.ruleGate && <RuleValidationAggregationFoundation session={session} gate={packet.ruleGate}/>}
      {packet.ruleGate && <RealDataIntakeContractFoundation/>}
      {packet.ruleGate && <RealDataStagingHumanMappingFoundation/>}
      <footer>СТРУКТУРИРАН ПАКЕТ: ДА · ИЗДЕЛИЕ ПОТВЪРДЕНО ОТ ЧОВЕК: НЕ · ПРАВИЛА ПРОВЕРЕНИ: НЕ · ПРОИЗВОДСТВО: ЗАКЛЮЧЕНО</footer>
    </>}
  </section>
}
