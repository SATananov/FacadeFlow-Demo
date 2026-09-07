import { useMemo, useState } from 'react'
import type { CanonicalProfileAssemblyEvidenceReadiness } from '../aiCanonicalProfileAssemblyEvidenceReadiness'
import type { CanonicalProfileCandidateEvidenceLedger } from '../aiCanonicalProfileCandidateEvidenceLedger'
import type { CanonicalProfileEvidenceRequirementReviewRecord } from '../aiCanonicalProfileEvidenceRequirementSatisfaction'
import {
  buildCanonicalProfileEvidenceResolutionGate,
  createCanonicalProfileEvidenceResolutionRecord,
  type CanonicalProfileEvidenceResolutionDecision,
  type CanonicalProfileEvidenceResolutionRecord,
} from '../aiCanonicalProfileEvidenceResolutionDecision'
import { buildCanonicalProfileEvidenceResolutionAggregation } from '../aiCanonicalProfileEvidenceResolutionAggregation'
import { buildCanonicalProfileKnowledgeReadinessSummary } from '../aiCanonicalProfileKnowledgeReadinessSummary'
import { CanonicalProfileSystemKnowledgeGatePanel } from './CanonicalProfileSystemKnowledgeGatePanel'

interface Props {
  readiness: CanonicalProfileAssemblyEvidenceReadiness
  ledger: CanonicalProfileCandidateEvidenceLedger
  requirementReviews: readonly CanonicalProfileEvidenceRequirementReviewRecord[]
}

