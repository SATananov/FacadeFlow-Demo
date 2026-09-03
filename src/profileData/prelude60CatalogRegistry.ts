import type { CatalogueProfile, ProfileRole } from '../profileCatalogueTypes'

export const PROFILE_CATALOG_REGISTRY_VERSION = 'PROFILE_DATA_01.1_V3' as const
export const PRELUDE_60_SYSTEM_ID = 'PRELUDE_60' as const
export const PRELUDE_60_SYSTEM_LABEL = 'PRELUDE 60' as const

export type RegisteredCatalogKind = 'REAL_CATALOG'
export type Prelude60CatalogRole = ProfileRole | 'DOOR_SASH' | 'OVERHUNG'
export type Prelude60MeasurementUseState =
  | 'HUMAN_CONFIRMED_BASE_GEOMETRY'
  | 'SOURCE_ONLY_PENDING_ASSEMBLY_CONFIRMATION'
  | 'CATALOG_ONLY_UNMAPPED'

export interface RegisteredProfileCatalogSystem {
  id: string
  manufacturer: string
  label: string
  kind: RegisteredCatalogKind
  systemDepthMm: number
  sourceLabel: string
  automaticProfileSelectionAllowed: false
  automaticProductionUseAllowed: false
  machineReady: false
  productionApproved: false
}

export interface Prelude60CatalogEntry {
  profileCode: string
  catalogRole: Prelude60CatalogRole
  currentAppRole: ProfileRole | null
  nameBg: string
  catalogHeightMm: number | null
  catalogVisibleWidthMm: number | null
  measurementUseState: Prelude60MeasurementUseState
  selectableInCurrentApp: boolean
  sourceLabel: 'PVC Prelude_bg.pdf'
  machineReady: false
  productionApproved: false
}

export const PRELUDE_60_CATALOG_SYSTEM: RegisteredProfileCatalogSystem = Object.freeze({
  id: PRELUDE_60_SYSTEM_ID,
  manufacturer: 'KMG',
  label: PRELUDE_60_SYSTEM_LABEL,
  kind: 'REAL_CATALOG',
  systemDepthMm: 60,
  sourceLabel: 'PVC Prelude_bg.pdf',
  automaticProfileSelectionAllowed: false,
  automaticProductionUseAllowed: false,
  machineReady: false,
  productionApproved: false,
})

/**
 * Source-backed PRELUDE 60 main-profile registry.
 *
 * Only 482.30, 482.21 and 482.05 are bridged into the current FacadeFlow
 * FRAME/SASH/MULLION selector. The remaining source-listed profiles stay
 * catalog-only until their geometry/role use is explicitly reviewed for the app.
 */
