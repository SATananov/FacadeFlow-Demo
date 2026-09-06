import { NADEZHDA_HUMAN_PROFILE_MEASUREMENTS } from '../realData/nadezhdaHumanProfileMeasurements'

export const PRELUDE_TECHNICAL_INSPECTOR_VERSION = 'AI_WORKSPACE_REBUILD_03' as const

export type PreludeTechnicalProfileCode = '482.30' | '482.05' | '482.21'
export type PreludeTechnicalProfileRole = 'FRAME' | 'SASH' | 'MULLION'
export type PreludeAnchorPlacementStatus = 'CANDIDATE_NOT_YET_BOUND_TO_CONTOUR' | 'UNCONFIRMED_ON_CONTOUR'

export interface PreludeTechnicalProfileRecord {
  code: PreludeTechnicalProfileCode
  system: 'KMG PRELUDE 60'
  role: PreludeTechnicalProfileRole
  roleLabelBg: 'Каса' | 'Крило' | 'Делител'
  sourcePdf: 'PVC Prelude_bg.pdf'
  sourcePage: 2
  catalogueSectionOnlyAsset: string
  catalogueWithDimensionsAsset: string
  catalogueDimensions: {
    systemDepthMm: number
    overallExtentMm?: number
    visibleMm?: number
  }
  humanConfirmedWorkingSemantics: {
    fullWorkingMm: number
    visibleMm: number
    zoneMm: number
    zoneSides: 1 | 2
    formulaBg: string
    noteBg: string
  }
  anchorPlacementStatus: PreludeAnchorPlacementStatus
  verifiedCatalogueVisual: true
  aiRedrawn: false
  isolatedProductionContour: false
  geometricAnchorPointsValidated: false
  assemblyAnchorsValidated: false
  machineReady: false
  productionApproved: false
}

const humanMeasurementByCode = new Map(NADEZHDA_HUMAN_PROFILE_MEASUREMENTS.map((item) => [item.code, item]))

function humanSemantics(code: PreludeTechnicalProfileCode) {
  const measurement = humanMeasurementByCode.get(code)
  if (!measurement) throw new Error(`Missing human-confirmed PRELUDE measurement semantics for ${code}.`)
  return {
    fullWorkingMm: measurement.fullDimensionMm,
    visibleMm: measurement.visibleWidthMm,
    zoneMm: measurement.deductionZoneMm,
    zoneSides: measurement.deductionZoneCount,
    formulaBg: measurement.measurementFormulaBg,
    noteBg: measurement.noteBg,
  } as const
}

export const PRELUDE_TECHNICAL_PROFILES: readonly PreludeTechnicalProfileRecord[] = Object.freeze([
  Object.freeze({
    code: '482.30',
    system: 'KMG PRELUDE 60',
    role: 'FRAME',
    roleLabelBg: 'Каса',
    sourcePdf: 'PVC Prelude_bg.pdf',
    sourcePage: 2,
    catalogueSectionOnlyAsset: '/technical-profile-inspector/prelude60/482_30_section_only.svg',
    catalogueWithDimensionsAsset: '/technical-profile-inspector/prelude60/482_30_with_dimensions.svg',
    catalogueDimensions: { systemDepthMm: 60, overallExtentMm: 64, visibleMm: 42 },
    humanConfirmedWorkingSemantics: humanSemantics('482.30'),
    anchorPlacementStatus: 'CANDIDATE_NOT_YET_BOUND_TO_CONTOUR',
    verifiedCatalogueVisual: true,
    aiRedrawn: false,
    isolatedProductionContour: false,
    geometricAnchorPointsValidated: false,
    assemblyAnchorsValidated: false,
    machineReady: false,
    productionApproved: false,
  }),
  Object.freeze({
    code: '482.05',
    system: 'KMG PRELUDE 60',
    role: 'SASH',
    roleLabelBg: 'Крило',
    sourcePdf: 'PVC Prelude_bg.pdf',
    sourcePage: 2,
    catalogueSectionOnlyAsset: '/technical-profile-inspector/prelude60/482_05_section_only.svg',
    catalogueWithDimensionsAsset: '/technical-profile-inspector/prelude60/482_05_with_dimensions.svg',
    catalogueDimensions: { systemDepthMm: 60, overallExtentMm: 56 },
    humanConfirmedWorkingSemantics: humanSemantics('482.05'),
    anchorPlacementStatus: 'UNCONFIRMED_ON_CONTOUR',
    verifiedCatalogueVisual: true,
    aiRedrawn: false,
    isolatedProductionContour: false,
    geometricAnchorPointsValidated: false,
    assemblyAnchorsValidated: false,
    machineReady: false,
    productionApproved: false,
  }),
  Object.freeze({
    code: '482.21',
    system: 'KMG PRELUDE 60',
    role: 'MULLION',
    roleLabelBg: 'Делител',
    sourcePdf: 'PVC Prelude_bg.pdf',
    sourcePage: 2,
    catalogueSectionOnlyAsset: '/technical-profile-inspector/prelude60/482_21_section_only.svg',
    catalogueWithDimensionsAsset: '/technical-profile-inspector/prelude60/482_21_with_dimensions.svg',
    catalogueDimensions: { systemDepthMm: 60, overallExtentMm: 84, visibleMm: 40 },
    humanConfirmedWorkingSemantics: humanSemantics('482.21'),
    anchorPlacementStatus: 'CANDIDATE_NOT_YET_BOUND_TO_CONTOUR',
    verifiedCatalogueVisual: true,
    aiRedrawn: false,
    isolatedProductionContour: false,
    geometricAnchorPointsValidated: false,
    assemblyAnchorsValidated: false,
    machineReady: false,
    productionApproved: false,
  }),
])

export function preludeTechnicalProfileByCode(value: string | undefined): PreludeTechnicalProfileRecord | undefined {
  if (!value) return undefined
  return PRELUDE_TECHNICAL_PROFILES.find((item) => item.code === value.trim())
}

export const PRELUDE_TECHNICAL_INSPECTOR_SAFETY = Object.freeze({
  verifiedCatalogueVisual: true,
  catalogueVisualIsSourceOfTruth: true,
  aiRedrawn: false,
  exactProductionContourClaimed: false,
  geometricAnchorPointsValidated: false,
  assemblyAnchorsValidated: false,
  automaticGeometryOverwriteAllowed: false,
  automaticProductionUseAllowed: false,
  machineReady: false,
  productionApproved: false,
})
