import './RealDataStagingHumanMappingFoundation.css'

const workflow = [
  ['1', 'КАРАНТИНА / STAGING', 'Само записи, минали intake contract като „ГОТОВ ЗА ПРЕГЛЕД“, могат да получат staging копие. Оригиналният source snapshot се пази.'],
  ['2', 'HUMAN MAPPING REVIEW', 'Човек решава за всяко поле: запази оригинала, map към canonical стойност или потвърди, че остава неуточнено.'],
  ['3', 'HUMAN CONFIRMED MAPPING', 'Mapping-ът се потвърждава с човек и момент на преглед. Промяна на source или mapping анулира това потвърждение.'],
  ['4', 'ACTIVATION REVIEW', 'Получава се само кандидат за бъдещ активационен преглед. Активните данни, правилата, handoff и production остават заключени.'],
] as const

const columns = [
  ['SOURCE VALUE', 'Оригиналната стойност от доказуемия източник не се презаписва.'],
  ['MAPPING DECISION', 'UNREVIEWED / KEEP SOURCE / MAP TO CANONICAL / ACKNOWLEDGED UNRESOLVED.'],
  ['CANONICAL CANDIDATE', 'Стойност за бъдещия FacadeFlow модел само след изрично човешко решение.'],
  ['EVIDENCE', 'Source/evidence refs се пренасят към staging реда и остават проследими.'],
  ['REVIEWER', 'Човекът, потвърдил mapping-а; никога не се попълва автоматично.'],
] as const

export function RealDataStagingHumanMappingFoundation() {
  return <section className="ff-ai-real-data-staging" aria-label="Staging и човешки mapping review">
    <div className="ff-ai-real-data-staging-head"><div><span>06C.3.9 · STAGING / HUMAN MAPPING REVIEW</span><h4>Реалният запис остава в карантина, докато човек не потвърди mapping-а</h4><p>06C.3.9 подготвя staging слоя между външния source record и бъдещите активни FacadeFlow данни. Няма auto-mapping, няма тихо сливане и няма автоматична активация.</p></div><div><b>STAGING ЗАПИСИ: 0</b><small>HUMAN MAPPED: 0</small><em>ACTIVE DATA: 0 · AUTO-MAPPING: НЕ</em></div></div>
    <div className="ff-ai-real-data-staging-flow">{workflow.map(([step, title, text]) => <article key={step}><span>{step}</span><div><b>{title}</b><small>{text}</small></div></article>)}</div>
    <div className="ff-ai-real-data-staging-table"><header><b>Какво вижда човекът във всеки staging mapping ред</b><span>Нито една canonical стойност не се приема само защото прилича на известен код.</span></header><div>{columns.map(([title, text]) => <article key={title}><b>{title}</b><small>{text}</small></article>)}</div></div>
    <div className="ff-ai-real-data-staging-decisions"><article><b>KEEP SOURCE</b><span>Човек изрично приема оригиналната стойност като canonical кандидат.</span></article><article><b>MAP TO CANONICAL</b><span>Човек въвежда canonical стойност; FacadeFlow не я предлага автоматично.</span></article><article><b>ACKNOWLEDGED UNRESOLVED</b><span>Липсващото остава видимо неуточнено и не се запълва с предположение.</span></article></div>
    <div className="ff-ai-real-data-staging-guardrails"><div><b>Source промяна = нов mapping review</b><span>Промяна на source value, state или evidence snapshot създава нов staging review и анулира старото HUMAN CONFIRMED mapping решение.</span></div><div><b>HUMAN MAPPED ≠ ACTIVE DATA</b><span>След човешкия mapping се създава само кандидат за отделен activation review. Няма persistence, rulesValidated, handoff или machine-ready.</span></div></div>
    <footer>STAGING: READY FOR FUTURE RECORDS · RECORDS: 0 · HUMAN MAPPED: 0 · ACTIVATION REVIEW: LOCKED · ACTIVE DATA: 0 · AUTO-MAPPING: NO · PERSISTENCE: NO · RULES VALIDATED: NO · PRODUCTION: LOCKED · MACHINE READY: NO</footer>
  </section>
}
