import type {
  CanonicalProfileAssemblyEvidenceReadiness,
  CanonicalProfileAssemblyEvidenceReadinessRow,
  CanonicalProfileAssemblyEvidenceRequirement,
  CanonicalProfileAssemblyEvidenceRequirementAuthority,
  CanonicalProfileAssemblyEvidenceRequirementKind,
} from './aiCanonicalProfileAssemblyEvidenceReadiness'

export const AI_CANONICAL_PROFILE_ASSEMBLY_EVIDENCE_INTAKE_VERSION = 'PROFILE_DATA_03.10' as const

export type CanonicalProfileAssemblyEvidenceIntakeStatus =
  | 'BLOCKED_UPSTREAM'
  | 'BLOCKED_INTAKE_CONFLICT'
  | 'NO_MANUAL_EVIDENCE_REGISTERED'
  | 'MANUAL_EVIDENCE_REGISTERED_PENDING_REVIEW'
  | 'STALE_REGISTRATION_REVIEW_REQUIRED'

export type CanonicalProfileAssemblyEvidenceSubmissionState =
  | 'REGISTERED_PENDING_HUMAN_REVIEW'
  | 'STALE_REGISTRATION_REVIEW_REQUIRED'

export interface CanonicalProfileAssemblyEvidenceSubmissionInput {
  submissionId: string
  relation: CanonicalProfileAssemblyEvidenceReadinessRow['relation']
  requirementKind: CanonicalProfileAssemblyEvidenceRequirementKind
  authorityKind: CanonicalProfileAssemblyEvidenceRequirementAuthority
  sourceLabel: string
  sourceRef: string
  submittedByRole: 'TECHNICAL_USER'
  submittedAt: string
  note?: string
}

