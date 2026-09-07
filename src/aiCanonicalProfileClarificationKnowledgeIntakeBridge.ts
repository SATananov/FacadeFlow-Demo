import type { CanonicalProfileAssemblyEvidenceRequirementAuthority } from './aiCanonicalProfileAssemblyEvidenceReadiness'
import type { CanonicalProfileGuidedClarificationSession } from './aiCanonicalProfileGuidedClarificationSession'

export const PROFILE_DATA_03_29_VERSION = 'PROFILE_DATA_03.29' as const

export type CanonicalProfileClarificationIntakeCandidateKind =
  | 'EVIDENCE_SOURCE_REFERENCE_CANDIDATE'
  | 'HUMAN_REVIEW_RENEWAL_CANDIDATE'

export interface CanonicalProfileClarificationIntakeCandidate {
  candidateKey: string
  questionKey: string
  requestKey: string
  relation: CanonicalProfileGuidedClarificationSession['items'][number]['relation']
  leftProfileCode: string
  rightProfileCode: string
  requirementKind: CanonicalProfileGuidedClarificationSession['items'][number]['requirementKind']
  authorityKind: CanonicalProfileAssemblyEvidenceRequirementAuthority
  candidateKind: CanonicalProfileClarificationIntakeCandidateKind
  humanAnswerText: string
  sourceLabel: string
  sourceRef: string
  capturedAt: string
  state: 'CANDIDATE_PENDING_HUMAN_INTAKE'
  mayCreateManualEvidenceRegistration: boolean
  mayAutoRegisterEvidence: false
  mayAutoAcceptEvidence: false
  mayAutoSatisfyRequirement: false
  mayAutoResolveKnowledge: false
  humanReviewRequired: true
  productionUnlockAllowed: false
  machineReady: false
}

export type CanonicalProfileClarificationKnowledgeIntakeBridgeStatus =
  | 'BLOCKED_UPSTREAM'
  | 'WAITING_FOR_CLARIFICATION_PRODUCTION_LOCKED'
  | 'INTAKE_CANDIDATES_READY_HUMAN_REVIEW_REQUIRED_PRODUCTION_LOCKED'
  | 'NO_INTAKE_CANDIDATES_PRODUCTION_LOCKED'

export interface CanonicalProfileClarificationKnowledgeIntakeBridge {
  version: typeof PROFILE_DATA_03_29_VERSION
  sourceIntentId: string
  systemId: CanonicalProfileGuidedClarificationSession['systemId']
  systemLabel: CanonicalProfileGuidedClarificationSession['systemLabel']
  status: CanonicalProfileClarificationKnowledgeIntakeBridgeStatus
  candidates: CanonicalProfileClarificationIntakeCandidate[]
  candidateCount: number
  evidenceSourceCandidateCount: number
  reviewRenewalCandidateCount: number
  conflicts: string[]
  humanIntakeRequired: boolean
  automaticEvidenceRegistrationAllowed: false
  automaticEvidenceAcceptanceAllowed: false
  automaticRequirementSatisfactionAllowed: false
  automaticKnowledgeResolutionAllowed: false
  manufacturerApproval: false
  exactJointGeometryVerified: false
  productionCompatibilityValidated: false
  productionUnlockAllowed: false
  machineReady: false
}

