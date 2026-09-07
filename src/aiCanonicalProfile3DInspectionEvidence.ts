import { buildCanonicalProfileAssignmentHumanReview } from './aiCanonicalProfileAssignmentHumanReview'
import type {
  FacadeFlowCanonicalProfileAssignment,
  FacadeFlowCanonicalProfileAssignmentBridge,
} from './aiCanonicalProfileAssignmentBridge'
import type { Component3DNode, Component3DRole, Product3DScene } from './threeDTypes'

export const AI_CANONICAL_PROFILE_3D_INSPECTION_EVIDENCE_VERSION = 'AI05.3.8' as const

export type CanonicalProfile3DInspectionStatus =
  | 'READY_FOR_HUMAN_INSPECTION'
  | 'BLOCKED_CONFLICT'

export type CanonicalProfile3DInspectionPreservationState =
  | 'PRESERVED_ON_REAL_SCENE_NODES'
  | 'NODE_TRACE_MISSING_OR_MISMATCH'

export interface CanonicalProfile3DNodeEvidence {
  nodeId: string
  role: Component3DRole
  sourcePath: string
  profileCode?: string
  visualBoundsMm: {
    x: number
    y: number
    z: number
  }
  visualPositionMm: {
    x: number
    y: number
    z: number
  }
  visualBoundsOnly: true
  productionDimensionAvailable: false
  exactProfileContourAvailable: false
}

