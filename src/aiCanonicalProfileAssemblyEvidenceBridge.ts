import type {
  CanonicalProfileCompatibilitySemanticsBridge,
  CanonicalProfileCompatibilitySemanticsRow,
} from './aiCanonicalProfileCompatibilitySemanticsBridge'
import {
  resolvePrelude60CanonicalAssemblyEvidence,
  type Prelude60CanonicalAssemblyEvidence,
} from './profileData/prelude60CanonicalAssemblyEvidence'

export const AI_CANONICAL_PROFILE_ASSEMBLY_EVIDENCE_BRIDGE_VERSION = 'PROFILE_DATA_03.6_AI_BRIDGE' as const

export type CanonicalProfileAssemblyEvidenceBridgeStatus =
  | 'READY_FOR_HUMAN_REVIEW'
  | 'BLOCKED_UPSTREAM'
  | 'BLOCKED_EVIDENCE_CONFLICT'

export interface CanonicalProfileAssemblyEvidenceRow {
  relation: CanonicalProfileCompatibilitySemanticsRow['relation']
  systemId: 'PRELUDE_60'
  systemLabel: 'PRELUDE 60'
  leftRole: CanonicalProfileCompatibilitySemanticsRow['leftRole']
  leftProfileCode: string
  leftTargets: CanonicalProfileCompatibilitySemanticsRow['leftTargets']
  rightRole: CanonicalProfileCompatibilitySemanticsRow['rightRole']
  rightProfileCode: string
  rightTargets: CanonicalProfileCompatibilitySemanticsRow['rightTargets']
  evidence: Prelude60CanonicalAssemblyEvidence
  evidenceMaturity: Prelude60CanonicalAssemblyEvidence['maturity']
  instanceAdjacencyAsserted: false
  manufacturerAssemblyCompatibilityState: 'NOT_VALIDATED'
  verifiedAssemblyNodeEvidence: false
  exactJointGeometryVerified: false
  productionCompatibilityValidated: false
  productionRuleApplied: false
  automaticProfileSelectionAllowed: false
  automaticGeometryAllowed: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

export interface CanonicalProfileAssemblyEvidenceBridge {
  version: typeof AI_CANONICAL_PROFILE_ASSEMBLY_EVIDENCE_BRIDGE_VERSION
  sourceBridgeVersion: CanonicalProfileCompatibilitySemanticsBridge['version']
  sourceIntentId: string
  status: CanonicalProfileAssemblyEvidenceBridgeStatus
  rows: CanonicalProfileAssemblyEvidenceRow[]
  conflicts: string[]
  warnings: string[]
  humanReviewRequired: true
  evidenceLedgerOnly: true
  catalogueEvidenceLimitedToSameSystemMembership: true
  instanceAdjacencyAsserted: false
  manufacturerAssemblyCompatibilityValidated: false
  verifiedAssemblyNodeEvidence: false
  exactJointGeometryVerified: false
  productionCompatibilityValidated: false
  productionRuleApplied: false
  automaticProfileSelectionAllowed: false
  automaticGeometryAllowed: false
  rulesValidated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

const unique = (items: string[]) => [...new Set(items)]

export function buildCanonicalProfileAssemblyEvidenceBridge(
  compatibility: CanonicalProfileCompatibilitySemanticsBridge,
): CanonicalProfileAssemblyEvidenceBridge {
  const conflicts = [...compatibility.conflicts]
  const warnings = [...compatibility.warnings]
  const rows: CanonicalProfileAssemblyEvidenceRow[] = []

  if (compatibility.status !== 'READY_FOR_HUMAN_REVIEW') {
    conflicts.push(`PROFILE DATA 03.5 compatibility semantics bridge is ${compatibility.status}; assembly evidence is blocked.`)
  }

  if (compatibility.manufacturerAssemblyCompatibilityValidated) {
    conflicts.push('PROFILE DATA 03.5 unexpectedly reports manufacturer assembly validation; PROFILE DATA 03.6 fails closed.')
  }
  if (compatibility.instanceAdjacencyAsserted) {
    conflicts.push('PROFILE DATA 03.5 unexpectedly asserts instance adjacency; PROFILE DATA 03.6 fails closed.')
  }

  if (compatibility.status === 'READY_FOR_HUMAN_REVIEW' && conflicts.length === 0) {
    for (const row of compatibility.rows) {
      const evidence = resolvePrelude60CanonicalAssemblyEvidence(row.relation)
      if (evidence.systemId !== row.systemId) {
        conflicts.push(`${row.relation} evidence system ${evidence.systemId} does not match ${row.systemId}.`)
        continue
      }
      rows.push({
        relation: row.relation,
        systemId: row.systemId,
        systemLabel: row.systemLabel,
        leftRole: row.leftRole,
        leftProfileCode: row.leftProfileCode,
        leftTargets: row.leftTargets,
        rightRole: row.rightRole,
        rightProfileCode: row.rightProfileCode,
        rightTargets: row.rightTargets,
        evidence,
        evidenceMaturity: evidence.maturity,
        instanceAdjacencyAsserted: false,
        manufacturerAssemblyCompatibilityState: 'NOT_VALIDATED',
        verifiedAssemblyNodeEvidence: false,
        exactJointGeometryVerified: false,
        productionCompatibilityValidated: false,
        productionRuleApplied: false,
        automaticProfileSelectionAllowed: false,
        automaticGeometryAllowed: false,
        productionUnlockAllowed: false,
        machineReady: false,
        productionApproved: false,
      })
    }
  }

  const status: CanonicalProfileAssemblyEvidenceBridgeStatus = compatibility.status !== 'READY_FOR_HUMAN_REVIEW'
    ? 'BLOCKED_UPSTREAM'
    : conflicts.length
      ? 'BLOCKED_EVIDENCE_CONFLICT'
      : 'READY_FOR_HUMAN_REVIEW'

  return {
    version: AI_CANONICAL_PROFILE_ASSEMBLY_EVIDENCE_BRIDGE_VERSION,
    sourceBridgeVersion: compatibility.version,
    sourceIntentId: compatibility.sourceIntentId,
    status,
    rows,
    conflicts: unique(conflicts),
    warnings: unique(warnings),
    humanReviewRequired: true,
    evidenceLedgerOnly: true,
    catalogueEvidenceLimitedToSameSystemMembership: true,
    instanceAdjacencyAsserted: false,
    manufacturerAssemblyCompatibilityValidated: false,
    verifiedAssemblyNodeEvidence: false,
    exactJointGeometryVerified: false,
    productionCompatibilityValidated: false,
    productionRuleApplied: false,
    automaticProfileSelectionAllowed: false,
    automaticGeometryAllowed: false,
    rulesValidated: false,
    productionUnlockAllowed: false,
    machineReady: false,
    productionApproved: false,
  }
}

export const PROFILE_DATA_03_6_AI_BRIDGE_SAFETY = Object.freeze({
  evidenceLedgerOnly: true,
  catalogueEvidenceLimitedToSameSystemMembership: true,
  humanWorkingRuleIsManufacturerApproval: false,
  noInstanceAdjacencyInference: true,
  manufacturerAssemblyCompatibilityValidated: false,
  verifiedAssemblyNodeEvidence: false,
  exactJointGeometryVerified: false,
  productionCompatibilityValidated: false,
  productionRuleApplied: false,
  automaticProfileSelectionAllowed: false,
  automaticGeometryAllowed: false,
  rulesValidated: false,
  productionUnlockAllowed: false,
  machineReady: false,
  productionApproved: false,
})
