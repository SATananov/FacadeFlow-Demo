import { useMemo, useState } from 'react'
import {
  buildFacadeFlowParametricConstructionProposal,
  humanReviewFacadeFlowParametricProposal,
  type FacadeFlowAi03ParametricProposal,
  type FacadeFlowAi03ProposalField,
} from '../aiParametricConstructionProposal'
import type { FacadeFlowProductIntent } from '../aiProductIntent'

const AI03_SAFETY_MARKERS = 'AUTO-GENERATED PROPOSAL: YES · AUTOMATIC ACCEPTANCE: NO · CONSTRUCTOR HANDOFF: NO · RULES VALIDATED: NO · MACHINE READY: NO'

const roleLabel: Record<FacadeFlowAi03ProposalField['role'], string> = {
  FIXED: 'ФИКСИРАНО',
  OPENING_SASH: 'ОТВАРЯЕМО',
  SLIDING_SASH: 'ПЛЪЗГАЩО',
  PANEL: 'ПАНЕЛ',
  UNRESOLVED: 'НЕУТОЧНЕНО',
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
    fields: proposal.fields.map((field) => [field.id, field.rect, field.role, field.openingType, field.openingDirection]),
    dividers: proposal.dividers.map((divider) => [divider.orientation, divider.positionRatio, divider.basis]),
    assumptions: proposal.assumptions.map((item) => item.id),
    blockers: proposal.blockers,
  })
}

function openingPath(field: FacadeFlowAi03ProposalField, x: number, y: number, width: number, height: number) {
  if (field.role !== 'OPENING_SASH') return null
  const inset = Math.max(5, Math.min(width, height) * 0.08)
  const left = x + inset
  const right = x + width - inset
  const top = y + inset
  const bottom = y + height - inset
  if (field.openingType === 'TILT') return `M ${left} ${top} L ${(left + right) / 2} ${bottom} L ${right} ${top}`
  if (field.openingType === 'TILT_TURN') {
    if (field.openingDirection === 'LEFT') return `M ${left} ${top} L ${right} ${(top + bottom) / 2} L ${left} ${bottom} M ${left} ${top} L ${(left + right) / 2} ${bottom} L ${right} ${top}`
    if (field.openingDirection === 'RIGHT') return `M ${right} ${top} L ${left} ${(top + bottom) / 2} L ${right} ${bottom} M ${left} ${top} L ${(left + right) / 2} ${bottom} L ${right} ${top}`
    return `M ${left} ${top} L ${(left + right) / 2} ${bottom} L ${right} ${top}`
  }
  if (field.openingType === 'TURN' && field.openingDirection === 'LEFT') return `M ${left} ${top} L ${right} ${(top + bottom) / 2} L ${left} ${bottom}`
  if (field.openingType === 'TURN' && field.openingDirection === 'RIGHT') return `M ${right} ${top} L ${left} ${(top + bottom) / 2} L ${right} ${bottom}`
  return null
}

