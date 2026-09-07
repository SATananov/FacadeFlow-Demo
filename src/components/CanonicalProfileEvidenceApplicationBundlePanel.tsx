import { useMemo, useState } from 'react'
import type { CanonicalProfileAssemblyEvidenceReadiness } from '../aiCanonicalProfileAssemblyEvidenceReadiness'
import type { CanonicalProfileAssemblyEvidenceSubmissionRecord } from '../aiCanonicalProfileAssemblyEvidenceIntake'
import type { CanonicalProfileAssemblyEvidenceIntakeHumanReviewRecord } from '../aiCanonicalProfileAssemblyEvidenceIntakeHumanReview'
import {
  buildCanonicalProfileAssemblyEvidenceApplicationGate,
  createCanonicalProfileAssemblyEvidenceApplicationRecord,
  type CanonicalProfileAssemblyEvidenceApplicationDecision,
  type CanonicalProfileAssemblyEvidenceApplicationRecord,
} from '../aiCanonicalProfileAssemblyEvidenceApplicationGate'
import { buildCanonicalProfileCandidateEvidenceLedger } from '../aiCanonicalProfileCandidateEvidenceLedger'
import { CanonicalProfileKnowledgeReadinessBundlePanel } from './CanonicalProfileKnowledgeReadinessBundlePanel'
import {
  buildCanonicalProfileEvidenceRequirementSatisfactionGate,
  createCanonicalProfileEvidenceRequirementReviewRecord,
  type CanonicalProfileEvidenceRequirementDecision,
  type CanonicalProfileEvidenceRequirementReviewRecord,
} from '../aiCanonicalProfileEvidenceRequirementSatisfaction'

interface Props {
  readiness: CanonicalProfileAssemblyEvidenceReadiness
  submissions: readonly CanonicalProfileAssemblyEvidenceSubmissionRecord[]
  sourceReviews: readonly CanonicalProfileAssemblyEvidenceIntakeHumanReviewRecord[]
}