export const PRELUDE_60_CATALOG_ENTRIES: readonly Prelude60CatalogEntry[] = Object.freeze([
  {
    profileCode: '482.30',
    catalogRole: 'FRAME',
    currentAppRole: 'FRAME',
    nameBg: 'Каса 482.30',
    catalogHeightMm: 64,
    catalogVisibleWidthMm: 42,
    measurementUseState: 'HUMAN_CONFIRMED_BASE_GEOMETRY',
    selectableInCurrentApp: true,
    sourceLabel: 'PVC Prelude_bg.pdf',
    machineReady: false,
    productionApproved: false,
  },
  {
    profileCode: '482.20',
    catalogRole: 'FRAME',
    currentAppRole: null,
    nameBg: 'Каса 482.20',
    catalogHeightMm: null,
    catalogVisibleWidthMm: null,
    measurementUseState: 'CATALOG_ONLY_UNMAPPED',
    selectableInCurrentApp: false,
    sourceLabel: 'PVC Prelude_bg.pdf',
    machineReady: false,
    productionApproved: false,
  },
  {
    profileCode: '482.05',
    catalogRole: 'SASH',
    currentAppRole: 'SASH',
    nameBg: 'Крило 482.05',
    catalogHeightMm: 56,
    catalogVisibleWidthMm: 34,
    measurementUseState: 'SOURCE_ONLY_PENDING_ASSEMBLY_CONFIRMATION',
    selectableInCurrentApp: true,
    sourceLabel: 'PVC Prelude_bg.pdf',
    machineReady: false,
    productionApproved: false,
  },
  {
    profileCode: '482.18',
    catalogRole: 'SASH',
    currentAppRole: null,
    nameBg: 'Крило 482.18',
    catalogHeightMm: null,
    catalogVisibleWidthMm: null,
    measurementUseState: 'CATALOG_ONLY_UNMAPPED',
    selectableInCurrentApp: false,
    sourceLabel: 'PVC Prelude_bg.pdf',
    machineReady: false,
    productionApproved: false,
  },
  {
    profileCode: '482.25',
    catalogRole: 'SASH',
    currentAppRole: null,
    nameBg: 'Крило 482.25',
    catalogHeightMm: null,
    catalogVisibleWidthMm: null,
    measurementUseState: 'CATALOG_ONLY_UNMAPPED',
    selectableInCurrentApp: false,
    sourceLabel: 'PVC Prelude_bg.pdf',
    machineReady: false,
    productionApproved: false,
  },
  {
    profileCode: '482.23',
    catalogRole: 'SASH',
    currentAppRole: null,
    nameBg: 'Крило 482.23',
    catalogHeightMm: null,
    catalogVisibleWidthMm: null,
    measurementUseState: 'CATALOG_ONLY_UNMAPPED',
    selectableInCurrentApp: false,
    sourceLabel: 'PVC Prelude_bg.pdf',
    machineReady: false,
    productionApproved: false,
  },
  {
    profileCode: '482.21',
    catalogRole: 'MULLION',
    currentAppRole: 'MULLION',
    nameBg: 'Делител 482.21',
    catalogHeightMm: 84,
    catalogVisibleWidthMm: 40,
    measurementUseState: 'HUMAN_CONFIRMED_BASE_GEOMETRY',
    selectableInCurrentApp: true,
    sourceLabel: 'PVC Prelude_bg.pdf',
    machineReady: false,
    productionApproved: false,
  },
  {
    profileCode: '482.24',
    catalogRole: 'MULLION',
    currentAppRole: null,
    nameBg: 'Делител 482.24',
    catalogHeightMm: null,
    catalogVisibleWidthMm: null,
    measurementUseState: 'CATALOG_ONLY_UNMAPPED',
    selectableInCurrentApp: false,
    sourceLabel: 'PVC Prelude_bg.pdf',
    machineReady: false,
    productionApproved: false,
  },
  {
    profileCode: '482.26',
    catalogRole: 'DOOR_SASH',
    currentAppRole: null,
    nameBg: 'Крило за врата 482.26',
    catalogHeightMm: null,
    catalogVisibleWidthMm: null,
    measurementUseState: 'CATALOG_ONLY_UNMAPPED',
    selectableInCurrentApp: false,
    sourceLabel: 'PVC Prelude_bg.pdf',
    machineReady: false,
    productionApproved: false,
  },
  {
    profileCode: '482.27',
    catalogRole: 'DOOR_SASH',
    currentAppRole: null,
    nameBg: 'Крило за врата 482.27',
    catalogHeightMm: null,
    catalogVisibleWidthMm: null,
    measurementUseState: 'CATALOG_ONLY_UNMAPPED',
    selectableInCurrentApp: false,
    sourceLabel: 'PVC Prelude_bg.pdf',
    machineReady: false,
    productionApproved: false,
  },
  {
    profileCode: '482.11',
    catalogRole: 'OVERHUNG',
    currentAppRole: null,
    nameBg: 'Окачен / надстроечен профил 482.11',
    catalogHeightMm: null,
    catalogVisibleWidthMm: null,
    measurementUseState: 'CATALOG_ONLY_UNMAPPED',
    selectableInCurrentApp: false,
    sourceLabel: 'PVC Prelude_bg.pdf',
    machineReady: false,
    productionApproved: false,
  },
])

export const REGISTERED_PROFILE_CATALOG_SYSTEMS: readonly RegisteredProfileCatalogSystem[] =
  Object.freeze([PRELUDE_60_CATALOG_SYSTEM])

