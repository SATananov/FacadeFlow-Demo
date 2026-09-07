import type {
  CanonicalProfileAssemblyEvidenceBridge,
  CanonicalProfileAssemblyEvidenceRow,
} from './aiCanonicalProfileAssemblyEvidenceBridge'

export const AI_CANONICAL_PROFILE_ASSEMBLY_EVIDENCE_HUMAN_REVIEW_VERSION = 'PROFILE_DATA_03.7' as const

export type CanonicalProfileAssemblyEvidenceHumanDecision =
  | 'ACCEPT_CURRENT_EVIDENCE'
  | 'REQUEST_MORE_EVIDENCE'
  | 'REJECT_CURRENT_EVIDENCE'

export type CanonicalProfileAssemblyEvidenceHumanReviewRowState =
  | 'UNREVIEWED'
  | 'HUMAN_ACCEPTED_CURRENT_EVIDENCE'
  | 'HUMAN_MORE_EVIDENCE_REQUIRED'
  | 'HUMAN_REJECTED_CURRENT_EVIDENCE'
  | 'STALE_REVIEW_REQUIRED'

export type CanonicalProfileAssemblyEvidenceHumanReviewStatus =
  | 'BLOCKED_UPSTREAM'
  | 'BLOCKED_REVIEW_CONFLICT'
  | 'STALE_REVIEW_REQUIRED'
  | 'HUMAN_REVIEW_INCOMPLETE'
  | 'HUMAN_MORE_EVIDENCE_REQUIRED'
  | 'HUMAN_REVIEWED_PRODUCTION_LOCKED'

export interface CanonicalProfileAssemblyEvidenceHumanReviewInput {
  reviewId: string
  relation: CanonicalProfileAssemblyEvidenceRow['relation']
  reviewerRole: 'TECHNICAL_REVIEWER'
  reviewedAt: string
  decision: CanonicalProfileAssemblyEvidenceHumanDecision
  note?: string
}

