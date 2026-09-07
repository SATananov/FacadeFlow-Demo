import type {
  FacadeFlowCanonicalProfileAssignment,
  FacadeFlowCanonicalProfileAssignmentBridge,
} from './aiCanonicalProfileAssignmentBridge'

export const AI_CANONICAL_PROFILE_ASSIGNMENT_WORKSPACE_REVIEW_VERSION = 'AI05.3.6' as const

export type CanonicalProfileWorkspaceTraceState =
  | 'PRESERVED_TO_DRAWING'
  | 'SOURCE_TRACE_MISSING_OR_MISMATCH'

export interface CanonicalProfileAssignmentWorkspaceRow {
  targetKind: FacadeFlowCanonicalProfileAssignment['targetKind']
  targetRef: string
  role: FacadeFlowCanonicalProfileAssignment['role']
  systemId: string
  systemLabel: string
  profileCode: string
  productIntentCode?: string
  constructionGraphCode?: string
  drawingCode?: string
  traceState: CanonicalProfileWorkspaceTraceState
  conceptual3DReviewState: 'PENDING_REAL_CONCEPTUAL_3D_SCENE'
  assignmentAuthority: 'EXPLICIT_PRODUCT_INTENT_PROPAGATION_ONLY'
  readOnly: true
  humanReviewRequired: true
  automaticProfileSelectionAllowed: false
  automaticSystemAssignmentAllowed: false
  automaticGeometryAllowed: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

export interface CanonicalProfileAssignmentWorkspaceReview {
  version: typeof AI_CANONICAL_PROFILE_ASSIGNMENT_WORKSPACE_REVIEW_VERSION
  sourceBridgeVersion: FacadeFlowCanonicalProfileAssignmentBridge['version']
  sourceIntentId: string
  status: FacadeFlowCanonicalProfileAssignmentBridge['status']
  rows: CanonicalProfileAssignmentWorkspaceRow[]
  missingExplicitAssignments: string[]
  conflicts: string[]
  warnings: string[]
  conceptual3DReviewState: 'PENDING_REAL_CONCEPTUAL_3D_SCENE'
  readOnly: true
  humanReviewRequired: true
  canEditAssignmentsInReview: false
  automaticProfileSelectionAllowed: false
  automaticSystemAssignmentAllowed: false
  automaticGeometryAllowed: false
  exactProfileContourApplied: false
  rulesValidated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

function rowFor(
  assignment: FacadeFlowCanonicalProfileAssignment,
): CanonicalProfileAssignmentWorkspaceRow {
  const traceExact = assignment.layerTrace.productIntent === assignment.profileCode
    && assignment.layerTrace.constructionGraph === assignment.profileCode
    && assignment.layerTrace.drawing === assignment.profileCode

  return {
    targetKind: assignment.targetKind,
    targetRef: assignment.targetRef,
    role: assignment.role,
    systemId: assignment.canonicalIdentity.systemId,
    systemLabel: assignment.canonicalIdentity.systemLabel,
    profileCode: assignment.profileCode,
    productIntentCode: assignment.layerTrace.productIntent,
    constructionGraphCode: assignment.layerTrace.constructionGraph,
    drawingCode: assignment.layerTrace.drawing,
    traceState: traceExact ? 'PRESERVED_TO_DRAWING' : 'SOURCE_TRACE_MISSING_OR_MISMATCH',
    conceptual3DReviewState: 'PENDING_REAL_CONCEPTUAL_3D_SCENE',
    assignmentAuthority: 'EXPLICIT_PRODUCT_INTENT_PROPAGATION_ONLY',
    readOnly: true,
    humanReviewRequired: true,
    automaticProfileSelectionAllowed: false,
    automaticSystemAssignmentAllowed: false,
    automaticGeometryAllowed: false,
    productionUnlockAllowed: false,
    machineReady: false,
    productionApproved: false,
  }
}

export function buildCanonicalProfileAssignmentWorkspaceReview(
  bridge: FacadeFlowCanonicalProfileAssignmentBridge,
): CanonicalProfileAssignmentWorkspaceReview {
  const rows = bridge.assignments.map(rowFor)
  const conflicts = [...bridge.conflicts]

  for (const row of rows) {
    if (row.traceState !== 'PRESERVED_TO_DRAWING') {
      conflicts.push(`${row.targetKind}:${row.targetRef} source trace is missing or changed before workspace review.`)
    }
  }

  const status: FacadeFlowCanonicalProfileAssignmentBridge['status'] = conflicts.length
    ? 'BLOCKED_CONFLICT'
    : bridge.missingExplicitAssignments.length
      ? 'NEEDS_EXPLICIT_PROFILE_ASSIGNMENT'
      : bridge.status

  return {
    version: AI_CANONICAL_PROFILE_ASSIGNMENT_WORKSPACE_REVIEW_VERSION,
    sourceBridgeVersion: bridge.version,
    sourceIntentId: bridge.sourceIntentId,
    status,
    rows,
    missingExplicitAssignments: [...bridge.missingExplicitAssignments],
    conflicts: [...new Set(conflicts)],
    warnings: [...new Set(bridge.warnings)],
    conceptual3DReviewState: 'PENDING_REAL_CONCEPTUAL_3D_SCENE',
    readOnly: true,
    humanReviewRequired: true,
    canEditAssignmentsInReview: false,
    automaticProfileSelectionAllowed: false,
    automaticSystemAssignmentAllowed: false,
    automaticGeometryAllowed: false,
    exactProfileContourApplied: false,
    rulesValidated: false,
    productionUnlockAllowed: false,
    machineReady: false,
    productionApproved: false,
  }
}

export const AI05_3_6_STATE = Object.freeze({
  parent: 'AI05.3' as const,
  parentStatus: 'OPEN / WORKING' as const,
  step: 'AI05.3.6' as const,
  stepStatus: 'WORKING' as const,
  profileData03Status: 'OPEN / WORKING' as const,
  rtp01Status: 'WORKING' as const,
})

export const AI05_3_6_WORKSPACE_REVIEW_SAFETY = Object.freeze({
  workspaceVisibilityOnly: true,
  readOnlyReviewOnly: true,
  explicitAssignmentsOnly: true,
  noProfileInference: true,
  noAssignmentEditing: true,
  conceptual3DReviewRequiresRealScene: true,
  syntheticConceptual3DSceneAllowed: false,
  automaticProfileSelectionAllowed: false,
  automaticSystemAssignmentAllowed: false,
  automaticGeometryAllowed: false,
  exactProfileContourApplied: false,
  rulesValidated: false,
  productionUnlockAllowed: false,
  machineReady: false,
  productionApproved: false,
})
