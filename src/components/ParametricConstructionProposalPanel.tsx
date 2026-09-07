import { useMemo, useState } from 'react'
import {
  buildFacadeFlowParametricConstructionProposal,
  humanReviewFacadeFlowParametricProposal,
  type FacadeFlowAi03ParametricProposal,
} from '../aiParametricConstructionProposal'
import type { FacadeFlowProductIntent } from '../aiProductIntent'
import { buildFacadeFlowConstructionGraph } from '../aiConstructionGraph'
import {
  buildFacadeFlowConstructionDrawing,
  type FacadeFlowConstructionDrawing,
  type FacadeFlowConstructionDrawingField,
} from '../aiConstructionDrawing'
import { aiUiMessageBg } from '../aiUiLanguageBg'
import { resolveFacadeFlowAiDrawingVisualGrammar } from '../aiDrawingVisualGrammar'
import { createOpeningGeometry } from '../visualComposerOpeningGeometry'
import { TechnicalProfileInspector } from './TechnicalProfileInspector'
import { TechnicalZoomModal } from './TechnicalZoomModal'
import { AiDrawingProfileSections } from './AiDrawingProfileSections'
import { facadeFlowAiDrawingCalloutForProfile } from '../aiDrawingProfileSections'
import { buildFacadeFlowCanonicalProfileAssignmentBridge } from '../aiCanonicalProfileAssignmentBridge'
import { buildCanonicalProfileAssignmentWorkspaceReview } from '../aiCanonicalProfileAssignmentWorkspaceReview'
import { CanonicalProfileAssignmentWorkspaceTracePanel } from './CanonicalProfileAssignmentWorkspaceTracePanel'
import { CanonicalProfileRealConceptual3DPanel } from './CanonicalProfileRealConceptual3DPanel'

const AI03_SAFETY_MARKERS = 'AUTO-GENERATED PROPOSAL: YES · AI05.3 GRAPH-DRAWING: YES · AUTOMATIC ACCEPTANCE: NO · EXACT PROFILE CONTOUR: NO · RULES VALIDATED: NO · MACHINE READY: NO'

const drawingRoleLabel: Record<FacadeFlowConstructionDrawingField['semanticRole'], string> = {
  FIXED_FIELD: 'ФИКСИРАНО',
  OPENABLE_FIELD: 'ОТВАРЯЕМО',
  SLIDING_FIELD: 'ПЛЪЗГАЩО',
  PANEL_FIELD: 'ПАНЕЛ',
  UNRESOLVED_FIELD: 'НЕУТОЧНЕНО',
}

const statusLabel: Record<FacadeFlowAi03ParametricProposal['status'], string> = {
  BLOCKED: 'Блокирано',
  NEEDS_REVIEW: 'Нуждае се от преглед',
  HUMAN_REVIEWED: 'Прегледано от човек',
}

function geometryBasisLabel(basis: FacadeFlowAi03ParametricProposal['geometryBasis']) {
  if (basis === 'EQUAL_DISTRIBUTION_PROPOSAL') return 'Равномерно разпределение (предложение)'
  if (basis === 'EXPLICIT_DIVIDERS') return 'Делители от доказателствата'
  return 'Неуточнена'
}

function proposalFingerprint(proposal: FacadeFlowAi03ParametricProposal) {
  return JSON.stringify({
    sourceIntentId: proposal.sourceIntentId,
    dimensions: proposal.dimensions,
    basis: proposal.geometryBasis,
    fields: proposal.fields.map((field) => [field.id, field.rect, field.role, field.openingType, field.openingDirection, field.lowerPanel]),
    dividers: proposal.dividers.map((divider) => [divider.orientation, divider.positionRatio, divider.basis]),
    assumptions: proposal.assumptions.map((item) => item.id),
    blockers: proposal.blockers,
  })
}

