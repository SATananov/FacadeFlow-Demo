import { interpretFacadeFlowPrompt, type FacadeFlowPromptInterpretationResult } from '../aiPromptInterpreter'
import { facadeFlowPromptIntentToGuidedPatch } from '../aiPromptGuidedBridge'
import { setFacadeFlowRealUserWorkflowV1, updateFacadeFlowGuidedProduct } from '../aiWorkspaceState'
import type { FacadeFlowAiSession } from '../aiWorkspaceTypes'
import type { CatalogueProfile } from '../profileCatalogueTypes'
import { FacadeFlowIcon } from './FacadeFlowIcons'
import type { FacadeFlowAi03ParametricProposal } from '../aiParametricConstructionProposal'
import type { FacadeFlowIntentField, FacadeFlowProductIntent } from '../aiProductIntent'
import { ParametricConstructionProposalPanel } from './ParametricConstructionProposalPanel'
import { answerFacadeFlowRealUserWorkflowV1, removeFacadeFlowRealUserWorkflowV1Answer, startFacadeFlowRealUserWorkflowV1 } from '../aiRealUserWorkflowV1'
import { RealUserWorkflowV1Panel } from './RealUserWorkflowV1Panel'


function quickFieldLabel(field: FacadeFlowIntentField) {
  if (field.role === 'FIXED') return 'Фиксирано'
  if (field.role === 'SLIDING_SASH') return field.openingDirection === 'LEFT' ? 'Плъзгащо наляво' : field.openingDirection === 'RIGHT' ? 'Плъзгащо надясно' : 'Плъзгащо'
  if (field.openingType === 'TILT_TURN') return field.openingDirection === 'LEFT' ? 'Двуосно ляво' : field.openingDirection === 'RIGHT' ? 'Двуосно дясно' : 'Двуосно'
  if (field.openingType === 'TURN') return field.openingDirection === 'LEFT' ? 'Отваряемо ляво' : field.openingDirection === 'RIGHT' ? 'Отваряемо дясно' : 'Отваряемо'
  return 'Неуточнено'
}

function quickCategoryLabel(category: FacadeFlowProductIntent['category']) {
  if (category === 'WINDOW') return 'Прозорец'
  if (category === 'DOOR') return 'Врата'
  if (category === 'COMBINED') return 'Плъзгаща / комбинирана конструкция'
  if (category === 'FACADE') return 'Фасаден елемент'
  return 'Неуточнено изделие'
}

