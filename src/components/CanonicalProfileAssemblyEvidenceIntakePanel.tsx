import { useMemo, useState } from 'react'
import type { CanonicalProfileAssemblyEvidenceReadiness } from '../aiCanonicalProfileAssemblyEvidenceReadiness'
import {
  buildCanonicalProfileAssemblyEvidenceIntakeLedger,
  createCanonicalProfileAssemblyEvidenceSubmissionRecord,
  type CanonicalProfileAssemblyEvidenceSubmissionRecord,
} from '../aiCanonicalProfileAssemblyEvidenceIntake'

interface CanonicalProfileAssemblyEvidenceIntakePanelProps {
  readiness: CanonicalProfileAssemblyEvidenceReadiness
}

const roleBg = {
  FRAME: 'Каса',
  MULLION: 'Делител',
  SASH: 'Крило',
} as const

export function CanonicalProfileAssemblyEvidenceIntakePanel({
  readiness,
}: CanonicalProfileAssemblyEvidenceIntakePanelProps) {
  const [records, setRecords] = useState<CanonicalProfileAssemblyEvidenceSubmissionRecord[]>([])
  const [sourceLabels, setSourceLabels] = useState<Record<string, string>>({})
  const [sourceRefs, setSourceRefs] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const ledger = useMemo(
    () => buildCanonicalProfileAssemblyEvidenceIntakeLedger({ readiness, records }),
    [readiness, records],
  )

  const register = (relation: typeof readiness.rows[number]['relation'], requirementKind: typeof readiness.rows[number]['requirements'][number]['kind']) => {
    const row = readiness.rows.find((item) => item.relation === relation)
    const requirement = row?.requirements.find((item) => item.kind === requirementKind)
    const key = `${relation}:${requirementKind}`
    if (!requirement) return
    try {
      const record = createCanonicalProfileAssemblyEvidenceSubmissionRecord(readiness, {
        submissionId: `profile-data03-10:${key}:${Date.now()}`,
        relation,
        requirementKind,
        authorityKind: requirement.authorityNeeded,
        sourceLabel: sourceLabels[key] ?? '',
        sourceRef: sourceRefs[key] ?? '',
        submittedByRole: 'TECHNICAL_USER',
        submittedAt: new Date().toISOString(),
        note: notes[key] ?? '',
      })
      setRecords((current) => [
        ...current.filter((item) => !(item.relation === relation && item.requirementKind === requirementKind)),
        record,
      ])
      setErrors((current) => ({ ...current, [key]: '' }))
    } catch (error) {
      setErrors((current) => ({ ...current, [key]: error instanceof Error ? error.message : String(error) }))
    }
  }

  return (
    <section
      className="ff-ai03-facts"
      aria-label="PROFILE DATA 03.10 manual assembly evidence intake"
      data-profile-data-step="PROFILE DATA 03.10"
      data-assembly-evidence-intake-status={ledger.status}
    >
      <div className="ff-ai03-card-heading">
        <span>ASSEMBLY EVIDENCE · MANUAL INTAKE</span>
        <b>{ledger.status}</b>
      </div>

      <p>
        Тук човек може само да регистрира източник за липсващо evidence. Регистрацията не означава, че източникът е проверен,
        не удовлетворява requirement-а и не повишава evidence maturity. Следва отделен human review.
      </p>

      {ledger.conflicts.length > 0 && (
        <div role="alert">
          <strong>Manual evidence intake е блокиран.</strong>
          <ul>{ledger.conflicts.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      )}

      <div aria-label="Manual evidence registration forms">
        {readiness.rows.map((row) => (
          <article key={row.relation} data-profile-relation={row.relation}>
            <h4>{roleBg[row.leftRole]} {row.leftProfileCode} ↔ {roleBg[row.rightRole]} {row.rightProfileCode}</h4>
            {row.requirements.map((requirement) => {
              const key = `${row.relation}:${requirement.kind}`
              const registered = ledger.rows.find((item) => item.relation === row.relation && item.requirementKind === requirement.kind)
              return (
                <div key={requirement.kind} data-manual-evidence-kind={requirement.kind}>
                  <p><strong>{requirement.kind}</strong> · authority: {requirement.authorityNeeded}</p>
                  <label>
                    Source label
                    <input
                      value={sourceLabels[key] ?? ''}
                      onChange={(event) => setSourceLabels((current) => ({ ...current, [key]: event.target.value }))}
                      placeholder="Напр. PRELUDE 60 technical sheet"
                    />
                  </label>
                  <label>
                    Source reference
                    <input
                      value={sourceRefs[key] ?? ''}
                      onChange={(event) => setSourceRefs((current) => ({ ...current, [key]: event.target.value }))}
                      placeholder="Файл / страница / документ / assembly-node ref"
                    />
                  </label>
                  <label>
                    Note
                    <input
                      value={notes[key] ?? ''}
                      onChange={(event) => setNotes((current) => ({ ...current, [key]: event.target.value }))}
                      placeholder="По желание"
                    />
                  </label>
                  <button type="button" onClick={() => register(row.relation, requirement.kind)}>
                    Регистрирай source · pending human review
                  </button>
                  {errors[key] && <p role="alert">{errors[key]}</p>}
                  {registered && (
                    <p data-registration-state={registered.state}>
                      {registered.state} · {registered.sourceLabel} · {registered.sourceRef}
                    </p>
                  )}
                </div>
              )
            })}
          </article>
        ))}
      </div>

      <p><strong>Registered:</strong> {ledger.registeredCount}</p>
      <p><strong>Pending human review:</strong> {ledger.pendingHumanReviewCount}</p>
      <p><strong>Stale registrations:</strong> {ledger.staleRegistrationCount}</p>
      <p><strong>Missing requirements preserved:</strong> {ledger.missingRequirementCountPreserved}</p>
      <p><strong>Registered submission is accepted evidence:</strong> NO</p>
      <p><strong>Production unlock:</strong> NO</p>

      <footer data-safety="REGISTRATION ONLY: YES · HUMAN REVIEW REQUIRED: YES · REGISTERED SOURCE IS ACCEPTED EVIDENCE: NO · REQUIREMENT SATISFIED: NO · MANUFACTURER APPROVAL: NO · VERIFIED ASSEMBLY NODE EVIDENCE CREATED: NO · EXACT JOINT GEOMETRY VERIFIED: NO · EVIDENCE MATURITY AUTO UPGRADE: NO · AUTOMATIC GEOMETRY: NO · PRODUCTION COMPATIBILITY: NO · PRODUCTION UNLOCK: NO · MACHINE READY: NO">
        REGISTRATION ONLY: ДА · HUMAN REVIEW REQUIRED: ДА · REGISTERED SOURCE ≠ ACCEPTED EVIDENCE · REQUIREMENT SATISFIED: НЕ · MANUFACTURER APPROVAL: НЕ · VERIFIED ASSEMBLY NODE: НЕ · EXACT JOINT GEOMETRY: НЕ · AUTO MATURITY UPGRADE: НЕ · AUTOMATIC GEOMETRY: НЕ · PRODUCTION UNLOCK: НЕ · ГОТОВО ЗА МАШИНА: НЕ
      </footer>
    </section>
  )
}
