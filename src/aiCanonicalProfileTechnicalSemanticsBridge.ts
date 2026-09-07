import type {
  FacadeFlowCanonicalProfileAssignment,
  FacadeFlowCanonicalProfileAssignmentBridge,
} from './aiCanonicalProfileAssignmentBridge'
import {
  resolvePrelude60CanonicalTechnicalSemantics,
  type Prelude60CanonicalTechnicalSemantics,
} from './profileData/prelude60CanonicalTechnicalSemantics'

export const AI_CANONICAL_PROFILE_TECHNICAL_SEMANTICS_BRIDGE_VERSION = 'PROFILE_DATA_03.4_AI_BRIDGE' as const

export type CanonicalProfileTechnicalSemanticsBridgeStatus =
  | 'READY_FOR_HUMAN_REVIEW'
  | 'BLOCKED_UPSTREAM'
  | 'BLOCKED_SEMANTIC_CONFLICT'

export interface CanonicalProfileTechnicalSemanticsRow {
  targetKind: FacadeFlowCanonicalProfileAssignment['targetKind']
  targetRef: string
  profileCode: string
  role: FacadeFlowCanonicalProfileAssignment['role']
  semantics: Prelude60CanonicalTechnicalSemantics
  sourceAssignmentAuthority: FacadeFlowCanonicalProfileAssignment['assignmentAuthority']
  semanticAuthority: 'HUMAN_CONFIRMED_WORKING_SEMANTICS'
  exactSectionContourApplied: false
  geometryMutatedBySemantics: false
  productionDeductionsApplied: false
  manufacturingToleranceApplied: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

export interface CanonicalProfileTechnicalSemanticsBridge {
  version: typeof AI_CANONICAL_PROFILE_TECHNICAL_SEMANTICS_BRIDGE_VERSION
  sourceBridgeVersion: FacadeFlowCanonicalProfileAssignmentBridge['version']
  sourceIntentId: string
  status: CanonicalProfileTechnicalSemanticsBridgeStatus
  rows: CanonicalProfileTechnicalSemanticsRow[]
  conflicts: string[]
  warnings: string[]
  humanReviewRequired: true
  technicalSemanticsReadOnly: true
  canonicalAssignmentPreserved: true
  exactSectionContourApplied: false
  geometryMutatedBySemantics: false
  productionDeductionsApplied: false
  manufacturingToleranceApplied: false
  automaticProfileSelectionAllowed: false
  automaticGeometryAllowed: false
  rulesValidated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

export function buildCanonicalProfileTechnicalSemanticsBridge(
  bridge: FacadeFlowCanonicalProfileAssignmentBridge,
): CanonicalProfileTechnicalSemanticsBridge {
  const rows: CanonicalProfileTechnicalSemanticsRow[] = []
  const conflicts = [...bridge.conflicts]
  const warnings = [...bridge.warnings]

  if (bridge.status !== 'READY_FOR_HUMAN_REVIEW') {
    conflicts.push(`AI05.3.4 canonical profile assignment bridge is ${bridge.status}; technical semantics are blocked.`)
  }

  for (const assignment of bridge.assignments) {
    const resolution = resolvePrelude60CanonicalTechnicalSemantics({
      profileCode: assignment.profileCode,
      role: assignment.role,
    })
    if (resolution.state !== 'RESOLVED_HUMAN_CONFIRMED' || !resolution.semantics) {
      conflicts.push(`${assignment.targetKind}:${assignment.targetRef} technical semantics cannot resolve: ${resolution.state}.`)
      continue
    }

    if (
      resolution.semantics.profileCode !== assignment.profileCode
      || resolution.semantics.role !== assignment.role
      || resolution.semantics.systemId !== assignment.canonicalIdentity.systemId
    ) {
      conflicts.push(`${assignment.targetKind}:${assignment.targetRef} canonical identity and technical semantics disagree.`)
      continue
    }

    rows.push({
      targetKind: assignment.targetKind,
      targetRef: assignment.targetRef,
      profileCode: assignment.profileCode,
      role: assignment.role,
      semantics: resolution.semantics,
      sourceAssignmentAuthority: assignment.assignmentAuthority,
      semanticAuthority: resolution.semantics.technicalSemanticsAuthority,
      exactSectionContourApplied: false,
      geometryMutatedBySemantics: false,
      productionDeductionsApplied: false,
      manufacturingToleranceApplied: false,
      productionUnlockAllowed: false,
      machineReady: false,
      productionApproved: false,
    })
  }

  const status: CanonicalProfileTechnicalSemanticsBridgeStatus = bridge.status !== 'READY_FOR_HUMAN_REVIEW'
    ? 'BLOCKED_UPSTREAM'
    : conflicts.length
      ? 'BLOCKED_SEMANTIC_CONFLICT'
      : 'READY_FOR_HUMAN_REVIEW'

  return {
    version: AI_CANONICAL_PROFILE_TECHNICAL_SEMANTICS_BRIDGE_VERSION,
    sourceBridgeVersion: bridge.version,
    sourceIntentId: bridge.sourceIntentId,
    status,
    rows,
    conflicts: [...new Set(conflicts)],
    warnings: [...new Set(warnings)],
    humanReviewRequired: true,
    technicalSemanticsReadOnly: true,
    canonicalAssignmentPreserved: true,
    exactSectionContourApplied: false,
    geometryMutatedBySemantics: false,
    productionDeductionsApplied: false,
    manufacturingToleranceApplied: false,
    automaticProfileSelectionAllowed: false,
    automaticGeometryAllowed: false,
    rulesValidated: false,
    productionUnlockAllowed: false,
    machineReady: false,
    productionApproved: false,
  }
}

export const PROFILE_DATA_03_4_AI_BRIDGE_SAFETY = Object.freeze({
  readOnlyTechnicalSemantics: true,
  canonicalAssignmentPreserved: true,
  noProfileInference: true,
  exactSectionContourApplied: false,
  geometryMutatedBySemantics: false,
  productionDeductionsApplied: false,
  manufacturingToleranceApplied: false,
  automaticProfileSelectionAllowed: false,
  automaticGeometryAllowed: false,
  rulesValidated: false,
  productionUnlockAllowed: false,
  machineReady: false,
  productionApproved: false,
})
