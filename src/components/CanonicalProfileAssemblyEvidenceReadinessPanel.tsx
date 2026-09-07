import { useMemo } from 'react'
import type { CanonicalProfileAssemblyEvidenceReviewSummary } from '../aiCanonicalProfileAssemblyEvidenceReviewSummary'
import {
  buildCanonicalProfileAssemblyEvidenceReadiness,
  type CanonicalProfileAssemblyEvidenceRequirementKind,
} from '../aiCanonicalProfileAssemblyEvidenceReadiness'

interface CanonicalProfileAssemblyEvidenceReadinessPanelProps {
  summary: CanonicalProfileAssemblyEvidenceReviewSummary
}

const roleBg = {
  FRAME: 'Каса',
  MULLION: 'Делител',
  SASH: 'Крило',
} as const

const requirementBg: Record<CanonicalProfileAssemblyEvidenceRequirementKind, string> = {
  HUMAN_WORKING_RELATION_EVIDENCE: 'Human working relation evidence',
  MANUFACTURER_PAIR_RELATION_EVIDENCE: 'Manufacturer pair relation evidence',
  VERIFIED_ASSEMBLY_NODE_EVIDENCE: 'Verified real assembly-node evidence',
  EXACT_JOINT_DOCUMENTATION: 'Exact joint documentation / geometry authority',
}

export function CanonicalProfileAssemblyEvidenceReadinessPanel({
  summary,
}: CanonicalProfileAssemblyEvidenceReadinessPanelProps) {
  const readiness = useMemo(() => buildCanonicalProfileAssemblyEvidenceReadiness(summary), [summary])

  return (
    <section
      className="ff-ai03-facts"
      aria-label="PROFILE DATA 03.9 assembly evidence readiness requirements"
      data-profile-data-step="PROFILE DATA 03.9"
      data-assembly-evidence-readiness-status={readiness.status}
    >
      <div className="ff-ai03-card-heading">
        <span>ASSEMBLY EVIDENCE · READINESS REQUIREMENTS</span>
        <b>{readiness.status}</b>
      </div>

      <p>
        Този слой не създава доказателства. Той показва какво конкретно още липсва в текущия evidence ledger,
        за да може по-късно доверието да се повиши чрез реален източник и човешка проверка.
      </p>

      <div aria-label="Assembly evidence readiness missing counts">
        <p><strong>Missing evidence requirements:</strong> {readiness.totalMissingRequirementCount}</p>
        <p><strong>Human working relation evidence missing:</strong> {readiness.humanWorkingRelationEvidenceMissingCount}</p>
        <p><strong>Manufacturer pair evidence missing:</strong> {readiness.manufacturerPairRelationEvidenceMissingCount}</p>
        <p><strong>Verified assembly-node evidence missing:</strong> {readiness.verifiedAssemblyNodeEvidenceMissingCount}</p>
        <p><strong>Exact joint documentation missing:</strong> {readiness.exactJointDocumentationMissingCount}</p>
      </div>

      {readiness.conflicts.length > 0 && (
        <div role="alert">
          <strong>Evidence readiness е блокиран.</strong>
          <ul>{readiness.conflicts.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      )}

      <div aria-label="Assembly evidence missing requirements by relation">
        {readiness.rows.map((row) => (
          <article key={row.relation} data-profile-relation={row.relation} data-missing-evidence-count={row.missingRequirementCount}>
            <h4>{roleBg[row.leftRole]} {row.leftProfileCode} ↔ {roleBg[row.rightRole]} {row.rightProfileCode}</h4>
            <p><strong>Current maturity:</strong> {row.evidenceMaturity}</p>
            <p><strong>Current human review:</strong> {row.humanReviewState}</p>
            <ul>
              {row.requirements.map((item) => (
                <li key={item.kind} data-missing-evidence-kind={item.kind}>
                  <strong>{requirementBg[item.kind]}:</strong> MISSING · authority needed: {item.authorityNeeded}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <p><strong>Current evidence human-review gate:</strong> {readiness.currentEvidenceHumanReviewGatePassed ? 'PASS' : 'NO'}</p>
      <p><strong>Evidence readiness for production:</strong> NOT VALIDATED</p>
      <p><strong>Automatic evidence generation:</strong> NO</p>
      <p><strong>Production unlock:</strong> NO</p>

      <footer data-safety="REQUIREMENTS ONLY: YES · CREATES EVIDENCE: NO · MANUFACTURER APPROVAL: NO · VERIFIED ASSEMBLY NODE EVIDENCE CREATED: NO · EXACT JOINT GEOMETRY VERIFIED: NO · EVIDENCE MATURITY AUTO UPGRADE: NO · AUTOMATIC GEOMETRY: NO · PRODUCTION COMPATIBILITY: NO · PRODUCTION UNLOCK: NO · MACHINE READY: NO">
        REQUIREMENTS ONLY: ДА · НЕ СЪЗДАВА EVIDENCE · MANUFACTURER APPROVAL: НЕ · VERIFIED ASSEMBLY NODE: НЕ · EXACT JOINT GEOMETRY: НЕ · AUTO MATURITY UPGRADE: НЕ · AUTOMATIC GEOMETRY: НЕ · PRODUCTION COMPATIBILITY: НЕ · PRODUCTION UNLOCK: НЕ · ГОТОВО ЗА МАШИНА: НЕ
      </footer>
    </section>
  )
}