function ProposalDrawing({ proposal, drawing, className = '' }: { proposal: FacadeFlowAi03ParametricProposal; drawing: FacadeFlowConstructionDrawing; className?: string }) {
  const canvas = { width: 720, height: 430, left: 72, top: 48, right: 36, bottom: 72 }
  const availableWidth = canvas.width - canvas.left - canvas.right
  const availableHeight = canvas.height - canvas.top - canvas.bottom
  const scale = Math.min(availableWidth / proposal.dimensions.widthMm, availableHeight / proposal.dimensions.heightMm)
  const width = proposal.dimensions.widthMm * scale
  const height = proposal.dimensions.heightMm * scale
  const x = canvas.left + (availableWidth - width) / 2
  const y = canvas.top + (availableHeight - height) / 2

  return <svg className={`ff-ai03-drawing ${className}`.trim()} viewBox={`0 0 ${canvas.width} ${canvas.height}`} role="img" aria-label={`AI05.3 конструктивно 2D предложение ${proposal.dimensions.widthMm} на ${proposal.dimensions.heightMm} милиметра`}>
    <rect className="ff-ai03-frame" x={x} y={y} width={width} height={height}/>
    <text className="ff-ai053-semantic-tag frame" x={x + 8} y={y - 13}>{drawing.frame?.profileRef ? `${facadeFlowAiDrawingCalloutForProfile(drawing.frame.profileRef) ?? '—'} · КАСА · ${drawing.frame.profileRef}` : 'КАСА · профил непотвърден'}</text>
    {drawing.fields.map((field) => {
      const fx = x + field.rect.xRatio * width
      const fy = y + field.rect.yRatio * height
      const fw = field.rect.widthRatio * width
      const fh = field.rect.heightRatio * height
      const visual = resolveFacadeFlowAiDrawingVisualGrammar(field)
      const geometry = visual.composerDirection ? createOpeningGeometry(visual.composerDirection, fx + 14, fy + 14, Math.max(0, fw - 28), Math.max(0, fh - 28)) : null
      const lowerPanelHeight = field.lowerPanel?.heightRatio !== undefined ? fh * field.lowerPanel.heightRatio : null
      const lowerPanelTop = lowerPanelHeight !== null ? fy + fh - lowerPanelHeight : null
      const arrowY = fy + fh / 2
      const arrowLeft = fx + Math.max(22, fw * 0.24)
      const arrowRight = fx + fw - Math.max(22, fw * 0.24)
      return <g key={field.sourceFieldId} className={`ff-ai03-field role-${field.semanticRole.toLowerCase()}`}>
        <rect x={fx + 4} y={fy + 4} width={Math.max(0, fw - 8)} height={Math.max(0, fh - 8)}/>
        {field.lowerPanel && lowerPanelTop !== null && lowerPanelHeight !== null && <g className="ff-ai03-lower-panel">
          <rect className="ff-ai03-lower-panel-zone" x={fx + 17} y={lowerPanelTop} width={Math.max(0, fw - 34)} height={Math.max(0, lowerPanelHeight - 17)}/>
          <line className="ff-ai03-internal-divider" x1={fx + 16} y1={lowerPanelTop} x2={fx + fw - 16} y2={lowerPanelTop}/>
          <text className="ff-ai03-lower-panel-label" x={fx + fw / 2} y={Math.min(fy + fh - 28, lowerPanelTop + Math.max(17, lowerPanelHeight * 0.28))}>{field.lowerPanel.heightMm ? `ДОЛЕН ПАНЕЛ · ${field.lowerPanel.heightMm} mm` : 'ДОЛЕН ПАНЕЛ'}</text>
        </g>}
        {field.lowerPanel && lowerPanelTop === null && <text className="ff-ai03-lower-panel-label unresolved" x={fx + fw / 2} y={fy + fh - 34}>ДОЛЕН ПАНЕЛ · ВИСОЧИНА НЕУТОЧНЕНА</text>}
        {visual.showSashOutline && <rect className="ff-ai03-sash-outline" x={fx + 16} y={fy + 16} width={Math.max(0, fw - 32)} height={Math.max(0, fh - 32)}/>}
        {geometry?.sidePath && <path className="ff-ai03-opening" d={geometry.sidePath}/>}
        {geometry?.tiltPath && <path className="ff-ai03-opening tilt" d={geometry.tiltPath}/>}
        {visual.showSlidingArrow && <g className={`ff-ai03-sliding-arrow${visual.sideDirectionKnown ? '' : ' unresolved'}`}>
          {(visual.sideDirection === 'LEFT' || !visual.sideDirectionKnown) && <><line x1={arrowRight} y1={arrowY} x2={arrowLeft} y2={arrowY}/><path d={`M ${arrowLeft + 8} ${arrowY - 6} L ${arrowLeft} ${arrowY} L ${arrowLeft + 8} ${arrowY + 6}`}/></>}
          {(visual.sideDirection === 'RIGHT' || !visual.sideDirectionKnown) && <><line x1={arrowLeft} y1={arrowY + (visual.sideDirectionKnown ? 0 : 10)} x2={arrowRight} y2={arrowY + (visual.sideDirectionKnown ? 0 : 10)}/><path d={`M ${arrowRight - 8} ${arrowY + (visual.sideDirectionKnown ? -6 : 4)} L ${arrowRight} ${arrowY + (visual.sideDirectionKnown ? 0 : 10)} L ${arrowRight - 8} ${arrowY + (visual.sideDirectionKnown ? 6 : 16)}`}/></>}
        </g>}
        <text x={fx + fw / 2} y={fy + Math.min(28, fh * 0.18)}>{`Поле ${field.order + 1}`}</text>
        <text className="ff-ai03-field-role" x={fx + fw / 2} y={fy + Math.min(48, fh * 0.3)}>{drawingRoleLabel[field.semanticRole]}</text>
        {(field.semanticRole === 'OPENABLE_FIELD' || field.semanticRole === 'SLIDING_FIELD') && <text className={`ff-ai03-opening-label${visual.sideDirectionRequired && !visual.sideDirectionKnown ? ' unresolved' : ''}`} x={fx + fw / 2} y={fy + Math.min(68, fh * 0.42)}>{visual.labelBg}</text>}
        {field.sash && <text className="ff-ai053-semantic-tag sash" x={fx + fw / 2} y={fy + fh - 16}>{field.sash.profileRef ? `${facadeFlowAiDrawingCalloutForProfile(field.sash.profileRef) ?? '—'} · КРИЛО · ${field.sash.profileRef}` : 'КРИЛО · профил непотвърден'}</text>}
      </g>
    })}
    {drawing.mullions.map((mullion) => mullion.orientation === 'VERTICAL'
      ? <g key={`mullion-${mullion.order}`}><line className={mullion.exactPositionKnown ? 'ff-ai03-divider explicit' : 'ff-ai03-divider proposed'} x1={x + mullion.positionRatio * width} y1={y} x2={x + mullion.positionRatio * width} y2={y + height}/><text className="ff-ai053-semantic-tag mullion below" x={x + mullion.positionRatio * width} y={y + height + 13}>{mullion.profileRef ? `${facadeFlowAiDrawingCalloutForProfile(mullion.profileRef) ?? '—'} · ДЕЛ. ${mullion.profileRef}` : 'ДЕЛИТЕЛ · профил непотвърден'}</text></g>
      : <g key={`mullion-${mullion.order}`}><line className={mullion.exactPositionKnown ? 'ff-ai03-divider explicit' : 'ff-ai03-divider proposed'} x1={x} y1={y + mullion.positionRatio * height} x2={x + width} y2={y + mullion.positionRatio * height}/><text className="ff-ai053-semantic-tag mullion" x={x + 8} y={y + mullion.positionRatio * height - 6}>{mullion.profileRef ? `${facadeFlowAiDrawingCalloutForProfile(mullion.profileRef) ?? '—'} · ДЕЛИТЕЛ · ${mullion.profileRef}` : 'ДЕЛИТЕЛ · профил непотвърден'}</text></g>) }
    <line className="ff-ai03-dimension" x1={x} y1={y + height + 28} x2={x + width} y2={y + height + 28}/>
    <text className="ff-ai03-dimension-label" x={x + width / 2} y={y + height + 52}>{proposal.dimensions.widthMm} mm</text>
    <line className="ff-ai03-dimension" x1={x - 28} y1={y} x2={x - 28} y2={y + height}/>
    <text className="ff-ai03-dimension-label vertical" transform={`translate(${x - 48} ${y + height / 2}) rotate(-90)`}>{proposal.dimensions.heightMm} mm</text>
  </svg>
}

