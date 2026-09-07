import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { CanonicalProfileClarificationIntakeCandidate } from '../src/aiCanonicalProfileClarificationKnowledgeIntakeBridge'
import {
  buildProfileDataV2ManualEvidenceIntakeHandoffDraft,
  profileDataV2ManualEvidenceHandoffIsCurrent,
  PROFILE_DATA_V2_2_SAFETY,
} from '../src/profileData/profileDataV2ManualEvidenceIntakeHandoff'

const sourceCandidate = (): CanonicalProfileClarificationIntakeCandidate => ({
  candidateKey: 'INTAKE:FRAME_SASH:MANUFACTURER_PAIR_RELATION_EVIDENCE',
  questionKey: 'CLARIFY:FRAME_SASH:MANUFACTURER_PAIR_RELATION_EVIDENCE',
  requestKey: 'FRAME_SASH:MANUFACTURER_PAIR_RELATION_EVIDENCE',
  relation: 'FRAME_SASH',
  leftProfileCode: '482.30',
  rightProfileCode: '482.05',
  requirementKind: 'MANUFACTURER_PAIR_RELATION_EVIDENCE',
  authorityKind: 'MANUFACTURER_CATALOGUE_OR_TECHNICAL_DOCUMENT',
  candidateKind: 'EVIDENCE_SOURCE_REFERENCE_CANDIDATE',
  humanAnswerText: '  Посочвам конкретния каталог.  ',
  sourceLabel: '  PRELUDE 60 technical catalogue  ',
  sourceRef: '  catalogue://prelude60/frame-sash/page-42  ',
  capturedAt: '2026-09-07T15:30:00+03:00',
  state: 'CANDIDATE_PENDING_HUMAN_INTAKE',
  mayCreateManualEvidenceRegistration: true,
  mayAutoRegisterEvidence: false,
  mayAutoAcceptEvidence: false,
  mayAutoSatisfyRequirement: false,
  mayAutoResolveKnowledge: false,
  humanReviewRequired: true,
  productionUnlockAllowed: false,
  machineReady: false,
})

test('V2.2 explicit handoff creates only a PROFILE DATA 03.10-compatible manual intake prefill draft', () => {
  const handoff = buildProfileDataV2ManualEvidenceIntakeHandoffDraft({
    candidate: sourceCandidate(),
    handedOffAt: '2026-09-07T16:00:00+03:00',
  })

  assert.equal(handoff.targetStep, 'PROFILE_DATA_03.10')
  assert.equal(handoff.state, 'HANDOFF_DRAFT_READY_FOR_MANUAL_03_10_REGISTRATION')
  assert.equal(handoff.manualIntakePrefill.relation, 'FRAME_SASH')
  assert.equal(handoff.manualIntakePrefill.requirementKind, 'MANUFACTURER_PAIR_RELATION_EVIDENCE')
  assert.equal(handoff.manualIntakePrefill.authorityKind, 'MANUFACTURER_CATALOGUE_OR_TECHNICAL_DOCUMENT')
  assert.equal(handoff.manualIntakePrefill.sourceLabel, 'PRELUDE 60 technical catalogue')
  assert.equal(handoff.manualIntakePrefill.sourceRef, 'catalogue://prelude60/frame-sash/page-42')
  assert.equal(handoff.manualIntakePrefill.note, 'Посочвам конкретния каталог.')
  assert.equal(handoff.manualIntakePrefill.submittedByRole, 'TECHNICAL_USER')
  assert.equal(handoff.creates03_10SubmissionRecord, false)
  assert.equal(handoff.requiresExplicit03_10Registration, true)
})

test('V2.2 rejects renewed-review candidates because they are not evidence-source registration candidates', () => {
  const candidate: CanonicalProfileClarificationIntakeCandidate = {
    ...sourceCandidate(),
    candidateKind: 'HUMAN_REVIEW_RENEWAL_CANDIDATE',
    sourceLabel: '',
    sourceRef: '',
    mayCreateManualEvidenceRegistration: false,
  }

  assert.throws(
    () => buildProfileDataV2ManualEvidenceIntakeHandoffDraft({
      candidate,
      handedOffAt: '2026-09-07T16:01:00+03:00',
    }),
    /accepts only source-reference candidates/,
  )
})

test('V2.2 fails closed when source candidate is not eligible for manual registration handoff', () => {
  assert.throws(
    () => buildProfileDataV2ManualEvidenceIntakeHandoffDraft({
      candidate: { ...sourceCandidate(), mayCreateManualEvidenceRegistration: false },
      handedOffAt: '2026-09-07T16:02:00+03:00',
    }),
    /not eligible for a manual evidence registration handoff/,
  )
})

test('V2.2 detects a stale handoff after the human candidate changes', () => {
  const candidate = sourceCandidate()
  const handoff = buildProfileDataV2ManualEvidenceIntakeHandoffDraft({
    candidate,
    handedOffAt: '2026-09-07T16:03:00+03:00',
  })

  assert.equal(profileDataV2ManualEvidenceHandoffIsCurrent(handoff, candidate), true)
  assert.equal(profileDataV2ManualEvidenceHandoffIsCurrent(handoff, {
    ...candidate,
    sourceRef: 'catalogue://prelude60/frame-sash/page-43',
  }), false)
})

test('V2.2 preserves evidence and production safety locks', () => {
  assert.equal(PROFILE_DATA_V2_2_SAFETY.explicitHumanHandoffRequired, true)
  assert.equal(PROFILE_DATA_V2_2_SAFETY.draftOnly, true)
  assert.equal(PROFILE_DATA_V2_2_SAFETY.creates03_10SubmissionRecord, false)
  assert.equal(PROFILE_DATA_V2_2_SAFETY.automaticEvidenceRegistrationAllowed, false)
  assert.equal(PROFILE_DATA_V2_2_SAFETY.automaticEvidenceAcceptanceAllowed, false)
  assert.equal(PROFILE_DATA_V2_2_SAFETY.automaticRequirementSatisfactionAllowed, false)
  assert.equal(PROFILE_DATA_V2_2_SAFETY.automaticKnowledgeResolutionAllowed, false)
  assert.equal(PROFILE_DATA_V2_2_SAFETY.automaticProfileSelectionAllowed, false)
  assert.equal(PROFILE_DATA_V2_2_SAFETY.automaticGeometryAllowed, false)
  assert.equal(PROFILE_DATA_V2_2_SAFETY.rulesValidated, false)
  assert.equal(PROFILE_DATA_V2_2_SAFETY.productionUnlockAllowed, false)
  assert.equal(PROFILE_DATA_V2_2_SAFETY.machineReady, false)
})

test('V2.2 UI exposes only an explicit handoff draft and does not call the 03.10 registration constructor', () => {
  const panel = readFileSync(resolve(process.cwd(), 'src/components/CanonicalProfileClarificationIntakePanel.tsx'), 'utf8')

  assert.match(panel, /PROFILE DATA V2 · HUMAN CLARIFICATION WORKFLOW/)
  assert.match(panel, /Подготви manual evidence intake handoff/)
  assert.match(panel, /PROFILE_DATA_03\.10/)
  assert.match(panel, /Creates 03\.10 submission record:<\/strong> NO/)
  assert.match(panel, /Explicit 03\.10 registration still required:<\/strong> YES/)
  assert.match(panel, /STALE_HANDOFF_RECREATE_REQUIRED/)
  assert.doesNotMatch(panel, /createCanonicalProfileAssemblyEvidenceSubmissionRecord/)
})
