import type {
  CanonicalProfile3DInspectionEvidence,
  CanonicalProfile3DInspectionRow,
} from './aiCanonicalProfile3DInspectionEvidence'

export const AI_CANONICAL_PROFILE_3D_HUMAN_REVIEW_GATE_VERSION = 'AI05.3.9' as const

export type CanonicalProfile3DHumanReviewDecision =
  | 'ACCEPT'
  | 'REQUEST_CORRECTION'
  | 'REJECT'

export type CanonicalProfile3DHumanReviewRowState =
  | 'UNREVIEWED'
  | 'HUMAN_ACCEPTED'
  | 'HUMAN_CORRECTION_REQUESTED'
  | 'HUMAN_REJECTED'
  | 'STALE_REVIEW_REQUIRED'

export type CanonicalProfile3DHumanReviewGateStatus =
  | 'BLOCKED_CONFLICT'
  | 'STALE_REVIEW_REQUIRED'
  | 'HUMAN_REVIEW_INCOMPLETE'
  | 'HUMAN_CHANGES_REQUIRED'
  | 'HUMAN_ACCEPTED_PRODUCTION_LOCKED'

export interface CanonicalProfile3DHumanReviewInput {
  reviewId: string
  targetKind: CanonicalProfile3DInspectionRow['targetKind']
  targetRef: string
  reviewerRole: 'TECHNICAL_REVIEWER'
  reviewedAt: string
  decision: CanonicalProfile3DHumanReviewDecision
  note?: string
}

