import { PRELUDE_60_CATALOG_SYSTEM } from './prelude60CatalogRegistry'
import {
  PRELUDE_60_SASH_OVERLAP_PARAMETER,
  type SystemSashOverlapParameter,
} from './sashOverlapGeometry'
import type { Prelude60CanonicalRoleRelation } from './prelude60CanonicalCompatibilitySemantics'

export const PRELUDE_60_CANONICAL_ASSEMBLY_EVIDENCE_VERSION = 'PROFILE_DATA_03.6' as const

export type Prelude60AssemblyEvidenceMaturity =
  | 'CONCEPTUAL_AND_CATALOGUE_SYSTEM_ONLY'
  | 'HUMAN_REVIEWED_WORKING_RELATION_RULE'

export interface Prelude60CanonicalAssemblyEvidence {
  version: typeof PRELUDE_60_CANONICAL_ASSEMBLY_EVIDENCE_VERSION
  relation: Prelude60CanonicalRoleRelation
  systemId: 'PRELUDE_60'
  systemLabel: 'PRELUDE 60'
  maturity: Prelude60AssemblyEvidenceMaturity
  canonicalRelationEvidence: {
    state: 'ESTABLISHED'
    authority: 'PROFILE_DATA_03.5_CANONICAL_SYSTEM_ROLE_COHERENCE'
  }
  catalogueSystemEvidence: {
    state: 'SAME_SYSTEM_MEMBERSHIP_ONLY'
    sourceLabel: 'PVC Prelude_bg.pdf'
    manufacturer: 'KMG'
    supportsManufacturerPairApproval: false
    supportsExactJointGeometry: false
  }
  humanWorkingRelationEvidence: {
    state: 'HUMAN_REVIEWED_WORKING_RULE' | 'NOT_RECORDED_FOR_THIS_RELATION'
    sourceKind: 'HUMAN_TECHNICAL_CONFIRMATION' | null
    ruleKind: 'SYSTEM_SASH_OVERLAP_WHEN_EXPLICITLY_ADJACENT' | null
    sashOverlapMm: number | null
    editable: true | null
    exactProductionConfirmationRequired: true | null
    supportsInstanceAdjacencyInference: false
    supportsManufacturerPairApproval: false
    supportsExactJointGeometry: false
  }
  verifiedAssemblyNodeEvidence: {
    state: 'NOT_RECORDED'
    exactJointGeometryVerified: false
    manufacturerAssemblyNodeVerified: false
  }
  manufacturerAssemblyCompatibilityState: 'NOT_VALIDATED'
  productionCompatibilityValidated: false
  productionRuleApplied: false
  automaticProfileSelectionAllowed: false
  automaticGeometryAllowed: false
  productionDeductionsApplied: false
  manufacturingToleranceApplied: false
  rulesValidated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

function hasHumanReviewedSashRelation(
  relation: Prelude60CanonicalRoleRelation,
): boolean {
  return relation === 'FRAME_SASH' || relation === 'MULLION_SASH'
}

function humanWorkingEvidence(
  relation: Prelude60CanonicalRoleRelation,
  parameter: SystemSashOverlapParameter,
): Prelude60CanonicalAssemblyEvidence['humanWorkingRelationEvidence'] {
  if (!hasHumanReviewedSashRelation(relation)) {
    return Object.freeze({
      state: 'NOT_RECORDED_FOR_THIS_RELATION' as const,
      sourceKind: null,
      ruleKind: null,
      sashOverlapMm: null,
      editable: null,
      exactProductionConfirmationRequired: null,
      supportsInstanceAdjacencyInference: false as const,
      supportsManufacturerPairApproval: false as const,
      supportsExactJointGeometry: false as const,
    })
  }

  return Object.freeze({
    state: 'HUMAN_REVIEWED_WORKING_RULE' as const,
    sourceKind: parameter.sourceKind,
    ruleKind: 'SYSTEM_SASH_OVERLAP_WHEN_EXPLICITLY_ADJACENT' as const,
    sashOverlapMm: parameter.sashOverlapMm,
    editable: parameter.editable,
    exactProductionConfirmationRequired: parameter.exactProductionConfirmationRequired,
    supportsInstanceAdjacencyInference: false as const,
    supportsManufacturerPairApproval: false as const,
    supportsExactJointGeometry: false as const,
  })
}

export function resolvePrelude60CanonicalAssemblyEvidence(
  relation: Prelude60CanonicalRoleRelation,
): Prelude60CanonicalAssemblyEvidence {
  const humanEvidence = humanWorkingEvidence(relation, PRELUDE_60_SASH_OVERLAP_PARAMETER)
  const maturity: Prelude60AssemblyEvidenceMaturity = humanEvidence.state === 'HUMAN_REVIEWED_WORKING_RULE'
    ? 'HUMAN_REVIEWED_WORKING_RELATION_RULE'
    : 'CONCEPTUAL_AND_CATALOGUE_SYSTEM_ONLY'

  return Object.freeze({
    version: PRELUDE_60_CANONICAL_ASSEMBLY_EVIDENCE_VERSION,
    relation,
    systemId: 'PRELUDE_60' as const,
    systemLabel: 'PRELUDE 60' as const,
    maturity,
    canonicalRelationEvidence: Object.freeze({
      state: 'ESTABLISHED' as const,
      authority: 'PROFILE_DATA_03.5_CANONICAL_SYSTEM_ROLE_COHERENCE' as const,
    }),
    catalogueSystemEvidence: Object.freeze({
      state: 'SAME_SYSTEM_MEMBERSHIP_ONLY' as const,
      sourceLabel: PRELUDE_60_CATALOG_SYSTEM.sourceLabel as 'PVC Prelude_bg.pdf',
      manufacturer: PRELUDE_60_CATALOG_SYSTEM.manufacturer as 'KMG',
      supportsManufacturerPairApproval: false as const,
      supportsExactJointGeometry: false as const,
    }),
    humanWorkingRelationEvidence: humanEvidence,
    verifiedAssemblyNodeEvidence: Object.freeze({
      state: 'NOT_RECORDED' as const,
      exactJointGeometryVerified: false as const,
      manufacturerAssemblyNodeVerified: false as const,
    }),
    manufacturerAssemblyCompatibilityState: 'NOT_VALIDATED' as const,
    productionCompatibilityValidated: false as const,
    productionRuleApplied: false as const,
    automaticProfileSelectionAllowed: false as const,
    automaticGeometryAllowed: false as const,
    productionDeductionsApplied: false as const,
    manufacturingToleranceApplied: false as const,
    rulesValidated: false as const,
    productionUnlockAllowed: false as const,
    machineReady: false as const,
    productionApproved: false as const,
  })
}

export const PROFILE_DATA_03_6_STATE = Object.freeze({
  parent: 'PROFILE DATA 03' as const,
  parentStatus: 'OPEN / WORKING' as const,
  step: 'PROFILE DATA 03.6' as const,
  stepStatus: 'WORKING' as const,
})

export const PRELUDE_60_CANONICAL_ASSEMBLY_EVIDENCE_SAFETY = Object.freeze({
  canonicalRelationEvidenceVisible: true,
  catalogueEvidenceLimitedToSameSystemMembership: true,
  humanWorkingRuleEvidenceMayBeVisible: true,
  humanWorkingRuleIsManufacturerApproval: false,
  instanceAdjacencyInferenceAllowed: false,
  verifiedAssemblyNodeEvidence: false,
  manufacturerAssemblyCompatibilityValidated: false,
  exactJointGeometryVerified: false,
  productionCompatibilityValidated: false,
  productionRuleApplied: false,
  automaticProfileSelectionAllowed: false,
  automaticGeometryAllowed: false,
  productionDeductionsApplied: false,
  manufacturingToleranceApplied: false,
  rulesValidated: false,
  productionUnlockAllowed: false,
  machineReady: false,
  productionApproved: false,
})
