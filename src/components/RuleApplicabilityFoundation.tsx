import { buildFacadeFlowRuleApplicabilityFoundation } from '../aiRuleApplicability'
import type { FacadeFlowAiSession, FacadeFlowRuleApplicabilityProductTarget, FacadeFlowRuleGate } from '../aiWorkspaceTypes'

interface Props { session: FacadeFlowAiSession; gate: FacadeFlowRuleGate }

const productTargetLabels: Record<FacadeFlowRuleApplicabilityProductTarget, string> = {
  WINDOW: 'Прозорец', DOOR: 'Врата', SLIDING_SYSTEM: 'Плъзгаща система', FACADE: 'Фасада', TECHNICAL_DETAIL: 'Технически детайл',
}
const projectScopeLabels = { UNRESOLVED: 'Неуточнен', SINGLE_PRODUCT: 'Единично изделие', STRUCTURED_POSITION: 'Структурирана позиция', PROJECT_WIDE: 'Цял проект' } as const

export function RuleApplicabilityFoundation({ session, gate }: Props) {
  const foundation = buildFacadeFlowRuleApplicabilityFoundation(session)
  if (!foundation) return null
  const requirementById = new Map(gate.requirements.map((item) => [item.id, item]))
  return <section className="ff-ai-rule-applicability-foundation" aria-label="Матрица за приложимост на бъдещи правила">
    <div className="ff-ai-rule-applicability-head"><div><span>06C.3.5 · ПРИЛОЖИМОСТ НА ПРАВИЛАТА</span><h4>Къде важи бъдещото правило — без да измисляме самото правило</h4><p>Продуктовият тип, профилната система и проектният контекст са отделни измерения. Реална приложимост се приема само след доказуем източник и човешко потвърждение.</p></div><div><b>РЕАЛНИ РЕШЕНИЯ: {foundation.realApplicabilityDecisionCount}</b><small>ПОТВЪРДЕНИ ОТ ЧОВЕК: {foundation.humanConfirmedDecisionCount}</small><em>ПРАВИЛА ПРОВЕРЕНИ: НЕ</em></div></div>
    <div className="ff-ai-rule-applicability-context"><article><span>ТЕКУЩ DEMO ПРОДУКТ</span><b>{foundation.currentProductTarget ? productTargetLabels[foundation.currentProductTarget] : 'Не е определен'}</b><small>Само контекст на текущата DEMO сесия — не е реално решение за приложимост.</small></article><article><span>ТЕКУЩА СИСТЕМА</span><b>{foundation.currentSystemLabel || 'Неуточнена'}</b><small>{foundation.currentSystemLabel ? 'DEMO / текуща стойност. Реален системен обхват още не е потвърден.' : 'Изисква реална система или семейство системи.'}</small></article><article><span>ПРОЕКТЕН ОБХВАТ</span><b>{projectScopeLabels[foundation.currentProjectScopeMode]}</b><small>{foundation.currentProjectScopeLabel || 'Реалният проектен обхват още не е определен.'}</small></article></div>
    <div className="ff-ai-rule-applicability-targets"><b>ПОДГОТВЕНИ ПРОДУКТОВИ ЦЕЛИ</b><div>{foundation.supportedProductTargets.map((target) => <span key={target}>{productTargetLabels[target]}</span>)}</div><small>Тези типове са само речник за бъдещата матрица. Нито един не се приема автоматично за реално правило.</small></div>
    <div className="ff-ai-rule-applicability-grid">{foundation.rows.map((row) => { const requirement = requirementById.get(row.requirementId); return <article key={row.id}><span>РЕАЛНА ПРИЛОЖИМОСТ: НЕ Е ОПРЕДЕЛЕНА</span><b>{requirement?.label ?? row.requirementId}</b><small>Продукт: — · Система: — · Проект: —</small><em>Източници: 0 · Решение: НЕУТОЧНЕНО · Human Confirmed: НЕ</em></article> })}</div>
    <div className="ff-ai-rule-applicability-policy"><div><b>Три отделни оси</b><span>Тип изделие / продуктова цел + система / семейство + проектен контекст. Липсваща ос означава НЕУТОЧНЕНО, не автоматично „важи за всички“.</span></div><div><b>Плъзгащо и фасада</b><span>Плъзгаща система и фасада са подготвени като отделни цели. Текущото DEMO не им присвоява правила.</span></div><div><b>Точна система</b><span>Бъдещо правило може да е за конкретна система, семейство или изрично за всички системи — но това трябва да бъде заявено и доказано.</span></div><div><b>Човешко решение</b><span>Приложимостта може да се потвърди само с проследим source record. Потвърдена приложимост пак не означава валидирано инженерно правило.</span></div></div>
    <footer>APPLICABILITY DECISIONS: 0 · HUMAN CONFIRMED: 0 · RULES VALIDATED: NO · HANDOFF: LOCKED · MACHINE READY: NO</footer>
  </section>
}