function ProposalDrawing({ proposal }: { proposal: FacadeFlowAi03ParametricProposal }) {
  const canvas = { width: 720, height: 430, left: 72, top: 48, right: 36, bottom: 72 }
  const availableWidth = canvas.width - canvas.left - canvas.right
  const availableHeight = canvas.height - canvas.top - canvas.bottom
  const scale = Math.min(availableWidth / proposal.dimensions.widthMm, availableHeight / proposal.dimensions.heightMm)
  const width = proposal.dimensions.widthMm * scale
  const height = proposal.dimensions.heightMm * scale
  const x = canvas.left + (availableWidth - width) / 2
  const y = canvas.top + (availableHeight - height) / 2

  return <svg className="ff-ai03-drawing" viewBox={`0 0 ${canvas.width} ${canvas.height}`} role="img" aria-label={`AI03 концептуално параметрично предложение ${proposal.dimensions.widthMm} на ${proposal.dimensions.heightMm} милиметра`}>
    <rect className="ff-ai03-frame" x={x} y={y} width={width} height={height}/>
    {proposal.fields.map((field) => {
      const fx = x + field.rect.xRatio * width
      const fy = y + field.rect.yRatio * height
      const fw = field.rect.widthRatio * width
      const fh = field.rect.heightRatio * height
      const path = openingPath(field, fx, fy, fw, fh)
      return <g key={field.id} className={`ff-ai03-field role-${field.role.toLowerCase()}`}>
        <rect x={fx + 4} y={fy + 4} width={Math.max(0, fw - 8)} height={Math.max(0, fh - 8)}/>
        {path && <path className="ff-ai03-opening" d={path}/>} 
        {field.role === 'OPENING_SASH' && !path && <path className="ff-ai03-opening unresolved" d={`M ${fx + 10} ${fy + 10} L ${fx + fw - 10} ${fy + fh - 10}`}/>} 
        <text x={fx + fw / 2} y={fy + Math.min(28, fh * 0.18)}>{`Поле ${field.order + 1}`}</text>
        <text className="ff-ai03-field-role" x={fx + fw / 2} y={fy + Math.min(48, fh * 0.3)}>{roleLabel[field.role]}</text>
      </g>
    })}
    {proposal.dividers.map((divider) => divider.orientation === 'VERTICAL'
      ? <line key={divider.id} className={divider.basis === 'EXPLICIT' ? 'ff-ai03-divider explicit' : 'ff-ai03-divider proposed'} x1={x + divider.positionRatio * width} y1={y} x2={x + divider.positionRatio * width} y2={y + height}/>
      : <line key={divider.id} className={divider.basis === 'EXPLICIT' ? 'ff-ai03-divider explicit' : 'ff-ai03-divider proposed'} x1={x} y1={y + divider.positionRatio * height} x2={x + width} y2={y + divider.positionRatio * height}/>) }
    <line className="ff-ai03-dimension" x1={x} y1={y + height + 28} x2={x + width} y2={y + height + 28}/>
    <text className="ff-ai03-dimension-label" x={x + width / 2} y={y + height + 52}>{proposal.dimensions.widthMm} mm</text>
    <line className="ff-ai03-dimension" x1={x - 28} y1={y} x2={x - 28} y2={y + height}/>
    <text className="ff-ai03-dimension-label vertical" transform={`translate(${x - 48} ${y + height / 2}) rotate(-90)`}>{proposal.dimensions.heightMm} mm</text>
  </svg>
}

