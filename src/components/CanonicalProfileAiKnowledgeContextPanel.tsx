import { useMemo } from 'react'
import type { CanonicalProfileRelationKnowledgeReadinessMatrix } from '../aiCanonicalProfileRelationKnowledgeReadiness'
import type { CanonicalProfileSystemKnowledgeReadiness } from '../aiCanonicalProfileSystemKnowledgeReadiness'
import type { CanonicalProfileSystemKnowledgeGate } from '../aiCanonicalProfileSystemKnowledgeGate'
import { buildCanonicalProfileAiDecisionContext } from '../aiCanonicalProfileAiDecisionContext'
import { buildCanonicalProfileAiClaimBoundary } from '../aiCanonicalProfileAiClaimBoundary'
import { buildCanonicalProfileAiConsumableKnowledgeContext } from '../aiCanonicalProfileAiConsumableKnowledgeContext'
import { CanonicalProfileEvidenceRequestResponsePanel } from './CanonicalProfileEvidenceRequestResponsePanel'

interface Props {
  relationMatrix: CanonicalProfileRelationKnowledgeReadinessMatrix
  systemReadiness: CanonicalProfileSystemKnowledgeReadiness
  gate: CanonicalProfileSystemKnowledgeGate
}

export function CanonicalProfileAiKnowledgeContextPanel({ relationMatrix, systemReadiness, gate }: Props) {
  const decisionContext = useMemo(() => buildCanonicalProfileAiDecisionContext({ relationMatrix, systemReadiness, gate }), [relationMatrix, systemReadiness, gate])
  const claimBoundary = useMemo(() => buildCanonicalProfileAiClaimBoundary(decisionContext), [decisionContext])
  const aiContext = useMemo(() => buildCanonicalProfileAiConsumableKnowledgeContext({ context: decisionContext, boundary: claimBoundary }), [decisionContext, claimBoundary])

  return (
    <section
      className="ff-ai03-facts"
      aria-label="PROFILE DATA 03.21 to 03.23 AI knowledge context bundle"
      data-profile-data-bundle="PROFILE DATA 03.21-03.23"
    >
      <div className="ff-ai03-card-heading">
        <span>AI KNOWLEDGE CONTEXT · 03.21–03.23</span>
        <b>{aiContext.status}</b>
      </div>

      <p>
        Този слой подава към AI само reviewed knowledge context: какво е известно, какво остава неизвестно и какъв human evidence е нужен.
        Липсващите технически данни не могат да се измислят или превръщат в production facts.
      </p>

      <h4>03.21 · AI decision context</h4>
      <p><strong>Known knowledge items:</strong> {decisionContext.knownItems.length}</p>
      <p><strong>Unknown knowledge items:</strong> {decisionContext.unknownItems.length}</p>
      <p><strong>Human evidence required:</strong> {decisionContext.humanEvidenceRequiredCount}</p>
      <p><strong>Knowledge coverage:</strong> {decisionContext.knowledgeCoveragePercent}%</p>

      {decisionContext.unknownItems.map((item) => (
        <p key={`${item.relation}:${item.requirementKind}`} data-ai-unknown="true">
          <strong>UNKNOWN</strong> · {item.relation} · {item.requirementKind} · needs {item.authorityNeeded}
        </p>
      ))}

      <h4>03.22 · AI claim boundary</h4>
      <p><strong>May say what is known:</strong> {claimBoundary.mayStateKnownKnowledgeCoverage ? 'YES' : 'NO'}</p>
      <p><strong>May say what is unknown:</strong> {claimBoundary.mayStateKnowledgeGap ? 'YES' : 'NO'}</p>
      <p><strong>May request human evidence:</strong> {claimBoundary.mayRequestHumanEvidence ? 'YES' : 'NO'}</p>
      <p><strong>May infer missing technical data:</strong> NO</p>
      <p><strong>May claim manufacturer approval:</strong> NO</p>
      <p><strong>May claim exact joint geometry:</strong> NO</p>
      <p><strong>May claim production compatibility:</strong> NO</p>

      <h4>03.23 · AI-consumable context</h4>
      <p><strong>Status:</strong> {aiContext.status}</p>
      <p><strong>Human evidence requests:</strong> {aiContext.humanEvidenceRequests.length}</p>
      <p><strong>Instruction:</strong> {aiContext.aiInstruction}</p>
      <p><strong>Automatic profile selection:</strong> NO</p>
      <p><strong>Automatic geometry:</strong> NO</p>
      <p><strong>Production rules validated:</strong> NO</p>
      <p><strong>Production unlock:</strong> NO</p>
      <p><strong>Machine ready:</strong> NO</p>

      <CanonicalProfileEvidenceRequestResponsePanel aiContext={aiContext} />

      <footer data-safety="BUNDLE 03.21-03.23: AI KNOWLEDGE CONTEXT ONLY · UNKNOWN STAYS UNKNOWN · NO TECHNICAL GUESSING · MANUFACTURER APPROVAL NO · EXACT JOINT GEOMETRY NO · PRODUCTION COMPATIBILITY NO · AUTOMATIC PROFILE SELECTION NO · AUTOMATIC GEOMETRY NO · PRODUCTION UNLOCK NO · MACHINE READY NO">
        03.21–03.23 BUNDLE · AI МОЖЕ ДА КАЖЕ „ЗНАМ / НЕ ЗНАМ / ТРЯБВА HUMAN EVIDENCE“ · НЕ МОЖЕ ДА ИЗМИСЛЯ ЛИПСВАЩИ ТЕХНИЧЕСКИ ДАННИ
      </footer>
    </section>
  )
}
