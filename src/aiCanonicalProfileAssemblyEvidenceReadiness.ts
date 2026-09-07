import type {
  CanonicalProfileAssemblyEvidenceReviewSummary,
  CanonicalProfileAssemblyEvidenceReviewSummaryRow,
} from './aiCanonicalProfileAssemblyEvidenceReviewSummary'

export const AI_CANONICAL_PROFILE_ASSEMBLY_EVIDENCE_READINESS_VERSION = 'PROFILE_DATA_03.9' as const

export type CanonicalProfileAssemblyEvidenceRequirementKind =
  | 'HUMAN_WORKING_RELATION_EVIDENCE'
  | 'MANUFACTURER_PAIR_RELATION_EVIDENCE'
  | 'VERIFIED_ASSEMBLY_NODE_EVIDENCE'
  | 'EXACT_JOINT_DOCUMENTATION'

export type CanonicalProfileAssemblyEvidenceReadinessStatus =
  | 'BLOCKED_UPSTREAM'
  | 'BLOCKED_REVIEW_CONFLICT'
  | 'STALE_REVIEW_REQUIRED'
  | 'HUMAN_REVIEW_REQUIRED'
  | 'HUMAN_ACTION_REQUIRED'
  | 'MISSING_EVIDENCE_REQUIREMENTS_IDENTIFIED_PRODUCTION_LOCKED'

export type CanonicalProfileAssemblyEvidenceRequirementAuthority =
  | 'HUMAN_TECHNICAL_CONFIRMATION'
  | 'MANUFACTURER_CATALOGUE_OR_TECHNICAL_DOCUMENT'
  | 'HUMAN_VERIFIED_REAL_ASSEMBLY_NODE'
  | 'MANUFACTURER_OR_ENGINEERING_EXACT_JOINT_DOCUMENT'

export interface CanonicalProfileAssemblyEvidenceRequirement {
  kind: CanonicalProfileAssemblyEvidenceRequirementKind
  state: 'MISSING'
  authorityNeeded: CanonicalProfileAssemblyEvidenceRequirementAuthority
  reason: string
  satisfiedByCurrentEvidence: false
  generatedAutomatically: false
  upgradesEvidenceMaturityAutomatically: false
  validatesProductionCompatibilityAutomatically: false
  productionUnlockEffect: 'NONE'
}

