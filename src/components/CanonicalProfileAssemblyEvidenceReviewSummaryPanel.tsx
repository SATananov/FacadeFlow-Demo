import { useMemo } from 'react'
import type { CanonicalProfileAssemblyEvidenceHumanReviewGate } from '../aiCanonicalProfileAssemblyEvidenceHumanReview'
import { buildCanonicalProfileAssemblyEvidenceReviewSummary } from '../aiCanonicalProfileAssemblyEvidenceReviewSummary'

interface CanonicalProfileAssemblyEvidenceReviewSummaryPanelProps {
  gate: CanonicalProfileAssemblyEvidenceHumanReviewGate
}

const roleBg = {
  FRAME: 'Каса',
  MULLION: 'Делител',
  SASH: 'Крило',
} as const

const statusBg = {
  BLOCKED_UPSTREAM: 'Блокирано нагоре по веригата',
  BLOCKED_REVIEW_CONFLICT: 'Блокирано от конфликт',
  STALE_REVIEW_REQUIRED: 'Нужен е нов преглед',
  HUMAN_REVIEW_INCOMPLETE: 'Човешкият преглед не е завършен',
  HUMAN_ACTION_REQUIRED: 'Нужно е действие / още доказателство',
  CURRENT_EVIDENCE_ACCEPTED_PRODUCTION_LOCKED: 'Текущото evidence е прието · production locked',
} as const

export function CanonicalProfileAssemblyEvidenceReviewSummaryPanel({
  gate,
}: CanonicalProfileAssemblyEvidenceReviewSummaryPanelProps) {
  const summary = useMemo(() => buildCanonicalProfileAssemblyEvidenceReviewSummary(gate), [gate])

  return (
    <section
      className="ff-ai03-facts"
      aria-label="PROFILE DATA 03.8 assembly evidence review summary"
      data-profile-data-step="PROFILE DATA 03.8"
      data-assembly-evidence-review-summary-status={summary.status}
    >
      <div className="ff-ai03-card-heading">
        <span>ASSEMBLY EVIDENCE · REVIEW SUMMARY</span>
        <b>{statusBg[summary.status]}</b>
      </div>

      <p>
        Това е read-only aggregation на човешките решения от PROFILE DATA 03.7. PASS тук означава единствено, че текущата evidence classification е прегледана и приета; не означава manufacturer approval, verified assembly-node evidence, exact joint geometry или production compatibility.
      </p>

      <div aria-label="Assembly evidence review aggregate counts">
        <p><strong>Relations:</strong> {summary.relationCount}</p>
        <p><strong>Accepted current evidence:</strong> {summary.acceptedCount}</p>
        <p><strong>More evidence required:</strong> {summary.moreEvidenceRequiredCount}</p>
        <p><strong>Rejected:</strong> {summary.rejectedCount}</p>
        <p><strong>Stale:</strong> {summary.staleCount}</p>
        <p><strong>Unreviewed:</strong> {summary.unreviewedCount}</p>
      </div>

      {summary.conflicts.length > 0 && (
        <div role="alert">
          <strong>Review summary е блокиран.</strong>
          <ul>{summary.conflicts.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      )}

      <div aria-label="Assembly evidence review summary relations">
        {summary.rows.map((row) => (
          <article key={row.relation} data-profile-relation={row.relation} data-summary-review-state={row.humanReviewState}>
            <h4>{roleBg[row.leftRole]} {row.leftProfileCode} ↔ {roleBg[row.rightRole]} {row.rightProfileCode}</h4>
            <p><strong>Evidence maturity:</strong> {row.evidenceMaturity}</p>
            <p><strong>Human review:</strong> {row.humanReviewState}</p>
            <p><strong>Current evidence accepted:</strong> {row.acceptedCurrentEvidence ? 'YES' : 'NO'}</p>
          </article>
        ))}
      </div>

      <p><strong>Current evidence classification review gate:</strong> {summary.currentEvidenceClassificationReviewGatePassed ? 'PASS' : 'NO'}</p>
      <p><strong>Manufacturer assembly compatibility:</strong> NOT VALIDATED</p>
      <p><strong>Verified assembly-node evidence:</strong> NO</p>
      <p><strong>Exact joint geometry:</strong> NOT VERIFIED</p>
      <p><strong>Production compatibility:</strong> NOT VALIDATED</p>

      <footer data-safety="SUMMARY ONLY: YES · CURRENT EVIDENCE CLASSIFICATION REVIEW ONLY: YES · HUMAN ACCEPTANCE IS MANUFACTURER APPROVAL: NO · VERIFIED ASSEMBLY NODE EVIDENCE: NO · EXACT JOINT GEOMETRY: NO · AUTOMATIC GEOMETRY: NO · PRODUCTION COMPATIBILITY: NO · PRODUCTION UNLOCK: NO · MACHINE READY: NO">
        SUMMARY ONLY: ДА · ПРИЕТО Е САМО ТЕКУЩОТО НИВО НА EVIDENCE · HUMAN ACCEPTANCE ≠ MANUFACTURER APPROVAL · VERIFIED ASSEMBLY NODE EVIDENCE: НЕ · EXACT JOINT GEOMETRY: НЕ · AUTOMATIC GEOMETRY: НЕ · PRODUCTION COMPATIBILITY: НЕ · PRODUCTION UNLOCK: НЕ · ГОТОВО ЗА МАШИНА: НЕ
      </footer>
    </section>
  )
}
