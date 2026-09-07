import {
  prelude60CanonicalProfileIdentityByCode,
  type FacadeFlowCanonicalProfileRole,
  type Prelude60CanonicalProfileCode,
} from './prelude60CanonicalProfileIdentity'
import { prelude60KnowledgeProvenanceByCode } from './prelude60KnowledgeProvenance'
import { preludeTechnicalProfileByCode } from './preludeTechnicalInspector'

export const PRELUDE_60_CANONICAL_TECHNICAL_SEMANTICS_VERSION = 'PROFILE_DATA_03.4' as const

export type Prelude60CanonicalTechnicalSemanticsResolutionState =
  | 'RESOLVED_HUMAN_CONFIRMED'
  | 'UNKNOWN_PROFILE_CODE'
  | 'ROLE_MISMATCH'
  | 'MISSING_TECHNICAL_SOURCE'
  | 'MISSING_PROVENANCE'
  | 'SOURCE_ROLE_CONFLICT'

export interface Prelude60CanonicalTechnicalSemantics {
  version: typeof PRELUDE_60_CANONICAL_TECHNICAL_SEMANTICS_VERSION
  profileCode: Prelude60CanonicalProfileCode
  role: FacadeFlowCanonicalProfileRole
  roleLabelBg: 'Каса' | 'Делител' | 'Крило'
  systemId: 'PRELUDE_60'
  systemLabel: 'PRELUDE 60'
  canonicalIdentityAuthority: 'PROFILE_IDENTITY_ONLY'
  technicalSemanticsAuthority: 'HUMAN_CONFIRMED_WORKING_SEMANTICS'
  sourceOrganisation: 'Надежда'
  sourcePerson: 'Бат Трифон'
  workingDimensions: {
    fullWorkingDimensionMm: number
    visibleWidthMm: number
    referenceZoneMm: 22
    referenceZoneCount: 1 | 2
    formulaBg: string
    interpretation: 'SEMANTIC_VALUES_ONLY_NOT_CONTOUR_GEOMETRY'
  }
  catalogueReference: {
    authority: 'CATALOGUE_REFERENCE_ONLY'
    sourcePdf: 'PVC Prelude_bg.pdf'
    sourcePage: 2
    systemDepthMm: number
    labelledOverallExtentMm: number | null
    labelledVisibleMm: number | null
    comparisonState: 'VISIBLE_WIDTH_AGREES_ACROSS_SOURCES' | 'NOT_DIRECTLY_COMPARABLE'
    visibleWidthAgreement: boolean | null
  }
  sourceMergeState: 'SEPARATE_SOURCES_NO_AUTO_MERGE'
  exactSectionContourAuthority: 'NOT_ESTABLISHED'
  measurementAnchorsBoundToContour: false
  productionDeductionsApplied: false
  manufacturingToleranceApplied: false
  automaticProfileSelectionAllowed: false
  automaticGeometryAllowed: false
  rulesValidated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

export interface Prelude60CanonicalTechnicalSemanticsResolution {
  state: Prelude60CanonicalTechnicalSemanticsResolutionState
  requestedCode?: string
  requestedRole: FacadeFlowCanonicalProfileRole
  semantics?: Prelude60CanonicalTechnicalSemantics
  automaticProfileSelectionAllowed: false
  automaticGeometryAllowed: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

export function resolvePrelude60CanonicalTechnicalSemantics(input: {
  profileCode?: string
  role: FacadeFlowCanonicalProfileRole
}): Prelude60CanonicalTechnicalSemanticsResolution {
  const requestedCode = input.profileCode?.trim() || undefined
  const base = {
    requestedCode,
    requestedRole: input.role,
    automaticProfileSelectionAllowed: false as const,
    automaticGeometryAllowed: false as const,
    productionUnlockAllowed: false as const,
    machineReady: false as const,
    productionApproved: false as const,
  }

  const identity = prelude60CanonicalProfileIdentityByCode(requestedCode)
  if (!identity) return { ...base, state: 'UNKNOWN_PROFILE_CODE' }
  if (identity.role !== input.role) return { ...base, state: 'ROLE_MISMATCH' }

  const technical = preludeTechnicalProfileByCode(identity.profileCode)
  if (!technical) return { ...base, state: 'MISSING_TECHNICAL_SOURCE' }
  const provenance = prelude60KnowledgeProvenanceByCode(identity.profileCode)
  if (!provenance) return { ...base, state: 'MISSING_PROVENANCE' }
  if (technical.role !== identity.role || provenance.role !== identity.role) {
    return { ...base, state: 'SOURCE_ROLE_CONFLICT' }
  }

  const semantics: Prelude60CanonicalTechnicalSemantics = Object.freeze({
    version: PRELUDE_60_CANONICAL_TECHNICAL_SEMANTICS_VERSION,
    profileCode: identity.profileCode,
    role: identity.role,
    roleLabelBg: technical.roleLabelBg,
    systemId: identity.systemId,
    systemLabel: identity.systemLabel,
    canonicalIdentityAuthority: identity.identityAuthority,
    technicalSemanticsAuthority: provenance.humanWorking.authority,
    sourceOrganisation: provenance.humanWorking.sourceOrganisation,
    sourcePerson: provenance.humanWorking.sourcePerson,
    workingDimensions: Object.freeze({
      fullWorkingDimensionMm: provenance.humanWorking.fullWorkingMm,
      visibleWidthMm: provenance.humanWorking.visibleWidthMm,
      referenceZoneMm: provenance.humanWorking.deductionZoneMm,
      referenceZoneCount: provenance.humanWorking.deductionZoneCount,
      formulaBg: provenance.humanWorking.formulaBg,
      interpretation: 'SEMANTIC_VALUES_ONLY_NOT_CONTOUR_GEOMETRY' as const,
    }),
    catalogueReference: Object.freeze({
      authority: provenance.catalogue.authority,
      sourcePdf: provenance.catalogue.sourcePdf,
      sourcePage: provenance.catalogue.sourcePage,
      systemDepthMm: provenance.catalogue.systemDepthMm,
      labelledOverallExtentMm: provenance.catalogue.labelledOverallExtentMm,
      labelledVisibleMm: provenance.catalogue.labelledVisibleMm,
      comparisonState: provenance.comparisonState,
      visibleWidthAgreement: provenance.visibleWidthAgreement,
    }),
    sourceMergeState: provenance.mergeState,
    exactSectionContourAuthority: provenance.exactContourAuthority,
    measurementAnchorsBoundToContour: false as const,
    productionDeductionsApplied: false as const,
    manufacturingToleranceApplied: false as const,
    automaticProfileSelectionAllowed: false as const,
    automaticGeometryAllowed: false as const,
    rulesValidated: false as const,
    productionUnlockAllowed: false as const,
    machineReady: false as const,
    productionApproved: false as const,
  })

  return { ...base, state: 'RESOLVED_HUMAN_CONFIRMED', semantics }
}

export const PROFILE_DATA_03_4_STATE = Object.freeze({
  parent: 'PROFILE DATA 03' as const,
  parentStatus: 'OPEN / WORKING' as const,
  step: 'PROFILE DATA 03.4' as const,
  stepStatus: 'WORKING' as const,
})

export const PRELUDE_60_CANONICAL_TECHNICAL_SEMANTICS_SAFETY = Object.freeze({
  canonicalIdentityPreserved: true,
  humanWorkingSemanticsOnly: true,
  catalogueAndHumanSourcesRemainSeparate: true,
  valuesAreNotExactContourGeometry: true,
  measurementAnchorsBoundToContour: false,
  productionDeductionsApplied: false,
  manufacturingToleranceApplied: false,
  automaticProfileSelectionAllowed: false,
  automaticGeometryAllowed: false,
  rulesValidated: false,
  productionUnlockAllowed: false,
  machineReady: false,
  productionApproved: false,
})
