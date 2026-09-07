import { useMemo, useState } from 'react'
import type { CanonicalProfileAssemblyEvidenceReadiness } from '../aiCanonicalProfileAssemblyEvidenceReadiness'
import type { CanonicalProfileAssemblyEvidenceSubmissionRecord } from '../aiCanonicalProfileAssemblyEvidenceIntake'
import {
  buildCanonicalProfileAssemblyEvidenceIntakeHumanReviewGate,
  createCanonicalProfileAssemblyEvidenceIntakeHumanReviewRecord,
  type CanonicalProfileAssemblyEvidenceIntakeHumanDecision,
  type CanonicalProfileAssemblyEvidenceIntakeHumanReviewRecord,
} from '../aiCanonicalProfileAssemblyEvidenceIntakeHumanReview'

interface Props {
  readiness: CanonicalProfileAssemblyEvidenceReadiness
  submissions: readonly CanonicalProfileAssemblyEvidenceSubmissionRecord[]
}

export function CanonicalProfileAssemblyEvidenceIntakeHumanReviewPanel({ readiness, submissions }: Props) {
  const [records, setRecords] = useState<CanonicalProfileAssemblyEvidenceIntakeHumanReviewRecord[]>([])
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const gate = useMemo(
    () => buildCanonicalProfileAssemblyEvidenceIntakeHumanReviewGate({ readiness, submissions, records }),
    [readiness, submissions, records],
  )

  const decide = (submissionId: string, decision: CanonicalProfileAssemblyEvidenceIntakeHumanDecision) => {
    try {
      const record = createCanonicalProfileAssemblyEvidenceIntakeHumanReviewRecord(readiness, submissions, {
        reviewId: `profile-data03-11:${submissionId}:${Date.now()}`,
        submissionId,
        reviewerRole: 'TECHNICAL_REVIEWER',
        reviewedAt: new Date().toISOString(),
        decision,
        note: notes[submissionId] ?? '',
      })
      setRecords((current) => [
        ...current.filter((item) => item.submissionId !== submissionId),
        record,
      ])
      setErrors((current) => ({ ...current, [submissionId]: '' }))
    } catch (error) {
      setErrors((current) => ({ ...current, [submissionId]: error instanceof Error ? error.message : String(error) }))
    }
  }

  return (
    <section
      className="ff-ai03-facts"
      aria-label="PROFILE DATA 03.11 manual evidence human review"
      data-profile-data-step="PROFILE DATA 03.11"
      data-intake-human-review-status={gate.status}
    >
      <div className="ff-ai03-card-heading">
        <span>ASSEMBLY EVIDENCE · SOURCE HUMAN REVIEW</span>
        <b>{gate.status}</b>
      </div>

      <p>
        Човекът преглежда регистрирания source и избира ACCEPT / REJECT / NEEDS_MORE_EVIDENCE. ACCEPT означава само,
        че source-ът е приет на това review ниво. Той още не се прилага към evidence ledger-а, requirement-ът не се
        счита за удовлетворен и maturity не се повишава автоматично.
      </p>

      {gate.conflicts.length > 0 && (
        <div role="alert">
          <strong>Source human review е блокиран.</strong>
          <ul>{gate.conflicts.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      )}

      {gate.rows.map((row) => (
        <article key={row.submissionId} data-submission-review-state={row.state}>
          <h4>{row.relation} · {row.requirementKind}</h4>
          <p><strong>{row.sourceLabel}</strong> · {row.sourceRef}</p>
          <p>Authority: {row.authorityKind}</p>
          <label>
            Human review note
            <input
              value={notes[row.submissionId] ?? ''}
              onChange={(event) => setNotes((current) => ({ ...current, [row.submissionId]: event.target.value }))}
              placeholder="Задължителна при REJECT / NEEDS_MORE_EVIDENCE"
            />
          </label>
          <div>
            <button type="button" onClick={() => decide(row.submissionId, 'ACCEPT_SOURCE')}>ACCEPT source</button>
            <button type="button" onClick={() => decide(row.submissionId, 'NEEDS_MORE_EVIDENCE')}>NEEDS MORE EVIDENCE</button>
            <button type="button" onClick={() => decide(row.submissionId, 'REJECT_SOURCE')}>REJECT source</button>
          </div>
          {errors[row.submissionId] && <p role="alert">{errors[row.submissionId]}</p>}
          <p><strong>Review state:</strong> {row.state}</p>
        </article>
      ))}

      <p><strong>Registered sources:</strong> {gate.registeredSourceCount}</p>
      <p><strong>Accepted at source-review level:</strong> {gate.acceptedSourceCount}</p>
      <p><strong>Rejected:</strong> {gate.rejectedSourceCount}</p>
      <p><strong>Needs more evidence:</strong> {gate.needsMoreEvidenceCount}</p>
      <p><strong>Accepted source applied to evidence ledger:</strong> NO</p>
      <p><strong>Requirement satisfied:</strong> NO</p>
      <p><strong>Evidence maturity auto upgrade:</strong> NO</p>
      <p><strong>Production unlock:</strong> NO</p>

      <footer data-safety="SOURCE HUMAN REVIEW ONLY: YES · ACCEPTED SOURCE APPLIED TO EVIDENCE LEDGER: NO · REQUIREMENT SATISFIED: NO · VALIDATED EVIDENCE CREATED: NO · MANUFACTURER APPROVAL: NO · VERIFIED ASSEMBLY NODE EVIDENCE CREATED: NO · EXACT JOINT GEOMETRY VERIFIED: NO · EVIDENCE MATURITY AUTO UPGRADE: NO · AUTOMATIC GEOMETRY: NO · PRODUCTION COMPATIBILITY: NO · PRODUCTION UNLOCK: NO · MACHINE READY: NO">
        SOURCE HUMAN REVIEW ONLY: ДА · ACCEPTED SOURCE ≠ APPLIED EVIDENCE · REQUIREMENT SATISFIED: НЕ · VALIDATED EVIDENCE: НЕ · MANUFACTURER APPROVAL: НЕ · VERIFIED ASSEMBLY NODE: НЕ · EXACT JOINT GEOMETRY: НЕ · AUTO MATURITY UPGRADE: НЕ · AUTOMATIC GEOMETRY: НЕ · PRODUCTION UNLOCK: НЕ · ГОТОВО ЗА МАШИНА: НЕ
      </footer>
    </section>
  )
}
