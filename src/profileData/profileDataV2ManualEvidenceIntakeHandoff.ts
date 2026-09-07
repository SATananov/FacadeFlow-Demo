import type { CanonicalProfileAssemblyEvidenceSubmissionInput } from '../aiCanonicalProfileAssemblyEvidenceIntake'
import type { CanonicalProfileClarificationIntakeCandidate } from '../aiCanonicalProfileClarificationKnowledgeIntakeBridge'

export const PROFILE_DATA_V2_2_VERSION = 'PROFILE_DATA_V2.2' as const

export type ProfileDataV2ManualEvidenceIntakeHandoffState =
  | 'HANDOFF_DRAFT_READY_FOR_MANUAL_03_10_REGISTRATION'

export interface ProfileDataV2ManualEvidenceIntakeHandoffDraft {
  version: typeof PROFILE_DATA_V2_2_VERSION
  handoffId: string
  sourceCandidateKey: string
  sourceCandidateSignature: string
  requestKey: string
  relation: CanonicalProfileClarificationIntakeCandidate['relation']
  leftProfileCode: string
  rightProfileCode: string
  targetStep: 'PROFILE_DATA_03.10'
  state: ProfileDataV2ManualEvidenceIntakeHandoffState
  manualIntakePrefill: Readonly<Pick<
    CanonicalProfileAssemblyEvidenceSubmissionInput,
    'relation' | 'requirementKind' | 'authorityKind' | 'sourceLabel' | 'sourceRef' | 'submittedByRole' | 'note'
  >>
  handedOffAt: string
  requiresExplicit03_10Registration: true
  creates03_10SubmissionRecord: false
  sourceVerified: false
  acceptedAsEvidence: false
  requirementSatisfied: false
  automaticEvidenceRegistrationAllowed: false
  automaticEvidenceAcceptanceAllowed: false
  automaticRequirementSatisfactionAllowed: false
  automaticKnowledgeResolutionAllowed: false
  productionUnlockAllowed: false
  machineReady: false
}

const clean = (value: string | undefined) => value?.trim() ?? ''

export function profileDataV2ClarificationCandidateSignature(
  candidate: CanonicalProfileClarificationIntakeCandidate,
): string {
  return JSON.stringify({
    candidateKey: candidate.candidateKey,
    questionKey: candidate.questionKey,
    requestKey: candidate.requestKey,
    relation: candidate.relation,
    leftProfileCode: candidate.leftProfileCode,
    rightProfileCode: candidate.rightProfileCode,
    requirementKind: candidate.requirementKind,
    authorityKind: candidate.authorityKind,
    candidateKind: candidate.candidateKind,
    humanAnswerText: candidate.humanAnswerText,
    sourceLabel: candidate.sourceLabel,
    sourceRef: candidate.sourceRef,
    capturedAt: candidate.capturedAt,
    state: candidate.state,
    mayCreateManualEvidenceRegistration: candidate.mayCreateManualEvidenceRegistration,
  })
}

export function buildProfileDataV2ManualEvidenceIntakeHandoffDraft(input: {
  candidate: CanonicalProfileClarificationIntakeCandidate
  handedOffAt: string
}): ProfileDataV2ManualEvidenceIntakeHandoffDraft {
  const { candidate } = input
  const handedOffAt = clean(input.handedOffAt)
  const sourceLabel = clean(candidate.sourceLabel)
  const sourceRef = clean(candidate.sourceRef)
  const note = clean(candidate.humanAnswerText)

  if (candidate.state !== 'CANDIDATE_PENDING_HUMAN_INTAKE') {
    throw new Error('PROFILE DATA V2.2 requires a pending human-intake candidate.')
  }
  if (candidate.candidateKind !== 'EVIDENCE_SOURCE_REFERENCE_CANDIDATE') {
    throw new Error('PROFILE DATA V2.2 manual evidence handoff accepts only source-reference candidates.')
  }
  if (!candidate.mayCreateManualEvidenceRegistration) {
    throw new Error('PROFILE DATA V2.2 candidate is not eligible for a manual evidence registration handoff.')
  }
  if (!sourceLabel || !sourceRef) {
    throw new Error('PROFILE DATA V2.2 manual evidence handoff requires sourceLabel and sourceRef.')
  }
  if (!handedOffAt) {
    throw new Error('PROFILE DATA V2.2 manual evidence handoff requires handedOffAt.')
  }

  return Object.freeze({
    version: PROFILE_DATA_V2_2_VERSION,
    handoffId: `V2.2-HANDOFF:${candidate.candidateKey}:${handedOffAt}`,
    sourceCandidateKey: candidate.candidateKey,
    sourceCandidateSignature: profileDataV2ClarificationCandidateSignature(candidate),
    requestKey: candidate.requestKey,
    relation: candidate.relation,
    leftProfileCode: candidate.leftProfileCode,
    rightProfileCode: candidate.rightProfileCode,
    targetStep: 'PROFILE_DATA_03.10',
    state: 'HANDOFF_DRAFT_READY_FOR_MANUAL_03_10_REGISTRATION',
    manualIntakePrefill: Object.freeze({
      relation: candidate.relation,
      requirementKind: candidate.requirementKind,
      authorityKind: candidate.authorityKind,
      sourceLabel,
      sourceRef,
      submittedByRole: 'TECHNICAL_USER',
      note,
    }),
    handedOffAt,
    requiresExplicit03_10Registration: true,
    creates03_10SubmissionRecord: false,
    sourceVerified: false,
    acceptedAsEvidence: false,
    requirementSatisfied: false,
    automaticEvidenceRegistrationAllowed: false,
    automaticEvidenceAcceptanceAllowed: false,
    automaticRequirementSatisfactionAllowed: false,
    automaticKnowledgeResolutionAllowed: false,
    productionUnlockAllowed: false,
    machineReady: false,
  })
}

export function profileDataV2ManualEvidenceHandoffIsCurrent(
  handoff: ProfileDataV2ManualEvidenceIntakeHandoffDraft,
  candidate: CanonicalProfileClarificationIntakeCandidate,
): boolean {
  return handoff.sourceCandidateSignature === profileDataV2ClarificationCandidateSignature(candidate)
}

export const PROFILE_DATA_V2_2_SAFETY = Object.freeze({
  explicitHumanHandoffRequired: true,
  draftOnly: true,
  targetManualIntakeStep: 'PROFILE_DATA_03.10',
  creates03_10SubmissionRecord: false,
  automaticEvidenceRegistrationAllowed: false,
  automaticEvidenceAcceptanceAllowed: false,
  automaticRequirementSatisfactionAllowed: false,
  automaticKnowledgeResolutionAllowed: false,
  manufacturerApproval: false,
  exactJointGeometryVerified: false,
  productionCompatibilityValidated: false,
  automaticProfileSelectionAllowed: false,
  automaticGeometryAllowed: false,
  rulesValidated: false,
  productionUnlockAllowed: false,
  machineReady: false,
  productionApproved: false,
})