export interface CanonicalProfileAssemblyEvidenceReadinessRow {
  relation: CanonicalProfileAssemblyEvidenceReviewSummaryRow['relation']
  leftRole: CanonicalProfileAssemblyEvidenceReviewSummaryRow['leftRole']
  leftProfileCode: string
  rightRole: CanonicalProfileAssemblyEvidenceReviewSummaryRow['rightRole']
  rightProfileCode: string
  evidenceMaturity: CanonicalProfileAssemblyEvidenceReviewSummaryRow['evidenceMaturity']
  humanReviewState: CanonicalProfileAssemblyEvidenceReviewSummaryRow['humanReviewState']
  currentEvidenceHumanAccepted: boolean
  requirements: CanonicalProfileAssemblyEvidenceRequirement[]
  missingRequirementCount: number
  manufacturerPairRelationEvidencePresent: false
  verifiedAssemblyNodeEvidencePresent: false
  exactJointDocumentationPresent: false
  productionCompatibilityValidated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

export interface CanonicalProfileAssemblyEvidenceReadiness {
  version: typeof AI_CANONICAL_PROFILE_ASSEMBLY_EVIDENCE_READINESS_VERSION
  sourceSummaryVersion: CanonicalProfileAssemblyEvidenceReviewSummary['version']
  sourceIntentId: string
  sourceEvidenceStateKey: string
  sourceHumanReviewStateKey: string
  status: CanonicalProfileAssemblyEvidenceReadinessStatus
  rows: CanonicalProfileAssemblyEvidenceReadinessRow[]
  conflicts: string[]
  warnings: string[]
  relationCount: number
  totalMissingRequirementCount: number
  humanWorkingRelationEvidenceMissingCount: number
  manufacturerPairRelationEvidenceMissingCount: number
  verifiedAssemblyNodeEvidenceMissingCount: number
  exactJointDocumentationMissingCount: number
  requirementsIdentified: boolean
  currentEvidenceHumanReviewGatePassed: boolean
  evidenceReadinessForProductionValidated: false
  requirementsOnly: true
  createsEvidence: false
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

function requirement(
  kind: CanonicalProfileAssemblyEvidenceRequirementKind,
): CanonicalProfileAssemblyEvidenceRequirement {
  if (kind === 'HUMAN_WORKING_RELATION_EVIDENCE') {
    return {
      kind,
      state: 'MISSING',
      authorityNeeded: 'HUMAN_TECHNICAL_CONFIRMATION',
      reason: 'Current relation has conceptual/same-system evidence only; a human-reviewed working relation is not recorded for this pair.',
      satisfiedByCurrentEvidence: false,
      generatedAutomatically: false,
      upgradesEvidenceMaturityAutomatically: false,
      validatesProductionCompatibilityAutomatically: false,
      productionUnlockEffect: 'NONE',
    }
  }
  if (kind === 'MANUFACTURER_PAIR_RELATION_EVIDENCE') {
    return {
      kind,
      state: 'MISSING',
      authorityNeeded: 'MANUFACTURER_CATALOGUE_OR_TECHNICAL_DOCUMENT',
      reason: 'Same-system catalogue membership is not manufacturer evidence for this exact profile pair or assembly relation.',
      satisfiedByCurrentEvidence: false,
      generatedAutomatically: false,
      upgradesEvidenceMaturityAutomatically: false,
      validatesProductionCompatibilityAutomatically: false,
      productionUnlockEffect: 'NONE',
    }
  }
  if (kind === 'VERIFIED_ASSEMBLY_NODE_EVIDENCE') {
    return {
      kind,
      state: 'MISSING',
      authorityNeeded: 'HUMAN_VERIFIED_REAL_ASSEMBLY_NODE',
      reason: 'No real assembly node has been recorded and human-verified for this canonical relation.',
      satisfiedByCurrentEvidence: false,
      generatedAutomatically: false,
      upgradesEvidenceMaturityAutomatically: false,
      validatesProductionCompatibilityAutomatically: false,
      productionUnlockEffect: 'NONE',
    }
  }
  return {
    kind,
    state: 'MISSING',
    authorityNeeded: 'MANUFACTURER_OR_ENGINEERING_EXACT_JOINT_DOCUMENT',
    reason: 'Exact joint documentation/geometry authority is not recorded for this canonical relation.',
    satisfiedByCurrentEvidence: false,
    generatedAutomatically: false,
    upgradesEvidenceMaturityAutomatically: false,
    validatesProductionCompatibilityAutomatically: false,
    productionUnlockEffect: 'NONE',
  }
}

function requirementsForRow(
  row: CanonicalProfileAssemblyEvidenceReviewSummaryRow,
): CanonicalProfileAssemblyEvidenceRequirement[] {
  const requirements: CanonicalProfileAssemblyEvidenceRequirement[] = []

  if (row.evidenceMaturity === 'CONCEPTUAL_AND_CATALOGUE_SYSTEM_ONLY') {
    requirements.push(requirement('HUMAN_WORKING_RELATION_EVIDENCE'))
  }

  requirements.push(
    requirement('MANUFACTURER_PAIR_RELATION_EVIDENCE'),
    requirement('VERIFIED_ASSEMBLY_NODE_EVIDENCE'),
    requirement('EXACT_JOINT_DOCUMENTATION'),
  )

  return requirements
}

function failClosedSafetyConflicts(
  summary: CanonicalProfileAssemblyEvidenceReviewSummary,
): string[] {
  const conflicts: string[] = []

  if (summary.createsManufacturerApproval) {
    conflicts.push('PROFILE DATA 03.8 unexpectedly creates manufacturer approval.')
  }
  if (summary.createsVerifiedAssemblyNodeEvidence) {
    conflicts.push('PROFILE DATA 03.8 unexpectedly creates verified assembly-node evidence.')
  }
  if (summary.validatesExactJointGeometry) {
    conflicts.push('PROFILE DATA 03.8 unexpectedly validates exact joint geometry.')
  }
  if (summary.automaticProfileSelectionAllowed || summary.automaticGeometryAllowed) {
    conflicts.push('PROFILE DATA 03.8 unexpectedly allows automatic profile selection or geometry.')
  }
  if (summary.productionCompatibilityValidated || summary.productionRuleApplied || summary.productionDeductionsApplied) {
    conflicts.push('PROFILE DATA 03.8 unexpectedly reports production compatibility or production rule application.')
  }
  if (summary.manufacturingToleranceApplied || summary.rulesValidated || summary.productionUnlockAllowed || summary.machineReady || summary.productionApproved) {
    conflicts.push('PROFILE DATA 03.8 unexpectedly crosses a production safety boundary.')
  }

  for (const row of summary.rows) {
    if (
      row.manufacturerAssemblyCompatibilityValidated
      || row.verifiedAssemblyNodeEvidence
      || row.exactJointGeometryVerified
      || row.productionCompatibilityValidated
      || row.productionUnlockAllowed
      || row.machineReady
      || row.productionApproved
    ) {
      conflicts.push(`${row.relation} unexpectedly crosses an assembly or production safety boundary.`)
    }
  }

  return conflicts
}

export function buildCanonicalProfileAssemblyEvidenceReadiness(
  summary: CanonicalProfileAssemblyEvidenceReviewSummary,
): CanonicalProfileAssemblyEvidenceReadiness {
  const conflicts = [...summary.conflicts, ...failClosedSafetyConflicts(summary)]
  const warnings = [...summary.warnings]

  const rows: CanonicalProfileAssemblyEvidenceReadinessRow[] = summary.rows.map((row) => {
    const requirements = requirementsForRow(row)
    return {
      relation: row.relation,
      leftRole: row.leftRole,
      leftProfileCode: row.leftProfileCode,
      rightRole: row.rightRole,
      rightProfileCode: row.rightProfileCode,
      evidenceMaturity: row.evidenceMaturity,
      humanReviewState: row.humanReviewState,
      currentEvidenceHumanAccepted: row.acceptedCurrentEvidence,
      requirements,
      missingRequirementCount: requirements.length,
      manufacturerPairRelationEvidencePresent: false,
      verifiedAssemblyNodeEvidencePresent: false,
      exactJointDocumentationPresent: false,
      productionCompatibilityValidated: false,
      productionUnlockAllowed: false,
      machineReady: false,
      productionApproved: false,
    }
  })

  const allRequirements = rows.flatMap((row) => row.requirements)
  const totalMissingRequirementCount = allRequirements.length
  const humanWorkingRelationEvidenceMissingCount = allRequirements.filter((item) => item.kind === 'HUMAN_WORKING_RELATION_EVIDENCE').length
  const manufacturerPairRelationEvidenceMissingCount = allRequirements.filter((item) => item.kind === 'MANUFACTURER_PAIR_RELATION_EVIDENCE').length
  const verifiedAssemblyNodeEvidenceMissingCount = allRequirements.filter((item) => item.kind === 'VERIFIED_ASSEMBLY_NODE_EVIDENCE').length
  const exactJointDocumentationMissingCount = allRequirements.filter((item) => item.kind === 'EXACT_JOINT_DOCUMENTATION').length

  let status: CanonicalProfileAssemblyEvidenceReadinessStatus
  if (summary.status === 'BLOCKED_UPSTREAM') status = 'BLOCKED_UPSTREAM'
  else if (summary.status === 'BLOCKED_REVIEW_CONFLICT' || conflicts.length) status = 'BLOCKED_REVIEW_CONFLICT'
  else if (summary.status === 'STALE_REVIEW_REQUIRED') status = 'STALE_REVIEW_REQUIRED'
  else if (summary.status === 'HUMAN_ACTION_REQUIRED') status = 'HUMAN_ACTION_REQUIRED'
  else if (summary.status === 'HUMAN_REVIEW_INCOMPLETE') status = 'HUMAN_REVIEW_REQUIRED'
  else status = 'MISSING_EVIDENCE_REQUIREMENTS_IDENTIFIED_PRODUCTION_LOCKED'

  return {
    version: AI_CANONICAL_PROFILE_ASSEMBLY_EVIDENCE_READINESS_VERSION,
    sourceSummaryVersion: summary.version,
    sourceIntentId: summary.sourceIntentId,
    sourceEvidenceStateKey: summary.sourceEvidenceStateKey,
    sourceHumanReviewStateKey: summary.sourceHumanReviewStateKey,
    status,
    rows,
    conflicts: unique(conflicts),
    warnings: unique(warnings),
    relationCount: rows.length,
    totalMissingRequirementCount,
    humanWorkingRelationEvidenceMissingCount,
    manufacturerPairRelationEvidenceMissingCount,
    verifiedAssemblyNodeEvidenceMissingCount,
    exactJointDocumentationMissingCount,
    requirementsIdentified: totalMissingRequirementCount > 0,
    currentEvidenceHumanReviewGatePassed: summary.currentEvidenceClassificationReviewGatePassed,
    evidenceReadinessForProductionValidated: false,
    requirementsOnly: true,
    createsEvidence: false,
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

export const PROFILE_DATA_03_9_STATE = Object.freeze({
  parent: 'PROFILE DATA 03' as const,
  parentStatus: 'OPEN / WORKING' as const,
  step: 'PROFILE DATA 03.9' as const,
  stepStatus: 'WORKING' as const,
})

export const PROFILE_DATA_03_9_EVIDENCE_READINESS_SAFETY = Object.freeze({
  requirementsOnly: true,
  createsEvidence: false,
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
