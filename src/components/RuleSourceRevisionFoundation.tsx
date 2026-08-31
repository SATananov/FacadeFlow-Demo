import type { FacadeFlowRuleGate } from '../aiWorkspaceTypes'

interface Props { gate: FacadeFlowRuleGate }

const requiredFields = [
  ['Източник', 'Вид + заглавие + документ / референция'],
  ['Място', 'Страница / ред / детайл или друго точно място'],
  ['Система / обхват', 'За коя система, продукт, позиция или контекст важи'],
  ['Ревизия / дата', 'Ревизията и датата на източника са отделни полета'],
  ['Човешко потвърждение', 'Име на проверилия + момент на прегледа'],
  ['Повторна проверка', 'Задължителна при промяна на източник, място, ревизия, обхват или дата'],
] as const

export function RuleSourceRevisionFoundation({ gate }: Props) {
  return <section className="ff-ai-rule-source-foundation" aria-label="Модел за източници и ревизии на правила">
    <div className="ff-ai-rule-source-head"><div><span>06C.3.4 · ИЗТОЧНИЦИ И РЕВИЗИИ</span><h4>Всяко бъдещо правило трябва да има доказуем произход</h4><p>Това е само моделът за проследимост. Няма въведени инженерни правила, стойности или автоматично одобрени източници.</p></div><div><b>РЕАЛНИ ИЗТОЧНИЦИ: {gate.sourceRecordCount}</b><small>ПОТВЪРДЕНИ ОТ ЧОВЕК: {gate.humanConfirmedSourceCount}</small><em>РЕВИЗИЯ НА НАБОРА: {gate.ruleSetRevision ?? 'НЕ Е СЪЗДАДЕНА'}</em></div></div>
    <div className="ff-ai-rule-source-fields">{requiredFields.map(([label, description]) => <article key={label}><span>ЗАДЪЛЖИТЕЛНО ПОЛЕ</span><b>{label}</b><small>{description}</small></article>)}</div>
    <div className="ff-ai-rule-source-policy"><div><b>Политика за повторен преглед</b><span>Промяна на източник · референция · място · ревизия · система/обхват · дата → човешкото потвърждение се анулира.</span></div><div><b>Правило за ревизия на набора</b><span>Обща ревизия на правилата не се създава, докато няма реални източници, потвърдени от човек.</span></div></div>
    <footer>ИЗТОЧНИЦИ: {gate.sourceRecordCount} · ПОТВЪРДЕНИ ОТ ЧОВЕК: {gate.humanConfirmedSourceCount} · ПРАВИЛА ПРОВЕРЕНИ: НЕ · ПРОИЗВОДСТВО: ЗАКЛЮЧЕНО</footer>
  </section>
}
