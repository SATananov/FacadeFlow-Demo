import { useState } from 'react'
import type { FacadeFlowAi03ParametricProposal } from '../aiParametricConstructionProposal'
import {
  applyFacadeFlowRealUserConversationalEdit,
  buildFacadeFlowRealUserIntegratedSnapshot,
  markFacadeFlowExplicitConstructorHandoff,
  reviewFacadeFlowRealUserConceptualDrawing,
  startFacadeFlowRealUserWorkflowV2V6,
  type FacadeFlowRealUserWorkflowV2V6State,
} from '../aiRealUserWorkflowIntegratedV2V6'
import type { FacadeFlowRealUserWorkflowV1State } from '../aiWorkspaceTypes'
import type { CatalogueProfile } from '../profileCatalogueTypes'

function roleLabel(role: string) {
  if (role === 'FIXED') return 'FIXED'
  if (role === 'OPENING_SASH') return 'OPENING'
  if (role === 'SLIDING_SASH') return 'SLIDING'
  if (role === 'PANEL') return 'PANEL'
  return 'UNRESOLVED'
}

function openingLabel(field: FacadeFlowAi03ParametricProposal['fields'][number]) {
  if (field.role === 'FIXED') return 'FIXED'
  const type = field.openingType && field.openingType !== 'UNRESOLVED' ? field.openingType : roleLabel(field.role)
  const direction = field.openingDirection && field.openingDirection !== 'UNRESOLVED' ? ` ${field.openingDirection}` : ''
  return `${type}${direction}`
}

function ConceptualDrawing({ proposal }: { proposal: FacadeFlowAi03ParametricProposal }) {
  if (proposal.blockers.length) return <div className="ff-rw-v2-drawing-blocked"><b>CONCEPTUAL DRAWING BLOCKED</b>{proposal.blockers.map((item) => <span key={item}>{item}</span>)}</div>
  return <div className="ff-rw-v2-drawing-wrap">
    <svg className="ff-rw-v2-drawing" viewBox="0 0 1000 650" role="img" aria-label="Conceptual product drawing preview">
      <rect x="30" y="30" width="940" height="540" className="ff-rw-v2-frame"/>
      {proposal.dividers.map((divider) => divider.orientation === 'VERTICAL'
        ? <line key={divider.id} x1={30 + 940 * divider.positionRatio} x2={30 + 940 * divider.positionRatio} y1="30" y2="570" className="ff-rw-v2-divider"/>
        : <line key={divider.id} x1="30" x2="970" y1={30 + 540 * divider.positionRatio} y2={30 + 540 * divider.positionRatio} className="ff-rw-v2-divider"/>)}
      {proposal.fields.map((field) => {
        const x = 30 + field.rect.xRatio * 940
        const y = 30 + field.rect.yRatio * 540
        const width = field.rect.widthRatio * 940
        const height = field.rect.heightRatio * 540
        const cx = x + width / 2
        const cy = y + height / 2
        return <g key={field.id}>
          <rect x={x + 5} y={y + 5} width={Math.max(0, width - 10)} height={Math.max(0, height - 10)} className="ff-rw-v2-field"/>
          {field.role === 'OPENING_SASH' && <>
            <line x1={x + 10} y1={y + 10} x2={cx} y2={cy} className="ff-rw-v2-opening"/>
            <line x1={x + width - 10} y1={y + 10} x2={cx} y2={cy} className="ff-rw-v2-opening"/>
            {field.openingType === 'TILT_TURN' && <line x1={cx} y1={y + height - 10} x2={cx} y2={cy} className="ff-rw-v2-opening"/>}
          </>}
          <text x={cx} y={cy + 8} textAnchor="middle" className="ff-rw-v2-field-label">{openingLabel(field)}</text>
        </g>
      })}
      <text x="500" y="620" textAnchor="middle" className="ff-rw-v2-dimension">{proposal.dimensions.widthMm} × {proposal.dimensions.heightMm} mm</text>
    </svg>
    <small>Conceptual preview · пропорционална топология · НЕ е производствен чертеж</small>
  </div>
}