export function CanonicalProfileKnowledgeReadinessBundlePanel({ readiness, ledger, requirementReviews }: Props) {
  const [resolutionRecords, setResolutionRecords] = useState<CanonicalProfileEvidenceResolutionRecord[]>([])
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const resolutionGate = useMemo(() => buildCanonicalProfileEvidenceResolutionGate({
    readiness,
    ledger,
    requirementReviews,
    records: resolutionRecords,
  }), [readiness, ledger, requirementReviews, resolutionRecords])

  const aggregation = useMemo(() => buildCanonicalProfileEvidenceResolutionAggregation({
    readiness,
    ledger,
    requirementReviews,
    resolutionRecords,
  }), [readiness, ledger, requirementReviews, resolutionRecords])

  const summary = useMemo(() => buildCanonicalProfileKnowledgeReadinessSummary(aggregation), [aggregation])

  const decide = (candidateEvidenceId: string, decision: CanonicalProfileEvidenceResolutionDecision) => {
    try {
      const record = createCanonicalProfileEvidenceResolutionRecord({
        readiness,
        ledger,
        requirementReviews,
        resolution: {
          resolutionId: `profile-data03-15:${candidateEvidenceId}:${Date.now()}`,
          candidateEvidenceId,
          reviewerRole: 'TECHNICAL_REVIEWER',
          decidedAt: new Date().toISOString(),
          decision,
          note: notes[candidateEvidenceId] ?? '',
        },
      })
      setResolutionRecords((current) => [
        ...current.filter((item) => item.candidateEvidenceId !== candidateEvidenceId),
        record,
      ])
      setErrors((current) => ({ ...current, [candidateEvidenceId]: '' }))
    } catch (error) {
      setErrors((current) => ({ ...current, [candidateEvidenceId]: error instanceof Error ? error.message : String(error) }))
    }
  }

  return (
    <section
      className="ff-ai03-facts"
      aria-label="PROFILE DATA 03.15 to 03.17 knowledge readiness bundle"
      data-profile-data-bundle="PROFILE DATA 03.15-03.17"
    >
      <div className="ff-ai03-card-heading">
        <span>KNOWLEDGE READINESS BUNDLE · 03.15–03.17</span>
        <b>{summary.status}</b>
      </div>

      <p>
        Explicit human resolution → resolved/unresolved requirement aggregation → profile knowledge readiness summary.
        Това е knowledge-only слой. Дори 100% coverage не означава manufacturer approval, exact joint geometry,
        production compatibility или machine-ready статус.
      </p>

      <h4>03.15 · Explicit knowledge resolution</h4>
      {resolutionGate.rows.map((row) => (
        <article key={row.candidateEvidenceId} data-resolution-state={row.state}>
          <p><strong>{row.relation} · {row.requirementKind}</strong></p>
          <input
            value={notes[row.candidateEvidenceId] ?? ''}
            onChange={(event) => setNotes((current) => ({ ...current, [row.candidateEvidenceId]: event.target.value }))}
            placeholder="Note for KEEP UNRESOLVED / REOPEN"
          />
          <div>
            <button type="button" onClick={() => decide(row.candidateEvidenceId, 'RESOLVE_FOR_KNOWLEDGE_READINESS')}>RESOLVE for knowledge readiness</button>
            <button type="button" onClick={() => decide(row.candidateEvidenceId, 'KEEP_UNRESOLVED')}>KEEP UNRESOLVED</button>
            <button type="button" onClick={() => decide(row.candidateEvidenceId, 'REOPEN_FOR_EVIDENCE')}>REOPEN FOR EVIDENCE</button>
          </div>
          {errors[row.candidateEvidenceId] && <p role="alert">{errors[row.candidateEvidenceId]}</p>}
          <p><strong>Resolution state:</strong> {row.state}</p>
        </article>
      ))}

      <h4>03.16 · Resolved / unresolved aggregation</h4>
      <p><strong>Total knowledge requirements:</strong> {aggregation.totalKnowledgeRequirementCount}</p>
      <p><strong>Resolved for knowledge readiness:</strong> {aggregation.resolvedKnowledgeRequirementCount}</p>
      <p><strong>Unresolved:</strong> {aggregation.unresolvedKnowledgeRequirementCount}</p>
      <p><strong>Knowledge coverage:</strong> {aggregation.knowledgeCoveragePercent}%</p>
      {aggregation.rows.map((row) => (
        <p key={`${row.relation}:${row.requirementKind}`}>
          {row.relation} · {row.requirementKind}: <strong>{row.state}</strong>
        </p>
      ))}

      <h4>03.17 · Profile knowledge readiness summary</h4>
      {summary.relations.map((relation) => (
        <p key={relation.relation}>
          <strong>{relation.relation}</strong>: {relation.resolvedRequirementCount}/{relation.totalRequirementCount}
          {' '}({relation.knowledgeCoveragePercent}%) · {relation.state}
        </p>
      ))}
      <p><strong>Overall knowledge coverage complete:</strong> {summary.knowledgeRequirementCoverageComplete ? 'YES' : 'NO'}</p>
      <p><strong>Knowledge only:</strong> YES</p>
      <p><strong>Source readiness mutated:</strong> NO</p>
      <p><strong>Manufacturer approval:</strong> NO</p>
      <p><strong>Verified assembly node evidence complete:</strong> NO</p>
      <p><strong>Exact joint geometry verified:</strong> NO</p>
      <p><strong>Production compatibility validated:</strong> NO</p>
      <p><strong>Production rules validated:</strong> NO</p>
      <p><strong>Production unlock:</strong> NO</p>
      <p><strong>Machine ready:</strong> NO</p>

      <CanonicalProfileSystemKnowledgeGatePanel readiness={readiness} aggregation={aggregation} summary={summary} />

      <footer data-safety="BUNDLE 03.15-03.17: KNOWLEDGE RESOLUTION ONLY · SOURCE READINESS MUTATION NO · MANUFACTURER APPROVAL NO · VERIFIED ASSEMBLY NODE COMPLETE NO · EXACT JOINT GEOMETRY NO · PRODUCTION COMPATIBILITY NO · RULES VALIDATED NO · PRODUCTION UNLOCK NO · MACHINE READY NO">
        03.15–03.17 BUNDLE · KNOWLEDGE COVERAGE ONLY · SOURCE READINESS НЕ СЕ ПРЕПИСВА · MANUFACTURER APPROVAL: НЕ · EXACT JOINT GEOMETRY: НЕ · PRODUCTION COMPATIBILITY: НЕ · PRODUCTION UNLOCK: НЕ · MACHINE READY: НЕ
      </footer>
    </section>
  )
}
