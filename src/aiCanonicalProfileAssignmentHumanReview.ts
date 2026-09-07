import type {
  FacadeFlowCanonicalProfileAssignment,
  FacadeFlowCanonicalProfileAssignmentBridge,
} from './aiCanonicalProfileAssignmentBridge'
import type {
  Conceptual3DCanonicalProfileAssignment,
  Product3DScene,
} from './threeDTypes'

export const AI_CANONICAL_PROFILE_ASSIGNMENT_HUMAN_REVIEW_VERSION = 'AI05.3.5' as const

export type CanonicalProfileAssignmentHumanReviewStatus =
  | 'READY_FOR_HUMAN_REVIEW'
  | 'NEEDS_EXPLICIT_PROFILE_ASSIGNMENT'
  | 'BLOCKED_CONFLICT'

export type CanonicalProfileAssignmentEndToEndState =
  | 'PRESERVED_END_TO_END'
  | 'SOURCE_TRACE_MISSING_OR_MISMATCH'
  | 'CONCEPTUAL_3D_ASSIGNMENT_MISSING'
  | 'CONCEPTUAL_3D_ASSIGNMENT_MISMATCH'

export interface CanonicalProfileAssignmentHumanReviewRow {
  targetKind: FacadeFlowCanonicalProfileAssignment['targetKind']
  targetRef: string
  role: FacadeFlowCanonicalProfileAssignment['role']
  systemId: string
  systemLabel: string
  profileCode: string
  productIntentCode?: string
  constructionGraphCode?: string
  drawingCode?: string
  conceptual3DCode?: string
  endToEndState: CanonicalProfileAssignmentEndToEndState
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

export interface CanonicalProfileAssignmentHumanReview {
  version: typeof AI_CANONICAL_PROFILE_ASSIGNMENT_HUMAN_REVIEW_VERSION
  sourceBridgeVersion: FacadeFlowCanonicalProfileAssignmentBridge['version']
  sourceIntentId: string
  status: CanonicalProfileAssignmentHumanReviewStatus
  rows: CanonicalProfileAssignmentHumanReviewRow[]
  missingExplicitAssignments: string[]
  conflicts: string[]
  warnings: string[]
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

function assignmentKey(targetKind: string, targetRef: string) {
  return `${targetKind}:${targetRef}`
}

function sameStringSet(left: string[], right: string[]) {
  const a = [...new Set(left)].sort()
  const b = [...new Set(right)].sort()
  return a.length === b.length && a.every((item, index) => item === b[index])
}

function conceptualAssignmentFor(
  assignment: FacadeFlowCanonicalProfileAssignment,
  scene: Product3DScene,
): Conceptual3DCanonicalProfileAssignment | undefined {
  return scene.profileAssignmentBridge?.assignments.find(
    (item) => item.targetKind === assignment.targetKind && item.targetRef === assignment.targetRef,
  )
}

function rowFor(
  assignment: FacadeFlowCanonicalProfileAssignment,
  scene: Product3DScene,
  conflicts: string[],
): CanonicalProfileAssignmentHumanReviewRow {
  const conceptual = conceptualAssignmentFor(assignment, scene)
  const traceExact = assignment.layerTrace.productIntent === assignment.profileCode
    && assignment.layerTrace.constructionGraph === assignment.profileCode
    && assignment.layerTrace.drawing === assignment.profileCode
  let endToEndState: CanonicalProfileAssignmentEndToEndState = 'PRESERVED_END_TO_END'

  if (!traceExact) {
    endToEndState = 'SOURCE_TRACE_MISSING_OR_MISMATCH'
    conflicts.push(`${assignmentKey(assignment.targetKind, assignment.targetRef)} AI05.3.4 source trace is missing or does not exactly preserve the assigned profile code.`)
  } else if (!conceptual) {
    endToEndState = 'CONCEPTUAL_3D_ASSIGNMENT_MISSING'
    conflicts.push(`${assignmentKey(assignment.targetKind, assignment.targetRef)} canonical assignment is missing from conceptual 3D metadata.`)
  } else {
    const sameIdentity = conceptual.profileCode === assignment.profileCode
      && conceptual.role === assignment.role
      && conceptual.systemId === assignment.canonicalIdentity.systemId
      && conceptual.systemLabel === assignment.canonicalIdentity.systemLabel

    if (!sameIdentity) {
      endToEndState = 'CONCEPTUAL_3D_ASSIGNMENT_MISMATCH'
      conflicts.push(`${assignmentKey(assignment.targetKind, assignment.targetRef)} conceptual 3D canonical identity does not match the AI05.3.4 bridge.`)
    }
  }

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
    conceptual3DCode: conceptual?.profileCode,
    endToEndState,
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

export function buildCanonicalProfileAssignmentHumanReview(input: {
  bridge: FacadeFlowCanonicalProfileAssignmentBridge
  scene: Product3DScene
}): CanonicalProfileAssignmentHumanReview {
  const conflicts = [...input.bridge.conflicts]
  const warnings = [...input.bridge.warnings]

  const sceneBridge = input.scene.profileAssignmentBridge
  if (!sceneBridge) {
    conflicts.push('Conceptual 3D profileAssignmentBridge metadata is missing; end-to-end profile preservation cannot be reviewed.')
  } else {
    if (sceneBridge.version !== input.bridge.version) {
      conflicts.push(`Conceptual 3D bridge version ${sceneBridge.version} does not match source bridge ${input.bridge.version}.`)
    }
    if (sceneBridge.status !== input.bridge.status) {
      conflicts.push(`Conceptual 3D bridge status ${sceneBridge.status} does not match source bridge ${input.bridge.status}.`)
    }
    if (!sameStringSet(sceneBridge.missingExplicitAssignments, input.bridge.missingExplicitAssignments)) {
      conflicts.push('Conceptual 3D missing-assignment trace does not match the AI05.3.4 bridge.')
    }
    if (!sameStringSet(sceneBridge.conflicts, input.bridge.conflicts)) {
      conflicts.push('Conceptual 3D conflict trace does not match the AI05.3.4 bridge.')
    }

    const sourceKeys = new Set(input.bridge.assignments.map((item) => assignmentKey(item.targetKind, item.targetRef)))
    for (const item of sceneBridge.assignments) {
      const key = assignmentKey(item.targetKind, item.targetRef)
      if (!sourceKeys.has(key)) {
        conflicts.push(`${key} exists in conceptual 3D metadata without an AI05.3.4 source assignment.`)
      }
    }
  }

  const sourceKeys = input.bridge.assignments.map((item) => assignmentKey(item.targetKind, item.targetRef))
  if (new Set(sourceKeys).size !== sourceKeys.length) {
    conflicts.push('AI05.3.4 bridge contains duplicate canonical assignment targets.')
  }
  if (sceneBridge) {
    const sceneKeys = sceneBridge.assignments.map((item) => assignmentKey(item.targetKind, item.targetRef))
    if (new Set(sceneKeys).size !== sceneKeys.length) {
      conflicts.push('Conceptual 3D metadata contains duplicate canonical assignment targets.')
    }
  }

  const rows = input.bridge.assignments.map((assignment) => rowFor(assignment, input.scene, conflicts))

  const status: CanonicalProfileAssignmentHumanReviewStatus = conflicts.length
    ? 'BLOCKED_CONFLICT'
    : input.bridge.missingExplicitAssignments.length
      ? 'NEEDS_EXPLICIT_PROFILE_ASSIGNMENT'
      : 'READY_FOR_HUMAN_REVIEW'

  return {
    version: AI_CANONICAL_PROFILE_ASSIGNMENT_HUMAN_REVIEW_VERSION,
    sourceBridgeVersion: input.bridge.version,
    sourceIntentId: input.bridge.sourceIntentId,
    status,
    rows,
    missingExplicitAssignments: [...input.bridge.missingExplicitAssignments],
    conflicts: [...new Set(conflicts)],
    warnings: [...new Set(warnings)],
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

export const AI05_3_5_STATE = Object.freeze({
  parent: 'AI05.3' as const,
  parentStatus: 'OPEN / WORKING' as const,
  step: 'AI05.3.5' as const,
  stepStatus: 'WORKING' as const,
  profileData03Status: 'OPEN / WORKING' as const,
  rtp01Status: 'WORKING' as const,
})

export const AI05_3_5_HUMAN_REVIEW_SAFETY = Object.freeze({
  readOnlyReviewOnly: true,
  explicitAssignmentsOnly: true,
  noProfileInference: true,
  noAssignmentEditing: true,
  automaticProfileSelectionAllowed: false,
  automaticSystemAssignmentAllowed: false,
  automaticGeometryAllowed: false,
  exactProfileContourApplied: false,
  rulesValidated: false,
  productionUnlockAllowed: false,
  machineReady: false,
  productionApproved: false,
})