export interface CanonicalProfile3DInspectionRow {
  targetKind: FacadeFlowCanonicalProfileAssignment['targetKind']
  targetRef: string
  canonicalRole: FacadeFlowCanonicalProfileAssignment['role']
  expectedSceneRole: 'FRAME' | 'DIVIDER' | 'SASH'
  systemId: string
  systemLabel: string
  profileCode: string
  nodeIds: string[]
  nodeCount: number
  nodes: CanonicalProfile3DNodeEvidence[]
  preservationState: CanonicalProfile3DInspectionPreservationState
  assignmentAuthority: 'EXPLICIT_PRODUCT_INTENT_PROPAGATION_ONLY'
  sceneAuthority: 'AI05.3.7_REAL_HUMAN_REVIEWED_CONCEPTUAL_SCENE'
  readOnly: true
  humanInspectionRequired: true
  automaticProfileSelectionAllowed: false
  automaticGeometryAllowed: false
  exactProfileContourApplied: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

export interface CanonicalProfile3DInspectionEvidence {
  version: typeof AI_CANONICAL_PROFILE_3D_INSPECTION_EVIDENCE_VERSION
  sourceBridgeVersion: FacadeFlowCanonicalProfileAssignmentBridge['version']
  sourceIntentId: string
  sourceSceneId: string
  status: CanonicalProfile3DInspectionStatus
  rows: CanonicalProfile3DInspectionRow[]
  conflicts: string[]
  warnings: string[]
  inspectedNodeIds: string[]
  readOnly: true
  humanInspectionRequired: true
  visualBoundsOnly: true
  canEditAssignmentsInInspection: false
  canEditGeometryInInspection: false
  automaticProfileSelectionAllowed: false
  automaticSystemAssignmentAllowed: false
  automaticGeometryAllowed: false
  exactProfileContourApplied: false
  productionDeductionsApplied: false
  manufacturingToleranceApplied: false
  rulesValidated: false
  productionUnlockAllowed: false
  machineReady: false
  productionApproved: false
}

function unique(items: string[]) {
  return [...new Set(items)]
}

function expectedSceneRole(targetKind: FacadeFlowCanonicalProfileAssignment['targetKind']): 'FRAME' | 'DIVIDER' | 'SASH' {
  if (targetKind === 'FRAME') return 'FRAME'
  if (targetKind === 'MULLION') return 'DIVIDER'
  return 'SASH'
}

function nodeEvidence(node: Component3DNode): CanonicalProfile3DNodeEvidence {
  return {
    nodeId: node.id,
    role: node.role,
    sourcePath: node.sourcePath,
    profileCode: node.profileCode,
    visualBoundsMm: {
      x: node.dimensions.x,
      y: node.dimensions.y,
      z: node.dimensions.z,
    },
    visualPositionMm: {
      x: node.position.x,
      y: node.position.y,
      z: node.position.z,
    },
    visualBoundsOnly: true,
    productionDimensionAvailable: false,
    exactProfileContourAvailable: false,
  }
}

function rowFor(
  assignment: FacadeFlowCanonicalProfileAssignment,
  scene: Product3DScene,
  conflicts: string[],
): CanonicalProfile3DInspectionRow {
  const sceneRole = expectedSceneRole(assignment.targetKind)
  const nodes = scene.nodes.filter(
    (node) => node.role === sceneRole && node.sourcePath === assignment.targetRef,
  )
  const profilePreserved = nodes.length > 0
    && nodes.every((node) => node.profileCode === assignment.profileCode)

  if (!nodes.length) {
    conflicts.push(`${assignment.targetKind}:${assignment.targetRef} has no inspectable real 3D scene node.`)
  } else if (!profilePreserved) {
    conflicts.push(`${assignment.targetKind}:${assignment.targetRef} real 3D node profile trace does not preserve ${assignment.profileCode}.`)
  }

  return {
    targetKind: assignment.targetKind,
    targetRef: assignment.targetRef,
    canonicalRole: assignment.role,
    expectedSceneRole: sceneRole,
    systemId: assignment.canonicalIdentity.systemId,
    systemLabel: assignment.canonicalIdentity.systemLabel,
    profileCode: assignment.profileCode,
    nodeIds: nodes.map((node) => node.id),
    nodeCount: nodes.length,
    nodes: nodes.map(nodeEvidence),
    preservationState: profilePreserved
      ? 'PRESERVED_ON_REAL_SCENE_NODES'
      : 'NODE_TRACE_MISSING_OR_MISMATCH',
    assignmentAuthority: 'EXPLICIT_PRODUCT_INTENT_PROPAGATION_ONLY',
    sceneAuthority: 'AI05.3.7_REAL_HUMAN_REVIEWED_CONCEPTUAL_SCENE',
    readOnly: true,
    humanInspectionRequired: true,
    automaticProfileSelectionAllowed: false,
    automaticGeometryAllowed: false,
    exactProfileContourApplied: false,
    productionUnlockAllowed: false,
    machineReady: false,
    productionApproved: false,
  }
}

function assignmentKey(targetKind: string, targetRef: string) {
  return `${targetKind}:${targetRef}`
}

export function buildCanonicalProfile3DInspectionEvidence(input: {
  bridge: FacadeFlowCanonicalProfileAssignmentBridge
  scene: Product3DScene
}): CanonicalProfile3DInspectionEvidence {
  const conflicts = [...input.bridge.conflicts]
  const warnings = [...input.bridge.warnings]

  if (input.bridge.status !== 'READY_FOR_HUMAN_REVIEW') {
    conflicts.push(`AI05.3.4 canonical profile bridge is ${input.bridge.status}; 3D inspection is blocked.`)
  }
  if (input.bridge.missingExplicitAssignments.length) {
    conflicts.push('Explicit canonical profile assignments are still missing; 3D inspection is blocked.')
  }
  if (input.scene.sourceType !== 'HUMAN_REVIEWED_AI') {
    conflicts.push(`3D scene source type ${input.scene.sourceType} is not the AI05.3.7 human-reviewed conceptual scene.`)
  }
  if (!input.scene.conceptualOnly) {
    conflicts.push('3D scene is not marked conceptual-only.')
  }
  if (input.scene.productionGeometryApproved || input.scene.machineReady) {
    conflicts.push('3D scene unexpectedly carries production approval or machine-ready state.')
  }
  if (input.scene.sourceReference !== input.bridge.sourceIntentId) {
    conflicts.push('3D scene source reference does not match the canonical profile bridge Product Intent lineage.')
  }

  const endToEndReview = buildCanonicalProfileAssignmentHumanReview({
    bridge: input.bridge,
    scene: input.scene,
  })
  if (endToEndReview.status !== 'READY_FOR_HUMAN_REVIEW') {
    conflicts.push(...endToEndReview.conflicts)
    conflicts.push('AI05.3.5 end-to-end canonical profile review is not preserved on the real 3D scene.')
  }
  for (const row of endToEndReview.rows) {
    if (row.endToEndState !== 'PRESERVED_END_TO_END') {
      conflicts.push(`${row.targetKind}:${row.targetRef} is not preserved end-to-end before 3D inspection.`)
    }
  }

  const rows = input.bridge.assignments.map((assignment) => rowFor(assignment, input.scene, conflicts))
  const tracedNodeIds = new Set(rows.flatMap((row) => row.nodeIds))
  const tracedAssignmentKeys = new Set(
    input.bridge.assignments.map((assignment) => assignmentKey(assignment.targetKind, assignment.targetRef)),
  )

  for (const node of input.scene.nodes) {
    if (!node.profileCode || !['FRAME', 'DIVIDER', 'SASH'].includes(node.role)) continue
    if (!tracedNodeIds.has(node.id)) {
      conflicts.push(`${node.id} carries profile code ${node.profileCode} but is not covered by a canonical 3D inspection trace.`)
    }
  }

  const sceneBridge = input.scene.profileAssignmentBridge
  if (sceneBridge) {
    for (const assignment of sceneBridge.assignments) {
      const key = assignmentKey(assignment.targetKind, assignment.targetRef)
      if (!tracedAssignmentKeys.has(key)) {
        conflicts.push(`${key} exists in real 3D scene metadata without a source canonical assignment.`)
      }
    }
  }

  const inspectedNodeIds = rows.flatMap((row) => row.nodeIds)
  if (new Set(inspectedNodeIds).size !== inspectedNodeIds.length) {
    conflicts.push('A real 3D scene node is claimed by more than one canonical profile inspection row.')
  }

  return {
    version: AI_CANONICAL_PROFILE_3D_INSPECTION_EVIDENCE_VERSION,
    sourceBridgeVersion: input.bridge.version,
    sourceIntentId: input.bridge.sourceIntentId,
    sourceSceneId: input.scene.id,
    status: conflicts.length ? 'BLOCKED_CONFLICT' : 'READY_FOR_HUMAN_INSPECTION',
    rows,
    conflicts: unique(conflicts),
    warnings: unique(warnings),
    inspectedNodeIds: unique(inspectedNodeIds),
    readOnly: true,
    humanInspectionRequired: true,
    visualBoundsOnly: true,
    canEditAssignmentsInInspection: false,
    canEditGeometryInInspection: false,
    automaticProfileSelectionAllowed: false,
    automaticSystemAssignmentAllowed: false,
    automaticGeometryAllowed: false,
    exactProfileContourApplied: false,
    productionDeductionsApplied: false,
    manufacturingToleranceApplied: false,
    rulesValidated: false,
    productionUnlockAllowed: false,
    machineReady: false,
    productionApproved: false,
  }
}

export function canonicalProfile3DInspectionRowForNode(
  evidence: CanonicalProfile3DInspectionEvidence,
  nodeId: string | null,
): CanonicalProfile3DInspectionRow | null {
  if (!nodeId) return null
  return evidence.rows.find((row) => row.nodeIds.includes(nodeId)) ?? null
}

export const AI05_3_8_STATE = Object.freeze({
  parent: 'AI05.3' as const,
  parentStatus: 'OPEN / WORKING' as const,
  step: 'AI05.3.8' as const,
  stepStatus: 'WORKING' as const,
  profileData03Status: 'OPEN / WORKING' as const,
  rtp01Status: 'WORKING' as const,
})

export const AI05_3_8_3D_INSPECTION_SAFETY = Object.freeze({
  readOnlyInspectionOnly: true,
  realWebGlSceneOnly: true,
  humanReviewedConceptualSceneOnly: true,
  explicitAssignmentsOnly: true,
  visualBoundsOnly: true,
  noProfileInference: true,
  noAssignmentEditing: true,
  noGeometryEditing: true,
  automaticProfileSelectionAllowed: false,
  automaticSystemAssignmentAllowed: false,
  automaticGeometryAllowed: false,
  exactProfileContourApplied: false,
  productionDeductionsApplied: false,
  manufacturingToleranceApplied: false,
  rulesValidated: false,
  productionUnlockAllowed: false,
  machineReady: false,
  productionApproved: false,
})