export function RealUserWorkflowV2ToV6Panel({ workflow, milestones, profiles, onSetMilestones, onOpenAi04Constructor }: {
  workflow: FacadeFlowRealUserWorkflowV1State
  milestones: FacadeFlowRealUserWorkflowV2V6State | null | undefined
  profiles: CatalogueProfile[]
  onSetMilestones: (next: FacadeFlowRealUserWorkflowV2V6State) => void
  onOpenAi04Constructor: (proposal: FacadeFlowAi03ParametricProposal) => { ok: boolean; message: string }
}) {
  const [editCommand, setEditCommand] = useState('')
  const [handoffMessage, setHandoffMessage] = useState('')

  if (workflow.requiredQuestionCount > 0) return <section className="ff-rw-v2-v6 ff-rw-v2-v6-blocked">
    <header><span>REAL USER WORKFLOW V2–V6</span><b>ЧАКА V1 УТОЧНЕНИЯ</b></header>
    <p>Първо затвори задължителните човешки уточнения. Conceptual drawing няма да се генерира от непълна structural topology.</p>
  </section>

  if (!milestones) return <section className="ff-rw-v2-v6 ff-rw-v2-v6-start">
    <header><span>REAL USER WORKFLOW V2–V6</span><b>ГОТОВО ЗА СТАРТ</b></header>
    <h4>От разбран prompt към conceptual drawing и контролирана производствена граница</h4>
    <p>Стартира единната верига V2 drawing → V3 conversational edits → V4 profile preparation → V5 production validation gate → V6 manufacturing handoff gate.</p>
    <button type="button" className="primary-button" onClick={() => onSetMilestones(startFacadeFlowRealUserWorkflowV2V6(workflow))}>Стартирай integrated workflow V2–V6</button>
    <small>Няма автоматичен профилен избор, production validation или machine export.</small>
  </section>

  const snapshot = buildFacadeFlowRealUserIntegratedSnapshot(milestones, profiles)
  const lastEdit = milestones.editHistory.at(-1)
  const applyEdit = () => {
    const next = applyFacadeFlowRealUserConversationalEdit(milestones, editCommand)
    onSetMilestones(next)
    if (next !== milestones) setEditCommand('')
    setHandoffMessage('')
  }
  const reviewDrawing = () => {
    onSetMilestones(reviewFacadeFlowRealUserConceptualDrawing(milestones, { topologyChecked: true, assumptionsAccepted: true }))
    setHandoffMessage('')
  }
  const openConstructor = () => {
    if (snapshot.v4.status !== 'READY_FOR_EXPLICIT_CONSTRUCTOR_HANDOFF') return
    const result = onOpenAi04Constructor(snapshot.proposal)
    setHandoffMessage(result.message)
    if (result.ok) onSetMilestones(markFacadeFlowExplicitConstructorHandoff(milestones))
  }

  return <section className="ff-rw-v2-v6">
    <header className="ff-rw-v2-v6-head">
      <div><span>REAL USER WORKFLOW · INTEGRATED MILESTONES</span><h4>V2 → V6 в един работен поток</h4></div>
      <b>{snapshot.v2.humanReviewed ? 'DRAWING HUMAN REVIEWED' : snapshot.v2.status}</b>
    </header>

    <div className="ff-rw-milestone-strip">
      <article className={snapshot.v2.humanReviewed ? 'done' : 'active'}><span>V2</span><b>Conceptual drawing</b><small>{snapshot.v2.humanReviewed ? 'Human reviewed' : 'Needs review'}</small></article>
      <article className={snapshot.v3.editCount ? 'done' : ''}><span>V3</span><b>Conversation edits</b><small>{snapshot.v3.editCount} edits</small></article>
      <article className={snapshot.v4.status === 'READY_FOR_EXPLICIT_CONSTRUCTOR_HANDOFF' ? 'ready' : ''}><span>V4</span><b>Profile construction prep</b><small>{snapshot.v4.status}</small></article>
      <article className="locked"><span>V5</span><b>Production validation</b><small>LOCKED</small></article>
      <article className="locked"><span>V6</span><b>Manufacturing handoff</b><small>LOCKED</small></article>
    </div>

    <div className="ff-rw-v2-grid">
      <div>
        <div className="ff-rw-section-title"><span>V2 · CONCEPTUAL DRAWING HANDOFF</span><b>{snapshot.v2.status}</b></div>
        <ConceptualDrawing proposal={snapshot.proposal}/>
        {snapshot.proposal.assumptions.length > 0 && <div className="ff-rw-assumptions"><b>Conceptual assumptions за човешко приемане</b>{snapshot.proposal.assumptions.map((item) => <span key={item.id}>{item.label}: {item.detail}</span>)}</div>}
        <button type="button" className="primary-button" disabled={!snapshot.v2.conceptualDrawingAvailable || snapshot.v2.humanReviewed} onClick={reviewDrawing}>{snapshot.v2.humanReviewed ? 'Топологията е потвърдена' : snapshot.v2.assumptionCount > 0 ? 'Потвърждавам topology + conceptual assumptions' : 'Потвърждавам conceptual topology'}</button>
      </div>

      <div>
        <div className="ff-rw-section-title"><span>V3 · DRAWING ↔ CONVERSATION EDITING</span><b>CANDIDATE ONLY</b></div>
        <p>Напиши корекция като „средното да е дясно“, „лявото фиксирано“, „2000×1500“, „каса 482.30“, „троен стъклопакет“.</p>
        <div className="ff-rw-edit-command"><input value={editCommand} onChange={(event: { target: { value: string } }) => setEditCommand(event.target.value)} placeholder="Напр. средното да е двуосно надясно"/><button type="button" disabled={!editCommand.trim()} onClick={applyEdit}>Приложи като candidate edit</button></div>
        {lastEdit && <div className={`ff-rw-last-edit ${lastEdit.status === 'APPLIED_CANDIDATE' ? 'ok' : 'needs'}`}><b>{lastEdit.status}</b><span>{lastEdit.messageBg}</span>{lastEdit.changedTargets.length > 0 && <small>{lastEdit.changedTargets.join(' · ')}</small>}</div>}
        <small>Всяка приложена редакция нулира V2 human review. Няма silent geometry mutation.</small>
      </div>
    </div>

    <div className="ff-rw-v4-panel">
      <div className="ff-rw-section-title"><span>V4 · REAL PROFILE CONSTRUCTION PREPARATION</span><b>{snapshot.v4.status}</b></div>
      <div className="ff-rw-profile-prep-grid">{snapshot.v4.profileRoles.map((role) => <article key={role.role} className={role.semanticState === 'EXPLICIT_REVIEWED_WORKING_SEMANTICS' || role.semanticState === 'NOT_REQUIRED' ? 'ok' : 'review'}>
        <span>{role.role}</span><b>{role.labelBg}</b><strong>{role.explicitCode ?? role.prelude60SuggestedCode ?? '—'}</strong><em>{role.semanticState}</em>{role.workingSemantic && <small>{role.workingSemantic}</small>}<p>{role.safetyNote}</p>
      </article>)}</div>
      <div className="ff-rw-constructor-handoff"><button type="button" className="primary-button" disabled={snapshot.v4.status !== 'READY_FOR_EXPLICIT_CONSTRUCTOR_HANDOFF'} onClick={openConstructor}>Изрично предай human-reviewed proposal към конструктора</button><span>{snapshot.handoff.status === 'READY' ? `${snapshot.handoff.transferred.length} елемента са налични за editable simulation draft.` : snapshot.handoff.blockers.join(' · ')}</span></div>
      {handoffMessage && <p className="ff-rw-handoff-message">{handoffMessage}</p>}
    </div>

    <div className="ff-rw-v5-v6-grid">
      <article className="ff-rw-locked-gate">
        <div className="ff-rw-section-title"><span>V5 · PRODUCTION VALIDATION</span><b>LOCKED</b></div>
        <p>Етапът е интегриран, но не може да стане PASS без реални validated engineering rules.</p>
        <ul>{snapshot.v5.blockers.map((item) => <li key={item}>{item}</li>)}</ul>
        <footer>RULES VALIDATED: NO · PRODUCTION COMPATIBILITY: NO · PRODUCTION UNLOCK: NO</footer>
      </article>
      <article className="ff-rw-locked-gate">
        <div className="ff-rw-section-title"><span>V6 · MANUFACTURING HANDOFF</span><b>LOCKED</b></div>
        <p>Бъдещи targets: {snapshot.v6.futureTargets.join(' · ')}. Няма export или machine call от този milestone.</p>
        <ul>{snapshot.v6.blockers.slice(-4).map((item) => <li key={item}>{item}</li>)}</ul>
        <footer>AUTO EXPORT: NO · MACHINE CONNECTIVITY: NO · MACHINE READY: NO</footer>
      </article>
    </div>

    <footer className="ff-rw-v2-v6-safety" data-safety="V2 CONCEPTUAL ONLY · V3 HUMAN CANDIDATE EDITS · V4 EXPLICIT HANDOFF · V5 LOCKED · V6 LOCKED · NO AUTO PROFILE SELECT · NO PRODUCTION RULES · NO MACHINE">
      V2–V4: HUMAN REVIEWED SIMULATION FLOW · V5–V6: INTEGRATED BUT LOCKED · AUTOMATIC PROFILE SELECTION: NO · EXACT JOINT GEOMETRY: NO · RULES VALIDATED: NO · PRODUCTION UNLOCK: NO · MACHINE READY: NO
    </footer>
  </section>
}
