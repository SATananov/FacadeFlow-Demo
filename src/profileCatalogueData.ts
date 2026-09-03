import type { CatalogueProfile } from './profileCatalogueTypes'
import { PRELUDE_60_APPLICATION_PROFILES } from './profileData/prelude60CatalogRegistry'

const SAMPLE_TIME = '2026-01-01T00:00:00.000Z'

/**
 * Legacy DEMO-only fixture. Kept unchanged so historical tests and explicit DEMO
 * workflows do not silently start using real catalogue records.
 */
export const sampleCatalogueProfiles: CatalogueProfile[] = [
  { id: 'profile-demo-frame-01', role: 'FRAME', system: 'DEMO SYSTEM', code: 'DEMO-FRAME-01', nameBg: 'Демонстрационна каса', dimensionA: 60, dimensionB: 40, description: 'Заместващи примерни стойности — не са реални каталожни данни.', status: 'DEMONSTRATION', createdAt: SAMPLE_TIME, updatedAt: SAMPLE_TIME, simulationOnly: true, requiresHumanApproval: true },
  { id: 'profile-demo-sash-01', role: 'SASH', system: 'DEMO SYSTEM', code: 'DEMO-SASH-01', nameBg: 'Демонстрационно крило', dimensionA: 52, dimensionB: 36, description: 'Заместващи примерни стойности — не са реални каталожни данни.', status: 'DEMONSTRATION', createdAt: SAMPLE_TIME, updatedAt: SAMPLE_TIME, simulationOnly: true, requiresHumanApproval: true },
  { id: 'profile-demo-mullion-01', role: 'MULLION', system: 'DEMO SYSTEM', code: 'DEMO-MULLION-01', nameBg: 'Демонстрационен делител', dimensionA: 60, dimensionB: 38, description: 'Заместващи примерни стойности — не са реални каталожни данни.', status: 'DEMONSTRATION', createdAt: SAMPLE_TIME, updatedAt: SAMPLE_TIME, simulationOnly: true, requiresHumanApproval: true },
]

/**
 * Actual application seed.
 *
 * DEMO SYSTEM remains available for regression/demo workflows.
 * PRELUDE 60 is the first real catalogue system exposed to the normal constructor.
 */
export const applicationCatalogueProfiles: CatalogueProfile[] = [
  ...sampleCatalogueProfiles,
  ...PRELUDE_60_APPLICATION_PROFILES,
]
