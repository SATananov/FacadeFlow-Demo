import { useState } from 'react'
import { interpretFacadeFlowPrompt, type FacadeFlowPromptInterpretationResult } from '../aiPromptInterpreter'
import { facadeFlowPromptIntentToGuidedPatch } from '../aiPromptGuidedBridge'
import { updateFacadeFlowGuidedProduct } from '../aiWorkspaceState'
import type { FacadeFlowAiSession } from '../aiWorkspaceTypes'
import type { CatalogueProfile } from '../profileCatalogueTypes'
import { FacadeFlowIcon } from './FacadeFlowIcons'

export function PromptInterpretationPanel({ session, profiles, setSession }: {
  session: FacadeFlowAiSession
  profiles: CatalogueProfile[]
  setSession: (updater: (current: FacadeFlowAiSession) => FacadeFlowAiSession) => void
}) {
  const [result, setResult] = useState<FacadeFlowPromptInterpretationResult | null>(null)
  const sourceText = session.job.description.trim()
  const stale = Boolean(result && result.sourceText !== sourceText)
  const bridge = result && !stale ? facadeFlowPromptIntentToGuidedPatch(result.intent, profiles) : null
  const analyse = () => setResult(interpretFacadeFlowPrompt(sourceText, `${session.job.id}-prompt-intent`))
  const apply = () => {
    if (!bridge || !result?.validForHumanReview || stale) return
    setSession((current) => updateFacadeFlowGuidedProduct(current, bridge.patch, profiles))
  }

  return <section className="ff-ai-prompt-interpreter" aria-live="polite">
    <div className="ff-ai-prompt-action">
      <button type="button" disabled={!sourceText} onClick={analyse}><FacadeFlowIcon name="ai"/> Разчети описанието</button>
      <span><b>AI01 LOCAL INTERPRETER</b> · без външен модел / без мрежа · резултатът е само предложение за човешка проверка.</span>
    </div>
    {result && <div className={`ff-ai-prompt-result ${stale ? 'stale' : ''}`}>
      <div className="ff-ai-prompt-result-head"><div><span>РАЗПОЗНАТО ОТ ОПИСАНИЕТО</span><strong>{result.recognized.length} стойности · {result.unresolved.length} неуточнени</strong></div><b>{stale ? 'ТЕКСТЪТ Е ПРОМЕНЕН · РАЗЧЕТИ ОТНОВО' : result.validForHumanReview ? 'NEEDS REVIEW' : 'НЕВАЛИДЕН DRAFT'}</b></div>
      <div className="ff-ai-prompt-recognized">{result.recognized.length ? result.recognized.map((item) => <span key={item.id} title={`Източник: ${item.excerpt}`}><small>{item.label}</small><strong>{item.value}</strong><em>{item.confidence === 'HIGH' ? 'HIGH' : 'CHECK'}</em></span>) : <p>Не са намерени достатъчно структурирани стойности. Нищо не е измислено автоматично.</p>}</div>
      {result.unresolved.length > 0 && <div className="ff-ai-prompt-unresolved"><b>НЕУТОЧНЕНО</b><div>{result.unresolved.map((item) => <span key={item}>{item}</span>)}</div></div>}
      {result.warnings.length > 0 && <details className="ff-ai-prompt-warnings"><summary>Предупреждения / граници ({result.warnings.length})</summary><ul>{result.warnings.map((item) => <li key={item}>{item}</li>)}</ul></details>}
      <div className="ff-ai-prompt-bridge"><button type="button" className="primary-button" disabled={stale || !result.validForHumanReview || result.recognized.length === 0} onClick={apply}>Прехвърли разпознатото към формуляра</button><span>{bridge ? `${bridge.transferred.length} съвместими стойности могат да се прехвърлят. ${bridge.notTransferred.length ? 'Топологията остава за отделна човешка/геометрична стъпка.' : ''}` : 'Първо разчети актуалния текст.'}</span></div>
      <em className="ff-ai-prompt-safety">AUTOMATIC GEOMETRY: NO · RULES VALIDATED: NO · MACHINE READY: NO</em>
    </div>}
  </section>
}
