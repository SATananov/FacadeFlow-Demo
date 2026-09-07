import type { FacadeFlowCanonicalProfileAssignmentBridge } from '../aiCanonicalProfileAssignmentBridge'
import { buildCanonicalProfileTechnicalSemanticsBridge } from '../aiCanonicalProfileTechnicalSemanticsBridge'
import { buildCanonicalProfileCompatibilitySemanticsBridge } from '../aiCanonicalProfileCompatibilitySemanticsBridge'
import { buildCanonicalProfileAssemblyEvidenceBridge } from '../aiCanonicalProfileAssemblyEvidenceBridge'

export interface CanonicalProfileAssemblyEvidencePanelProps {
  bridge: FacadeFlowCanonicalProfileAssignmentBridge
}

const roleBg = {
  FRAME: 'Каса',
  MULLION: 'Делител',
  SASH: 'Крило',
} as const

export function CanonicalProfileAssemblyEvidencePanel({
  bridge,
}: CanonicalProfileAssemblyEvidencePanelProps) {
  const technical = buildCanonicalProfileTechnicalSemanticsBridge(bridge)
  const compatibility = buildCanonicalProfileCompatibilitySemanticsBridge(technical)
  const evidenceBridge = buildCanonicalProfileAssemblyEvidenceBridge(compatibility)

  return (
    <section
      className="ff-ai03-facts"
      aria-label="PROFILE DATA 03.6 canonical profile assembly evidence"
      data-profile-data-step="PROFILE DATA 03.6"
      data-assembly-evidence-status={evidenceBridge.status}
    >
      <div className="ff-ai03-card-heading">
        <span>ASSEMBLY EVIDENCE · PROVENANCE LEDGER</span>
        <b>{evidenceBridge.status === 'READY_FOR_HUMAN_REVIEW' ? 'Read-only evidence' : 'Блокирано'}</b>
      </div>

      <p>
        Този слой разделя canonical relation, catalogue same-system evidence, human-reviewed working assembly rule и
        verified assembly-node evidence. Нито един от тези канали не се слива автоматично в manufacturer compatibility.
      </p>

      {evidenceBridge.status !== 'READY_FOR_HUMAN_REVIEW' ? (
        <div role="alert">
          <strong>Assembly evidence layer е блокиран.</strong>
          <ul>{evidenceBridge.conflicts.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      ) : (
        <div aria-label="PRELUDE 60 assembly evidence ledger">
          {evidenceBridge.rows.map((row) => {
            const human = row.evidence.humanWorkingRelationEvidence
            return (
              <article
                key={row.relation}
                data-profile-relation={row.relation}
                data-evidence-maturity={row.evidenceMaturity}
                data-manufacturer-compatibility="NOT_VALIDATED"
              >
                <h4>{roleBg[row.leftRole]} {row.leftProfileCode} ↔ {roleBg[row.rightRole]} {row.rightProfileCode}</h4>
                <p><strong>Canonical relation:</strong> ESTABLISHED · PROFILE DATA 03.5</p>
                <p><strong>Catalogue evidence:</strong> same PRELUDE 60 system membership only · {row.evidence.catalogueSystemEvidence.sourceLabel}</p>
                <p>
                  <strong>Human working assembly evidence:</strong>{' '}
                  {human.state === 'HUMAN_REVIEWED_WORKING_RULE'
                    ? `${human.sashOverlapMm} mm sash-overlap rule · exact production confirmation required`
                    : 'NOT RECORDED FOR THIS RELATION'}
                </p>
                <p><strong>Instance adjacency:</strong> НЕ СЕ ИЗВЕЖДА</p>
                <p><strong>Verified assembly-node evidence:</strong> NOT RECORDED</p>
                <p><strong>Manufacturer assembly compatibility:</strong> NOT VALIDATED</p>
                <p><strong>Exact joint geometry:</strong> NOT VERIFIED</p>
              </article>
            )
          })}
        </div>
      )}

      <footer data-safety="EVIDENCE LEDGER ONLY: YES · CATALOGUE SAME-SYSTEM EVIDENCE ONLY: YES · HUMAN WORKING RULE IS MANUFACTURER APPROVAL: NO · INSTANCE ADJACENCY INFERENCE: NO · VERIFIED ASSEMBLY NODE EVIDENCE: NO · EXACT JOINT GEOMETRY: NO · PRODUCTION COMPATIBILITY VALIDATED: NO · PRODUCTION UNLOCK: NO · MACHINE READY: NO">
        EVIDENCE LEDGER ONLY: ДА · CATALOGUE SAME-SYSTEM EVIDENCE ONLY: ДА · HUMAN WORKING RULE ≠ MANUFACTURER APPROVAL · INSTANCE ADJACENCY INFERENCE: НЕ · VERIFIED ASSEMBLY NODE EVIDENCE: НЕ · EXACT JOINT GEOMETRY: НЕ · PRODUCTION COMPATIBILITY: НЕ · PRODUCTION UNLOCK: НЕ · ГОТОВО ЗА МАШИНА: НЕ
      </footer>
    </section>
  )
}