export function PromptInterpretationPanel({ session, profiles, setSession, onOpenAi04Constructor, onAnalysisComplete }: {
  session: FacadeFlowAiSession
  profiles: CatalogueProfile[]
  setSession: (updater: (current: FacadeFlowAiSession) => FacadeFlowAiSession) => void
  onOpenAi04Constructor: (proposal: FacadeFlowAi03ParametricProposal) => { ok: boolean; message: string }
  onAnalysisComplete?: (result: FacadeFlowPromptInterpretationResult) => void
}) {
  const workflow = session.job.realUserWorkflow
  const result = workflow?.currentInterpretation ?? null
  const sourceText = session.job.description.replace(/\s+/g, ' ').trim()
  const quickIntent = session.job.quickProductIntent ?? null
  const directQuickActive = Boolean(quickIntent && quickIntent.sourceText.replace(/\s+/g, ' ').trim() === sourceText)
  const directQuickBridge = directQuickActive && quickIntent ? facadeFlowPromptIntentToGuidedPatch(quickIntent, profiles) : null
  const stale = Boolean((workflow && workflow.sourceText !== sourceText) || (result && result.sourceText !== sourceText))
  const bridge = result && !stale ? facadeFlowPromptIntentToGuidedPatch(result.intent, profiles) : null
  const analyse = () => {
    const next = interpretFacadeFlowPrompt(sourceText, `${session.job.id}-prompt-intent`)
    const nextWorkflow = startFacadeFlowRealUserWorkflowV1(next)
    setSession((current) => setFacadeFlowRealUserWorkflowV1(current, nextWorkflow))
    onAnalysisComplete?.(nextWorkflow.currentInterpretation)
  }
  const apply = () => {
    if (!bridge || !result?.validForHumanReview || stale) return
    if ((workflow?.requiredQuestionCount ?? 0) > 0) return
    setSession((current) => updateFacadeFlowGuidedProduct(current, bridge.patch, profiles))
  }
  const answerWorkflowQuestion = (questionId: string, answerText: string, defer: boolean) => {
    if (!workflow) return
    const nextWorkflow = answerFacadeFlowRealUserWorkflowV1({ workflow, questionId, answerText, defer })
    setSession((current) => setFacadeFlowRealUserWorkflowV1(current, nextWorkflow))
    onAnalysisComplete?.(nextWorkflow.currentInterpretation)
  }
  const removeWorkflowAnswer = (target: string) => {
    if (!workflow) return
    const nextWorkflow = removeFacadeFlowRealUserWorkflowV1Answer({ workflow, target })
    setSession((current) => setFacadeFlowRealUserWorkflowV1(current, nextWorkflow))
    onAnalysisComplete?.(nextWorkflow.currentInterpretation)
  }

  if (directQuickActive && quickIntent) {
    const dimensions = `${quickIntent.dimensions.widthMm ?? '—'} × ${quickIntent.dimensions.heightMm ?? '—'} mm`
    const fieldSummary = quickIntent.fields.map(quickFieldLabel).join(' | ')
    const applyDirect = () => {
      if (!directQuickBridge) return
      setSession((current) => updateFacadeFlowGuidedProduct(current, directQuickBridge.patch, profiles))
    }
    return <section className="ff-ai-prompt-interpreter ff-ai-direct-structured" aria-live="polite">
      <div className="ff-ai-prompt-action">
        <span><b>DIRECT STRUCTURED BINDING → CANONICAL PRODUCT INTENT</b> · NLP повторно разчитане: НЕ · изборите от dropdown-а са директният източник.</span>
      </div>
      <div className="ff-ai-prompt-result">
        <div className="ff-ai-prompt-result-head"><div><span>СТРУКТУРИРАНО ОТ БЪРЗИЯ ИЗБОР</span><strong>{quickIntent.fields.length} полета · {quickIntent.unresolved.length} неуточнени</strong></div><b>ИЗИСКВА ПРОВЕРКА</b></div>
        <div className="ff-ai-prompt-recognized">
          <span><small>Изделие</small><strong>{quickCategoryLabel(quickIntent.category)}</strong><em>ИЗРИЧЕН ИЗБОР</em></span>
          <span><small>Размер</small><strong>{dimensions}</strong><em>ИЗРИЧЕН ИЗБОР</em></span>
          <span><small>Количество</small><strong>{quickIntent.quantity ?? '—'}</strong><em>ИЗРИЧЕН ИЗБОР</em></span>
          <span><small>Отваряемост</small><strong>{fieldSummary || '—'}</strong><em>ИЗРИЧЕН ИЗБОР</em></span>
          {quickIntent.profiles.system && <span><small>Система</small><strong>{quickIntent.profiles.system}</strong><em>ИЗРИЧЕН ИЗБОР</em></span>}
        </div>
        {quickIntent.unresolved.length > 0 && <div className="ff-ai-prompt-unresolved"><b>НЕУТОЧНЕНО</b><div>{quickIntent.unresolved.map((item) => <span key={item}>{item}</span>)}</div></div>}
        <div className="ff-ai-prompt-bridge"><button type="button" className="primary-button" disabled={!directQuickBridge} onClick={applyDirect}>Прехвърли структурираното към формуляра</button><span>{directQuickBridge ? `${directQuickBridge.transferred.length} съвместими стойности могат да се прехвърлят. Топологията вече е запазена директно в Canonical Product Intent.` : 'Няма съвместими стойности за формуляра.'}</span></div>
        <ParametricConstructionProposalPanel intent={quickIntent} sourceLabel="Бърз избор · директно структурирано" onOpenEditableConstructor={onOpenAi04Constructor}/>
        <em className="ff-ai-prompt-safety" data-safety="AUTOMATIC GEOMETRY: NO · RULES VALIDATED: NO · MACHINE READY: NO">DIRECT STRUCTURED BINDING: ДА · NLP REPARSE: НЕ · АВТОМАТИЧНА ГЕОМЕТРИЯ: НЕ · ПРАВИЛА ВАЛИДИРАНИ: НЕ · ГОТОВО ЗА МАШИНА: НЕ</em>
      </div>
    </section>
  }

  return <section className="ff-ai-prompt-interpreter" aria-live="polite">
    <div className="ff-ai-prompt-action">
      <button type="button" disabled={!sourceText} onClick={analyse} title={stale ? 'Разчети отново актуалното описание' : 'Разчети описанието и провери какво липсва'}><FacadeFlowIcon name="ai"/> {stale ? 'Разчети отново' : 'Разчети описанието'} {stale ? '' : 'и провери'}</button>
      <span><b>ЛОКАЛНО РАЗЧИТАНЕ → AI ЧЕРТЕЖ</b> · без външен модел / без мрежа · резултатът е само предложение за човешка проверка.</span>
    </div>
    {result && <div className={`ff-ai-prompt-result ${stale ? 'stale' : ''}`}>
      <div className="ff-ai-prompt-result-head"><div><span>РАЗПОЗНАТО ОТ ОПИСАНИЕТО</span><strong>{result.recognized.length} стойности · {result.unresolved.length} неуточнени</strong></div><b>{stale ? 'ТЕКСТЪТ Е ПРОМЕНЕН' : result.validForHumanReview ? 'ИЗИСКВА ПРОВЕРКА' : 'НЕВАЛИДНА ЧЕРНОВА'}</b></div>
      <div className="ff-ai-prompt-recognized">{result.recognized.length ? result.recognized.map((item) => <span key={item.id} title={`Източник: ${item.excerpt}`}><small>{item.label}</small><strong>{item.value}</strong><em>{item.confidence === 'HIGH' ? 'ВИСОКА' : 'ПРОВЕРИ'}</em></span>) : <p>Не са намерени достатъчно структурирани стойности. Нищо не е измислено автоматично.</p>}</div>
      {result.unresolved.length > 0 && <div className="ff-ai-prompt-unresolved"><b>НЕУТОЧНЕНО</b><div>{result.unresolved.map((item) => <span key={item}>{item}</span>)}</div></div>}
      {result.warnings.length > 0 && <details className="ff-ai-prompt-warnings"><summary>Предупреждения / граници ({result.warnings.length})</summary><ul>{result.warnings.map((item) => <li key={item}>{item}</li>)}</ul></details>}
      {!stale && workflow && <RealUserWorkflowV1Panel workflow={workflow} onAnswer={answerWorkflowQuestion} onRemoveAnswer={removeWorkflowAnswer}/>}
      <div className="ff-ai-prompt-bridge"><button type="button" className="primary-button" disabled={stale || !result.validForHumanReview || result.recognized.length === 0 || (workflow?.requiredQuestionCount ?? 0) > 0} onClick={apply}>Прехвърли разпознатото към формуляра</button><span>{(workflow?.requiredQuestionCount ?? 0) > 0 ? `Първо отговори на ${workflow?.requiredQuestionCount ?? 0} задължителни уточнения.` : bridge ? `${bridge.transferred.length} съвместими стойности могат да се прехвърлят. ${bridge.notTransferred.length ? 'Топологията остава за отделна човешка/геометрична стъпка.' : ''}` : 'Първо разчети актуалния текст.'}</span></div>
      {!stale && workflow && workflow.requiredQuestionCount > 0 && <div className="ff-real-user-drawing-wait"><b>AI ЧЕРТЕЖЪТ ЧАКА УТОЧНЕНИЕ</b><span>Отговори на задължителните въпроси по-горе. Няма да се измисля топология или техническа стойност.</span></div>}
      {!stale && result.validForHumanReview && result.recognized.length > 0 && (workflow?.requiredQuestionCount ?? 0) === 0 && <ParametricConstructionProposalPanel intent={result.intent} sourceLabel={workflow?.answers.length ? `Свободно описание + ${workflow.answers.length} човешки уточнения` : 'Свободно описание'} onOpenEditableConstructor={onOpenAi04Constructor}/>}
      <em className="ff-ai-prompt-safety" data-safety="AUTOMATIC GEOMETRY: NO · RULES VALIDATED: NO · MACHINE READY: NO">АВТОМАТИЧНА ГЕОМЕТРИЯ: НЕ · ПРАВИЛА ВАЛИДИРАНИ: НЕ · ГОТОВО ЗА МАШИНА: НЕ</em>
      {!stale && result.validForHumanReview && result.recognized.length > 0 && (workflow?.requiredQuestionCount ?? 0) === 0 && <small className="ff-ai03-legacy-safety-note">Прегледът на параметричното предложение е само предложение; „АВТОМАТИЧНА ГЕОМЕТРИЯ: НЕ“ означава, че CAD геометрия не се приема или прехвърля автоматично.</small>}
    </div>}
  </section>
}
