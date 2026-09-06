import { NADEZHDA_HUMAN_PROFILE_MEASUREMENTS } from '../realData/nadezhdaHumanProfileMeasurements'
import { PRELUDE_TECHNICAL_PROFILES, type PreludeTechnicalProfileCode } from './preludeTechnicalInspector'

export const PRELUDE_60_KNOWLEDGE_PROVENANCE_VERSION = 'PROFILE_DATA_03.2' as const

export type Prelude60KnowledgeComparisonState =
  | 'VISIBLE_WIDTH_AGREES_ACROSS_SOURCES'
  | 'NOT_DIRECTLY_COMPARABLE'

export interface Prelude60KnowledgeProvenanceRecord {
  code: PreludeTechnicalProfileCode
  role: 'FRAME' | 'SASH' | 'MULLION'
  catalogue: {
    authority: 'CATALOGUE_REFERENCE_ONLY'
    sourcePdf: 'PVC Prelude_bg.pdf'
    sourcePage: 2
    verifiedCatalogueVisual: true
    systemDepthMm: number
    labelledOverallExtentMm: number | null
    labelledVisibleMm: number | null
  }
  humanWorking: {
    authority: 'HUMAN_CONFIRMED_WORKING_SEMANTICS'
    sourceOrganisation: 'Надежда'
    sourcePerson: 'Бат Трифон'
    fullWorkingMm: number
    visibleWidthMm: number
    deductionZoneMm: 22
    deductionZoneCount: 1 | 2
    formulaBg: string
  }
  comparisonState: Prelude60KnowledgeComparisonState
  visibleWidthAgreement: boolean | null
  mergeState: 'SEPARATE_SOURCES_NO_AUTO_MERGE'
  exactContourAuthority: 'NOT_ESTABLISHED'
  machineReady: false
  productionApproved: false
}

const humanByCode = new Map(NADEZHDA_HUMAN_PROFILE_MEASUREMENTS.map((item) => [item.code, item]))

export const PRELUDE_60_KNOWLEDGE_PROVENANCE: readonly Prelude60KnowledgeProvenanceRecord[] = Object.freeze(
  PRELUDE_TECHNICAL_PROFILES.map((profile) => {
    const human = humanByCode.get(profile.code)
    if (!human) throw new Error(`Missing human-confirmed PRELUDE knowledge for ${profile.code}.`)
    const catalogueVisible = profile.catalogueDimensions.visibleMm ?? null
    const visibleWidthAgreement = catalogueVisible === null ? null : catalogueVisible === human.visibleWidthMm
    return Object.freeze({
      code: profile.code,
      role: profile.role,
      catalogue: Object.freeze({
        authority: 'CATALOGUE_REFERENCE_ONLY' as const,
        sourcePdf: profile.sourcePdf,
        sourcePage: profile.sourcePage,
        verifiedCatalogueVisual: profile.verifiedCatalogueVisual,
        systemDepthMm: profile.catalogueDimensions.systemDepthMm,
        labelledOverallExtentMm: profile.catalogueDimensions.overallExtentMm ?? null,
        labelledVisibleMm: catalogueVisible,
      }),
      humanWorking: Object.freeze({
        authority: 'HUMAN_CONFIRMED_WORKING_SEMANTICS' as const,
        sourceOrganisation: human.sourceOrganisation,
        sourcePerson: human.sourcePerson,
        fullWorkingMm: human.fullDimensionMm,
        visibleWidthMm: human.visibleWidthMm,
        deductionZoneMm: human.deductionZoneMm,
        deductionZoneCount: human.deductionZoneCount,
        formulaBg: human.measurementFormulaBg,
      }),
      comparisonState: catalogueVisible === null
        ? 'NOT_DIRECTLY_COMPARABLE' as const
        : 'VISIBLE_WIDTH_AGREES_ACROSS_SOURCES' as const,
      visibleWidthAgreement,
      mergeState: 'SEPARATE_SOURCES_NO_AUTO_MERGE' as const,
      exactContourAuthority: 'NOT_ESTABLISHED' as const,
      machineReady: false as const,
      productionApproved: false as const,
    })
  }),
)

export function prelude60KnowledgeProvenanceByCode(code: string | undefined): Prelude60KnowledgeProvenanceRecord | undefined {
  if (!code) return undefined
  return PRELUDE_60_KNOWLEDGE_PROVENANCE.find((item) => item.code === code.trim())
}

export const PRELUDE_60_KNOWLEDGE_PROVENANCE_SAFETY = Object.freeze({
  catalogueAndHumanSourcesRemainSeparate: true,
  automaticCatalogueMergeAllowed: false,
  automaticGeometryOverwriteAllowed: false,
  exactContourAuthorityEstablished: false,
  automaticProductionUseAllowed: false,
  machineReady: false,
  productionApproved: false,
})