export interface CanonicalProfileAssemblyEvidenceHumanReviewRecord {
  version: typeof AI_CANONICAL_PROFILE_ASSEMBLY_EVIDENCE_HUMAN_REVIEW_VERSION
  reviewId: string
  sourceBridgeVersion: CanonicalProfileAssemblyEvidenceBridge['version']
  sourceIntentId: string
  sourceEvidenceStateKey: string
  sourceRowSignature: string
  relation: CanonicalProfileAssemblyEvidenceRow['relation']
  leftRole: CanonicalProfileAssemblyEvidenceRow['leftRole']
  leftProfileCode: string
  rightRole: CanonicalProfileAssemblyEvidenceRow['rightRole']
  rightProfileCode: string
  evidenceMaturity: CanonicalProfileAssemblyEvidenceRow['evidenceMaturity']
  reviewerRole: 'TECHNICAL_REVIEWER'
  reviewedAt: string
  decision: CanonicalProfileAssemblyEvidenceHumanDecision
  note: string
  acceptsManufacturerCompatibility: false
  createsVerifiedAssemblyNodeEvidence: false
  validatesExactJointGeometry: false
  validatesProductionCompatibility: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

export interface CanonicalProfileAssemblyEvidenceHumanReviewRow {
  relation: CanonicalProfileAssemblyEvidenceRow['relation']
  leftRole: CanonicalProfileAssemblyEvidenceRow['leftRole']
  leftProfileCode: string
  rightRole: CanonicalProfileAssemblyEvidenceRow['rightRole']
  rightProfileCode: string
  evidenceMaturity: CanonicalProfileAssemblyEvidenceRow['evidenceMaturity']
  state: CanonicalProfileAssemblyEvidenceHumanReviewRowState
  decision: CanonicalProfileAssemblyEvidenceHumanDecision | null
  reviewId: string | null
  reviewedAt: string | null
  note: string
  sourceEvidencePreserved: boolean
  humanDecisionRequired: true
  evidenceEditableHere: false
  manufacturerAssemblyCompatibilityValidated: false
  verifiedAssemblyNodeEvidence: false
  exactJointGeometryVerified: false
  productionCompatibilityValidated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

export interface CanonicalProfileAssemblyEvidenceHumanReviewGate {
  version: typeof AI_CANONICAL_PROFILE_ASSEMBLY_EVIDENCE_HUMAN_REVIEW_VERSION
  sourceBridgeVersion: CanonicalProfileAssemblyEvidenceBridge['version']
  sourceIntentId: string
  sourceEvidenceStateKey: string
  status: CanonicalProfileAssemblyEvidenceHumanReviewStatus
  rows: CanonicalProfileAssemblyEvidenceHumanReviewRow[]
  conflicts: string[]
  warnings: string[]
  reviewedCount: number
  acceptedCount: number
  moreEvidenceRequiredCount: number
  rejectedCount: number
  staleCount: number
  unreviewedCount: number
  humanEvidenceReviewComplete: boolean
  humanEvidenceReviewAccepted: boolean
  changesRequired: boolean
  humanDecisionRequired: true
  decisionScope: 'CURRENT_EVIDENCE_CLASSIFICATION_ONLY'
  manufacturerAssemblyCompatibilityValidated: false
  verifiedAssemblyNodeEvidence: false
  exactJointGeometryVerified: false
  automaticProfileSelectionAllowed: false
  automaticGeometryAllowed: false
  productionCompatibilityValidated: false
  productionRuleApplied: false
  productionDeductionsApplied: false
  manufacturingToleranceApplied: false
  rulesValidated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

const unique = (items: string[]) => [...new Set(items)]

export function canonicalProfileAssemblyEvidenceRowSignature(
  row: CanonicalProfileAssemblyEvidenceRow,
): string {
  const human = row.evidence.humanWorkingRelationEvidence
  return JSON.stringify({
    relation: row.relation,
    systemId: row.systemId,
    leftRole: row.leftRole,
    leftProfileCode: row.leftProfileCode,
    leftTargets: [...row.leftTargets]
      .map((item) => `${item.targetKind}:${item.targetRef}`)
      .sort(),
    rightRole: row.rightRole,
    rightProfileCode: row.rightProfileCode,
    rightTargets: [...row.rightTargets]
      .map((item) => `${item.targetKind}:${item.targetRef}`)
      .sort(),
    evidenceMaturity: row.evidenceMaturity,
    catalogueState: row.evidence.catalogueSystemEvidence.state,
    catalogueSource: row.evidence.catalogueSystemEvidence.sourceLabel,
    humanWorkingState: human.state,
    humanWorkingRuleKind: human.ruleKind,
    sashOverlapMm: human.sashOverlapMm,
    verifiedAssemblyNodeEvidence: row.verifiedAssemblyNodeEvidence,
    exactJointGeometryVerified: row.exactJointGeometryVerified,
    manufacturerAssemblyCompatibilityState: row.manufacturerAssemblyCompatibilityState,
  })
}

export function canonicalProfileAssemblyEvidenceStateKey(
  bridge: CanonicalProfileAssemblyEvidenceBridge,
): string {
  return JSON.stringify({
    sourceIntentId: bridge.sourceIntentId,
    status: bridge.status,
    rows: [...bridge.rows]
      .sort((a, b) => a.relation.localeCompare(b.relation))
      .map((row) => canonicalProfileAssemblyEvidenceRowSignature(row)),
    conflicts: [...bridge.conflicts].sort(),
  })
}

function requireEligibleBridge(bridge: CanonicalProfileAssemblyEvidenceBridge) {
  if (bridge.status !== 'READY_FOR_HUMAN_REVIEW') {
    throw new Error(`PROFILE DATA 03.6 assembly evidence is ${bridge.status}; human evidence review cannot be recorded.`)
  }
  if (bridge.conflicts.length) {
    throw new Error('PROFILE DATA 03.6 assembly evidence contains conflicts; human evidence review cannot be recorded.')
  }
}

export function createCanonicalProfileAssemblyEvidenceHumanReviewRecord(
  bridge: CanonicalProfileAssemblyEvidenceBridge,
  input: CanonicalProfileAssemblyEvidenceHumanReviewInput,
): CanonicalProfileAssemblyEvidenceHumanReviewRecord {
  requireEligibleBridge(bridge)
  const row = bridge.rows.find((item) => item.relation === input.relation)
  if (!row) throw new Error(`${input.relation} is not present in PROFILE DATA 03.6 assembly evidence.`)

  const reviewId = input.reviewId.trim()
  const reviewedAt = input.reviewedAt.trim()
  const note = input.note?.trim() ?? ''
  if (!reviewId) throw new Error('Assembly evidence human review requires a reviewId.')
  if (!reviewedAt) throw new Error('Assembly evidence human review requires reviewedAt.')
  if (input.decision !== 'ACCEPT_CURRENT_EVIDENCE' && !note) {
    throw new Error(`${input.decision} requires an explicit human review note.`)
  }

  return Object.freeze({
    version: AI_CANONICAL_PROFILE_ASSEMBLY_EVIDENCE_HUMAN_REVIEW_VERSION,
    reviewId,
    sourceBridgeVersion: bridge.version,
    sourceIntentId: bridge.sourceIntentId,
    sourceEvidenceStateKey: canonicalProfileAssemblyEvidenceStateKey(bridge),
    sourceRowSignature: canonicalProfileAssemblyEvidenceRowSignature(row),
    relation: row.relation,
    leftRole: row.leftRole,
    leftProfileCode: row.leftProfileCode,
    rightRole: row.rightRole,
    rightProfileCode: row.rightProfileCode,
    evidenceMaturity: row.evidenceMaturity,
    reviewerRole: input.reviewerRole,
    reviewedAt,
    decision: input.decision,
    note,
    acceptsManufacturerCompatibility: false,
    createsVerifiedAssemblyNodeEvidence: false,
    validatesExactJointGeometry: false,
    validatesProductionCompatibility: false,
    productionUnlockAllowed: false,
    machineReady: false,
    productionApproved: false,
  })
}

function stateForDecision(
  decision: CanonicalProfileAssemblyEvidenceHumanDecision,
): CanonicalProfileAssemblyEvidenceHumanReviewRowState {
  if (decision === 'ACCEPT_CURRENT_EVIDENCE') return 'HUMAN_ACCEPTED_CURRENT_EVIDENCE'
  if (decision === 'REQUEST_MORE_EVIDENCE') return 'HUMAN_MORE_EVIDENCE_REQUIRED'
  return 'HUMAN_REJECTED_CURRENT_EVIDENCE'
}

export function buildCanonicalProfileAssemblyEvidenceHumanReviewGate(input: {
  bridge: CanonicalProfileAssemblyEvidenceBridge
  records?: readonly CanonicalProfileAssemblyEvidenceHumanReviewRecord[]
}): CanonicalProfileAssemblyEvidenceHumanReviewGate {
  const bridge = input.bridge
  const records = input.records ?? []
  const evidenceStateKey = canonicalProfileAssemblyEvidenceStateKey(bridge)
  const conflicts = [...bridge.conflicts]
  const warnings = [...bridge.warnings]
  const rowByRelation = new Map(bridge.rows.map((row) => [row.relation, row]))
  const recordsByRelation = new Map<CanonicalProfileAssemblyEvidenceRow['relation'], CanonicalProfileAssemblyEvidenceHumanReviewRecord[]>()

  if (bridge.status !== 'READY_FOR_HUMAN_REVIEW') {
    conflicts.push(`PROFILE DATA 03.6 assembly evidence is ${bridge.status}; PROFILE DATA 03.7 human review is blocked.`)
  }

  for (const record of records) {
    if (!rowByRelation.has(record.relation)) {
      conflicts.push(`${record.relation} has a human review record but is absent from current PROFILE DATA 03.6 evidence.`)
      continue
    }
    const list = recordsByRelation.get(record.relation) ?? []
    list.push(record)
    recordsByRelation.set(record.relation, list)
  }

  for (const [relation, list] of recordsByRelation) {
    if (list.length > 1) conflicts.push(`${relation} has multiple active human evidence-review records; review is ambiguous.`)
  }

  const rows: CanonicalProfileAssemblyEvidenceHumanReviewRow[] = bridge.rows.map((row) => {
    const matching = recordsByRelation.get(row.relation) ?? []
    const record = matching.length === 1 ? matching[0] : undefined
    let state: CanonicalProfileAssemblyEvidenceHumanReviewRowState = 'UNREVIEWED'
    let sourceEvidencePreserved = true

    if (record) {
      const stale = record.sourceEvidenceStateKey !== evidenceStateKey
        || record.sourceRowSignature !== canonicalProfileAssemblyEvidenceRowSignature(row)
        || record.sourceIntentId !== bridge.sourceIntentId
        || record.evidenceMaturity !== row.evidenceMaturity
        || record.leftProfileCode !== row.leftProfileCode
        || record.rightProfileCode !== row.rightProfileCode
      if (stale) {
        state = 'STALE_REVIEW_REQUIRED'
        sourceEvidencePreserved = false
        warnings.push(`${row.relation} human evidence review is stale because assembly evidence changed.`)
      } else {
        state = stateForDecision(record.decision)
      }
    }

    return {
      relation: row.relation,
      leftRole: row.leftRole,
      leftProfileCode: row.leftProfileCode,
      rightRole: row.rightRole,
      rightProfileCode: row.rightProfileCode,
      evidenceMaturity: row.evidenceMaturity,
      state,
      decision: record?.decision ?? null,
      reviewId: record?.reviewId ?? null,
      reviewedAt: record?.reviewedAt ?? null,
      note: record?.note ?? '',
      sourceEvidencePreserved,
      humanDecisionRequired: true,
      evidenceEditableHere: false,
      manufacturerAssemblyCompatibilityValidated: false,
      verifiedAssemblyNodeEvidence: false,
      exactJointGeometryVerified: false,
      productionCompatibilityValidated: false,
      productionUnlockAllowed: false,
      machineReady: false,
      productionApproved: false,
    }
  })

  const acceptedCount = rows.filter((row) => row.state === 'HUMAN_ACCEPTED_CURRENT_EVIDENCE').length
  const moreEvidenceRequiredCount = rows.filter((row) => row.state === 'HUMAN_MORE_EVIDENCE_REQUIRED').length
  const rejectedCount = rows.filter((row) => row.state === 'HUMAN_REJECTED_CURRENT_EVIDENCE').length
  const staleCount = rows.filter((row) => row.state === 'STALE_REVIEW_REQUIRED').length
  const unreviewedCount = rows.filter((row) => row.state === 'UNREVIEWED').length
  const reviewedCount = acceptedCount + moreEvidenceRequiredCount + rejectedCount
  const changesRequired = moreEvidenceRequiredCount > 0 || rejectedCount > 0
  const humanEvidenceReviewComplete = rows.length > 0 && unreviewedCount === 0 && staleCount === 0 && !changesRequired
  const humanEvidenceReviewAccepted = humanEvidenceReviewComplete && acceptedCount === rows.length

  let status: CanonicalProfileAssemblyEvidenceHumanReviewStatus
  if (bridge.status !== 'READY_FOR_HUMAN_REVIEW') status = 'BLOCKED_UPSTREAM'
  else if (conflicts.length) status = 'BLOCKED_REVIEW_CONFLICT'
  else if (staleCount > 0) status = 'STALE_REVIEW_REQUIRED'
  else if (changesRequired) status = 'HUMAN_MORE_EVIDENCE_REQUIRED'
  else if (!humanEvidenceReviewComplete) status = 'HUMAN_REVIEW_INCOMPLETE'
  else status = 'HUMAN_REVIEWED_PRODUCTION_LOCKED'

  return {
    version: AI_CANONICAL_PROFILE_ASSEMBLY_EVIDENCE_HUMAN_REVIEW_VERSION,
    sourceBridgeVersion: bridge.version,
    sourceIntentId: bridge.sourceIntentId,
    sourceEvidenceStateKey: evidenceStateKey,
    status,
    rows,
    conflicts: unique(conflicts),
    warnings: unique(warnings),
    reviewedCount,
    acceptedCount,
    moreEvidenceRequiredCount,
    rejectedCount,
    staleCount,
    unreviewedCount,
    humanEvidenceReviewComplete,
    humanEvidenceReviewAccepted,
    changesRequired,
    humanDecisionRequired: true,
    decisionScope: 'CURRENT_EVIDENCE_CLASSIFICATION_ONLY',
    manufacturerAssemblyCompatibilityValidated: false,
    verifiedAssemblyNodeEvidence: false,
    exactJointGeometryVerified: false,
    automaticProfileSelectionAllowed: false,
    automaticGeometryAllowed: false,
    productionCompatibilityValidated: false,
    productionRuleApplied: false,
    productionDeductionsApplied: false,
    manufacturingToleranceApplied: false,
    rulesValidated: false,
    productionUnlockAllowed: false,
    machineReady: false,
    productionApproved: false,
  }
}

export const PROFILE_DATA_03_7_STATE = Object.freeze({
  parent: 'PROFILE DATA 03' as const,
  parentStatus: 'OPEN / WORKING' as const,
  step: 'PROFILE DATA 03.7' as const,
  stepStatus: 'WORKING' as const,
})

export const PROFILE_DATA_03_7_HUMAN_REVIEW_SAFETY = Object.freeze({
  humanDecisionRequired: true,
  decisionScopeCurrentEvidenceClassificationOnly: true,
  staleReviewInvalidationRequired: true,
  negativeDecisionNoteRequired: true,
  evidenceEditingAllowedHere: false,
  humanAcceptanceIsManufacturerApproval: false,
  humanAcceptanceCreatesVerifiedAssemblyNodeEvidence: false,
  manufacturerAssemblyCompatibilityValidated: false,
  verifiedAssemblyNodeEvidence: false,
  exactJointGeometryVerified: false,
  automaticProfileSelectionAllowed: false,
  automaticGeometryAllowed: false,
  productionCompatibilityValidated: false,
  productionRuleApplied: false,
  productionDeductionsApplied: false,
  manufacturingToleranceApplied: false,
  rulesValidated: false,
  productionUnlockAllowed: false,
  machineReady: false,
  productionApproved: false,
})