const frame = PRELUDE_60_CATALOG_ENTRIES.find(({ profileCode }) => profileCode === '482.30')!
const sash = PRELUDE_60_CATALOG_ENTRIES.find(({ profileCode }) => profileCode === '482.05')!
const mullion = PRELUDE_60_CATALOG_ENTRIES.find(({ profileCode }) => profileCode === '482.21')!

/**
 * Current application bridge.
 *
 * 482.05 carries the catalogue's 56/34 source values, but those values are not
 * promoted to human-confirmed effective sash geometry. The PROFILE DATA 01.1 V2
 * renderer still requires a separate explicit human-confirmed sash visible width.
 */
export const PRELUDE_60_APPLICATION_PROFILES: CatalogueProfile[] = [
  {
    id: 'profile-prelude60-frame-48230',
    role: 'FRAME',
    system: PRELUDE_60_SYSTEM_LABEL,
    code: frame.profileCode,
    nameBg: 'PRELUDE 60 · каса 482.30',
    dimensionA: frame.catalogHeightMm!,
    dimensionB: frame.catalogVisibleWidthMm!,
    description: 'Базова геометрия: височина 64 mm, видима ширина 42 mm. Човешки потвърдена за PROFILE DATA 01.1.',
    status: 'EXPERT_CONFIRMED',
    createdAt: '2026-09-03T00:00:00.000Z',
    updatedAt: '2026-09-03T00:00:00.000Z',
    simulationOnly: true,
    requiresHumanApproval: true,
    sourceEvidenceId: 'prelude60-catalog-48230',
    sourceEvidenceLabel: 'PVC Prelude_bg.pdf · 482.30 frame',
  },
  {
    id: 'profile-prelude60-sash-48205',
    role: 'SASH',
    system: PRELUDE_60_SYSTEM_LABEL,
    code: sash.profileCode,
    nameBg: 'PRELUDE 60 · крило 482.05',
    dimensionA: sash.catalogHeightMm!,
    dimensionB: sash.catalogVisibleWidthMm!,
    description: 'Каталожни source-only стойности 56/34 mm. Ефективната видима геометрия на крилото не се приема автоматично и остава за отделно човешко потвърждение.',
    status: 'SOURCE_EVIDENCE',
    createdAt: '2026-09-03T00:00:00.000Z',
    updatedAt: '2026-09-03T00:00:00.000Z',
    simulationOnly: true,
    requiresHumanApproval: true,
    sourceEvidenceId: 'prelude60-catalog-48205',
    sourceEvidenceLabel: 'PVC Prelude_bg.pdf · 482.05 sash',
    humanRoleReviewStatus: 'HUMAN_CONFIRMED',
    humanRoleConfirmedBy: 'Човешко потвърждение от технолог',
    humanRoleConfirmedAt: '2026-09-03T00:00:00.000Z',
    humanRoleConfirmationNote: 'Ролята е крило. Ефективната видима геометрия и assembly overlap остават отделен review.',
  },
  {
    id: 'profile-prelude60-mullion-48221',
    role: 'MULLION',
    system: PRELUDE_60_SYSTEM_LABEL,
    code: mullion.profileCode,
    nameBg: 'PRELUDE 60 · делител 482.21',
    dimensionA: mullion.catalogHeightMm!,
    dimensionB: mullion.catalogVisibleWidthMm!,
    description: 'Базова геометрия: височина 84 mm, видима ширина 40 mm. Човешки потвърдена за PROFILE DATA 01.1.',
    status: 'EXPERT_CONFIRMED',
    createdAt: '2026-09-03T00:00:00.000Z',
    updatedAt: '2026-09-03T00:00:00.000Z',
    simulationOnly: true,
    requiresHumanApproval: true,
    sourceEvidenceId: 'prelude60-catalog-48221',
    sourceEvidenceLabel: 'PVC Prelude_bg.pdf · 482.21 mullion',
  },
]

export const PRELUDE_60_CATALOG_SAFETY = Object.freeze({
  automaticProfileSelectionAllowed: false,
  automaticCatalogExpansionAllowed: false,
  automaticAssemblyOverlapFormulaAllowed: false,
  effectiveVisibleWidthFromOverlapAllowed: false,
  machineReady: false,
  productionApproved: false,
})
