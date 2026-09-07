import { useMemo } from 'react'
import type { CanonicalProfileAiConsumableKnowledgeContext } from '../aiCanonicalProfileAiConsumableKnowledgeContext'
import { buildCanonicalProfileEvidenceRequestPlan } from '../aiCanonicalProfileEvidenceRequestPlanner'
import { buildCanonicalProfileHumanEvidenceRequestQueue } from '../aiCanonicalProfileHumanEvidenceRequestQueue'
import { buildCanonicalProfileSafeAiResponse } from '../aiCanonicalProfileSafeResponseComposer'
import { CanonicalProfileClarificationIntakePanel } from './CanonicalProfileClarificationIntakePanel'

interface Props {
  aiContext: CanonicalProfileAiConsumableKnowledgeContext
}

export function CanonicalProfileEvidenceRequestResponsePanel({ aiContext }: Props) {
  const plan = useMemo(() => buildCanonicalProfileEvidenceRequestPlan(aiContext), [aiContext])
  const queue = useMemo(() => buildCanonicalProfileHumanEvidenceRequestQueue(plan), [plan])
  const safeResponse = useMemo(() => buildCanonicalProfileSafeAiResponse({ context: aiContext, queue }), [aiContext, queue])

  return (
    <section
      className="ff-ai03-facts"
      aria-label="PROFILE DATA 03.24 to 03.26 evidence request and safe response bundle"
      data-profile-data-bundle="PROFILE DATA 03.24-03.26"
    >
      <div className="ff-ai03-card-heading">
        <span>AI EVIDENCE REQUEST + SAFE RESPONSE · 03.24–03.26</span>
        <b>{safeResponse.status}</b>
      </div>

      <p>
        Този слой превръща unknown knowledge gaps в конкретни human evidence requests и безопасен AI отговор.
        Няма automatic source fetch, automatic evidence acceptance, technical guessing или production promotion.
      </p>

      <h4>03.24 · Evidence request planner</h4>
      <p><strong>Status:</strong> {plan.status}</p>
      <p><strong>Planned requests:</strong> {plan.requestCount}</p>
      {plan.requests.map((request) => (
        <p key={request.requestKey} data-evidence-request={request.requestKey}>
          <strong>{request.action}</strong> · {request.relation} · {request.requirementKind} · {request.authorityNeeded}
          <br />{request.requestedEvidence}
        </p>
      ))}

      <h4>03.25 · Human evidence request queue</h4>
      <p><strong>Status:</strong> {queue.status}</p>
      <p><strong>Human actions:</strong> {queue.totalRequestCount}</p>
      {queue.authorityGroups.map((group) => (
        <p key={group.authorityNeeded}>
          {group.authorityNeeded}: <strong>{group.requestCount}</strong> request(s)
        </p>
      ))}
      <p><strong>Automatic dispatch:</strong> NO</p>
      <p><strong>Automatic evidence fetch:</strong> NO</p>
      <p><strong>Automatic evidence acceptance:</strong> NO</p>

      <h4>03.26 · AI safe response composer</h4>
      <p><strong>Status:</strong> {safeResponse.status}</p>
      <p data-safe-ai-response="bg"><strong>Safe BG response:</strong> {safeResponse.messageBg}</p>
      <p><strong>Known statements:</strong> {safeResponse.knownStatements.length}</p>
      <p><strong>Unknown statements:</strong> {safeResponse.unknownStatements.length}</p>
      <p><strong>Human evidence requests:</strong> {safeResponse.humanEvidenceRequests.length}</p>
      <p><strong>May guess missing technical data:</strong> NO</p>
      <p><strong>Manufacturer approval:</strong> NO</p>
      <p><strong>Exact joint geometry verified:</strong> NO</p>
      <p><strong>Production compatibility validated:</strong> NO</p>
      <p><strong>Automatic profile selection:</strong> NO</p>
      <p><strong>Automatic geometry:</strong> NO</p>
      <p><strong>Production unlock:</strong> NO</p>
      <p><strong>Machine ready:</strong> NO</p>

      <CanonicalProfileClarificationIntakePanel queue={queue} />

      <footer data-safety="BUNDLE 03.24-03.26: HUMAN EVIDENCE REQUESTS ONLY · NO AUTO FETCH · NO AUTO ACCEPT · UNKNOWN STAYS UNKNOWN · NO TECHNICAL GUESSING · MANUFACTURER APPROVAL NO · EXACT JOINT GEOMETRY NO · PRODUCTION COMPATIBILITY NO · AUTOMATIC PROFILE SELECTION NO · AUTOMATIC GEOMETRY NO · PRODUCTION UNLOCK NO · MACHINE READY NO">
        03.24–03.26 BUNDLE · AI ИСКА ТОЧНО ЛИПСВАЩОТО EVIDENCE · ЧОВЕКЪТ РЕШАВА · PRODUCTION ОСТАВА ЗАКЛЮЧЕН
      </footer>
    </section>
  )
}
