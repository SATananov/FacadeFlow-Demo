import type { CanonicalProfileTechnicalSemanticsBridge } from './aiCanonicalProfileTechnicalSemanticsBridge'
import {
  resolvePrelude60CanonicalCompatibilitySemantics,
  type Prelude60CanonicalCompatibilitySemantics,
} from './profileData/prelude60CanonicalCompatibilitySemantics'
import type { FacadeFlowCanonicalProfileRole } from './profileData/prelude60CanonicalProfileIdentity'

export const AI_CANONICAL_PROFILE_COMPATIBILITY_SEMANTICS_BRIDGE_VERSION = 'PROFILE_DATA_03.5_AI_BRIDGE' as const

export type CanonicalProfileCompatibilitySemanticsBridgeStatus =
  | 'READY_FOR_HUMAN_REVIEW'
  | 'BLOCKED_UPSTREAM'
  | 'BLOCKED_COMPATIBILITY_CONFLICT'

export interface CanonicalProfileCompatibilitySupportingTarget {
  targetKind: 'FRAME' | 'MULLION' | 'SASH'
  targetRef: string
}

export interface CanonicalProfileCompatibilitySemanticsRow {
  relation: Prelude60CanonicalCompatibilitySemantics['relation']
  systemId: 'PRELUDE_60'
  systemLabel: 'PRELUDE 60'
  leftRole: FacadeFlowCanonicalProfileRole
  leftProfileCode: string
  leftTargets: CanonicalProfileCompatibilitySupportingTarget[]
  rightRole: FacadeFlowCanonicalProfileRole
  rightProfileCode: string
  rightTargets: CanonicalProfileCompatibilitySupportingTarget[]
  semantics: Prelude60CanonicalCompatibilitySemantics
  compatibilityAuthority: 'CANONICAL_SYSTEM_ROLE_COHERENCE_ONLY'
  instanceAdjacencyAsserted: false
  manufacturerAssemblyCompatibilityState: 'NOT_VALIDATED'
  exactJointGeometryAuthority: 'NOT_ESTABLISHED'
  productionCompatibilityValidated: false
  productionRuleApplied: false
  automaticProfileSelectionAllowed: false
  automaticGeometryAllowed: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

export interface CanonicalProfileCompatibilitySemanticsBridge {
  version: typeof AI_CANONICAL_PROFILE_COMPATIBILITY_SEMANTICS_BRIDGE_VERSION
  sourceBridgeVersion: CanonicalProfileTechnicalSemanticsBridge['version']
  sourceIntentId: string
  status: CanonicalProfileCompatibilitySemanticsBridgeStatus
  rows: CanonicalProfileCompatibilitySemanticsRow[]
  conflicts: string[]
  warnings: string[]
  humanReviewRequired: true
  systemRoleCoherenceOnly: true
  instanceAdjacencyAsserted: false
  manufacturerAssemblyCompatibilityValidated: false
  exactJointGeometryApplied: false
  productionCompatibilityValidated: false
  productionRuleApplied: false
  automaticProfileSelectionAllowed: false
  automaticGeometryAllowed: false
  rulesValidated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

interface GroupedCanonicalRole {
  systemId: 'PRELUDE_60'
  systemLabel: 'PRELUDE 60'
  role: FacadeFlowCanonicalProfileRole
  profileCode: string
  targets: CanonicalProfileCompatibilitySupportingTarget[]
}

const unique = (items: string[]) => [...new Set(items)]

export function buildCanonicalProfileCompatibilitySemanticsBridge(
  technical: CanonicalProfileTechnicalSemanticsBridge,
): CanonicalProfileCompatibilitySemanticsBridge {
  const conflicts = [...technical.conflicts]
  const warnings = [...technical.warnings]
  const groups = new Map<string, GroupedCanonicalRole>()

  if (technical.status !== 'READY_FOR_HUMAN_REVIEW') {
    conflicts.push(`PROFILE DATA 03.4 technical semantics bridge is ${technical.status}; compatibility semantics are blocked.`)
  }

  for (const row of technical.rows) {
    const key = `${row.semantics.systemId}:${row.role}:${row.profileCode}`
    const existing = groups.get(key)
    const target = { targetKind: row.targetKind, targetRef: row.targetRef } as const
    if (existing) {
      if (!existing.targets.some((item) => item.targetKind === target.targetKind && item.targetRef === target.targetRef)) {
        existing.targets.push(target)
      }
      continue
    }
    groups.set(key, {
      systemId: row.semantics.systemId,
      systemLabel: row.semantics.systemLabel,
      role: row.role,
      profileCode: row.profileCode,
      targets: [target],
    })
  }

  const grouped = [...groups.values()]
  const uniqueCodesByRole = new Map<FacadeFlowCanonicalProfileRole, Set<string>>()
  for (const group of grouped) {
    const roleCodes = uniqueCodesByRole.get(group.role) ?? new Set<string>()
    roleCodes.add(group.profileCode)
    uniqueCodesByRole.set(group.role, roleCodes)
  }
  for (const [role, codes] of uniqueCodesByRole) {
    if (codes.size > 1) conflicts.push(`Multiple canonical profile codes are present for role ${role}; compatibility semantics fail closed.`)
  }

  const systems = unique(grouped.map((item) => item.systemId))
  if (systems.length > 1) conflicts.push('Canonical technical semantics contain more than one profile system; compatibility semantics fail closed.')

  const rows: CanonicalProfileCompatibilitySemanticsRow[] = []
  if (technical.status === 'READY_FOR_HUMAN_REVIEW' && conflicts.length === 0) {
    for (let i = 0; i < grouped.length; i += 1) {
      for (let j = i + 1; j < grouped.length; j += 1) {
        const left = grouped[i]!
        const right = grouped[j]!
        if (left.role === right.role) continue
        const resolution = resolvePrelude60CanonicalCompatibilitySemantics({
          leftCode: left.profileCode,
          leftRole: left.role,
          rightCode: right.profileCode,
          rightRole: right.role,
        })
        if (resolution.state !== 'RESOLVED_CONCEPTUAL_SYSTEM_ROLE_RELATION' || !resolution.semantics) {
          conflicts.push(`${left.role}:${left.profileCode} ↔ ${right.role}:${right.profileCode} cannot resolve: ${resolution.state}.`)
          continue
        }
        rows.push({
          relation: resolution.semantics.relation,
          systemId: resolution.semantics.systemId,
          systemLabel: resolution.semantics.systemLabel,
          leftRole: left.role,
          leftProfileCode: left.profileCode,
          leftTargets: left.targets,
          rightRole: right.role,
          rightProfileCode: right.profileCode,
          rightTargets: right.targets,
          semantics: resolution.semantics,
          compatibilityAuthority: resolution.semantics.compatibilityAuthority,
          instanceAdjacencyAsserted: false,
          manufacturerAssemblyCompatibilityState: 'NOT_VALIDATED',
          exactJointGeometryAuthority: 'NOT_ESTABLISHED',
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
    if (grouped.length < 2) warnings.push('Only one canonical profile role is present; no pair relation is inferred or invented.')
  }

  const status: CanonicalProfileCompatibilitySemanticsBridgeStatus = technical.status !== 'READY_FOR_HUMAN_REVIEW'
    ? 'BLOCKED_UPSTREAM'
    : conflicts.length
      ? 'BLOCKED_COMPATIBILITY_CONFLICT'
      : 'READY_FOR_HUMAN_REVIEW'

  return {
    version: AI_CANONICAL_PROFILE_COMPATIBILITY_SEMANTICS_BRIDGE_VERSION,
    sourceBridgeVersion: technical.version,
    sourceIntentId: technical.sourceIntentId,
    status,
    rows,
    conflicts: unique(conflicts),
    warnings: unique(warnings),
    humanReviewRequired: true,
    systemRoleCoherenceOnly: true,
    instanceAdjacencyAsserted: false,
    manufacturerAssemblyCompatibilityValidated: false,
    exactJointGeometryApplied: false,
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

export const PROFILE_DATA_03_5_AI_BRIDGE_SAFETY = Object.freeze({
  systemRoleCoherenceOnly: true,
  noInstanceAdjacencyInference: true,
  manufacturerAssemblyCompatibilityValidated: false,
  exactJointGeometryApplied: false,
  productionCompatibilityValidated: false,
  productionRuleApplied: false,
  automaticProfileSelectionAllowed: false,
  automaticGeometryAllowed: false,
  rulesValidated: false,
  productionUnlockAllowed: false,
  machineReady: false,
  productionApproved: false,
})