export function buildCanonicalProfileClarificationKnowledgeIntakeBridge(
  session: CanonicalProfileGuidedClarificationSession,
): CanonicalProfileClarificationKnowledgeIntakeBridge {
  const conflicts = [...session.conflicts]
  const candidates: CanonicalProfileClarificationIntakeCandidate[] = []

  for (const item of session.items) {
    if (item.state !== 'ANSWER_CAPTURED_PENDING_INTAKE') continue
    candidates.push({
      candidateKey: `INTAKE:${item.requestKey}`,
      questionKey: item.questionKey,
      requestKey: item.requestKey,
      relation: item.relation,
      leftProfileCode: item.leftProfileCode,
      rightProfileCode: item.rightProfileCode,
      requirementKind: item.requirementKind,
      authorityKind: item.authorityNeeded,
      candidateKind: item.answerKind === 'SOURCE_REFERENCE'
        ? 'EVIDENCE_SOURCE_REFERENCE_CANDIDATE'
        : 'HUMAN_REVIEW_RENEWAL_CANDIDATE',
      humanAnswerText: item.answerText,
      sourceLabel: item.sourceLabel,
      sourceRef: item.sourceRef,
      capturedAt: item.answeredAt,
      state: 'CANDIDATE_PENDING_HUMAN_INTAKE',
      mayCreateManualEvidenceRegistration: item.answerKind === 'SOURCE_REFERENCE' && Boolean(item.sourceLabel && item.sourceRef),
      mayAutoRegisterEvidence: false,
      mayAutoAcceptEvidence: false,
      mayAutoSatisfyRequirement: false,
      mayAutoResolveKnowledge: false,
      humanReviewRequired: true,
      productionUnlockAllowed: false,
      machineReady: false,
    })
  }

  const candidateKeys = new Set<string>()
  for (const candidate of candidates) {
    if (candidateKeys.has(candidate.candidateKey)) conflicts.push(`${candidate.candidateKey} is duplicated in PROFILE DATA 03.29 intake candidates.`)
    candidateKeys.add(candidate.candidateKey)
  }

  let status: CanonicalProfileClarificationKnowledgeIntakeBridgeStatus
  if (session.status === 'BLOCKED_UPSTREAM' || conflicts.length) status = 'BLOCKED_UPSTREAM'
  else if (session.status === 'WAITING_HUMAN_ANSWERS_PRODUCTION_LOCKED' || session.status === 'HUMAN_CORRECTION_REQUIRED_PRODUCTION_LOCKED') {
    status = 'WAITING_FOR_CLARIFICATION_PRODUCTION_LOCKED'
  } else if (candidates.length) status = 'INTAKE_CANDIDATES_READY_HUMAN_REVIEW_REQUIRED_PRODUCTION_LOCKED'
  else status = 'NO_INTAKE_CANDIDATES_PRODUCTION_LOCKED'

  return {
    version: PROFILE_DATA_03_29_VERSION,
    sourceIntentId: session.sourceIntentId,
    systemId: session.systemId,
    systemLabel: session.systemLabel,
    status,
    candidates: status === 'BLOCKED_UPSTREAM' ? [] : candidates,
    candidateCount: status === 'BLOCKED_UPSTREAM' ? 0 : candidates.length,
    evidenceSourceCandidateCount: status === 'BLOCKED_UPSTREAM' ? 0 : candidates.filter((candidate) => candidate.candidateKind === 'EVIDENCE_SOURCE_REFERENCE_CANDIDATE').length,
    reviewRenewalCandidateCount: status === 'BLOCKED_UPSTREAM' ? 0 : candidates.filter((candidate) => candidate.candidateKind === 'HUMAN_REVIEW_RENEWAL_CANDIDATE').length,
    conflicts: [...new Set(conflicts)],
    humanIntakeRequired: status === 'BLOCKED_UPSTREAM' || status === 'WAITING_FOR_CLARIFICATION_PRODUCTION_LOCKED' || candidates.length > 0,
    automaticEvidenceRegistrationAllowed: false,
    automaticEvidenceAcceptanceAllowed: false,
    automaticRequirementSatisfactionAllowed: false,
    automaticKnowledgeResolutionAllowed: false,
    manufacturerApproval: false,
    exactJointGeometryVerified: false,
    productionCompatibilityValidated: false,
    productionUnlockAllowed: false,
    machineReady: false,
  }
}

export const PROFILE_DATA_03_29_SAFETY = Object.freeze({
  candidateBridgeOnly: true,
  automaticEvidenceRegistrationAllowed: false,
  automaticEvidenceAcceptanceAllowed: false,
  automaticRequirementSatisfactionAllowed: false,
  automaticKnowledgeResolutionAllowed: false,
  manufacturerApproval: false,
  exactJointGeometryVerified: false,
  productionCompatibilityValidated: false,
  productionUnlockAllowed: false,
  machineReady: false,
})
