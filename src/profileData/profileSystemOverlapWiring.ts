import type { ActiveProfileSelection, CatalogueProfile } from '../profileCatalogueTypes'
import { REGISTERED_PROFILE_CATALOG_SYSTEMS } from './prelude60CatalogRegistry'

export const PROFILE_DATA_01_2A_VERSION = 'PROFILE_DATA_01.2A' as const

export const PROFILE_OVERLAP_WIRING_SAFETY = Object.freeze({
  automaticProfileSelectionAllowed: false,
  automaticSystemInferenceFromDimensionsAllowed: false,
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
      state: 'UNRESOLVED' | 'MIXED_SYSTEMS' | 'UNREGISTERED_SYSTEM' | 'OVERLAP_UNRESOLVED'
      systemLabel: string | null
      sashOverlapMm: null
      source: 'NONE'
      workingValueOnly: true
      productionConfirmationRequired: true
    }

const activeRoleIds = (selection: ActiveProfileSelection) =>
  [selection.FRAME, selection.SASH, selection.MULLION].filter((id): id is string => Boolean(id))

export function resolveActiveProfileSystemOverlap(
  profiles: CatalogueProfile[],
  selection: ActiveProfileSelection,
): ActiveProfileOverlapResolution {
  const ids = activeRoleIds(selection)
  if (ids.length === 0) {
    return {
      state: 'UNRESOLVED',
      systemLabel: null,
      sashOverlapMm: null,
      source: 'NONE',
      workingValueOnly: true,
      productionConfirmationRequired: true,
    }
  }

  const selectedProfiles = ids.map((id) => profiles.find((profile) => profile.id === id)).filter((profile): profile is CatalogueProfile => Boolean(profile))
  if (selectedProfiles.length !== ids.length) {
    return {
      state: 'UNRESOLVED',
      systemLabel: null,
      sashOverlapMm: null,
      source: 'NONE',
      workingValueOnly: true,
      productionConfirmationRequired: true,
    }
  }

  const systems = [...new Set(selectedProfiles.map((profile) => profile.system))]
  if (systems.length !== 1) {
    return {
      state: 'MIXED_SYSTEMS',
      systemLabel: null,
      sashOverlapMm: null,
      source: 'NONE',
      workingValueOnly: true,
      productionConfirmationRequired: true,
    }
  }

  const systemLabel = systems[0]
  const registered = REGISTERED_PROFILE_CATALOG_SYSTEMS.find((system) => system.label === systemLabel)
  if (!registered) {
    return {
      state: 'UNREGISTERED_SYSTEM',
      systemLabel,
      sashOverlapMm: null,
      source: 'NONE',
      workingValueOnly: true,
      productionConfirmationRequired: true,
    }
  }

  if (typeof registered.sashOverlapMm !== 'number' || !Number.isFinite(registered.sashOverlapMm) || registered.sashOverlapMm <= 0) {
    return {
      state: 'OVERLAP_UNRESOLVED',
      systemLabel,
      sashOverlapMm: null,
      source: 'NONE',
      workingValueOnly: true,
      productionConfirmationRequired: true,
    }
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
