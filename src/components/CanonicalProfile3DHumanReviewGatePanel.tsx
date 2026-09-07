import { useMemo, useState, type ChangeEvent } from 'react'
import type { CanonicalProfile3DInspectionEvidence } from '../aiCanonicalProfile3DInspectionEvidence'
import {
  buildCanonicalProfile3DHumanReviewGate,
  createCanonicalProfile3DHumanReviewRecord,
  type CanonicalProfile3DHumanReviewDecision,
  type CanonicalProfile3DHumanReviewRecord,
} from '../aiCanonicalProfile3DHumanReviewGate'

export interface CanonicalProfile3DHumanReviewGatePanelProps {
  evidence: CanonicalProfile3DInspectionEvidence
}

const STATUS_LABELS = {
  BLOCKED_CONFLICT: 'Блокирано поради конфликт',
  STALE_REVIEW_REQUIRED: 'Нужен е нов човешки преглед',
  HUMAN_REVIEW_INCOMPLETE: 'Човешкият преглед не е завършен',
  HUMAN_CHANGES_REQUIRED: 'Нужна е корекция преди приемане',
  HUMAN_ACCEPTED_PRODUCTION_LOCKED: 'Профилното съответствие е прието · production остава заключено',
} as const

const ROW_STATE_LABELS = {
  UNREVIEWED: 'Непрегледано',
  HUMAN_ACCEPTED: 'Прието от човек',
  HUMAN_CORRECTION_REQUESTED: 'Иска корекция',
  HUMAN_REJECTED: 'Отхвърлено',
  STALE_REVIEW_REQUIRED: 'Старото решение вече не е валидно',
} as const

function keyFor(targetKind: string, targetRef: string) {
  return `${targetKind}:${targetRef}`
}

export function CanonicalProfile3DHumanReviewGatePanel({
  evidence,
}: CanonicalProfile3DHumanReviewGatePanelProps) {
  const [records, setRecords] = useState<CanonicalProfile3DHumanReviewRecord[]>([])
  const [notes, setNotes] = useState<Record<string, string>>({})
  const gate = useMemo(
    () => buildCanonicalProfile3DHumanReviewGate({ evidence, records }),
    [evidence, records],
  )
  const canRecordDecision = evidence.status === 'READY_FOR_HUMAN_INSPECTION' && evidence.conflicts.length === 0

  const recordDecision = (
    targetKind: CanonicalProfile3DInspectionEvidence['rows'][number]['targetKind'],
    targetRef: string,
    decision: CanonicalProfile3DHumanReviewDecision,
  ) => {
    const key = keyFor(targetKind, targetRef)
    const note = notes[key]?.trim() ?? ''
    if (decision !== 'ACCEPT' && !note) return
    const record = createCanonicalProfile3DHumanReviewRecord(evidence, {
      reviewId: `AI0539-${targetKind}-${targetRef}-${Date.now()}`,
      targetKind,
      targetRef,
      reviewerRole: 'TECHNICAL_REVIEWER',
      reviewedAt: new Date().toISOString(),
      decision,
      note,
    })
    setRecords((current) => [
      ...current.filter((item) => keyFor(item.targetKind, item.targetRef) !== key),
      record,
    ])
  }

  const clearDecision = (targetKind: string, targetRef: string) => {
    const key = keyFor(targetKind, targetRef)
    setRecords((current) => current.filter((item) => keyFor(item.targetKind, item.targetRef) !== key))
  }

  return (
    <section
      className="ff-ai03-facts"
      aria-label="AI05.3.9 human 3D profile review gate"
      data-ai-step="AI05.3.9"
      data-review-status={gate.status}
    >
      <div className="ff-ai03-card-heading">
        <span>REAL 3D PROFILE EVIDENCE · HUMAN REVIEW DECISION</span>
        <b>{STATUS_LABELS[gate.status]}</b>
      </div>

      <p>
        Тук човекът приема, иска корекция или отхвърля само доказаното съответствие между canonical profile assignment и реалния conceptual WebGL node. Решението не избира нов профил и не променя геометрията.
      </p>

      <p>
        Прегледани: {gate.reviewedCount}/{gate.rows.length} · Приети: {gate.acceptedCount} · Корекция: {gate.correctionRequestedCount} · Отхвърлени: {gate.rejectedCount}
      </p>

      {gate.conflicts.length > 0 && (
        <div role="alert">
          <strong>Human 3D profile review е блокиран.</strong>
          <ul>{gate.conflicts.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      )}

      <div aria-label="Human decisions за canonical 3D profile evidence">
        {gate.rows.map((row) => {
          const key = keyFor(row.targetKind, row.targetRef)
          const note = notes[key] ?? row.note
          const negativeEnabled = Boolean(note.trim())
          return (
            <article
              key={key}
              data-profile-code={row.profileCode}
              data-human-review-state={row.state}
            >
              <h4>{row.targetKind} · {row.profileCode}</h4>
              <p>{row.systemLabel} · {row.targetRef}</p>
              <p>Real scene nodes: {row.nodeIds.join(', ')}</p>
              <p><strong>{ROW_STATE_LABELS[row.state]}</strong></p>

              <label>
                Бележка за човешкия преглед
                <textarea
                  value={note}
                  placeholder="Задължителна при искане за корекция или отказ"
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setNotes((current) => ({ ...current, [key]: event.target.value }))}
                />
              </label>

              <div aria-label={`Review actions ${key}`}>
                <button type="button" disabled={!canRecordDecision} onClick={() => recordDecision(row.targetKind, row.targetRef, 'ACCEPT')}>
                  Приемам съответствието
                </button>
                <button
                  type="button"
                  disabled={!canRecordDecision || !negativeEnabled}
                  onClick={() => recordDecision(row.targetKind, row.targetRef, 'REQUEST_CORRECTION')}
                >
                  Иска корекция
                </button>
                <button
                  type="button"
                  disabled={!canRecordDecision || !negativeEnabled}
                  onClick={() => recordDecision(row.targetKind, row.targetRef, 'REJECT')}
                >
                  Грешен профил / елемент
                </button>
                <button type="button" onClick={() => clearDecision(row.targetKind, row.targetRef)}>
                  Нулирай решението
                </button>
              </div>
            </article>
          )
        })}
      </div>

      {gate.status === 'HUMAN_ACCEPTED_PRODUCTION_LOCKED' && (
        <div role="status">
          <strong>3D PROFILE REVIEW COMPLETE = YES</strong>
          <p>Canonical profile ↔ real conceptual 3D correspondence е прието от човек. Това не е production approval.</p>
        </div>
      )}

      <footer data-safety="HUMAN DECISION: YES · PROFILE EDITING: NO · AUTOMATIC PROFILE SELECTION: NO · AUTOMATIC GEOMETRY: NO · EXACT PROFILE CONTOUR: NO · RULES VALIDATED: NO · PRODUCTION UNLOCK: NO · MACHINE READY: NO">
        HUMAN DECISION: ДА · РЕДАКЦИЯ НА ПРОФИЛ ТУК: НЕ · АВТОМАТИЧЕН ИЗБОР НА ПРОФИЛ: НЕ · АВТОМАТИЧНА ГЕОМЕТРИЯ: НЕ · ТОЧЕН ПРОФИЛЕН КОНТУР: НЕ · ПРАВИЛА ВАЛИДИРАНИ: НЕ · PRODUCTION UNLOCK: НЕ · ГОТОВО ЗА МАШИНА: НЕ
      </footer>
    </section>
  )
}
