import {
  PRELUDE_60_PROFILE_CODES,
  PRELUDE_60_SYSTEM_ID,
  PRELUDE_60_SYSTEM_LABEL,
} from './prelude60BaseProfiles'

export const PRELUDE_60_CANONICAL_PROFILE_IDENTITY_VERSION = 'PROFILE_DATA_03.3' as const

export type FacadeFlowCanonicalProfileRole = 'FRAME' | 'MULLION' | 'SASH'
export type Prelude60CanonicalProfileCode =
  | typeof PRELUDE_60_PROFILE_CODES.frame
  | typeof PRELUDE_60_PROFILE_CODES.mullion
  | typeof PRELUDE_60_PROFILE_CODES.sash

export interface Prelude60CanonicalProfileIdentity {
  systemId: typeof PRELUDE_60_SYSTEM_ID
  systemLabel: typeof PRELUDE_60_SYSTEM_LABEL
  role: FacadeFlowCanonicalProfileRole
  profileCode: Prelude60CanonicalProfileCode
  identityAuthority: 'PROFILE_IDENTITY_ONLY'
  exactContourAuthority: 'NOT_ESTABLISHED'
  geometryAuthority: 'NONE'
  automaticProfileAssignmentAllowed: false
  automaticSystemAssignmentAllowed: false
  machineReady: false
  productionApproved: false
}

export type Prelude60CanonicalProfileResolutionState =
  | 'RESOLVED_EXPLICIT'
  | 'MISSING_EXPLICIT_CODE'
  | 'UNSUPPORTED_OR_MISSING_SYSTEM'
  | 'UNKNOWN_PROFILE_CODE'
  | 'ROLE_MISMATCH'

export interface Prelude60CanonicalProfileResolution {
  state: Prelude60CanonicalProfileResolutionState
  requestedRole: FacadeFlowCanonicalProfileRole
  requestedCode?: string
  requestedSystem?: string
  identity?: Prelude60CanonicalProfileIdentity
  automaticProfileAssignmentAllowed: false
  automaticSystemAssignmentAllowed: false
  machineReady: false
  productionApproved: false
}

const canonicalRows = [
  ['FRAME', PRELUDE_60_PROFILE_CODES.frame],
  ['MULLION', PRELUDE_60_PROFILE_CODES.mullion],
  ['SASH', PRELUDE_60_PROFILE_CODES.sash],
] as const satisfies readonly (readonly [FacadeFlowCanonicalProfileRole, Prelude60CanonicalProfileCode])[]

export const PRELUDE_60_CANONICAL_PROFILE_IDENTITIES: readonly Prelude60CanonicalProfileIdentity[] = Object.freeze(
  canonicalRows.map(([role, profileCode]) => Object.freeze({
    systemId: PRELUDE_60_SYSTEM_ID,
    systemLabel: PRELUDE_60_SYSTEM_LABEL,
    role,
    profileCode,
    identityAuthority: 'PROFILE_IDENTITY_ONLY' as const,
    exactContourAuthority: 'NOT_ESTABLISHED' as const,
    geometryAuthority: 'NONE' as const,
    automaticProfileAssignmentAllowed: false as const,
    automaticSystemAssignmentAllowed: false as const,
    machineReady: false as const,
    productionApproved: false as const,
  })),
)

function normalizeSystem(value: string | undefined) {
  return (value ?? '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim()
}

export function isExplicitPrelude60System(value: string | undefined): boolean {
  const tokens = normalizeSystem(value).split(' ').filter(Boolean)
  return tokens.includes('PRELUDE') && tokens.includes('60')
}

export function prelude60CanonicalProfileIdentityByCode(
  code: string | undefined,
): Prelude60CanonicalProfileIdentity | undefined {
  if (!code) return undefined
  const normalized = code.trim()
  return PRELUDE_60_CANONICAL_PROFILE_IDENTITIES.find((item) => item.profileCode === normalized)
}

export function resolvePrelude60CanonicalProfileIdentity(input: {
  system?: string
  role: FacadeFlowCanonicalProfileRole
  explicitCode?: string
}): Prelude60CanonicalProfileResolution {
  const base = {
    requestedRole: input.role,
    requestedCode: input.explicitCode?.trim() || undefined,
    requestedSystem: input.system?.trim() || undefined,
    automaticProfileAssignmentAllowed: false as const,
    automaticSystemAssignmentAllowed: false as const,
    machineReady: false as const,
    productionApproved: false as const,
  }

  if (!base.requestedCode) return { ...base, state: 'MISSING_EXPLICIT_CODE' }
  if (!isExplicitPrelude60System(base.requestedSystem)) return { ...base, state: 'UNSUPPORTED_OR_MISSING_SYSTEM' }

  const identity = prelude60CanonicalProfileIdentityByCode(base.requestedCode)
  if (!identity) return { ...base, state: 'UNKNOWN_PROFILE_CODE' }
  if (identity.role !== input.role) return { ...base, state: 'ROLE_MISMATCH' }

  return { ...base, state: 'RESOLVED_EXPLICIT', identity }
}

export const PROFILE_DATA_03_3_STATE = Object.freeze({
  parent: 'PROFILE DATA 03' as const,
  parentStatus: 'OPEN / WORKING' as const,
  step: 'PROFILE DATA 03.3' as const,
  stepStatus: 'WORKING' as const,
})

export const PRELUDE_60_CANONICAL_PROFILE_IDENTITY_SAFETY = Object.freeze({
  profileIdentityOnly: true,
  catalogueAndHumanGeometryRemainSeparate: true,
  dimensionsMergedIntoIdentity: false,
  exactContourAuthorityEstablished: false,
  automaticProfileAssignmentAllowed: false,
  automaticSystemAssignmentAllowed: false,
  automaticGeometryAllowed: false,
  automaticProductionUseAllowed: false,
  machineReady: false,
  productionApproved: false,
})
