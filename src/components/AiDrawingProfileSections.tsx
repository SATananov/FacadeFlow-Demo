import type { FacadeFlowProductIntent } from '../aiProductIntent'
import type { FacadeFlowConstructionDrawing } from '../aiConstructionDrawing'
import { buildFacadeFlowAiDrawingProfileSections } from '../aiDrawingProfileSections'

const roleOrder = { FRAME: 0, MULLION: 1, SASH: 2 } as const

export function AiDrawingProfileSections({ intent, drawing, onInspectProfile }: {
  intent: FacadeFlowProductIntent
  drawing: FacadeFlowConstructionDrawing
  onInspectProfile?: (code: string) => void
}) {
  const model = buildFacadeFlowAiDrawingProfileSections(intent, drawing)
  const sections = model.sections.slice().sort((a, b) => roleOrder[a.role] - roleOrder[b.role])

  if (!model.systemSupported) return null

  return <section className="ff-ai-profile-sections" aria-label="Профилни сечения към AI скицата">
    <header className="ff-ai-profile-sections-head">
      <div>
        <span>AI DRAWING PROFILE SECTIONS 01 · СЪЩАТА ТЕХНИЧЕСКА СКИЦА</span>
        <strong>Профилни сечения към изгледа</strong>
        <small>Показват се само точни кодове, изрично зададени за това изделие. Самата форма е директно извлечена от PRELUDE каталога; AI не прерисува профила.</small>
      </div>
      <b>CATALOGUE VISUAL TRUTH</b>
    </header>

    {sections.length > 0 && <div className="ff-ai-profile-section-reading-guide" aria-label="Как да четеш профилните сечения">
      <strong>Как да четеш тази част от скицата</strong>
      <span><b>A-A</b> = каса · външният профил на изделието</span>
      <span><b>B-B</b> = делител · профилът между две полета</span>
      <span><b>C-C</b> = крило · профилът на отваряемото поле</span>
      <small>Не е нужно да отваряш големия инспектор, ако тези три карти са ти достатъчни. Използвай „Разгледай подробно“ само когато искаш увеличение и измервателните данни.</small>
    </div>}

    {sections.length > 0 && <div className="ff-ai-profile-section-grid">
      {sections.map((section) => <article key={`${section.role}-${section.code}`} className={`role-${section.role.toLowerCase()}`}>
        <div className="ff-ai-profile-section-title">
          <span>{section.callout}</span>
          <div><strong>{section.roleLabelBg} · {section.code}</strong><small>ИЗРИЧНО ЗАДАДЕН ПРОФИЛ</small></div>
        </div>
        <div className="ff-ai-profile-section-image ff-technical-grid">
          <img src={section.catalogueAsset} alt={`${section.callout} каталогово сечение PRELUDE ${section.code} ${section.roleLabelBg}`}/>
        </div>
        <dl>
          <div><dt>Каталог</dt><dd>{section.sourcePdf} · стр. {section.sourcePage}</dd></div>
          <div><dt>Системна дълбочина</dt><dd>{section.systemDepthMm} mm</dd></div>
          <div><dt>Каталогов размер</dt><dd>{section.catalogueOverallExtentMm ?? '—'}{section.catalogueOverallExtentMm ? ' mm' : ''}</dd></div>
          <div><dt>Каталогова видима стойност</dt><dd>{section.catalogueVisibleMm ?? '—'}{section.catalogueVisibleMm ? ' mm' : ''}</dd></div>
        </dl>
        <div className="ff-ai-profile-section-human"><span>НАДЕЖДА · БАТ ТРИФОН · HUMAN CONFIRMED</span><code>{section.humanFormulaBg}</code><small>{section.humanNoteBg}</small></div>
        {onInspectProfile && <button type="button" className="ff-ai-profile-section-inspect" onClick={() => onInspectProfile(section.code)}>Разгледай подробно · {section.code}</button>}
      </article>)}
    </div>}

    {model.missingRoles.length > 0 && <div className="ff-ai-profile-sections-missing">
      <strong>Липсва точен профилен код за: {model.missingRoles.map((role) => role === 'FRAME' ? 'каса' : role === 'MULLION' ? 'делител' : 'крило').join(', ')}.</strong>
      <span>FacadeFlow няма да избере код автоматично само защото системата е PRELUDE 60. Избери точния код от „Технически настройки“ в Quick Select или го задай изрично в AI описанието.</span>
    </div>}

    {!sections.length && !model.missingRoles.length && <div className="ff-ai-profile-sections-missing"><strong>Няма приложими профилни роли в текущата конструкция.</strong></div>}

    <footer data-safety="CATALOGUE VISUAL SOURCE: YES · AI REDRAWN PROFILE: NO · AUTOMATIC PROFILE ASSIGNMENT: NO · EXACT ASSEMBLY: NO · MACHINE READY: NO · PRODUCTION APPROVED: NO">
      КАТАЛОГОВА ФОРМА: ДА · AI ПРЕРИСУВАНЕ НА ПРОФИЛА: НЕ · АВТОМАТИЧЕН ИЗБОР НА ПРОФИЛ: НЕ · ТОЧЕН СГЛОБЕН ВЪЗЕЛ: НЕ · ГОТОВО ЗА МАШИНА: НЕ · ОДОБРЕНО ЗА ПРОИЗВОДСТВО: НЕ
    </footer>
  </section>
}
