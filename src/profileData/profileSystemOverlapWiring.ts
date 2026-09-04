import type { ActiveProfileSelection, CatalogueProfile, ProfileRole } from '../profileCatalogueTypes'
import { REGISTERED_PROFILE_CATALOG_SYSTEMS } from './prelude60CatalogRegistry'

export const PROFILE_DATA_01_2A_VERSION = 'PROFILE_DATA_01.2A' as const

export const PROFILE_OVERLAP_WIRING_SAFETY = Object.freeze({
  automaticProfileSelectionAllowed: false,
  automaticSystemInferenceFromDimensionsAllowed: false,
  explicitSashProfileRequired: true,
  roleConsistentSelectionRequired: true,
  globalFallbackOverlapAllowed: false,
  machineReady: false,
  productionApproved: false,
})

export type ActiveProfileOverlapResolution =
  | {
      state: 'APPLIES'
      systemLabel: string
      sashOverlapMm: number
      source: 'REGISTERED_PROFILE_SYSTEM'
      workingValueOnly: true
      productionConfirmationRequired: true
    }
  | {
      state: 'UNRESOLVED' | 'SASH_REQUIRED' | 'MIXED_SYSTEMS' | 'UNREGISTERED_SYSTEM' | 'OVERLAP_UNRESOLVED'
      systemLabel: string | null
      sashOverlapMm: null
      source: 'NONE'
      workingValueOnly: true
      productionConfirmationRequired: true
    }

const unresolved = (
  state: Exclude<ActiveProfileOverlapResolution['state'], 'APPLIES'>,
  systemLabel: string | null = null,
): ActiveProfileOverlapResolution => ({
  state,
  systemLabel,
  sashOverlapMm: null,
  source: 'NONE',
  workingValueOnly: true,
  productionConfirmationRequired: true,
})

const selectedRoleEntries = (selection: ActiveProfileSelection): Array<{ role: ProfileRole; id: string }> =>
  (['FRAME', 'SASH', 'MULLION'] as const)
    .map((role) => ({ role, id: selection[role] }))
    .filter((entry): entry is { role: ProfileRole; id: string } => Boolean(entry.id))

export function resolveActiveProfileSystemOverlap(
  profiles: CatalogueProfile[],
  selection: ActiveProfileSelection,
): ActiveProfileOverlapResolution {
  const entries = selectedRoleEntries(selection)
  if (entries.length === 0) return unresolved('UNRESOLVED')

  const selectedProfiles = entries.map(({ role, id }) => {
    const profile = profiles.find((candidate) => candidate.id === id)
    return profile && profile.role === role ? profile : null
  })
  if (selectedProfiles.some((profile) => profile === null)) return unresolved('UNRESOLVED')

  const resolvedProfiles = selectedProfiles as CatalogueProfile[]
  const systems = [...new Set(resolvedProfiles.map((profile) => profile.system))]
  if (systems.length !== 1) return unresolved('MIXED_SYSTEMS')

  const systemLabel = systems[0]!
  if (!selection.SASH) return unresolved('SASH_REQUIRED', systemLabel)

  const registered = REGISTERED_PROFILE_CATALOG_SYSTEMS.find((system) => system.label === systemLabel)
  if (!registered) return unresolved('UNREGISTERED_SYSTEM', systemLabel)

  if (typeof registered.sashOverlapMm !== 'number' || !Number.isFinite(registered.sashOverlapMm) || registered.sashOverlapMm <= 0) {
    return unresolved('OVERLAP_UNRESOLVED', systemLabel)
  }

  return {
    state: 'APPLIES',
    systemLabel,
    sashOverlapMm: registered.sashOverlapMm,
    source: 'REGISTERED_PROFILE_SYSTEM',
    workingValueOnly: true,
    productionConfirmationRequired: registered.sashOverlapProductionConfirmationRequired,
  }
}