export interface CanonicalProfile3DHumanReviewRecord {
  version: typeof AI_CANONICAL_PROFILE_3D_HUMAN_REVIEW_GATE_VERSION
  reviewId: string
  sourceEvidenceVersion: CanonicalProfile3DInspectionEvidence['version']
  sourceIntentId: string
  sourceSceneId: string
  sourceEvidenceStateKey: string
  sourceRowSignature: string
  targetKind: CanonicalProfile3DInspectionRow['targetKind']
  targetRef: string
  profileCode: string
  nodeIds: string[]
  reviewerRole: 'TECHNICAL_REVIEWER'
  reviewedAt: string
  decision: CanonicalProfile3DHumanReviewDecision
  note: string
  automaticProfileSelectionAllowed: false
  automaticGeometryAllowed: false
  exactProfileContourApplied: false
  rulesValidated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

export interface CanonicalProfile3DHumanReviewGateRow {
  targetKind: CanonicalProfile3DInspectionRow['targetKind']
  targetRef: string
  profileCode: string
  systemLabel: string
  nodeIds: string[]
  state: CanonicalProfile3DHumanReviewRowState
  decision: CanonicalProfile3DHumanReviewDecision | null
  reviewId: string | null
  reviewedAt: string | null
  note: string
  sourceTracePreserved: boolean
  humanDecisionRequired: true
  profileEditableHere: false
  geometryEditableHere: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

export interface CanonicalProfile3DHumanReviewGate {
  version: typeof AI_CANONICAL_PROFILE_3D_HUMAN_REVIEW_GATE_VERSION
  sourceEvidenceVersion: CanonicalProfile3DInspectionEvidence['version']
  sourceIntentId: string
  sourceSceneId: string
  sourceEvidenceStateKey: string
  status: CanonicalProfile3DHumanReviewGateStatus
  rows: CanonicalProfile3DHumanReviewGateRow[]
  conflicts: string[]
  warnings: string[]
  reviewedCount: number
  acceptedCount: number
  correctionRequestedCount: number
  rejectedCount: number
  staleCount: number
  unreviewedCount: number
  humanProfileReviewComplete: boolean
  humanProfileReviewAccepted: boolean
  changesRequired: boolean
  humanDecisionRequired: true
  decisionsAreReviewOnly: true
  canEditProfileAssignmentHere: false
  canEditGeometryHere: false
  automaticProfileSelectionAllowed: false
  automaticSystemAssignmentAllowed: false
  automaticGeometryAllowed: false
  exactProfileContourApplied: false
  productionDeductionsApplied: false
  manufacturingToleranceApplied: false
  rulesValidated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

function unique(items: string[]) {
  return [...new Set(items)]
}

function rowKey(targetKind: CanonicalProfile3DInspectionRow['targetKind'], targetRef: string) {
  return `${targetKind}:${targetRef}`
}

export function canonicalProfile3DHumanReviewRowSignature(row: CanonicalProfile3DInspectionRow): string {
  return JSON.stringify({
    targetKind: row.targetKind,
    targetRef: row.targetRef,
    profileCode: row.profileCode,
    expectedSceneRole: row.expectedSceneRole,
    nodeIds: [...row.nodeIds].sort(),
    preservationState: row.preservationState,
  })
}

export function canonicalProfile3DHumanReviewEvidenceStateKey(
  evidence: CanonicalProfile3DInspectionEvidence,
): string {
  return JSON.stringify({
    sourceIntentId: evidence.sourceIntentId,
    sourceSceneId: evidence.sourceSceneId,
    status: evidence.status,
    rows: [...evidence.rows]
      .sort((left, right) => rowKey(left.targetKind, left.targetRef).localeCompare(rowKey(right.targetKind, right.targetRef)))
      .map((row) => canonicalProfile3DHumanReviewRowSignature(row)),
    conflicts: [...evidence.conflicts].sort(),
  })
}

function requireEligibleEvidence(evidence: CanonicalProfile3DInspectionEvidence) {
  if (evidence.status !== 'READY_FOR_HUMAN_INSPECTION') {
    throw new Error(`AI05.3.8 evidence is ${evidence.status}; human 3D profile review cannot be recorded.`)
  }
  if (evidence.conflicts.length) {
    throw new Error('AI05.3.8 evidence contains conflicts; human 3D profile review cannot be recorded.')
  }
}

export function createCanonicalProfile3DHumanReviewRecord(
  evidence: CanonicalProfile3DInspectionEvidence,
  input: CanonicalProfile3DHumanReviewInput,
): CanonicalProfile3DHumanReviewRecord {
  requireEligibleEvidence(evidence)

  const row = evidence.rows.find(
    (item) => item.targetKind === input.targetKind && item.targetRef === input.targetRef,
  )
  if (!row) throw new Error(`${rowKey(input.targetKind, input.targetRef)} is not present in AI05.3.8 evidence.`)
  if (row.preservationState !== 'PRESERVED_ON_REAL_SCENE_NODES') {
    throw new Error(`${rowKey(input.targetKind, input.targetRef)} does not preserve its canonical trace.`)
  }

  const reviewId = input.reviewId.trim()
  const reviewedAt = input.reviewedAt.trim()
  const note = input.note?.trim() ?? ''
  if (!reviewId) throw new Error('Human 3D profile review requires a reviewId.')
  if (!reviewedAt) throw new Error('Human 3D profile review requires reviewedAt.')
  if (input.decision !== 'ACCEPT' && !note) {
    throw new Error(`${input.decision} requires an explicit human review note.`)
  }

  return Object.freeze({
    version: AI_CANONICAL_PROFILE_3D_HUMAN_REVIEW_GATE_VERSION,
    reviewId,
    sourceEvidenceVersion: evidence.version,
    sourceIntentId: evidence.sourceIntentId,
    sourceSceneId: evidence.sourceSceneId,
    sourceEvidenceStateKey: canonicalProfile3DHumanReviewEvidenceStateKey(evidence),
    sourceRowSignature: canonicalProfile3DHumanReviewRowSignature(row),
    targetKind: row.targetKind,
    targetRef: row.targetRef,
    profileCode: row.profileCode,
    nodeIds: [...row.nodeIds],
    reviewerRole: input.reviewerRole,
    reviewedAt,
    decision: input.decision,
    note,
    automaticProfileSelectionAllowed: false,
    automaticGeometryAllowed: false,
    exactProfileContourApplied: false,
    rulesValidated: false,
    productionUnlockAllowed: false,
    machineReady: false,
    productionApproved: false,
  })
}

function stateForDecision(decision: CanonicalProfile3DHumanReviewDecision): CanonicalProfile3DHumanReviewRowState {
  if (decision === 'ACCEPT') return 'HUMAN_ACCEPTED'
  if (decision === 'REQUEST_CORRECTION') return 'HUMAN_CORRECTION_REQUESTED'
  return 'HUMAN_REJECTED'
}

export function buildCanonicalProfile3DHumanReviewGate(input: {
  evidence: CanonicalProfile3DInspectionEvidence
  records?: readonly CanonicalProfile3DHumanReviewRecord[]
}): CanonicalProfile3DHumanReviewGate {
  const evidence = input.evidence
  const records = input.records ?? []
  const evidenceStateKey = canonicalProfile3DHumanReviewEvidenceStateKey(evidence)
  const conflicts = [...evidence.conflicts]
  const warnings = [...evidence.warnings]
  const rowByKey = new Map(evidence.rows.map((row) => [rowKey(row.targetKind, row.targetRef), row]))
  const recordsByKey = new Map<string, CanonicalProfile3DHumanReviewRecord[]>()

  if (evidence.status !== 'READY_FOR_HUMAN_INSPECTION') {
    conflicts.push(`AI05.3.8 evidence is ${evidence.status}; AI05.3.9 human review gate is blocked.`)
  }

  for (const record of records) {
    const key = rowKey(record.targetKind, record.targetRef)
    if (!rowByKey.has(key)) {
      conflicts.push(`${key} has a human review record but is not present in current AI05.3.8 evidence.`)
      continue
    }
    const list = recordsByKey.get(key) ?? []
    list.push(record)
    recordsByKey.set(key, list)
  }

  for (const [key, list] of recordsByKey) {
    if (list.length > 1) conflicts.push(`${key} has multiple active human review records; review is ambiguous.`)
  }

  const rows: CanonicalProfile3DHumanReviewGateRow[] = evidence.rows.map((row) => {
    const key = rowKey(row.targetKind, row.targetRef)
    const matching = recordsByKey.get(key) ?? []
    const record = matching.length === 1 ? matching[0] : undefined
    let state: CanonicalProfile3DHumanReviewRowState = 'UNREVIEWED'
    let sourceTracePreserved = true

    if (record) {
      const stale = record.sourceEvidenceStateKey !== evidenceStateKey
        || record.sourceRowSignature !== canonicalProfile3DHumanReviewRowSignature(row)
        || record.sourceIntentId !== evidence.sourceIntentId
        || record.sourceSceneId !== evidence.sourceSceneId
        || record.profileCode !== row.profileCode
        || JSON.stringify([...record.nodeIds].sort()) !== JSON.stringify([...row.nodeIds].sort())
      if (stale) {
        state = 'STALE_REVIEW_REQUIRED'
        sourceTracePreserved = false
        warnings.push(`${key} human review is stale because the inspected canonical 3D trace changed.`)
      } else {
        state = stateForDecision(record.decision)
      }
    }

    return {
      targetKind: row.targetKind,
      targetRef: row.targetRef,
      profileCode: row.profileCode,
      systemLabel: row.systemLabel,
      nodeIds: [...row.nodeIds],
      state,
      decision: record?.decision ?? null,
      reviewId: record?.reviewId ?? null,
      reviewedAt: record?.reviewedAt ?? null,
      note: record?.note ?? '',
      sourceTracePreserved,
      humanDecisionRequired: true,
      profileEditableHere: false,
      geometryEditableHere: false,
      productionUnlockAllowed: false,
      machineReady: false,
      productionApproved: false,
    }
  })

  const acceptedCount = rows.filter((row) => row.state === 'HUMAN_ACCEPTED').length
  const correctionRequestedCount = rows.filter((row) => row.state === 'HUMAN_CORRECTION_REQUESTED').length
  const rejectedCount = rows.filter((row) => row.state === 'HUMAN_REJECTED').length
  const staleCount = rows.filter((row) => row.state === 'STALE_REVIEW_REQUIRED').length
  const unreviewedCount = rows.filter((row) => row.state === 'UNREVIEWED').length
  const reviewedCount = acceptedCount + correctionRequestedCount + rejectedCount
  const changesRequired = correctionRequestedCount > 0 || rejectedCount > 0

  let status: CanonicalProfile3DHumanReviewGateStatus
  if (conflicts.length) status = 'BLOCKED_CONFLICT'
  else if (staleCount > 0) status = 'STALE_REVIEW_REQUIRED'
  else if (changesRequired) status = 'HUMAN_CHANGES_REQUIRED'
  else if (rows.length > 0 && acceptedCount === rows.length) status = 'HUMAN_ACCEPTED_PRODUCTION_LOCKED'
  else status = 'HUMAN_REVIEW_INCOMPLETE'

  const humanProfileReviewAccepted = status === 'HUMAN_ACCEPTED_PRODUCTION_LOCKED'

  return {
    version: AI_CANONICAL_PROFILE_3D_HUMAN_REVIEW_GATE_VERSION,
    sourceEvidenceVersion: evidence.version,
    sourceIntentId: evidence.sourceIntentId,
    sourceSceneId: evidence.sourceSceneId,
    sourceEvidenceStateKey: evidenceStateKey,
    status,
    rows,
    conflicts: unique(conflicts),
    warnings: unique(warnings),
    reviewedCount,
    acceptedCount,
    correctionRequestedCount,
    rejectedCount,
    staleCount,
    unreviewedCount,
    humanProfileReviewComplete: humanProfileReviewAccepted,
    humanProfileReviewAccepted,
    changesRequired,
    humanDecisionRequired: true,
    decisionsAreReviewOnly: true,
    canEditProfileAssignmentHere: false,
    canEditGeometryHere: false,
    automaticProfileSelectionAllowed: false,
    automaticSystemAssignmentAllowed: false,
    automaticGeometryAllowed: false,
    exactProfileContourApplied: false,
    productionDeductionsApplied: false,
    manufacturingToleranceApplied: false,
    rulesValidated: false,
    productionUnlockAllowed: false,
    machineReady: false,
    productionApproved: false,
  }
}

export const AI05_3_9_STATE = Object.freeze({
  parent: 'AI05.3' as const,
  parentStatus: 'OPEN / WORKING' as const,
  step: 'AI05.3.9' as const,
  stepStatus: 'WORKING' as const,
  profileData03Status: 'OPEN / WORKING' as const,
  rtp01Status: 'WORKING' as const,
})

export const AI05_3_9_HUMAN_REVIEW_GATE_SAFETY = Object.freeze({
  explicitHumanDecisionRequired: true,
  reviewDecisionOnly: true,
  staleReviewInvalidationRequired: true,
  negativeDecisionNoteRequired: true,
  noProfileInference: true,
  noAssignmentEditing: true,
  noGeometryEditing: true,
  automaticProfileSelectionAllowed: false,
  automaticSystemAssignmentAllowed: false,
  automaticGeometryAllowed: false,
  exactProfileContourApplied: false,
  productionDeductionsApplied: false,
  manufacturingToleranceApplied: false,
  rulesValidated: false,
  productionUnlockAllowed: false,
  machineReady: false,
  productionApproved: false,
})
