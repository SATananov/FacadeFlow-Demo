import type { FacadeFlowCanonicalProfileRole } from './prelude60CanonicalProfileIdentity'
import {
  resolvePrelude60CanonicalTechnicalSemantics,
  type Prelude60CanonicalTechnicalSemantics,
} from './prelude60CanonicalTechnicalSemantics'

export const PRELUDE_60_CANONICAL_COMPATIBILITY_SEMANTICS_VERSION = 'PROFILE_DATA_03.5' as const

export type Prelude60CanonicalRoleRelation =
  | 'FRAME_MULLION'
  | 'FRAME_SASH'
  | 'MULLION_SASH'

export type Prelude60CanonicalCompatibilityResolutionState =
  | 'RESOLVED_CONCEPTUAL_SYSTEM_ROLE_RELATION'
  | 'INVALID_LEFT_PROFILE_OR_ROLE'
  | 'INVALID_RIGHT_PROFILE_OR_ROLE'
  | 'SAME_ROLE_NOT_A_PAIR'
  | 'UNSUPPORTED_ROLE_RELATION'
  | 'SYSTEM_MISMATCH'

export interface Prelude60CanonicalCompatibilitySemantics {
  version: typeof PRELUDE_60_CANONICAL_COMPATIBILITY_SEMANTICS_VERSION
  relation: Prelude60CanonicalRoleRelation
  systemId: 'PRELUDE_60'
  systemLabel: 'PRELUDE 60'
  left: Prelude60CanonicalTechnicalSemantics
  right: Prelude60CanonicalTechnicalSemantics
  compatibilityAuthority: 'CANONICAL_SYSTEM_ROLE_COHERENCE_ONLY'
  conceptualRelationEstablished: true
  manufacturerAssemblyCompatibilityState: 'NOT_VALIDATED'
  exactJointGeometryAuthority: 'NOT_ESTABLISHED'
  verifiedAssemblyNodeEvidence: false
  productionCompatibilityValidated: false
  productionRuleApplied: false
  automaticProfileSelectionAllowed: false
  automaticGeometryAllowed: false
  productionDeductionsApplied: false
  manufacturingToleranceApplied: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

export interface Prelude60CanonicalCompatibilityResolution {
  state: Prelude60CanonicalCompatibilityResolutionState
  leftCode?: string
  leftRole: FacadeFlowCanonicalProfileRole
  rightCode?: string
  rightRole: FacadeFlowCanonicalProfileRole
  semantics?: Prelude60CanonicalCompatibilitySemantics
  manufacturerAssemblyCompatibilityState: 'NOT_VALIDATED'
  automaticProfileSelectionAllowed: false
  automaticGeometryAllowed: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

const roleRank: Record<FacadeFlowCanonicalProfileRole, number> = {
  FRAME: 0,
  MULLION: 1,
  SASH: 2,
}

function relationFor(
  left: FacadeFlowCanonicalProfileRole,
  right: FacadeFlowCanonicalProfileRole,
): Prelude60CanonicalRoleRelation | undefined {
  const roles = [left, right].sort((a, b) => roleRank[a] - roleRank[b])
  const key = `${roles[0]}_${roles[1]}`
  if (key === 'FRAME_MULLION' || key === 'FRAME_SASH' || key === 'MULLION_SASH') return key
  return undefined
}

export function resolvePrelude60CanonicalCompatibilitySemantics(input: {
  leftCode?: string
  leftRole: FacadeFlowCanonicalProfileRole
  rightCode?: string
  rightRole: FacadeFlowCanonicalProfileRole
}): Prelude60CanonicalCompatibilityResolution {
  const leftCode = input.leftCode?.trim() || undefined
  const rightCode = input.rightCode?.trim() || undefined
  const base = {
    leftCode,
    leftRole: input.leftRole,
    rightCode,
    rightRole: input.rightRole,
    manufacturerAssemblyCompatibilityState: 'NOT_VALIDATED' as const,
    automaticProfileSelectionAllowed: false as const,
    automaticGeometryAllowed: false as const,
    productionUnlockAllowed: false as const,
    machineReady: false as const,
    productionApproved: false as const,
  }

  const left = resolvePrelude60CanonicalTechnicalSemantics({ profileCode: leftCode, role: input.leftRole })
  if (left.state !== 'RESOLVED_HUMAN_CONFIRMED' || !left.semantics) {
    return { ...base, state: 'INVALID_LEFT_PROFILE_OR_ROLE' }
  }

  const right = resolvePrelude60CanonicalTechnicalSemantics({ profileCode: rightCode, role: input.rightRole })
  if (right.state !== 'RESOLVED_HUMAN_CONFIRMED' || !right.semantics) {
    return { ...base, state: 'INVALID_RIGHT_PROFILE_OR_ROLE' }
  }

  if (left.semantics.systemId !== right.semantics.systemId) {
    return { ...base, state: 'SYSTEM_MISMATCH' }
  }
  if (input.leftRole === input.rightRole) {
    return { ...base, state: 'SAME_ROLE_NOT_A_PAIR' }
  }

  const relation = relationFor(input.leftRole, input.rightRole)
  if (!relation) return { ...base, state: 'UNSUPPORTED_ROLE_RELATION' }

  const semantics: Prelude60CanonicalCompatibilitySemantics = Object.freeze({
    version: PRELUDE_60_CANONICAL_COMPATIBILITY_SEMANTICS_VERSION,
    relation,
    systemId: left.semantics.systemId,
    systemLabel: left.semantics.systemLabel,
    left: left.semantics,
    right: right.semantics,
    compatibilityAuthority: 'CANONICAL_SYSTEM_ROLE_COHERENCE_ONLY' as const,
    conceptualRelationEstablished: true as const,
    manufacturerAssemblyCompatibilityState: 'NOT_VALIDATED' as const,
    exactJointGeometryAuthority: 'NOT_ESTABLISHED' as const,
    verifiedAssemblyNodeEvidence: false as const,
    productionCompatibilityValidated: false as const,
    productionRuleApplied: false as const,
    automaticProfileSelectionAllowed: false as const,
    automaticGeometryAllowed: false as const,
    productionDeductionsApplied: false as const,
    manufacturingToleranceApplied: false as const,
    productionUnlockAllowed: false as const,
    machineReady: false as const,
    productionApproved: false as const,
  })

  return { ...base, state: 'RESOLVED_CONCEPTUAL_SYSTEM_ROLE_RELATION', semantics }
}

export const PROFILE_DATA_03_5_STATE = Object.freeze({
  parent: 'PROFILE DATA 03' as const,
  parentStatus: 'OPEN / WORKING' as const,
  step: 'PROFILE DATA 03.5' as const,
  stepStatus: 'WORKING' as const,
})

export const PRELUDE_60_CANONICAL_COMPATIBILITY_SAFETY = Object.freeze({
  conceptualSystemRoleCoherenceOnly: true,
  manufacturerAssemblyCompatibilityValidated: false,
  exactJointGeometryAuthorityEstablished: false,
  verifiedAssemblyNodeEvidence: false,
  profilePairAutoSelectionAllowed: false,
  automaticProfileSelectionAllowed: false,
  automaticGeometryAllowed: false,
  productionDeductionsApplied: false,
  manufacturingToleranceApplied: false,
  rulesValidated: false,
  productionUnlockAllowed: false,
  machineReady: false,
  productionApproved: false,
})
