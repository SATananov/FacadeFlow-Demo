import { useMemo } from 'react'
import type { CanonicalProfileAssemblyEvidenceReadiness } from '../aiCanonicalProfileAssemblyEvidenceReadiness'
import type { CanonicalProfileEvidenceResolutionAggregation } from '../aiCanonicalProfileEvidenceResolutionAggregation'
import type { CanonicalProfileKnowledgeReadinessSummary } from '../aiCanonicalProfileKnowledgeReadinessSummary'
import { buildCanonicalProfileRelationKnowledgeReadiness } from '../aiCanonicalProfileRelationKnowledgeReadiness'
import { buildCanonicalProfileSystemKnowledgeReadiness } from '../aiCanonicalProfileSystemKnowledgeReadiness'
import { buildCanonicalProfileSystemKnowledgeGate } from '../aiCanonicalProfileSystemKnowledgeGate'
import { CanonicalProfileAiKnowledgeContextPanel } from './CanonicalProfileAiKnowledgeContextPanel'

interface Props {
  readiness: CanonicalProfileAssemblyEvidenceReadiness
  aggregation: CanonicalProfileEvidenceResolutionAggregation
  summary: CanonicalProfileKnowledgeReadinessSummary
}

export function CanonicalProfileSystemKnowledgeGatePanel({ readiness, aggregation, summary }: Props) {
  const relationMatrix = useMemo(() => buildCanonicalProfileRelationKnowledgeReadiness({ readiness, aggregation, summary }), [readiness, aggregation, summary])
  const systemReadiness = useMemo(() => buildCanonicalProfileSystemKnowledgeReadiness(relationMatrix), [relationMatrix])
  const gate = useMemo(() => buildCanonicalProfileSystemKnowledgeGate(systemReadiness), [systemReadiness])

  return (
    <section
      className="ff-ai03-facts"
      aria-label="PROFILE DATA 03.18 to 03.20 system knowledge gate bundle"
      data-profile-data-bundle="PROFILE DATA 03.18-03.20"
    >
      <div className="ff-ai03-card-heading">
        <span>SYSTEM KNOWLEDGE GATE · 03.18–03.20</span>
        <b>{gate.status}</b>
      </div>

      <p>
        Relation readiness → profile-system aggregation → read-only AI knowledge gate. Този слой казва къде знанието е
        покрито и къде има дупки. Не валидира производство и не разрешава автоматичен избор или геометрия.
      </p>

      <h4>03.18 · Relation-level knowledge readiness</h4>
      {relationMatrix.rows.map((row) => (
        <article key={row.relation} data-relation-readiness={row.state}>
          <p><strong>{row.relation}</strong> · {row.leftRole} {row.leftProfileCode} ↔ {row.rightRole} {row.rightProfileCode}</p>
          <p>{row.resolvedRequirementCount}/{row.totalRequirementCount} · {row.knowledgeCoveragePercent}% · <strong>{row.state}</strong></p>
          {row.requirements.map((requirement) => (
            <p key={`${row.relation}:${requirement.requirementKind}`}>
              {requirement.requirementKind}: <strong>{requirement.state}</strong>
            </p>
          ))}
        </article>
      ))}

      <h4>03.19 · {systemReadiness.systemLabel} system knowledge readiness</h4>
      <p><strong>Relations:</strong> {systemReadiness.relationCount}</p>
      <p><strong>Complete relations:</strong> {systemReadiness.completeRelationCount}</p>
      <p><strong>Partial relations:</strong> {systemReadiness.partialRelationCount}</p>
      <p><strong>Incomplete relations:</strong> {systemReadiness.incompleteRelationCount}</p>
      <p><strong>System knowledge coverage:</strong> {systemReadiness.knowledgeCoveragePercent}%</p>
      {systemReadiness.unresolvedByRequirementKind.map((gap) => (
        <p key={gap.requirementKind}>
          {gap.requirementKind}: unresolved <strong>{gap.unresolvedCount}</strong> / {gap.totalCount}
        </p>
      ))}

      <h4>03.20 · Overall profile-system knowledge gate</h4>
      <p><strong>AI knowledge diagnostic allowed:</strong> {gate.aiKnowledgeDiagnosticAllowed ? 'YES' : 'NO'}</p>
      <p><strong>AI may describe known coverage:</strong> {gate.aiMayDescribeKnownCoverage ? 'YES' : 'NO'}</p>
      <p><strong>AI may describe knowledge gaps:</strong> {gate.aiMayDescribeKnowledgeGaps ? 'YES' : 'NO'}</p>
      <p><strong>Manufacturer approval:</strong> NO</p>
      <p><strong>Exact joint geometry verified:</strong> NO</p>
      <p><strong>Production compatibility validated:</strong> NO</p>
      <p><strong>Automatic profile selection:</strong> NO</p>
      <p><strong>Automatic geometry:</strong> NO</p>
      <p><strong>Production rules validated:</strong> NO</p>
      <p><strong>Production unlock:</strong> NO</p>
      <p><strong>Machine ready:</strong> NO</p>

      <CanonicalProfileAiKnowledgeContextPanel relationMatrix={relationMatrix} systemReadiness={systemReadiness} gate={gate} />

      <footer data-safety="BUNDLE 03.18-03.20: READ-ONLY KNOWLEDGE DIAGNOSTIC · MANUFACTURER APPROVAL NO · EXACT JOINT GEOMETRY NO · PRODUCTION COMPATIBILITY NO · AUTOMATIC PROFILE SELECTION NO · AUTOMATIC GEOMETRY NO · PRODUCTION UNLOCK NO · MACHINE READY NO">
        03.18–03.20 BUNDLE · READ-ONLY KNOWLEDGE DIAGNOSTIC · PRODUCTION BOUNDARIES ОСТАВАТ ЗАКЛЮЧЕНИ
      </footer>
    </section>
  )
}