export function CanonicalProfileEvidenceApplicationBundlePanel({ readiness, submissions, sourceReviews }: Props) {
  const [applicationRecords, setApplicationRecords] = useState<CanonicalProfileAssemblyEvidenceApplicationRecord[]>([])
  const [requirementReviews, setRequirementReviews] = useState<CanonicalProfileEvidenceRequirementReviewRecord[]>([])
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const applicationGate = useMemo(() => buildCanonicalProfileAssemblyEvidenceApplicationGate({
    readiness,
    submissions,
    sourceReviews,
    records: applicationRecords,
  }), [readiness, submissions, sourceReviews, applicationRecords])

  const candidateLedger = useMemo(() => buildCanonicalProfileCandidateEvidenceLedger({
    readiness,
    submissions,
    sourceReviews,
    applicationRecords,
  }), [readiness, submissions, sourceReviews, applicationRecords])

  const satisfactionGate = useMemo(() => buildCanonicalProfileEvidenceRequirementSatisfactionGate({
    readiness,
    ledger: candidateLedger,
    records: requirementReviews,
  }), [readiness, candidateLedger, requirementReviews])

  const applyDecision = (submissionId: string, decision: CanonicalProfileAssemblyEvidenceApplicationDecision) => {
    try {
      const record = createCanonicalProfileAssemblyEvidenceApplicationRecord(readiness, submissions, sourceReviews, {
        applicationId: `profile-data03-12:${submissionId}:${Date.now()}`,
        submissionId,
        reviewerRole: 'TECHNICAL_REVIEWER',
        decidedAt: new Date().toISOString(),
        decision,
        note: notes[submissionId] ?? '',
      })
      setApplicationRecords((current) => [...current.filter((item) => item.submissionId !== submissionId), record])
      setErrors((current) => ({ ...current, [submissionId]: '' }))
    } catch (error) {
      setErrors((current) => ({ ...current, [submissionId]: error instanceof Error ? error.message : String(error) }))
    }
  }

  const reviewRequirement = (candidateEvidenceId: string, decision: CanonicalProfileEvidenceRequirementDecision) => {
    try {
      const record = createCanonicalProfileEvidenceRequirementReviewRecord(candidateLedger, {
        reviewId: `profile-data03-14:${candidateEvidenceId}:${Date.now()}`,
        candidateEvidenceId,
        reviewerRole: 'TECHNICAL_REVIEWER',
        reviewedAt: new Date().toISOString(),
        decision,
        note: notes[candidateEvidenceId] ?? '',
      })
      setRequirementReviews((current) => [...current.filter((item) => item.candidateEvidenceId !== candidateEvidenceId), record])
      setErrors((current) => ({ ...current, [candidateEvidenceId]: '' }))
    } catch (error) {
      setErrors((current) => ({ ...current, [candidateEvidenceId]: error instanceof Error ? error.message : String(error) }))
    }
  }

  return (
    <section
      className="ff-ai03-facts"
      aria-label="PROFILE DATA 03.12 to 03.14 evidence application bundle"
      data-profile-data-bundle="PROFILE DATA 03.12-03.14"
    >
      <div className="ff-ai03-card-heading">
        <span>EVIDENCE APPLICATION BUNDLE · 03.12–03.14</span>
        <b>{satisfactionGate.status}</b>
      </div>

      <p>
        Един bundled workflow: human-accepted source → explicit candidate-ledger application → candidate evidence →
        human requirement-satisfaction review. Нито една стъпка не създава manufacturer approval, exact joint geometry,
        production compatibility или machine-ready статус.
      </p>

      <h4>03.12 · Explicit application gate</h4>
      {applicationGate.rows.map((row) => (
        <article key={row.submissionId} data-application-state={row.state}>
          <p><strong>{row.relation} · {row.requirementKind}</strong></p>
          <p>{row.sourceLabel} · {row.sourceRef}</p>
          <input
            value={notes[row.submissionId] ?? ''}
            onChange={(event) => setNotes((current) => ({ ...current, [row.submissionId]: event.target.value }))}
            placeholder="Note for HOLD / NEEDS FURTHER REVIEW"
          />
          <div>
            <button type="button" onClick={() => applyDecision(row.submissionId, 'APPLY_ACCEPTED_SOURCE')}>APPLY to candidate ledger</button>
            <button type="button" onClick={() => applyDecision(row.submissionId, 'HOLD_SOURCE')}>HOLD</button>
            <button type="button" onClick={() => applyDecision(row.submissionId, 'NEEDS_FURTHER_REVIEW')}>NEEDS FURTHER REVIEW</button>
          </div>
          {errors[row.submissionId] && <p role="alert">{errors[row.submissionId]}</p>}
          <p><strong>State:</strong> {row.state}</p>
        </article>
      ))}

      <h4>03.13 · Candidate evidence ledger</h4>
      <p><strong>Candidate entries:</strong> {candidateLedger.candidateEvidenceCount}</p>
      <p><strong>Validated evidence created:</strong> NO</p>
      <p><strong>Requirement satisfied at 03.13:</strong> NO</p>

      <h4>03.14 · Knowledge requirement review</h4>
      {candidateLedger.entries.map((entry) => {
        const row = satisfactionGate.rows.find((item) => item.candidateEvidenceId === entry.candidateEvidenceId)
        return (
          <article key={entry.candidateEvidenceId} data-requirement-review-state={row?.state ?? 'UNREVIEWED'}>
            <p><strong>{entry.relation} · {entry.requirementKind}</strong></p>
            <p>{entry.sourceLabel} · {entry.sourceRef}</p>
            <input
              value={notes[entry.candidateEvidenceId] ?? ''}
              onChange={(event) => setNotes((current) => ({ ...current, [entry.candidateEvidenceId]: event.target.value }))}
              placeholder="Note for insufficient / more evidence"
            />
            <div>
              <button type="button" onClick={() => reviewRequirement(entry.candidateEvidenceId, 'SATISFIES_KNOWLEDGE_REQUIREMENT')}>SATISFIES knowledge requirement</button>
              <button type="button" onClick={() => reviewRequirement(entry.candidateEvidenceId, 'INSUFFICIENT_EVIDENCE')}>INSUFFICIENT</button>
              <button type="button" onClick={() => reviewRequirement(entry.candidateEvidenceId, 'NEEDS_MORE_EVIDENCE')}>NEEDS MORE EVIDENCE</button>
            </div>
            {errors[entry.candidateEvidenceId] && <p role="alert">{errors[entry.candidateEvidenceId]}</p>}
            <p><strong>State:</strong> {row?.state ?? 'UNREVIEWED'}</p>
          </article>
        )
      })}

      <p><strong>Source missing requirements:</strong> {satisfactionGate.totalMissingRequirementCountAtSource}</p>
      <p><strong>Knowledge requirements satisfied by explicit human review:</strong> {satisfactionGate.knowledgeRequirementSatisfiedCount}</p>
      <p><strong>Projected remaining knowledge requirements:</strong> {satisfactionGate.projectedRemainingKnowledgeRequirementCount}</p>
      <p><strong>Source readiness mutated:</strong> NO</p>
      <p><strong>Manufacturer approval:</strong> NO</p>
      <p><strong>Verified assembly node evidence:</strong> NO</p>
      <p><strong>Exact joint geometry verified:</strong> NO</p>
      <p><strong>Production unlock:</strong> NO</p>

      <CanonicalProfileKnowledgeReadinessBundlePanel
        readiness={readiness}
        ledger={candidateLedger}
        requirementReviews={requirementReviews}
      />

      <footer data-safety="BUNDLE 03.12-03.14: EXPLICIT APPLICATION YES · CANDIDATE EVIDENCE ONLY · KNOWLEDGE REQUIREMENT REVIEW YES · SOURCE READINESS MUTATION NO · MANUFACTURER APPROVAL NO · VERIFIED ASSEMBLY NODE NO · EXACT JOINT GEOMETRY NO · AUTOMATIC GEOMETRY NO · PRODUCTION COMPATIBILITY NO · PRODUCTION UNLOCK NO · MACHINE READY NO">
        03.12–03.14 BUNDLE · CANDIDATE EVIDENCE ONLY · KNOWLEDGE REQUIREMENT REVIEW · SOURCE READINESS НЕ СЕ ПРЕПИСВА · MANUFACTURER APPROVAL: НЕ · EXACT JOINT GEOMETRY: НЕ · PRODUCTION UNLOCK: НЕ · MACHINE READY: НЕ
      </footer>
    </section>
  )
}
