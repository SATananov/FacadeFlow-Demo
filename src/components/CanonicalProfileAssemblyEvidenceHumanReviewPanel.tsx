import { useMemo, useState } from 'react'
import type { FacadeFlowCanonicalProfileAssignmentBridge } from '../aiCanonicalProfileAssignmentBridge'
import { buildCanonicalProfileTechnicalSemanticsBridge } from '../aiCanonicalProfileTechnicalSemanticsBridge'
import { buildCanonicalProfileCompatibilitySemanticsBridge } from '../aiCanonicalProfileCompatibilitySemanticsBridge'
import { buildCanonicalProfileAssemblyEvidenceBridge } from '../aiCanonicalProfileAssemblyEvidenceBridge'
import {
  buildCanonicalProfileAssemblyEvidenceHumanReviewGate,
  createCanonicalProfileAssemblyEvidenceHumanReviewRecord,
  type CanonicalProfileAssemblyEvidenceHumanDecision,
  type CanonicalProfileAssemblyEvidenceHumanReviewRecord,
} from '../aiCanonicalProfileAssemblyEvidenceHumanReview'

export interface CanonicalProfileAssemblyEvidenceHumanReviewPanelProps {
  bridge: FacadeFlowCanonicalProfileAssignmentBridge
}

const roleBg = {
  FRAME: 'Каса',
  MULLION: 'Делител',
  SASH: 'Крило',
} as const

const decisionLabel: Record<CanonicalProfileAssemblyEvidenceHumanDecision, string> = {
  ACCEPT_CURRENT_EVIDENCE: 'Приемам текущото ниво на доказателство',
  REQUEST_MORE_EVIDENCE: 'Искам още доказателство',
  REJECT_CURRENT_EVIDENCE: 'Отхвърлям текущото доказателство',
}

export function CanonicalProfileAssemblyEvidenceHumanReviewPanel({
  bridge,
}: CanonicalProfileAssemblyEvidenceHumanReviewPanelProps) {
  const technical = useMemo(() => buildCanonicalProfileTechnicalSemanticsBridge(bridge), [bridge])
  const compatibility = useMemo(() => buildCanonicalProfileCompatibilitySemanticsBridge(technical), [technical])
  const evidence = useMemo(() => buildCanonicalProfileAssemblyEvidenceBridge(compatibility), [compatibility])
  const [records, setRecords] = useState<CanonicalProfileAssemblyEvidenceHumanReviewRecord[]>([])
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const gate = useMemo(
    () => buildCanonicalProfileAssemblyEvidenceHumanReviewGate({ bridge: evidence, records }),
    [evidence, records],
  )

  const recordDecision = (
    relation: CanonicalProfileAssemblyEvidenceHumanReviewRecord['relation'],
    decision: CanonicalProfileAssemblyEvidenceHumanDecision,
  ) => {
    const note = notes[relation] ?? ''
    try {
      const record = createCanonicalProfileAssemblyEvidenceHumanReviewRecord(evidence, {
        reviewId: `profile-data03-7:${relation}:${Date.now()}`,
        relation,
        reviewerRole: 'TECHNICAL_REVIEWER',
        reviewedAt: new Date().toISOString(),
        decision,
        note,
      })
      setRecords((current) => [...current.filter((item) => item.relation !== relation), record])
      setErrors((current) => ({ ...current, [relation]: '' }))
    } catch (error) {
      setErrors((current) => ({
        ...current,
        [relation]: error instanceof Error ? error.message : String(error),
      }))
    }
  }

  return (
    <section
      className="ff-ai03-facts"
      aria-label="PROFILE DATA 03.7 assembly evidence human review"
      data-profile-data-step="PROFILE DATA 03.7"
      data-assembly-evidence-human-review-status={gate.status}
    >
      <div className="ff-ai03-card-heading">
        <span>ASSEMBLY EVIDENCE · HUMAN REVIEW</span>
        <b>{gate.status}</b>
      </div>

      <p>
        Човекът преглежда само текущото evidence classification от PROFILE DATA 03.6. Приемането тук не е manufacturer approval,
        не създава verified assembly-node evidence и не валидира exact joint geometry или production compatibility.
      </p>

      {gate.status === 'BLOCKED_UPSTREAM' || gate.status === 'BLOCKED_REVIEW_CONFLICT' ? (
        <div role="alert">
          <strong>Human evidence review е блокиран.</strong>
          <ul>{gate.conflicts.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      ) : (
        <div aria-label="PRELUDE 60 assembly evidence human review rows">
          {gate.rows.map((row) => (
            <article key={row.relation} data-profile-relation={row.relation} data-human-evidence-review-state={row.state}>
              <h4>{roleBg[row.leftRole]} {row.leftProfileCode} ↔ {roleBg[row.rightRole]} {row.rightProfileCode}</h4>
              <p><strong>Evidence maturity:</strong> {row.evidenceMaturity}</p>
              <p><strong>Human review state:</strong> {row.state}</p>
              <p><strong>Decision scope:</strong> CURRENT EVIDENCE CLASSIFICATION ONLY</p>

              <textarea
                aria-label={`Human evidence review note ${row.relation}`}
                value={notes[row.relation] ?? row.note}
                placeholder="Задължителна бележка при искане за още доказателство или отказ"
                onChange={(event) => setNotes((current) => ({ ...current, [row.relation]: event.target.value }))}
              />

              {errors[row.relation] && <p role="alert">{errors[row.relation]}</p>}

              <div>
                {(Object.keys(decisionLabel) as CanonicalProfileAssemblyEvidenceHumanDecision[]).map((decision) => (
                  <button key={decision} type="button" onClick={() => recordDecision(row.relation, decision)}>
                    {decisionLabel[decision]}
                  </button>
                ))}
              </div>

              <p><strong>Manufacturer assembly compatibility:</strong> NOT VALIDATED</p>
              <p><strong>Verified assembly-node evidence:</strong> NO</p>
              <p><strong>Exact joint geometry:</strong> NOT VERIFIED</p>
            </article>
          ))}
        </div>
      )}

      <footer data-safety="HUMAN REVIEW OF CURRENT EVIDENCE ONLY: YES · HUMAN ACCEPTANCE IS MANUFACTURER APPROVAL: NO · VERIFIED ASSEMBLY NODE EVIDENCE CREATED: NO · EXACT JOINT GEOMETRY: NO · PRODUCTION COMPATIBILITY VALIDATED: NO · PRODUCTION UNLOCK: NO · MACHINE READY: NO">
        HUMAN REVIEW НА CURRENT EVIDENCE: ДА · HUMAN ACCEPTANCE ≠ MANUFACTURER APPROVAL · VERIFIED ASSEMBLY NODE EVIDENCE: НЕ · EXACT JOINT GEOMETRY: НЕ · PRODUCTION COMPATIBILITY: НЕ · PRODUCTION UNLOCK: НЕ · ГОТОВО ЗА МАШИНА: НЕ
      </footer>
    </section>
  )
}