export interface CanonicalProfileAssemblyEvidenceSubmissionRecord {
  version: typeof AI_CANONICAL_PROFILE_ASSEMBLY_EVIDENCE_INTAKE_VERSION
  submissionId: string
  sourceReadinessVersion: CanonicalProfileAssemblyEvidenceReadiness['version']
  sourceIntentId: string
  sourceReadinessStateKey: string
  sourceRequirementSignature: string
  relation: CanonicalProfileAssemblyEvidenceReadinessRow['relation']
  leftRole: CanonicalProfileAssemblyEvidenceReadinessRow['leftRole']
  leftProfileCode: string
  rightRole: CanonicalProfileAssemblyEvidenceReadinessRow['rightRole']
  rightProfileCode: string
  requirementKind: CanonicalProfileAssemblyEvidenceRequirementKind
  authorityKind: CanonicalProfileAssemblyEvidenceRequirementAuthority
  sourceLabel: string
  sourceRef: string
  submittedByRole: 'TECHNICAL_USER'
  submittedAt: string
  note: string
  registrationState: 'REGISTERED_PENDING_HUMAN_REVIEW'
  humanReviewRequired: true
  sourceVerified: false
  acceptedAsEvidence: false
  satisfiesRequirement: false
  createsManufacturerApproval: false
  createsVerifiedAssemblyNodeEvidence: false
  validatesExactJointGeometry: false
  upgradesEvidenceMaturityAutomatically: false
  validatesProductionCompatibility: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

export interface CanonicalProfileAssemblyEvidenceIntakeRow {
  relation: CanonicalProfileAssemblyEvidenceReadinessRow['relation']
  leftRole: CanonicalProfileAssemblyEvidenceReadinessRow['leftRole']
  leftProfileCode: string
  rightRole: CanonicalProfileAssemblyEvidenceReadinessRow['rightRole']
  rightProfileCode: string
  requirementKind: CanonicalProfileAssemblyEvidenceRequirementKind
  authorityNeeded: CanonicalProfileAssemblyEvidenceRequirementAuthority
  sourceLabel: string
  sourceRef: string
  submittedAt: string
  note: string
  state: CanonicalProfileAssemblyEvidenceSubmissionState
  humanReviewRequired: true
  acceptedAsEvidence: false
  requirementSatisfied: false
  evidenceMaturityUpgraded: false
  productionCompatibilityValidated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

export interface CanonicalProfileAssemblyEvidenceIntakeLedger {
  version: typeof AI_CANONICAL_PROFILE_ASSEMBLY_EVIDENCE_INTAKE_VERSION
  sourceReadinessVersion: CanonicalProfileAssemblyEvidenceReadiness['version']
  sourceIntentId: string
  sourceReadinessStateKey: string
  status: CanonicalProfileAssemblyEvidenceIntakeStatus
  rows: CanonicalProfileAssemblyEvidenceIntakeRow[]
  conflicts: string[]
  warnings: string[]
  registeredCount: number
  pendingHumanReviewCount: number
  staleRegistrationCount: number
  missingRequirementCountPreserved: number
  registrationOnly: true
  manualRegistrationAllowed: true
  humanReviewRequired: true
  registeredSubmissionIsAcceptedEvidence: false
  registeredSubmissionSatisfiesRequirement: false
  createsValidatedEvidence: false
  createsManufacturerApproval: false
  createsVerifiedAssemblyNodeEvidence: false
  validatesExactJointGeometry: false
  upgradesEvidenceMaturityAutomatically: false
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

export function canonicalProfileAssemblyEvidenceRequirementSignature(input: {
  row: CanonicalProfileAssemblyEvidenceReadinessRow
  requirement: CanonicalProfileAssemblyEvidenceRequirement
}): string {
  return JSON.stringify({
    relation: input.row.relation,
    leftRole: input.row.leftRole,
    leftProfileCode: input.row.leftProfileCode,
    rightRole: input.row.rightRole,
    rightProfileCode: input.row.rightProfileCode,
    requirementKind: input.requirement.kind,
    authorityNeeded: input.requirement.authorityNeeded,
    reason: input.requirement.reason,
    requirementState: input.requirement.state,
  })
}

export function canonicalProfileAssemblyEvidenceReadinessStateKey(
  readiness: CanonicalProfileAssemblyEvidenceReadiness,
): string {
  return JSON.stringify({
    sourceIntentId: readiness.sourceIntentId,
    sourceEvidenceStateKey: readiness.sourceEvidenceStateKey,
    sourceHumanReviewStateKey: readiness.sourceHumanReviewStateKey,
    status: readiness.status,
    conflicts: [...readiness.conflicts].sort(),
    rows: [...readiness.rows]
      .sort((a, b) => a.relation.localeCompare(b.relation))
      .map((row) => ({
        relation: row.relation,
        leftProfileCode: row.leftProfileCode,
        rightProfileCode: row.rightProfileCode,
        humanReviewState: row.humanReviewState,
        requirements: row.requirements
          .map((requirement) => canonicalProfileAssemblyEvidenceRequirementSignature({ row, requirement }))
          .sort(),
      })),
  })
}

function intakeEligible(readiness: CanonicalProfileAssemblyEvidenceReadiness): boolean {
  return readiness.status === 'MISSING_EVIDENCE_REQUIREMENTS_IDENTIFIED_PRODUCTION_LOCKED'
    && readiness.currentEvidenceHumanReviewGatePassed
    && readiness.conflicts.length === 0
}

function failClosedSafetyConflicts(readiness: CanonicalProfileAssemblyEvidenceReadiness): string[] {
  const conflicts: string[] = []
  if (readiness.createsEvidence || readiness.createsManufacturerApproval || readiness.createsVerifiedAssemblyNodeEvidence) {
    conflicts.push('PROFILE DATA 03.9 unexpectedly creates or approves evidence; PROFILE DATA 03.10 fails closed.')
  }
  if (readiness.validatesExactJointGeometry || readiness.upgradesEvidenceMaturityAutomatically) {
    conflicts.push('PROFILE DATA 03.9 unexpectedly validates exact joint geometry or upgrades evidence maturity; PROFILE DATA 03.10 fails closed.')
  }
  if (readiness.automaticProfileSelectionAllowed || readiness.automaticGeometryAllowed) {
    conflicts.push('PROFILE DATA 03.9 unexpectedly enables automatic profile selection or geometry; PROFILE DATA 03.10 fails closed.')
  }
  if (
    readiness.productionCompatibilityValidated
    || readiness.productionRuleApplied
    || readiness.productionDeductionsApplied
    || readiness.manufacturingToleranceApplied
    || readiness.rulesValidated
    || readiness.productionUnlockAllowed
    || readiness.machineReady
    || readiness.productionApproved
  ) {
    conflicts.push('PROFILE DATA 03.9 unexpectedly crosses a production safety boundary; PROFILE DATA 03.10 fails closed.')
  }
  return conflicts
}

function currentRequirement(input: {
  readiness: CanonicalProfileAssemblyEvidenceReadiness
  relation: CanonicalProfileAssemblyEvidenceReadinessRow['relation']
  requirementKind: CanonicalProfileAssemblyEvidenceRequirementKind
}): { row: CanonicalProfileAssemblyEvidenceReadinessRow; requirement: CanonicalProfileAssemblyEvidenceRequirement } | null {
  const row = input.readiness.rows.find((item) => item.relation === input.relation)
  if (!row) return null
  const requirement = row.requirements.find((item) => item.kind === input.requirementKind)
  return requirement ? { row, requirement } : null
}

export function createCanonicalProfileAssemblyEvidenceSubmissionRecord(
  readiness: CanonicalProfileAssemblyEvidenceReadiness,
  input: CanonicalProfileAssemblyEvidenceSubmissionInput,
): CanonicalProfileAssemblyEvidenceSubmissionRecord {
  if (!intakeEligible(readiness)) {
    throw new Error(`PROFILE DATA 03.9 readiness is ${readiness.status}; manual evidence registration requires accepted current evidence and an unblocked readiness ledger.`)
  }

  const matched = currentRequirement({ readiness, relation: input.relation, requirementKind: input.requirementKind })
  if (!matched) {
    throw new Error(`${input.relation} / ${input.requirementKind} is not a current missing evidence requirement.`)
  }
  if (input.authorityKind !== matched.requirement.authorityNeeded) {
    throw new Error(`${input.requirementKind} requires authority ${matched.requirement.authorityNeeded}; received ${input.authorityKind}.`)
  }

  const submissionId = input.submissionId.trim()
  const sourceLabel = input.sourceLabel.trim()
  const sourceRef = input.sourceRef.trim()
  const submittedAt = input.submittedAt.trim()
  const note = input.note?.trim() ?? ''
  if (!submissionId) throw new Error('Manual evidence registration requires a submissionId.')
  if (!sourceLabel) throw new Error('Manual evidence registration requires a sourceLabel.')
  if (!sourceRef) throw new Error('Manual evidence registration requires a sourceRef.')
  if (!submittedAt) throw new Error('Manual evidence registration requires submittedAt.')

  return Object.freeze({
    version: AI_CANONICAL_PROFILE_ASSEMBLY_EVIDENCE_INTAKE_VERSION,
    submissionId,
    sourceReadinessVersion: readiness.version,
    sourceIntentId: readiness.sourceIntentId,
    sourceReadinessStateKey: canonicalProfileAssemblyEvidenceReadinessStateKey(readiness),
    sourceRequirementSignature: canonicalProfileAssemblyEvidenceRequirementSignature(matched),
    relation: matched.row.relation,
    leftRole: matched.row.leftRole,
    leftProfileCode: matched.row.leftProfileCode,
    rightRole: matched.row.rightRole,
    rightProfileCode: matched.row.rightProfileCode,
    requirementKind: matched.requirement.kind,
    authorityKind: input.authorityKind,
    sourceLabel,
    sourceRef,
    submittedByRole: input.submittedByRole,
    submittedAt,
    note,
    registrationState: 'REGISTERED_PENDING_HUMAN_REVIEW',
    humanReviewRequired: true,
    sourceVerified: false,
    acceptedAsEvidence: false,
    satisfiesRequirement: false,
    createsManufacturerApproval: false,
    createsVerifiedAssemblyNodeEvidence: false,
    validatesExactJointGeometry: false,
    upgradesEvidenceMaturityAutomatically: false,
    validatesProductionCompatibility: false,
    productionUnlockAllowed: false,
    machineReady: false,
    productionApproved: false,
  })
}

export function buildCanonicalProfileAssemblyEvidenceIntakeLedger(input: {
  readiness: CanonicalProfileAssemblyEvidenceReadiness
  records?: readonly CanonicalProfileAssemblyEvidenceSubmissionRecord[]
}): CanonicalProfileAssemblyEvidenceIntakeLedger {
  const readiness = input.readiness
  const records = input.records ?? []
  const currentStateKey = canonicalProfileAssemblyEvidenceReadinessStateKey(readiness)
  const conflicts = [...readiness.conflicts, ...failClosedSafetyConflicts(readiness)]
  const warnings = [...readiness.warnings]
  const rows: CanonicalProfileAssemblyEvidenceIntakeRow[] = []
  const activeKeyCount = new Map<string, number>()

  for (const record of records) {
    const matched = currentRequirement({ readiness, relation: record.relation, requirementKind: record.requirementKind })
    const currentSignature = matched
      ? canonicalProfileAssemblyEvidenceRequirementSignature(matched)
      : null
    const stale = !matched
      || record.sourceIntentId !== readiness.sourceIntentId
      || record.sourceReadinessVersion !== readiness.version
      || record.sourceReadinessStateKey !== currentStateKey
      || record.sourceRequirementSignature !== currentSignature

    const key = `${record.relation}:${record.requirementKind}`
    if (!stale) activeKeyCount.set(key, (activeKeyCount.get(key) ?? 0) + 1)

    rows.push({
      relation: record.relation,
      leftRole: record.leftRole,
      leftProfileCode: record.leftProfileCode,
      rightRole: record.rightRole,
      rightProfileCode: record.rightProfileCode,
      requirementKind: record.requirementKind,
      authorityNeeded: record.authorityKind,
      sourceLabel: record.sourceLabel,
      sourceRef: record.sourceRef,
      submittedAt: record.submittedAt,
      note: record.note,
      state: stale ? 'STALE_REGISTRATION_REVIEW_REQUIRED' : 'REGISTERED_PENDING_HUMAN_REVIEW',
      humanReviewRequired: true,
      acceptedAsEvidence: false,
      requirementSatisfied: false,
      evidenceMaturityUpgraded: false,
      productionCompatibilityValidated: false,
      productionUnlockAllowed: false,
      machineReady: false,
      productionApproved: false,
    })
  }

  for (const [key, count] of activeKeyCount) {
    if (count > 1) conflicts.push(`${key} has multiple active manual evidence registrations; intake fails closed until the duplicate is resolved.`)
  }

  const staleRegistrationCount = rows.filter((row) => row.state === 'STALE_REGISTRATION_REVIEW_REQUIRED').length
  const pendingHumanReviewCount = rows.filter((row) => row.state === 'REGISTERED_PENDING_HUMAN_REVIEW').length

  let status: CanonicalProfileAssemblyEvidenceIntakeStatus
  if (!intakeEligible(readiness)) status = 'BLOCKED_UPSTREAM'
  else if (conflicts.length) status = 'BLOCKED_INTAKE_CONFLICT'
  else if (staleRegistrationCount) status = 'STALE_REGISTRATION_REVIEW_REQUIRED'
  else if (pendingHumanReviewCount) status = 'MANUAL_EVIDENCE_REGISTERED_PENDING_REVIEW'
  else status = 'NO_MANUAL_EVIDENCE_REGISTERED'

  return {
    version: AI_CANONICAL_PROFILE_ASSEMBLY_EVIDENCE_INTAKE_VERSION,
    sourceReadinessVersion: readiness.version,
    sourceIntentId: readiness.sourceIntentId,
    sourceReadinessStateKey: currentStateKey,
    status,
    rows,
    conflicts: unique(conflicts),
    warnings: unique(warnings),
    registeredCount: rows.length,
    pendingHumanReviewCount,
    staleRegistrationCount,
    missingRequirementCountPreserved: readiness.totalMissingRequirementCount,
    registrationOnly: true,
    manualRegistrationAllowed: true,
    humanReviewRequired: true,
    registeredSubmissionIsAcceptedEvidence: false,
    registeredSubmissionSatisfiesRequirement: false,
    createsValidatedEvidence: false,
    createsManufacturerApproval: false,
    createsVerifiedAssemblyNodeEvidence: false,
    validatesExactJointGeometry: false,
    upgradesEvidenceMaturityAutomatically: false,
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

export const PROFILE_DATA_03_10_STATE = Object.freeze({
  parent: 'PROFILE DATA 03' as const,
  parentStatus: 'OPEN / WORKING' as const,
  step: 'PROFILE DATA 03.10' as const,
  stepStatus: 'WORKING' as const,
})

export const PROFILE_DATA_03_10_EVIDENCE_INTAKE_SAFETY = Object.freeze({
  registrationOnly: true,
  manualRegistrationAllowed: true,
  humanReviewRequired: true,
  registeredSubmissionIsAcceptedEvidence: false,
  registeredSubmissionSatisfiesRequirement: false,
  createsValidatedEvidence: false,
  createsManufacturerApproval: false,
  createsVerifiedAssemblyNodeEvidence: false,
  exactJointGeometryVerified: false,
  upgradesEvidenceMaturityAutomatically: false,
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
