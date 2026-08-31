import './RealDataIntakeContractFoundation.css'
import { REAL_DATA_INTAKE_FIELD_DEFINITIONS, REAL_DATA_INTAKE_STATUS_LABELS } from '../aiRealDataIntake'

const groupLabels = {
  PROVENANCE: 'ПРОИЗХОД И ПРОСЛЕДИМОСТ',
  IDENTITY: 'ИДЕНТИЧНОСТ НА ЗАПИСА',
  PRODUCT: 'ПРОДУКТОВИ ДАННИ',
  PROJECT: 'ПРОЕКТЕН КОНТЕКСТ',
  EVIDENCE: 'ВРЪЗКИ КЪМ ДОКАЗАТЕЛСТВА',
} as const

export function RealDataIntakeContractFoundation() {
  const groups = Object.entries(groupLabels).map(([id, label]) => ({ id, label, fields: REAL_DATA_INTAKE_FIELD_DEFINITIONS.filter((item) => item.group === id) }))
  return <section className="ff-ai-real-data-intake" aria-label="Договор за приемане на реални данни">
    <div className="ff-ai-real-data-intake-head"><div><span>06C.3.8 · REAL DATA INTAKE CONTRACT</span><h4>Какво има право да влезе като реален запис</h4><p>Това е договорът за входните данни преди staging. Липсващото остава НЕУТОЧНЕНО, конфликтът се пази като КОНФЛИКТ, а „ГОТОВ ЗА ПРЕГЛЕД“ не означава активен каталог, валидирани правила или производство.</p></div><div><b>РЕАЛНИ ЗАПИСИ: 0</b><small>STAGING: НЕ Е ЗАПОЧНАТ</small><em>AUTO-MAPPING: НЕ</em></div></div>
    <div className="ff-ai-real-data-intake-states">{Object.entries(REAL_DATA_INTAKE_STATUS_LABELS).map(([id, label]) => <article key={id}><b>{label}</b><span>{id === 'UNRESOLVED' ? 'Липсва задължително поле или доказуема стойност.' : id === 'CONFLICT' ? 'Два или повече източника не могат да бъдат слети тихо.' : 'Само задължителният contract е попълнен и записът може да влезе в човешки staging review.'}</span></article>)}</div>
    <div className="ff-ai-real-data-intake-groups">{groups.map((group) => <article key={group.id}><h5>{group.label}</h5>{group.fields.map((field) => <div key={field.id}><span className={field.requirement === 'REQUIRED' ? 'required' : 'conditional'}>{field.requirement === 'REQUIRED' ? 'ЗАДЪЛЖИТЕЛНО' : 'УСЛОВНО'}</span><b>{field.label}</b><small>{field.description}</small></div>)}</article>)}</div>
    <div className="ff-ai-real-data-intake-guardrails"><div><b>Няма автоматично попълване</b><span>Код, размер, рисунка или съседен запис не дават право FacadeFlow да измисля система, роля, отваряемост, обков или друг липсващ атрибут.</span></div><div><b>„Готов за преглед“ ≠ приет</b><span>06C.3.8 не създава staging запис, HUMAN CONFIRMED mapping, активен каталог, rulesValidated или machine-ready.</span></div></div>
    <footer>INTAKE CONTRACT: READY · REAL RECORDS: 0 · STAGING: NOT STARTED · AUTO-MAPPING: NO · ACTIVE DATA: NO · RULES VALIDATED: NO · PRODUCTION: LOCKED · MACHINE READY: NO</footer>
  </section>
}
