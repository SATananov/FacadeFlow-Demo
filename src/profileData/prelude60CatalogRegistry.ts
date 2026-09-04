import type { CatalogueProfile, ProfileRole } from '../profileCatalogueTypes'
import { PRELUDE_60_SASH_OVERLAP_PARAMETER } from './sashOverlapGeometry'

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
  sashOverlapMm: number | null
  sashOverlapEditable: true
  sashOverlapState: 'HUMAN_REVIEWED_WORKING_VALUE' | 'UNRESOLVED'
  sashOverlapProductionConfirmationRequired: true
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
  measurementEvidenceKind?: 'CATALOG_SOURCE' | 'HUMAN_TECHNICAL_CONFIRMATION'
  measurementEvidenceNote?: string
  machineReady: false
  productionApproved: false
}

export const PRELUDE_60_CATALOG_SYSTEM: RegisteredProfileCatalogSystem = Object.freeze({
  id: PRELUDE_60_SYSTEM_ID,
  manufacturer: 'KMG',
  label: PRELUDE_60_SYSTEM_LABEL,
  kind: 'REAL_CATALOG',
  systemDepthMm: 60,
  sashOverlapMm: PRELUDE_60_SASH_OVERLAP_PARAMETER.sashOverlapMm,
  sashOverlapEditable: PRELUDE_60_SASH_OVERLAP_PARAMETER.editable,
  sashOverlapState: PRELUDE_60_SASH_OVERLAP_PARAMETER.state,
  sashOverlapProductionConfirmationRequired: PRELUDE_60_SASH_OVERLAP_PARAMETER.exactProductionConfirmationRequired,
  sourceLabel: 'PVC Prelude_bg.pdf',
  automaticProfileSelectionAllowed: false,
  automaticProductionUseAllowed: false,
  machineReady: false,
  productionApproved: false,
})

/**
 * Deferred glazing-bead evidence only.
 *
 * A reviewed example shows 20 mm, while the technologist notes that 22 mm is
 * common. Neither number is a universal PRELUDE constant and neither currently
 * participates in geometry calculations. The glazing-bead dimension is also
 * explicitly separate from the reviewed 7 mm sash-overlap parameter.
 */
export const PRELUDE_60_GLAZING_BEAD_REVIEW = Object.freeze({
  state: 'DEFERRED_NOT_MODELED' as const,
  observedExampleMm: 20,
  commonReferenceMm: 22,
  universalConstantAllowed: false,
  deriveFromProfileDimensionDifferenceAllowed: false,
  participatesInGeometryCalculations: false,
  selectionDependentFutureReview: true,
  separateFromSashOverlap: true,
  note: 'Стъклодържателят е вариращ елемент: има пример 20 mm, а 22 mm е често срещана стойност. Засега не се моделира и не се извежда от разликите във видимата геометрия.',
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
    catalogHeightMm: 78,
    catalogVisibleWidthMm: 56,
    measurementUseState: 'HUMAN_CONFIRMED_BASE_GEOMETRY',
    selectableInCurrentApp: true,
    sourceLabel: 'PVC Prelude_bg.pdf',
    measurementEvidenceKind: 'HUMAN_TECHNICAL_CONFIRMATION',
    measurementEvidenceNote: 'Човешки потвърдени базови размери: височина 78 mm и видима ширина 56 mm. Ефективната ширина в конкретна сглобка остава отделен въпрос.',
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
 * 482.05 now carries human-confirmed base profile geometry 78/56 mm. This does
 * not promote an effective assembled sash width and does not infer glazing-bead
 * geometry. The renderer still requires an explicit assembly-width input where
 * that distinction matters.
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
    description: 'Базова геометрия: височина 78 mm, видима ширина 56 mm. Човешки потвърдена. Ефективната ширина на крилото в конкретна сглобка и размерът на стъклодържателя остават отделни, неизведени автоматично величини.',
    status: 'EXPERT_CONFIRMED',
    createdAt: '2026-09-03T00:00:00.000Z',
    updatedAt: '2026-09-04T00:00:00.000Z',
    simulationOnly: true,
    requiresHumanApproval: true,
    sourceEvidenceId: 'prelude60-human-48205-20260904',
    sourceEvidenceLabel: 'Human technical confirmation · 482.05 sash · 78/56 mm',
    humanRoleReviewStatus: 'HUMAN_CONFIRMED',
    humanRoleConfirmedBy: 'Човешко потвърждение от технолог',
    humanRoleConfirmedAt: '2026-09-03T00:00:00.000Z',
    humanRoleConfirmationNote: 'Ролята е крило. Базовата геометрия 78/56 mm е човешки потвърдена. Ефективната ширина в сглобка, стъклодържателят и 7 mm overlap са отделни понятия.',
    compatibleProductCategories: ['WINDOW'],
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
  systemSpecificSashOverlapRequired: true,
  universalSashOverlapConstantAllowed: false,
  overlapMayReduceFrameOrMullionOnlyWhenAdjacentSashExists: true,
  sashVisibleWidthReductionFromSystemOverlapAllowed: false,
  glazingBeadUniversalConstantAllowed: false,
  deriveGlazingBeadFromProfileDimensionDifferenceAllowed: false,
  glazingBeadGeometryCalculationAllowed: false,
  automaticProfileSelectionAllowed: false,
  automaticCatalogExpansionAllowed: false,
  automaticAssemblyOverlapFormulaAllowed: false,
  effectiveVisibleWidthFromOverlapAllowed: false,
  machineReady: false,
  productionApproved: false,
})