export function ParametricConstructionProposalPanel({ intent, sourceLabel, onOpenEditableConstructor }: { intent: FacadeFlowProductIntent; sourceLabel: string; onOpenEditableConstructor?: (proposal: FacadeFlowAi03ParametricProposal) => { ok: boolean; message: string } }) {
  const baseProposal = useMemo(() => buildFacadeFlowParametricConstructionProposal(intent), [intent])
  const fingerprint = useMemo(() => proposalFingerprint(baseProposal), [baseProposal])
  const [reviewFingerprint, setReviewFingerprint] = useState('')
  const [topologyCheckedState, setTopologyCheckedState] = useState(false)
  const [assumptionsAcceptedState, setAssumptionsAcceptedState] = useState(false)
  const [handoffFingerprint, setHandoffFingerprint] = useState('')
  const [handoffMessage, setHandoffMessage] = useState('')
  const isCurrentReview = reviewFingerprint === fingerprint
  const topologyChecked = isCurrentReview && topologyCheckedState
  const assumptionsAccepted = isCurrentReview && assumptionsAcceptedState
  const proposal = humanReviewFacadeFlowParametricProposal(baseProposal, { topologyChecked, assumptionsAccepted })
  const handoffAcknowledged = handoffFingerprint === fingerprint
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
        <span>AI03 · ПАРАМЕТРИЧНО ПРЕДЛОЖЕНИЕ</span>
        <div className="ff-ai03-title-row">
          <h4 id={`${proposal.id}-title`}>{proposal.mark || sourceLabel}</h4>
          <b>{statusLabel[proposal.status]}</b>
        </div>
        <p><strong>Концептуална параметрична конструкция</strong> · 2D предложение от доказаните Product Intent данни. Геометрията не се приема автоматично и не е производствен модел.</p>
      </div>
    </header>

    {proposal.blockers.length > 0 ? <div className="ff-ai03-blocked"><strong>Няма достатъчно доказателства за безопасно геометрично предложение.</strong><ul>{proposal.blockers.map((item) => <li key={item}>{item}</li>)}</ul></div> : <div className="ff-ai03-layout">
      <section className="ff-ai03-canvas" aria-label="2D предложение">
        <div className="ff-ai03-card-heading"><span>2D ПРЕДЛОЖЕНИЕ</span><b>{proposal.dimensions.widthMm} × {proposal.dimensions.heightMm} mm</b></div>
        <ProposalDrawing proposal={proposal}/>
        <small>{proposal.geometryBasis === 'EQUAL_DISTRIBUTION_PROPOSAL' ? 'Пунктираните делители са предложение за равномерно разпределение, а не доказани проектни размери.' : 'Плътните делители са позиционирани според наличните Product Intent доказателства.'}</small>
      </section>
      <aside className="ff-ai03-summary">
        <section className="ff-ai03-facts">
          <div className="ff-ai03-card-heading"><span>КЛЮЧОВИ ДАННИ</span><b>{proposal.fields.length} полета</b></div>
          <dl><div><dt>Източник</dt><dd>{sourceLabel}</dd></div><div><dt>Доказателства</dt><dd>{proposal.evidenceCount}</dd></div><div className="wide"><dt>Основа на геометрията</dt><dd>{geometryBasisLabel(proposal.geometryBasis)}</dd></div><div><dt>Профилна система</dt><dd>{proposal.profileSummary.system || 'неуточнена'}</dd></div><div><dt>Стъкло / пълнеж</dt><dd>{proposal.glazing.description || 'неуточнено'}</dd></div><div><dt>Панти</dt><dd>{proposal.hardwareSummary.hingeQuantity ?? 'неуточнени'}</dd></div><div><dt>Дръжка</dt><dd>{proposal.hardwareSummary.handle || 'неуточнена'}</dd></div></dl>
        </section>
        {proposal.assumptions.length > 0 && <section className="ff-ai03-assumptions"><strong>Предположения за приемане от човек</strong>{proposal.assumptions.map((item) => <div key={item.id}><b>{item.label}</b><span>{item.detail}</span></div>)}</section>}
        <div className="ff-ai03-review-details">
          {proposal.unresolved.length > 0 && <details open className="ff-ai03-unresolved"><summary>Неуточнено ({proposal.unresolved.length})</summary><ul>{proposal.unresolved.map((item) => <li key={item}>{item}</li>)}</ul></details>}
          {proposal.warnings.length > 0 && <details className="ff-ai03-warnings"><summary>Предупреждения ({proposal.warnings.length})</summary><ul>{proposal.warnings.map((item) => <li key={item}>{item}</li>)}</ul></details>}
        </div>
      </aside>
    </div>}

    {!proposal.blockers.length && <div className="ff-ai03-human-gate">
      <div className="ff-ai03-human-gate-head"><span>ЧОВЕШКА ПРОВЕРКА</span><strong>{proposal.status === 'HUMAN_REVIEWED' ? '✓ Предложението е прегледано' : 'Потвърждението е задължително'}</strong></div>
      <label><input type="checkbox" checked={topologyChecked} onChange={(event) => setReview({ topologyChecked: event.target.checked })}/> Проверих визуално броя полета, ролите и общите размери на предложението.</label>
      {proposal.assumptions.length > 0 && <label><input type="checkbox" checked={assumptionsAccepted} onChange={(event) => setReview({ assumptionsAccepted: event.target.checked })}/> Приемам изрично показаните предположения само като концептуална топология за следваща ръчна стъпка.</label>}
      <p>AI03 не прехвърля тази геометрия автоматично към конструктора. Следващият handoff остава отделен и експлицитен.</p>
    </div>}

    {proposal.status === 'HUMAN_REVIEWED' && <section className="ff-ai04-handoff-gate" aria-label="AI04 explicit constructor handoff">
      <div><span>AI04 · ЕКСПЛИЦИТЕН ПРЕХОД КЪМ РЕДАКТИРУЕМА ГЕОМЕТРИЯ</span><strong>Прегледаното предложение може да стане нова editable simulation чернова.</strong><p>AI04 копира само прегледаната геометрия и доказаните съвместими стойности. Не приема профили по подразбиране, не валидира правила и не създава machine-ready модел.</p></div>
      <label><input type="checkbox" checked={handoffAcknowledged} onChange={(event) => { setHandoffFingerprint(event.target.checked ? fingerprint : ''); setHandoffMessage('') }}/> Потвърждавам отделния преход: искам тази човешки прегледана топология да се създаде като редактируема чернова в конструктора.</label>
      <button type="button" className="primary-button" disabled={!handoffAcknowledged || !onOpenEditableConstructor} onClick={() => { if (!onOpenEditableConstructor) return; const result = onOpenEditableConstructor(proposal); setHandoffMessage(result.message) }}>Създай редактируема геометрия в конструктора</button>
      {handoffMessage && <p className="ff-ai04-handoff-message" role="status">{handoffMessage}</p>}
      <footer>AUTOMATIC CONSTRUCTOR HANDOFF: NO · HUMAN-APPROVED PROPOSAL: YES · RULES VALIDATED: NO · MACHINE READY: NO</footer>
    </section>}

    <footer data-safety={AI03_SAFETY_MARKERS}>AI03 предложение: ДА · Автоматично приемане: НЕ · Преход към конструктора: НЕ · Правила валидирани: НЕ · Готово за машина: НЕ</footer>
  </section>
}