export function ParametricConstructionProposalPanel({ intent, sourceLabel, onOpenEditableConstructor }: { intent: FacadeFlowProductIntent; sourceLabel: string; onOpenEditableConstructor?: (proposal: FacadeFlowAi03ParametricProposal) => { ok: boolean; message: string } }) {
  const baseProposal = useMemo(() => buildFacadeFlowParametricConstructionProposal(intent), [intent])
  const constructionGraph = useMemo(() => buildFacadeFlowConstructionGraph(intent), [intent])
  const constructionDrawing = useMemo(() => buildFacadeFlowConstructionDrawing(intent, constructionGraph), [intent, constructionGraph])
  const canonicalProfileBridge = useMemo(
    () => buildFacadeFlowCanonicalProfileAssignmentBridge(intent, constructionGraph, constructionDrawing),
    [intent, constructionGraph, constructionDrawing],
  )
  const canonicalProfileWorkspaceReview = useMemo(
    () => buildCanonicalProfileAssignmentWorkspaceReview(canonicalProfileBridge),
    [canonicalProfileBridge],
  )
  const technicalProfileCodes = useMemo(() => [
    constructionDrawing.frame?.profileRef,
    ...constructionDrawing.fields.map((field) => field.sash?.profileRef),
    ...constructionDrawing.mullions.map((mullion) => mullion.profileRef),
  ].filter((value): value is string => Boolean(value)), [constructionDrawing])
  const fingerprint = useMemo(() => proposalFingerprint(baseProposal), [baseProposal])
  const [reviewFingerprint, setReviewFingerprint] = useState('')
  const [topologyCheckedState, setTopologyCheckedState] = useState(false)
  const [assumptionsAcceptedState, setAssumptionsAcceptedState] = useState(false)
  const [handoffFingerprint, setHandoffFingerprint] = useState('')
  const [handoffMessage, setHandoffMessage] = useState('')
  const [drawingOpen, setDrawingOpen] = useState(true)
  const [drawingZoomOpen, setDrawingZoomOpen] = useState(false)
  const [drawingZoom, setDrawingZoom] = useState(1)
  const [profileInspectorOpen, setProfileInspectorOpen] = useState(false)
  const [profileInspectorCode, setProfileInspectorCode] = useState<string | null>(null)
  const isCurrentReview = reviewFingerprint === fingerprint
  const topologyChecked = isCurrentReview && topologyCheckedState
  const assumptionsAccepted = isCurrentReview && assumptionsAcceptedState
  const proposal = humanReviewFacadeFlowParametricProposal(baseProposal, { topologyChecked, assumptionsAccepted })
  const handoffAcknowledged = handoffFingerprint === fingerprint
  const openProfileInspector = (code: string) => {
    setProfileInspectorCode(code)
    setProfileInspectorOpen(true)
    window.setTimeout(() => document.getElementById('ff-profile-inspector-title')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0)
  }
  const setReview = (patch: { topologyChecked?: boolean; assumptionsAccepted?: boolean }) => {
    const nextTopology = isCurrentReview ? topologyCheckedState : false
    const nextAssumptions = isCurrentReview ? assumptionsAcceptedState : false
    setReviewFingerprint(fingerprint)
    setTopologyCheckedState(patch.topologyChecked ?? nextTopology)
    setAssumptionsAcceptedState(patch.assumptionsAccepted ?? nextAssumptions)
    setHandoffFingerprint('')
    setHandoffMessage('')
  }

  return <section className={`ff-ai03-proposal status-${proposal.status.toLowerCase()}`} aria-labelledby={`${proposal.id}-title`}>
    <header className="ff-ai03-head">
      <div className="ff-ai03-head-copy">
        <span>ПРЕГЛЕД НА ПРЕДЛОЖЕНИЕТО</span>
        <div className="ff-ai03-title-row">
          <h4 id={`${proposal.id}-title`}>{proposal.mark || sourceLabel}</h4>
          <b>{statusLabel[proposal.status]}</b>
        </div>
        <p><strong>Концептуална параметрична конструкция</strong> · 2D предложение от доказаните структурирани продуктови данни. Геометрията не се приема автоматично и не е производствен модел.</p>
      </div>
    </header>

    {proposal.blockers.length > 0 ? <div className="ff-ai03-blocked"><strong>Няма достатъчно доказателства за безопасно геометрично предложение.</strong><ul>{proposal.blockers.map((item) => <li key={item}>{aiUiMessageBg(item)}</li>)}</ul></div> : <div className="ff-ai03-layout">
      <section className="ff-ai03-canvas" aria-label="2D предложение">
        <div className="ff-ai03-card-heading"><span>AI ЧЕРТЕЖ · КОНЦЕПТУАЛЕН 2D</span><div className="ff-ai03-canvas-actions"><b>{proposal.dimensions.widthMm} × {proposal.dimensions.heightMm} mm</b><button type="button" onClick={() => setDrawingOpen((value) => !value)} aria-expanded={drawingOpen}>{drawingOpen ? 'Свий' : 'Разгъни'}</button><button type="button" onClick={() => { setDrawingZoom(1); setDrawingZoomOpen(true) }}>Увеличи</button></div></div>
        {drawingOpen && <><div className="ff-ai03-drawing-stage ff-technical-grid" role="button" tabIndex={0} aria-label="Увеличи концептуалния AI чертеж" onClick={() => { setDrawingZoom(1); setDrawingZoomOpen(true) }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setDrawingZoom(1); setDrawingZoomOpen(true) } }}><span className="ff-technical-zoom-hint">Клик за увеличение</span><ProposalDrawing proposal={proposal} drawing={constructionDrawing}/></div>
        <small><b>НЕ Е ПРОИЗВОДСТВЕНА ГЕОМЕТРИЯ.</b> {constructionDrawing.basis === 'PROPOSED_EQUAL_FIELD_DISTRIBUTION' ? 'Пунктираните делители са автоматично визуално предложение за човешки преглед.' : 'Плътните делители използват вече налични позиции от структурираните продуктови данни.'} Точни сглобени профилни възли, производствени приспадания и допуски не са приложени.</small>
        <AiDrawingProfileSections intent={intent} drawing={constructionDrawing} onInspectProfile={openProfileInspector}/></>}
      </section>
      <aside className="ff-ai03-summary">
        <section className="ff-ai03-facts">
          <div className="ff-ai03-card-heading"><span>КЛЮЧОВИ ДАННИ</span><b>{proposal.fields.length} полета</b></div>
          <dl><div><dt>Източник</dt><dd>{sourceLabel}</dd></div><div><dt>Доказателства</dt><dd>{proposal.evidenceCount}</dd></div><div className="wide"><dt>Основа на геометрията</dt><dd>{geometryBasisLabel(proposal.geometryBasis)}</dd></div><div><dt>Профилна система</dt><dd>{proposal.profileSummary.system || 'неуточнена'}</dd></div><div><dt>Стъкло / пълнеж</dt><dd>{proposal.glazing.description || 'неуточнено'}</dd></div><div><dt>Панти</dt><dd>{proposal.hardwareSummary.hingeQuantity ?? 'неуточнени'}</dd></div><div><dt>Дръжка</dt><dd>{proposal.hardwareSummary.handle || 'неуточнена'}</dd></div></dl>
        </section>
        {proposal.assumptions.length > 0 && <section className="ff-ai03-assumptions"><strong>Предположения за приемане от човек</strong>{proposal.assumptions.map((item) => <div key={item.id}><b>{item.label}</b><span>{aiUiMessageBg(item.detail)}</span></div>)}</section>}
        <div className="ff-ai03-review-details">
          {proposal.unresolved.length > 0 && <details open className="ff-ai03-unresolved"><summary>Неуточнено ({proposal.unresolved.length})</summary><ul>{proposal.unresolved.map((item) => <li key={item}>{item}</li>)}</ul></details>}
          {proposal.warnings.length > 0 && <details className="ff-ai03-warnings"><summary>Предупреждения ({proposal.warnings.length})</summary><ul>{proposal.warnings.map((item) => <li key={item}>{aiUiMessageBg(item)}</li>)}</ul></details>}
        </div>
      </aside>
    </div>}

    {proposal.status !== 'HUMAN_REVIEWED' && <CanonicalProfileAssignmentWorkspaceTracePanel review={canonicalProfileWorkspaceReview}/>}
    {proposal.status === 'HUMAN_REVIEWED' && <CanonicalProfileRealConceptual3DPanel proposal={proposal} drawing={constructionDrawing} bridge={canonicalProfileBridge}/>}

    {!proposal.blockers.length && technicalProfileCodes.length > 0 && <TechnicalProfileInspector key={profileInspectorCode ?? 'profile-inspector'} profileCodes={technicalProfileCodes} requestedCode={profileInspectorCode} open={profileInspectorOpen} onOpenChange={setProfileInspectorOpen}/>}

    {!proposal.blockers.length && <div className="ff-ai03-human-gate">
      <div className="ff-ai03-human-gate-head"><span>ЧОВЕШКА ПРОВЕРКА</span><strong>{proposal.status === 'HUMAN_REVIEWED' ? '✓ Предложението е прегледано' : 'Потвърждението е задължително'}</strong></div>
      <label><input type="checkbox" checked={topologyChecked} onChange={(event) => setReview({ topologyChecked: event.target.checked })}/> Проверих визуално броя полета, ролите и общите размери на предложението.</label>
      {proposal.assumptions.length > 0 && <label><input type="checkbox" checked={assumptionsAccepted} onChange={(event) => setReview({ assumptionsAccepted: event.target.checked })}/> Приемам изрично показаните предположения само като концептуална топология за следваща ръчна стъпка.</label>}
      <p>Това предложение не се прехвърля автоматично към конструктора. Следващият преход остава отделен и изричен.</p>
    </div>}

    {proposal.status === 'HUMAN_REVIEWED' && <section className="ff-ai04-handoff-gate" aria-label="Изричен преход към конструктора">
      <div><span>ПРОДЪЛЖИ В КОНСТРУКТОРА</span><strong>Прегледаното предложение може да стане нова редактируема симулационна чернова.</strong><p>Към конструктора се прехвърлят само прегледаната геометрия и доказаните съвместими стойности. Не приема профили по подразбиране, не валидира правила и не създава модел, готов за машина.</p></div>
      <label><input type="checkbox" checked={handoffAcknowledged} onChange={(event) => { setHandoffFingerprint(event.target.checked ? fingerprint : ''); setHandoffMessage('') }}/> Потвърждавам отделния преход: искам тази човешки прегледана топология да се създаде като редактируема чернова в конструктора.</label>
      <button type="button" className="primary-button" disabled={!handoffAcknowledged || !onOpenEditableConstructor} onClick={() => { if (!onOpenEditableConstructor) return; const result = onOpenEditableConstructor(proposal); setHandoffMessage(result.message) }}>Създай редактируема геометрия в конструктора</button>
      {handoffMessage && <p className="ff-ai04-handoff-message" role="status">{handoffMessage}</p>}
      <footer data-safety="AUTOMATIC CONSTRUCTOR HANDOFF: NO · HUMAN-APPROVED PROPOSAL: YES · RULES VALIDATED: NO · MACHINE READY: NO">АВТОМАТИЧЕН ПРЕХОД КЪМ КОНСТРУКТОРА: НЕ · ПРЕДЛОЖЕНИЕТО Е ОДОБРЕНО ОТ ЧОВЕК: ДА · ПРАВИЛА ВАЛИДИРАНИ: НЕ · ГОТОВО ЗА МАШИНА: НЕ</footer>
    </section>}

    <TechnicalZoomModal open={drawingZoomOpen} title={`AI чертеж · ${proposal.dimensions.widthMm} × ${proposal.dimensions.heightMm} mm`} subtitle="Концептуална топология за човешки преглед · не е производствена геометрия" zoom={drawingZoom} onZoom={setDrawingZoom} onReset={() => setDrawingZoom(1)} onClose={() => setDrawingZoomOpen(false)}>
      <div className="ff-ai03-drawing-modal-wrap"><ProposalDrawing proposal={proposal} drawing={constructionDrawing} className="ff-ai03-drawing-modal"/></div>
    </TechnicalZoomModal>

    <footer data-safety={AI03_SAFETY_MARKERS}>КОНЦЕПТУАЛЕН 2D ЧЕРТЕЖ: ДА · НЕ Е ПРОИЗВОДСТВЕНА ГЕОМЕТРИЯ · ТОЧЕН ПРОФИЛЕН КОНТУР: НЕ · АВТОМАТИЧНО ПРИЕМАНЕ: НЕ · ПРАВИЛА ВАЛИДИРАНИ: НЕ · ГОТОВО ЗА МАШИНА: НЕ</footer>
  </section>
}
